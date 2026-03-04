/**
 * POST /api/vehiculos/[placa]/sync-rndc — Registra vehículo en el RNDC (procesoid 12).
 *
 * Envía los datos del vehículo al RNDC del Ministerio de Transporte.
 * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
 *
 * @module VehiculoSyncRndcRoute
 */
import { NextRequest } from 'next/server';
import { vehiculoService } from '@/lib/services/vehiculoService';
import { ok, rndcError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Envía el vehículo al RNDC via procesoid 12.
 * Retorna syncRndcId para trazabilidad en caso de error.
 *
 * @requires Auth Clerk
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ placa: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const { placa } = await params;
  const resultado = await vehiculoService.syncRndc(placa);
  if (!resultado.exitoso) return rndcError(resultado);
  return ok({ syncRndcId: resultado.syncRndcId, ingresoid: resultado.ingresoid });
}
