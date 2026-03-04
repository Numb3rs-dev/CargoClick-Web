/**
 * GET   /api/negocios/[id] — Detalle completo de un negocio.
 * PATCH /api/negocios/[id] — Actualiza estado, notas o fecha de despacho.
 *
 * @module NegocioDetalleRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { ok, handleError, requireAuth } from '@/lib/utils/apiHelpers';
import type { EstadoNegocio } from '@prisma/client';

/**
 * Schema de actualización parcial del negocio.
 */
const actualizarSchema = z.object({
  estado:                z.string().optional() as z.ZodOptional<z.ZodType<EstadoNegocio>>,
  notas:                 z.string().max(1000).optional(),
  fechaDespachoEstimada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  clienteNombre:         z.string().min(2).max(100).optional(),
  clienteNit:            z.string().max(20).optional(),
});

/**
 * Devuelve el detalle completo del negocio con sus remesas, manifiestos y seguimientos.
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
    const negocio = await nuevoNegocioRepository.findById(id);
    if (!negocio) return handleError(new Error(`Negocio ${id} no encontrado`));
    return ok(negocio);
  } catch (e) { return handleError(e); }
}

/**
 * Actualiza campos editables del negocio (estado, notas, fechaDespachoEstimada).
 *
 * @requires Auth Clerk
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await params;
    const body = actualizarSchema.parse(await req.json());

    // Convertir fechaDespachoEstimada a Date si viene como string
    const data: Record<string, unknown> = { ...body };
    if (body.fechaDespachoEstimada) {
      data.fechaDespachoEstimada = new Date(body.fechaDespachoEstimada);
    }

    const negocio = await nuevoNegocioRepository.update(id, data);
    return ok(negocio);
  } catch (e) { return handleError(e); }
}
