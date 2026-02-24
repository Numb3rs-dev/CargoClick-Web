/**
 * Servicio de envío de mensajes WhatsApp vía Ultramsg API
 * 
 * @module WhatsAppService
 */

import { Solicitud } from '.prisma/client';

export class WhatsAppService {
  /**
   * Envía mensaje de WhatsApp al administrador
   * 
   * Formato: Mensaje corto con datos clave y emojis
   * Máximo: 300 caracteres
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla el envío
   * 
   * @example
   * await whatsappService.enviarWhatsAppAdmin(solicitud);
   */
  async enviarWhatsAppAdmin(solicitud: Solicitud): Promise<void> {
    const apiKey = process.env.ULTRAMSG_API_KEY;
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;

    if (!apiKey || !instanceId || !adminNumber) {
      throw new Error('Variables de entorno de Ultramsg no configuradas');
    }

    // Construir mensaje corto
    const destino = solicitud.destino ? ` → ${solicitud.destino}` : '';
    const mensaje = this.construirMensaje(solicitud, destino);

    // Validar longitud
    if (mensaje.length > 300) {
      console.warn('⚠️ Mensaje WhatsApp excede 300 caracteres');
    }

    try {
      const response = await fetch(
        `https://api.ultramsg.com/${instanceId}/messages/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: apiKey,
            to: adminNumber,
            body: mensaje,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ultramsg API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ WhatsApp enviado:', data.id);
    } catch (error) {
      console.error('❌ Error al enviar WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Construye el mensaje de WhatsApp con formato específico
   * 
   * @param solicitud - Solicitud completada
   * @param destino - Texto de destino formateado
   * @returns Mensaje formateado
   * @private
   */
  private construirMensaje(solicitud: Solicitud, destino: string): string {
    const idCorto = solicitud.id.slice(-8).toUpperCase();
    const revisionFlag = solicitud.revisionEspecial ? '\n⚠️ *REVISIÓN ESPECIAL*' : '';

    return `
🚨 *Nueva Cotización #${idCorto}*

📍 ${solicitud.origen}${destino}
📦 ${solicitud.tipoCarga.replace(/_/g, ' ')} - ${solicitud.pesoKg}kg
📅 ${new Date(solicitud.fechaRequerida).toLocaleDateString('es-CO')}
💰 Asegurado: $${Number(solicitud.valorAsegurado).toLocaleString('es-CO')}

👤 ${solicitud.empresa}
📞 ${solicitud.telefono}${revisionFlag}
    `.trim();
  }
}

// Exportar instancia única
export const whatsappService = new WhatsAppService();
