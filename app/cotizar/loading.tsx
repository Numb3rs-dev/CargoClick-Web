/**
 * loading.tsx – Skeleton para /cotizar.
 * Se muestra mientras Next.js renderiza el Server Component y carga ThemeRegistry.
 */
export default function CotizarLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FDFCFE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '4px solid #E8EDF5',
          borderTopColor: '#0B3D91',
          animation: 'spin 0.7s linear infinite',
        }}
        aria-label="Cargando formulario..."
        role="status"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
