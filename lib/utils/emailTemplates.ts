/**
 * Templates HTML para emails transaccionales
 *
 * A-3: todos los campos de usuario se pasan por `safe()` antes de
 * interpolarse en el HTML para prevenir inyección de marcado.
 *
 * @module EmailTemplates
 */

import { Solicitud } from '.prisma/client';

/**
 * Escapa caracteres HTML especiales en un valor de usuario.
 * Convierte <, >, &, ", ' en sus entidades HTML equivalentes.
 * Acepta cualquier tipo y lo convierte a string via String().
 */
function safe(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

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
    <p>Hola <strong>${safe(solicitud.contacto)}</strong>,</p>
    
    <p>Recibimos tu solicitud de cotización para servicio de transporte. Nuestro equipo la revisará y te contactará en las próximas 24 horas.</p>
    
    <div class="solicitud-id">
      Solicitud #${safe(solicitud.id.slice(-8).toUpperCase())}
    </div>
    
    <h3>📋 Resumen de tu Solicitud</h3>
    
    <div class="detalle">
      <strong>🚛 Servicio:</strong> ${safe(tipoServicioTexto)}
    </div>
    
    <div class="detalle">
      <strong>📍 Ruta:</strong> ${safe(solicitud.origen)} ${solicitud.tipoServicio === 'NACIONAL' ? '→ ' + safe(destino) : ''}
    </div>
    
    <div class="detalle">
      <strong>📦 Tipo de Carga:</strong> ${safe(solicitud.tipoCarga.replace(/_/g, ' '))}
    </div>
    
    <div class="detalle">
      <strong>⚖️ Peso:</strong> ${safe(solicitud.pesoKg)} kg
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
      <div class="value">${safe(tipoServicioTexto)}</div>
    </div>
    <div class="field">
      <div class="label">Origen:</div>
      <div class="value">${safe(solicitud.origen)}</div>
    </div>
    ${solicitud.tipoServicio === 'NACIONAL' ? `
    <div class="field">
      <div class="label">Destino:</div>
      <div class="value">${safe(destino)}</div>
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
      <div class="value">${safe(solicitud.tipoCarga.replace(/_/g, ' '))}
    </div>
    <div class="field">
      <div class="label">Peso:</div>
      <div class="value"><strong>${solicitud.pesoKg} kg</strong></div>
    </div>
    <div class="field">
      <div class="label">Dimensiones:</div>
      <div class="value">
        ${Number(solicitud.dimLargoCm)} × ${Number(solicitud.dimAnchoCm)} × ${Number(solicitud.dimAltoCm)} cm
        <br>
        <small style="color: #64748b;">Volumen: ${((Number(solicitud.dimLargoCm) * Number(solicitud.dimAnchoCm) * Number(solicitud.dimAltoCm)) / 1000000).toFixed(2)} m³</small>
      </div>
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
      <div class="value"><strong>${safe(solicitud.empresa)}</strong></div>
    </div>
    <div class="field">
      <div class="label">Contacto:</div>
      <div class="value">${safe(solicitud.contacto)}</div>
    </div>
    <div class="field">
      <div class="label">Teléfono:</div>
      <div class="value"><a href="tel:${safe(solicitud.telefono)}">${safe(solicitud.telefono)}</a></div>
    </div>
    <div class="field">
      <div class="label">Email:</div>
      <div class="value"><a href="mailto:${safe(solicitud.email)}">${safe(solicitud.email)}</a></div>
    </div>
  </div>
  
  <div class="card">
    <div class="section-title">⚙️ CONDICIONES DE CARGUE</div>
    <div class="field">
      <div class="value">${safe(condiciones)}</div>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 30px; color: #666;">
    <p><strong>Acción requerida:</strong> Revisar y cotizar este servicio</p>
  </div>
</body>
</html>
  `;
}
