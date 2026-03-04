import { Suspense } from 'react';
import Link from 'next/link';
import { NuevoNegocioSelector } from '@/components/operacional/negocios/NuevoNegocioSelector';

export const metadata = { title: 'Nuevo Negocio | Operacional — CargoClick' };

/**
 * Página de creación de nuevo negocio.
 * Renders NuevoNegocioSelector (client component) que permite elegir
 * entre Ruta A (desde solicitud aprobada) y Ruta B (negocio directo).
 */
export default function NuevoNegocioPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B7280' }}>
        <Link href="/operacional/negocios" style={{ color: '#6B7280', textDecoration: 'none' }}>
          Negocios
        </Link>
        <span>›</span>
        <span style={{ color: '#111827' }}>Nuevo Negocio</span>
      </nav>

      {/* Selector (Client Component) */}
      <Suspense>
        <NuevoNegocioSelector />
      </Suspense>
    </div>
  );
}
