import { notFound } from 'next/navigation';
import Link from 'next/link';
import { vehiculoRepository } from '@/lib/repositories/vehiculoRepository';
import { VehiculoForm } from '@/components/operacional/directorio/VehiculoForm';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ placa: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { placa } = await params;
  return { title: `Editar Vehículo ${placa} | Operacional — CargoClick` };
}

export default async function EditarVehiculoPage({ params }: Props) {
  const { placa } = await params;

  const vehiculo = await vehiculoRepository.findByPlaca(placa);
  if (!vehiculo) notFound();

  const defaultValues = {
    placa:             vehiculo.placa,
    propietarioNombre: vehiculo.propietarioNombre ?? '',
    propietarioId:     vehiculo.propietarioId     ?? '',
    configVehiculo:    vehiculo.configVehiculo     ?? '',
    capacidadTon:      vehiculo.capacidadTon != null ? String(Number(vehiculo.capacidadTon)) : '',
    tipoVehiculo:      vehiculo.tipoVehiculo       ?? '',
    anioVehiculo:      vehiculo.anioVehiculo != null ? String(vehiculo.anioVehiculo) : '',
    soatVigencia:      vehiculo.soatVigencia
      ? new Date(vehiculo.soatVigencia).toISOString().split('T')[0]
      : '',
    rtmVigencia:       vehiculo.rtmVigencia
      ? new Date(vehiculo.rtmVigencia).toISOString().split('T')[0]
      : '',
    notas: vehiculo.notas ?? '',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <nav style={{ fontSize: 13, color: '#9CA3AF' }}>
        <Link href="/operacional/vehiculos" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
          Vehículos
        </Link>{' '}›{' '}
        <Link href={`/operacional/vehiculos/${placa}`} style={{ color: '#9CA3AF', textDecoration: 'none' }}>
          {placa}
        </Link>{' '}›{' '}
        <span style={{ color: '#111827', fontWeight: 500 }}>Editar</span>
      </nav>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
        Editar vehículo <span style={{ fontFamily: 'monospace', color: '#6B7280', fontSize: 18 }}>{placa}</span>
      </h1>

      <VehiculoForm mode="editar" placa={placa} defaultValues={defaultValues} />
    </div>
  );
}
