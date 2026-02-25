/**
 * Prisma Client Singleton
 * 
 * Evita múltiples instancias de PrismaClient en desarrollo (hot reload).
 * Sigue el patrón recomendado en la documentación oficial de Prisma.
 * 
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Cliente Prisma singleton exportado.
 * 
 * - En desarrollo: habilita logs de queries, errores y warnings para debugging
 * - En producción: solo muestra errores para minimizar overhead
 * 
 * @example
 * ```typescript
 * import { prisma } from '@/lib/db/prisma'
 * 
 * const solicitudes = await prisma.solicitud.findMany()
 * ```
 */
/**
 * En producción Railway usa PgBouncer o conexiones directas con pool pequeño.
 * Añadimos connection_limit y connect_timeout para evitar P1017
 * "Server has closed the connection".
 */
function buildDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || process.env.NODE_ENV !== 'production') return url;
  // Evitar duplicar params si ya están presentes
  if (url.includes('connection_limit=')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}connection_limit=5&pool_timeout=20&connect_timeout=60`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    datasources: {
      db: { url: buildDatabaseUrl() },
    },
  })

// Prevenir múltiples instancias en desarrollo (hot module reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
