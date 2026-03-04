import { Suspense } from 'react';
import { manifiestoOperativoRepository } from '@/lib/repositories/manifiestoOperativoRepository';
import { type ManifiestoListItem } from '@/components/operacional/manifiestos/ManifiestoList';
import { ManifiestosPageClient } from '@/components/operacional/manifiestos/ManifiestosPageClient';
import type { RemesaItem } from '@/components/operacional/manifiestos/ManifiestoStepRemesas';
import { prisma } from '@/lib/db/prisma';
import { serialize } from '@/lib/utils/serialize';

export const metadata = { title: 'Manifiestos | Operacional — CargoClick' };

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getString(v: string | string[] | undefined, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/**
 * Listado global de Manifiestos Operativos.
 * Server Component — soporta búsqueda (q) y filtro por estadoManifiesto.
 */
export default async function ManifiestosPage({ searchParams }: Props) {
  const raw              = await searchParams;
  const q                = getString(raw.q);
  const estadoManifiesto = getString(raw.estadoManifiesto);
  const origenDane       = getString(raw.origenDane);
  const destinoDane      = getString(raw.destinoDane);
  const anio             = getString(raw.anio)  ? Number(getString(raw.anio))  : undefined;
  const mes              = getString(raw.mes)   ? Number(getString(raw.mes))   : undefined;
  const page             = Math.max(1, Number(getString(raw.page, '1')));

  const [{ data, total }, remesasRaw, aniosDisponibles] = await Promise.all([
    manifiestoOperativoRepository.findAll({
      q:                q  || undefined,
      estadoManifiesto: estadoManifiesto || undefined,
      origenDane:       origenDane       || undefined,
      destinoDane:      destinoDane      || undefined,
      anio,
      mes,
      page,
      pageSize:         PAGE_SIZE,
    }),
    prisma.remesa.findMany({
      where:   { estadoRndc: 'REGISTRADA', manifiestoOperativoId: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id:                    true,
        numeroRemesa:          true,
        descripcionCarga:      true,
        pesoKg:                true,
        origenMunicipio:       true,
        destinoMunicipio:      true,
        estadoRndc:            true,
        manifiestoOperativoId: true,
      },
      take: 200,
    }),
    manifiestoOperativoRepository.findAniosDisponibles(),
  ]);

  // Serialize Prisma Decimals/Dates to plain JS types for Client Components
  const items: ManifiestoListItem[]      = serialize(data) as ManifiestoListItem[];
  const remesasDisponibles: RemesaItem[] = serialize(remesasRaw).map((r: Record<string, unknown>) => ({
    ...r,
    estadoRndc: String(r.estadoRndc),
  })) as RemesaItem[];

  return (
    <Suspense>
      <ManifiestosPageClient
        items={items}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        q={q}
        estadoManifiesto={estadoManifiesto}
        origenDane={origenDane}
        destinoDane={destinoDane}
        anio={anio ? String(anio) : ''}
        mes={mes ? String(mes) : ''}
        aniosDisponibles={aniosDisponibles}
        remesasDisponibles={remesasDisponibles}
      />
    </Suspense>
  );
}
