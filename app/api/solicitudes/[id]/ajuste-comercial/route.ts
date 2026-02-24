/**
 * POST /api/solicitudes/:id/ajuste-comercial
 *
 * Crea un AjusteComercial vinculado a la cotización base más reciente (o la que se especifique).
 * Si ya existe uno activo (no CANCELADO/RECHAZADO), lo devuelve sin crear uno nuevo.
 *
 * Body:
 *   cotizacionBaseId?  string   — ID de la cotización a usar como base (default: la más reciente)
 *   vehiculoUsado      string   — C2 | C3 | C2S2 | C2S3 | C3S2 | C3S3
 *   margenSimulado     number   — % de margen que se aplicó en esa cotización
 *   nombreComercial?   string
 *
 * GET /api/solicitudes/:id/ajuste-comercial
 *
 * Devuelve el AjusteComercial activo de la solicitud (si existe).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/utils/logger'
import { auth } from '@clerk/nextjs/server'

const ESTADOS_TERMINALES = ['CANCELADO', 'RECHAZADO']

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const ajuste = await prisma.ajusteComercial.findFirst({
      where: {
        solicitudId: id,
        NOT: { estadoNegociacion: { in: ESTADOS_TERMINALES } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        cotizacionBase: {
          select: {
            id: true,
            configVehiculo: true,
            fleteReferencialSisetac: true,
            tarifaSugerida: true,
            margenAplicado: true,
          },
        },
      },
    })

    if (!ajuste) {
      return NextResponse.json({ ajuste: null })
    }

    return NextResponse.json({ ajuste: formatAjuste(ajuste) })
  } catch (error) {
    logger.error('API GET /solicitudes/:id/ajuste-comercial', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    // Verificar que la solicitud existe
    const solicitud = await prisma.solicitud.findUnique({ where: { id }, select: { id: true } })
    if (!solicitud) {
      return NextResponse.json({ error: 'SOLICITUD_NOT_FOUND' }, { status: 404 })
    }

    const body = await request.json() as {
      cotizacionBaseId?: string
      vehiculoUsado: string
      margenSimulado: number
      nombreComercial?: string
    }

    // M-3: audit trail — capturar userId de Clerk
    const { userId } = await auth()

    if (!body.vehiculoUsado) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'vehiculoUsado es requerido' }, { status: 400 })
    }

    // Verificar que no haya ya uno activo
    const existing = await prisma.ajusteComercial.findFirst({
      where: {
        solicitudId: id,
        NOT: { estadoNegociacion: { in: ESTADOS_TERMINALES } },
      },
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Ya existe un ajuste activo', ajuste: formatAjuste(existing) },
        { status: 200 },
      )
    }

    // Obtener cotización base
    let cotizacionId = body.cotizacionBaseId
    if (!cotizacionId) {
      const ultima = await prisma.cotizacion.findFirst({
        where: { solicitudId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
      if (!ultima) {
        return NextResponse.json(
          { error: 'NO_COTIZACION', message: 'La solicitud no tiene cotizaciones. Ejecuta primero POST /cotizar' },
          { status: 400 },
        )
      }
      cotizacionId = ultima.id
    }

    const ajuste = await prisma.ajusteComercial.create({
      data: {
        solicitudId:      id,
        cotizacionBaseId: cotizacionId,
        vehiculoUsado:    body.vehiculoUsado,
        margenSimulado:   body.margenSimulado ?? 20,
        nombreComercial:  body.nombreComercial ?? null,
        estadoNegociacion: 'BORRADOR',
        creadoPor:        userId ?? null,   // M-3: audit trail
      },
      include: {
        cotizacionBase: {
          select: {
            id: true, configVehiculo: true,
            fleteReferencialSisetac: true, tarifaSugerida: true, margenAplicado: true,
          },
        },
      },
    })

    return NextResponse.json({ ajuste: formatAjuste(ajuste) }, { status: 201 })
  } catch (error) {
    logger.error('API POST /solicitudes/:id/ajuste-comercial', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── Helper formatter ───────────────────────────────────────
function formatAjuste(a: Record<string, unknown>) {
  return {
    ...a,
    margenSimulado:           Number((a.margenSimulado as string | number) ?? 0),
    tarifaOfertadaCliente:    a.tarifaOfertadaCliente    ? Number(a.tarifaOfertadaCliente)    : null,
    margenEfectivoOferta:     a.margenEfectivoOferta     ? Number(a.margenEfectivoOferta)     : null,
    tarifaConfirmadaCliente:  a.tarifaConfirmadaCliente  ? Number(a.tarifaConfirmadaCliente)  : null,
    pagoAlConductor:          a.pagoAlConductor          ? Number(a.pagoAlConductor)          : null,
    margenBrutoCop:           a.margenBrutoCop           ? Number(a.margenBrutoCop)           : null,
    margenBrutoPercent:       a.margenBrutoPercent       ? Number(a.margenBrutoPercent)       : null,
  }
}
