/**
 * POST /api/solicitudes/:id/cotizar
 *
 * Genera una cotización para una solicitud existente.
 * Soporta dos fases del flujo del wizard:
 *
 *   fase = 'sisetac' (default)
 *     Calcula la tarifa SISETAC, crea el registro de cotización y actualiza
 *     el estado de la solicitud a COTIZADO. Los campos RNDC quedan en null.
 *
 *   fase = 'rndc'
 *     Busca la cotización existente de la solicitud, consulta el histórico RNDC
 *     de manifiestos y actualiza los campos rndc* en la cotización.
 *
 * Body (todos opcionales):
 *   fase?:          'sisetac' | 'rndc'  — default: 'sisetac'
 *   configVehiculo?: 'C2'|'C3'|'C2S2'|'C2S3'|'C3S2'|'C3S3'  (solo con fase sisetac)
 *   margen?:         number  — % de margen sobre el piso SISETAC (override del commercial_params)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { calcularCotizacion, type ConfigVehiculo } from '@/lib/services/cotizadorEngine'
import { consultarRndc } from '@/lib/services/rndcEngine'
import { getNombreMunicipio } from '@/app/cotizar/config/colombia-dane'

// ─────────────────────────────────────────────────────────────
// POST /api/solicitudes/[id]/cotizar
// ─────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    // 1. Cargar la solicitud
    const solicitud = await prisma.solicitud.findUnique({ where: { id } })

    if (!solicitud) {
      return NextResponse.json({ error: 'SOLICITUD_NOT_FOUND', message: 'Solicitud no encontrada' }, { status: 404 })
    }

    // 2. Validaciones mínimas
    if (!solicitud.distanciaKm || solicitud.distanciaKm <= 0) {
      return NextResponse.json({ error: 'MISSING_ROUTE_DATA', message: 'La solicitud no tiene distanciaKm calculada' }, { status: 400 })
    }

    if (!solicitud.pesoKg || Number(solicitud.pesoKg) <= 0) {
      return NextResponse.json({ error: 'MISSING_PESO', message: 'La solicitud no tiene pesoKg válido' }, { status: 400 })
    }

    if (!solicitud.origen || !solicitud.destino) {
      return NextResponse.json({ error: 'MISSING_ROUTE_DATA', message: 'Faltan origen o destino en la solicitud' }, { status: 400 })
    }

    // 3. Leer overrides opcionales del body
    let body: { configVehiculo?: ConfigVehiculo; margen?: number; fase?: 'sisetac' | 'rndc' } = {}
    try {
      const text = await request.text()
      if (text.trim()) body = JSON.parse(text)
    } catch {
      // body vacío — OK
    }

    // ── Fase RNDC: actualizar cotización existente con datos de manifiestos ──
    if (body.fase === 'rndc') {
      const cotizacionExistente = await prisma.cotizacion.findFirst({
        where: { solicitudId: id },
        orderBy: { createdAt: 'desc' },
      })

      if (!cotizacionExistente) {
        // No hay cotización previa → responder sin error, el cliente puede reintentar
        return NextResponse.json(
          { error: 'COTIZACION_NOT_FOUND', message: 'Aún no existe cotización SISETAC para actualizar con RNDC' },
          { status: 404 },
        )
      }

      // Traducir códigos DANE a nombres de ciudad para el motor RNDC
      const origenNombre = getNombreMunicipio(solicitud.origen) || solicitud.origen
      const destinoNombre = getNombreMunicipio(solicitud.destino!) || solicitud.destino!

      const rndcResultado = await consultarRndc(
        origenNombre,
        destinoNombre,
        Number(solicitud.pesoKg),
      ).catch(() => null)

      if (rndcResultado) {
        await prisma.cotizacion.update({
          where: { id: cotizacionExistente.id },
          data: {
            rndcEstimado:        rndcResultado.estimado,
            rndcMediana:         rndcResultado.mediana,
            rndcConfianza:       rndcResultado.confianza,
            rndcViajesSimilares: rndcResultado.viajesSimilares,
            rndcNivelFallback:   rndcResultado.nivelFallback,
          },
        })
      }

      return NextResponse.json({
        cotizacionId: cotizacionExistente.id,
        solicitudId:  id,
        referenciaRndc: rndcResultado ? {
          estimado:        rndcResultado.estimado,
          mediana:         rndcResultado.mediana,
          confianza:       rndcResultado.confianza,
          nivelFallback:   rndcResultado.nivelFallback,
          nivelLabel:      rndcResultado.nivelLabel,
          viajesSimilares: rndcResultado.viajesSimilares,
        } : null,
      }, { status: 200 })
    }

    // ── Fase SISETAC (default): calcular tarifa y crear cotización ────────────

    // 4. Calcular cotización
    const resultado = await calcularCotizacion({
      distanciaKm:            solicitud.distanciaKm,
      pesoKg:                 Number(solicitud.pesoKg),
      tipoCarga:              solicitud.tipoCarga,
      fechaRequerida:         solicitud.fechaRequerida,
      origen:                 solicitud.origen,
      destino:                solicitud.destino!,
      configVehiculoOverride: body.configVehiculo,
      margenOverride:         body.margen,
    })

    const validezHasta = new Date()
    validezHasta.setHours(validezHasta.getHours() + 48)

    const [cotizacion] = await prisma.$transaction([
      // 5a. Crear registro de cotización (RNDC se actualizará en fase 'rndc')
      prisma.cotizacion.create({
        data: {
          solicitudId:             id,
          periodoParametros:       resultado.parametrosUsados.periodoParams,
          configVehiculo:          resultado.configVehiculo,
          distanciaKm:             resultado.distanciaKm,
          cvTotal:                 resultado.cvTotal,
          cfPorViaje:              resultado.cfPorViaje,
          costoTecnicoBase:        resultado.costoTecnicoBase,
          fleteReferencialSisetac: resultado.fleteReferencialSisetac,
          tarifaSugerida:          resultado.tarifaSugerida,
          margenAplicado:          resultado.margenAplicado,
          desgloseCv:              resultado.desgloseCv as object,
          desgloseCf:              resultado.desgloseCf as object,
          parametrosUsados:        resultado.parametrosUsados as object,
          estado:                  'VIGENTE',
          validezHasta,
          // RNDC se llenará en la fase 'rndc' (paso 5 del wizard)
          rndcEstimado:        null,
          rndcMediana:         null,
          rndcConfianza:       null,
          rndcViajesSimilares: null,
          rndcNivelFallback:   null,
        },
      }),
      // 5b. Actualizar estado de la solicitud
      prisma.solicitud.update({
        where: { id },
        data:  { estado: 'COTIZADO' },
      }),
    ])

    // 6. Construir respuesta
    const pesoKg = Number(solicitud.pesoKg)
    const configUsada = resultado.configVehiculo

    return NextResponse.json({
      cotizacionId: cotizacion.id,
      solicitudId:  id,
      fechaGeneracion: cotizacion.createdAt,
      validezHasta,

      // RNDC se calcula de forma asíncrona en la fase siguiente
      referenciaRndc: null,

      // ── Resumen ejecutivo ──────────────────────────────
      resumen: {
        configVehiculo:            configUsada,
        configInferida:            !body.configVehiculo,  // true = engine eligió la config
        distanciaKm:               resultado.distanciaKm,
        costosVariables:           resultado.cvTotal,
        costosFijos:               resultado.cfPorViaje,
        costosTotales:             resultado.costoTecnicoBase,
        fleteReferencialSisetac:   resultado.fleteReferencialSisetac,
        margenAplicado:            `${resultado.margenAplicado}%`,
        tarifaSugerida:            resultado.tarifaSugerida,
        tarifaPorKm:               Math.round(resultado.tarifaSugerida / resultado.distanciaKm),
        tarifaPorTon:              pesoKg > 0 ? Math.round(resultado.tarifaSugerida / (pesoKg / 1000)) : null,
      },

      // ── Desglose costos variables (CV) ─────────────────
      costosVariables: {
        combustible:   resultado.desgloseCv.combustible,
        peajes:        resultado.desgloseCv.peajes,
        llantas:       resultado.desgloseCv.llantas,
        lubricantes:   resultado.desgloseCv.lubricantes,
        filtros:       resultado.desgloseCv.filtros,
        lavadoEngrase: resultado.desgloseCv.lavadoEngrase,
        mantenimiento: resultado.desgloseCv.mantenimiento,
        imprevistos:   resultado.desgloseCv.imprevistos,
        total:         resultado.desgloseCv.total,
      },

      // ── Desglose costos fijos (CF) ─────────────────────
      costosFijos: {
        capital:         resultado.desgloseCf.capital,
        salarios:        resultado.desgloseCf.salarios,
        seguros:         resultado.desgloseCf.seguros,
        impuestosVeh:    resultado.desgloseCf.impuestos,
        parqueadero:     resultado.desgloseCf.parqueadero,
        comunicaciones:  resultado.desgloseCf.comunicaciones,
        rtm:             resultado.desgloseCf.rtm,
        totalMensual:    resultado.desgloseCf.totalMes,
        viajesMes:       resultado.desgloseCf.viajesMes,
        porViaje:        resultado.desgloseCf.porViaje,
      },

      // ── Trazabilidad de parámetros ─────────────────────
      parametrosUsados: {
        periodoParams:       resultado.parametrosUsados.periodoParams,
        acpmCopGal:          resultado.parametrosUsados.acpmCopGal,
        smlmv:               resultado.parametrosUsados.smlmv,
        interesMensualBr:    resultado.parametrosUsados.interesMensualBr,
        valorVehiculoCop:    resultado.parametrosUsados.valorVehiculoCop,
        viajesMes:           resultado.parametrosUsados.viajesMesSimulados,
        velocidadPromKmH:    resultado.parametrosUsados.velocidadPromKmH,
        distribucionTerreno: resultado.parametrosUsados.distribucionTerreno,
        fuenteTerreno:       resultado.parametrosUsados.fuenteTerreno,
        fuentePeajes:        resultado.parametrosUsados.fuentePeajes,
        metodologia:         resultado.parametrosUsados.metodologia,
      },

      // ── Datos del cliente ──────────────────────────────
      cliente: {
        empresa:       solicitud.empresa,
        contacto:      solicitud.contacto,
        origen:        solicitud.origen,
        destino:       solicitud.destino,
        tipoCarga:     solicitud.tipoCarga,
        pesoKg,
        fechaServicio: solicitud.fechaRequerida,
      },
    }, { status: 201 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado'

    // Errores de negocio conocidos (código prefix)
    const conocidos = ['PARAMS_NOT_FOUND', 'VEHICLE_PARAMS_NOT_FOUND', 'CALC_ERROR']
    if (conocidos.some(c => message.startsWith(c))) {
      return NextResponse.json({ error: message.split(':')[0], message }, { status: 422 })
    }

    console.error('[cotizar] Error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/solicitudes/[id]/cotizar — devuelve la última cotización
// ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const cotizacion = await prisma.cotizacion.findFirst({
    where: { solicitudId: id },
    orderBy: { createdAt: 'desc' },
  })

  if (!cotizacion) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'No hay cotizaciones para esta solicitud' }, { status: 404 })
  }

  return NextResponse.json({ data: cotizacion })
}
