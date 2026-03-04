import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma, EstadoNegocio } from '@prisma/client';

/**
 * GET /api/negocios/export-csv
 *
 * Exports negocios matching the given filters as a CSV download.
 * Query params: q, estado
 */
export async function GET(req: NextRequest) {
  const sp     = req.nextUrl.searchParams;
  const q      = sp.get('q') || undefined;
  const estado = sp.get('estado') || undefined;

  const where: Prisma.NuevoNegocioWhereInput = {
    ...(estado && { estado: estado as EstadoNegocio }),
    ...(q && {
      OR: [
        { codigoNegocio: { contains: q, mode: 'insensitive' } },
        { clienteNombre: { contains: q, mode: 'insensitive' } },
        { clienteNit:    { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const data = await prisma.nuevoNegocio.findMany({ where, orderBy: { createdAt: 'desc' } });

  const BOM = '\uFEFF';
  const SEP = ',';
  const headers = ['Código', 'Cliente', 'NIT', 'Estado', 'Fecha Despacho Est.', 'Fecha Cierre'];

  function esc(val: string | null | undefined): string {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  }

  function fmtDate(d: Date | string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const ESTADO_LABEL: Record<string, string> = {
    CONFIRMADO:     'Confirmado',
    EN_PREPARACION: 'En preparación',
    EN_TRANSITO:    'En tránsito',
    COMPLETADO:     'Completado',
    CANCELADO:      'Cancelado',
  };

  const rows = data.map(n => [
    esc(n.codigoNegocio),
    esc(n.clienteNombre),
    esc(n.clienteNit),
    esc(ESTADO_LABEL[n.estado] ?? n.estado),
    esc(fmtDate(n.fechaDespachoEstimada)),
    esc(fmtDate(n.fechaCierre)),
  ].join(SEP));

  const csv = BOM + 'sep=' + SEP + '\n' + headers.map(h => esc(h)).join(SEP) + '\n' + rows.join('\n');
  const filename = `negocios_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
