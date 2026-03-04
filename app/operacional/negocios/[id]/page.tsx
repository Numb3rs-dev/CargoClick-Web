import { Suspense } from 'react';
import Link from 'next/link';
import { NegocioPanel } from '@/components/operacional/negocios/NegocioPanel';

export const metadata = { title: 'Detalle de Negocio | Operacional — CargoClick' };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Página de detalle de un Negocio Operacional.
 * Delega el fetching y renderizado a NegocioPanel (Server Component).
 */
export default async function NegocioDetallePage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      {/* Page header strip */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
            <Link href="/operacional/negocios" style={{ color: '#6B7280', textDecoration: 'none' }}>Negocios</Link>
            <span>›</span>
            <span style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 600 }}>{id}</span>
          </nav>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Panel del Negocio</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        <Suspense
          fallback={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[80, 32, 160, 120].map(h => (
                <div key={h} style={{ height: h, borderRadius: 10, background: '#F3F4F6' }} />
              ))}
            </div>
          }
        >
          <NegocioPanel id={id} />
        </Suspense>
      </div>
    </>
  );
}
