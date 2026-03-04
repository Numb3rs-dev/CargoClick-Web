import { NextRequest, NextResponse } from 'next/server';
import { ordenCargueRepository } from '@/lib/repositories/ordenCargueRepository';
import type { EstadoOrdenCargue } from '@prisma/client';
import { z } from 'zod';

const createSchema = z.object({
  nuevoNegocioId:        z.string().min(1),
  vehiculoPlaca:         z.string().max(10).optional(),
  conductorCedula:       z.string().max(20).optional(),
  fechaHoraCargue:       z.string().optional(),
  puntoCargueDireccion:  z.string().max(300).optional(),
  puntoCargueMunicipio:  z.string().max(100).optional(),
  puntoCargueDane:       z.string().max(5).optional(),
  notas:                 z.string().max(1000).optional(),
});

const ESTADOS_VALIDOS: EstadoOrdenCargue[] = ['BORRADOR', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'];

/* ── GET /api/ordenes-cargue ────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams;
  const q        = sp.get('q')        ?? undefined;
  const page     = Math.max(1, Number(sp.get('page')     ?? '1'));
  const pageSize = Math.min(50, Number(sp.get('pageSize') ?? '30'));
  const estadoRaw = sp.get('estado');
  const estado   = estadoRaw && ESTADOS_VALIDOS.includes(estadoRaw as EstadoOrdenCargue)
    ? (estadoRaw as EstadoOrdenCargue)
    : undefined;

  try {
    const { data, total } = await ordenCargueRepository.findAll({ q, estado, page, pageSize });
    return NextResponse.json({ data, total, page, pageSize });
  } catch (err) {
    console.error('[GET /api/ordenes-cargue]', err);
    return NextResponse.json({ error: 'Error al obtener órdenes de cargue' }, { status: 500 });
  }
}

/* ── POST /api/ordenes-cargue ───────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }
    const orden = await ordenCargueRepository.create(parsed.data);
    return NextResponse.json({ data: orden }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/ordenes-cargue]', err);
    return NextResponse.json({ error: 'Error al crear orden de cargue' }, { status: 500 });
  }
}
