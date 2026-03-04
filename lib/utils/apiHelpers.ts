/**
 * Helpers compartidos para API Routes del Módulo Operacional.
 *
 * Convenciones de respuesta:
 * - Éxito:      { data: T } o { data: T, meta: { total, page, pageSize } }
 * - Error:      { error: string, message: string, fields?: Record<string,string> }
 * - Error RNDC: { error: 'RNDC_ERROR', message, rndcResponse, syncRndcId } → HTTP 502
 *
 * @module ApiHelpers
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Verifica autenticación Clerk.
 * Retorna el userId si está autenticado, o una NextResponse 401 si no lo está.
 *
 * @returns userId (string) si autenticado, NextResponse 401 si no
 */
export async function requireAuth(): Promise<NextResponse | string> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Autenticación requerida' },
      { status: 401 }
    );
  }
  return userId;
}

/**
 * Respuesta HTTP 200 con envelope { data }.
 * Opcionalmente incluye { meta } para listados paginados.
 *
 * @param data    - Payload de la respuesta
 * @param meta    - Metadatos de paginación (total, page, pageSize)
 * @returns NextResponse con { data } o { data, meta }
 */
export function ok<T>(data: T, meta?: object): NextResponse {
  return NextResponse.json({ data, ...(meta && { meta }) });
}

/**
 * Mapea errores conocidos a respuestas HTTP semánticas.
 *
 * | Tipo de error      | HTTP | código          |
 * |-------------------|------|-----------------|
 * | ZodError           | 422  | VALIDATION_ERROR|
 * | "no encontrado"    | 404  | NOT_FOUND       |
 * | "Ya existe"        | 409  | CONFLICT        |
 * | Cualquier otro     | 500  | INTERNAL_ERROR  |
 *
 * @param error - Error capturado en el catch
 * @returns NextResponse con el error mapeado
 */
export function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    error.errors.forEach((e) => {
      fields[e.path.join('.')] = e.message;
    });
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Datos inválidos', fields },
      { status: 422 }
    );
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('no encontrado')) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: error.message },
        { status: 404 }
      );
    }
    if (error.message.toLowerCase().startsWith('ya existe')) {
      return NextResponse.json(
        { error: 'CONFLICT', message: error.message },
        { status: 409 }
      );
    }
  }

  console.error('[API Error]', error);
  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
    { status: 500 }
  );
}

/**
 * Respuesta HTTP 502 para errores RNDC.
 * Incluye el syncRndcId para que el operador pueda trazar el log.
 *
 * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
 *
 * @param resultado - Resultado fallido de llamarRndc
 * @returns NextResponse 502 con { error: 'RNDC_ERROR', ... }
 */
export function rndcError(resultado: {
  errorMensaje?: string;
  responseXml?: string;
  syncRndcId: string;
}): NextResponse {
  return NextResponse.json(
    {
      error:        'RNDC_ERROR',
      message:      resultado.errorMensaje ?? 'El RNDC rechazó la operación',
      rndcResponse: resultado.responseXml,
      syncRndcId:   resultado.syncRndcId,
    },
    { status: 502 }
  );
}
