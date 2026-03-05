import { NextRequest, NextResponse } from 'next/server';
import { clienteRepository } from '@/lib/repositories/clienteRepository';
import { z } from 'zod';

const updateSchema = z.object({
  tipoId:           z.enum(['N', 'C', 'P', 'E']).optional(),
  numeroId:         z.string().min(3).max(20).optional(),
  razonSocial:      z.string().min(2).max(200).optional(),
  nombres:          z.string().max(200).optional(),
  primerApellido:   z.string().max(100).optional(),
  segundoApellido:  z.string().max(100).optional(),
  email:            z.string().email().optional().or(z.literal('')),
  telefono:         z.string().max(30).optional(),
  activo:           z.boolean().optional(),
  notas:            z.string().max(1000).optional(),
});

/* ── GET /api/clientes/[id] ──────────────────────────────────────────────── */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await clienteRepository.findById(id);
  if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ data: cliente });
}

/* ── PATCH /api/clientes/[id] ────────────────────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    // Si se cambia el numeroId, verificar que no exista otro con ese número
    if (parsed.data.tipoId || parsed.data.numeroId) {
      const current = await clienteRepository.findById(id);
      if (!current) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      const tipoId   = parsed.data.tipoId   ?? current.tipoId;
      const numeroId = parsed.data.numeroId ?? current.numeroId;
      const dup = await clienteRepository.existsByNumeroId(tipoId, numeroId, id);
      if (dup) {
        return NextResponse.json({ error: `Ya existe otro cliente con ese ${tipoId === 'N' ? 'NIT' : 'documento'}`, code: 'DUPLICATE' }, { status: 409 });
      }
    }

    const updated = await clienteRepository.update(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /api/clientes/[id]]', err);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  }
}

/* ── DELETE /api/clientes/[id] (soft-delete) ─────────────────────────────── */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await clienteRepository.deactivate(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/clientes/[id]]', err);
    return NextResponse.json({ error: 'Error al desactivar cliente' }, { status: 500 });
  }
}
