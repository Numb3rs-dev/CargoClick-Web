/**
 * FortalezaDualSection – Server Component.
 *
 * Sección de propuesta de valor dual: experiencia operativa de Transportes Nuevo Mundo
 * y capacidad tecnológica de CargoClick. Grid de 2 columnas en desktop, stack en mobile.
 *
 * Criterios de color:
 *  - Bloque Operación: línea + título azul #0B3D91
 *  - Bloque Digital:   línea + título verde #1F7A5C
 *  - H2 sección:       azul #0B3D91 (nunca verde)
 */

import FortalezaBlock, { type BulletData } from './FortalezaBlock';
import FadeInSection from '@/components/ui/FadeInSection';

const BULLETS_OPERACION: BulletData[] = [
  {
    texto: '+20 años en transporte de carga',
    iconoSrc: '/assets/20AnosExp.png',
    iconoAlt: '20 años de experiencia',
  },
  {
    texto: 'Flota confiable a nivel nacional',
    iconoSrc: '/assets/CoberturaNacional.png',
    iconoAlt: 'Cobertura nacional',
  },
  {
    texto: 'Experiencia en operación de carga',
  },
];

const BULLETS_DIGITAL: BulletData[] = [
  { texto: 'Organización digital de servicios' },
  { texto: 'Comunicación centralizada' },
  { texto: 'Seguimiento más organizado' },
];

export default function FortalezaDualSection() {
  return (
    <section
      aria-label="Nuestra fortaleza dual"
      style={{
        background: '#FDFCFE',
        padding: '48px 0 40px',
        boxShadow: 'inset 60px 0 40px -20px rgba(80,80,140,0.06)',
        borderTop: '2px solid rgba(80,80,140,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
        className="px-5 md:px-10"
      >
        {/* Título de sección – solo azul, nunca verde */}
        <h2
          style={{
            color: '#0B3D91',
            fontSize: '36px',
            fontWeight: 700,
            textAlign: 'center',
            marginTop: 0,
            marginBottom: '32px',
            lineHeight: '1.2',
          }}
        >
          <span style={{ fontWeight: 400 }}>Nuestra </span>
          Fortaleza: Operación <span style={{ color: '#1F7A5C', fontWeight: 700 }}>+ Tecnología</span>
        </h2>

        {/* Grid: 1 columna mobile → 2 columnas desktop. Operación siempre primero. */}
        <div
          className="grid grid-cols-2"
          style={{ gap: '24px' }}
        >
          <FadeInSection direction="left">
            <FortalezaBlock
              tema="operacion"
              titulo="Transportes Nuevo Mundo"
              logoSrc="/assets/NuevoMundoLogoNombreLadoDerechoBlanco.png"
              bullets={BULLETS_OPERACION}
            />
          </FadeInSection>
          <FadeInSection direction="right">
            <FortalezaBlock
              tema="digital"
              titulo="CargoClick"
              logoSrc="/assets/CargoClickLogoNombre.png"
              bullets={BULLETS_DIGITAL}
            />
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}
