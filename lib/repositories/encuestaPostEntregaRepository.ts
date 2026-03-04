/**
 * Repositorio para operaciones sobre la entidad EncuestaPostEntrega.
 *
 * Hay una encuesta por negocio. Acceso público sin auth via tokenEncuesta.
 * El token permite al cliente responder desde un link sin necesidad de login.
 *
 * Responsabilidades:
 * - Crear encuesta con token único al completar un negocio
 * - Buscar encuesta por token (ruta pública /encuesta/[token])
 * - Registrar la respuesta del cliente
 *
 * @module EncuestaPostEntregaRepository
 */
import { prisma } from '@/lib/db/prisma';
import type { EncuestaPostEntrega } from '@prisma/client';

export class EncuestaPostEntregaRepository {
  /**
   * Busca una encuesta por su token único.
   * Usado en la ruta pública /encuesta/[token] (sin auth Clerk).
   * Incluye datos básicos del negocio para personalizar la vista.
   *
   * @param token - Token único de la encuesta (tokenEncuesta)
   * @returns Encuesta con nombre y código del negocio, o null si no existe
   */
  async findByToken(token: string) {
    return prisma.encuestaPostEntrega.findUnique({
      where: { tokenEncuesta: token },
      include: {
        nuevoNegocio: { select: { codigoNegocio: true, clienteNombre: true } },
      },
    });
  }

  /**
   * Busca la encuesta asociada a un negocio.
   * Útil para verificar si ya existe antes de crear una nueva.
   *
   * @param nuevoNegocioId - ID del negocio
   * @returns La encuesta del negocio o null si aún no se creó
   */
  async findByNegocio(nuevoNegocioId: string): Promise<EncuestaPostEntrega | null> {
    return prisma.encuestaPostEntrega.findUnique({ where: { nuevoNegocioId } });
  }

  /**
   * Crea la encuesta para un negocio recién completado.
   * El token se genera automáticamente por Prisma (@default(cuid())).
   * calificacionGeneral se inicializa en 0 hasta que el cliente responda.
   *
   * @param nuevoNegocioId - ID del negocio al que pertenece la encuesta
   * @returns La encuesta creada con su token único
   */
  async create(nuevoNegocioId: string): Promise<EncuestaPostEntrega> {
    return prisma.encuestaPostEntrega.create({
      // calificacionGeneral=0 es el placeholder hasta que el cliente responda
      data: { nuevoNegocioId, calificacionGeneral: 0 },
    });
  }

  /**
   * Registra la respuesta del cliente a la encuesta.
   * Actualiza respondidoEn con la fecha actual para saber cuándo respondió.
   *
   * @param token - Token único de la encuesta
   * @param data - Calificaciones y comentario del cliente
   * @returns La encuesta actualizada con la respuesta
   */
  async responder(
    token: string,
    data: {
      calificacionGeneral: number;
      calificacionTiempos?: number;
      calificacionTrato?: number;
      calificacionEstadoCarga?: number;
      comentario?: string;
      recomendaria?: boolean;
    }
  ): Promise<EncuestaPostEntrega> {
    return prisma.encuestaPostEntrega.update({
      where: { tokenEncuesta: token },
      data: { ...data, respondidoEn: new Date() },
    });
  }
}

/** Singleton exportado para uso en servicios */
export const encuestaPostEntregaRepository = new EncuestaPostEntregaRepository();
