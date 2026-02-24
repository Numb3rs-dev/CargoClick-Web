/**
 * Página de Cotización Conversacional
 * 
 * Punto de entrada del flujo conversacional de cotización.
 * Experiencia paso a paso tipo chat para reducir fricción del formulario tradicional.
 * 
 * Ruta: /cotizar
 * 
 * UX: Mobile-first, guardado progresivo, feedback inmediato
 * Accesibilidad: WCAG 2.1 AA, navegación por teclado, ARIA labels
 */

import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ConversacionLazy from './components/ConversacionLazy';

export const metadata: Metadata = {
  title: 'Solicitar Cotización | CargoClick',
  description: 'Solicita tu servicio de cargue con respaldo operativo nacional. Proceso rápido, 2-3 minutos.',
};

export default function CotizarPage() {
  return (
    <>
      <Header />
      <main style={{ background: '#FDFCFE', minHeight: '100vh' }}>
        <ConversacionLazy />
      </main>
      <Footer />
    </>
  );
}
