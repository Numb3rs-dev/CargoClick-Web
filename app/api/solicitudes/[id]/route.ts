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
import { logger } from '@/lib/utils/logger';
import { rateLimitCheck, getClientIp } from '@/lib/utils/ratelimit';

/**
 * GET /api/solicitudes/:id
 * Obtiene solicitud por ID
 * 
 * @param request - Request de Next.js
 * @param params - Parámetros de ruta (asíncrono en Next.js 15)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // C-2: rate limiting — 20 req/min por IP (también en GET para prevenir enumeración)
    const rl = rateLimitCheck(getClientIp(request))
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en 1 minuto.' },
        { status: 429 }
      )
    }

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
    logger.error('API GET /solicitudes/:id', error);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // C-2: rate limiting — 20 req/min por IP
    const rl2 = rateLimitCheck(getClientIp(request))
    if (!rl2.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en 1 minuto.' },
        { status: 429 }
      )
    }

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

    // M-4: rechazar payloads excesivamente grandes
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 50_000) {
      return NextResponse.json(
        { success: false, error: 'Payload demasiado grande' },
        { status: 413 }
      )
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
    logger.error('API PATCH /solicitudes/:id', error);

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
