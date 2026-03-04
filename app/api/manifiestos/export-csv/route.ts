import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/manifiestos/export-csv
 *
 * Exports ALL manifiestos matching the given filters as a CSV download.
 * Accepts the same query params as the list page:
 *   q, estadoManifiesto, origenDane, destinoDane, anio, mes
 */
export async function GET(req: NextRequest) {
  const sp                = req.nextUrl.searchParams;
  const q                 = sp.get('q') || undefined;
  const estadoManifiesto  = sp.get('estadoManifiesto') || undefined;
  const origenDane        = sp.get('origenDane') || undefined;
  const destinoDane       = sp.get('destinoDane') || undefined;
  const anioRaw           = sp.get('anio');
  const mesRaw            = sp.get('mes');
  const anio              = anioRaw ? Number(anioRaw) : undefined;
  const mes               = mesRaw  ? Number(mesRaw)  : undefined;

  /* --- Date range filter --- */
  let fechaFilter: { gte: Date; lt: Date } | undefined;
  if (anio) {
    const start = new Date(anio, (mes ?? 1) - 1, 1);
    const end   = mes ? new Date(anio, mes, 1) : new Date(anio + 1, 0, 1);
    fechaFilter = { gte: start, lt: end };
  }

  const where: Prisma.ManifiestoOperativoWhereInput = {
    ...(estadoManifiesto && { estadoManifiesto: estadoManifiesto as never }),
    ...(origenDane && { origenDane }),
    ...(destinoDane && { destinoDane }),
    ...(fechaFilter && { fechaExpedicion: fechaFilter }),
    ...(q && {
      OR: [
        { codigoInterno:     { contains: q, mode: 'insensitive' } },
        { numeroManifiesto:  { contains: q, mode: 'insensitive' } },
        { vehiculoPlaca:     { contains: q, mode: 'insensitive' } },
        { conductorCedula:   { contains: q, mode: 'insensitive' } },
        { origenMunicipio:   { contains: q, mode: 'insensitive' } },
        { destinoMunicipio:  { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const data = await prisma.manifiestoOperativo.findMany({
    where,
    include: {
      conductor: { select: { nombres: true, apellidos: true } },
      remesas:   { select: { id: true } },
    },
    orderBy: { fechaExpedicion: 'desc' },
  });

  /* --- Build CSV --- */
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  const SEP = ',';
  const headers = [
    'Código Interno',
    'Nº Manifiesto RNDC',
    'Origen',
    'Destino',
    'Conductor',
    'Placa',
    'Estado',
    'Remesas',
    'Fecha Expedición',
  ];

  function esc(val: string | null | undefined): string {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  }

  function fmtDate(d: Date | string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const rows = data.map(m => [
    esc(m.codigoInterno),
    esc(m.numeroManifiesto),
    esc(m.origenMunicipio),
    esc(m.destinoMunicipio),
    esc(m.conductor ? `${m.conductor.nombres} ${m.conductor.apellidos}` : ''),
    esc(m.vehiculoPlaca),
    esc(m.estadoManifiesto),
    String(m.remesas.length),
    esc(fmtDate(m.fechaExpedicion)),
  ].join(SEP));

  // "sep=," tells Excel which delimiter to use (needed for Spanish-locale systems)
  const csv = BOM + 'sep=' + SEP + '\n' + headers.map(h => esc(h)).join(SEP) + '\n' + rows.join('\n');

  const filename = `manifiestos_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
