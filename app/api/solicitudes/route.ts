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
import { logger } from '@/lib/utils/logger';
import { rateLimitCheck, getClientIp } from '@/lib/utils/ratelimit';

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
    // C-2: rate limiting — 20 req/min por IP
    const ip = getClientIp(request)
    const { success } = rateLimitCheck(ip)
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en 1 minuto.' },
        { status: 429 }
      )
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
    logger.error('API POST /solicitudes', error);

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

    // Error de negocio (duplicados, validaciones del servicio)
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
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
