import { notFound } from 'next/navigation';
import Link from 'next/link';
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { ConductorForm } from '@/components/operacional/directorio/ConductorForm';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ cedula: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cedula } = await params;
  return { title: `Editar Conductor ${cedula} | Operacional — CargoClick` };
}

export default async function EditarConductorPage({ params }: Props) {
  const { cedula } = await params;

  const conductor = await conductorRepository.findByCedula(cedula);
  if (!conductor) notFound();

  const defaultValues = {
    cedula:            conductor.cedula,
    nombres:           conductor.nombres,
    apellidos:         conductor.apellidos,
    categoriaLicencia: conductor.categoriaLicencia as
      'A1' | 'A2' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3',
    licenciaVigencia:  conductor.licenciaVigencia
      ? new Date(conductor.licenciaVigencia).toISOString().split('T')[0]
      : undefined,
    telefono: conductor.telefono ?? undefined,
    email:    conductor.email    ?? undefined,
    notas:    conductor.notas    ?? undefined,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <nav style={{ fontSize: 13, color: '#6B7280' }}>
        <Link href="/operacional/conductores" style={{ color: '#6B7280', textDecoration: 'none' }}>
          Conductores
        </Link>{' '}›{' '}
        <Link
          href={`/operacional/conductores/${cedula}`}
          style={{ color: '#6B7280', textDecoration: 'none' }}
        >
          {conductor.nombres} {conductor.apellidos}
        </Link>{' '}›{' '}
        <span style={{ color: '#111827', fontWeight: 500 }}>Editar</span>
      </nav>

      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>
        Editar conductor <span style={{ fontFamily: 'monospace', color: '#6B7280', fontSize: 17 }}>{cedula}</span>
      </h1>

      <ConductorForm mode="editar" cedula={cedula} defaultValues={defaultValues} />
    </div>
  );
}
