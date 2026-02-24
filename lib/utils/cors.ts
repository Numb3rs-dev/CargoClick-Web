/**
 * Utilidad CORS
 *
 * M-1: restringe los orígenes que pueden llamar a las APIs.
 * En producción sólo se permite el dominio oficial de la app.
 *
 * @module CORS
 */

import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? '',
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean)

/**
 * Agrega los headers CORS a una respuesta existente.
 *
 * @param response - NextResponse a decorar
 * @param origin   - Valor del header Origin de la request
 */
export function withCors(response: NextResponse, origin: string | null): NextResponse {
  const allowed =
    !origin || ALLOWED_ORIGINS.includes(origin)
      ? (origin ?? ALLOWED_ORIGINS[0])
      : ALLOWED_ORIGINS[0]

  response.headers.set('Access-Control-Allow-Origin', allowed)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Vary', 'Origin')
  return response
}

/**
 * Responde al preflight OPTIONS con los headers CORS correctos.
 */
export function corsPreflightResponse(origin: string | null): NextResponse {
  const res = new NextResponse(null, { status: 204 })
  return withCors(res, origin)
}
