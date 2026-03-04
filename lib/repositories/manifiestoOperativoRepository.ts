/**
 * Repositorio para operaciones sobre la entidad ManifiestoOperativo.
 *
 * ManifiestoOperativo agrupa remesas para un despacho físico.
 * Registrado en el RNDC via procesoid 4.
 * codigoInterno es la clave de idempotencia para el SOAP.
 *
 * Responsabilidades:
 * - CRUD de manifiestos con includes optimizados
 * - Actualización de estado RNDC y manifiesto
 * - Consulta de manifiestos por negocio
 *
 * @module ManifiestoOperativoRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { ManifiestoOperativo, EstadoManifiesto, Prisma } from '@prisma/client';

export class ManifiestoOperativoRepository {
  /**
   * Obtiene el detalle completo de un manifiesto con conductor, vehículo,
   * remesas y relaciones de corrección (reemplazadoPor / reemplazos).
   *
   * @param id - ID del manifiesto
   * @returns Manifiesto con todas sus relaciones o null si no existe
   */
  async findById(id: string) {
    return prisma.manifiestoOperativo.findUnique({
      where: { id },
      include: {
        remesas: true,
        conductor: true,
        vehiculo: true,
        nuevoNegocio: { select: { codigoNegocio: true, clienteNombre: true } },
        // El manifiesto anulado que este reemplaza (flujo corrección: 32 → 4)
        reemplazadoPor: {
          select: { id: true, codigoInterno: true, estadoManifiesto: true },
        },
        // Los manifiestos corrección creados para reemplazar a este
        reemplazos: {
          select: { id: true, codigoInterno: true, estadoManifiesto: true },
        },
      },
    });
  }

  /**
   * Lista todos los manifiestos de un negocio con datos resumidos.
   *
   * @param nuevoNegocioId - ID del negocio
   * @returns Array de manifiestos ordenados por fecha de creación descendente
   */
  async findByNegocio(nuevoNegocioId: string) {
    return prisma.manifiestoOperativo.findMany({
      where: { nuevoNegocioId },
      include: {
        conductor: { select: { cedula: true, nombres: true, apellidos: true } },
        vehiculo: { select: { placa: true, tipoVehiculo: true } },
        remesas: {
          select: {
            id: true,
            numeroRemesa: true,
            descripcionCarga: true,
            pesoKg: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista todos los manifiestos con búsqueda, filtros y paginación.
   *
   * @param opts.q - Texto libre: codigoInterno, numeroManifiesto, vehiculoPlaca,
   *                 conductorCedula, origenMunicipio, destinoMunicipio
   * @param opts.estadoManifiesto - Filtra por estado
   * @param opts.origenDane       - Filtra por código DANE de municipio origen
   * @param opts.destinoDane      - Filtra por código DANE de municipio destino
   * @param opts.anio             - Filtra por año de fechaExpedicion
   * @param opts.mes              - Filtra por mes (1-12) de fechaExpedicion
   * @param opts.page - Página 1-indexed (default 1)
   * @param opts.pageSize - Tamaño de página (default 20)
   */
  async findAll(opts: {
    q?: string;
    estadoManifiesto?: string;
    origenDane?: string;
    destinoDane?: string;
    anio?: number;
    mes?: number;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { q, estadoManifiesto, origenDane, destinoDane, anio, mes, page = 1, pageSize = 20 } = opts;

    // Build date range filter for year/month
    let fechaGte: Date | undefined;
    let fechaLt: Date | undefined;
    if (anio) {
      if (mes) {
        fechaGte = new Date(anio, mes - 1, 1);
        fechaLt  = new Date(anio, mes, 1);
      } else {
        fechaGte = new Date(anio, 0, 1);
        fechaLt  = new Date(anio + 1, 0, 1);
      }
    }

    const where: Prisma.ManifiestoOperativoWhereInput = {
      ...(estadoManifiesto && { estadoManifiesto: estadoManifiesto as never }),
      ...(origenDane && { origenDane }),
      ...(destinoDane && { destinoDane }),
      ...(fechaGte && fechaLt && {
        fechaExpedicion: { gte: fechaGte, lt: fechaLt },
      }),
      ...(q && {
        OR: [
          { codigoInterno: { contains: q, mode: 'insensitive' } },
          { numeroManifiesto: { contains: q, mode: 'insensitive' } },
          { vehiculoPlaca: { contains: q, mode: 'insensitive' } },
          { conductorCedula: { contains: q, mode: 'insensitive' } },
          { origenMunicipio: { contains: q, mode: 'insensitive' } },
          { destinoMunicipio: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const include = {
      conductor: { select: { cedula: true, nombres: true, apellidos: true } },
      vehiculo: { select: { placa: true, tipoVehiculo: true } },
      remesas: {
        select: {
          id: true,
          numeroRemesa: true,
          descripcionCarga: true,
          pesoKg: true,
        },
      },
    };

    const [data, total] = await Promise.all([
      prisma.manifiestoOperativo.findMany({
        where,
        include,
        orderBy: { fechaExpedicion: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.manifiestoOperativo.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Devuelve los años disponibles para filtrar (distintos de fechaExpedicion).
   */
  async findAniosDisponibles(): Promise<number[]> {
    const rows = await prisma.$queryRaw<{ anio: number }[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM "fechaExpedicion")::int AS anio
      FROM manifiestos_operativos
      WHERE "fechaExpedicion" IS NOT NULL
      ORDER BY anio DESC
    `;
    return rows.map(r => r.anio);
  }

  /**
   * Devuelve las remesas disponibles para asignar a un manifiesto.
   * Criterios: estadoRndc=REGISTRADA y sin manifiesto asignado.
   * Sin restricción de negocio — cualquier remesa disponible puede usarse.
   */
  async findRemesasDisponibles() {
    return prisma.remesa.findMany({
      where: {
        estadoRndc: 'REGISTRADA',
        manifiestoOperativoId: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Crea un nuevo manifiesto.
   * Las remesas se conectan vía el campo `remesas.connect` en data.
   *
   * @param data - Datos de creación del manifiesto (incluye connect de remesas)
   * @returns El manifiesto creado con su ID y codigoInterno asignados
   */
  async create(data: Prisma.ManifiestoOperativoCreateInput): Promise<ManifiestoOperativo> {
    return prisma.manifiestoOperativo.create({ data });
  }

  /**
   * Actualiza el estado del manifiesto y opcionalmente el número RNDC
   * o la respuesta RNDC en JSON.
   *
   * Transiciones válidas en el ciclo de vida:
   * - BORRADOR → ENVIADO (antes del SOAP procesoid 4)
   * - ENVIADO → REGISTRADO (RNDC respondió con número de manifiesto)
   * - ENVIADO → BORRADOR (rollback por timeout)
   * - REGISTRADO → CULMINADO (procesoid 5+6 completados)
   * - REGISTRADO → ANULADO (procesoid 32)
   *
   * @param id - ID del manifiesto
   * @param estadoManifiesto - Nuevo estado del manifiesto
   * @param extras - Campos adicionales a actualizar (número RNDC, respuesta JSON)
   * @returns El manifiesto con el estado actualizado
   */
  async actualizarEstado(
    id: string,
    estadoManifiesto: EstadoManifiesto,
    extras?: { numeroManifiesto?: string; respuestaRndcJson?: object }
  ): Promise<ManifiestoOperativo> {
    return prisma.manifiestoOperativo.update({
      where: { id },
      data: { estadoManifiesto, ...extras },
    });
  }
}

/** Singleton exportado para uso en servicios */
export const manifiestoOperativoRepository = new ManifiestoOperativoRepository();
