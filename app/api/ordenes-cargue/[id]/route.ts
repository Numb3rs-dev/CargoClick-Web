import { NextRequest, NextResponse } from 'next/server';
import { ordenCargueRepository } from '@/lib/repositories/ordenCargueRepository';
import type { EstadoOrdenCargue } from '@prisma/client';
import { z } from 'zod';

const ESTADOS_VALIDOS: EstadoOrdenCargue[] = ['BORRADOR', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'];

const updateSchema = z.object({
  vehiculoPlaca:        z.string().max(10).nullable().optional(),
  conductorCedula:      z.string().max(20).nullable().optional(),
  estado:               z.enum(['BORRADOR', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA']).optional(),
  fechaHoraCargue:      z.string().nullable().optional(),
  puntoCargueDireccion: z.string().max(300).optional(),
  puntoCargueMunicipio: z.string().max(100).optional(),
  puntoCargueDane:      z.string().max(5).optional(),
  notas:                z.string().max(1000).optional(),
});

/* ── GET /api/ordenes-cargue/[id] ───────────────────────────────────────── */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orden = await ordenCargueRepository.findById(id);
  if (!orden) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json({ data: orden });
}

/* ── PATCH /api/ordenes-cargue/[id] ────────────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    // Validar que el estado sea válido si se envía
    if (parsed.data.estado && !ESTADOS_VALIDOS.includes(parsed.data.estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 422 });
    }

    const updated = await ordenCargueRepository.update(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /api/ordenes-cargue/[id]]', err);
    return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 });
  }
}

/* ── DELETE /api/ordenes-cargue/[id] (cancel) ──────────────────────────── */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const orden = await ordenCargueRepository.findById(id);
    if (!orden) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    if (['COMPLETADA', 'CANCELADA'].includes(orden.estado)) {
      return NextResponse.json({ error: `No se puede cancelar una orden en estado ${orden.estado}` }, { status: 409 });
    }
    const cancelled = await ordenCargueRepository.cancel(id);
    return NextResponse.json({ data: cancelled });
  } catch (err) {
    console.error('[DELETE /api/ordenes-cargue/[id]]', err);
    return NextResponse.json({ error: 'Error al cancelar orden' }, { status: 500 });
  }
}
