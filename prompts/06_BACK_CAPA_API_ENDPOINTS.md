# PROMPT 6: CAPA DE API (ENDPOINTS REST)

## CONTEXTO DE NEGOCIO
**Problema**: Necesitamos exponer endpoints HTTP que permitan al frontend crear y actualizar solicitudes de forma progresiva, siguiendo el flujo conversacional de 13 pasos, y obtener solicitudes por ID.

**Usuarios**: Aplicación frontend (React/Next.js) que necesita interactuar con el backend mediante llamadas HTTP RESTful.

**Valor**: API bien diseñada, con validación de entrada, manejo de errores consistente, y responses estructuradas que permitan una experiencia de usuario fluida.

## ESPECIFICACIÓN FUNCIONAL

### Funcionalidad Principal
Implementar API Routes de Next.js 15 con App Router:
- `POST /api/solicitudes` - Crear solicitud inicial (paso 0)
- `PATCH /api/solicitudes/:id` - Actualizar solicitud progresivamente (pasos 1-12) o completar (paso 13)
- `GET /api/solicitudes/:id` - Obtener solicitud por ID
- `GET /api/health` - Health check del sistema

### Casos de Uso

1. **Crear solicitud inicial**: Frontend envía nombre de empresa, backend crea registro con estado EN_PROGRESO
2. **Actualizar progresivamente**: Frontend envía campo individual (email, teléfono, etc.), backend actualiza registro
3. **Completar solicitud**: Frontend envía último campo con flag de completar, backend valida completo y dispara notificaciones
4. **Consultar solicitud**: Frontend obtiene datos de solicitud creada
5. **Health check**: Monitoring valida disponibilidad del sistema

### Criterios de Aceptación
- ✅ 4 endpoints implementados correctamente
- ✅ Validación de request body con Zod (doble validación: cliente + servidor)
- ✅ Manejo consistente de errores (400, 404, 500)
- ✅ Response structure estandarizado: `{ success, data?, error?, details? }`
- ✅ HTTP status codes correctos
- ✅ Logging de errores en servidor
- ✅ CORS configurado (Next.js lo hace por defecto)
- ✅ TypeScript strict en todos los handlers
- ✅ Documentación JSDoc en funciones principales

## ARQUITECTURA TÉCNICA

### Stack Tecnológico
- Next.js 15 API Routes (App Router)
- TypeScript 5.x (strict mode)
- Zod para validación
- Servicios de negocio (solicitudService)

### Patrón de Diseño

#### Thin Controllers
- API Routes solo manejan HTTP (request/response)
- Toda la lógica de negocio está en servicios
- Validación mínima en controllers (delegar a servicios)

#### Error Handling Centralizado
- Try-catch en cada handler
- Mapeo de errores a HTTP status codes
- Mensajes user-friendly (no stack traces)

### Estructura de Archivos
```
app/
├── api/
│   ├── solicitudes/
│   │   ├── route.ts              (POST - crear inicial)
│   │   └── [id]/
│   │       └── route.ts          (GET, PATCH por ID)
│   └── health/
│       └── route.ts              (GET - health check)
└── ...
```

### Response Structure Estándar

**Success Response:**
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

**Error Response:**
```typescript
{
  success: false,
  error: string,
  details?: Array<{
    field: string,
    message: string
  }>
}
```

## IMPLEMENTACIÓN

### Archivo: `app/api/solicitudes/route.ts`

```typescript
/**
 * API Route: POST /api/solicitudes
 * 
 * Crea una solicitud inicial con estado EN_PROGRESO (paso 0 del flujo)
 * 
 * @module API_Solicitudes
 */

import { NextRequest, NextResponse } from 'next/server';
import { solicitudService } from '@/lib/services/solicitudService';
import { ZodError } from 'zod';

/**
 * POST /api/solicitudes
 * Crea solicitud inicial con solo nombre de empresa
 * 
 * @param request - Request de Next.js
 * @returns Response con solicitud creada
 * 
 * @example
 * POST /api/solicitudes
 * Body: { "empresa": "ACME Transport" }
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "01JXX...",
 *     "empresa": "ACME Transport",
 *     "estado": "EN_PROGRESO",
 *     ...
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parsear body
    const body = await request.json();

    // Crear solicitud inicial (servicio valida con Zod)
    const solicitud = await solicitudService.crearSolicitudInicial(body);

    // Retornar 201 Created
    return NextResponse.json(
      {
        success: true,
        data: solicitud,
        message: 'Solicitud creada correctamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear solicitud:', error);

    // Manejo de errores de validación (Zod)
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Error genérico del servidor
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
```

---

### Archivo: `app/api/solicitudes/[id]/route.ts`

```typescript
/**
 * API Route: GET /api/solicitudes/:id
 *            PATCH /api/solicitudes/:id
 * 
 * Obtiene o actualiza una solicitud específica
 * 
 * @module API_Solicitud_ById
 */

import { NextRequest, NextResponse } from 'next/server';
import { solicitudService } from '@/lib/services/solicitudService';
import { ZodError } from 'zod';

/**
 * GET /api/solicitudes/:id
 * Obtiene solicitud por ID
 * 
 * @param request - Request de Next.js
 * @param params - Parámetros de ruta ({ id: string })
 * @returns Response con solicitud encontrada
 * 
 * @example
 * GET /api/solicitudes/01JXX2Y3Z4A5B6C7D8E9F0G1H2
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": { ... solicitud ... }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validar formato de ID (26 caracteres)
    if (!id || id.length !== 26) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID inválido. Debe ser un ULID de 26 caracteres',
        },
        { status: 400 }
      );
    }

    // Obtener solicitud
    const solicitud = await solicitudService.obtenerPorId(id);

    return NextResponse.json({
      success: true,
      data: solicitud,
    });
  } catch (error) {
    console.error('Error al obtener solicitud:', error);

    // Error si no existe
    if (error instanceof Error && error.message === 'Solicitud no encontrada') {
      return NextResponse.json(
        {
          success: false,
          error: 'Solicitud no encontrada',
        },
        { status: 404 }
      );
    }

    // Error genérico
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/solicitudes/:id
 * Actualiza campos de solicitud (guardado progresivo) o completa solicitud
 * 
 * @param request - Request de Next.js
 * @param params - Parámetros de ruta ({ id: string })
 * @returns Response con solicitud actualizada
 * 
 * @example
 * PATCH /api/solicitudes/01JXX...
 * Body: { "email": "juan@acme.com" }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": { ... solicitud actualizada ... }
 * }
 * 
 * @example
 * PATCH /api/solicitudes/01JXX...
 * Body: { 
 *   "fechaRequerida": "2026-03-01T00:00:00Z",
 *   "completar": true 
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": { ... solicitud completada ... },
 *   "message": "Solicitud completada y notificaciones enviadas"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validar formato de ID
    if (!id || id.length !== 26) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID inválido',
        },
        { status: 400 }
      );
    }

    // Parsear body
    const body = await request.json();

    // Flag especial para indicar que es la actualización final (completar)
    const { completar, ...campos } = body;

    let solicitud;
    let mensaje = 'Solicitud actualizada correctamente';

    if (completar === true) {
      // Completar solicitud (valida completo y dispara notificaciones)
      solicitud = await solicitudService.completarSolicitud(id, campos);
      mensaje = 'Solicitud completada. Notificaciones enviadas.';
    } else {
      // Actualización progresiva (guardado parcial)
      solicitud = await solicitudService.actualizarSolicitud(id, campos);
    }

    return NextResponse.json({
      success: true,
      data: solicitud,
      message: mensaje,
    });
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);

    // Error de validación (Zod)
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Error de negocio (mensaje descriptivo)
    if (error instanceof Error) {
      // Errores conocidos (mudanza, transición inválida, etc.)
      if (
        error.message.includes('mudanza') ||
        error.message.includes('transición') ||
        error.message.includes('destino') ||
        error.message.includes('no encontrada')
      ) {
        const statusCode = error.message.includes('no encontrada') ? 404 : 400;
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: statusCode }
        );
      }
    }

    // Error genérico
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
```

---

### Archivo: `app/api/health/route.ts`

```typescript
/**
 * API Route: GET /api/health
 * 
 * Health check del sistema
 * Valida conectividad a base de datos
 * 
 * @module API_Health
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/health
 * Verifica disponibilidad del sistema
 * 
 * @returns Status del sistema
 * 
 * @example
 * GET /api/health
 * 
 * Response 200:
 * {
 *   "status": "ok",
 *   "timestamp": "2026-02-19T15:30:00Z",
 *   "database": "connected",
 *   "version": "1.0.0"
 * }
 */
export async function GET() {
  try {
    // Validar conectividad a base de datos
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
```

---

### Archivo: `lib/utils/httpResponses.ts` (Opcional pero recomendado)

```typescript
/**
 * Utilidades para responses HTTP estandarizados
 * 
 * @module HttpResponses
 */

import { NextResponse } from 'next/server';

export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
};

/**
 * Response de éxito estandarizado
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    } as SuccessResponse<T>,
    { status }
  );
}

/**
 * Response de error estandarizado
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: Array<{ field: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    } as ErrorResponse,
    { status }
  );
}
```

## RESTRICCIONES Y CALIDAD

### Performance
- Endpoints deben responder en < 500ms (promedio)
- Use pooling de conexiones de Prisma (ya configurado)
- Notificaciones NO bloquean response (son asíncronas)

### Seguridad
- Validar TODOS los inputs con Zod
- Nunca exponer stack traces en producción
- Rate limiting (Vercel lo incluye por defecto)
- CORS configurado por Next.js

### Testing
Casos de prueba críticos:
- ✅ POST con empresa válida → 201
- ❌ POST con empresa vacía → 400
- ✅ PATCH con email válido → 200
- ❌ PATCH con ID inexistente → 404
- ✅ GET con ID válido → 200
- ❌ GET con ID inválido → 400
- ✅ PATCH completar con datos válidos → 200
- ❌ PATCH completar con palabra "mudanza" → 400

### Estándares de Código
- HTTP status codes correctos (200, 201, 400, 404, 500, 503)
- Logging de errores en servidor (console.error)
- JSDoc en funciones exportadas
- Tipos TypeScript explícitos

## ENTREGABLES

### Checklist de Completitud
- [ ] Archivo `app/api/solicitudes/route.ts` (POST)
- [ ] Archivo `app/api/solicitudes/[id]/route.ts` (GET, PATCH)
- [ ] Archivo `app/api/health/route.ts` (GET)
- [ ] Archivo `lib/utils/httpResponses.ts` (opcional)
- [ ] Validación manual con Postman/Insomnia/curl
- [ ] Sin errores de TypeScript
- [ ] Logs claros en consola

### Endpoints Implementados
1. ✅ `POST /api/solicitudes` - Crear inicial
2. ✅ `GET /api/solicitudes/:id` - Obtener por ID
3. ✅ `PATCH /api/solicitudes/:id` - Actualizar/Completar
4. ✅ `GET /api/health` - Health check

### Validación Manual con curl

```bash
# 1. Health check
curl http://localhost:3000/api/health

# 2. Crear solicitud inicial
curl -X POST http://localhost:3000/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"empresa":"ACME Transport"}'
# → Guarda el ID retornado

# 3. Actualizar progresivamente
curl -X PATCH http://localhost:3000/api/solicitudes/01JXX... \
  -H "Content-Type: application/json" \
  -d '{"contacto":"Juan Pérez"}'

curl -X PATCH http://localhost:3000/api/solicitudes/01JXX... \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@acme.com"}'

# 4. Completar solicitud (envía notificaciones)
curl -X PATCH http://localhost:3000/api/solicitudes/01JXX... \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "+573001234567",
    "tipoServicio": "NACIONAL",
    "origen": "Bogotá",
    "destino": "Medellín",
    "tipoCarga": "MERCANCIA_EMPRESARIAL",
    "pesoKg": 5000,
    "dimensiones": "200x150x100",
    "valorAsegurado": 25000000,
    "condicionesCargue": ["muelle", "montacargas"],
    "fechaRequerida": "2026-03-01",
    "completar": true
  }'

# 5. Obtener solicitud completada
curl http://localhost:3000/api/solicitudes/01JXX...
```

### Colección Postman/Insomnia (opcional)

Crear colección con:
- POST crear solicitud
- PATCH actualizar campos individuales
- PATCH completar solicitud
- GET obtener por ID
- GET health check

## NOTAS IMPORTANTES

### ⚠️ NO IMPLEMENTAR EN ESTA FASE
- ❌ Autenticación/autorización (MVP público)
- ❌ Rate limiting avanzado (Vercel lo incluye)
- ❌ Paginación (no hay endpoint de lista completa aún)
- ❌ Webhooks
- ❌ GraphQL (usar REST)

### ✅ SÍ HACER EN ESTA FASE
- ✅ Implementar 4 endpoints
- ✅ Validación completa de inputs
- ✅ Manejo consistente de errores
- ✅ Response structure estandarizado
- ✅ Logging de errores
- ✅ Validación manual con curl o Postman

### Flujo Completo End-to-End

1. Frontend envía POST con empresa
2. Backend crea solicitud EN_PROGRESO, retorna ID
3. Frontend envía PATCH sucesivos con cada campo
4. Backend actualiza registro en cada PATCH
5. Frontend envía PATCH final con flag `completar: true`
6. Backend valida solicitud completa, dispara notificaciones
7. Cliente recibe email, admin recibe email + WhatsApp

### Troubleshooting Común

**Error**: "Cannot find module '@/lib/services/solicitudService'"  
**Solución**: Validar tsconfig.json tiene `paths: { "@/*": ["./*"] }`

**Error**: "Expected 26 characters but got X"  
**Solución**: Validar generación de ULID en servicio

**Error**: "Prisma client not found"  
**Solución**: Ejecutar `npx prisma generate`

**Error**: "Port 3000 already in use"  
**Solución**: Cambiar puerto en package.json: `"dev": "next dev -p 3001"`

---

**Objetivo Final**: API REST completa y funcional, lista para ser consumida por frontend.

---

## 🎉 PROYECTO BACKEND COMPLETADO

Con la implementación de este prompt, has completado exitosamente:
1. ✅ Configuración del proyecto
2. ✅ Modelo de datos (Prisma + PostgreSQL)
3. ✅ Capa de repositorio (abstracción de datos)
4. ✅ Capa de servicios (lógica de negocio)
5. ✅ Integraciones externas (Email + WhatsApp)
6. ✅ Capa de API (endpoints REST)

**Próximos pasos sugeridos:**
- Implementar frontend con flujo conversacional
- Deploy en Vercel
- Configurar dominio y emails de producción
- Testing end-to-end completo
