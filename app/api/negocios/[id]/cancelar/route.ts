/**
 * POST /api/negocios/[id]/cancelar — Cancela un negocio operativo.
 *
 * Precondición: el negocio debe estar en estado CONFIRMADO o ACTIVO.
 * Poscondición: estado cambia a CANCELADO.
 *
 * @module NegocioCancelarRoute
 */
import { NextRequest } from 'next/server';
import { nuevoNegocioService } from '@/lib/services/nuevoNegocioService';
import { ok, handleError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Cancela el negocio indicado.
 *
 * @requires Auth Clerk
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await params;
    const negocio = await nuevoNegocioService.cancelar(id);
    return ok(negocio);
  } catch (e) { return handleError(e); }
}
