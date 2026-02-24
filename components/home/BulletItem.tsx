/**
 * BulletItem – Sub-componente Server de FortalezaDualSection.
 *
 * Renderiza un ícono (asset real o fallback Lucide) junto a un texto descriptivo.
 * Usado dentro de FortalezaBlock para listar las fortalezas de cada bloque.
 *
 * @param iconSrc    - Ruta al asset SVG/PNG en /public. Opcional.
 * @param iconAlt    - Alt text para la imagen. Ignorado si se usa fallback.
 * @param iconFallback - Elemento JSX (Lucide icon) cuando no hay asset disponible.
 * @param text       - Texto del bullet.
 * @param color      - Color del ícono: '#0B3D91' para Operación, '#1F7A5C' para Digital.
 */

import Image from 'next/image';

export interface BulletItemProps {
  iconSrc?: string;
  iconAlt?: string;
  iconFallback?: React.ReactNode;
  text: string;
  color: string;
}

export default function BulletItem({ iconSrc, iconAlt, iconFallback, text, color }: BulletItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'clamp(6px, 1.5vw, 12px)',
        paddingTop: 'clamp(4px, 1vw, 8px)',
        paddingBottom: 'clamp(4px, 1vw, 8px)',
      }}
    >
      {/* Ícono */}
      <div
        style={{
          flexShrink: 0,
          width: 'clamp(16px, 3vw, 24px)',
          height: 'clamp(16px, 3vw, 24px)',
          color,
        }}
        aria-hidden="true"
      >
        {iconSrc ? (
          <Image src={iconSrc} alt={iconAlt ?? ''} width={24} height={24} style={{ width: '100%', height: 'auto' }} />
        ) : (
          iconFallback
        )}
      </div>

      {/* Texto */}
      <span style={{ color: '#1A1A1A', fontSize: 'clamp(10px, 2vw, 16px)', lineHeight: '1.4' }}>
        {text}
      </span>
    </div>
  );
}
