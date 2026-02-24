/**
 * RespaldoSection
 *
 * Sección de confianza que muestra el respaldo operativo de
 * Transportes Nuevo Mundo S.A.S. Aparece justo debajo del Hero.
 *
 * Server Component – sin 'use client'.
 * Diseño centrado sobre fondo gris (#F5F7FA).
 */

import Image from 'next/image';
import { Building2 } from 'lucide-react';
import FadeInSection from '@/components/ui/FadeInSection';

export default function RespaldoSection() {
  // Asset disponible en /public/assets/
  const assetExists = true;

  return (
    <section
      aria-label="Respaldo operativo"
      style={{ background: '#F4F4FC', padding: '0 0 0', textAlign: 'center' }}
    >
      {/* Gradiente de transición suave desde el Hero (#FDFCFE → #F4F4FC) */}
      <div style={{ height: '56px', background: 'linear-gradient(to bottom, #FCFBFE, #F4F4FC)', pointerEvents: 'none' }} />
      <FadeInSection direction="up" delay={0}>
      <div
        className="px-5 md:px-10"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0px',
        }}
      >
        {/* Texto con líneas decorativas a izquierda y derecha */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            width: '100%',
          }}
        >
          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, transparent, #C8CAD0)' }} />
          <p
            className="text-[14px] md:text-[15px]"
            style={{
              color: '#5E6B78',
              fontWeight: 400,
              lineHeight: 1.6,
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Operación respaldada por
          </p>
          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to left, transparent, #C8CAD0)' }} />
        </div>

        {/* Logo o Placeholder */}
        {assetExists ? (
          <Image
            src="/assets/NuevoMundoLogoNombreLadoDerecho.png"
            alt="Transportes Nuevo Mundo S.A.S. – Empresa respaldante de CargoClick"
            height={90}
            width={300}
            style={{ height: '90px', width: 'auto' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              border: '2px solid #0B3D91',
              borderRadius: '6px',
            }}
          >
            <Building2 size={24} color="#0B3D91" aria-hidden="true" />
            <span style={{ color: '#0B3D91', fontSize: '16px', fontWeight: 700 }}>
              Transportes Nuevo Mundo S.A.S.
            </span>
          </div>
        )}
      </div>
      </FadeInSection>
    </section>
  );
}
