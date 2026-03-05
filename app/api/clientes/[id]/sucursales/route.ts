import { NextRequest, NextResponse } from 'next/server';
import { clienteRepository } from '@/lib/repositories/clienteRepository';
import { z } from 'zod';

const sucursalSchema = z.object({
  codSede:       z.string().min(1).max(5),
  nombre:        z.string().min(1).max(100),
  municipio:     z.string().max(100).optional(),
  daneMunicipio: z.string().max(5).optional(),
  direccion:     z.string().max(300).optional(),
  telefono:      z.string().max(30).optional(),
  email:         z.string().email().optional().or(z.literal('')),
  activo:        z.boolean().optional(),
  latitud:       z.number().min(-90).max(90).optional(),
  longitud:      z.number().min(-180).max(180).optional(),
});

/* ── POST /api/clientes/[id]/sucursales — crear o actualizar una sede ──── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clienteId } = await params;
  try {
    const body   = await req.json();
    const parsed = sucursalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }
    const sucursal = await clienteRepository.upsertSucursal(clienteId, parsed.data);
    return NextResponse.json({ data: sucursal }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/clientes/[id]/sucursales]', err);
    return NextResponse.json({ error: 'Error al guardar sucursal' }, { status: 500 });
  }
}
