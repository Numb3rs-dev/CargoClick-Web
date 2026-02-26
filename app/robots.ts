import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const isProduction = BASE_URL === 'https://cargoclick.com.co';

export default function robots(): MetadataRoute.Robots {
  // En UAT o cualquier entorno sin BASE_URL de producción:
  // bloquear TODOS los crawlers para evitar indexación no deseada.
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
