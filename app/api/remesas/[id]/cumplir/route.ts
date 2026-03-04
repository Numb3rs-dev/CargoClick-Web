/**
 * POST /api/remesas/[id]/cumplir — Cumple una remesa en el RNDC (procesoid 5).
 *
 * Precondición: remesa en estadoRndc=REGISTRADA (ya envió con procesoid 3).
 * Poscondición: estadoRndc=CUMPLIDA.
 * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
 *
 * @module RemesaCumplirRoute
 */
import { NextRequest } from 'next/server';
import { remesaService } from '@/lib/services/remesaService';
import { ok, rndcError, handleError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Cumple la remesa en el RNDC (procesoid 5).
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
    const resultado = await remesaService.cumplir(id);
    if (!resultado.exitoso) return rndcError(resultado);
    return ok({ cumplido: true, syncRndcId: resultado.syncRndcId });
  } catch (e) { return handleError(e); }
}
