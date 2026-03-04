import type { EstadoNegocio } from '@prisma/client';
import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { NegociosPageClient } from '@/components/operacional/negocios/NegociosPageClient';

export const metadata = { title: 'Negocios | Operacional — CargoClick' };

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getString(v: string | string[] | undefined, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/**
 * Listado de Negocios del Módulo Operacional.
 * Server Component — soporta vista Tabla y Kanban vía query param `vista`.
 * Filtrable por `q` (texto) y `estado`. Paginado con `page`.
 */
export default async function NegociosPage({ searchParams }: Props) {
  const raw    = await searchParams;
  const q      = getString(raw.q);
  const estado = getString(raw.estado);
  const page   = Math.max(1, Number(getString(raw.page, '1')));
  const vista  = getString(raw.vista, 'tabla') as 'tabla' | 'kanban';

  const pageSize = vista === 'kanban' ? 500 : PAGE_SIZE;

  const result = await nuevoNegocioRepository.findAll({
    estado:   estado ? (estado as EstadoNegocio) : undefined,
    q:        vista === 'kanban' ? undefined : (q || undefined),
    page:     vista === 'kanban' ? 1 : page,
    pageSize,
  });

  return (
    <NegociosPageClient
      items={result.data}
      total={result.total}
      page={page}
      pageSize={PAGE_SIZE}
      q={q}
      estado={estado}
      vista={vista}
    />
  );
}
