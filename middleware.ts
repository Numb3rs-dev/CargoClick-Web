import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Rutas públicas: accesibles sin autenticación.
 * Todo lo demás queda protegido por Clerk.
 */
const isPublicRoute = createRouteMatcher([
  '/',                   // Root (redirige a /home)
  '/home(.*)',           // Landing / marketing page
  '/cotizar(.*)',        // Flujo de cotización para clientes
  '/sign-in(.*)',        // Página de login de Clerk
  '/api/health(.*)',     // Health check (no requiere auth)
  '/api/solicitudes',   // POST — crear solicitud (flujo público del wizard)
  '/api/solicitudes/:id', // GET/PATCH — guardado progresivo del wizard
  // /sign-up intencionalmente ausente: registro deshabilitado
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
}, {
  // Tolerancia a desfase de reloj del sistema (clock skew)
  // Evita el loop infinito de Clerk cuando el reloj local está levemente adelantado/atrasado
  clockSkewInMs: 60_000,
})

export const config = {
  matcher: [
    // Aplica a todas las rutas excepto archivos estáticos de Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre aplica a rutas API y tRPC
    '/(api|trpc)(.*)',
  ],
}
