/**
 * Repositorio para operaciones sobre la entidad Remesa.
 *
 * Remesa es la unidad mínima de carga. Solo las remesas con
 * estadoRndc=REGISTRADA pueden asignarse a un ManifiestoOperativo.
 *
 * Responsabilidades:
 * - CRUD de remesas
 * - Actualización de estado RNDC (PENDIENTE → ENVIADA → REGISTRADA/ANULADA)
 * - Validación de remesas como precondición para crear manifiestos
 *
 * @module RemesaRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { Remesa, EstadoRndcRemesa, Prisma } from '@prisma/client';

export class RemesaRepository {
  /**
   * Busca una remesa por su ID interno.
   *
   * @param id - ID cuid de la remesa
   * @returns La remesa encontrada o null si no existe
   */
  async findById(id: string): Promise<Remesa | null> {
    return prisma.remesa.findUnique({ where: { id } });
  }

  /**
   * Lista todas las remesas de un negocio.
   *
   * @param nuevoNegocioId - ID del negocio al que pertenecen las remesas
   * @returns Array de remesas ordenadas por fecha de creación ascendente
   */
  async findByNegocio(nuevoNegocioId: string): Promise<Remesa[]> {
    return prisma.remesa.findMany({
      where: { nuevoNegocioId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Lista todas las remesas con búsqueda, filtros avanzados y paginación.
   *
   * @param opts.q - Texto libre que se busca en numeroRemesa, descripcionCarga,
   *                 origenMunicipio, destinoMunicipio, nitRemitente, nitDestinatario
   * @param opts.estadoRndc - Filtra por estado RNDC
   * @param opts.origenDane - Código DANE del municipio de origen
   * @param opts.destinoDane - Código DANE del municipio de destino
   * @param opts.anio - Año de creación
   * @param opts.mes - Mes de creación (1-12)
   * @param opts.page - Página (1-indexed, default 1)
   * @param opts.pageSize - Tamaño de página (default 20)
   * @returns { data, total }
   */
  async findAll(opts: {
    q?: string;
    estadoRndc?: EstadoRndcRemesa;
    origenDane?: string;
    destinoDane?: string;
    anio?: number;
    mes?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ data: Remesa[]; total: number }> {
    const { q, estadoRndc, origenDane, destinoDane, anio, mes, page = 1, pageSize = 20 } = opts;

    /* --- Date range filter (basado en fechaIngresoRndc) --- */
    let fechaFilter: Prisma.DateTimeNullableFilter | undefined;
    if (anio) {
      const start = new Date(anio, (mes ?? 1) - 1, 1);
      const end   = mes
        ? new Date(anio, mes, 1)            // start of next month
        : new Date(anio + 1, 0, 1);         // start of next year
      fechaFilter = { gte: start, lt: end };
    }

    const where: Prisma.RemesaWhereInput = {
      ...(estadoRndc && { estadoRndc }),
      ...(origenDane && { origenDane }),
      ...(destinoDane && { destinoDane }),
      ...(fechaFilter && { fechaIngresoRndc: fechaFilter }),
      ...(q && {
        OR: [
          { numeroRemesa: { contains: q, mode: 'insensitive' } },
          { descripcionCarga: { contains: q, mode: 'insensitive' } },
          { origenMunicipio: { contains: q, mode: 'insensitive' } },
          { destinoMunicipio: { contains: q, mode: 'insensitive' } },
          { nitRemitente: { contains: q, mode: 'insensitive' } },
          { nitDestinatario: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.remesa.findMany({
        where,
        orderBy: { fechaIngresoRndc: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.remesa.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Devuelve los años distintos disponibles para filtrar por fechaIngresoRndc.
   */
  async findAniosDisponibles(): Promise<number[]> {
    const rows = await prisma.$queryRaw<{ anio: number }[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM "fechaIngresoRndc")::int AS anio
      FROM remesas
      WHERE "fechaIngresoRndc" IS NOT NULL
      ORDER BY anio DESC
    `;
    return rows.map(r => r.anio);
  }

  /**
   * Valida que todas las remesas de una lista cumplen las precondiciones
   * para ser asignadas a un ManifiestoOperativo:
   * - estadoRndc === REGISTRADA (el RNDC ya asignó número de remesa)
   * - No están asignadas a otro manifiesto
   *
   * REGLA DE NEGOCIO CRÍTICA: Una remesa que no esté REGISTRADA en el RNDC
   * no puede incluirse en un manifiesto. El RNDC rechazará el manifiesto.
   * La pertenencia a un negocio ya no es un requisito — cualquier remesa
   * REGISTRADA y sin manifiesto puede asignarse libremente.
   *
   * @param ids - IDs de las remesas a validar
   * @returns Objeto con flag de validez y mensajes de error si aplica
   */
  async validarParaManifiesto(
    ids: string[]
  ): Promise<{ validas: boolean; errores: string[] }> {
    const remesas = await prisma.remesa.findMany({ where: { id: { in: ids } } });
    const errores: string[] = [];

    for (const r of remesas) {
      if (r.estadoRndc !== 'REGISTRADA')
        errores.push(
          `Remesa ${r.numeroRemesa} aún no está REGISTRADA en el RNDC (estado actual: ${r.estadoRndc})`
        );
      if (r.manifiestoOperativoId)
        errores.push(`Remesa ${r.numeroRemesa} ya está asignada a otro manifiesto`);
    }

    return { validas: errores.length === 0, errores };
  }

  /**
   * Crea una nueva remesa.
   *
   * @param data - Datos de creación de la remesa
   * @returns La remesa creada con su ID y número asignados
   */
  async create(data: Prisma.RemesaCreateInput): Promise<Remesa> {
    return prisma.remesa.create({ data });
  }

  /**
   * Actualiza datos de una remesa existente.
   *
   * @param id - ID de la remesa a actualizar
   * @param data - Campos a actualizar
   * @returns La remesa actualizada
   */
  async update(id: string, data: Prisma.RemesaUpdateInput): Promise<Remesa> {
    return prisma.remesa.update({ where: { id }, data });
  }

  /**
   * Actualiza el estado de sincronización RNDC de una remesa.
   * Llamado por RemesaService en el flujo SOAP del procesoid 3.
   *
   * Transiciones válidas:
   * - PENDIENTE → ENVIADA (antes del SOAP, para idempotencia ante timeout)
   * - ENVIADA → REGISTRADA (RNDC respondió con ingresoid > 0)
   * - ENVIADA → PENDIENTE (rollback si el RNDC falla, para permitir reintento)
   * - REGISTRADA → ANULADA (procesoid 38)
   *
   * @param id - ID de la remesa
   * @param estadoRndc - Nuevo estado RNDC
   * @param numeroRemesaRndc - Número asignado por el RNDC (solo cuando pasa a REGISTRADA)
   * @param respuestaRndcJson - XML de respuesta parseado a JSON
   * @returns La remesa con el estado actualizado
   */
  async actualizarEstadoRndc(
    id: string,
    estadoRndc: EstadoRndcRemesa,
    numeroRemesaRndc?: string,
    respuestaRndcJson?: object
  ): Promise<Remesa> {
    return prisma.remesa.update({
      where: { id },
      data: {
        estadoRndc,
        ...(numeroRemesaRndc && { numeroRemesaRndc }),
        ...(respuestaRndcJson && { respuestaRndcJson }),
      },
    });
  }
}

/** Singleton exportado para uso en servicios */
export const remesaRepository = new RemesaRepository();
