# PROMPT 5: INTEGRACIONES EXTERNAS (Email y WhatsApp)

## CONTEXTO DE NEGOCIO
**Problema**: Necesitamos enviar notificaciones automáticas cuando una solicitud se completa: email de confirmación al cliente, email de notificación al administrador, y mensaje de WhatsApp al administrador con datos resumidos.

**Usuarios**: Sistema de notificaciones que necesita enviar comunicaciones transaccionales sin intervención manual.

**Valor**: Automatización completa del flujo de notificaciones, mejorando la experiencia del cliente y velocidad de respuesta interna.

## ESPECIFICACIÓN FUNCIONAL

### Funcionalidad Principal
Implementar servicios de integración con APIs externas:
- `EmailService`: Envío de emails vía Resend API
- `WhatsAppService`: Envío de mensajes vía Ultramsg API

### Casos de Uso

1. **Email de confirmación al cliente**: Enviar email con resumen de solicitud y próximos pasos
2. **Email de notificación al admin**: Enviar email con datos completos de solicitud para cotización
3. **WhatsApp de alerta al admin**: Enviar mensaje corto con datos clave y flag de revisión especial

### Criterios de Aceptación
- ✅ Clase `EmailService` con 2 métodos: `enviarEmailCliente` y `enviarEmailAdmin`
- ✅ Clase `WhatsAppService` con 1 método: `enviarWhatsAppAdmin`
- ✅ Templates HTML para emails (confirmación y notificación)
- ✅ Formato de mensaje WhatsApp con emojis y máximo 300 caracteres
- ✅ Uso de variables de entorno para API keys y configuración
- ✅ Manejo de errores con mensajes descriptivos
- ✅ Validación de response de APIs externas
- ✅ JSDoc completo en todos los métodos

## ARQUITECTURA TÉCNICA

### Stack Tecnológico
- Resend API (emails)
- Ultramsg API (WhatsApp)
- TypeScript 5.x

### Dependencias Adicionales
```bash
npm install resend
```

**Nota**: Ultramsg se usa vía fetch HTTP (no requiere SDK)

### Estructura de Archivos
```
lib/
├── services/
│   ├── emailService.ts
│   ├── whatsappService.ts
│   └── notificacionService.ts    (ya existe, actualizar)
└── utils/
    └── emailTemplates.ts         (templates HTML)
```

### Variables de Entorno

Agregar a `.env`:
```env
# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=notificaciones@tuempresa.com
EMAIL_ADMIN=admin@tuempresa.com

# Ultramsg (WhatsApp)
ULTRAMSG_API_KEY=xxxxxxxxxxxxx
ULTRAMSG_INSTANCE_ID=instance12345
WHATSAPP_ADMIN_NUMBER=+573001234567
```

## IMPLEMENTACIÓN

### Archivo: `lib/utils/emailTemplates.ts`

```typescript
/**
 * Templates HTML para emails transaccionales
 * 
 * @module EmailTemplates
 */

import { Solicitud } from '@prisma/client';

/**
 * Template de email de confirmación para el cliente
 * 
 * @param solicitud - Solicitud completada
 * @returns HTML del email
 */
export function templateEmailCliente(solicitud: Solicitud): string {
  const destino = solicitud.destino || 'N/A';
  const tipoServicioTexto = solicitud.tipoServicio === 'URBANO' ? 'Urbano' : 'Nacional';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .solicitud-id {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      margin: 20px 0;
    }
    .detalle {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #667eea;
      border-radius: 5px;
    }
    .detalle strong {
      color: #667eea;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Solicitud Recibida</h1>
  </div>
  
  <div class="content">
    <p>Hola <strong>${solicitud.contacto}</strong>,</p>
    
    <p>Recibimos tu solicitud de cotización para servicio de transporte. Nuestro equipo la revisará y te contactará en las próximas 24 horas.</p>
    
    <div class="solicitud-id">
      Solicitud #${solicitud.id.slice(-8).toUpperCase()}
    </div>
    
    <h3>📋 Resumen de tu Solicitud</h3>
    
    <div class="detalle">
      <strong>🚛 Servicio:</strong> ${tipoServicioTexto}
    </div>
    
    <div class="detalle">
      <strong>📍 Ruta:</strong> ${solicitud.origen} ${solicitud.tipoServicio === 'NACIONAL' ? '→ ' + destino : ''}
    </div>
    
    <div class="detalle">
      <strong>📦 Tipo de Carga:</strong> ${solicitud.tipoCarga.replace(/_/g, ' ')}
    </div>
    
    <div class="detalle">
      <strong>⚖️ Peso:</strong> ${solicitud.pesoKg} kg
    </div>
    
    <div class="detalle">
      <strong>📅 Fecha Requerida:</strong> ${new Date(solicitud.fechaRequerida).toLocaleDateString('es-CO')}
    </div>
    
    <h3>¿Qué sigue?</h3>
    <p>
      1️⃣ Nuestro equipo revisará tu solicitud<br>
      2️⃣ Te enviaremos la cotización por email<br>
      3️⃣ Podemos coordinar los detalles del servicio
    </p>
    
    <p>Si tienes alguna duda, puedes responder a este email o llamarnos.</p>
    
    <p>Saludos,<br>
    <strong>Equipo de [NOMBRE EMPRESA]</strong></p>
  </div>
  
  <div class="footer">
    <p>Este es un email automático, por favor no responder.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Template de email de notificación para el administrador
 * 
 * @param solicitud - Solicitud completada
 * @returns HTML del email
 */
export function templateEmailAdmin(solicitud: Solicitud): string {
  const destino = solicitud.destino || 'N/A';
  const tipoServicioTexto = solicitud.tipoServicio === 'URBANO' ? 'Urbano' : 'Nacional';
  const condiciones = Array.isArray(solicitud.condicionesCargue)
    ? solicitud.condicionesCargue.join(', ')
    : JSON.stringify(solicitud.condicionesCargue);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Courier New', monospace;
      line-height: 1.5;
      color: #333;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .alert {
      background: #ff6b6b;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .card {
      background: white;
      padding: 20px;
      margin: 10px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section-title {
      background: #667eea;
      color: white;
      padding: 10px;
      margin: -20px -20px 15px -20px;
      border-radius: 8px 8px 0 0;
      font-weight: bold;
    }
    .field {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .field:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      width: 180px;
      color: #667eea;
    }
    .value {
      flex: 1;
    }
    .flag-especial {
      background: #ffeaa7;
      border: 2px solid #fdcb6e;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
      color: #d63031;
    }
  </style>
</head>
<body>
  <div class="alert">
    🚨 NUEVA SOLICITUD DE COTIZACIÓN
  </div>
  
  ${solicitud.revisionEspecial ? `
  <div class="flag-especial">
    ⚠️ REQUIERE REVISIÓN ESPECIAL<br>
    <small>(Peso superior a 10 toneladas)</small>
  </div>
  ` : ''}
  
  <div class="card">
    <div class="section-title">📋 DATOS GENERALES</div>
    <div class="field">
      <div class="label">ID Solicitud:</div>
      <div class="value"><strong>#${solicitud.id.slice(-8).toUpperCase()}</strong></div>
    </div>
    <div class="field">
      <div class="label">Fecha de Creación:</div>
      <div class="value">${new Date(solicitud.createdAt).toLocaleString('es-CO')}</div>
    </div>
    <div class="field">
      <div class="label">Estado:</div>
      <div class="value">${solicitud.estado}</div>
    </div>
  </div>
  
  <div class="card">
    <div class="section-title">🚛 DATOS DEL SERVICIO</div>
    <div class="field">
      <div class="label">Tipo de Servicio:</div>
      <div class="value">${tipoServicioTexto}</div>
    </div>
    <div class="field">
      <div class="label">Origen:</div>
      <div class="value">${solicitud.origen}</div>
    </div>
    ${solicitud.tipoServicio === 'NACIONAL' ? `
    <div class="field">
      <div class="label">Destino:</div>
      <div class="value">${destino}</div>
    </div>
    ` : ''}
    <div class="field">
      <div class="label">Fecha Requerida:</div>
      <div class="value">${new Date(solicitud.fechaRequerida).toLocaleDateString('es-CO')}</div>
    </div>
  </div>
  
  <div class="card">
    <div class="section-title">📦 DATOS DE LA CARGA</div>
    <div class="field">
      <div class="label">Tipo de Carga:</div>
      <div class="value">${solicitud.tipoCarga.replace(/_/g, ' ')}</div>
    </div>
    <div class="field">
      <div class="label">Peso:</div>
      <div class="value"><strong>${solicitud.pesoKg} kg</strong></div>
    </div>
    <div class="field">
      <div class="label">Dimensiones:</div>
      <div class="value">${solicitud.dimensiones}</div>
    </div>
    <div class="field">
      <div class="label">Valor Asegurado:</div>
      <div class="value">$${Number(solicitud.valorAsegurado).toLocaleString('es-CO')}</div>
    </div>
  </div>
  
  <div class="card">
    <div class="section-title">🏢 DATOS DEL CLIENTE</div>
    <div class="field">
      <div class="label">Empresa:</div>
      <div class="value"><strong>${solicitud.empresa}</strong></div>
    </div>
    <div class="field">
      <div class="label">Contacto:</div>
      <div class="value">${solicitud.contacto}</div>
    </div>
    <div class="field">
      <div class="label">Teléfono:</div>
      <div class="value"><a href="tel:${solicitud.telefono}">${solicitud.telefono}</a></div>
    </div>
    <div class="field">
      <div class="label">Email:</div>
      <div class="value"><a href="mailto:${solicitud.email}">${solicitud.email}</a></div>
    </div>
  </div>
  
  <div class="card">
    <div class="section-title">⚙️ CONDICIONES DE CARGUE</div>
    <div class="field">
      <div class="value">${condiciones}</div>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 30px; color: #666;">
    <p><strong>Acción requerida:</strong> Revisar y cotizar este servicio</p>
  </div>
</body>
</html>
  `;
}
```

---

### Archivo: `lib/services/emailService.ts`

```typescript
/**
 * Servicio de envío de emails vía Resend API
 * 
 * @module EmailService
 */

import { Resend } from 'resend';
import { Solicitud } from '@prisma/client';
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
```

---

### Archivo: `lib/services/whatsappService.ts`

```typescript
/**
 * Servicio de envío de mensajes WhatsApp vía Ultramsg API
 * 
 * @module WhatsAppService
 */

import { Solicitud } from '@prisma/client';

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
```

---

### Actualizar: `lib/services/notificacionService.ts`

Reemplazar los métodos privados con las implementaciones reales:

```typescript
/**
 * @file lib/services/notificacionService.ts
 * ACTUALIZAR LOS MÉTODOS PRIVADOS CON ESTAS IMPLEMENTACIONES:
 */

  private async enviarEmailCliente(solicitud: Solicitud): Promise<void> {
    const { emailService } = await import('@/lib/services/emailService');
    await emailService.enviarEmailCliente(solicitud);
  }

  private async enviarEmailAdmin(solicitud: Solicitud): Promise<void> {
    const { emailService } = await import('@/lib/services/emailService');
    await emailService.enviarEmailAdmin(solicitud);
  }

  private async enviarWhatsAppAdmin(solicitud: Solicitud): Promise<void> {
    const { whatsappService } = await import('@/lib/services/whatsappService');
    await whatsappService.enviarWhatsAppAdmin(solicitud);
  }
```

## RESTRICCIONES Y CALIDAD

### Performance
- Emails y WhatsApp se envían en paralelo (Promise.all)
- Timeout de 10 segundos por request (configurar en producción)

### Seguridad
- API keys NUNCA en código (solo en .env)
- Validar variables de entorno al inicio
- No exponer errores de APIs externas al cliente

### Testing
- Validar envío en modo desarrollo (usar emails de prueba)
- Resend tiene modo sandbox para testing
- Ultramsg tiene instancia de prueba

### Estándares de Código
- Templates HTML válidos (validar con W3C validator)
- Mensajes WhatsApp legibles en móvil
- JSDoc completo

## ENTREGABLES

### Checklist de Completitud
- [ ] `npm install resend` ejecutado
- [ ] Archivo `lib/utils/emailTemplates.ts` con 2 templates
- [ ] Archivo `lib/services/emailService.ts` implementado
- [ ] Archivo `lib/services/whatsappService.ts` implementado
- [ ] Archivo `lib/services/notificacionService.ts` actualizado
- [ ] Variables de entorno agregadas a `.env` y `.env.example`
- [ ] Validación manual (envío de email/WhatsApp de prueba)
- [ ] Sin errores de TypeScript

### Validación Manual

Script para testing:
```typescript
// test-notifications.ts
import { emailService } from '@/lib/services/emailService';
import { whatsappService } from '@/lib/services/whatsappService';
import { ulid } from 'ulid';

const solicitudMock = {
  id: ulid(),
  empresa: 'ACME Transport Test',
  contacto: 'Juan Test',
  email: 'test@example.com', // Cambiar por email real
  telefono: '+573001234567',
  tipoServicio: 'NACIONAL',
  origen: 'Bogotá',
  destino: 'Medellín',
  tipoCarga: 'MERCANCIA_EMPRESARIAL',
  pesoKg: 5000,
  dimensiones: '200x150x100',
  valorAsegurado: 25000000,
  condicionesCargue: ['muelle', 'montacargas'],
  fechaRequerida: new Date('2026-03-01'),
  estado: 'COMPLETADA',
  revisionEspecial: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function testNotifications() {
  try {
    console.log('📧 Enviando email al cliente...');
    await emailService.enviarEmailCliente(solicitudMock as any);
    
    console.log('📧 Enviando email al admin...');
    await emailService.enviarEmailAdmin(solicitudMock as any);
    
    console.log('📱 Enviando WhatsApp...');
    await whatsappService.enviarWhatsAppAdmin(solicitudMock as any);
    
    console.log('✅ Todas las notificaciones enviadas correctamente');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNotifications();
```

## NOTAS IMPORTANTES

### ⚠️ NO IMPLEMENTAR EN ESTA FASE
- ❌ Endpoints de API (siguiente prompt)
- ❌ Retry logic sofisticado (MVP simple)
- ❌ Queue de mensajes (Redis, Bull)
- ❌ Templates dinámicos desde BD

### ✅ SÍ HACER EN ESTA FASE
- ✅ Implementar servicios de email y WhatsApp
- ✅ Templates HTML funcionales
- ✅ Manejo básico de errores
- ✅ Logging de envíos
- ✅ Validación manual con datos de prueba

### Próximo Paso
Una vez completado este prompt, continuar con **PROMPT 6: CAPA DE API (ENDPOINTS REST)**.

### Troubleshooting Común

**Error**: "Resend API key invalid"  
**Solución**: Validar RESEND_API_KEY en .env, obtener key real en dashboard de Resend

**Error**: "Ultramsg instance not found"  
**Solución**: Validar ULTRAMSG_INSTANCE_ID y ULTRAMSG_API_KEY

**Error**: "Email not sent, domain not verified"  
**Solución**: Verificar dominio en Resend dashboard antes de enviar

---

**Objetivo Final**: Integraciones externas funcionales y listas para ser orquestadas por NotificacionService.
