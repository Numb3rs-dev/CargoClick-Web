/**
 * GET /api/manifiestos/[id] — Detalle completo de un manifiesto.
 *
 * Incluye conductor, vehículo, remesas, negocio y relaciones de corrección.
 *
 * @module ManifiestoDetalleRoute
 */
import { NextRequest } from 'next/server';
import { manifiestoOperativoRepository } from '@/lib/repositories/manifiestoOperativoRepository';
import { ok, handleError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Devuelve el detalle completo del manifiesto con todas sus relaciones.
 *
 * @requires Auth Clerk
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await params;
    const manifiesto = await manifiestoOperativoRepository.findById(id);
    if (!manifiesto) return handleError(new Error(`Manifiesto ${id} no encontrado`));
    return ok(manifiesto);
  } catch (e) { return handleError(e); }
}
