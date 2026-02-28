export default function PreviewImagenes() {
  const pack1 = ['pack1-A','pack1-B','pack1-C','pack1-D'];
  const pack2 = ['pack2-A','pack2-B','pack2-C','pack2-D'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #E2E6EC; }
      `}</style>

      <div style={{ background: '#0A2A5E', padding: '20px 40px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.55, marginBottom: '4px' }}>CargoClick · Assets</div>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>Vista previa — Pack 1 y Pack 2</div>
        <div style={{ fontSize: '13px', opacity: 0.60, marginTop: '4px' }}>8 imágenes extraídas · 768×512px cada una</div>
      </div>

      <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif' }}>
        {/* Pack 1 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6B7280', marginBottom: '16px' }}>
            Pack 1
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {pack1.map(name => (
              <div key={name} style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', background: '#fff' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/${name}.png`} alt={name} style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{name}.png</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pack 2 */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6B7280', marginBottom: '16px' }}>
            Pack 2
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {pack2.map(name => (
              <div key={name} style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', background: '#fff' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/${name}.png`} alt={name} style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{name}.png</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
