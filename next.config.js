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
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
const isClerkProd = clerkKey.startsWith('pk_live_')
const clerkDomain = process.env.CLERK_FRONTEND_API_URL ?? 'https://clerk.accounts.dev'

// Always include both dev and prod Clerk domains to avoid CSP issues when
// NODE_ENV=production but using pk_test_ keys (e.g. Railway staging)
const clerkScriptSrc = isClerkProd
  ? `${clerkDomain} https://*.clerk.accounts.com`
  : 'https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.clerk.accounts.com'

const clerkConnectSrc = isClerkProd
  ? `${clerkDomain} https://api.clerk.com https://*.clerk.accounts.com`
  : 'https://*.clerk.accounts.dev https://api.clerk.dev https://*.clerk.accounts.com https://api.clerk.com'

const clerkFrameSrc = isClerkProd
  ? `${clerkDomain} https://*.clerk.accounts.com`
  : 'https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.clerk.accounts.com'

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
      // Clerk necesita unsafe-inline/eval para su widget
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkScriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://img.clerk.com https://flagcdn.com",
      "font-src 'self'",
      `connect-src 'self' ${clerkConnectSrc}`,
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
