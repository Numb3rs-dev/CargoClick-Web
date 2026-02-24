/**
 * ComoFuncionaSection – Server Component.
 *
 * Sección "¿Cómo Funciona?" de la home page de CargoClick.
 * Reduce fricción cognitiva mostrando el proceso en 3 pasos simples con íconos,
 * título y descripción breve. El usuario entiende qué pasa después de solicitar
 * en menos de 10 segundos.
 *
 * Layout:
 *  - Desktop (≥ 768px): 3 PasoCard en fila (flex-row), gap 32px
 *  - Mobile (<768px):   stack vertical (flex-col), gap 20px
 *
 * Fondo: #F5F7FA (sección alterna)
 */

import React from 'react';
import { ClipboardList, Truck, CheckCircle } from 'lucide-react';
import PasoCard, { type PasoCardProps } from './PasoCard';
import FadeInSection from '@/components/ui/FadeInSection';

/** Datos de los 3 pasos del proceso CargoClick */
const PASOS: PasoCardProps[] = [
  {
    numero: '01',
    iconoSrc: '/assets/Solicitas.png',
    iconoAlt: 'Formulario de solicitud de servicio',
    fallbackIcon: <ClipboardList size={40} color="#0B3D91" aria-hidden="true" />,
    titulo: 'Solicitas el servicio',
    descripcion: 'Completa el formulario con los datos de tu operación.',
  },
  {
    numero: '02',
    iconoSrc: '/assets/Coordinamos.png',
    iconoAlt: 'Coordinación de operación logística',
    fallbackIcon: <Truck size={40} color="#0B3D91" aria-hidden="true" />,
    titulo: 'Coordinamos la operación',
    descripcion: 'Asignamos flota y planificamos el servicio.',
  },
  {
    numero: '03',
    iconoSrc: '/assets/EjecutamosSupervisamos.png',
    iconoAlt: 'Ejecución y supervisión del servicio',
    fallbackIcon: <CheckCircle size={40} color="#0B3D91" aria-hidden="true" />,
    titulo: 'Ejecutamos y supervisamos',
    descripcion: 'Monitoreamos el servicio hasta su finalización.',
  },
];

export default function ComoFuncionaSection() {
  return (
    <section
      aria-label="Cómo funciona CargoClick"
      style={{ background: '#FDFCFE', padding: '0 0 0', position: 'relative', zIndex: 2 }}
    >
      {/* Título de sección con líneas decorativas – igual que RespaldoSection */}
      <div
        className="px-5 md:px-10"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto 40px',
          paddingTop: '40px',
        }}
      >
        <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, transparent, #C8CAD0)' }} aria-hidden="true" />
        <h2
          style={{
            color: '#0B3D91',
            fontWeight: 700,
            textAlign: 'center',
            margin: 0,
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
          }}
          className="text-[26px] md:text-[36px]"
        >
          ¿Cómo Funciona?
        </h2>
        <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to left, transparent, #C8CAD0)' }} aria-hidden="true" />
      </div>

        {/* Cards siempre en fila con flechas entre ellas */}
        <div
          style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 3, marginBottom: '-72px', paddingBottom: '72px' }}
          className="px-5 md:px-10"
        >
          <div className="flex flex-col md:flex-row items-stretch">
            {PASOS.map((paso, index) => (
              <React.Fragment key={paso.numero}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <FadeInSection direction="up" delay={index * 0.1} className="h-full flex flex-col">
                    <PasoCard {...paso} />
                  </FadeInSection>
                </div>
                {index < PASOS.length - 1 && (
                  <>
                    {/* Flecha horizontal – solo desktop */}
                    <div className="hidden md:flex items-center" style={{ padding: '0 8px', flexShrink: 0 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" stroke="#0B3D91" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {/* Flecha vertical – solo mobile */}
                    <div className="flex md:hidden justify-center" style={{ padding: '8px 0' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 9l6 6 6-6" stroke="#0B3D91" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
    </section>
  );
}
