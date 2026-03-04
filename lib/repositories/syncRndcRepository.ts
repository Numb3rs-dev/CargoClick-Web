/**
 * Repositorio para operaciones sobre la entidad SyncRndc.
 *
 * SyncRndc es un log de auditoría APPEND-ONLY de cada llamada SOAP al RNDC.
 * NUNCA se actualiza ni elimina un registro de esta tabla.
 * La contraseña NUNCA se guarda — se enmascara con *** en requestXml.
 *
 * Responsabilidades:
 * - Registrar cada llamada SOAP al RNDC (procesoids 3/4/5/6/11/12/32)
 * - Consultar historial para debugging y trazabilidad
 * - Paginación con $transaction([findMany, count])
 *
 * @module SyncRndcRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { SyncRndc, Prisma } from '@prisma/client';

export class SyncRndcRepository {
  /**
   * Registra una nueva llamada SOAP al RNDC. Operación INSERT únicamente.
   *
   * CRÍTICO: El requestXml NUNCA debe contener la contraseña real.
   * El llamador debe reemplazar <clave>REAL</clave> → <clave>***</clave>
   * antes de llamar a este método.
   *
   * @param data - Datos del registro RNDC (sin campo id — se genera automáticamente)
   * @returns El registro creado con su ID asignado
   */
  async registrar(data: Omit<Prisma.SyncRndcCreateInput, 'id'>): Promise<SyncRndc> {
    return prisma.syncRndc.create({ data });
  }

  /**
   * Busca un registro de SyncRndc por su ID.
   * Útil para retornar syncRndcId al frontend en errores RNDC (HTTP 502).
   *
   * @param id - ID del registro SyncRndc
   * @returns El registro encontrado o null si no existe
   */
  async findById(id: string): Promise<SyncRndc | null> {
    return prisma.syncRndc.findUnique({ where: { id } });
  }

  /**
   * Lista registros SyncRndc con paginación y filtros.
   * Usa $transaction para garantizar consistencia entre count y findMany.
   *
   * @param filters - Filtros opcionales y parámetros de paginación
   * @returns Objeto con array de registros y total
   */
  async findAll(
    filters: {
      processId?: number;
      exitoso?: boolean;
      /** Tipo de entidad: "Remesa" | "ManifiestoOperativo" | "Conductor" | "Vehiculo" */
      entidadTipo?: string;
      desde?: Date;
      hasta?: Date;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ data: SyncRndc[]; total: number }> {
    const { page = 1, pageSize = 50, ...rest } = filters;
    const where: Prisma.SyncRndcWhereInput = {};

    if (rest.processId !== undefined) where.processId = rest.processId;
    if (rest.exitoso !== undefined) where.exitoso = rest.exitoso;
    if (rest.entidadTipo) where.entidadTipo = rest.entidadTipo;
    if (rest.desde || rest.hasta) {
      where.createdAt = {
        ...(rest.desde && { gte: rest.desde }),
        ...(rest.hasta && { lte: rest.hasta }),
      };
    }

    const [data, total] = await Promise.all([
      prisma.syncRndc.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.syncRndc.count({ where }),
    ]);

    return { data, total };
  }
}

/** Singleton exportado para uso en servicios */
export const syncRndcRepository = new SyncRndcRepository();
