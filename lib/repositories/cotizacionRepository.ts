/**
 * Repositorio para consultas de parámetros de cotización SISETAC
 *
 * Centraliza el acceso a las tablas de parámetros del motor de cotización,
 * desacoplando a cotizadorEngine.ts de Prisma directamente.
 *
 * Tablas gestionadas:
 * - monthly_params  — parámetros económicos mensuales (ACPM, SMLMV, etc.)
 * - vehicle_params  — parámetros técnicos por tipo de vehículo y año
 * - commercial_params — configuración comercial (margen, redondeo, validez)
 * - route_terrain   — distribución de terreno por corredor origen-destino
 *
 * @module CotizacionRepository
 */

import { prisma } from '@/lib/db/prisma'
import type { MonthlyParams, VehicleParams, CommercialParams, RouteTerrain } from '.prisma/client'

export class CotizacionRepository {
  /**
   * Obtiene los parámetros económicos del período solicitado o los más recientes disponibles.
   *
   * @param periodoYyyyMm - Período en formato YYYYMM (ej: 202603)
   * @returns Parámetros del período o del período más cercano, null si no hay datos
   */
  async obtenerParametrosMensuales(periodoYyyyMm: number): Promise<MonthlyParams | null> {
    let params = await prisma.monthlyParams.findUnique({ where: { periodoYyyyMm } })
    if (!params) {
      // Fallback al período más reciente disponible
      params = await prisma.monthlyParams.findFirst({ orderBy: { periodoYyyyMm: 'desc' } })
    }
    return params
  }

  /**
   * Obtiene los parámetros técnicos del vehículo para la configuración y año dados,
   * con fallback al año más reciente disponible para esa configuración.
   *
   * @param configId - Configuración vehicular (C2, C3, C2S2, C2S3, C3S2, C3S3)
   * @param ano - Año del vehículo
   * @returns Parámetros del vehículo o null si la configuración no existe
   */
  async obtenerParametrosVehiculo(configId: string, ano: number): Promise<VehicleParams | null> {
    let params = await prisma.vehicleParams.findUnique({
      where: { configId_ano: { configId, ano } },
    })
    if (!params) {
      // Fallback al año más reciente disponible para esa configuración
      params = await prisma.vehicleParams.findFirst({
        where: { configId },
        orderBy: { ano: 'desc' },
      })
    }
    return params
  }

  /**
   * Obtiene los parámetros comerciales vigentes (activos, ordenados por vigencia descendente).
   *
   * @returns Parámetros comerciales activos o null si no hay configuración
   */
  async obtenerParametrosComerciales(): Promise<CommercialParams | null> {
    return await prisma.commercialParams.findFirst({
      where: { activo: true },
      orderBy: { vigenciaDesde: 'desc' },
    })
  }

  /**
   * Busca la distribución de terreno para un corredor de ruta (bidireccional).
   *
   * @param origenDane - Código DANE del municipio de origen
   * @param destinoDane - Código DANE del municipio de destino
   * @returns Datos del corredor o null si no hay tabla para esa ruta
   */
  async obtenerCorredorRuta(origenDane: string, destinoDane: string): Promise<RouteTerrain | null> {
    return await prisma.routeTerrain.findFirst({
      where: {
        OR: [
          { origenDane, destinoDane },
          { origenDane: destinoDane, destinoDane: origenDane },
        ],
      },
    })
  }
}

export const cotizacionRepository = new CotizacionRepository()
