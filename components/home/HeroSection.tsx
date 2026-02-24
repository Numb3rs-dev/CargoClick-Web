/**
 * HeroSection – Primera sección visible de la home page.
 *
 * Server Component estático. Comunica la propuesta de valor de CargoClick
 * en menos de 3 segundos: texto a la izquierda, imagen a la derecha.
 *
 * Layout: grid 2 columnas (45/55) en desktop, 1 columna en mobile.
 * Imagen: placeholder hasta que exista `/public/assets/CamionConCarga.webp`.
 */

import Image from 'next/image';
import { Truck } from 'lucide-react';
import Button from '@/components/ui/Button';
import FadeInSection from '@/components/ui/FadeInSection';

/** Asset disponible en /public/assets/ */
const ASSET_CAMION_DISPONIBLE = true;

export default function HeroSection() {
  return (
    <section
      aria-labelledby="hero-titulo"
      style={{ background: '#FCFBFE' }}
    >
      {/* Grid container */}
      <div
        className="max-w-[1200px] mx-auto px-5 md:px-10 grid grid-cols-1 md:grid-cols-[45fr_55fr] items-end"
        style={{
          paddingTop: '48px',
          paddingBottom: '0px',
        }}
      >
        {/* ── Columna izquierda: texto – fadeInUp ── */}
        <FadeInSection direction="up" delay={0}>
        <div className="flex flex-col justify-center">

          {/* Eyebrow */}
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#1F7A5C',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Logística B2B
          </span>

          {/* H1 – título principal */}
          <h1
            id="hero-titulo"
            className="text-[32px] md:text-[56px]"
            style={{
              color: '#0B3D91',
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Soluciones Logísticas<br />
            <span style={{ fontWeight: 400 }}>con </span>
            <span style={{ color: '#1F7A5C', fontWeight: 700 }}>Visión Digital</span>
          </h1>

          {/* Subtítulo */}
          <p
            className="text-[16px] md:text-[18px]"
            style={{
              color: '#5E6B78',
              fontWeight: 400,
              lineHeight: 1.6,
              marginTop: '16px',
              marginBottom: 0,
            }}
          >
            CargoClick integra experiencia operativa en transporte de carga
            con una gestión más organizada y eficiente.
          </p>

          {/* Botón CTA */}
          <div style={{ marginTop: '32px' }}>
            <Button variant="primary" size="lg" href="/cotizar">
              Solicitar Servicio
            </Button>
          </div>
        </div>
        </FadeInSection>

        {/* ── Columna derecha: imagen – fade solo opacidad ── */}
        <FadeInSection direction="none" delay={0.2}>
        <div className="mt-6 md:mt-0 md:-ml-10">
          {ASSET_CAMION_DISPONIBLE ? (
            <Image
              src="/assets/CamionConCargaV2.jpg"
              alt="Camión de carga CargoClick en operación logística"
              width={600}
              height={500}
              priority
              style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          ) : (
            /* Placeholder visual hasta que exista el asset */
            <div
              className="h-[220px] md:h-auto md:aspect-[6/5]"
              style={{
                background: 'linear-gradient(135deg, #F0F4FF 0%, #E8F5F0 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '12px',
              }}
              role="img"
              aria-label="Imagen de camión de carga CargoClick (próximamente)"
            >
              <Truck size={64} color="#0B3D91" aria-hidden="true" />
              <p
                style={{
                  color: '#5E6B78',
                  fontSize: '14px',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                Imagen: CamionConCarga
              </p>
            </div>
          )}
        </div>
        </FadeInSection>

      </div>
    </section>
  );
}
