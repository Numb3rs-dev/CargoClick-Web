/**
 * GET  /api/parametros/mensuales — Obtiene parámetros del mes actual (o mes/año indicado).
 * POST /api/parametros/mensuales — Crea o actualiza parámetros de un mes.
 *
 * Utiliza el modelo MonthlyParams del cotizador operacional.
 * Los parámetros mensuales se usan para calcular tarifas de transporte.
 *
 * @module ParametrosMensualesRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

/**
 * Schema de actualización/creación de parámetros mensuales.
 */
const parametrosMensualesSchema = z.object({
  mes:              z.number().int().min(1).max(12),
  anio:             z.number().int().min(2020),
  acpmPriceCopGal:  z.number().positive(),
  smlmv:            z.number().positive(),
  interesMensualBr: z.number().positive(),
  notas:            z.string().optional(),
});

/** Convierte mes y año al formato periodoYyyyMm (ej: 202603) */
function toPeriodo(anio: number, mes: number): number {
  return anio * 100 + mes;
}

/**
 * Devuelve los parámetros del mes/año indicado via query params.
 * Si no se indica mes/año usa el mes actual.
 *
 * @requires Auth Clerk
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const sp = req.nextUrl.searchParams;
    const now = new Date();
    const anio = parseInt(sp.get('anio') ?? String(now.getFullYear()), 10);
    const mes  = parseInt(sp.get('mes')  ?? String(now.getMonth() + 1), 10);
    const periodo = toPeriodo(anio, mes);

    const params = await prisma.monthlyParams.findUnique({
      where: { periodoYyyyMm: periodo },
    });

    if (!params) {
      return ok(null);
    }

    return ok(params);
  } catch (e) { return handleError(e); }
}

/**
 * Crea o actualiza los parámetros de un mes (upsert).
 *
 * @requires Auth Clerk
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const body = parametrosMensualesSchema.parse(await req.json());
    const periodo = toPeriodo(body.anio, body.mes);

    const params = await prisma.monthlyParams.upsert({
      where: { periodoYyyyMm: periodo },
      update: {
        acpmPriceCopGal:  body.acpmPriceCopGal,
        smlmv:            body.smlmv,
        interesMensualBr: body.interesMensualBr,
        notas:            body.notas,
      },
      create: {
        periodoYyyyMm:    periodo,
        acpmPriceCopGal:  body.acpmPriceCopGal,
        smlmv:            body.smlmv,
        interesMensualBr: body.interesMensualBr,
        notas:            body.notas,
      },
    });

    return ok(params);
  } catch (e) { return handleError(e); }
}
