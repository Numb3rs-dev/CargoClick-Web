import { vehiculoRepository } from '@/lib/repositories/vehiculoRepository';
import { prisma } from '@/lib/db/prisma';
import { type VehiculoWithRndc } from '@/components/operacional/directorio/VehiculoList';
import { VehiculosPageClient } from '@/components/operacional/directorio/VehiculosPageClient';
import { serialize } from '@/lib/utils/serialize';

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = { title: 'Vehículos | Operacional — CargoClick' };

export default async function VehiculosPage({ searchParams }: Props) {
  const raw  = await searchParams;
  const q    = typeof raw.q    === 'string' ? raw.q    : undefined;
  const page = typeof raw.page === 'string' ? Math.max(1, Number(raw.page)) : 1;

  // DB-level pagination
  const { data: paginated, total } = await vehiculoRepository.findAll({ q, page, pageSize: PAGE_SIZE });

  const ids   = paginated.map(v => v.id);
  const syncs = ids.length > 0
    ? await prisma.syncRndc.findMany({
        where:    { entidadTipo: 'Vehiculo', entidadId: { in: ids }, processId: 12 },
        orderBy:  { createdAt: 'desc' },
        distinct: ['entidadId'],
      })
    : [];

  const syncMap = new Map(syncs.map(s => [s.entidadId, s]));

  const items: VehiculoWithRndc[] = paginated.map(vehiculo => ({
    vehiculo,
    rndcStatus: syncMap.has(vehiculo.id)
      ? { exitoso: syncMap.get(vehiculo.id)!.exitoso, createdAt: syncMap.get(vehiculo.id)!.createdAt }
      : { exitoso: null },
  }));

  return (
    <VehiculosPageClient
      items={serialize(items)}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      q={q}
    />
  );
}
