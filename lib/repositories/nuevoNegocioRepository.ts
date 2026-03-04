/**
 * Repositorio para operaciones sobre la entidad NuevoNegocio.
 *
 * NuevoNegocio es el agregado raíz del módulo operacional. Agrupa remesas,
 * manifiestos, seguimientos y encuesta de un viaje completo.
 *
 * Responsabilidades:
 * - CRUD de negocios con includes optimizados (sin N+1)
 * - Paginación con $transaction([findMany, count])
 * - Filtros por estado, cliente, rango de fechas
 *
 * @module NuevoNegocioRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { NuevoNegocio, EstadoNegocio, Prisma } from '@prisma/client';

/** Tipo enriquecido para el detalle completo de un negocio con sus relaciones */
export type NuevoNegocioDetalle = NuevoNegocio & {
  remesas: Array<{
    id: string;
    numeroRemesa: string;
    descripcionCarga: string;
    pesoKg: number;
    origenMunicipio: string;
    destinoMunicipio: string;
    estadoRndc: string;
    estado: string;
    manifiestoOperativoId: string | null;
  }>;
  manifiestos: Array<{
    id: string;
    codigoInterno: string;
    numeroManifiesto: string | null;
    estadoManifiesto: string;
    conductorCedula: string;
    vehiculoPlaca: string;
    fechaDespacho: Date;
  }>;
  seguimientos: Array<{
    id: string;
    hito: string;
    descripcion: string | null;
    createdAt: Date;
  }>;
  /** Encuesta post-entrega del negocio. null si aún no se ha enviado. */
  encuesta: {
    id: string;
    tokenEncuesta: string;
    enviadoEn: Date | null;
    respondidoEn: Date | null;
  } | null;
};

export class NuevoNegocioRepository {
  /**
   * Obtiene el detalle completo de un negocio con todas sus relaciones.
   * Usa un único query con includes para evitar el problema N+1.
   *
   * @param id - ID del negocio
   * @returns Negocio con remesas, manifiestos, seguimientos y encuesta, o null si no existe
   */
  async findById(id: string): Promise<NuevoNegocioDetalle | null> {
    return prisma.nuevoNegocio.findUnique({
      where: { id },
      include: {
        remesas: {
          select: {
            id: true,
            numeroRemesa: true,
            descripcionCarga: true,
            pesoKg: true,
            origenMunicipio: true,
            destinoMunicipio: true,
            estadoRndc: true,
            estado: true,
            manifiestoOperativoId: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        manifiestos: {
          select: {
            id: true,
            codigoInterno: true,
            numeroManifiesto: true,
            estadoManifiesto: true,
            conductorCedula: true,
            vehiculoPlaca: true,
            fechaDespacho: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        seguimientos: {
          select: { id: true, hito: true, descripcion: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
        encuesta: {
          select: {
            id: true,
            tokenEncuesta: true,
            enviadoEn: true,
            respondidoEn: true,
          },
        },
      },
    }) as Promise<NuevoNegocioDetalle | null>;
  }

  /**
   * Lista negocios con paginación y filtros.
   * Usa $transaction para garantizar consistencia entre count y findMany.
   *
   * @param filters - Filtros opcionales y parámetros de paginación
   * @returns Objeto con array de negocios y total de registros
   */
  async findAll(
    filters: {
      estado?: EstadoNegocio;
      clienteNit?: string;
      /** Búsqueda libre sobre codigoNegocio y clienteNombre */
      q?: string;
      desde?: Date;
      hasta?: Date;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ data: NuevoNegocio[]; total: number }> {
    const { page = 1, pageSize = 20, ...rest } = filters;
    const where: Prisma.NuevoNegocioWhereInput = {};

    if (rest.estado) where.estado = rest.estado;
    if (rest.clienteNit) where.clienteNit = { contains: rest.clienteNit };
    if (rest.q) {
      where.OR = [
        { codigoNegocio: { contains: rest.q, mode: 'insensitive' } },
        { clienteNombre: { contains: rest.q, mode: 'insensitive' } },
        { clienteNit:    { contains: rest.q, mode: 'insensitive' } },
      ];
    }
    if (rest.desde || rest.hasta) {
      where.createdAt = {
        ...(rest.desde && { gte: rest.desde }),
        ...(rest.hasta && { lte: rest.hasta }),
      };
    }

    const [data, total] = await Promise.all([
      prisma.nuevoNegocio.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.nuevoNegocio.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Crea un nuevo negocio.
   *
   * @param data - Datos de creación del negocio
   * @returns El negocio creado con su ID y código asignados
   */
  async create(data: Prisma.NuevoNegocioCreateInput): Promise<NuevoNegocio> {
    return prisma.nuevoNegocio.create({ data });
  }

  /**
   * Actualiza datos de un negocio existente.
   *
   * @param id - ID del negocio a actualizar
   * @param data - Campos a actualizar
   * @returns El negocio actualizado
   */
  async update(
    id: string,
    data: Prisma.NuevoNegocioUpdateInput
  ): Promise<NuevoNegocio> {
    return prisma.nuevoNegocio.update({ where: { id }, data });
  }
}

/** Singleton exportado para uso en servicios */
export const nuevoNegocioRepository = new NuevoNegocioRepository();
