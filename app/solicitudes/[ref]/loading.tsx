/**
 * Skeleton de carga para /solicitudes/[ref]
 */

function SkeletonBar({ w = '100%', h = 16 }: { w?: string | number; h?: number }) {
  return (
    <div style={{
      width: w,
      height: h,
      background: 'linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      borderRadius: 6,
    }} />
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
        <SkeletonBar w={160} h={14} />
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[100, 80, 120, 90].map((w, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonBar w={`${w}px`} h={13} />
            <SkeletonBar w={80} h={13} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SolicitudLoading() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header placeholder */}
      <div style={{ height: 64, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }} />

      <main style={{ background: '#F3F4F6', minHeight: '100vh', padding: '32px 16px 64px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Breadcrumb */}
          <SkeletonBar w={160} h={13} />

          {/* Header card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E5E7EB',
            padding: '28px 32px',
            margin: '24px 0',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SkeletonBar w={80} h={24} />
              <SkeletonBar w={240} h={28} />
              <SkeletonBar w={180} h={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <SkeletonBar w={200} h={13} />
              <SkeletonBar w={160} h={13} />
            </div>
          </div>

          {/* Tarifa skeleton */}
          <div style={{
            background: '#D1FAE5',
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 24,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SkeletonBar w={120} h={14} />
              <SkeletonBar w={220} h={42} />
              <SkeletonBar w={280} h={13} />
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <SkeletonBar w={80} h={22} />
                  <SkeletonBar w={60} h={13} />
                </div>
              ))}
            </div>
          </div>

          {/* Grid de cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

        </div>
      </main>
    </>
  )
}
