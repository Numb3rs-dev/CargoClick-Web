/**
 * Servicio de Negocios — Módulo Operacional CargoClick
 *
 * NuevoNegocio es el agregado raíz del módulo operacional. Cada negocio
 * agrupa las remesas, manifiestos, seguimientos y encuesta de un viaje.
 *
 * Rutas de creación:
 * - Ruta A: Desde el wizard de cotización (solicitudId + cotizacionId + ajusteComercialId)
 * - Ruta B: Negocio directo sin cotización previa (clienteNombre + clienteNit)
 *
 * Reglas de negocio:
 * - Se requiere identificar al cliente (Ruta A o Ruta B)
 * - El codigoNegocio se genera automáticamente (NEG-YYYY-NNNN) en transacción
 * - Un negocio con manifiestos REGISTRADOS no puede cancelarse
 *
 * @module NuevoNegocioService
 */
import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { generarConsecutivo } from '@/lib/utils/consecutivos';
import { prisma } from '@/lib/db/prisma';

// ───────────────────────────────────────────────────────────────────────────────
// TIPOS DE INPUT
// ───────────────────────────────────────────────────────────────────────────────

export interface CrearNegocioInput {
  // Ruta A — negocio originado desde wizard de cotización
  solicitudId?: string;
  cotizacionId?: string;
  ajusteComercialId?: string;
  // Ruta B — negocio directo
  clienteNombre?: string;
  clienteNit?: string;
  // Común
  /** Fecha estimada de despacho en formato ISO "YYYY-MM-DD" */
  fechaDespachoEstimada?: string;
  notas?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// SERVICIO
// ───────────────────────────────────────────────────────────────────────────────

export class NuevoNegocioService {
  /**
   * Crea un nuevo negocio de transporte.
   *
   * El codigoNegocio (NEG-YYYY-NNNN) se genera dentro de una $transaction
   * para garantizar unicidad bajo concurrencia.
   *
   * Precondiciones:
   * - Debe ser Ruta A (tiene solicitudId) o Ruta B (tiene clienteNombre).
   *
   * Postcondiciones:
   * - El negocio queda con estado=ACTIVO, listo para agregarle remesas.
   *
   * @param input - Datos del negocio a crear
   * @returns El negocio creado con su codigoNegocio generado
   * @throws {Error} Si no se identifica el cliente (ni solicitudId ni clienteNombre)
   */
  async crear(input: CrearNegocioInput) {
    if (!input.solicitudId && !input.clienteNombre) {
      throw new Error(
        'Se requiere solicitudId (Ruta A) o clienteNombre/clienteNit (Ruta B)'
      );
    }

    return prisma.$transaction(async (tx) => {
      const codigoNegocio = await generarConsecutivo(
        tx as Parameters<typeof generarConsecutivo>[0],
        'nuevoNegocio',
        'NEG'
      );

      return tx.nuevoNegocio.create({
        data: {
          codigoNegocio,
          ...(input.solicitudId && { solicitudId: input.solicitudId }),
          ...(input.cotizacionId && { cotizacionId: input.cotizacionId }),
          ...(input.ajusteComercialId && {
            ajusteComercialId: input.ajusteComercialId,
          }),
          ...(input.clienteNombre && { clienteNombre: input.clienteNombre }),
          ...(input.clienteNit && { clienteNit: input.clienteNit }),
          ...(input.fechaDespachoEstimada && {
            fechaDespachoEstimada: new Date(input.fechaDespachoEstimada),
          }),
          ...(input.notas && { notas: input.notas }),
        },
      });
    });
  }

  /**
   * Cancela un negocio, impidiendo nuevas remesas y manifiestos.
   *
   * Precondiciones:
   * - El negocio existe.
   * - No tiene manifiestos en estado REGISTRADO, CULMINADO (activos en el RNDC).
   *   Los estados BORRADOR, ENVIADO y ANULADO sí permiten la cancelación.
   *
   * Postcondiciones:
   * - Estado del negocio cambia a CANCELADO.
   *
   * @param id - ID del negocio a cancelar
   * @returns El negocio actualizado con estado CANCELADO
   * @throws {Error} Si el negocio no existe o tiene manifiestos activos en el RNDC
   */
  async cancelar(id: string) {
    const negocio = await nuevoNegocioRepository.findById(id);
    if (!negocio) throw new Error(`Negocio ${id} no encontrado`);

    // Verificar que no tiene manifiestos activos en el RNDC
    const manifiestoActivo = negocio.manifiestos.some(
      (m) =>
        !['BORRADOR', 'ENVIADO', 'ANULADO'].includes(m.estadoManifiesto)
    );
    if (manifiestoActivo) {
      throw new Error(
        'No se puede cancelar un negocio con manifiestos activos en el RNDC'
      );
    }

    return nuevoNegocioRepository.update(id, { estado: 'CANCELADO' });
  }
}

/** Singleton exportado para uso en API Routes */
export const nuevoNegocioService = new NuevoNegocioService();
