/**
 * RespaldoSection
 *
 * Sección de confianza que muestra el respaldo operativo de
 * Transportes Nuevo Mundo S.A.S. Aparece justo debajo del Hero.
 *
 * Server Component – sin 'use client'.
 * Fondo blanco puro para separarse visualmente del Hero (#FCFBFE).
 */

import Image from 'next/image';

export default function RespaldoSection() {
  return (
    <section
      aria-label="Respaldo operativo"
      style={{
        background: '#FCFBFE',
        padding: '0',
        textAlign: 'center',
      }}
    >
      <div
        className="px-5 md:px-10"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Eyebrow con líneas laterales */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '600px',
            gap: '16px',
          }}
        >
          {/* Línea izquierda */}
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'linear-gradient(to right, transparent, #5E6B78)',
            }}
          />

          <p
            className="text-[16px] md:text-[18px]"
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

          {/* Línea derecha */}
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'linear-gradient(to left, transparent, #5E6B78)',
            }}
          />
        </div>

        {/* Logo Transportes Nuevo Mundo */}
        <Image
          src="/assets/NuevoMundoLogo.png"
          alt="Transportes Nuevo Mundo S.A.S."
          height={168}
          width={360}
          style={{ height: '168px', width: 'auto', objectFit: 'contain', display: 'block' }}
          priority
        />
      </div>
    </section>
  );
}
