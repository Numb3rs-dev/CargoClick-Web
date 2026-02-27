import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Quiénes Somos – CargoClick',
  description:
    'CargoClick es la plataforma digital de transporte de carga terrestre respaldada por Transportes Nuevo Mundo S.A.S., empresa con más de 20 años de experiencia logística en Colombia.',
  alternates: {
    canonical: 'https://cargoclick.com.co/quienes-somos',
  },
  openGraph: {
    title: 'Quiénes Somos – CargoClick',
    description:
      '20 años de operación logística + tecnología digital. Conoce la alianza estratégica detrás de CargoClick.',
    type: 'website',
    url: 'https://cargoclick.com.co/quienes-somos',
  },
};

const sectores = [
  {
    icon: '🏦',
    sector: 'Sector Financiero',
    descripcion:
      'Transporte especializado de activos de alto valor, incluyendo cajeros automáticos y cajas fuertes con protocolos de seguridad rigurosos.',
    clientes: ['Banco Caja Social', 'Banco Colpatria'],
  },
  {
    icon: '🏥',
    sector: 'Sector Salud',
    descripcion:
      'Movilización de equipos médicos con manejo técnico especializado, cumpliendo estándares de la industria.',
    clientes: ['INCLISER – Ingeniería Clínica'],
  },
  {
    icon: '🏭',
    sector: 'Sector Industrial',
    descripcion:
      'Carga industrial, maquinaria pesada y suministros para empresas del sector manufacturero y alimentario.',
    clientes: [
      'Soluciones Técnicas Alimentarias',
      'Suministros de Equipos Industriales',
      'Maquinaria Hurtado',
    ],
  },
];

const servicios = [
  {
    icon: '🚛',
    titulo: 'Transporte nacional y local',
    descripcion: 'Envíos dentro de Bogotá y toda Colombia, con apoyo logístico integral para empresas a lo largo del territorio nacional.',
  },
  {
    icon: '📦',
    titulo: 'Embalaje de mercancía',
    descripcion: 'Embalamos su carga de forma óptima, garantizando la seguridad del producto desde el origen hasta el destino.',
  },
  {
    icon: '🛰️',
    titulo: 'Monitoreo satelital',
    descripcion: 'Control en tiempo real de rutas y tiempos de entrega mediante monitoreo satelital, optimizando cada proceso logístico.',
  },
  {
    icon: '🏗️',
    titulo: 'Servicio especial de plataforma',
    descripcion: 'Soluciones de transporte para mercancías que requieren manejo especial, incluyendo carga voluminosa o de alto valor.',
  },
  {
    icon: '🔄',
    titulo: 'Acarreos y mudanzas',
    descripcion: 'Servicio de acarreos, trasteos y mudanzas dentro y fuera de la ciudad con personal capacitado.',
  },
];

const diferenciadores = [
  {
    titulo: 'Experiencia comprobada',
    descripcion:
      'Más de dos décadas de operación continua respaldan cada despacho. Conocemos las rutas, los tiempos y las particularidades del transporte terrestre en Colombia.',
  },
  {
    titulo: 'Innovación digital',
    descripcion:
      'CargoClick incorpora tecnología para que las empresas coticen, contraten y hagan seguimiento de su carga en línea, sin llamadas ni intermediarios.',
  },
  {
    titulo: 'Cobertura nacional',
    descripcion:
      'Operamos rutas desde Bogotá hacia Medellín, Cali, Barranquilla, Quibdó y puntos intermedios a lo largo del territorio colombiano.',
  },
  {
    titulo: 'Versatilidad en carga',
    descripcion:
      'Transportamos carga general, granel sólido, granel líquido y cargas especiales de sectores como el financiero, médico e industrial.',
  },
];

export default function QuienesSomosPage() {
  return (
    <>
      <Header />
      <main style={{ background: '#F5F7FA', minHeight: '100vh' }}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section
          style={{
            background: 'linear-gradient(135deg, #0A2A5E 0%, #0B3D91 100%)',
            padding: '96px 24px 80px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <p
              style={{
                color: '#93C5FD',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}
            >
              Quiénes somos
            </p>
            <h1
              style={{
                color: '#FFFFFF',
                fontSize: 'clamp(28px, 5vw, 44px)',
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: '24px',
              }}
            >
              20 años de operación.
              <br />
              <span style={{ color: '#60A5FA' }}>Tecnología de hoy.</span>
            </h1>
            <p
              style={{
                color: '#CBD5E1',
                fontSize: 'clamp(15px, 2.5vw, 18px)',
                lineHeight: 1.7,
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              CargoClick es la plataforma digital que potencia la operación de
              Transportes Nuevo Mundo S.A.S., una alianza estratégica entre
              experiencia logística consolidada y transformación digital.
            </p>
          </div>
        </section>

        {/* ── Quiénes somos ────────────────────────────────────── */}
        <section style={{ padding: '80px 24px' }}>
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '40px',
              alignItems: 'center',
            }}
          >
            <div>
              <h2
                style={{
                  color: '#0A2A5E',
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 700,
                  marginBottom: '16px',
                  lineHeight: 1.3,
                }}
              >
                Una alianza entre
                <br />experiencia y tecnología
              </h2>
              <p style={{ color: '#374151', fontSize: '16px', lineHeight: 1.8, marginBottom: '16px' }}>
                <strong>Transportes Nuevo Mundo S.A.S.</strong> es una empresa colombiana con más de
                20 años de trayectoria en el transporte de carga terrestre, tanto local como nacional.
                Fundada con el propósito de transportar y cuidar las mercancías de sus clientes de
                manera segura y responsable, recorriendo todas las rutas del país, ha construido una
                reputación sólida en sectores exigentes como el financiero, el médico y el industrial.
              </p>
              <p style={{ color: '#374151', fontSize: '16px', lineHeight: 1.8 }}>
                <strong>CargoClick</strong> nace como la evolución digital de esa operación. Una
                plataforma que permite a las empresas colombianas cotizar y contratar transporte de
                carga de manera ágil, transparente y sin fricciones, aprovechando la infraestructura
                operativa y el conocimiento acumulado durante más de dos décadas en logística nacional.
              </p>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '36px',
                boxShadow: '0 4px 20px rgba(10,42,94,0.10)',
                borderLeft: '4px solid #0B3D91',
              }}
            >
              <p
                style={{
                  color: '#0A2A5E',
                  fontSize: '15px',
                  lineHeight: 1.8,
                  fontStyle: 'italic',
                  marginBottom: '20px',
                }}
              >
                "La experiencia operativa de décadas combinada con una plataforma digital moderna
                nos permite ofrecer lo que ninguna empresa de transporte tradicional puede:
                inmediatez, transparencia y confianza en cada despacho."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0A2A5E, #0B3D91)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  CC
                </div>
                <div>
                  <p style={{ color: '#0A2A5E', fontWeight: 700, fontSize: '14px', margin: 0 }}>CargoClick</p>
                  <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Respaldado por Transportes Nuevo Mundo S.A.S.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Misión ───────────────────────────────────────────── */}
        <section style={{ background: 'linear-gradient(135deg, #0A2A5E 0%, #0B3D91 100%)', padding: '64px 24px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <p
              style={{
                color: '#93C5FD',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              Nuestra misión
            </p>
            <p
              style={{
                color: '#FFFFFF',
                fontSize: 'clamp(17px, 2.5vw, 22px)',
                lineHeight: 1.8,
                fontStyle: 'italic',
              }}
            >
              "Transportar y cuidar las mercancías que nuestros clientes nos confían día a día,
              de manera segura y responsable, recorriendo todas las rutas de nuestro país."
            </p>
            <p style={{ color: '#93C5FD', fontSize: '14px', marginTop: '20px', fontWeight: 600 }}>
              — Transportes Nuevo Mundo S.A.S.
            </p>
          </div>
        </section>

        {/* ── Servicios ─────────────────────────────────────────── */}
        <section style={{ padding: '80px 24px' }}>
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
                Portafolio
              </p>
              <h2 style={{ color: '#0A2A5E', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700 }}>
                Servicios que ofrecemos
              </h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
              }}
            >
              {servicios.map((s) => (
                <div
                  key={s.titulo}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 12px rgba(10,42,94,0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{s.icon}</span>
                  <h3 style={{ color: '#0A2A5E', fontSize: '15px', fontWeight: 700, margin: 0 }}>{s.titulo}</h3>
                  <p style={{ color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{s.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sectores / Clientes ──────────────────────────────── */}
        <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
                Trayectoria
              </p>
              <h2
                style={{
                  color: '#0A2A5E',
                  fontSize: 'clamp(22px, 3vw, 32px)',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                Sectores que han confiado en nosotros
              </h2>
              <p style={{ color: '#6B7280', fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
                Más de dos décadas de operación continua en industrias donde la confiabilidad
                no es opcional.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
              }}
            >
              {sectores.map((s) => (
                <div
                  key={s.sector}
                  style={{
                    background: '#F5F7FA',
                    borderRadius: '12px',
                    padding: '28px',
                    borderTop: '3px solid #0B3D91',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
                  <h3 style={{ color: '#0A2A5E', fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>
                    {s.sector}
                  </h3>
                  <p style={{ color: '#374151', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px' }}>
                    {s.descripcion}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {s.clientes.map((c) => (
                      <span
                        key={c}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#0B3D91',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ color: '#60A5FA' }}>✓</span> {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Diferenciadores ──────────────────────────────────── */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
                Por qué elegirnos
              </p>
              <h2
                style={{
                  color: '#0A2A5E',
                  fontSize: 'clamp(22px, 3vw, 32px)',
                  fontWeight: 700,
                }}
              >
                Lo mejor de dos mundos
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
              }}
            >
              {diferenciadores.map((d, i) => (
                <div
                  key={d.titulo}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: '0 2px 12px rgba(10,42,94,0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0A2A5E, #0B3D91)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </div>
                  <h3 style={{ color: '#0A2A5E', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                    {d.titulo}
                  </h3>
                  <p style={{ color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    {d.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section
          style={{
            background: 'linear-gradient(135deg, #0A2A5E 0%, #0B3D91 100%)',
            padding: '72px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: 'clamp(22px, 3vw, 32px)',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              ¿Listo para mover su carga?
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '16px', lineHeight: 1.7, marginBottom: '36px' }}>
              Cotice en línea en menos de 2 minutos. Sin llamadas, sin intermediarios.
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
                transition: 'transform 0.2s',
              }}
            >
              Cotizar ahora →
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
