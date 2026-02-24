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

export default function RespaldoSection() {
  // Cambiar a true cuando el asset esté en /public/assets/
  const assetExists = false;

  return (
    <section
      aria-label="Respaldo operativo"
      style={{ background: '#F5F7FA', padding: '48px 0', textAlign: 'center' }}
    >
      <div
        className="px-5 md:px-10"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Texto principal */}
        <p
          className="text-base md:text-lg"
          style={{
            color: '#1A1A1A',
            fontWeight: 600,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Operación respaldada por Transportes Nuevo Mundo S.A.S.
        </p>

        {/* Logo o Placeholder */}
        {assetExists ? (
          <Image
            src="/assets/NuevoMundoLogoNombreLadoDerecho.svg"
            alt="Transportes Nuevo Mundo S.A.S. – Empresa respaldante de CargoClick"
            height={60}
            width={200}
            style={{ height: '60px', width: 'auto' }}
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
    </section>
  );
}
