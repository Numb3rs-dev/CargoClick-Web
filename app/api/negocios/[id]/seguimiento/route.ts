/**
 * GET  /api/negocios/[id]/seguimiento — Historial de hitos de seguimiento.
 * POST /api/negocios/[id]/seguimiento — Registra un nuevo hito de seguimiento.
 *
 * SeguimientoCliente es un log append-only de eventos del viaje visible para el cliente.
 * Los hitos reflejan el estado del despacho en tiempo real.
 *
 * @module NegocioSeguimientoRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { seguimientoClienteRepository } from '@/lib/repositories/seguimientoClienteRepository';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';
import type { HitoSeguimiento, CanalNotificacion } from '@prisma/client';

/**
 * Schema de validación para registrar un hito de seguimiento.
 * Usa el enum HitoSeguimiento definido en el schema Prisma.
 */
const hitoSchema = z.object({
  hito: z.enum([
    'NEGOCIO_CONFIRMADO',
    'REMESAS_ASIGNADAS',
    'DESPACHADO',
    'EN_RUTA',
    'EN_DESTINO',
    'ENTREGADO',
    'NOVEDAD',
  ] as [HitoSeguimiento, ...HitoSeguimiento[]]),
  descripcion:           z.string().max(300).optional(),
  ubicacionActual:       z.string().max(100).optional(),
  manifiestoOperativoId: z.string().cuid().optional(),
  canalNotificacion:     z.enum(['WHATSAPP', 'EMAIL', 'PORTAL', 'SMS'] as [CanalNotificacion, ...CanalNotificacion[]]).default('PORTAL'),
});

/**
 * Devuelve el historial de seguimiento del negocio en orden cronológico.
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
    const hitos = await seguimientoClienteRepository.findByNegocio(id);
    return ok(hitos, { total: hitos.length });
  } catch (e) { return handleError(e); }
}

/**
 * Registra un nuevo hito de seguimiento (append-only).
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
    const body = hitoSchema.parse(await req.json());
    const hito = await seguimientoClienteRepository.create({
      hito:             body.hito,
      descripcion:      body.descripcion,
      ubicacionActual:  body.ubicacionActual,
      canalNotificacion: body.canalNotificacion,
      nuevoNegocio:     { connect: { id } },
      ...(body.manifiestoOperativoId && {
        manifiestoOperativoId: body.manifiestoOperativoId,
      }),
    });
    return ok(hito);
  } catch (e) { return handleError(e); }
}
