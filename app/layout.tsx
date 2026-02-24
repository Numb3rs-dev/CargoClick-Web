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

// next/font optimiza la carga: inlines the CSS, preloads, font-display:swap
// evita la solicitud render-blocking de Google Fonts en globals.css
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'CargoClick – Soluciones Logísticas con Visión Digital',
  description: 'Solicite su cotización de transporte de carga de forma digital y organizada.',
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>
        {children}
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
