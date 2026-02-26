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
      {/* Ola de entrada: doble capa con alta amplitud para máximo contraste */}
      <div style={{ lineHeight: 0, display: 'block' }}>
        <svg
          viewBox="0 0 1440 130"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '130px' }}
          aria-hidden="true"
        >
          {/* Capa trasera: navy suave desfasado, da sensación de relieve */}
          <path
            d="M0,0 L1440,0 L1440,44 C1200,128 860,22 560,105 C260,138 90,38 0,44 Z"
            fill="rgba(10,42,94,0.18)"
          />
          {/* Capa frontal: blanco sólido con curva de alta amplitud (~100px) */}
          <path
            d="M0,0 L1440,0 L1440,20 C1200,118 860,5 560,88 C260,128 90,18 0,20 Z"
            fill="#FDFCFE"
          />
        </svg>
      </div>

      {/* Contenido — sin background propio: el gradiente del section fluye sin interrupción */}
      <div style={{ position: 'relative', padding: '80px 0 56px', overflow: 'hidden' }}>

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

      {/* Ola inferior: transición suave hacia el Footer (#0A2A5E) */}
      <div style={{ lineHeight: 0, display: 'block', marginTop: '-1px' }}>
        <svg
          viewBox="0 0 1440 80"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '80px' }}
          aria-hidden="true"
        >
          <path
            d="M0,80 L1440,80 L1440,40 C1080,68 720,8 360,44 C180,62 90,32 0,40 Z"
            fill="#0A2A5E"
          />
        </svg>
      </div>
    </section>
  );
}
