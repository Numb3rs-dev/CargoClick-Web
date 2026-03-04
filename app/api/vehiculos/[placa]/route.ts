/**
 * GET /api/vehiculos/[placa] — Detalle de un vehículo por placa.
 *
 * @module VehiculoDetalleRoute
 */
import { NextRequest } from 'next/server';
import { vehiculoRepository } from '@/lib/repositories/vehiculoRepository';
import { ok, handleError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Devuelve el detalle de un vehículo por su placa.
 *
 * @requires Auth Clerk
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ placa: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const { placa } = await params;
    const vehiculo = await vehiculoRepository.findByPlaca(placa);
    if (!vehiculo) {
      return handleError(new Error(`Vehículo ${placa} no encontrado`));
    }
    return ok(vehiculo);
  } catch (e) { return handleError(e); }
}
