import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cargoclick.com.co';
// Uses the same opt-in flag as GA. Only production Railway has NEXT_PUBLIC_GA_ENABLED=true.
// Local and UAT will block crawlers automatically without needing extra variables.
const isProduction = process.env.NEXT_PUBLIC_GA_ENABLED === 'true';

export default function robots(): MetadataRoute.Robots {
  // En UAT o local: bloquear TODOS los crawlers para evitar indexación no deseada.
  if (!isProduction) {
    return {
      rules: [{ userAgent: '*', disallow: ['/'] }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/home', '/cotizar'],
        disallow: ['/api/', '/sign-in', '/solicitudes', '/cotizaciones'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
