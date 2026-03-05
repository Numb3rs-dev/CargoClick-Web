/**
 * POST /api/geocodificar
 *
 * Geocodifica una dirección colombiana usando Nominatim / OpenStreetMap.
 * Sin API key. Rate limit Nominatim: 1 req/s — el cliente no debe llamar
 * en paralelo.
 *
 * Estrategia de búsqueda (de más precisa a más tolerante):
 *   1. direccion + municipio + Colombia  →  más precisa cuando el municipio
 *      coincide con el nombre que conoce OSM (ej: "Bogotá" → "Bogotá D.C.")
 *   2. direccion + Colombia              →  fallback: si el municipio no es
 *      reconocido por OSM o la combinación no da resultados
 *
 * Body: { direccion: string; municipio?: string }
 * OK:   { lat: number; lon: number; displayName: string; usedFallback: boolean }
 * Error: { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  direccion: z.string().min(3).max(400),
  municipio: z.string().max(100).optional(),
});

type NominatimResult = { lat: string; lon: string; display_name: string };

async function nominatimSearch(q: string): Promise<NominatimResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'co');
  url.searchParams.set('addressdetails', '0');

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent':       'CargoClick/1.0 (cargoclick.com.co)',
      'Accept-Language':  'es',
    },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 422 });
    }

    const { direccion, municipio } = parsed.data;
    const dir = direccion.trim();

    let results: NominatimResult[] = [];
    let usedFallback = false;

    // ── Intento 1: con municipio (más preciso) ─────────────────────────────
    if (municipio?.trim()) {
      const q = `${dir}, ${municipio.trim()}, Colombia`;
      results = await nominatimSearch(q);
    }

    // ── Intento 2: solo dirección + Colombia (fallback tolerante) ──────────
    if (!results.length) {
      usedFallback = !!municipio?.trim(); // fue fallback si intentamos con municipio antes
      const q = `${dir}, Colombia`;
      results = await nominatimSearch(q);
    }

    if (!results.length) {
      return NextResponse.json(
        { error: `No se encontraron coordenadas para "${dir}"` },
        { status: 404 },
      );
    }

    const { lat, lon, display_name } = results[0];
    return NextResponse.json({
      lat:          parseFloat(lat),
      lon:          parseFloat(lon),
      displayName:  display_name,
      usedFallback,
    });

  } catch (err) {
    console.error('[POST /api/geocodificar]', err);
    return NextResponse.json({ error: 'Error interno al geocodificar' }, { status: 500 });
  }
}

