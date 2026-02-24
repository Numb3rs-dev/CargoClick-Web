/**
 * GET /api/solicitudes/:id/cotizaciones
 *
 * Lista TODAS las cotizaciones (simulaciones) de una solicitud,
 * ordenadas de más reciente a más antigua.
 * Permite al comercial comparar distintas configuraciones de vehículo y margen.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/utils/logger'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
      select: { id: true, estado: true },
    })

    if (!solicitud) {
      return NextResponse.json(
        { error: 'SOLICITUD_NOT_FOUND', message: 'Solicitud no encontrada' },
        { status: 404 },
      )
    }

    const cotizaciones = await prisma.cotizacion.findMany({
      where: { solicitudId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        ajustesComerciales: {
          select: { id: true, estadoNegociacion: true, tarifaOfertadaCliente: true },
          take: 1,
        },
      },
    })

    const data = cotizaciones.map((c) => ({
      id:                     c.id,
      configVehiculo:         c.configVehiculo,
      distanciaKm:            c.distanciaKm,
      cvTotal:                Number(c.cvTotal),
      cfPorViaje:             Number(c.cfPorViaje),
      costoTecnicoBase:       Number(c.costoTecnicoBase),
      fleteReferencialSisetac: Number(c.fleteReferencialSisetac),
      margenAplicado:         Number(c.margenAplicado),
      tarifaSugerida:         Number(c.tarifaSugerida),
      tarifaPorKm:            Math.round(Number(c.tarifaSugerida) / c.distanciaKm),
      tarifaPorTon:           Math.round(
        Number(c.tarifaSugerida) / ((c as { parametrosUsados?: { pesoKg?: number } }).parametrosUsados as { pesoKg?: number } | null)?.pesoKg! * 1000 || 1,
      ),
      estado:                 c.estado,
      validezHasta:           c.validezHasta,
      createdAt:              c.createdAt,
      tieneAjuste:            c.ajustesComerciales.length > 0,
      estadoAjuste:           c.ajustesComerciales[0]?.estadoNegociacion ?? null,
      // ── Referencia de mercado RNDC (null si no había datos al cotizar)
      rndcEstimado:           c.rndcEstimado    ? Number(c.rndcEstimado)  : null,
      rndcMediana:            c.rndcMediana     ? Number(c.rndcMediana)   : null,
      rndcConfianza:          c.rndcConfianza   ?? null,
      rndcNivelFallback:      c.rndcNivelFallback ?? null,
      rndcViajesSimilares:    c.rndcViajesSimilares ?? null,
    }))

    return NextResponse.json({
      solicitudId: id,
      total: cotizaciones.length,
      cotizaciones: data,
    })
  } catch (error) {
    logger.error('API GET /solicitudes/:id/cotizaciones', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Error al obtener cotizaciones' },
      { status: 500 },
    )
  }
}
