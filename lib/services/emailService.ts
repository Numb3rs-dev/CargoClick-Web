/**
 * Servicio de envío de emails vía Resend API
 * 
 * @module EmailService
 */

import { Resend } from 'resend';
import { Solicitud } from '.prisma/client';
import { templateEmailCliente, templateEmailAdmin } from '@/lib/utils/emailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  /**
   * Envía email de confirmación al cliente
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla el envío
   * 
   * @example
   * await emailService.enviarEmailCliente(solicitud);
   */
  async enviarEmailCliente(solicitud: Solicitud): Promise<void> {
    const emailFrom = process.env.EMAIL_FROM!;
    
    if (!emailFrom) {
      throw new Error('EMAIL_FROM no configurado en variables de entorno');
    }

    try {
      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: solicitud.email,
        subject: `Solicitud de Cotización #${solicitud.id.slice(-8).toUpperCase()} Recibida`,
        html: templateEmailCliente(solicitud),
      });

      if (error) {
        throw new Error(`Error al enviar email al cliente: ${error.message}`);
      }

      console.log('✅ Email cliente enviado:', data?.id);
    } catch (error) {
      console.error('❌ Error al enviar email al cliente:', error);
      throw error;
    }
  }

  /**
   * Envía email de notificación al administrador
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla el envío
   * 
   * @example
   * await emailService.enviarEmailAdmin(solicitud);
   */
  async enviarEmailAdmin(solicitud: Solicitud): Promise<void> {
    const emailFrom = process.env.EMAIL_FROM!;
    const emailAdmin = process.env.EMAIL_ADMIN!;
    
    if (!emailFrom || !emailAdmin) {
      throw new Error('EMAIL_FROM o EMAIL_ADMIN no configurados en variables de entorno');
    }

    const asunto = solicitud.revisionEspecial
      ? `🚨 NUEVA SOLICITUD #${solicitud.id.slice(-8).toUpperCase()} - ⚠️ REVISIÓN ESPECIAL`
      : `🚨 Nueva Solicitud #${solicitud.id.slice(-8).toUpperCase()} - ${solicitud.tipoServicio}`;

    try {
      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: emailAdmin,
        subject: asunto,
        html: templateEmailAdmin(solicitud),
      });

      if (error) {
        throw new Error(`Error al enviar email al admin: ${error.message}`);
      }

      console.log('✅ Email admin enviado:', data?.id);
    } catch (error) {
      console.error('❌ Error al enviar email al admin:', error);
      throw error;
    }
  }
}

// Exportar instancia única
export const emailService = new EmailService();
