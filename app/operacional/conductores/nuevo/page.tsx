import Link from 'next/link';
import { ConductorForm } from '@/components/operacional/directorio/ConductorForm';

export const metadata = { title: 'Nuevo Conductor | Operacional — CargoClick' };

export default function NuevoConductorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: '#6B7280' }}>
        <Link href="/operacional/conductores" style={{ color: '#6B7280', textDecoration: 'none' }}>
          Conductores
        </Link>{' '}
        › <span style={{ color: '#111827', fontWeight: 500 }}>Nuevo conductor</span>
      </nav>

      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>Nuevo Conductor</h1>

      <ConductorForm mode="crear" />
    </div>
  );
}
