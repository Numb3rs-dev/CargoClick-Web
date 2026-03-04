/**
 * GET /api/conductores/[cedula] — Detalle de un conductor por cédula.
 *
 * @module ConductorDetalleRoute
 */
import { NextRequest } from 'next/server';
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { ok, handleError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Devuelve el detalle de un conductor por su cédula.
 *
 * @requires Auth Clerk
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cedula: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const { cedula } = await params;
    const conductor = await conductorRepository.findByCedula(cedula);
    if (!conductor) {
      return handleError(new Error(`Conductor ${cedula} no encontrado`));
    }
    return ok(conductor);
  } catch (e) { return handleError(e); }
}
