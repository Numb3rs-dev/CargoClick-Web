import { ordenCargueRepository } from '@/lib/repositories/ordenCargueRepository';
import { OrdenesCarguePageClient } from '@/components/operacional/ordenes-cargue/OrdenesCarguePageClient';
import type { EstadoOrdenCargue } from '@prisma/client';

export const metadata = { title: 'Órdenes de Cargue | CargoClick' };

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string; estado?: string }>;
}

const ESTADOS_VALIDOS: EstadoOrdenCargue[] = ['BORRADOR', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'];

export default async function OrdenesCargePage({ searchParams }: PageProps) {
  const sp       = await searchParams;
  const q        = sp.q        ?? '';
  const page     = Math.max(1, Number(sp.page     ?? '1'));
  const pageSize = Math.min(50, Number(sp.pageSize ?? '30'));
  const estadoRaw = sp.estado;
  const estado   = estadoRaw && ESTADOS_VALIDOS.includes(estadoRaw as EstadoOrdenCargue)
    ? (estadoRaw as EstadoOrdenCargue)
    : undefined;

  const { data: items, total } = await ordenCargueRepository.findAll({ q, estado, page, pageSize });

  return (
    <OrdenesCarguePageClient
      items={items}
      total={total}
      page={page}
      pageSize={pageSize}
      q={q}
      estado={estadoRaw ?? ''}
    />
  );
}
