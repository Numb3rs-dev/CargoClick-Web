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
import { BusinessError, GENERIC_ERROR } from '@/lib/utils/apiError';

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
    const reanudada = solicitud.reanudada === true;

    // 200 si es reanudación de solicitud existente, 201 si es nueva
    return NextResponse.json(
      {
        success: true,
        data: solicitud,
        reanudada,
        message: reanudada ? 'Solicitud existente reanudada' : 'Solicitud creada correctamente',
      },
      { status: reanudada ? 200 : 201 }
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

    // Error de negocio — mensaje seguro escrito por el servicio
    if (error instanceof BusinessError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    // Cualquier otro error (Prisma, red, etc.) — nunca exponer detalles técnicos
    return NextResponse.json(
      { success: false, error: GENERIC_ERROR },
      { status: 500 }
    );
  }
}
