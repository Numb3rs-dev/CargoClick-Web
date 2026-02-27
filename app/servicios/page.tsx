import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Servicios de Transporte de Carga – CargoClick',
  description:
    'Transporte terrestre nacional de carga general, granel sólido y granel líquido en Colombia. Embalaje, monitoreo satelital, plataforma especial y acarreos incluidos en cada despacho.',
  alternates: {
    canonical: 'https://cargoclick.com.co/servicios',
  },
  openGraph: {
    title: 'Servicios de Transporte de Carga – CargoClick',
    description:
      'Carga general, granel, plataforma especial. Cobertura nacional desde Bogotá. Todo incluido, cotiza en línea.',
    type: 'website',
    url: 'https://cargoclick.com.co/servicios',
  },
};

const tiposCarga = [
  {
    icon: '📦',
    tipo: 'Carga General',
    descripcion:
      'Mercancías paletizadas, embaladas o en cajas. Insumos industriales, productos de consumo, equipos y materiales de construcción. Ideal para envíos empresariales recurrentes o puntuales.',
    ejemplos: ['Insumos y materiales', 'Productos de consumo masivo', 'Equipos y maquinaria liviana', 'Mobiliario y enseres'],
  },
  {
    icon: '🪨',
    tipo: 'Granel Sólido',
    descripcion:
      'Materiales sueltos o a granel que no requieren contenedor hermético. Cargamos y movilizamos productos a granel con vehículos adecuados para este tipo de material.',
    ejemplos: ['Materiales de construcción', 'Arena, gravilla y agregados', 'Productos agrícolas', 'Residuos industriales'],
  },
  {
    icon: '🛢️',
    tipo: 'Granel Líquido',
    descripcion:
      'Transporte de líquidos en cisterna o contenedores especializados. Operamos con protocolos de seguridad y contención para fluidos industriales y alimentarios.',
    ejemplos: ['Aceites industriales', 'Líquidos alimentarios', 'Químicos no peligrosos', 'Fluidos de proceso'],
  },
];

const incluidoEnDespacho = [
  {
    icon: '📦',
    titulo: 'Embalaje de mercancía',
    descripcion:
      'Embalamos su carga de forma óptima en origen, garantizando que el producto llegue en perfectas condiciones al destino final.',
  },
  {
    icon: '🛰️',
    titulo: 'Monitoreo satelital',
    descripcion:
      'Seguimiento en tiempo real de cada despacho. Visibilidad sobre la ubicación, ruta y tiempos estimados de entrega.',
  },
  {
    icon: '🏗️',
    titulo: 'Servicio especial de plataforma',
    descripcion:
      'Para cargas voluminosas, pesadas o de manejo especial, disponemos de plataformas y equipos adecuados al tipo de mercancía.',
  },
  {
    icon: '🔄',
    titulo: 'Acarreos locales',
    descripcion:
      'Incluimos el acarreo desde su bodega o instalación hasta el vehículo de carga. Sin costos ocultos ni coordinaciones adicionales.',
  },
];

export default function ServiciosPage() {
  return (
    <>
      <Header />
      <main>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section
          style={{
            background: 'linear-gradient(135deg, #0A2A5E 0%, #0B3D91 100%)',
            padding: '96px 24px 80px',
          }}
        >
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <p
              style={{
                color: '#60A5FA',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}
            >
              Servicios
            </p>
            <h1
              style={{
                color: '#FFFFFF',
                fontSize: 'clamp(28px, 4.5vw, 52px)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: '20px',
              }}
            >
              Todo el portafolio logístico,{' '}
              <span style={{ color: '#60A5FA' }}>cotiza en línea</span>
            </h1>
            <p
              style={{
                color: '#CBD5E1',
                fontSize: 'clamp(15px, 2vw, 18px)',
                lineHeight: 1.7,
                marginBottom: '36px',
                maxWidth: '540px',
                margin: '0 auto 36px',
              }}
            >
              Transporte terrestre nacional con embalaje, monitoreo satelital y acarreos
              incluidos en cada despacho. Respaldado por más de 20 años de operación logística.
            </p>
            <a
              href="/cotizar"
              style={{
                display: 'inline-block',
                background: '#FFFFFF',
                color: '#0A2A5E',
                fontWeight: 700,
                fontSize: '16px',
                padding: '14px 36px',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              Cotizar ahora →
            </a>
          </div>
        </section>

        {/* ── Tipos de carga ───────────────────────────────────── */}
        <section style={{ background: '#F5F7FA', padding: '80px 24px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <p
                style={{
                  color: '#0B3D91',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                Tipos de carga
              </p>
              <h2
                style={{
                  color: '#0A2A5E',
                  fontSize: 'clamp(22px, 3vw, 34px)',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                ¿Qué tipo de carga necesita transportar?
              </h2>
              <p style={{ color: '#6B7280', fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
                Cotizamos cualquiera de estas categorías en menos de 2 minutos, directamente en línea.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '28px',
              }}
            >
              {tiposCarga.map((t) => (
                <div
                  key={t.tipo}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '32px',
                    boxShadow: '0 2px 16px rgba(10,42,94,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: '1px solid rgba(10,42,94,0.06)',
                  }}
                >
                  <div style={{ fontSize: '36px' }}>{t.icon}</div>
                  <h3
                    style={{
                      color: '#0A2A5E',
                      fontSize: '19px',
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {t.tipo}
                  </h3>
                  <p style={{ color: '#374151', fontSize: '14px', lineHeight: 1.75, margin: 0 }}>
                    {t.descripcion}
                  </p>
                  <ul
                    style={{
                      listStyle: 'none',
                      margin: 0,
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {t.ejemplos.map((e) => (
                      <li
                        key={e}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#6B7280',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: '#0B3D91', fontWeight: 700 }}>·</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <a
                href="/cotizar"
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #0A2A5E, #0B3D91)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '16px',
                  padding: '14px 40px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(10,42,94,0.25)',
                }}
              >
                Cotizar mi envío →
              </a>
            </div>
          </div>
        </section>

        {/* ── Cobertura nacional ───────────────────────────────── */}
        <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            <div>
              <p
                style={{
                  color: '#0B3D91',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                Cobertura
              </p>
              <h2
                style={{
                  color: '#0A2A5E',
                  fontSize: 'clamp(22px, 3vw, 34px)',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: '20px',
                }}
              >
                Cobertura nacional,<br />operamos en todo Colombia
              </h2>
              <p style={{ color: '#374151', fontSize: '16px', lineHeight: 1.8, marginBottom: '24px' }}>
                Desde Bogotá coordinamos despachos hacia cualquier municipio del país.
                Con más de 20 años de experiencia, conocemos las rutas, los tiempos reales
                y los requerimientos de cada region.
              </p>
              <p style={{ color: '#374151', fontSize: '16px', lineHeight: 1.8, marginBottom: '32px' }}>
                Opera tanto para envíos puntuales como para empresas con necesidades
                logísticas recurrentes. Cada despacho recibe el mismo nivel de atención.
              </p>
              <a
                href="/cotizar"
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #0A2A5E, #0B3D91)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '15px',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                Ver disponibilidad →
              </a>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {[
                { label: 'Ciudades principales', valor: 'Bogotá, Medellín, Cali, Barranquilla, Bucaramanga y más' },
                { label: 'Alcance', valor: 'Cualquier municipio con vía terrestre accesible en Colombia' },
                { label: 'Desde', valor: 'Bogotá, con red de operación cubriendo el territorio nacional' },
                { label: 'Entrega', valor: 'Tiempos reales indicados al cotizar, según distancia y ruta' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: '#F5F7FA',
                    borderRadius: '10px',
                    padding: '18px 22px',
                    borderLeft: '3px solid #0B3D91',
                  }}
                >
                  <p style={{ color: '#0B3D91', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    {item.label}
                  </p>
                  <p style={{ color: '#0A2A5E', fontSize: '14px', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                    {item.valor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Incluido en cada despacho ────────────────────────── */}
        <section style={{ background: 'linear-gradient(180deg, #F0F4FF 0%, #E8EDF8 100%)', padding: '80px 24px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <p
                style={{
                  color: '#0B3D91',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                Sin costos ocultos
              </p>
              <h2
                style={{
                  color: '#0A2A5E',
                  fontSize: 'clamp(22px, 3vw, 36px)',
                  fontWeight: 800,
                  marginBottom: '16px',
                  lineHeight: 1.2,
                }}
              >
                Todo esto va incluido
                <br />
                <span style={{ color: '#0B3D91' }}>en cada despacho</span>
              </h2>
              <p style={{ color: '#374151', fontSize: '17px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
                No cobramos por separado los servicios que hacen que la carga llegue bien.
                Cuando cotiza, ya está todo adentro.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '24px',
              }}
            >
              {incluidoEnDespacho.map((item) => (
                <div
                  key={item.titulo}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '32px 28px',
                    boxShadow: '0 4px 20px rgba(10,42,94,0.10)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: '1px solid rgba(11,61,145,0.10)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #0A2A5E, #0B3D91)',
                    }}
                  />
                  <span style={{ fontSize: '32px' }}>{item.icon}</span>
                  <h3
                    style={{
                      color: '#0A2A5E',
                      fontSize: '16px',
                      fontWeight: 700,
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.titulo}
                  </h3>
                  <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    {item.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Respaldo operacional (una línea, apunta a quienes-somos) ── */}
        <section style={{ background: '#FFFFFF', padding: '48px 24px' }}>
          <div
            style={{
              maxWidth: '780px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#374151',
                fontSize: '16px',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: '520px',
              }}
            >
              CargoClick opera con el respaldo operacional de{' '}
              <strong style={{ color: '#0A2A5E' }}>Transportes Nuevo Mundo S.A.S.</strong>,
              empresa con más de 20 años de experiencia en logística nacional.{' '}
              <a
                href="/quienes-somos"
                style={{ color: '#0B3D91', fontWeight: 600, textDecoration: 'underline' }}
              >
                Conoce nuestra alianza →
              </a>
            </p>
          </div>
        </section>

        {/* ── CTA final ────────────────────────────────────────── */}
        <section
          style={{
            background: 'linear-gradient(135deg, #0A2A5E 0%, #0B3D91 100%)',
            padding: '80px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: 'clamp(22px, 3vw, 36px)',
                fontWeight: 700,
                marginBottom: '16px',
                lineHeight: 1.2,
              }}
            >
              ¿Cuánto cuesta mover su carga?
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '17px', lineHeight: 1.7, marginBottom: '36px' }}>
              Obtenga una cotización en línea en menos de 2 minutos.
              Sin llamadas. Sin compromisos. Con todo incluido.
            </p>
            <a
              href="/cotizar"
              style={{
                display: 'inline-block',
                background: '#FFFFFF',
                color: '#0A2A5E',
                fontWeight: 700,
                fontSize: '17px',
                padding: '16px 48px',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              Cotizar ahora →
            </a>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '16px' }}>
              Embalaje · Monitoreo satelital · Acarreos · Todo incluido
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
