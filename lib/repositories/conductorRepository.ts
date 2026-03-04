/**
 * Repositorio para operaciones CRUD sobre la entidad Conductor.
 *
 * Responsabilidades:
 * - Abstracción de Prisma ORM para la tabla `conductores`
 * - Operaciones de lectura/escritura con filtros y paginación
 * - Actualización de snapshot RUNT
 *
 * NO incluye:
 * - Lógica de negocio (va en ConductorService)
 * - Validaciones (va en schemas Zod)
 * - Llamadas al RNDC (va en rndcClient)
 *
 * @module ConductorRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { Conductor, Prisma } from '@prisma/client';

export class ConductorRepository {
  /**
   * Busca un conductor por su número de cédula.
   *
   * @param cedula - Número de cédula del conductor
   * @returns El conductor encontrado o null si no existe
   */
  async findByCedula(cedula: string): Promise<Conductor | null> {
    return prisma.conductor.findUnique({ where: { cedula } });
  }

  /**
   * Lista conductores con filtros opcionales y paginación.
   *
   * @param filters - Filtros opcionales: activo, búsqueda por texto, page, pageSize
   * @returns { data, total } paginados
   */
  async findAll(
    filters: {
      activo?: boolean;
      /** Busca en cédula, nombres y apellidos (case-insensitive) */
      q?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ data: Conductor[]; total: number }> {
    const { page = 1, pageSize = 20, ...rest } = filters;
    const where: Prisma.ConductorWhereInput = {};
    if (rest.activo !== undefined) where.activo = rest.activo;
    if (rest.q) {
      where.OR = [
        { cedula: { contains: rest.q, mode: 'insensitive' } },
        { nombres: { contains: rest.q, mode: 'insensitive' } },
        { apellidos: { contains: rest.q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.conductor.findMany({
        where,
        orderBy: [{ activo: 'desc' }, { apellidos: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conductor.count({ where }),
    ]);
    return { data, total };
  }

  /**
   * Crea un nuevo conductor.
   *
   * @param data - Datos de creación del conductor (Prisma.ConductorCreateInput)
   * @returns El conductor creado con su ID asignado
   */
  async create(data: Prisma.ConductorCreateInput): Promise<Conductor> {
    return prisma.conductor.create({ data });
  }

  /**
   * Actualiza datos de un conductor existente.
   *
   * @param cedula - Número de cédula del conductor a actualizar
   * @param data - Campos a actualizar
   * @returns El conductor actualizado
   */
  async update(
    cedula: string,
    data: Prisma.ConductorUpdateInput
  ): Promise<Conductor> {
    return prisma.conductor.update({ where: { cedula }, data });
  }

  /**
   * Guarda el snapshot del RUNT y actualiza la fecha de última consulta.
   * Llamado por ConductorService después de una consulta exitosa al RUNT.
   *
   * @param cedula - Número de cédula del conductor
   * @param snapshot - Objeto JSON con la respuesta completa del RUNT
   */
  async actualizarSnapshotRunt(
    cedula: string,
    snapshot: Record<string, unknown>
  ): Promise<void> {
    await prisma.conductor.update({
      where: { cedula },
      // Cast requerido: Prisma Json? espera InputJsonValue, no Record<string, unknown>
      data: { snapshotRunt: snapshot as Prisma.InputJsonValue, ultimaConsultaRunt: new Date() },
    });
  }
}

/** Singleton exportado para uso en servicios */
export const conductorRepository = new ConductorRepository();
