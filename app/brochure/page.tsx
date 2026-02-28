'use client';

export default function BrochurePage() {
  return (
    <>
      {/* ── Estilos de impresión ────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: #F0F2F5;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          margin: 0 auto 24px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          position: relative;
          overflow: hidden;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            width: 100%;
            min-height: 100vh;
            margin: 0;
            box-shadow: none;
            page-break-after: always;
            break-after: page;
          }
          .page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          .no-print { display: none !important; }
        }

        /* ── Botón imprimir (solo pantalla) ── */
        .print-btn {
          display: block;
          width: 210mm;
          margin: 24px auto 0;
          padding: 14px;
          background: #0A2A5E;
          color: white;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          font-family: inherit;
        }
        @media print { .print-btn { display: none; } }
      `}</style>

      {/* ── Botón imprimir ─────────────────────────────────── */}
      <button className="print-btn no-print" onClick={() => window?.print()}>
        Imprimir / Guardar como PDF →
      </button>

      {/* ══════════════════════════════════════════════════════
          PÁGINA 1 — PORTADA
      ══════════════════════════════════════════════════════ */}
      <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Bloque superior — foto de camión con overlay */}
        <div style={{
          height: '148mm',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <img
            src="/assets/CamionConCarga.png"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          {/* Overlay oscuro */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(10,42,94,0.90) 0%, rgba(11,61,145,0.75) 60%, rgba(10,42,94,0.60) 100%)' }} />

          {/* Contenido sobre la foto */}
          <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '32px 40px' }}>
            {/* Logo en pastilla blanca */}
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: '#FFFFFF', borderRadius: '10px', padding: '10px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.22)', marginBottom: 'auto' }}>
              <img src="/assets/CargoClickLogoNombre.png" alt="CargoClick" style={{ height: '40px', width: 'auto', display: 'block' }} />
            </div>

            {/* Headline */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ width: '44px', height: '4px', background: '#1F7A5C', borderRadius: '2px', marginBottom: '20px' }} />
              <h1 style={{ color: '#FFFFFF', fontSize: '34px', fontWeight: 800, lineHeight: 1.15, marginBottom: '14px', maxWidth: '420px' }}>
                Logística terrestre con tecnología de hoy
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', lineHeight: 1.6, maxWidth: '360px' }}>
                Cotice, contrate y haga seguimiento de su carga — todo en línea, sin intermediarios.
              </p>
            </div>

            {/* Pill */}
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.30)', borderRadius: '100px', padding: '7px 20px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>
              Cobertura Nacional · Colombia
            </div>
          </div>
        </div>

        {/* Franja alianza con logos reales */}
        <div style={{ background: '#F5F7FA', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: '20px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
            <img src="/assets/CargoClickLogoNombre.png" alt="CargoClick" style={{ height: '26px', display: 'block' }} />
          </div>
          <div style={{ fontSize: '18px', color: '#9CA3AF', fontWeight: 300, flexShrink: 0 }}>+</div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
            <img src="/assets/NuevoMundoLogoNombreLadoDerecho.png" alt="Transportes Nuevo Mundo" style={{ height: '26px', display: 'block' }} />
          </div>
          <div style={{ flex: 1, paddingLeft: '8px', borderLeft: '2px solid #E5E7EB' }}>
            <p style={{ color: '#0A2A5E', fontWeight: 700, fontSize: '13px', marginBottom: '3px' }}>Una alianza estratégica</p>
            <p style={{ color: '#6B7280', fontSize: '12px', lineHeight: 1.5 }}>Más de <strong style={{ color: '#0A2A5E' }}>20 años</strong> de operación continua respaldan cada despacho en Colombia.</p>
          </div>
        </div>

        {/* Footer portada */}
        <div style={{
          background: '#0A2A5E',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>cargoclick.com.co</span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>info@cargoclick.com.co</span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>Bogotá, Colombia</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PÁGINA 2 — SERVICIOS
      ══════════════════════════════════════════════════════ */}
      <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Header página 2 */}
        <div style={{
          background: '#0A2A5E',
          padding: '14px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ background: '#fff', borderRadius: '6px', padding: '5px 14px' }}>
            <img src="/assets/CargoClickLogoNombre.png" alt="CargoClick" style={{ height: '22px', width: 'auto', display: 'block' }} />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.60)', fontSize: '12px', fontWeight: 500 }}>Portafolio de Servicios</span>
        </div>

        <div style={{ flex: 1, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Tipos de carga */}
          <div>
            <p style={{ color: '#0B3D91', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Tipos de carga
            </p>
            <h2 style={{ color: '#0A2A5E', fontSize: '22px', fontWeight: 800, marginBottom: '20px', lineHeight: 1.2 }}>
              ¿Qué tipo de carga transportamos?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[
                { icon: '📦', tipo: 'Carga General', ejemplos: 'Insumos, equipos, productos de consumo, mobiliario y materiales industriales.' },
                { icon: '🪨', tipo: 'Granel Sólido', ejemplos: 'Materiales de construcción, agregados, productos agrícolas y residuos industriales.' },
                { icon: '🛢️', tipo: 'Granel Líquido', ejemplos: 'Aceites industriales, líquidos alimentarios y fluidos de proceso en cisterna.' },
              ].map(t => (
                <div key={t.tipo} style={{
                  background: '#F5F7FA',
                  borderRadius: '10px',
                  padding: '16px',
                  borderTop: '3px solid #0B3D91',
                }}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>{t.icon}</span>
                  <p style={{ color: '#0A2A5E', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>{t.tipo}</p>
                  <p style={{ color: '#6B7280', fontSize: '12px', lineHeight: 1.6 }}>{t.ejemplos}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: '1px', background: '#E5E7EB' }} />

          {/* Incluido en cada despacho */}
          <div>
            <p style={{ color: '#0B3D91', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Sin costos ocultos
            </p>
            <h2 style={{ color: '#0A2A5E', fontSize: '22px', fontWeight: 800, marginBottom: '20px', lineHeight: 1.2 }}>
              Todo esto va incluido en cada despacho
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { icon: '📦', titulo: 'Embalaje de mercancía', desc: 'Embalamos su carga en origen para garantizar que llegue en perfectas condiciones.' },
                { icon: '🛰️', titulo: 'Monitoreo satelital', desc: 'Seguimiento en tiempo real de la ubicación, ruta y tiempos de entrega.' },
                { icon: '🏗️', titulo: 'Plataforma especial', desc: 'Equipos adecuados para carga voluminosa, pesada o de manejo especial.' },
                { icon: '🔄', titulo: 'Acarreos locales', desc: 'Desde su instalación hasta el vehículo, sin costos adicionales.' },
              ].map(item => (
                <div key={item.titulo} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <p style={{ color: '#0A2A5E', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{item.titulo}</p>
                    <p style={{ color: '#6B7280', fontSize: '12px', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cobertura banner con imagen */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative', height: '72px', flexShrink: 0 }}>
            <img src="/assets/CoberturaNacional.png" alt="Cobertura Nacional" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,42,94,0.88) 0%, rgba(11,61,145,0.70) 60%, rgba(10,42,94,0.50) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px' }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>🗺️</span>
              <div>
                <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>Cobertura nacional desde Bogotá</p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', lineHeight: 1.5 }}>Bogotá · Medellín · Cali · Barranquilla · Bucaramanga y más destinos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer página 2 */}
        <div style={{
          background: '#F5F7FA',
          borderTop: '1px solid #E5E7EB',
          padding: '12px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>cargoclick.com.co</span>
          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>2 / 3</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PÁGINA 3 — POR QUÉ ELEGIRNOS
      ══════════════════════════════════════════════════════ */}
      <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Header página 3 */}
        <div style={{
          background: '#0A2A5E',
          padding: '14px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ background: '#fff', borderRadius: '6px', padding: '5px 14px' }}>
            <img src="/assets/CargoClickLogoNombre.png" alt="CargoClick" style={{ height: '22px', width: 'auto', display: 'block' }} />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.60)', fontSize: '12px', fontWeight: 500 }}>Por qué elegirnos</span>
        </div>

        <div style={{ flex: 1, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Imagen de experiencia + diferenciadores */}
          <div>
            <p style={{ color: '#0B3D91', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Nuestros diferenciales</p>
            <h2 style={{ color: '#0A2A5E', fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>Lo mejor de dos mundos</h2>

            {/* Imagen 20 años */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', height: '90px', position: 'relative', marginBottom: '16px' }}>
              <img src="/assets/20AnosExp.png" alt="20 años de experiencia" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,42,94,0.82) 0%, rgba(10,42,94,0.4) 60%, transparent 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px' }}>+20 años de experiencia operacional en Colombia</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { n: '01', titulo: 'Experiencia comprobada', desc: 'Más de 20 años de operación continua respaldan cada despacho. Conocemos las rutas y tiempos del territorio colombiano.' },
                { n: '02', titulo: 'Innovación digital', desc: 'Cotice, contrate y haga seguimiento en línea. Sin llamadas, sin intermediarios, sin sorpresas.' },
                { n: '03', titulo: 'Cobertura nacional', desc: 'Operamos desde Bogotá hacia todo Colombia, con red de rutas establecida y probada.' },
                { n: '04', titulo: 'Versatilidad en carga', desc: 'Carga general, granel sólido y líquido, carga especial para sectores financiero, médico e industrial.' },
              ].map(d => (
                <div key={d.n} style={{
                  background: '#F5F7FA',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '30px', height: '30px', flexShrink: 0,
                    borderRadius: '7px',
                    background: 'linear-gradient(135deg, #0A2A5E, #0B3D91)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '11px', fontWeight: 800,
                  }}>
                    {d.n}
                  </div>
                  <div>
                    <p style={{ color: '#0A2A5E', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{d.titulo}</p>
                    <p style={{ color: '#6B7280', fontSize: '12px', lineHeight: 1.6 }}>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: '1px', background: '#E5E7EB' }} />

          {/* Sectores */}
          <div>
            <p style={{ color: '#0B3D91', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Trayectoria — Clientes de referencia
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { icon: '🏦', sector: 'Financiero', clientes: ['Banco Caja Social', 'Banco Colpatria'] },
                { icon: '🏥', sector: 'Salud', clientes: ['INCLISER – Ing. Clínica'] },
                { icon: '🏭', sector: 'Industrial', clientes: ['Sol. Técnicas Alimentarias', 'Maquinaria Hurtado'] },
              ].map(s => (
                <div key={s.sector} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '14px',
                }}>
                  <span style={{ fontSize: '20px', display: 'block', marginBottom: '6px' }}>{s.icon}</span>
                  <p style={{ color: '#0A2A5E', fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>{s.sector}</p>
                  {s.clientes.map(c => (
                    <p key={c} style={{ color: '#6B7280', fontSize: '11px', lineHeight: 1.6 }}>· {c}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* CTA final con imagen de fondo */}
          <div style={{
            borderRadius: '14px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <img src="/assets/AtencionPersonalizada.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,42,94,0.93), rgba(11,61,145,0.88))' }} />
          <div style={{
            position: 'relative', zIndex: 2,
            padding: '28px 32px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>
              ¿Listo para cotizar su próximo despacho?
            </p>
            <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: '13px', marginBottom: '18px', lineHeight: 1.6 }}>
              Cotización en línea en menos de 2 minutos. Sin llamadas. Todo incluido.
            </p>
            <div style={{
              display: 'inline-block',
              background: '#FFFFFF',
              color: '#0A2A5E',
              fontWeight: 800,
              fontSize: '15px',
              padding: '12px 32px',
              borderRadius: '8px',
              letterSpacing: '0.5px',
            }}>
              cargoclick.com.co/cotizar
            </div>
          </div>
          </div>
        </div>

        {/* Footer página 3 */}
        <div style={{
          background: '#F5F7FA',
          borderTop: '1px solid #E5E7EB',
          padding: '12px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>cargoclick.com.co · info@cargoclick.com.co</span>
          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>3 / 3</span>
        </div>
      </div>

    </>
  );
}
