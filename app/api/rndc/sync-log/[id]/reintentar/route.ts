/**
 * POST /api/rndc/sync-log/[id]/reintentar — Reintenta una operación RNDC fallida.
 *
 * Lee el registro SyncRndc original, reconstruye la operación y la re-ejecuta
 * delegando al servicio apropiado según entidadTipo.
 *
 * Operaciones soportadas:
 * - Conductor (processId 11)  → conductorService.syncRndc
 * - Vehiculo (processId 12)   → vehiculoService.syncRndc
 * - Remesa (processId 3)      → remesaService.enviarRndc
 * - Remesa (processId 5)      → remesaService.cumplir
 * - ManifiestoOperativo (4)   → manifiestoService.enviarRndc
 * - ManifiestoOperativo (6)   → manifiestoService.cumplir
 * - ManifiestoOperativo (32)  → manifiestoService.anular (requiere motivo)
 *
 * Cada reintento crea un nuevo registro SyncRndc independiente.
 *
 * @module RndcReintentarRoute
 */
import { NextRequest, NextResponse } from 'next/server';
import { syncRndcRepository } from '@/lib/repositories/syncRndcRepository';
import { conductorService } from '@/lib/services/conductorService';
import { vehiculoService } from '@/lib/services/vehiculoService';
import { remesaService } from '@/lib/services/remesaService';
import { manifiestoService } from '@/lib/services/manifiestoService';
import { ok, rndcError, handleError, requireAuth } from '@/lib/utils/apiHelpers';

/**
 * Reintenta la operación RNDC del registro indicado.
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
    const logOriginal = await syncRndcRepository.findById(id);

    if (!logOriginal) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Registro SyncRndc ${id} no encontrado` },
        { status: 404 }
      );
    }

    const { entidadTipo, entidadId, processId } = logOriginal;
    let resultado;

    if (entidadTipo === 'Conductor' && processId === 11) {
      resultado = await conductorService.syncRndc(entidadId);
    } else if (entidadTipo === 'Vehiculo' && processId === 12) {
      resultado = await vehiculoService.syncRndc(entidadId);
    } else if (entidadTipo === 'Remesa' && processId === 3) {
      resultado = await remesaService.enviarRndc(entidadId);
    } else if (entidadTipo === 'Remesa' && processId === 5) {
      resultado = await remesaService.cumplir(entidadId);
    } else if (entidadTipo === 'ManifiestoOperativo' && processId === 4) {
      resultado = await manifiestoService.enviarRndc(entidadId);
    } else if (entidadTipo === 'ManifiestoOperativo' && processId === 6) {
      resultado = await manifiestoService.cumplir(entidadId);
    } else {
      return NextResponse.json(
        {
          error: 'NOT_SUPPORTED',
          message: `No se puede reintentar automáticamente processId=${processId} para ${entidadTipo}`,
        },
        { status: 422 }
      );
    }

    // Manejar respuestas idempotentes
    if (resultado && 'ya_registrado' in resultado) return ok(resultado);
    if (resultado && 'ya_registrada' in resultado) return ok(resultado);

    if (!resultado.exitoso) return rndcError(resultado);

    return ok({
      ingresoid:  resultado.ingresoid,
      syncRndcId: resultado.syncRndcId,
    });
  } catch (e) { return handleError(e); }
}
