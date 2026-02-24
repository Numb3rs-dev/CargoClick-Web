/**
 * CtaFinalSection – Llamada a la acción de cierre.
 *
 * Server Component estático. Fondo con gradiente que imita la "C" del logo CargoClick.
 * Posición: penúltima sección de la home page, antes del Footer.
 */
import Button from '@/components/ui/Button';
import FadeInSection from '@/components/ui/FadeInSection';

/** Gradiente extraído de la "C" del logo CargoClick:
 *  #062C73 (navy oscuro) → #0B3D91 → #1562CA → #2078E2 (azul brillante) */
const BG_GRADIENT =
  'linear-gradient(135deg, #062C73 0%, #0D4099 28%, #1562CA 62%, #2078E2 100%)';

/** Capa de profundidad: destello radial del color brillante en la esquina superior-derecha */
const RADIAL_HIGHLIGHT =
  'radial-gradient(ellipse at 80% 10%, rgba(32,120,226,0.55) 0%, transparent 55%)';

/** Segunda capa sutil: oscurecimiento en la esquina inferior-izquierda para dar tridimensionalidad */
const RADIAL_SHADOW =
  'radial-gradient(ellipse at 15% 90%, rgba(6,44,115,0.6) 0%, transparent 50%)';

export default function CtaFinalSection() {
  return (
    <section
      aria-label="Llamada a la acción final"
      style={{ position: 'relative', background: BG_GRADIENT, paddingBottom: '0', zIndex: 1 }}
    >
      {/* SVG: pinta el área SOBRE la ola con el color de la sección 4.
          El gradiente del section ya corre de fondo de forma unificada — sin costura. */}
      <div style={{ lineHeight: 0, display: 'block' }}>
        <svg
          viewBox="0 0 1440 72"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '72px' }}
        >
          {/* Zona SOBRE la ola → color de la sección anterior */}
          <path
            d="M0,0 L1440,0 L1440,36 C1200,12 960,66 720,36 C480,6 240,66 0,36 Z"
            fill="#FDFCFE"
          />
        </svg>
      </div>

      {/* Contenido — sin background propio: el gradiente del section fluye sin interrupción */}
      <div style={{ position: 'relative', padding: '80px 0 80px', overflow: 'hidden' }}>

        {/* Capas de luz y sombra radial para dar volumen al gradiente */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: RADIAL_HIGHLIGHT, pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: RADIAL_SHADOW,    pointerEvents: 'none' }} />

        <FadeInSection direction="up" delay={0}>
          <div
            style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}
            className="px-5 md:px-10"
          >
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '32px',
              }}
            >
              Solicita tu servicio de cargue con respaldo operativo nacional.
            </h2>

            <Button variant="primary" size="lg" href="/cotizar">
              Solicitar Cotización
            </Button>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
