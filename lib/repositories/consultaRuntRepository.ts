/**
 * Repositorio para operaciones de lectura sobre la entidad ConsultaRunt.
 *
 * ConsultaRunt es un log append-only de cada consulta realizada al RUNT.
 * NUNCA se actualiza ni elimina un registro de esta tabla.
 *
 * Responsabilidades:
 * - Registrar cada consulta RUNT (conductor o vehículo)
 * - Consultar historial de consultas por identificador o usuario
 *
 * @module ConsultaRuntRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { ConsultaRunt, TipoConsultaRunt, Prisma } from '@prisma/client';

export class ConsultaRuntRepository {
  /**
   * Registra una nueva consulta al RUNT. Operación append-only.
   *
   * @param data - Datos completos de la consulta RUNT
   * @returns El registro creado con su ID asignado
   */
  async registrar(data: Prisma.ConsultaRuntCreateInput): Promise<ConsultaRunt> {
    return prisma.consultaRunt.create({ data });
  }

  /**
   * Obtiene el historial de consultas RUNT para un identificador específico.
   *
   * @param tipo - Tipo de consulta: CONDUCTOR o VEHICULO
   * @param identificador - Cédula o placa consultada
   * @returns Array de consultas ordenadas descendentemente por fecha
   */
  async findByIdentificador(
    tipo: TipoConsultaRunt,
    identificador: string
  ): Promise<ConsultaRunt[]> {
    return prisma.consultaRunt.findMany({
      where: { tipo, identificador },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene la consulta RUNT más reciente para un identificador.
   * Útil para saber si el snapshot está vigente.
   *
   * @param tipo - Tipo de consulta: CONDUCTOR o VEHICULO
   * @param identificador - Cédula o placa consultada
   * @returns La consulta más reciente o null si nunca se consultó
   */
  async findUltima(
    tipo: TipoConsultaRunt,
    identificador: string
  ): Promise<ConsultaRunt | null> {
    return prisma.consultaRunt.findFirst({
      where: { tipo, identificador },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista consultas con paginación y filtros.
   *
   * @param filters - Filtros opcionales y paginación
   * @returns Lista paginada con total de registros
   */
  async findAll(
    filters: {
      tipo?: TipoConsultaRunt;
      realizadaPor?: string;
      desde?: Date;
      hasta?: Date;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ data: ConsultaRunt[]; total: number }> {
    const { page = 1, pageSize = 50, ...rest } = filters;
    const where: Prisma.ConsultaRuntWhereInput = {};

    if (rest.tipo) where.tipo = rest.tipo;
    if (rest.realizadaPor) where.realizadaPor = rest.realizadaPor;
    if (rest.desde || rest.hasta) {
      where.createdAt = {
        ...(rest.desde && { gte: rest.desde }),
        ...(rest.hasta && { lte: rest.hasta }),
      };
    }

    const [data, total] = await Promise.all([
      prisma.consultaRunt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.consultaRunt.count({ where }),
    ]);

    return { data, total };
  }
}

/** Singleton exportado para uso en servicios */
export const consultaRuntRepository = new ConsultaRuntRepository();
