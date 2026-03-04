import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/clientes/export-csv
 *
 * Exports clientes matching the given filter as a CSV download.
 * Query params: q
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q  = sp.get('q') || undefined;

  const where: Prisma.ClienteWhereInput = {
    ...(q && {
      OR: [
        { razonSocial: { contains: q, mode: 'insensitive' } },
        { numeroId:    { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const data = await prisma.cliente.findMany({
    where,
    include: { sucursales: { select: { id: true } } },
    orderBy: { razonSocial: 'asc' },
  });

  const BOM = '\uFEFF';
  const SEP = ',';
  const TIPO_LABEL: Record<string, string> = { N: 'NIT', C: 'Cédula', P: 'Pasaporte' };
  const headers = ['Razón Social', 'Tipo ID', 'Número ID', 'Email', 'Teléfono', 'Sedes', 'Estado'];

  function esc(val: string | null | undefined): string {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  }

  const rows = data.map(c => [
    esc(c.razonSocial),
    esc(TIPO_LABEL[c.tipoId] ?? c.tipoId),
    esc(c.numeroId),
    esc(c.email),
    esc(c.telefono),
    String(c.sucursales.length),
    esc(c.activo ? 'Activo' : 'Inactivo'),
  ].join(SEP));

  const csv = BOM + 'sep=' + SEP + '\n' + headers.map(h => esc(h)).join(SEP) + '\n' + rows.join('\n');
  const filename = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
