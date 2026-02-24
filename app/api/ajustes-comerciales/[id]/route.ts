/**
 * GET  /api/ajustes-comerciales/:id   — Detalle con métricas calculadas
 * PATCH /api/ajustes-comerciales/:id  — Actualiza campos del ajuste
 *
 * Campos actualizables via PATCH:
 *   tarifaOfertadaCliente   number   → calcula margenEfectivoOferta
 *   tarifaConfirmadaCliente number   → pasa a ACEPTADO si estaba en oferta
 *   pagoAlConductor         number   → calcula margenBrutoCop + margenBrutoPercent
 *   estadoNegociacion       string
 *   formaPago               string
 *   diasCredito             number
 *   motivoAjuste            string
 *   motivoRechazo           string
 *   notasComerciales        string
 *   nombreComercial         string
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/utils/logger'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const ajuste = await prisma.ajusteComercial.findUnique({
      where: { id },
      include: {
        solicitud: {
          select: { id: true, origen: true, destino: true, empresa: true, estado: true },
        },
        cotizacionBase: {
          select: {
            id: true, configVehiculo: true, distanciaKm: true,
            fleteReferencialSisetac: true, tarifaSugerida: true, margenAplicado: true,
            cvTotal: true, cfPorViaje: true, costoTecnicoBase: true,
          },
        },
      },
    })

    if (!ajuste) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const fleteRef = Number(ajuste.cotizacionBase.fleteReferencialSisetac)
    const confirmada = ajuste.tarifaConfirmadaCliente ? Number(ajuste.tarifaConfirmadaCliente) : null
    const pago = ajuste.pagoAlConductor ? Number(ajuste.pagoAlConductor) : null

    return NextResponse.json({
      ajuste: {
        ...ajuste,
        margenSimulado:           Number(ajuste.margenSimulado),
        tarifaOfertadaCliente:    ajuste.tarifaOfertadaCliente    ? Number(ajuste.tarifaOfertadaCliente)   : null,
        margenEfectivoOferta:     ajuste.margenEfectivoOferta     ? Number(ajuste.margenEfectivoOferta)    : null,
        tarifaConfirmadaCliente:  confirmada,
        pagoAlConductor:          pago,
        margenBrutoCop:           ajuste.margenBrutoCop           ? Number(ajuste.margenBrutoCop)          : null,
        margenBrutoPercent:       ajuste.margenBrutoPercent       ? Number(ajuste.margenBrutoPercent)      : null,
      },
      metricas: {
        fleteReferencialSisetac: fleteRef,
        diferenciaSisetac: confirmada ? confirmada - fleteRef : null,
        pctSobreSisetac:   confirmada ? (((confirmada - fleteRef) / fleteRef) * 100).toFixed(2) : null,
        margenBrutoReal:   (confirmada && pago) ? (((confirmada - pago) / confirmada) * 100).toFixed(2) : null,
      },
    })
  } catch (error) {
    logger.error('API GET /ajustes-comerciales/:id', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const existing = await prisma.ajusteComercial.findUnique({
      where: { id },
      include: { cotizacionBase: { select: { fleteReferencialSisetac: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const body = await request.json() as {
      tarifaOfertadaCliente?:   number
      tarifaConfirmadaCliente?: number
      pagoAlConductor?:         number
      estadoNegociacion?:       string
      formaPago?:               string
      diasCredito?:             number
      motivoAjuste?:            string
      motivoRechazo?:           string
      notasComerciales?:        string
      nombreComercial?:         string
    }

    // M-3: audit trail — capturar userId de Clerk
    const { userId } = await auth()

    const fleteRef = Number(existing.cotizacionBase.fleteReferencialSisetac)

    // Calcular margenEfectivoOferta si cambia la oferta
    let margenEfectivoOferta: number | undefined
    if (body.tarifaOfertadaCliente !== undefined) {
      margenEfectivoOferta = parseFloat(
        (((body.tarifaOfertadaCliente - fleteRef) / fleteRef) * 100).toFixed(2),
      )
    }

    // Calcular margen bruto si cambia confirmada o pago al conductor
    const confirmada = body.tarifaConfirmadaCliente ?? (existing.tarifaConfirmadaCliente ? Number(existing.tarifaConfirmadaCliente) : null)
    const pago       = body.pagoAlConductor         ?? (existing.pagoAlConductor         ? Number(existing.pagoAlConductor)         : null)

    let margenBrutoCop:     number | undefined
    let margenBrutoPercent: number | undefined
    if (confirmada !== null && pago !== null) {
      margenBrutoCop     = Math.round(confirmada - pago)
      margenBrutoPercent = parseFloat(((margenBrutoCop / confirmada) * 100).toFixed(2))
    }

    // Auto-avanzar estado si se confirma tarifa
    let estadoAuto = body.estadoNegociacion
    if (body.tarifaConfirmadaCliente !== undefined && !body.estadoNegociacion) {
      const estadoActual = existing.estadoNegociacion
      if (['BORRADOR', 'EN_OFERTA', 'EN_NEGOCIACION'].includes(estadoActual)) {
        estadoAuto = 'ACEPTADO'
      }
    }

    // Actualizar Solicitud.estado si se pasa a ACEPTADO o CERRADO
    const updateData: Record<string, unknown> = {
      ...(body.tarifaOfertadaCliente   !== undefined && { tarifaOfertadaCliente: body.tarifaOfertadaCliente }),
      ...(margenEfectivoOferta         !== undefined && { margenEfectivoOferta }),
      ...(body.tarifaConfirmadaCliente !== undefined && { tarifaConfirmadaCliente: body.tarifaConfirmadaCliente, fechaAceptacion: new Date() }),
      ...(body.pagoAlConductor         !== undefined && { pagoAlConductor: body.pagoAlConductor }),
      ...(margenBrutoCop               !== undefined && { margenBrutoCop }),
      ...(margenBrutoPercent           !== undefined && { margenBrutoPercent }),
      ...(estadoAuto                                 && { estadoNegociacion: estadoAuto }),
      ...(body.formaPago               !== undefined && { formaPago: body.formaPago }),
      ...(body.diasCredito             !== undefined && { diasCredito: body.diasCredito }),
      ...(body.motivoAjuste            !== undefined && { motivoAjuste: body.motivoAjuste }),
      ...(body.motivoRechazo           !== undefined && { motivoRechazo: body.motivoRechazo }),
      ...(body.notasComerciales        !== undefined && { notasComerciales: body.notasComerciales }),
      ...(body.nombreComercial         !== undefined && { nombreComercial: body.nombreComercial }),
      modificadoPor: userId ?? null,   // M-3: audit trail — quién modificó el registro
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ajuste = await tx.ajusteComercial.update({ where: { id }, data: updateData })

      // Sincronizar estado solicitud
      if (estadoAuto === 'ACEPTADO') {
        await tx.solicitud.update({
          where: { id: existing.solicitudId },
          data: { estado: 'COTIZADO' },
        })
      } else if (estadoAuto === 'CERRADO') {
        await tx.solicitud.update({
          where: { id: existing.solicitudId },
          data: { estado: 'CERRADO' },
        })
      }

      return ajuste
    })

    return NextResponse.json({ ajuste: updated })
  } catch (error) {
    logger.error('API PATCH /ajustes-comerciales/:id', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
