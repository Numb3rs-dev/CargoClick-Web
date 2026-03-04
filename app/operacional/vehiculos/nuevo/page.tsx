import Link from 'next/link';
import { VehiculoForm } from '@/components/operacional/directorio/VehiculoForm';

export const metadata = { title: 'Nuevo Vehículo | Operacional — CargoClick' };

export default function NuevoVehiculoPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <nav style={{ fontSize: 13, color: '#9CA3AF' }}>
        <Link href="/operacional/vehiculos" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
          Vehículos
        </Link>{' '}
        › <span style={{ color: '#111827', fontWeight: 500 }}>Nuevo vehículo</span>
      </nav>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Nuevo Vehículo</h1>

      <VehiculoForm mode="crear" />
    </div>
  );
}
