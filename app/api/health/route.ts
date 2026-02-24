/**
 * API Route: GET /api/health
 * 
 * Health check del sistema
 * Valida conectividad a base de datos
 * 
 * @module API_Health
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/health
 * Verifica disponibilidad del sistema
 * 
 * @returns Status del sistema
 * 
 * @example
 * GET /api/health
 * 
 * Response 200:
 * {
 *   "status": "ok",
 *   "timestamp": "2026-02-19T15:30:00Z",
 *   "database": "connected",
 *   "version": "1.0.0"
 * }
 */
export async function GET() {
  try {
    // Validar conectividad a base de datos
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      // version omitida — A-2: no exponer versión del software públicamente
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    console.error(`[Health Check] Failed: ${msg}`);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
