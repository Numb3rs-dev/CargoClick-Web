/**
 * POST /api/manifiestos/[id]/cumplir — Cumple un manifiesto en el RNDC (procesoid 6).
 *
 * Precondición: manifiesto en estadoManifiesto=REGISTRADO.
 * Poscondición: estadoManifiesto=CULMINADO.
 * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
 *
 * @module ManifiestoCumplirRoute
 */
import { NextRequest } from 'next/server';
import { manifiestoService } from '@/lib/services/manifiestoService';
import { ok, rndcError, handleError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Cumple el manifiesto en el RNDC (procesoid 6).
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
    const resultado = await manifiestoService.cumplir(id);
    if (!resultado.exitoso) return rndcError(resultado);
    return ok({ cumplido: true, syncRndcId: resultado.syncRndcId });
  } catch (e) { return handleError(e); }
}
