/**
 * PasoCard – Server Component.
 *
 * Tarjeta individual de un paso del proceso "¿Cómo Funciona?".
 * Muestra número de paso, ícono (asset SVG o fallback Lucide), título y descripción.
 *
 * @remarks
 * No tiene estado ni interactividad: puro Server Component estático.
 * El flag `assetExists` controla si se usa el asset real o el fallback visual.
 *
 * @param props - {@link PasoCardProps}
 */

import React from 'react';
import Image from 'next/image';

/** Props del componente PasoCard */
export interface PasoCardProps {
  /** Identificador visual del paso: '01', '02' o '03' */
  numero: '01' | '02' | '03';
  /** Path al asset SVG en /public */
  iconoSrc: string;
  /** Texto alternativo accesible del ícono */
  iconoAlt: string;
  /** Ícono Lucide usado cuando el asset no está disponible */
  fallbackIcon: React.ReactNode;
  /** Título corto del paso */
  titulo: string;
  /** Descripción breve del paso */
  descripcion: string;
}

/**
 * Flag global: cambiar a `true` cuando los assets SVG estén en /public/assets/.
 * Afecta a todas las instancias de PasoCard.
 */
const ASSET_EXISTS = true;

export default function PasoCard({
  numero,
  iconoSrc,
  iconoAlt,
  fallbackIcon,
  titulo,
  descripcion,
}: PasoCardProps) {
  return (
    <div
      className="transition-shadow duration-[250ms] ease-in-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]"
      style={{
        background: '#FFFFFF',
        padding: '32px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.10), 0 1px 0 0 rgba(255,255,255,0.9) inset',
        border: '1px solid rgba(255,255,255,0.8)',
        textAlign: 'center',
        flex: 1,
        minWidth: 0,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Ícono central – asset o fallback Lucide */}
      <div
        style={{
          height: '96px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        {ASSET_EXISTS ? (
          <Image
            src={iconoSrc}
            alt={iconoAlt}
            width={96}
            height={96}
          />
        ) : (
          fallbackIcon
        )}
      </div>

      {/* Título del paso */}
      <h3
        style={{
          color: '#1A1A1A',
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '12px',
          margin: '0 0 12px 0',
        }}
      >
        {titulo}
      </h3>

      {/* Descripción */}
      <p
        style={{
          color: '#5E6B78',
          fontSize: '15px',
          lineHeight: '1.6',
          margin: 0,
        }}
      >
        {descripcion}
      </p>
    </div>
  );
}
