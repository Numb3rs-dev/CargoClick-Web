import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma, EstadoOrdenCargue } from '@prisma/client';

/**
 * GET /api/ordenes-cargue/export-csv
 *
 * Exports órdenes de cargue matching the given filters as a CSV download.
 * Query params: q, estado
 */
export async function GET(req: NextRequest) {
  const sp     = req.nextUrl.searchParams;
  const q      = sp.get('q') || undefined;
  const estado = sp.get('estado') || undefined;

  const where: Prisma.OrdenCargueWhereInput = {
    ...(estado && { estado: estado as EstadoOrdenCargue }),
    ...(q && {
      OR: [
        { numeroOrden:          { contains: q, mode: 'insensitive' } },
        { vehiculoPlaca:        { contains: q, mode: 'insensitive' } },
        { puntoCargueMunicipio: { contains: q, mode: 'insensitive' } },
        { nuevoNegocio: { codigoNegocio: { contains: q, mode: 'insensitive' } } },
        { nuevoNegocio: { clienteNombre: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  };

  const data = await prisma.ordenCargue.findMany({
    where,
    include: {
      nuevoNegocio: { select: { codigoNegocio: true, clienteNombre: true } },
      conductor:    { select: { nombres: true, apellidos: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const BOM = '\uFEFF';
  const SEP = ',';
  const headers = ['#Orden', 'Negocio', 'Cliente', 'Vehículo', 'Conductor', 'Fecha Cargue', 'Municipio', 'Dirección', 'Estado'];

  function esc(val: string | null | undefined): string {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  }

  function fmtDateTime(d: Date | string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  const ESTADO_LABEL: Record<string, string> = {
    BORRADOR:   'Borrador',
    ASIGNADA:   'Asignada',
    EN_CURSO:   'En curso',
    COMPLETADA: 'Completada',
    CANCELADA:  'Cancelada',
  };

  const rows = data.map(o => [
    esc(o.numeroOrden),
    esc(o.nuevoNegocio.codigoNegocio),
    esc(o.nuevoNegocio.clienteNombre),
    esc(o.vehiculoPlaca),
    esc(o.conductor ? `${o.conductor.nombres} ${o.conductor.apellidos}` : ''),
    esc(fmtDateTime(o.fechaHoraCargue)),
    esc(o.puntoCargueMunicipio),
    esc(o.puntoCargueDireccion),
    esc(ESTADO_LABEL[o.estado] ?? o.estado),
  ].join(SEP));

  const csv = BOM + 'sep=' + SEP + '\n' + headers.map(h => esc(h)).join(SEP) + '\n' + rows.join('\n');
  const filename = `ordenes_cargue_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
