/**
 * POST /api/solicitudes/:id/cotizar
 *
 * Genera una cotización SISETAC para una solicitud existente.
 * Guarda el resultado en la tabla `cotizaciones` y actualiza el estado
 * de la solicitud a COTIZADO.
 *
 * Body (todos opcionales):
 *   configVehiculo?: 'C2'|'C3'|'C2S2'|'C2S3'|'C3S2'|'C3S3'
 *   margen?: number  — % de margen sobre el piso SISETAC (override del commercial_params)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { calcularCotizacion, inferirConfigVehiculo, type ConfigVehiculo } from '@/lib/services/cotizadorEngine'
import { consultarRndc } from '@/lib/services/rndcEngine'
import { logger } from '@/lib/utils/logger'

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
    let body: { configVehiculo?: ConfigVehiculo; margen?: number } = {}
    try {
      const text = await request.text()
      if (text.trim()) body = JSON.parse(text)
    } catch {
      // body vacío — OK
    }

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

    // 5. Consultar histórico RNDC en paralelo con la preparación de la transacción
    const validezHasta = new Date()
    validezHasta.setHours(validezHasta.getHours() + 48)

    const rndcResultado = await consultarRndc(
      solicitud.origen,
      solicitud.destino!,
      Number(solicitud.pesoKg),
    ).catch(() => null) // RNDC es best-effort — nunca bloquea la cotización SISETAC

    const [cotizacion] = await prisma.$transaction([
      // 5a. Crear registro de cotización
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
          // ── Referencia de mercado RNDC (null si no hay datos suficientes)
          rndcEstimado:            rndcResultado?.estimado        ?? null,
          rndcMediana:             rndcResultado?.mediana         ?? null,
          rndcConfianza:           rndcResultado?.confianza       ?? null,
          rndcViajesSimilares:     rndcResultado?.viajesSimilares ?? null,
          rndcNivelFallback:       rndcResultado?.nivelFallback   ?? null,
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

      // ── Referencia de mercado RNDC ──────────────────────
      referenciaRndc: rndcResultado ? {
        estimado:        rndcResultado.estimado,
        mediana:         rndcResultado.mediana,
        confianza:       rndcResultado.confianza,
        nivelFallback:   rndcResultado.nivelFallback,
        nivelLabel:      rndcResultado.nivelLabel,
        viajesSimilares: rndcResultado.viajesSimilares,
      } : null,

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
