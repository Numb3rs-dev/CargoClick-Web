/**
 * Next.js Configuration
 * 
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */

/** @type {import('next').NextConfig} */

// ─── A-1: HTTP Security Headers ─────────────────────────────────────────────
// En desarrollo Clerk usa clerk.accounts.dev; en producción usa el dominio
// propio de tu instancia Clerk (ej: tuapp.clerk.accounts.com o clerk.tudominio.com)
// Detect Clerk mode by key prefix, not NODE_ENV.
// pk_test_ = dev keys (use *.clerk.accounts.dev)
// pk_live_ = prod keys (use *.clerk.accounts.com)
// ─── Variables de ambiente ────────────────────────────────────────────────────
// Railway Production debe tener:
//   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_...
//   CLERK_FRONTEND_API_URL            = https://clerk.cargoclick.com.co
//
// Railway UAT no necesita CLERK_FRONTEND_API_URL (usa el default de dev)
// ─────────────────────────────────────────────────────────────────────────────
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
const isClerkProd = clerkKey.startsWith('pk_live_')

// En prod: viene de la variable de ambiente (ej: https://clerk.cargoclick.com.co)
// En UAT/local: usa el dominio de desarrollo de Clerk
const clerkFrontendUrl = isClerkProd
  ? (process.env.CLERK_FRONTEND_API_URL ?? '')
  : 'https://clerk.accounts.dev'

const clerkScriptSrc = isClerkProd
  ? `${clerkFrontendUrl} https://*.clerk.accounts.com`
  : 'https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.clerk.accounts.com'

const clerkConnectSrc = isClerkProd
  ? `${clerkFrontendUrl} https://api.clerk.com https://*.clerk.accounts.com`
  : 'https://*.clerk.accounts.dev https://api.clerk.dev https://*.clerk.accounts.com https://api.clerk.com'

const clerkFrameSrc = isClerkProd
  ? `${clerkFrontendUrl} https://*.clerk.accounts.com`
  : 'https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.clerk.accounts.com'

// Google Analytics / Tag Manager
const gaSrc = 'https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com'

const securityHeaders = [
  // Evita MIME sniffing
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  // Evita clickjacking con iframes externos
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  // Prefetch DNS controlado
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  // Solo enviar referrer al mismo origen
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  // Deshabilitar cámara, micrófono y geolocalización
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS (solo efectivo en producción con HTTPS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Clerk necesita unsafe-inline/eval para su widget; GA4 necesita gtm/ga
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkScriptSrc} ${gaSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://img.clerk.com https://flagcdn.com https://www.google-analytics.com",
      "font-src 'self'",
      `connect-src 'self' ${clerkConnectSrc} ${gaSrc}`,
      `frame-src ${clerkFrameSrc}`,

      "frame-ancestors 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  reactStrictMode: true,

  // Aplicar security headers a todas las rutas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // Tree-shake imports pesados de MUI — reduce el bundle de /cotizar
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      'lucide-react',
    ],
  },
}

module.exports = nextConfig
