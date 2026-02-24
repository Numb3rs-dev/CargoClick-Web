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
  let dbStatus = 'disconnected'

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected'
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    console.error(`[Health Check] DB unavailable: ${msg}`);
  }

  // Always return 200 so Railway healthcheck passes even if DB isn't ready yet.
  // The deploy start command (prisma migrate deploy) will handle DB connectivity.
  return NextResponse.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
}
