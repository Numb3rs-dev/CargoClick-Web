import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/vehiculos/export-csv
 *
 * Exports vehiculos matching the given filter as a CSV download.
 * Query params: q
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q  = sp.get('q') || undefined;

  const where: Prisma.VehiculoWhereInput = {
    ...(q && {
      OR: [
        { placa:             { contains: q, mode: 'insensitive' } },
        { propietarioNombre: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const data = await prisma.vehiculo.findMany({ where, orderBy: { placa: 'asc' } });

  const BOM = '\uFEFF';
  const SEP = ',';
  const headers = ['Placa', 'Configuración', 'Propietario', 'Capacidad (t)', 'SOAT Vigencia', 'Estado'];

  function esc(val: string | null | undefined): string {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  }

  function fmtDate(d: Date | string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const rows = data.map(v => {
    const cap = v.capacidadTon ? Number(v.capacidadTon) : '';
    return [
      esc(v.placa),
      esc(v.configVehiculo),
      esc(v.propietarioNombre),
      String(cap),
      esc(fmtDate(v.soatVigencia)),
      esc(v.activo ? 'Activo' : 'Inactivo'),
    ].join(SEP);
  });

  const csv = BOM + 'sep=' + SEP + '\n' + headers.map(h => esc(h)).join(SEP) + '\n' + rows.join('\n');
  const filename = `vehiculos_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
