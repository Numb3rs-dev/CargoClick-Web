/**
 * GET /api/distancia?origen=XXXXX&destino=YYYYY
 *
 * Retorna la distancia vial entre dos municipios colombianos (códigos DANE 5 dígitos).
 *
 * Estrategia:
 *   1. Consulta tabla `distancias` en PostgreSQL (OSRM / OpenStreetMap) → exacta
 *   2. Haversine × 1.4 si el par no está en BD (islas, zonas sin vía) → estimada
 *   3. 404 si alguno de los municipios no tiene coordenadas conocidas
 *
 * Response 200:
 *   { km: number, fuente: 'osrm' | 'haversine', validado?: number }
 * Response 404:
 *   { fuente: 'sin_datos' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/db/prisma';
import { COORDENADAS_MUNICIPIOS }    from '@/app/cotizar/config/colombia-coordenadas';
import { haversineKm, clasificarTramo, estimarTiempoTransito } from '@/lib/utils/distancias';

const FACTOR_VIAL = 1.4;
const DANE_RE     = /^\d{5}$/;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
  const o = searchParams.get('origen')  ?? '';
  const d = searchParams.get('destino') ?? '';

  // Validar formato
    if (!DANE_RE.test(o) || !DANE_RE.test(d)) {
      return NextResponse.json({ error: 'Parámetros inválidos — se esperan códigos DANE de 5 dígitos' }, { status: 400 });
    }

    // Mismo municipio → 0 km
    if (o === d) {
      return NextResponse.json({ km: 0, fuente: 'osrm', validado: 1 });
    }

    // Orden lexicográfico — la tabla siempre guarda (menor, mayor)
    const [origen, destino] = [o, d].sort();

    // 1. ── Consulta BD (OSRM) ──────────────────────────────────────────────
    const row = await prisma.distancia.findUnique({
      where: { origen_destino: { origen, destino } },
      select: { km: true, validado: true },
    });

    if (row) {
      const tramo          = clasificarTramo(row.km);
      const tiempoTransito = estimarTiempoTransito(row.km);
      return NextResponse.json({ km: row.km, fuente: 'osrm', validado: row.validado, tramo, tiempoTransito });
    }

    // 2. ── Fallback Haversine ──────────────────────────────────────────────
    const coordO = COORDENADAS_MUNICIPIOS[o];
    const coordD = COORDENADAS_MUNICIPIOS[d];

    if (!coordO || !coordD) {
      return NextResponse.json({ fuente: 'sin_datos' }, { status: 404 });
    }

    const km             = Math.round(haversineKm(coordO.lat, coordO.lon, coordD.lat, coordD.lon) * FACTOR_VIAL);
    const tramo          = clasificarTramo(km);
    const tiempoTransito = estimarTiempoTransito(km);
    return NextResponse.json({ km, fuente: 'haversine', tramo, tiempoTransito });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/distancia] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
