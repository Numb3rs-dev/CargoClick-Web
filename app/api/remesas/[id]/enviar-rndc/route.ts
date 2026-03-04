/**
 * POST /api/remesas/[id]/enviar-rndc — Envía / re-envía una remesa al RNDC (procesoid 3).
 *
 * Si la remesa ya está REGISTRADA en el RNDC, devuelve los datos existentes sin re-enviar.
 * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
 *
 * @module RemesaEnviarRndcRoute
 */
import { NextRequest } from 'next/server';
import { remesaService } from '@/lib/services/remesaService';
import { ok, rndcError, handleError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Envía la remesa al RNDC.
 * Idempotente: si ya estaba registrada retorna los datos existentes (sin volver a llamar al RNDC).
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
    const resultado = await remesaService.enviarRndc(id);

    // Idempotencia: remesa ya registrada
    if ('ya_registrada' in resultado) return ok(resultado);

    if (!resultado.exitoso) return rndcError(resultado);

    return ok({
      numeroRemesaRndc: resultado.ingresoid,
      syncRndcId:       resultado.syncRndcId,
    });
  } catch (e) { return handleError(e); }
}
