/**
 * FortalezaBlock – Sub-componente Server de FortalezaDualSection.
 *
 * Renderiza un bloque de fortaleza con línea decorativa, título y lista de bullets.
 * Soporta dos temas: 'operacion' (azul #0B3D91) y 'digital' (verde #1F7A5C).
 *
 * @param tema    - 'operacion' | 'digital'. Determina el esquema de colores.
 * @param titulo  - Nombre de la entidad (ej: "Transportes Nuevo Mundo").
 * @param bullets - Array de bullets con texto e ícono opcional.
 */

import { Clock, MapPin, Truck, LayoutDashboard, MessageCircle, Activity } from 'lucide-react';
import Image from 'next/image';
import BulletItem from './BulletItem';

export interface BulletData {
  texto: string;
  iconoSrc?: string;
  iconoAlt?: string;
}

export interface FortalezaBlockProps {
  tema: 'operacion' | 'digital';
  titulo: string;
  logoSrc?: string;
  bullets: BulletData[];
}

/** Íconos Lucide de fallback según tema y posición */
const FALLBACK_ICONS_OPERACION = [
  <Clock key="clock" size={24} />,
  <MapPin key="mappin" size={24} />,
  <Truck key="truck" size={24} />,
];

const FALLBACK_ICONS_DIGITAL = [
  <LayoutDashboard key="layout" size={24} />,
  <MessageCircle key="msg" size={24} />,
  <Activity key="activity" size={24} />,
];

export default function FortalezaBlock({ tema, titulo, logoSrc, bullets }: FortalezaBlockProps) {
  const color = tema === 'operacion' ? '#0B3D91' : '#1F7A5C';
  const fallbackIcons =
    tema === 'operacion' ? FALLBACK_ICONS_OPERACION : FALLBACK_ICONS_DIGITAL;

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: 'clamp(14px, 3vw, 28px) clamp(12px, 2.5vw, 24px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.10), 0 1px 0 0 rgba(255,255,255,0.9) inset',
      border: '1px solid rgba(255,255,255,0.8)',
    }}>
      {/* Logo o título del bloque – contenedor de altura fija para alinear líneas */}
      {logoSrc ? (
        <div style={{ height: 'clamp(40px, 8vw, 72px)', display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <Image
            src={logoSrc}
            alt={titulo}
            height={tema === 'operacion' ? 64 : 48}
            width={tema === 'operacion' ? 280 : 200}
            style={{
              height: tema === 'operacion' ? 'clamp(28px, 6vw, 64px)' : 'clamp(22px, 5vw, 48px)',
              width: 'auto',
              maxWidth: '100%',
            }}
          />
        </div>
      ) : (
        <h3
          style={{
            color,
            fontSize: 'clamp(14px, 3vw, 22px)',
            fontWeight: 700,
            height: 'clamp(40px, 8vw, 72px)',
            display: 'flex',
            alignItems: 'center',
            margin: '0 0 12px 0',
            lineHeight: '1.3',
          }}
        >
          {titulo}
        </h3>
      )}

      {/* Línea decorativa inferior – gradiente desde transparente → color → transparente */}
      <div
        style={{
          height: '3px',
          width: '100%',
          background: `linear-gradient(to right, transparent, ${color} 30%, ${color} 70%, transparent)`,
          marginBottom: '24px',
        }}
        aria-hidden="true"
      />

      {/* Lista de bullets */}
      <div role="list">
        {bullets.map((bullet, index) => (
          <div key={index} role="listitem">
            <BulletItem
              text={bullet.texto}
              iconSrc={bullet.iconoSrc}
              iconAlt={bullet.iconoAlt}
              iconFallback={fallbackIcons[index]}
              color={color}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
