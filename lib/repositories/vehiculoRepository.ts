/**
 * Repositorio para operaciones CRUD sobre la entidad Vehiculo.
 *
 * Responsabilidades:
 * - Abstracción de Prisma ORM para la tabla `vehiculos`
 * - Operaciones de lectura/escritura con filtros
 * - Actualización de snapshot RUNT
 *
 * NO incluye:
 * - Lógica de negocio (va en VehiculoService)
 * - Validaciones (va en schemas Zod)
 * - Llamadas al RNDC (va en rndcClient)
 *
 * @module VehiculoRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { Vehiculo, Prisma } from '@prisma/client';

export class VehiculoRepository {
  /**
   * Busca un vehículo por su placa.
   *
   * @param placa - Placa del vehículo (ej: "ABC123")
   * @returns El vehículo encontrado o null si no existe
   */
  async findByPlaca(placa: string): Promise<Vehiculo | null> {
    return prisma.vehiculo.findUnique({ where: { placa } });
  }

  /**
   * Lista vehículos con filtros opcionales y paginación.
   *
   * @param filters - Filtros opcionales: activo, búsqueda por texto, page, pageSize
   * @returns { data, total } paginados
   */
  async findAll(
    filters: {
      activo?: boolean;
      /** Busca en placa y nombre del propietario (case-insensitive) */
      q?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ data: Vehiculo[]; total: number }> {
    const { page = 1, pageSize = 20, ...rest } = filters;
    const where: Prisma.VehiculoWhereInput = {};
    if (rest.activo !== undefined) where.activo = rest.activo;
    if (rest.q) {
      where.OR = [
        { placa: { contains: rest.q, mode: 'insensitive' } },
        { propietarioNombre: { contains: rest.q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.vehiculo.findMany({
        where,
        orderBy: [{ activo: 'desc' }, { placa: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vehiculo.count({ where }),
    ]);
    return { data, total };
  }

  /**
   * Crea un nuevo vehículo.
   *
   * @param data - Datos de creación del vehículo
   * @returns El vehículo creado con su ID asignado
   */
  async create(data: Prisma.VehiculoCreateInput): Promise<Vehiculo> {
    return prisma.vehiculo.create({ data });
  }

  /**
   * Actualiza datos de un vehículo existente.
   *
   * @param placa - Placa del vehículo a actualizar
   * @param data - Campos a actualizar
   * @returns El vehículo actualizado
   */
  async update(placa: string, data: Prisma.VehiculoUpdateInput): Promise<Vehiculo> {
    return prisma.vehiculo.update({ where: { placa }, data });
  }

  /**
   * Guarda el snapshot del RUNT y actualiza la fecha de última consulta.
   * Llamado por VehiculoService después de una consulta exitosa al RUNT.
   *
   * @param placa - Placa del vehículo
   * @param snapshot - Objeto JSON con la respuesta completa del RUNT
   */
  async actualizarSnapshotRunt(
    placa: string,
    snapshot: Record<string, unknown>
  ): Promise<void> {
    await prisma.vehiculo.update({
      where: { placa },
      // Cast requerido: Prisma Json? espera InputJsonValue, no Record<string, unknown>
      data: { snapshotRunt: snapshot as Prisma.InputJsonValue, ultimaConsultaRunt: new Date() },
    });
  }
}

/** Singleton exportado para uso en servicios */
export const vehiculoRepository = new VehiculoRepository();
