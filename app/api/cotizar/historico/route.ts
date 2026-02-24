/**
 * POST /api/cotizar/historico
 *
 * CotizaciÃ³n basada en manifiestos RNDC histÃ³ricos.
 * Responde cuÃ¡nto cobrÃ³ el mercado real por rutas similares.
 *
 * Body: { origen: string, destino: string, pesoKg: number }
 *
 * LÃ³gica de fallback:
 *   Nivel 1 â†’ Ruta exacta (ciudad-ciudad) + banda de peso Â±60%
 *   Nivel 2 â†’ Mismos departamentos + banda de peso Â±60%
 *   Nivel 3 â†’ Nacional, solo banda de peso Â±60%
 *
 * GET /api/cotizar/historico?tipo=origenes|destinos|rutas
 *   Listados para autocompletar en el formulario.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { consultarRndc } from '@/lib/services/rndcEngine';

// â”€â”€ GET â€” listas para autocompletar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get('tipo') ?? 'origenes';

  if (tipo === 'origenes') {
    const rows = await prisma.manifiestoRndc.groupBy({
      by: ['origen', 'origenDept'],
      orderBy: { _count: { origen: 'desc' } },
    });
    return NextResponse.json({
      data: rows.map(r => ({
        ciudad: r.origen,
        dept:   r.origenDept,
        label:  `${r.origen} (${r.origenDept})`,
      })),
    });
  }

  if (tipo === 'destinos') {
    const rows = await prisma.manifiestoRndc.groupBy({
      by: ['destino', 'destinoDept'],
      orderBy: { _count: { destino: 'desc' } },
    });
    return NextResponse.json({
      data: rows.map(r => ({
        ciudad: r.destino,
        dept:   r.destinoDept,
        label:  `${r.destino} (${r.destinoDept})`,
      })),
    });
  }

  if (tipo === 'rutas') {
    const rows = await prisma.manifiestoRndc.groupBy({
      by: ['origen', 'destino'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 30,
    });
    return NextResponse.json({
      data: rows.map(r => ({
        origen:  r.origen,
        destino: r.destino,
        viajes:  r._count.id,
      })),
    });
  }

  return NextResponse.json(
    { error: 'tipo no vÃ¡lido (origenes|destinos|rutas)' },
    { status: 400 },
  );
}

// â”€â”€ POST â€” cotizaciÃ³n histÃ³rica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(req: NextRequest) {
  let body: { origen?: string; destino?: string; pesoKg?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invÃ¡lido' }, { status: 400 });
  }

  const origen  = body.origen?.trim();
  const destino = body.destino?.trim();
  const pesoKg  = Number(body.pesoKg);

  if (!origen || !destino || !pesoKg || pesoKg <= 0) {
    return NextResponse.json(
      { error: 'ParÃ¡metros requeridos: origen, destino, pesoKg > 0' },
      { status: 400 },
    );
  }

  const resultado = await consultarRndc(origen, destino, pesoKg);

  if (!resultado) {
    return NextResponse.json(
      { error: 'No hay datos histÃ³ricos suficientes para esta consulta.' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    origen:           origen.toUpperCase(),
    destino:          destino.toUpperCase(),
    pesoKgConsultado: pesoKg,
    ...resultado,
  });
}
