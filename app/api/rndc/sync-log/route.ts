/**
 * GET /api/rndc/sync-log — Lista el log de llamadas SOAP al RNDC.
 *
 * Audit log append-only de todos los intentos de comunicación con el RNDC.
 * Útil para diagnóstico operativo, reintentos y trazabilidad de errores.
 *
 * Filtros soportados via query params:
 * - exitoso: true | false
 * - processId: 3 | 4 | 5 | 6 | 11 | 12 | 32
 * - entidadTipo: Remesa | ManifiestoOperativo | Conductor | Vehiculo
 *
 * @module RndcSyncLogRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { syncRndcRepository } from '@/lib/repositories/syncRndcRepository';
import { paginacion } from '@/lib/validations/queryParams';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

/**
 * Lista el log RNDC con filtros y paginación.
 *
 * @requires Auth Clerk
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const params = paginacion.extend({
    exitoso:     z.coerce.boolean().optional(),
    processId:   z.coerce.number().optional(),
    entidadTipo: z.string().optional(),
  }).safeParse(Object.fromEntries(req.nextUrl.searchParams));

  if (!params.success) return handleError(params.error);

  try {
    const { page, pageSize, exitoso, processId, entidadTipo } = params.data;
    const result = await syncRndcRepository.findAll({
      exitoso,
      processId,
      entidadTipo,
      page,
      pageSize,
    });
    return ok(result.data, { total: result.total, page, pageSize });
  } catch (e) { return handleError(e); }
}
