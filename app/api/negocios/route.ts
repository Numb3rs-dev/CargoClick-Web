/**
 * GET  /api/negocios — Lista negocios con filtro de estado y paginación.
 * POST /api/negocios — Crea un nuevo negocio (Ruta A desde solicitud o Ruta B manual).
 *
 * NuevoNegocio es la entidad central del módulo operacional.
 * Ruta A: viene de solicitudId (cotizador → negocio confirmado).
 * Ruta B: creación manual con clienteNombre + datos directos.
 *
 * @module NegociosRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { nuevoNegocioService } from '@/lib/services/nuevoNegocioService';
import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { paginacion } from '@/lib/validations/queryParams';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';
import type { EstadoNegocio } from '@prisma/client';

/**
 * Schema de validación para creación de negocio.
 * Ruta A: solicitudId | Ruta B: clienteNombre — al menos uno es obligatorio.
 */
const crearSchema = z.object({
  solicitudId:           z.string().cuid().optional(),
  cotizacionId:          z.string().cuid().optional(),
  ajusteComercialId:     z.string().cuid().optional(),
  clienteNombre:         z.string().min(2).max(100).optional(),
  clienteNit:            z.string().max(20).optional(),
  fechaDespachoEstimada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notas:                 z.string().max(1000).optional(),
}).refine(
  (d) => d.solicitudId || d.clienteNombre,
  { message: 'Se requiere solicitudId (Ruta A) o clienteNombre (Ruta B)', path: ['solicitudId'] }
);

/**
 * Lista negocios con paginación. Soporta filtro por estado via `?estado=CONFIRMADO`.
 *
 * @requires Auth Clerk
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const params = paginacion.extend({
    estado: z.string().optional(),
  }).safeParse(Object.fromEntries(req.nextUrl.searchParams));

  if (!params.success) return handleError(params.error);

  try {
    const { page, pageSize, estado } = params.data;
    const result = await nuevoNegocioRepository.findAll({
      estado: estado as EstadoNegocio | undefined,
      page,
      pageSize,
    });
    return ok(result.data, { total: result.total, page, pageSize });
  } catch (e) { return handleError(e); }
}

/**
 * Crea un nuevo negocio operativo.
 * Ruta A: asociado a una solicitud/cotización existente.
 * Ruta B: entrada directa con datos del cliente.
 *
 * @requires Auth Clerk
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const body = crearSchema.parse(await req.json());
    const negocio = await nuevoNegocioService.crear(body);
    return ok(negocio);
  } catch (e) { return handleError(e); }
}
