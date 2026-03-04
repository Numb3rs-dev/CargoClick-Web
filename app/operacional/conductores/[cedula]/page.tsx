import { notFound } from 'next/navigation';
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { prisma } from '@/lib/db/prisma';
import { ConductorDetalle } from '@/components/operacional/directorio/ConductorDetalle';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ cedula: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cedula } = await params;
  return { title: `Conductor ${cedula} | Operacional — CargoClick` };
}

export default async function ConductorDetallePage({ params }: Props) {
  const { cedula } = await params;

  // Buscar conductor por cédula
  const conductor = await conductorRepository.findByCedula(cedula);
  if (!conductor) notFound();

  // Last RNDC sync (processId 11 = Conductor)
  const lastSync = await prisma.syncRndc.findFirst({
    where:   { entidadTipo: 'Conductor', entidadId: conductor.id, processId: 11 },
    orderBy: { createdAt: 'desc' },
  });

  // Last 5 manifiestos
  const manifiestos = await prisma.manifiestoOperativo.findMany({
    where:   { conductorCedula: conductor.cedula },
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
    <ConductorDetalle
      conductor={conductor}
      rndcExitoso={lastSync?.exitoso ?? null}
      rndcLastAt={lastSync?.createdAt ?? null}
      manifiestos={manifiestos}
    />
  );
}
