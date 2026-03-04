import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { prisma } from '@/lib/db/prisma';
import { type ConductorWithRndc } from '@/components/operacional/directorio/ConductorList';
import { ConductoresPageClient } from '@/components/operacional/directorio/ConductoresPageClient';
import { serialize } from '@/lib/utils/serialize';

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = { title: 'Conductores | Operacional — CargoClick' };

export default async function ConductoresPage({ searchParams }: Props) {
  const raw  = await searchParams;
  const q    = typeof raw.q    === 'string' ? raw.q    : undefined;
  const page = typeof raw.page === 'string' ? Math.max(1, Number(raw.page)) : 1;

  // DB-level pagination
  const { data: paginated, total } = await conductorRepository.findAll({ q, page, pageSize: PAGE_SIZE });

  // Batch-fetch the latest SyncRndc for each conductor in the current page
  const ids = paginated.map(c => c.id);
  const syncs = ids.length > 0
    ? await prisma.syncRndc.findMany({
        where:     { entidadTipo: 'Conductor', entidadId: { in: ids }, processId: 11 },
        orderBy:   { createdAt: 'desc' },
        distinct:  ['entidadId'],
      })
    : [];

  const syncMap = new Map(syncs.map(s => [s.entidadId, s]));

  const items: ConductorWithRndc[] = paginated.map(conductor => ({
    conductor,
    rndcStatus: syncMap.has(conductor.id)
      ? { exitoso: syncMap.get(conductor.id)!.exitoso, createdAt: syncMap.get(conductor.id)!.createdAt }
      : conductor.sincronizadoRndc
        ? { exitoso: true }
        : { exitoso: null },
  }));

  return (
    <ConductoresPageClient
      items={serialize(items)}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      q={q}
    />
  );
}
