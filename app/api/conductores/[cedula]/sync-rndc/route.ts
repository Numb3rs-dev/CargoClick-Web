/**
 * POST /api/conductores/[cedula]/sync-rndc — Registra conductor en el RNDC (procesoid 11).
 *
 * Envía los datos del conductor al RNDC del Ministerio de Transporte.
 * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
 *
 * @module ConductorSyncRndcRoute
 */
import { NextRequest } from 'next/server';
import { conductorService } from '@/lib/services/conductorService';
import { ok, rndcError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Envía el conductor al RNDC via procesoid 11.
 * Retorna syncRndcId para trazabilidad en caso de error.
 *
 * @requires Auth Clerk
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cedula: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const { cedula } = await params;
  const resultado = await conductorService.syncRndc(cedula);
  if (!resultado.exitoso) return rndcError(resultado);
  return ok({ syncRndcId: resultado.syncRndcId, ingresoid: resultado.ingresoid });
}
