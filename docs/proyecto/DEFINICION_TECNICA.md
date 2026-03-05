# Definición Técnica - Sistema de Cotización de Transporte B2B

**Fecha:** 19 de febrero de 2026  
**Versión:** 1.0  
**Tipo:** Documento de Arquitectura y Especificación Técnica

---

## 📋 Índice

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Especificación de APIs](#5-especificación-de-apis)
6. [Capa de Servicios](#6-capa-de-servicios)
7. [Capa de Repositorios](#7-capa-de-repositorios)
8. [Capa de Validación](#8-capa-de-validación)
9. [Componentes Frontend](#9-componentes-frontend)
10. [Sistema de Temas y Personalización Visual](#10-sistema-de-temas-y-personalización-visual)
11. [Flujos de Negocio](#11-flujos-de-negocio)
12. [Manejo de Errores](#12-manejo-de-errores)
13. [Seguridad](#13-seguridad)
14. [Integraciones Externas](#14-integraciones-externas)

---

## 1. Visión General del Sistema

### 1.1. Propósito
Sistema web para captura estructurada de solicitudes de cotización de transporte B2B, que recolecta información del cliente, valida datos según reglas de negocio, persiste la información y envía notificaciones automáticas.

### 1.2. Alcance Técnico
- Aplicación web full-stack con Next.js
- Backend API RESTful integrado
- Base de datos PostgreSQL relacional
- Integraciones con servicios de terceros (Email y WhatsApp)
- Interfaz responsive mobile-first

### 1.3. Usuarios del Sistema
- **Cliente empresarial:** Accede al formulario público sin autenticación
- **Administrador interno:** Recibe notificaciones de nuevas solicitudes

---

## 2. Arquitectura del Sistema

### 2.1. Patrón Arquitectónico
**Clean Architecture con separación en capas**

```
┌─────────────────────────────────────────────────┐
│  Presentation Layer (UI)                        │
│  - Páginas Next.js (app/)                       │
│  - Componentes React (components/)              │
│  - Gestión de estado local                      │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/JSON
┌──────────────────▼──────────────────────────────┐
│  API Layer (Controllers)                        │
│  - API Routes (app/api/)                        │
│  - Validación de requests                       │
│  - Serialización respuestas                     │
└──────────────────┬──────────────────────────────┘
                   │ Function calls
┌──────────────────▼──────────────────────────────┐
│  Business Logic Layer (Services)                │
│  - Servicios de dominio (lib/services/)         │
│  - Reglas de negocio                            │
│  - Orquestación de operaciones                  │
└──────────────────┬──────────────────────────────┘
                   │ Data operations
┌──────────────────▼──────────────────────────────┐
│  Data Access Layer (Repositories)               │
│  - Repositorios (lib/repositories/)             │
│  - Abstracción de Prisma ORM                    │
│  - Queries optimizadas                          │
└──────────────────┬──────────────────────────────┘
                   │ SQL queries
┌──────────────────▼──────────────────────────────┐
│  Data Layer (Database)                          │
│  - PostgreSQL                                   │
│  - Esquema relacional                           │
└─────────────────────────────────────────────────┘
```

### 2.2. Principios de Diseño

#### Separation of Concerns
Cada capa tiene responsabilidades específicas y no conoce la implementación de otras capas.

#### Dependency Inversion
Las capas superiores dependen de abstracciones, no de implementaciones concretas.

#### Single Responsibility
Cada módulo tiene una única razón para cambiar.

#### DRY (Don't Repeat Yourself)
Lógica compartida mediante funciones utilitarias y tipos TypeScript.

---

## 3. Stack Tecnológico

### 3.1. Frontend
| Tecnología | Versión | Rol |
|------------|---------|-----|
| **Next.js** | 15.x | Framework full-stack, SSR/SSG |
| **React** | 19.x | Biblioteca UI |
| **TypeScript** | 5.x | Lenguaje tipado |
| **Tailwind CSS** | 4.x | Framework CSS utility-first |
| **shadcn/ui** | Latest | Sistema de componentes UI |
| **React Hook Form** | 7.x | Gestión de formularios |
| **Zod** | 3.x | Validación de schemas |

### 3.2. Backend
| Tecnología | Versión | Rol |
|------------|---------|-----|
| **Node.js** | 20 LTS | Runtime JavaScript |
| **Next.js API Routes** | 15.x | Endpoints REST |
| **Prisma** | 5.x | ORM para PostgreSQL |
| **Zod** | 3.x | Validación backend |
| **ulid** | Latest | Generación de IDs únicos |

### 3.3. Base de Datos
| Tecnología | Versión | Hosting |
|------------|---------|---------|
| **PostgreSQL** | 16.x | Supabase (gestionado) |

### 3.4. Servicios Externos
| Servicio | Propósito | Plan |
|----------|-----------|------|
| **Resend** | Envío de emails | 3,000/mes gratis |
| **Ultramsg** | Notificaciones WhatsApp | $10/mes |
| **Vercel** | Hosting y deployment | Deploy gratis |

---

## 4. Modelo de Datos

### 4.1. Entidad Principal: Solicitud

**Tabla:** `solicitudes`

#### Campos de Identificación
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | String (ULID) | Sí | Identificador único de 26 caracteres |
| `fechaCreacion` | DateTime | Sí | Timestamp de creación automático |

#### Campos de Servicio
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `tipoServicio` | Enum | Sí | URBANO o NACIONAL |
| `origen` | String | Sí | Ciudad/dirección de origen (max 200 chars) |
| `destino` | String | Condicional | Obligatorio si tipoServicio = NACIONAL |

#### Campos de Carga
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `tipoCarga` | Enum | Sí | MERCANCIA_EMPRESARIAL, MAQUINARIA, MUEBLES_EMBALADOS |
| `pesoKg` | Decimal(10,2) | Sí | Peso en kilogramos |
| `dimensiones` | Text | Sí | Formato "L×A×P cm" o JSON |
| `valorAsegurado` | Decimal(15,2) | Sí | Valor en moneda local |

#### Campos de Condiciones
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `condicionesCargue` | JSON | Sí | Array de strings: ["muelle", "montacargas", "manual"] |
| `fechaRequerida` | Date | Sí | Fecha solicitada para el servicio |

#### Campos de Cliente
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `empresa` | String | Sí | Nombre de la empresa (max 200 chars) |
| `contacto` | String | Sí | Nombre del contacto (max 200 chars) |
| `telefono` | String | Sí | Teléfono con formato internacional |
| `email` | String | Sí | Email válido (max 100 chars) |

#### Campos de Estado
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `estado` | Enum | Sí | PENDIENTE (default), COTIZADO, RECHAZADO, CERRADO |
| `revisionEspecial` | Boolean | Sí | Flag automático si peso > 10 toneladas |

#### Metadata
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `createdAt` | DateTime | Sí | Timestamp de creación |
| `updatedAt` | DateTime | Sí | Timestamp de última actualización |

### 4.2. Enumeraciones

#### TipoServicio
```
URBANO    - Transporte dentro de una ciudad
NACIONAL  - Transporte entre ciudades
```

#### TipoCarga
```
MERCANCIA_EMPRESARIAL  - Productos empresariales
MAQUINARIA             - Equipos y maquinaria industrial
MUEBLES_EMBALADOS      - Muebles de oficina embalados
```

#### EstadoSolicitud
```
PENDIENTE  - Estado inicial, en espera de cotización
COTIZADO   - Cotización enviada al cliente
RECHAZADO  - Solicitud rechazada (fuera de alcance)
CERRADO    - Proceso finalizado
```

### 4.3. Índices de Base de Datos
- **Primary Key:** `id`
- **Índices secundarios:**
  - `estado` (búsquedas frecuentes por estado)
  - `fechaCreacion` (ordenamiento temporal)
  - `email` (búsqueda de solicitudes por cliente)
  - `empresa` (búsqueda por empresa)

### 4.4. Relaciones
**Nota:** En la fase MVP no existen relaciones. Modelo de datos plano.

**Futuras extensiones:**
- Relación `Solicitud → Cotizacion` (1:N)
- Relación `Solicitud → Usuario` (N:1)
- Relación `Solicitud → Tracking` (1:N)

---

## 5. Especificación de APIs

### 5.1. Endpoint: Crear Solicitud

#### Información General
- **Método:** POST
- **Ruta:** `/api/solicitudes`
- **Autenticación:** No requerida (público)
- **Content-Type:** application/json

#### Request Body
```
{
  tipoServicio: "URBANO" | "NACIONAL"
  origen: string (min: 3, max: 200)
  destino?: string (min: 3, max: 200)
  tipoCarga: "MERCANCIA_EMPRESARIAL" | "MAQUINARIA" | "MUEBLES_EMBALADOS"
  pesoKg: number (min: 0.01, max: 50000)
  dimensiones: string (min: 5)
  valorAsegurado: number (min: 0.01)
  condicionesCargue: string[] (valores: "muelle" | "montacargas" | "manual")
  fechaRequerida: string (ISO 8601 date, >= hoy)
  empresa: string (min: 3, max: 200)
  contacto: string (min: 3, max: 200)
  telefono: string (formato: +[código][número])
  email: string (email válido)
}
```

#### Response Success (201 Created)
```
{
  success: true
  data: {
    id: string
    fechaCreacion: string (ISO 8601)
    estado: "PENDIENTE"
    revisionEspecial: boolean
    [... resto de campos enviados]
  }
  message: string
}
```

#### Response Error (400 Bad Request)
```
{
  success: false
  error: string
  details?: [
    {
      field: string
      message: string
    }
  ]
}
```

#### Response Error (500 Internal Server Error)
```
{
  success: false
  error: "Error interno del servidor"
}
```

#### Reglas de Negocio
1. Si `tipoServicio` = "NACIONAL", `destino` es obligatorio
2. Si incluye palabra "hogar", rechazar con error
3. Si `pesoKg` > 10000, marcar `revisionEspecial` = true
4. Si `pesoKg` > 50000, rechazar con error
5. `fechaRequerida` no puede ser en el pasado

#### Operaciones Posteriores
- Persistir en base de datos
- Enviar email de confirmación al cliente
- Enviar email de notificación al administrador
- Enviar WhatsApp al administrador

---

### 5.2. Endpoint: Actualizar Solicitud (Guardado Progresivo)

#### Información General
- **Método:** PATCH
- **Ruta:** `/api/solicitudes/:id`
- **Autenticación:** No requerida
- **Content-Type:** application/json
- **Propósito:** Actualizar una solicitud existente con datos parciales (guardado progresivo)

#### Path Parameters
- `id`: String (ULID de 26 caracteres)

#### Request Body (Todos los campos opcionales)
```
{
  contacto?: string
  email?: string
  telefono?: string
  tipoServicio?: "URBANO" | "NACIONAL"
  origen?: string
  destino?: string
  tipoCarga?: "MERCANCIA_EMPRESARIAL" | "MAQUINARIA" | "MUEBLES_EMBALADOS"
  pesoKg?: number
  dimensiones?: string
  valorAsegurado?: number
  condicionesCargue?: string[]
  fechaRequerida?: string
  estado?: "EN_PROGRESO" | "COMPLETADA"
}
```

#### Response Success (200 OK)
```
{
  success: true
  data: {
    id: string
    [... solicitud actualizada con todos sus campos]
  }
  message: "Solicitud actualizada correctamente"
}
```

#### Response Error (404 Not Found)
```
{
  success: false
  error: "Solicitud no encontrada"
}
```

#### Response Error (400 Bad Request)
```
{
  success: false
  error: "Datos inválidos"
  details?: [{ field: string, message: string }]
}
```

#### Comportamiento Especial
- **Si `estado` cambia a "COMPLETADA"**: Disparar notificaciones (email + WhatsApp)
- **Validaciones parciales**: Solo se validan los campos enviados
- **Campos calculados**: Si se actualiza `pesoKg` y supera 10,000kg → actualizar `revisionEspecial` automáticamente

#### Uso en Flujo Conversacional
```
POST /api/solicitudes { empresa: "ACME" }           → Crea solicitud
PATCH /api/solicitudes/01JXX { contacto: "Juan" }   → Actualiza
PATCH /api/solicitudes/01JXX { email: "..." }       → Actualiza
...
PATCH /api/solicitudes/01JXX { 
  fechaRequerida: "2026-03-01",
  estado: "COMPLETADA" 
} → Actualiza y dispara notificaciones
```

---

### 5.3. Endpoint: Obtener Solicitud

#### Información General
- **Método:** GET
- **Ruta:** `/api/solicitudes/:id`
- **Autenticación:** No requerida
- **Content-Type:** application/json

#### Path Parameters
- `id`: String (ULID de 26 caracteres)

#### Response Success (200 OK)
```
{
  success: true
  data: {
    id: string
    [... todos los campos de la solicitud]
  }
}
```

#### Response Error (404 Not Found)
```
{
  success: false
  error: "Solicitud no encontrada"
}
```

#### Response Error (400 Bad Request)
```
{
  success: false
  error: "ID inválido"
}
```

---

### 5.4. Endpoint: Health Check

#### Información General
- **Método:** GET
- **Ruta:** `/api/health`
- **Autenticación:** No requerida
- **Propósito:** Verificar disponibilidad del servidor y conectividad a base de datos

#### Response Success (200 OK)
```
{
  status: "ok"
  timestamp: string (ISO 8601)
  database: "connected"
  version: string
}
```

#### Response Error (503 Service Unavailable)
```
{
  status: "error"
  timestamp: string (ISO 8601)
  database: "disconnected"
  error: string
}
```

---

## 6. Capa de Servicios

### 6.1. SolicitudService

**Archivo:** `lib/services/solicitudService.ts`

#### Responsabilidades
1. Implementar todas las reglas de negocio
2. Validar datos entrantes con Zod
3. Coordinar operaciones entre repositorio y otros servicios
4. Calcular campos derivados (ej: revisionEspecial)
5. Gestionar transacciones lógicas

#### Métodos Públicos

##### crearSolicitud
- **Entrada:** Datos de solicitud sin validar
- **Salida:** Solicitud creada con ID
- **Excepciones:** ZodError (validación), Error (regla de negocio)
- **Operaciones:**
  1. Validar con schema Zod
  2. Aplicar reglas de negocio (RN-01 a RN-04)
  3. Calcular flag revisionEspecial
  4. Generar ID único (ULID)
  5. Persistir vía repositorio
  6. Disparar notificaciones (asíncrono, no bloqueante)
  7. Retornar solicitud creada

##### obtenerSolicitudPorId
- **Entrada:** ID de solicitud
- **Salida:** Solicitud o null
- **Excepciones:** Error si ID inválido
- **Operaciones:**
  1. Validar formato ID (26 caracteres)
  2. Consultar repositorio
  3. Retornar resultado

##### listarPorEstado
- **Entrada:** Estado (enum)
- **Salida:** Array de solicitudes
- **Operaciones:**
  1. Delegar a repositorio
  2. Retornar lista ordenada por fechaDesc

##### actualizarEstado
- **Entrada:** ID, nuevo estado
- **Salida:** Solicitud actualizada
- **Excepciones:** Error si transición no permitida
- **Operaciones:**
  1. Validar transición de estados
  2. Actualizar vía repositorio
  3. Retornar solicitud actualizada

#### Reglas de Negocio Implementadas

**RN-01:** Si tipo servicio = NACIONAL, destino es obligatorio
**RN-02:** Rechazar si tipo de carga contiene "hogar" o "mudanza"
**RN-03:** Peso máximo permitido: 50,000 kg
**RN-04:** Fecha requerida debe ser >= hoy
**RN-05:** Si peso > 10,000 kg, activar flag revisionEspecial

#### Transiciones de Estado Permitidas

```
PENDIENTE → COTIZADO
PENDIENTE → RECHAZADO
COTIZADO → CERRADO
COTIZADO → RECHAZADO
RECHAZADO → [ninguno] (terminal)
CERRADO → [ninguno] (terminal)
```

---

### 6.2. NotificacionService

**Archivo:** `lib/services/notificacionService.ts`

#### Responsabilidades
1. Orquestar envío de todas las notificaciones
2. Manejar fallos parciales sin interrumpir flujo
3. Logging de notificaciones enviadas/fallidas
4. Respetar prioridades de envío

#### Métodos Públicos

##### enviarNotificaciones
- **Entrada:** Solicitud creada
- **Salida:** Promise<void>
- **Excepciones:** Ninguna (errores logueados)
- **Operaciones:**
  1. Enviar email cliente (prioridad alta)
  2. Enviar email admin (prioridad alta)
  3. Enviar WhatsApp admin (prioridad media)
  4. Loguear resultados

**Nota Importante:** Si alguna notificación falla, se loguea el error pero NO se lanza excepción. Las notificaciones son operaciones secundarias que no deben bloquear el flujo principal.

---

### 6.3. EmailService

**Archivo:** `lib/services/emailService.ts`

#### Responsabilidades
1. Enviar emails vía API de Resend
2. Generar contenido HTML de emails
3. Personalizar templates con datos de solicitud
4. Manejar errores de envío

#### Métodos Públicos

##### enviarEmailCliente
- **Entrada:** Solicitud
- **Salida:** Promise<void>
- **Excepciones:** Error si falla envío
- **Contenido:** Confirmación de recepción con resumen de solicitud

##### enviarEmailAdmin
- **Entrada:** Solicitud
- **Salida:** Promise<void>
- **Excepciones:** Error si falla envío
- **Contenido:** Notificación con todos los datos de solicitud
- **Variaciones:** Asunto diferente si revisionEspecial = true

#### Dependencias Externas
- Resend API
- Templates HTML (lib/utils/emailTemplates.ts)

---

### 6.4. WhatsAppService

**Archivo:** `lib/services/whatsappService.ts`

#### Responsabilidades
1. Enviar mensajes vía API de Ultramsg
2. Formatear mensajes concisos para WhatsApp
3. Manejar errores de envío

#### Métodos Públicos

##### enviarWhatsAppAdmin
- **Entrada:** Solicitud
- **Salida:** Promise<void>
- **Excepciones:** Error si falla envío
- **Formato:** Mensaje de texto con emojis, máximo 300 caracteres
- **Contenido:**
  - ID solicitud
  - Ruta (origen → destino)
  - Tipo y peso de carga
  - Fecha requerida
  - Cliente y teléfono
  - Flag revisionEspecial si aplica

#### Dependencias Externas
- Ultramsg API

---

## 7. Capa de Repositorios

### 7.1. SolicitudRepository

**Archivo:** `lib/repositories/solicitudRepository.ts`

#### Responsabilidades
1. Abstracción de acceso a datos (Prisma)
2. Operaciones CRUD sobre tabla solicitudes
3. Queries optimizadas con índices
4. Mapeo entre modelos Prisma y tipos de dominio

#### Métodos Públicos

##### guardarSolicitud
- **Entrada:** Objeto solicitud completo
- **Salida:** Solicitud guardada con timestamps
- **Operación:** INSERT en tabla solicitudes

##### obtenerPorId
- **Entrada:** ID (string)
- **Salida:** Solicitud o null
- **Operación:** SELECT por primary key

##### listarPorEstado
- **Entrada:** Estado (enum)
- **Salida:** Array de solicitudes
- **Operación:** SELECT con filtro WHERE estado = X, ORDER BY fechaCreacion DESC
- **Optimización:** Usa índice en campo estado

##### listarRecientes
- **Entrada:** Límite (número, default 10)
- **Salida:** Array de solicitudes
- **Operación:** SELECT con ORDER BY fechaCreacion DESC LIMIT N

##### actualizarEstado
- **Entrada:** ID, nuevo estado
- **Salida:** Solicitud actualizada
- **Operación:** UPDATE campo estado WHERE id = X

##### contarPorEstado
- **Entrada:** Estado (enum)
- **Salida:** Número
- **Operación:** SELECT COUNT(*) WHERE estado = X

##### buscarPorEmail
- **Entrada:** Email (string)
- **Salida:** Array de solicitudes
- **Operación:** SELECT WHERE email = X ORDER BY fechaCreacion DESC
- **Optimización:** Usa índice en campo email

#### Principios
- **Sin lógica de negocio:** Solo operaciones de datos
- **Manejo de errores:** Propaga excepciones de Prisma
- **Transacciones:** Usa cliente Prisma para transacciones cuando necesario

---

## 8. Capa de Validación

### 8.1. Schemas Zod

**Archivo:** `lib/validations/schemas.ts`

#### Responsabilidades
1. Definir estructura de datos válidos
2. Reglas de validación de campos
3. Validaciones cruzadas entre campos
4. Mensajes de error descriptivos
5. Transformaciones de datos

### 8.2. Schema: solicitudSchema

#### Validaciones por Campo

**tipoServicio**
- Tipo: Enum ["URBANO", "NACIONAL"]
- Obligatorio: Sí
- Error: "Tipo de servicio inválido"

**origen**
- Tipo: String
- Longitud: Min 3, Max 200
- Obligatorio: Sí
- Error: "Origen debe tener mínimo 3 caracteres"

**destino**
- Tipo: String
- Longitud: Min 3, Max 200
- Obligatorio: Condicional (si tipoServicio = NACIONAL)
- Error: "Destino es obligatorio para servicio nacional"

**tipoCarga**
- Tipo: Enum ["MERCANCIA_EMPRESARIAL", "MAQUINARIA", "MUEBLES_EMBALADOS"]
- Obligatorio: Sí
- Error: "Tipo de carga inválido"

**pesoKg**
- Tipo: Number
- Rango: > 0, <= 50000
- Obligatorio: Sí
- Error: "Peso debe ser mayor a 0" o "Peso máximo: 50,000 kg"

**dimensiones**
- Tipo: String
- Longitud: Min 5
- Obligatorio: Sí
- Error: "Dimensiones inválidas"

**valorAsegurado**
- Tipo: Number
- Rango: > 0
- Obligatorio: Sí
- Error: "Valor asegurado debe ser mayor a 0"

**condicionesCargue**
- Tipo: Array de Enum ["muelle", "montacargas", "manual"]
- Longitud: Min 1
- Obligatorio: Sí
- Error: "Seleccione al menos una condición de cargue"

**fechaRequerida**
- Tipo: String (ISO 8601 date)
- Validación: >= fecha actual (ignorando hora)
- Obligatorio: Sí
- Error: "La fecha no puede ser en el pasado"

**empresa**
- Tipo: String
- Longitud: Min 3, Max 200
- Obligatorio: Sí
- Error: "Nombre de empresa muy corto"

**contacto**
- Tipo: String
- Longitud: Min 3, Max 200
- Obligatorio: Sí
- Error: "Nombre de contacto muy corto"

**telefono**
- Tipo: String
- Pattern: Regex /^\+?[1-9]\d{1,14}$/
- Obligatorio: Sí
- Error: "Formato de teléfono inválido. Ej: +573001234567"

**email**
- Tipo: String
- Validación: Email válido
- Transformación: toLowerCase()
- Obligatorio: Sí
- Error: "Email inválido"

#### Validaciones Cruzadas

**Validación 1: Destino obligatorio para NACIONAL**
```
Si tipoServicio = "NACIONAL" Y destino está vacío
  → Error en campo destino: "Destino es obligatorio para servicio nacional"
```

---

## 9. Componentes Frontend

### 9.0. PARADIGMA: INTERFAZ CONVERSACIONAL

⚠️ **IMPORTANTE:** Este sistema NO es un formulario tradicional.  
Es una **experiencia conversacional** tipo chatbot.

#### Características de la UX:
- 💬 **Burbujas de chat** para preguntas del sistema
- 💬 **Burbujas de respuesta** del usuario
- ✨ **Animaciones suaves** entre transiciones
- 🚀 **Guardado progresivo** (cada respuesta se guarda inmediatamente)
- 📱 **Mobile-first** (optimizado para teléfonos)
- ✅ **Indicador de progreso** discreto

#### Flujo Visual:
```
Sistema: "👋 ¡Hola! ¿Cuál es el nombre de tu empresa?"
  ↓
Usuario: [Input texto] "ACME Transport"  → [Continuar]
  ↓
✅ Se guarda en BD (POST /api/solicitudes)
  ↓
Sistema: "Perfecto, ACME Transport. ¿Y con quién tengo el gusto?"
  ↓
Usuario: [Input texto] "Juan Pérez"  → [Continuar]
  ↓
✅ Se actualiza en BD (PATCH /api/solicitudes/:id)
  ↓
... (repeats for 13 steps)
```

---

### 9.1. Arquitectura de Componentes

```
app/cotizar/page.tsx (Page)
└── ConversacionCotizacion (Smart Component) - NUEVO NOMBRE
    ├── ProgressIndicator ("Paso 5 de 13")
    ├── ChatContainer
    │   ├── ChatMessages (historial de preguntas/respuestas)
    │   │   ├── BotMessage (pregunta del sistema)
    │   │   └── UserMessage (respuesta del usuario)
    │   └── ChatInput (input actual)
    │       ├── TextInput
    │       ├── RadioButtons (para opciones tipo servicio)
    │       ├── ButtonGroup (para tipo de carga)
    │       ├── CheckboxGroup (condiciones cargue)
    │       └── DatePicker
    └── ChatFooter
        ├── ContinueButton ("Continuar" o "Enviar")
        └── BackButton ("Atrás", opcional)
```

---

### 9.2. ConversacionCotizacion (Smart Component)

**Archivo:** `app/cotizar/components/ConversacionCotizacion.tsx`

**Tipo:** Smart Component (con estado)

#### Responsabilidades
1. **Gestionar estado conversacional** (13 pasos con historial)
2. **Guardado progresivo**: cada respuesta se guarda inmediatamente en BD
3. **Controlar navegación** paso a paso
4. **Integrar React Hook Form** con validación Zod
5. **Realizar llamadas API**:
   - POST inicial para crear solicitud (paso 0)
   - PATCH incremental para actualizar cada respuesta
   - PATCH final con estado COMPLETADA (dispara notificaciones)
6. **Manejar estados**: loading, error, success
7. **Mantener historial** de preguntas/respuestas para visualización

#### Estados Internos
- `pasoActual`: number (0-13)
- `solicitudId`: string | null (ID generado en paso 0)
- `historialMensajes`: Array<{ tipo: 'bot' | 'user', contenido: string }>
- `isLoading`: boolean
- `error`: string | null
- Formulario manejado por React Hook Form

#### Métodos Internos

##### crearSolicitudInicial()
- **Trigger:** Cuando usuario responde paso 0 (nombre empresa)
- **API:** POST /api/solicitudes { empresa }
- **Retorna:** solicitudId
- **Acción:** Guardar ID en estado y avanzar a paso 1

##### actualizarSolicitud(campo, valor)
- **Trigger:** Cada vez que usuario responde una pregunta
- **API:** PATCH /api/solicitudes/:id { [campo]: valor }
- **Comportamiento:** Guardado optimista (muestra siguiente pregunta mientras guarda)

##### completarSolicitud()
- **Trigger:** Última respuesta (paso 13)
- **API:** PATCH /api/solicitudes/:id { fechaRequerida, estado: "COMPLETADA" }
- **Acción:** Disparar notificaciones y mostrar confirmación

##### siguientePaso()
- Validar respuesta actual
- Guardar respuesta en historial
- Llamar actualizarSolicitud()
- Avanzar contador de paso
- Renderizar siguiente pregunta con animación

##### pasoAnterior()
- Retroceder contador (opcional, puede estar deshabilitado)
- No modifica datos en BD

#### Flujo de Guardado Progresivo

```typescript
// Paso 0: Crear solicitud
const solicitudId = await crearSolicitudInicial({ empresa });
// → POST /api/solicitudes { empresa }
// ← { id: "01JXX...", estado: "EN_PROGRESO" }

// Pasos 1-12: Actualizar solicitud
await actualizarSolicitud(solicitudId, { contacto: "Juan" });
// → PATCH /api/solicitudes/01JXX { contacto: "Juan" }
await actualizarSolicitud(solicitudId, { email: "juan@..." });
// → PATCH /api/solicitudes/01JXX { email: "juan@..." }
// ... (repeats for each field)

// Paso 13: Completar solicitud
await completarSolicitud(solicitudId, { 
  fechaRequerida: "2026-03-01", 
  estado: "COMPLETADA" 
});
// → PATCH /api/solicitudes/01JXX { fechaRequerida, estado: "COMPLETADA" }
// → Dispara notificaciones (email + WhatsApp)
```

#### Integración con API
- **Paso 0:** POST /api/solicitudes { empresa }
- **Pasos 1-12:** PATCH /api/solicitudes/:id { campo }
- **Paso 13:** PATCH /api/solicitudes/:id { fechaRequerida, estado: "COMPLETADA" }

#### Manejo de Errores
- Si falla POST inicial → mostrar error y permitir reintentar
- Si falla PATCH → permitir continuar (datos se guardan hasta último paso exitoso)
- Si falla PATCH final → reintentar hasta 3 veces automáticamente

---

### 9.3. ChatMessages (Componente de Historial)

**Archivo:** `app/cotizar/components/ChatMessages.tsx`

**Tipo:** Presentational Component

#### Responsabilidades
1. Renderizar historial completo de mensajes
2. Diferenciar visualmente preguntas (bot) vs respuestas (usuario)
3. Aplicar animaciones de entrada
4. Auto-scroll al último mensaje

#### Props
```typescript
interface ChatMessagesProps {
  mensajes: Array<{
    id: string
    tipo: 'bot' | 'user'
    contenido: string
    timestamp?: Date
  }>
}
```

#### Estructura Visual
```jsx
<div className="chat-messages-container">
  {mensajes.map(msg => (
    msg.tipo === 'bot' 
      ? <BotMessage key={msg.id} texto={msg.contenido} />
      : <UserMessage key={msg.id} texto={msg.contenido} />
  ))}
</div>
```

---

### 9.4. BotMessage & UserMessage

**Archivos:** `components/ui/chat/BotMessage.tsx`, `UserMessage.tsx`

**Tipo:** Presentational Components

#### BotMessage (Pregunta del sistema)
- Burbuja alineada a la **izquierda**
- Color de fondo: `var(--chat-bot-bg)` (gris claro por defecto)
- Icono de bot opcional (🤖)
- Tipografía: Inter 500, 16-18px
- Animación entrada: fade-in + slide-up

#### UserMessage (Respuesta del usuario)
- Burbuja alineada a la **derecha**
- Color de fondo: `var(--chat-user-bg)` (color primario corporativo)
- Texto blanco
- Tipografía: Inter 400, 16px
- Animación entrada: fade-in + slide-left

---

### 9.5. ChatInput (Input Dinámico)

**Archivo:** `app/cotizar/components/ChatInput.tsx`

**Tipo:** Smart Component

#### Responsabilidades
1. Renderizar input apropiado según tipo de pregunta
2. Integrar con React Hook Form
3. Mostrar validaciones en tiempo real
4. Mandar foco automático al aparecer

#### Tipos de Input por Paso

| Paso | Tipo Input | Componente |
|------|-----------|------------|
| 0 | Texto | `<Input type="text" />` |
| 1 | Texto | `<Input type="text" />` |
| 2 | Email | `<Input type="email" />` |
| 3 | Teléfono | `<Input type="tel" />` |
| 4 | Radio | `<RadioGroup options={['Urbano', 'Nacional']} />` |
| 5 | Texto | `<Input type="text" />` |
| 6 | Texto | `<Input type="text" />` (condicional) |
| 7 | Botones | `<ButtonGroup options={['Mercancía', 'Maquinaria', 'Muebles']} />` |
| 8 | Numérico | `<Input type="number" />` |
| 9 | Texto | `<Textarea />` |
| 10 | Numérico | `<Input type="number" />` |
| 11 | Checkboxes | `<CheckboxGroup />` |
| 12 | Fecha | `<DatePicker />` |

---

## 10. Sistema de Temas y Personalización Visual

### 10.1. Arquitectura de Temas

El sistema usa **CSS Variables** (custom properties) para permitir personalización completa sin reescribir código.

#### Archivo Principal: `app/globals.css`

```css
@layer base {
  :root {
    /* === COLORES CORPORATIVOS === */
    /* Cambiar estos valores para personalizar */
    
    --primary: 220 90% 56%;           /* Azul primario */
    --primary-foreground: 210 40% 98%;
    
    --secondary: 142 76% 36%;         /* Verde secundario */
    --secondary-foreground: 355 7% 97%;
    
    --accent: 24 95% 53%;             /* Naranja acentos */
    --accent-foreground: 26 83% 14%;
    
    --destructive: 0 84% 60%;         /* Rojo errores */
    --destructive-foreground: 210 40% 98%;
    
    /* === COLORES FUNCIONALES === */
    --background: 0 0% 100%;          /* Blanco fondo */
    --foreground: 222 47% 11%;        /* Texto principal */
    
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    
    --muted: 210 40% 96%;             /* Gris claro */
    --muted-foreground: 215 16% 47%;
    
    --border: 214 32% 91%;            /* Bordes */
    --input: 214 32% 91%;
    --ring: 221 83% 53%;
    
    /* === COLORES ESPECÍFICOS DEL CHAT === */
    --chat-bot-bg: 220 13% 91%;       /* Burbuja bot (gris) */
    --chat-bot-text: 222 47% 11%;
    
    --chat-user-bg: var(--primary);   /* Burbuja usuario (primario) */
    --chat-user-text: var(--primary-foreground);
    
    --radius: 0.5rem;                 /* Border radius global */
  }
  
  /* Tema oscuro (opcional futuro) */
  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    /* ... resto de variables modo oscuro */
  }
}
```

### 10.2. Configuración Tailwind

**Archivo:** `tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Aliasing de CSS variables a clases Tailwind
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))',
        chatBot: 'hsl(var(--chat-bot-bg))',
        chatUser: 'hsl(var(--chat-user-bg))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

### 10.3. Uso en Componentes

```tsx
// Burbuja del bot - Usa variable CSS
<div className="bg-chatBot text-chatBot-text rounded-2xl p-4">
  {pregunta}
</div>

// Burbuja del usuario - Usa variable CSS
<div className="bg-chatUser text-chatUser-text rounded-2xl p-4">
  {respuesta}
</div>

// Botón primario - Usa variable CSS
<Button className="bg-primary text-primary-foreground">
  Continuar
</Button>
```

### 10.4. ¿Cómo Personalizar Colores Corporativos?

#### Opción 1: Editar `globals.css` directamente (Más simple)

```css
:root {
  /* Cambiar de azul a verde corporativo */
  --primary: 142 76% 36%;  /* Verde */
  
  /* Cambiar de gris a azul claro para chat bot */
  --chat-bot-bg: 200 20% 95%;
}
```

#### Opción 2: Variables de entorno + JavaScript

**Archivo:** `.env.local`
```env
NEXT_PUBLIC_COLOR_PRIMARY=142 76% 36%
NEXT_PUBLIC_COLOR_CHAT_BOT=200 20% 95%
```

**Archivo:** `app/layout.tsx`
```typescript
export default function RootLayout() {
  return (
    <html lang="es" style={{
      '--primary': process.env.NEXT_PUBLIC_COLOR_PRIMARY,
      '--chat-bot-bg': process.env.NEXT_PUBLIC_COLOR_CHAT_BOT,
    } as React.CSSProperties}>
      <body>{children}</body>
    </html>
  );
}
```

#### Opción 3: Panel de administración (Futuro)
- Crear endpoint `/api/admin/theme` para guardar colores en BD
- Cargar colores dinámicamente en `layout.tsx`
- Interfaz gráfica con color picker

### 10.5. Ventajas del Sistema de Temas

| Ventaja | Descripción |
|---------|-------------|
| **Cambio instantáneo** | Modificar 1 archivo, todos los componentes se actualizan |
| **Sin recompilación** | Variables de entorno permiten cambiar sin rebuild |
| **Consistencia automática** | Imposible tener botones con colores diferentes |
| **Múltiples temas** | Fácil agregar tema oscuro, alto contraste, etc. |
| **Accesibilidad** | Permite crear temas para daltonismo, bajo contraste |
| **A/B Testing** | Puedes probar diferentes esquemas de colores fácilmente |

### 10.6. Colores por Defecto (Recomendados para MVP)

| Elemento | HSL | Hex | Uso |
|----------|-----|-----|-----|
| Primary | 220 90% 56% | #3B82F6 | Botones, links, burbujas usuario |
| Secondary | 142 76% 36% | #10B981 | Success messages |
| Accent | 24 95% 53% | #F59E0B | Alerts, warnings |
| Destructive | 0 84% 60% | #EF4444 | Errores, validaciones |
| Chat Bot | 220 13% 91% | #E5E7EB | Burbujas de preguntas |
| Background | 0 0% 100% | #FFFFFF | Fondo |
| Foreground | 222 47% 11% | #1F2937 | Texto principal |

**Nota:** Formato HSL permite fácil ajuste de luminosidad/saturación sin cambiar el tono.

---

## 11. Flujos de Negocio

**Paso 5 - TipoCarga:** Select con 3 opciones

**Paso 6 - Peso:** Input number + Select unidad (kg/toneladas)

**Paso 7 - Dimensiones:** 3 inputs (Largo, Alto, Profundidad)

**Paso 8 - ValorAsegurado:** Input number (currency format)

**Paso 9 - CondicionesCargue:** Checkbox group (múltiple selección)

**Paso 10 - FechaRequerida:** Calendar/DatePicker

**Paso 11 - DatosContacto:** 4 inputs (empresa, contacto, teléfono, email)

**Paso 12 - Confirmación:** Resumen de datos + botón "Enviar"

---

### 9.4. StepIndicator

**Tipo:** Presentational Component

#### Responsabilidades
1. Mostrar paso actual (ej: "Paso 3 de 12")
2. Visualizar progreso con barra horizontal
3. Indicar porcentaje completado

#### Props
- `currentStep`: number
- `totalSteps`: number

#### UI
- Texto: "Paso X de Y" y "Z% completado"
- Barra de progreso: Ancho proporcional a progreso

---

### 9.5. Páginas

#### /cotizar
- **Componente:** Page component de Next.js
- **Layout:** Contenedor centrado con max-width
- **Contenido:** Header + FormularioCotizacion
- **SEO:** metadata exportada (title, description)

#### /confirmacion
- **Componente:** Page component de Next.js
- **Parámetros:** Query param `id` (ID de solicitud)
- **Contenido:**
  - Ícono de éxito (CheckCircle)
  - Mensaje de confirmación
  - ID de solicitud (últimos 8 dígitos)
  - Instrucciones de próximos pasos
  - Botones: "Volver al inicio", "Nueva cotización"

---

## 11. Flujos de Negocio

### 11.1. Flujo Principal: Crear Solicitud con Guardado Progresivo (Happy Path)

#### Fase 1: Inicio y Creación de Solicitud
1. Usuario accede a `/cotizar`
2. Sistema renderiza ConversacionCotizacion en paso 0
3. Sistema muestra pregunta: "¿Cuál es el nombre de tu empresa?"
4. Usuario escribe nombre empresa: "ACME Transport"
5. Usuario hace click en "Continuar"
6. **Sistema ejecuta POST /api/solicitudes** { empresa: "ACME Transport" }
7. Backend crea registro en BD con `estado: "EN_PROGRESO"`
8. Backend retorna `solicitudId: "01JXX..."`
9. Frontend guarda `solicitudId` en estado
10. Sistema avanza a paso 1

#### Fase 2: Guardado Progresivo (Pasos 1-12)
**Patrón que se repite en cada paso:**
1. Sistema muestra pregunta (animación fade-in)
2. Usuario escribe/selecciona respuesta
3. Usuario hace click en "Continuar"
4. **React Hook Form valida campo** (validación cliente)
5. Si válido:
   - Frontend guarda respuesta en historial visual
   - **Sistema ejecuta PATCH /api/solicitudes/:id** { campo: valor }
   - Backend actualiza registro parcialmente
   - Backend retorna solicitud actualizada
   - Sistema avanza al siguiente paso (animación)
6. Si inválido:
   - Mostrar error debajo del input
   - No avanzar hasta corrección

**Ejemplo concreto - Paso 1 (Contacto):**
```
Usuario: "Juan Pérez" → [Continuar]
  ↓
Frontend: Validar (min 3 chars) ✅
  ↓
API Call: PATCH /api/solicitudes/01JXX { contacto: "Juan Pérez" }
  ↓
Backend: UPDATE solicitudes SET contacto='Juan Pérez' WHERE id='01JXX'
  ↓
Backend: Retorna solicitud actualizada
  ↓
Frontend: Avanza a paso 2 (Email)
```

**Ejemplo - Paso 2-12:**
- Paso 2: PATCH { email }
- Paso 3: PATCH { telefono }
- Paso 4: PATCH { tipoServicio }
- Paso 5: PATCH { origen }
- Paso 6: PATCH { destino } (condicional si Nacional)
- Paso 7: PATCH { tipoCarga }
- Paso 8: PATCH { pesoKg }  
  - Si pesoKg > 10,000 → backend actualiza `revisionEspecial: true`
- Paso 9: PATCH { dimensiones }
- Paso 10: PATCH { valorAsegurado }
- Paso 11: PATCH { condicionesCargue }
- Paso 12: PATCH { fechaRequerida }

#### Fase 3: Completar y Disparar Notificaciones
1. Usuario completa paso 13 (última pregunta)
2. **Sistema ejecuta PATCH /api/solicitudes/:id** { fechaRequerida, estado: "COMPLETADA" }
3. Backend actualiza estado a "COMPLETADA"
4. **Backend detecta estado COMPLETADA y dispara notificaciones:**
   - Envía email al cliente (Resend)
   - Envía email al admin (Resend)
   - Envía WhatsApp al admin (Ultramsg)
5. Notificaciones se ejecutan en paralelo (no bloquean respuesta)
6. Backend retorna HTTP 200 con solicitud completa

#### Fase 4: Confirmación Final
1. Frontend recibe response exitoso
2. Muestra mensaje de éxito en la conversación:
   > "✅ ¡Listo! Tu solicitud #01JXX ha sido completada"
3. Muestra instrucciones: "Te contactaremos pronto"
4. (Opcional) Muestra botones: "Nueva cotización", "Ver resumen"

**Ventajas de este flujo:**
- ✅ Usuario nunca pierde progreso (datos guardados en cada paso)
- ✅ Recuperación ante errores (puede cerrar navegador y continuar luego)
- ✅ Analytics detallado (saber en qué paso abandonan)
- ✅ Mejor UX (percepción de velocidad, respuesta inmediata)
- ✅ Reducción de tasa de abandono

**Tiempo estimado:** 2-3 minutos (usuario) + 50-100ms por paso (guardado)

---

### 11.2. Flujo Alternativo: Error de Validación

#### Escenario: Datos inválidos en cliente
1. Usuario completa campo con valor inválido
2. React Hook Form valida en tiempo real
3. Muestra mensaje de error debajo del campo
4. Campo se marca con borde rojo
5. Botón "Siguiente" se deshabilita
6. Usuario corrige error
7. Validación pasa, campo se marca como válido
8. Botón "Siguiente" se habilita

#### Escenario: Datos inválidos en servidor
1. Usuario envía formulario
2. API recibe datos
3. Servicio valida con Zod
4. Zod lanza ZodError
5. API Route captura error
6. Retorna HTTP 400 con lista de errores
7. Frontend muestra toast con mensaje de error
8. Usuario permanece en paso 12

#### Escenario: Error de regla de negocio
1. Usuario envía formulario con tipo carga "hogar"
2. Servicio detecta palabra prohibida (RN-02)
3. Lanza Error con mensaje
4. API Route captura error
5. Retorna HTTP 400 con mensaje
6. Frontend muestra toast: "No procesamos mudanzas de hogar"

---

### 11.3. Flujo Alternativo: Error del Sistema

#### Escenario: Base de datos no disponible
1. Usuario envía formulario
2. API intenta conectar a PostgreSQL
3. Prisma lanza error de conexión
4. API Route captura error
5. Retorna HTTP 500 con mensaje genérico
6. Frontend muestra toast: "Error interno del servidor"
7. Error se loguea en servidor para debugging

#### Escenario: Servicio externo falla (notificaciones)
1. Solicitud se guarda exitosamente
2. NotificacionService intenta enviar emails
3. Resend API retorna error 500
4. NotificacionService loguea error
5. NO lanza excepción (continúa con otras notificaciones)
6. API retorna HTTP 201 (solicitud creada exitosamente)
7. Usuario ve confirmación normal
8. Admin debe revisar logs para detectar fallo de notificación

---

## 12. Manejo de Errores

### 12.1. Estrategia General

#### Principio: Fail Fast, Fail Gracefully
- Validar lo antes posible
- Propagar errores de forma controlada
- Logs detallados en servidor
- Mensajes user-friendly en cliente
- Nunca exponer detalles técnicos al usuario

### 12.2. Tipos de Errores

#### Errores de Validación (400 Bad Request)
- **Causa:** Datos inválidos según schema Zod
- **Manejo Backend:** Capturar ZodError, formatear lista de errores
- **Manejo Frontend:** Mostrar toast con errores específicos
- **Logging:** No requiere log (comportamiento esperado)

#### Errores de Negocio (400 Bad Request)
- **Causa:** Violación de reglas de negocio
- **Ejemplos:**
  - Destino faltante para servicio NACIONAL
  - Tipo de carga no permitido
  - Peso excede límite
- **Manejo Backend:** Lanzar Error con mensaje descriptivo
- **Manejo Frontend:** Mostrar toast con mensaje
- **Logging:** Log nivel INFO

#### Errores de No Encontrado (404 Not Found)
- **Causa:** Recurso solicitado no existe
- **Ejemplo:** GET /api/solicitudes/ID_INEXISTENTE
- **Manejo Backend:** Retornar 404 con mensaje
- **Manejo Frontend:** Mostrar página 404 o toast
- **Logging:** Log nivel WARN

#### Errores del Sistema (500 Internal Server Error)
- **Causa:** Fallos inesperados (DB down, código con bug)
- **Manejo Backend:** Capturar excepción, retornar mensaje genérico
- **Manejo Frontend:** Mostrar toast genérico
- **Logging:** Log nivel ERROR con stack trace completo

#### Errores de Servicios Externos (variable)
- **Causa:** APIs externas fallan (Resend, Ultramsg)
- **Estrategia:** No interrumpir flujo principal
- **Manejo:** Loguear y continuar
- **Logging:** Log nivel WARN

### 11.3. Formato de Respuestas de Error

#### Estructura Estándar
```
{
  success: false
  error: string (mensaje principal)
  details?: array (errores específicos, opcional)
}
```

#### Ejemplos

**Error de validación:**
```json
{
  "success": false,
  "error": "Datos inválidos",
  "details": [
    {
      "field": "origen",
      "message": "Origen debe tener mínimo 3 caracteres"
    },
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

**Error de negocio:**
```json
{
  "success": false,
  "error": "Destino es obligatorio para servicio nacional"
}
```

**Error del sistema:**
```json
{
  "success": false,
  "error": "Error interno del servidor"
}
```

---

## 13. Seguridad

### 13.1. Seguridad en Frontend

#### Prevención XSS (Cross-Site Scripting)
- React escapa automáticamente todo contenido renderizado
- No usar `dangerouslySetInnerHTML` sin sanitizar
- Validar inputs en cliente antes de enviar

#### Prevención CSRF (Cross-Site Request Forgery)
- Next.js incluye protección CSRF automática
- SameSite cookies por defecto

#### HTTPS Obligatorio
- Vercel fuerza HTTPS en producción
- Redirección automática de HTTP a HTTPS

#### Exposición de Datos Sensibles
- Variables de entorno con prefijo NEXT_PUBLIC_ son públicas
- API keys NUNCA en código cliente
- Secrets solo en servidor

---

### 13.2. Seguridad en Backend

#### Prevención SQL Injection
- Prisma usa prepared statements automáticamente
- Nunca construcción manual de queries SQL

#### Validación de Entrada
- Doble validación: cliente (UX) + servidor (seguridad)
- Zod en servidor como última línea de defensa
- Sanitización de strings

#### Rate Limiting
- Vercel incluye rate limiting por IP
- Protección contra ataques DDoS básicos

#### CORS (Cross-Origin Resource Sharing)
- Next.js API Routes con CORS configurado
- Permitir solo orígenes necesarios en producción

#### Logging Seguro
- No loguear datos sensibles (emails completos, teléfonos)
- Stack traces solo en desarrollo
- Usar niveles de log apropiados

---

### 13.3. Seguridad en Base de Datos

#### Conexión Segura
- PostgreSQL con SSL/TLS obligatorio (Supabase)
- Connection string con credenciales en .env

#### Permisos Mínimos
- Usuario de base de datos con permisos limitados
- Solo operaciones necesarias (INSERT, SELECT, UPDATE)

#### Backups Automáticos
- Supabase realiza backups diarios automáticos
- Retención configurada (7 días mínimo)

---

### 13.4. Manejo de Secrets

#### Variables de Entorno
```
# .env (NO commitear a git)
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_xxxxx
ULTRAMSG_API_KEY=xxxxx
WHATSAPP_ADMIN_NUMBER=+573001234567
EMAIL_ADMIN=admin@empresa.com
```

#### Buenas Prácticas
- Archivo `.env.example` sin valores reales
- `.env` en `.gitignore`
- Secrets en Vercel Environment Variables
- Rotación periódica de API keys

---

## 14. Integraciones Externas

### 14.1. Resend (Email)

#### Propósito
Envío de emails transaccionales (confirmación y notificación)

#### Configuración
- API Key guardada en `RESEND_API_KEY`
- Email remitente verificado: `EMAIL_FROM`
- Email admin destino: `EMAIL_ADMIN`

#### Límites del Plan Gratuito
- 3,000 emails por mes
- 100 emails por día

#### Endpoints Utilizados
- POST /emails (enviar email)

#### Formato de Request
```
{
  from: string (email verificado)
  to: string | string[]
  subject: string
  html: string
}
```

#### Manejo de Errores
- Status 400: Email inválido o no verificado
- Status 429: Rate limit excedido
- Status 500: Error interno de Resend

#### Fallback
Si Resend falla, loguear error y continuar (notificación no crítica)

---

### 13.2. Ultramsg (WhatsApp)

#### Propósito
Envío de notificaciones WhatsApp al administrador

#### Configuración
- API Key: `ULTRAMSG_API_KEY`
- Instance ID: `ULTRAMSG_INSTANCE_ID`
- Número admin: `WHATSAPP_ADMIN_NUMBER`

#### Límites del Plan
- Plan de $10/mes: mensajes ilimitados
- Rate limit: 100 mensajes por minuto

#### Endpoints Utilizados
- POST /{instance_id}/messages/chat

#### Formato de Request
```
{
  token: string
  to: string (con formato +código país)
  body: string (texto del mensaje)
}
```

#### Formato de Mensaje
- Máximo 300 caracteres
- Incluye emojis para lectura rápida
- Info resumida: ID, ruta, carga, fecha, cliente

#### Manejo de Errores
- Status 401: Token inválido
- Status 404: Instance no encontrada
- Status 500: Error interno de Ultramsg

#### Fallback
Si Ultramsg falla, loguear error y continuar (notificación no crítica)

---

### 13.3. Supabase (PostgreSQL)

#### Propósito
Hosting de base de datos PostgreSQL

#### Configuración
- Connection string en `DATABASE_URL`
- SSL/TLS obligatorio

#### Límites del Plan Gratuito
- 500 MB de storage
- 2 GB de transfer por mes
- 50,000 monthly active users

#### Características Utilizadas
- PostgreSQL 16.x
- Auto-scaling
- Backups automáticos diarios
- Dashboard web para consultas

#### Monitoreo
- Panel de métricas en Supabase Dashboard
- Alertas de uso cercano al límite

---

## 📋 Apéndices

### A. Glosario de Términos

**ULID:** Universally Unique Lexicographically Sortable Identifier. ID único de 26 caracteres ordenable por tiempo.

**DTO:** Data Transfer Object. Objeto para transferir datos entre capas.

**ORM:** Object-Relational Mapping. Abstracción de base de datos usando objetos.

**Schema:** Definición de estructura de datos válidos.

**SSR:** Server-Side Rendering. Renderizado en servidor.

**API Route:** Endpoint REST implementado como función serverless en Next.js.

---

### B. Convenciones de Código

#### Nomenclatura
- **Archivos:** camelCase (solicitudService.ts)
- **Componentes React:** PascalCase (FormularioCotizacion.tsx)
- **Funciones:** camelCase (crearSolicitud)
- **Tipos/Interfaces:** PascalCase (Solicitud, SolicitudDTO)
- **Constantes:** UPPER_SNAKE_CASE (MAX_PESO_KG)
- **Carpetas:** kebab-case o camelCase

#### Estructura de Imports
```typescript
// 1. Externos
import { useState } from 'react';
import { z } from 'zod';

// 2. Internos (alias @/)
import { Solicitud } from '@/types';
import { crearSolicitud } from '@/lib/services';

// 3. Relativos (evitar si es posible)
import { helper } from './helper';
```

---

### C. Métricas y Monitoreo

#### Métricas de Negocio
- Solicitudes creadas por día
- Tasa de conversión (iniciados vs enviados)
- Tiempo promedio de completado
- Tasa de abandono por paso

#### Métricas Técnicas
- Tiempo de respuesta API (p50, p95, p99)
- Tasa de errores (4xx, 5xx)
- Disponibilidad (uptime)
- Uso de base de datos (conexiones, queries)

#### Herramientas Sugeridas
- Vercel Analytics (performance frontend)
- Prisma logging (queries DB)
- Resend Dashboard (emails enviados)
- Logs de Next.js (errores backend)

---

### D. Próximas Fases (Fuera de MVP)

**Fase 2: Panel Administrativo**
- Dashboard con lista de solicitudes
- Filtros por estado, fecha, cliente
- Actualización de estados
- Gestión de cotizaciones

**Fase 3: Autenticación**
- Login de clientes
- Historial de solicitudes
- Tracking de estados

**Fase 4: Cotización Automática**
- Cálculo de precios basado en reglas
- Integración con tarifario
- Envío automático de cotización

**Fase 5: Integraciones Avanzadas**
- Chat bidireccional WhatsApp
- Integración con CRM
- Webhooks para eventos

---

**FIN DEL DOCUMENTO**

---

**Control de Versiones:**

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-02-19 | Sistema | Documento inicial |
