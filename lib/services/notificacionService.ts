/**
 * Servicio de orquestación de notificaciones
 * 
 * Responsabilidades:
 * - Enviar email al cliente (confirmación)
 * - Enviar email al administrador (notificación interna)
 * - Enviar WhatsApp al administrador (alerta)
 * - Manejar fallos parciales sin interrumpir flujo
 * 
 * Importante: Las notificaciones NO deben bloquear el flujo principal
 * Si alguna falla, se loguea el error pero NO se lanza excepción
 * 
 * @module NotificacionService
 */

import { Solicitud } from '.prisma/client';
import { logger } from '@/lib/utils/logger';

export class NotificacionService {
  /**
   * Envía todas las notificaciones relacionadas con una solicitud completada
   * 
   * Ejecuta en paralelo:
   * 1. Email al cliente (confirmación)
   * 2. Email al administrador (notificación)
   * 3. WhatsApp al administrador (alerta)
   * 
   * Si alguna falla, se loguea pero no se interrumpe el flujo
   * 
   * @param solicitud - Solicitud completada
   * @returns Promise<void>
   * 
   * @example
   * await notificacionService.enviarTodasLasNotificaciones(solicitud);
   * // Notificaciones enviadas en paralelo
   * // Si alguna falla, se loguea pero no se propaga error
   */
  async enviarTodasLasNotificaciones(solicitud: Solicitud): Promise<void> {
    logger.info('[NotificacionService]', `Enviando notificaciones para solicitud: ${solicitud.id}`);

    const promesas = [
      this.enviarEmailCliente(solicitud),
      this.enviarEmailAdmin(solicitud),
      this.enviarWhatsAppAdmin(solicitud),
    ];

    // Ejecutar en paralelo y capturar errores individuales
    const resultados = await Promise.allSettled(promesas);

    // Loguear errores pero no lanzar excepción
    resultados.forEach((resultado, index) => {
      if (resultado.status === 'rejected') {
        const tipo = ['Email Cliente', 'Email Admin', 'WhatsApp Admin'][index];
        logger.error(`[NotificacionService] Error al enviar ${tipo}`, resultado.reason);
      } else {
        const tipo = ['Email Cliente', 'Email Admin', 'WhatsApp Admin'][index];
        logger.info('[NotificacionService]', `${tipo} enviado correctamente`);
      }
    });
  }

  /**
   * Envía email de confirmación al cliente
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla envío (capturado por enviarTodasLasNotificaciones)
   */
  private async enviarEmailCliente(solicitud: Solicitud): Promise<void> {
    const { emailService } = await import('@/lib/services/emailService');
    await emailService.enviarEmailCliente(solicitud);
  }

  /**
   * Envía email de notificación al administrador
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla envío
   */
  private async enviarEmailAdmin(solicitud: Solicitud): Promise<void> {
    const { emailService } = await import('@/lib/services/emailService');
    await emailService.enviarEmailAdmin(solicitud);
  }

  /**
   * Envía mensaje de WhatsApp al administrador
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla envío
   */
  private async enviarWhatsAppAdmin(solicitud: Solicitud): Promise<void> {
    const { whatsappService } = await import('@/lib/services/whatsappService');
    await whatsappService.enviarWhatsAppAdmin(solicitud);
  }
}

// Exportar instancia única
export const notificacionService = new NotificacionService();
