import { Suspense } from 'react';
import type { EstadoRndcRemesa } from '@prisma/client';
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { RemesasPageClient } from '@/components/operacional/remesas/RemesasPageClient';
import { serialize } from '@/lib/utils/serialize';

export const metadata = { title: 'Remesas | Operacional — CargoClick' };

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getString(v: string | string[] | undefined, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/**
 * Listado global de Remesas.
 * Server Component — soporta búsqueda (q), filtro por estadoRndc,
 * municipio origen/destino (DANE), año y mes.
 */
export default async function RemesasPage({ searchParams }: Props) {
  const raw        = await searchParams;
  const q          = getString(raw.q);
  const estadoRndc = getString(raw.estadoRndc);
  const origenDane = getString(raw.origenDane);
  const destinoDane= getString(raw.destinoDane);
  const anio       = getString(raw.anio)  ? Number(getString(raw.anio))  : undefined;
  const mes        = getString(raw.mes)   ? Number(getString(raw.mes))   : undefined;
  const page       = Math.max(1, Number(getString(raw.page, '1')));

  const [{ data, total }, aniosDisponibles] = await Promise.all([
    remesaRepository.findAll({
      q:          q  || undefined,
      estadoRndc: estadoRndc ? (estadoRndc as EstadoRndcRemesa) : undefined,
      origenDane: origenDane || undefined,
      destinoDane: destinoDane || undefined,
      anio,
      mes,
      page,
      pageSize:   PAGE_SIZE,
    }),
    remesaRepository.findAniosDisponibles(),
  ]);

  return (
    <Suspense>
      <RemesasPageClient
        items={serialize(data)}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        q={q}
        estadoRndc={estadoRndc}
        origenDane={origenDane}
        destinoDane={destinoDane}
        anio={anio ? String(anio) : ''}
        mes={mes ? String(mes) : ''}
        aniosDisponibles={aniosDisponibles}
      />
    </Suspense>
  );
}
