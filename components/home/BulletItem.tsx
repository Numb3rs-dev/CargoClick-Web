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
        gap: '12px',
        paddingTop: '8px',
        paddingBottom: '8px',
      }}
    >
      {/* Ícono 24×24 */}
      <div
        style={{
          flexShrink: 0,
          width: '24px',
          height: '24px',
          color,
        }}
        aria-hidden="true"
      >
        {iconSrc ? (
          <Image src={iconSrc} alt={iconAlt ?? ''} width={24} height={24} />
        ) : (
          iconFallback
        )}
      </div>

      {/* Texto */}
      <span style={{ color: '#1A1A1A', fontSize: '16px', lineHeight: '1.5' }}>
        {text}
      </span>
    </div>
  );
}
