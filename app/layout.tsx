/**
 * Root Layout - Next.js 15 App Router
 * 
 * Layout mínimo: solo envuelve con html/body.
 * Cada sub-ruta carga sus propios providers según necesidad.
 */

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import JsonLd from '@/components/shared/JsonLd'
import { GoogleAnalytics } from '@next/third-parties/google'

// next/font optimiza la carga: inlines the CSS, preloads, font-display:swap
// evita la solicitud render-blocking de Google Fonts en globals.css
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cargoclick.com.co';
const isProduction = BASE_URL === 'https://cargoclick.com.co';

export const metadata: Metadata = {
  title: 'CargoClick – Soluciones Logísticas con Visión Digital',
  description: 'Solicite su cotización de transporte de carga terrestre de forma digital y organizada. Respaldados por Transportes Nuevo Mundo S.A.S.',
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CargoClick – Soluciones Logísticas con Visión Digital',
    description: 'Transporte de carga terrestre para empresas en Colombia. Cotice en línea.',
    url: BASE_URL,
    siteName: 'CargoClick',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/assets/CargoClickLogo.jpeg',
        width: 120,
        height: 36,
        alt: 'CargoClick Logo',
      },
    ],
  },
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false },
  other: {
    'geo.region': 'CO',
    'geo.placename': 'Bogotá, Colombia',
    'geo.position': '4.7110;-74.0721',
    'ICBM': '4.7110, -74.0721',
  },
};

/** Schema.org Organization – inyectado en todas las páginas */
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CargoClick',
  url: BASE_URL,
  logo: `${BASE_URL}/assets/CargoClickLogo.jpeg`,
  telephone: '+573115434467',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+573115434467',
    email: 'info@cargoclick.com.co',
    contactType: 'customer service',
    areaServed: 'CO',
    availableLanguage: 'Spanish',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bogotá',
    addressCountry: 'CO',
  },
  parentOrganization: {
    '@type': 'Organization',
    name: 'Transportes Nuevo Mundo S.A.S.',
    legalName: 'Transportes Nuevo Mundo S.A.S.',
    taxID: '830068506-9',
    areaServed: 'CO',
  },
  sameAs: [],
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = (
    <html lang="es-CO" className={inter.variable}>
      <head>
        <JsonLd schema={organizationSchema} />
      </head>
      <body className={inter.className}>
        {children}
        {isProduction && <GoogleAnalytics gaId="G-FTLPNPL8YT" />}
      </body>
    </html>
  )

  if (!publishableKey) {
    // Key is not available during static generation (Railway build without env vars).
    // At runtime the key will be present and Clerk will work normally via middleware.
    return content
  }

  return (
    <ClerkProvider>
      {content}
    </ClerkProvider>
  )
}
