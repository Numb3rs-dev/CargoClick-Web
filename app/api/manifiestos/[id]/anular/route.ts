/**
 * POST /api/manifiestos/[id]/anular — Anula un manifiesto en el RNDC (procesoid 32).
 *
 * Precondición: manifiesto en estadoManifiesto=REGISTRADO.
 * Poscondición:
 * - estadoManifiesto=ANULADO
 * - Las remesas quedan liberadas (manifiestoOperativoId=null, estado=PENDIENTE)
 *
 * CRÍTICO: Si el procesoid 32 falla, las remesas NO se liberan.
 *
 * @module ManifiestoAnularRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { manifiestoService } from '@/lib/services/manifiestoService';
import { ok, rndcError, handleError, requireAuth } from '@/lib/utils/apiHelpers';

const anularSchema = z.object({
  motivoAnulacion: z.string().min(10).max(200),
});

/**
 * Anula el manifiesto via procesoid 32 y libera sus remesas.
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
    const body = anularSchema.parse(await req.json());
    const resultado = await manifiestoService.anular(id, body.motivoAnulacion);
    if (!resultado.exitoso) return rndcError(resultado);
    return ok({ anulado: true, syncRndcId: resultado.syncRndcId });
  } catch (e) { return handleError(e); }
}
