/**
 * HomePage – Página orquestadora de la home de CargoClick.
 *
 * Server Component. Header y Footer propios (no provienen del layout global).
 * Las animaciones de entrada las gestiona FadeInSection (Client Component boundary).
 */
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import RespaldoSection from '@/components/home/RespaldoSection';
import FortalezaDualSection from '@/components/home/FortalezaDualSection';
import ComoFuncionaSection from '@/components/home/ComoFuncionaSection';
import CtaFinalSection from '@/components/home/CtaFinalSection';

export const metadata: Metadata = {
  title: 'CargoClick – Soluciones Logísticas con Visión Digital',
  description:
    'CargoClick integra experiencia operativa en transporte de carga con una gestión más organizada y eficiente. Respaldados por Transportes Nuevo Mundo S.A.S.',
  openGraph: {
    title: 'CargoClick – Soluciones Logísticas con Visión Digital',
    description: 'Solicite su cotización de transporte de carga de forma digital y organizada.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <RespaldoSection />
        <FortalezaDualSection />
        <ComoFuncionaSection />
        <CtaFinalSection />
      </main>
      <Footer />
    </>
  );
}
