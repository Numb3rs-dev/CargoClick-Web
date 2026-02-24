'use client';

/**
 * ConversacionLazy – wrapper cliente para carga diferida del formulario MUI.
 *
 * next/dynamic con ssr:false solo puede usarse en Client Components.
 * Este wrapper fino permite que page.tsx siga siendo Server Component
 * mientras el chunk pesado de MUI (ThemeRegistry incluido) se carga de forma
 * lazy en el cliente SIN formar parte del grafo de compilación del layout.
 *
 * El <Suspense> es necesario para que useSearchParams() (usado en
 * ConversacionCotizacion para leer ?reanudar=<id>) funcione correctamente
 * en Next.js 14 sin warnings de build.
 */
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ThemeRegistry } from '@/lib/theme/ThemeRegistry';

const LoadingSpinner = () => (
  <div
    style={{
      minHeight: 'calc(100vh - 160px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      background: '#FDFCFE',
    }}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '4px solid #E8EDF5',
        borderTopColor: '#0B3D91',
        animation: 'cg-spin 0.7s linear infinite',
      }}
      role="status"
      aria-label="Cargando formulario"
    />
    <p style={{ color: '#8895A2', fontSize: '15px', margin: 0, fontFamily: 'inherit' }}>
      Preparando formulario...
    </p>
    <style>{`@keyframes cg-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ConversacionCotizacion = dynamic(
  () =>
    import('./ConversacionCotizacion').then(
      (m) => ({ default: m.ConversacionCotizacion })
    ),
  {
    ssr: false,
    loading: LoadingSpinner,
  }
);

export default function ConversacionLazy() {
  return (
    <ThemeRegistry>
      <Suspense fallback={<LoadingSpinner />}>
        <ConversacionCotizacion />
      </Suspense>
    </ThemeRegistry>
  );
}
