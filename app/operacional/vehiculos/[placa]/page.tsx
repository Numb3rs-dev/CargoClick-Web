import { notFound } from 'next/navigation';
import { vehiculoRepository } from '@/lib/repositories/vehiculoRepository';
import { prisma } from '@/lib/db/prisma';
import { VehiculoDetalle } from '@/components/operacional/directorio/VehiculoDetalle';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ placa: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { placa } = await params;
  return { title: `Vehículo ${placa} | Operacional — CargoClick` };
}

export default async function VehiculoDetallePage({ params }: Props) {
  const { placa } = await params;

  // Buscar vehículo por placa
  const vehiculo = await vehiculoRepository.findByPlaca(placa);
  if (!vehiculo) notFound();

  // Last RNDC sync (processId 12 = Vehículo)
  const lastSync = await prisma.syncRndc.findFirst({
    where:   { entidadTipo: 'Vehiculo', entidadId: vehiculo.id, processId: 12 },
    orderBy: { createdAt: 'desc' },
  });

  // Last 5 manifiestos
  const manifiestos = await prisma.manifiestoOperativo.findMany({
    where:   { vehiculoPlaca: vehiculo.placa },
    orderBy: { createdAt: 'desc' },
    take:    5,
    select: {
      id:               true,
      codigoInterno:    true,
      origenMunicipio:  true,
      destinoMunicipio: true,
      estadoManifiesto: true,
    },
  });

  return (
    <VehiculoDetalle
      vehiculo={vehiculo}
      rndcExitoso={lastSync?.exitoso ?? null}
      rndcLastAt={lastSync?.createdAt ?? null}
      manifiestos={manifiestos}
    />
  );
}
