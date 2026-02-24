# Definición Funcional - Sistema de Cotización de Transporte B2B

**Fecha:** 19 de febrero de 2026  
**Versión:** 1.0  
**Estado:** Inicial

---

## 1. Propósito del Sistema

Capturar información estructurada de solicitudes de transporte B2B para posterior cotización manual.

### Lo que ES el sistema:
- ✅ Formulario inteligente guiado paso a paso
- ✅ Captura y validación de datos de transporte
- ✅ Persistencia y notificación de solicitudes
- ✅ Confirmación al cliente

### Lo que NO ES el sistema:
- ❌ Cotizador automático de precios
- ❌ Sistema de pagos
- ❌ Gestión de flota o tracking
- ❌ Plataforma con login/usuarios
- ❌ Sistema de facturación

---

## 2. Alcance (Scope)

### Incluye:
- Flujo guiado paso a paso
- Validaciones básicas en tiempo real
- Captura de datos relevantes
- Envío a backend
- Persistencia en base de datos
- Confirmación al usuario
- **Notificación por email al administrador**
- **Notificación por WhatsApp al administrador**
- **Email de confirmación al cliente**

### NO Incluye (Fase 1):
- Cotización automática
- Login de usuarios
- Panel administrativo complejo
- **Chat bidireccional por WhatsApp** (solo notificaciones salientes)
- Gestión de flota
- Facturación

---

## 3. Actores del Sistema

| Actor | Rol | Acciones |
|-------|-----|----------|
| **Cliente empresarial** | Externo | Completa solicitud de cotización |
| **Administrador interno** | Interno | Recibe notificaciones, gestiona solicitudes |

---

## 4. Flujo Principal del Usuario (User Journey)

### ⚠️ **PARADIGMA DE UX: EXPERIENCIA CONVERSACIONAL**

**NO es un formulario tradicional**, es una **conversación guiada** donde:
- Cada pregunta aparece de forma natural como un mensaje
- El usuario responde una pregunta a la vez
- Cada respuesta se guarda **inmediatamente** en la base de datos
- La solicitud se crea al inicio y se actualiza progresivamente
- Sensación de hablar con un humano, no llenar un formulario

---

### **Paso 0 – Bienvenida e Inicio de Solicitud**
**Pregunta del sistema:**  
> 👋 "¡Hola! Soy tu asistente de cotización de transporte.  
> Para comenzar, ¿cuál es el nombre de tu empresa?"

**Respuesta esperada:** Texto (nombre empresa)

**Acción técnica tras responder:**
- ✅ **CREAR solicitud en BD** con ID único
- ✅ Guardar `empresa` en registro
- ✅ Solicitud tiene estado `EN_PROGRESO`
- ✅ Avanzar a Paso 1

**Comportamiento visual:**
- Mensaje del sistema aparece animado (fade-in)
- Input de respuesta con placeholder "Escribe aqui..."
- Botón "Continuar" o tecla Enter para avanzar
- Respuesta del usuario se muestra como "burbuja de chat" alineada a la derecha

---

### **Paso 1 – Nombre de Contacto**
**Pregunta:**  
> "Perfecto, [Nombre Empresa]. ¿Y con quién tengo el gusto de hablar?"

**Respuesta:** Texto (nombre contacto)

**Acción tras responder:**
- ✅ **ACTUALIZAR solicitud** → campo `contacto`
- ✅ Avanzar a Paso 2

---

### **Paso 2 – Email**
**Pregunta:**  
> "Excelente, [Nombre]. ¿Cuál es tu correo electrónico para enviarte la cotización?"

**Respuesta:** Email

**Validación:** Formato email válido  
**Acción:** ACTUALIZAR solicitud → `email`

---

### **Paso 3 – Teléfono**
**Pregunta:**  
> "¿Y un número de teléfono donde podamos contactarte?"

**Respuesta:** Teléfono (formato validado)

**Validación:** Formato teléfono válido  
**Acción:** ACTUALIZAR solicitud → `telefono`

---

### **Paso 4 – Tipo de servicio**
**Pregunta:**  
> "Ahora, cuéntame sobre tu envío. ¿Qué tipo de servicio necesitas?"

**Opciones de respuesta (botones grandes):**
- 🏙️ **Urbano** (dentro de la ciudad)
- 🌍 **Nacional** (entre ciudades)

**Acción:** ACTUALIZAR solicitud → `tipo_servicio`

---

### **Paso 5 – Origen**
**Pregunta:**  
> "¿Desde dónde necesitas el servicio de transporte?"

**Respuesta:** Texto (ciudad/dirección origen)

**Validación:** Mínimo 3 caracteres  
**Acción:** ACTUALIZAR solicitud → `origen`

---

### **Paso 6 – Destino (condicional)**
**Pregunta (solo si tipo = Nacional):**  
> "¿Y hacia qué ciudad va el envío?"

**Respuesta:** Texto (ciudad destino)

**Validación:** Mínimo 3 caracteres  
**Acción:** ACTUALIZAR solicitud → `destino`

**Nota:** Si servicio es Urbano, este paso se omite

---

### **Paso 7 – Tipo de carga**
**Pregunta:**  
> "Perfecto. ¿Qué tipo de carga vas a transportar?"

**Opciones (botones):**
- 📦 Mercancía empresarial
- ⚙️ Maquinaria
- 🪑 Muebles embalados

**Validación:** Si usuario intenta escribir "mudanza" o "hogar" → mensaje de rechazo  
**Acción:** ACTUALIZAR solicitud → `tipo_carga`

---

### **Paso 8 – Peso**
**Pregunta:**  
> "¿Cuál es el peso aproximado de tu carga?"

**Respuesta:** Numérico + selector (kg/toneladas)

**Validación:** Valor > 0  
**Acción:** ACTUALIZAR solicitud → `peso_kg`

**Nota:** Si peso > 10 toneladas, marcar flag `revision_especial = true` automáticamente

---

### **Paso 9 – Dimensiones**
**Pregunta:**  
> "¿Cuáles son las dimensiones? Puedes escribirlas en formato largo × alto × ancho (en cm) o descríbelas."

**Respuesta:** Texto estructurado

**Ejemplos:**  
- "200 × 150 × 100"
- "2 metros de largo, 1.5 de alto"

**Acción:** ACTUALIZAR solicitud → `dimensiones`

---

### **Paso 10 – Valor asegurado**
**Pregunta:**  
> "¿Qué valor tiene tu carga para efectos de seguro?"

**Respuesta:** Numérico (COP/USD)

**Validación:** Valor > 0  
**Acción:** ACTUALIZAR solicitud → `valor_asegurado`

---

### **Paso 11 – Condiciones de cargue**
**Pregunta:**  
> "¿Con qué facilidades cuentas en el origen para el cargue? (Puedes elegir varias)"

**Opciones (checkboxes/chips):**
- ✅ Muelle disponible
- ✅ Montacargas disponible
- ✅ Cargue manual

**Validación:** Al menos una seleccionada  
**Acción:** ACTUALIZAR solicitud → `condiciones_cargue`

---

### **Paso 12 – Fecha requerida**
**Pregunta:**  
> "¿Para qué fecha necesitas el servicio?"

**Respuesta:** Date picker

**Validación:** Fecha >= hoy  
**Acción:** ACTUALIZAR solicitud → `fecha_requerida`

---

**Mensaje:**  
> "✅ ¡Listo, [Nombre]! Tu solicitud #[ID] ha sido completada.  
>   
> Nuestro equipo revisará tu información y te contactaremos pronto con la cotización.  
> Te enviamos un resumen por email."

**Acción técnica:**
- ✅ **ACTUALIZAR solicitud** → estado `COMPLETADA`
- ✅ Disparar notificaciones

**Acciones automáticas:**
1. **Email al cliente:** Confirmación de recepción con resumen completo de solicitud
2. **Email al administrador:** Notificación de nueva solicitud con todos los datos
3. **WhatsApp al administrador:** Alerta con ID de solicitud y datos básicos

---

## 4.1. Guardado Progresivo - Arquitectura Técnica

### **Flujo de Persistencia:**

```
Paso 0 (Empresa) → POST /api/solicitudes { empresa } → Crea registro con estado EN_PROGRESO
                                                      → Retorna solicitudId

Paso 1 (Contacto) → PATCH /api/solicitudes/:id { contacto } → Actualiza registro
Paso 2 (Email)    → PATCH /api/solicitudes/:id { email }    → Actualiza registro
Paso 3 (Teléfono) → PATCH /api/solicitudes/:id { telefono } → Actualiza registro
...
Paso 13 (Fecha)   → PATCH /api/solicitudes/:id { fecha, estado: COMPLETADA }
                  → Dispara notificaciones
```

### **Ventajas del guardado progresivo:**
- ✅ Usuario nunca pierde su progreso (puede cerrar y retomar)
- ✅ Datos guardados incluso si hay error técnico
- ✅ Posibilidad de analytics por paso (abandono, tiempo promedio)
- ✅ Backend recibe datos validados gradualmente (mejor UX)
- ✅ Solicitudes incompletas quedan en BD para seguimiento

---

## 5. Reglas Funcionales (Business Rules)

| ID | Regla | Acción |
|----|-------|--------|
| RF-01 | Campos obligatorios faltantes | Bloquear envío, resaltar campos |
| RF-02 | Fecha en el pasado | Mostrar error, requerir fecha válida |
| RF-03 | Valor asegurado = 0 o vacío | Bloquear envío |
| RF-04 | Peso > 10 toneladas | Marcar flag `revision_especial = true` |
| RF-05 | Tipo de carga = "hogar" o "mudanza" | Rechazar automáticamente con mensaje |
| RF-06 | Tipo = Nacional y Destino vacío | Bloquear envío |

---

## 6. Modelo de Datos (Solicitud)

### Tabla: `solicitudes`

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID/String | Sí | Identificador único |
| `fecha_creacion` | Timestamp | Sí | Fecha/hora de creación |
| `tipo_servicio` | Enum | Sí | URBANO / NACIONAL |
| `origen` | String | Sí | Ciudad/dirección origen |
| `destino` | String | Condicional | Obligatorio si Nacional |
| `tipo_carga` | Enum | Sí | MERCANCIA / MAQUINARIA / MUEBLES |
| `peso_kg` | Decimal | Sí | Peso en kilogramos |
| `dimensiones` | String/JSON | Sí | L×A×P o texto |
| `valor_asegurado` | Decimal | Sí | Valor en moneda local |
| `condiciones_cargue` | JSON/Array | Sí | Array de condiciones |
| `fecha_requerida` | Date | Sí | Fecha solicitada |
| `empresa` | String | Sí | Nombre empresa |
| `contacto` | String | Sí | Nombre contacto |
| `telefono` | String | Sí | Teléfono contacto |
| `email` | String | Sí | Email contacto |
| `estado` | Enum | Sí | PENDIENTE por defecto |
| `revision_especial` | Boolean | Sí | Flag para casos especiales |

### Estados posibles:
- `PENDIENTE` (default)
- `COTIZADO`
- `RECHAZADO`
- `CERRADO`

---

## 7. Sistema de Notificaciones

### 7.1 Notificación por Email

#### Email al Cliente (Confirmación)
**Trigger:** Inmediatamente después de crear la solicitud  
**Destinatario:** Email ingresado en el formulario  
**Asunto:** `Solicitud de cotización #{ID} recibida`

**Contenido:**
```
Hola {nombre_contacto},

Recibimos tu solicitud de cotización para servicio de transporte.

Resumen de tu solicitud:
- ID: #{id}
- Tipo: {tipo_servicio}
- Origen: {origen}
- Destino: {destino}
- Fecha requerida: {fecha_requerida}
- Tipo de carga: {tipo_carga}

Nuestro equipo revisará tu solicitud y te contactará en las próximas 24 horas.

Si tienes dudas, responde a este email o llámanos al [TELÉFONO].

Saludos,
Equipo de [NOMBRE EMPRESA]
```

---

#### Email al Administrador (Notificación Interna)
**Trigger:** Inmediatamente después de crear la solicitud  
**Destinatario:** Email configurado del administrador  
**Asunto:** `🚨 Nueva solicitud #{ID} - {tipo_servicio}`

**Contenido:**
```
Nueva solicitud de cotización recibida:

📋 DATOS GENERALES
ID: #{id}
Fecha: {fecha_creacion}
Estado: PENDIENTE
{revision_especial ? "⚠️ REQUIERE REVISIÓN ESPECIAL" : ""}

🚛 SERVICIO
Tipo: {tipo_servicio}
Origen: {origen}
Destino: {destino}
Fecha requerida: {fecha_requerida}

📦 CARGA
Tipo: {tipo_carga}
Peso: {peso_kg} kg
Dimensiones: {dimensiones}
Valor asegurado: ${valor_asegurado}

🏢 CLIENTE
Empresa: {empresa}
Contacto: {contacto}
Teléfono: {telefono}
Email: {email}

⚙️ CONDICIONES
{condiciones_cargue.join(", ")}

[Ver solicitud completa] (link al panel admin futuro)
```

---

### 7.2 Notificación por WhatsApp

#### Mensaje al Administrador
**Trigger:** Inmediatamente después de crear la solicitud  
**Destinatario:** Número de WhatsApp configurado del administrador  
**Método:** API de WhatsApp Business / Twilio / Ultramsg

**Contenido (formato corto):**
```
🚨 *Nueva Cotización #{id}*

📍 {origen} → {destino}
📦 {tipo_carga} - {peso_kg}kg
📅 {fecha_requerida}
💰 Asegurado: ${valor_asegurado}

👤 {empresa}
📞 {telefono}

{revision_especial ? "⚠️ REVISIÓN ESPECIAL" : ""}
```

---

### 7.3 Configuración de Notificaciones

**Variables de entorno requeridas:**
```env
# Email
EMAIL_SERVICE=sendgrid|resend|smtp
EMAIL_API_KEY=xxx
EMAIL_FROM=notificaciones@tuempresa.com
EMAIL_ADMIN=admin@tuempresa.com

# WhatsApp
WHATSAPP_SERVICE=twilio|ultramsg|wappi
WHATSAPP_API_KEY=xxx
WHATSAPP_ADMIN_NUMBER=+57XXXXXXXXXX
```

---

### 7.4 Reglas de Notificaciones

| Evento | Email Cliente | Email Admin | WhatsApp Admin |
|--------|--------------|-------------|----------------|
| Solicitud creada | ✅ Siempre | ✅ Siempre | ✅ Siempre |
| Revisión especial (peso > 10 ton) | ✅ | ✅ + flag | ✅ + emoji ⚠️ |
| Error al guardar | ❌ | ✅ Email error | ✅ |
| Email cliente falla | - | ✅ Notificar fallo | ✅ |

---

### 7.5 Manejo de Fallos

**Prioridad de envío:**
1. Guardar en DB (crítico)
2. Email al cliente (importante)
3. Email al admin (importante)
4. WhatsApp al admin (nice to have)

**Comportamiento:**
- Si falla email cliente → Log error + notificar admin
- Si falla email admin → Log error + reintento (3 veces)
- Si falla WhatsApp → Log error, no bloquear proceso
- **La solicitud SIEMPRE se guarda, las notificaciones son secundarias**

---

### 7.6 Servicios Recomendados

#### Para Email:
| Servicio | Tier Gratuito | Facilidad | Recomendado |
|----------|--------------|-----------|-------------|
| **Resend** | 3,000/mes | ⭐⭐⭐⭐⭐ | ✅ **MVP** |
| SendGrid | 100/día | ⭐⭐⭐⭐ | ✅ Escalable |
| AWS SES | 62,000/mes | ⭐⭐⭐ | ✅ Producción |
| SMTP Gmail | 500/día | ⭐⭐ | ❌ No empresarial |

#### Para WhatsApp:
| Servicio | Costo | Facilidad | Recomendado |
|----------|-------|-----------|-------------|
| **Twilio** | $0.005/msg | ⭐⭐⭐⭐⭐ | ✅ **Oficial** |
| Ultramsg | $10/mes | ⭐⭐⭐⭐ | ✅ Rápido setup |
| Wappi | $5/mes | ⭐⭐⭐⭐ | ✅ Económico |
| WhatsApp Business API | Gratis* | ⭐⭐ | Complejo |

*Requiere proceso de aprobación

---

## 8. Requisitos No Funcionales

| Código | Requisito | Meta |
|--------|-----------|------|
| RNF-01 | **Seguridad** | HTTPS obligatorio |
| RNF-02 | **Performance** | Tiempo de carga < 3 segundos |
| RNF-03 | **Responsive** | Funcionar en móvil (crítico) |
| RNF-04 | **Acceso** | No requerir registro |
| RNF-05 | **Disponibilidad** | 99% uptime (básico) |
| RNF-06 | **Compatibilidad** | Chrome, Safari, Firefox últimas 2 versiones |
| RNF-07 | **Temas** | Sistema de colores corporativos configurable |

---

## 9. Sistema de Diseño Visual y Personalización

### 9.1. Paradigma de Diseño: Conversacional

**Componentes visuales:**
- 💬 **Burbujas de chat** para preguntas del sistema (alineadas a la izquierda)
- 💬 **Burbujas de respuesta** del usuario (alineadas a la derecha)
- 🎯 **Botones grandes** con emojis/iconos para opciones de respuesta
- ✅ **Indicador de progreso** discreto (ej: "Paso 5 de 13")
- ⏳ **Animaciones suaves** entre transiciones (fade-in, slide-up)
- 📱 **Mobile-first** (mayoría de usuarios en celular)

### 9.2. Sistema de Temas y Colores Corporativos

#### **¿Cuándo definir colores?**
- **MVP/Inicio:** Usar tema por defecto (colores neutros profesionales)
- **Personalización:** Se puede cambiar en CUALQUIER momento sin afectar funcionalidad
- **Recomendación:** Definir colores corporativos después del primer despliegue

#### **Arquitectura de Temas:**

El sistema usa **CSS Variables** para máxima flexibilidad:

```css
:root {
  /* Colores primarios - CAMBIAR AQUÍ para personalizar */
  --color-primary: 220 90% 56%;        /* Azul por defecto */
  --color-primary-hover: 220 85% 48%;  /* Azul oscuro hover */
  
  /* Colores secundarios */
  --color-secondary: 142 76% 36%;      /* Verde éxito */
  --color-accent: 24 95% 53%;          /* Naranja alertas */
  
  /* Colores funcionales */
  --color-background: 0 0% 100%;       /* Blanco */
  --color-text: 222 47% 11%;           /* Gris oscuro texto */
  --color-border: 214 32% 91%;         /* Gris claro bordes */
  
  /* Chat bubbles */
  --chat-bot-bg: 220 13% 91%;          /* Gris claro (sistema) */
  --chat-user-bg: var(--color-primary); /* Color primario (usuario) */
}
```

#### **¿Cómo cambiar colores corporativos?**

**Opción 1 - Archivo de configuración (Recomendado):**
```typescript
// config/theme.ts
export const brandColors = {
  primary: '#3B82F6',      // Azul corporativo
  secondary: '#10B981',    // Verde secundario
  accent: '#F59E0B',       // Naranja acentos
}
```

**Opción 2 - Variable de entorno:**
```env
NEXT_PUBLIC_BRAND_COLOR_PRIMARY=#3B82F6
NEXT_PUBLIC_BRAND_COLOR_SECONDARY=#10B981
```

**Opción 3 - Panel de administración (Futuro):**
- Interfaz gráfica para cambiar colores sin código
- Preview en tiempo real
- Guardar temas personalizados

#### **Ventajas de este sistema:**
- ✅ **Cambio instantáneo:** Modificar 1 archivo y listo
- ✅ **Sin reescribir código:** CSS variables se propagan automáticamente
- ✅ **Múltiples temas:** Puedes tener tema claro/oscuro/corporativo
- ✅ **Consistencia:** Todos los componentes usan las mismas variables
- ✅ **Fácil prueba:** Cambiar colores en desarrollo y ver resultado inmediato

### 9.3. Esquema de Colores por Defecto (MVP)

| Elemento | Color | Uso |
|----------|-------|-----|
| **Primario** | Azul #3B82F6 | Botones principales, enlaces, respuestas usuario |
| **Secundario** | Verde #10B981 | Mensajes de éxito, confirmaciones |
| **Acento** | Naranja #F59E0B | Alertas, validaciones pendientes |
| **Error** | Rojo #EF4444 | Mensajes de error, validaciones fallidas |
| **Neutral** | Gris #64748B | Texto secundario, bordes |
| **Background** | Blanco #FFFFFF | Fondo principal |
| **Chat Sistema** | Gris claro #F1F5F9 | Burbujas de preguntas del bot |

**Nota:** Estos colores son temporales y **100% personalizables** sin cambiar código funcional.

### 9.4. Tipografía Recomendada

| Elemento | Fuente | Peso | Tamaño |
|----------|--------|------|--------|
| Preguntas del bot | Inter / Roboto | 500 | 16-18px |
| Respuestas usuario | Inter / Roboto | 400 | 16px |
| Botones | Inter / Roboto | 600 | 14-16px |
| Títulos | Inter / Roboto | 700 | 24-32px |

**Configuración:** Se define en `tailwind.config.ts` y se cambia globalmente.

---

## 10. Métricas de Negocio

### Críticas:
1. **Número de solicitudes por día**
2. **Tasa de conversión** = (enviados / iniciados) × 100
3. **Tiempo promedio de respuesta** (interno)

### Secundarias:
- Tasa de abandono por paso
- Dispositivo más usado (móvil/desktop)
- Errores de validación más comunes

---

## 11. Principios de Desarrollo

### ✅ HACER:
- Diseño simple y limpio
- Formulario progresivo (paso a paso)
- Validaciones en tiempo real
- Mensajes de error claros
- Responsive mobile-first

### ❌ NO HACER:
- Animaciones complejas innecesarias
- Arquitectura de microservicios
- Autenticación prematura
- Cotizador automático (aún)
- Panel admin complejo (fase 1)

---

## 12. Criterios de Éxito (MVP)

| Criterio | Métrica |
|----------|---------|
| Funcionalidad completa | 12 pasos funcionando end-to-end |
| Usabilidad móvil | 100% funcional en smartphone |
| Validaciones | Todas las RF implementadas |
| Persistencia | Datos guardados correctamente |
| **Notificaciones email** | Cliente y admin reciben emails |
| **Notificaciones WhatsApp** | Admin recibe mensaje por solicitud |
| Performance | < 3s tiempo de carga |
| Tasa de entrega email | > 95% emails enviados correctamente |

---

## 13. Fuera de Alcance (Fases Futuras)

- Panel administrativo avanzado
- Cotización automática con IA
- Integración WhatsApp Business
- Sistema de tracking en tiempo real
- Gestión de flota
- Facturación electrónica
- Múltiples idiomas
- Login de clientes recurrentes

---

## 14. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Feature creep | Alta | Alto | Seguir estrictamente este documento |
| Sobre-ingeniería | Media | Alto | Stack simple, validar antes de escalar |
| UX móvil pobre | Media | Alto | Testing en dispositivos reales |
| Falta de validación temprana | Alta | Medio | Métricas desde día 1 |
| **Fallos en notificaciones** | Media | Medio | Sistema de reintentos + logs detallados |
| **Emails en spam** | Media | Alto | Usar servicio reputado + SPF/DKIM configurado |

---

## Anexos

### A. Wireframes de Referencia
(Pendiente - a crear en fase de diseño)

### B. Mensajes de Error
(Pendiente - definir copy según marca)

### C. Notificaciones
- **Email a admin:** Plantilla con datos de solicitud completos
- **Email a cliente:** Confirmación de recepción con resumen
- **WhatsApp a admin:** Mensaje corto con datos clave + ID solicitud
- **Templates:** Ver sección 7 para contenido exacto

---

**Aprobaciones:**

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Product Owner | - | - | - |
| Tech Lead | - | - | - |

---

**Control de versiones:**

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-02-19 | Initial | Documento inicial |
