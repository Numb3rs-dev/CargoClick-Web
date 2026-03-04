import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/conductores/export-csv
 *
 * Exports conductores matching the given filter as a CSV download.
 * Query params: q
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q  = sp.get('q') || undefined;

  const where: Prisma.ConductorWhereInput = {
    ...(q && {
      OR: [
        { cedula:    { contains: q, mode: 'insensitive' } },
        { nombres:   { contains: q, mode: 'insensitive' } },
        { apellidos: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const data = await prisma.conductor.findMany({ where, orderBy: { apellidos: 'asc' } });

  const BOM = '\uFEFF';
  const SEP = ',';
  const headers = ['Cédula', 'Nombres', 'Apellidos', 'Cat. Licencia', 'Vig. Licencia', 'Teléfono', 'Email', 'Estado'];

  function esc(val: string | null | undefined): string {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  }

  function fmtDate(d: Date | string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const rows = data.map(c => [
    esc(c.cedula),
    esc(c.nombres),
    esc(c.apellidos),
    esc(c.categoriaLicencia),
    esc(fmtDate(c.licenciaVigencia)),
    esc(c.telefono),
    esc(c.email),
    esc(c.activo ? 'Activo' : 'Inactivo'),
  ].join(SEP));

  const csv = BOM + 'sep=' + SEP + '\n' + headers.map(h => esc(h)).join(SEP) + '\n' + rows.join('\n');
  const filename = `conductores_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
