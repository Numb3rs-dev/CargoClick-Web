/**
 * Repositorio para operaciones CRUD sobre la entidad Solicitud
 * 
 * Responsabilidades:
 * - Abstracción de Prisma ORM
 * - Operaciones de lectura/escritura en tabla solicitudes
 * - Queries optimizadas con índices
 * 
 * NO incluye:
 * - Lógica de negocio (va en servicios)
 * - Validaciones (va en schemas Zod)
 * - Transformaciones de datos
 * 
 * @module SolicitudRepository
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma, Solicitud, EstadoSolicitud } from '.prisma/client';

/**
 * Tipo para datos de creación de solicitud
 * Excluye campos automáticos (createdAt, updatedAt)
 */
export type CrearSolicitudInput = Omit<Prisma.SolicitudCreateInput, 'createdAt' | 'updatedAt'>;

/**
 * Tipo para actualización parcial de solicitud
 */
export type ActualizarSolicitudInput = Prisma.SolicitudUpdateInput;

/**
 * Clase que encapsula todas las operaciones de acceso a datos de Solicitudes
 */
export class SolicitudRepository {
  /**
   * Guarda una nueva solicitud en la base de datos
   * 
   * @param data - Datos completos de la solicitud
   * @returns Solicitud creada con timestamps generados
   * @throws Error si la inserción falla (violación de constraint, DB down, etc.)
   * 
   * @example
   * const solicitud = await repo.guardar({
   *   id: ulid(),
   *   empresa: "ACME",
   *   contacto: "Juan Pérez",
   *   email: "juan@acme.com",
   *   // ... resto de campos
   * });
   */
  async guardar(data: CrearSolicitudInput): Promise<Solicitud> {
    return await prisma.solicitud.create({
      data,
    });
  }

  /**
   * Obtiene una solicitud por su ID único
   * 
   * @param id - ULID de 26 caracteres
   * @returns Solicitud encontrada o null si no existe
   * 
   * @example
   * const solicitud = await repo.obtenerPorId('01JXX2Y3Z4A5B6C7D8E9F0G1H2');
   * if (!solicitud) {
   *   throw new Error('Solicitud no encontrada');
   * }
   */
  async obtenerPorId(id: string): Promise<Solicitud | null> {
    return await prisma.solicitud.findUnique({
      where: { id },
    });
  }

  /**
   * Actualiza campos específicos de una solicitud existente
   * 
   * @param id - ULID de la solicitud a actualizar
   * @param data - Campos a actualizar (parcial)
   * @returns Solicitud actualizada
   * @throws Error si el ID no existe
   * 
   * @example
   * // Guardado progresivo: actualizar solo email
   * const solicitud = await repo.actualizar('01JXX...', {
   *   email: 'nuevo@email.com'
   * });
   */
  async actualizar(id: string, data: ActualizarSolicitudInput): Promise<Solicitud> {
    return await prisma.solicitud.update({
      where: { id },
      data,
    });
  }

  /**
   * Lista solicitudes filtradas por estado
   * 
   * Usa índice en campo `estado` para performance
   * 
   * @param estado - Estado a filtrar (PENDIENTE, COTIZADO, etc.)
   * @param limit - Número máximo de resultados (default: sin límite)
   * @returns Array de solicitudes ordenadas por fecha descendente
   * 
   * @example
   * const pendientes = await repo.listarPorEstado('PENDIENTE', 10);
   */
  async listarPorEstado(
    estado: EstadoSolicitud,
    limit?: number
  ): Promise<Solicitud[]> {
    return await prisma.solicitud.findMany({
      where: { estado },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtiene las solicitudes más recientes
   * 
   * Usa índice en `createdAt` (descendente) para performance
   * 
   * @param limit - Número máximo de resultados (default: 10)
   * @returns Array de solicitudes más recientes
   * 
   * @example
   * const recientes = await repo.listarRecientes(5);
   */
  async listarRecientes(limit: number = 10): Promise<Solicitud[]> {
    return await prisma.solicitud.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Busca todas las solicitudes de un cliente por email
   * 
   * Usa índice en campo `email` para performance
   * 
   * @param email - Email del cliente
   * @returns Array de solicitudes del cliente ordenadas por fecha descendente
   * 
   * @example
   * const historial = await repo.buscarPorEmail('juan@acme.com');
   */
  async buscarPorEmail(email: string): Promise<Solicitud[]> {
    return await prisma.solicitud.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca una solicitud por su código de referencia externo (codigoRef).
   * Usado en las rutas públicas /solicitudes/[ref] para no exponer el ULID interno.
   */
  async buscarPorCodigoRef(codigoRef: string): Promise<Solicitud | null> {
    return await prisma.solicitud.findUnique({
      where: { codigoRef: codigoRef.toUpperCase() },
    });
  }

  /**
   * Busca si existe una solicitud reciente con el mismo teléfono
   * 
   * ANTI-DUPLICADOS: Usado para prevenir solicitudes spam/duplicadas
   * 
   * @param telefono  - Número de teléfono a buscar
   * @param contacto  - Nombre del contacto
   * @param empresa   - Nombre de la empresa (puede ser vacío)
   * @param fechaDesde - Fecha desde la cual buscar (típicamente hace 24h)
   * @returns Primera solicitud encontrada o null si no existe
   *
   * La coincidencia requiere que los TRES campos sean iguales.
   * Si cualquiera difiere, se trata de un cliente distinto y no se bloquea.
   */
  async buscarClienteReciente(
    telefono: string,
    contacto: string,
    empresa: string,
    fechaDesde: Date,
  ): Promise<Solicitud | null> {
    return await prisma.solicitud.findFirst({
      where: {
        telefono: { equals: telefono, mode: 'insensitive' },
        contacto: { equals: contacto, mode: 'insensitive' },
        empresa:  { equals: empresa,  mode: 'insensitive' },
        createdAt: { gte: fechaDesde },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cuenta el número de solicitudes con un estado específico
   * 
   * Útil para métricas y dashboard
   * 
   * @param estado - Estado a contar
   * @returns Número de solicitudes
   * 
   * @example
   * const pendientes = await repo.contarPorEstado('PENDIENTE');
   * console.log(`Hay ${pendientes} solicitudes pendientes`);
   */
  async contarPorEstado(estado: EstadoSolicitud): Promise<number> {
    return await prisma.solicitud.count({
      where: { estado },
    });
  }

  /**
   * Obtiene métricas agregadas de solicitudes
   * 
   * @returns Objeto con conteos por estado
   * 
   * @example
   * const metricas = await repo.obtenerMetricas();
   * // { pendiente: 5, cotizado: 10, rechazado: 2, cerrado: 15 }
   */
  async obtenerMetricas(): Promise<{
    pendiente: number;
    enProgreso: number;
    completada: number;
    cotizado: number;
    rechazado: number;
    cerrado: number;
  }> {
    const [pendiente, enProgreso, completada, cotizado, rechazado, cerrado] = await Promise.all([
      this.contarPorEstado('PENDIENTE'),
      this.contarPorEstado('EN_PROGRESO'),
      this.contarPorEstado('COMPLETADA'),
      this.contarPorEstado('COTIZADO'),
      this.contarPorEstado('RECHAZADO'),
      this.contarPorEstado('CERRADO'),
    ]);

    return {
      pendiente,
      enProgreso,
      completada,
      cotizado,
      rechazado,
      cerrado,
    };
  }
}

/**
 * Instancia singleton del repositorio de solicitudes
 * Usar esta instancia en servicios y controladores
 * 
 * @example
 * import { solicitudRepository } from '@/lib/repositories/solicitudRepository'
 * 
 * const solicitud = await solicitudRepository.obtenerPorId(id)
 */
export const solicitudRepository = new SolicitudRepository();
