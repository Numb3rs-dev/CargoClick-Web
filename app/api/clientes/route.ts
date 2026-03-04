import { NextRequest, NextResponse } from 'next/server';
import { clienteRepository } from '@/lib/repositories/clienteRepository';
import { z } from 'zod';

const createSchema = z.object({
  tipoId:      z.enum(['N', 'C', 'E']),
  numeroId:    z.string().min(3).max(20),
  razonSocial: z.string().min(2).max(200),
  email:       z.string().email().optional().or(z.literal('')),
  telefono:    z.string().max(30).optional(),
  notas:       z.string().max(1000).optional(),
  sucursales: z.array(z.object({
    codSede:       z.string().min(1).max(5),
    nombre:        z.string().min(1).max(100),
    municipio:     z.string().max(100).optional(),
    daneMunicipio: z.string().max(5).optional(),
    direccion:     z.string().max(300).optional(),
    telefono:      z.string().max(30).optional(),
    email:         z.string().email().optional().or(z.literal('')),
  })).optional(),
});

/* ── GET /api/clientes ────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q        = searchParams.get('q')        ?? undefined;
  const page     = Math.max(1, Number(searchParams.get('page')     ?? '1'));
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? '30'));
  // ?mode=search → respuesta ligera para autocompletado
  const mode = searchParams.get('mode');

  try {
    if (mode === 'search' && q) {
      const data = await clienteRepository.search(q, 15);
      return NextResponse.json({ data });
    }

    const { data, total } = await clienteRepository.findAll({ q, page, pageSize });
    return NextResponse.json({ data, total, page, pageSize });
  } catch (err) {
    console.error('[GET /api/clientes]', err);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

/* ── POST /api/clientes ───────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { tipoId, numeroId } = parsed.data;

    // Verificar duplicado
    const existing = await clienteRepository.existsByNumeroId(tipoId, numeroId);
    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un cliente con ${tipoId === 'N' ? 'NIT' : 'documento'} ${numeroId}`, code: 'DUPLICATE' },
        { status: 409 },
      );
    }

    const cliente = await clienteRepository.create(parsed.data);
    return NextResponse.json({ data: cliente }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/clientes]', err);
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
