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
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

// Prevenir múltiples instancias en desarrollo (hot module reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
