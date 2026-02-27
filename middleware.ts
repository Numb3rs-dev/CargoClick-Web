import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

/**
 * Rutas públicas: accesibles sin autenticación.
 * Todo lo demás queda protegido por Clerk.
 */
const isPublicRoute = createRouteMatcher([
  '/',                    // Root (redirige a /home)
  '/home(.*)',            // Landing / marketing page
  '/cotizar(.*)',         // Flujo de cotización para clientes
  '/sign-in(.*)',         // Página de login de Clerk
  '/privacidad(.*)',      // Política de privacidad (pública)
  '/quienes-somos(.*)',   // Página pública corporativa
  '/servicios(.*)',        // Servicios (pública)
  '/brochure(.*)',          // Brochure (descargable)
  '/sitemap.xml',         // SEO: Google Search Console
  '/robots.txt',          // SEO: crawlers
  '/api/health(.*)',      // Health check (no requiere auth)
  '/api/distancia(.*)',   // Distancias entre municipios (uso interno del wizard)
  '/api/solicitudes',    // POST — crear solicitud (flujo público del wizard)
  '/api/solicitudes/:id', // GET/PATCH — guardado progresivo del wizard
  // /sign-up intencionalmente ausente: registro deshabilitado
])

// Build the Clerk handler only when the key is present.
// Without this guard, Clerk crashes every request at Railway runtime
// before env vars are configured, blocking even the healthcheck.
const clerkHandler = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect()
      }
    }, { clockSkewInMs: 60_000 })
  : null

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!clerkHandler) return NextResponse.next()
  return clerkHandler(req, event)
}

export const config = {
  matcher: [
    // Aplica a todas las rutas excepto archivos estáticos de Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre aplica a rutas API y tRPC
    '/(api|trpc)(.*)',
  ],
}
