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
import JsonLd from '@/components/shared/JsonLd';

export const metadata: Metadata = {
  title: 'CargoClick – Transporte de Carga Terrestre en Colombia',
  description:
    'Transporte de carga terrestre para empresas: Bogotá–Medellín, Bogotá–Cali, Bogotá–Barranquilla, Bogotá–Quibdó y retornos. Mercancía general, granel sólido y líquido. Cotice en línea.',
  alternates: {
    canonical: 'https://cargoclick.com.co/home',
  },
  openGraph: {
    title: 'CargoClick – Transporte de Carga Terrestre en Colombia',
    description: 'Cotice su flete terrestre en línea. Rutas nacionales: Medellín, Cali, Barranquilla, Quibdó y más.',
    type: 'website',
    url: 'https://cargoclick.com.co/home',
  },
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Transporte de Carga Terrestre',
  serviceType: 'Freight Transportation',
  provider: {
    '@type': 'Organization',
    name: 'CargoClick',
    url: 'https://cargoclick.com.co',
  },
  areaServed: [
    { '@type': 'City', name: 'Bogotá',       containedInPlace: { '@type': 'Country', name: 'Colombia' } },
    { '@type': 'City', name: 'Medellín',     containedInPlace: { '@type': 'Country', name: 'Colombia' } },
    { '@type': 'City', name: 'Cali',         containedInPlace: { '@type': 'Country', name: 'Colombia' } },
    { '@type': 'City', name: 'Barranquilla', containedInPlace: { '@type': 'Country', name: 'Colombia' } },
    { '@type': 'City', name: 'Quibdó',       containedInPlace: { '@type': 'Country', name: 'Colombia' } },
  ],
  description:
    'Transporte de carga terrestre para empresas en Colombia. Rutas: Bogotá–Medellín, Bogotá–Cali, Bogotá–Barranquilla, Bogotá–Quibdó y retornos. Servicios: mercancía general, granel sólido y granel líquido (combustibles, aceites, químicos).',
  url: 'https://cargoclick.com.co/cotizar',
  offers: [
    {
      '@type': 'Offer',
      name: 'Flete Bogotá – Medellín',
      description: 'Transporte de carga terrestre entre Bogotá y Medellín, ida y vuelta.',
      areaServed: 'CO',
      url: 'https://cargoclick.com.co/cotizar',
    },
    {
      '@type': 'Offer',
      name: 'Flete Bogotá – Cali',
      description: 'Transporte de carga terrestre entre Bogotá y Cali, ida y vuelta.',
      areaServed: 'CO',
      url: 'https://cargoclick.com.co/cotizar',
    },
    {
      '@type': 'Offer',
      name: 'Flete Bogotá – Barranquilla',
      description: 'Transporte de carga terrestre entre Bogotá y Barranquilla, ida y vuelta.',
      areaServed: 'CO',
      url: 'https://cargoclick.com.co/cotizar',
    },
    {
      '@type': 'Offer',
      name: 'Flete Bogotá – Quibdó',
      description: 'Transporte de carga terrestre entre Bogotá y Quibdó, ida y vuelta.',
      areaServed: 'CO',
      url: 'https://cargoclick.com.co/cotizar',
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <JsonLd schema={serviceSchema} />
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
