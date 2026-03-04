/**
 * Repositorio para operaciones sobre la entidad SeguimientoCliente.
 *
 * SeguimientoCliente registra los hitos del viaje visible para el cliente.
 * Es un log append-only: nunca se actualiza, solo se agregan nuevos hitos.
 *
 * Responsabilidades:
 * - Registrar hitos de seguimiento por negocio
 * - Consultar historial de seguimiento ordenado cronológicamente
 *
 * @module SeguimientoClienteRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { SeguimientoCliente, Prisma } from '@prisma/client';

export class SeguimientoClienteRepository {
  /**
   * Lista todos los hitos de seguimiento de un negocio.
   * Ordenados cronológicamente para mostrar el historial del viaje.
   *
   * @param nuevoNegocioId - ID del negocio
   * @returns Array de hitos ordenados por fecha de creación ascendente
   */
  async findByNegocio(nuevoNegocioId: string): Promise<SeguimientoCliente[]> {
    return prisma.seguimientoCliente.findMany({
      where: { nuevoNegocioId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Registra un nuevo hito de seguimiento. Operación append-only.
   *
   * @param data - Datos del hito de seguimiento
   * @returns El hito creado con su ID asignado
   */
  async create(data: Prisma.SeguimientoClienteCreateInput): Promise<SeguimientoCliente> {
    return prisma.seguimientoCliente.create({ data });
  }
}

/** Singleton exportado para uso en servicios */
export const seguimientoClienteRepository = new SeguimientoClienteRepository();
