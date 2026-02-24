/**
 * loading.tsx – Skeleton instantáneo para /home.
 * Se muestra mientras Next.js renderiza el Server Component.
 * Fondo y proporciones similares al Hero real para evitar layout shift.
 */
export default function HomeLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FCFBFE',
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
        aria-label="Cargando..."
        role="status"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
