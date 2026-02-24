/**
 * LandingPage - Página de bienvenida del wizard de cotización
 * 
 * Primera pantalla que ve el usuario antes de iniciar el formulario.
 * Mensaje amigable y botón grande para comenzar el proceso.
 * 
 * UX: Mensaje acogedor, animación suave al aparecer, botón grande para fácil tap
 * Accesibilidad: Semantic HTML, enfoque claro en botón principal
 * 
 * @component
 * @example
 * ```tsx
 * <LandingPage onStart={() => setStep(0)} />
 * ```
 */

'use client';

interface LandingPageProps {
  /** Callback cuando el usuario hace clic en COMENCEMOS */
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        background: '#FDFCFE',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '640px' }}>

        {/* Línea decorativa + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, transparent, #C8CAD0)' }} aria-hidden="true" />
          <h1
            style={{
              color: '#0B3D91',
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}
          >
            Solicitar Cotización
          </h1>
          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to left, transparent, #C8CAD0)' }} aria-hidden="true" />
        </div>

        {/* Descripción */}
        <p
          style={{
            color: '#5E6B78',
            fontSize: 'clamp(16px, 2vw, 20px)',
            lineHeight: 1.6,
            marginBottom: '48px',
            fontWeight: 400,
          }}
        >
          Cuéntanos los detalles de tu carga y te enviamos<br />
          una cotización con respaldo operativo nacional.
        </p>

        {/* Botón principal */}
        <button
          onClick={onStart}
          style={{
            background: 'linear-gradient(135deg, #062C73 0%, #0D4099 28%, #1562CA 62%, #2078E2 100%)',
            color: '#FFFFFF',
            fontSize: '17px',
            fontWeight: 700,
            padding: '16px 48px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(11,61,145,0.30)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
            minWidth: '220px',
            minHeight: '56px',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(11,61,145,0.40)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(11,61,145,0.30)';
          }}
          aria-label="Comenzar proceso de cotización"
        >
          Comenzar
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        {/* Indicadores de confianza */}
        <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <span style={{ color: '#5E6B78', fontSize: '14px', fontWeight: 500 }}>⏱ 2-3 minutos</span>
          <span style={{ color: '#5E6B78', fontSize: '14px', fontWeight: 500 }}>✓ Guardado automático</span>
          <span style={{ color: '#5E6B78', fontSize: '14px', fontWeight: 500 }}>✓ Sin compromiso</span>
        </div>
      </div>
    </div>
  );
}
