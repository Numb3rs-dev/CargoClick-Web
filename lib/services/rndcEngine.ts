/**
 * rndcEngine.ts
 *
 * Lógica compartida del motor de cotización histórico RNDC.
 * Usada desde:
 *   - app/api/cotizar/historico/route.ts  (API pública de consulta)
 *   - app/api/solicitudes/[id]/cotizar/route.ts (se llama automáticamente al cotizar)
 */

import { prisma } from '@/lib/db/prisma';

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface RndcResultado {
  estimado:          number;
  mediana:           number;
  promedio:          number;
  minimo:            number;
  maximo:            number;
  p25:               number;
  p75:               number;
  copPorKg:          number;
  confianza:         'ALTA' | 'MEDIA' | 'BAJA';
  nivelFallback:     number;  // 1=ruta exacta, 2=dept, 3=nacional
  nivelLabel:        string;
  viajesSimilares:   number;
  viajes:            ViajeResumen[];
}

export interface ViajeResumen {
  manifiesto:   string;
  fecha:        Date;
  pesoKg:       number;
  fletePactado: number;
  placa:        string | null;
}

// ── Normalización de ciudad ────────────────────────────────────────────────────

/**
 * Convierte "Bogotá, Cundinamarca" → "BOGOTA"
 * Toma el primer segmento antes de coma, quita tildes, pasa a mayúsculas.
 */
export function normalizarCiudad(str: string): string {
  return str
    .split(',')[0]          // antes de la coma
    .trim()
    .normalize('NFD')       // descomponer tildes
    .replace(/[\u0300-\u036f]/g, '') // quitar diacríticos
    .toUpperCase()
    .replace(/\s+/g, ' ')  // normalizar espacios
    .trim();
}

// ── Funciones estadísticas ─────────────────────────────────────────────────────

function mediana(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function promedio(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

function percentil(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * p)] ?? sorted[sorted.length - 1];
}

function confianza(n: number, nivel: number): 'ALTA' | 'MEDIA' | 'BAJA' {
  if (nivel === 1 && n >= 10) return 'ALTA';
  if (nivel === 1 && n >= 3)  return 'MEDIA';
  if (nivel === 2 && n >= 10) return 'MEDIA';
  return 'BAJA';
}

const NIVEL_LABELS: Record<number, string> = {
  1: 'Ruta exacta',
  2: 'Mismo departamento',
  3: 'Nacional (banda de peso)',
};

// ── Motor principal ────────────────────────────────────────────────────────────

interface SelectFields {
  manifiesto:      true;
  fechaExpedicion: true;
  pesoKg:          true;
  fletePactado:    true;
  fleteNeto:       true;
  placa:           true;
}

const SELECT_FIELDS: SelectFields = {
  manifiesto:      true,
  fechaExpedicion: true,
  pesoKg:          true,
  fletePactado:    true,
  fleteNeto:       true,
  placa:           true,
};

function toBuildResult(viajes: Array<{
  manifiesto: string;
  fechaExpedicion: Date;
  pesoKg: number;
  fletePactado: { toNumber(): number } | number;
  fleteNeto:    { toNumber(): number } | number;
  placa: string | null;
}>, pesoKgConsultado: number, nivel: number): RndcResultado {
  const toNum = (v: { toNumber(): number } | number) =>
    typeof v === 'object' ? v.toNumber() : Number(v);

  const fletes = viajes.map(v => toNum(v.fletePactado));
  const pesos  = viajes.map(v => v.pesoKg);

  const med    = mediana(fletes);
  const avg    = promedio(fletes);
  const min    = Math.min(...fletes);
  const max    = Math.max(...fletes);
  const p25    = percentil(fletes, 0.25);
  const p75    = percentil(fletes, 0.75);
  const pesoPromedio = promedio(pesos);
  const copPorKg     = pesoPromedio > 0 ? Math.round(avg / pesoPromedio) : 0;
  const estimado     = copPorKg > 0 ? Math.round(copPorKg * pesoKgConsultado) : med;

  return {
    estimado,
    mediana:         med,
    promedio:        avg,
    minimo:          min,
    maximo:          max,
    p25,
    p75,
    copPorKg,
    confianza:       confianza(viajes.length, nivel),
    nivelFallback:   nivel,
    nivelLabel:      NIVEL_LABELS[nivel],
    viajesSimilares: viajes.length,
    viajes: viajes.map(v => ({
      manifiesto:   v.manifiesto,
      fecha:        v.fechaExpedicion,
      pesoKg:       v.pesoKg,
      fletePactado: toNum(v.fletePactado),
      placa:        v.placa,
    })),
  };
}

/**
 * Consulta el histórico RNDC y devuelve estadísticas de flete para una ruta y peso.
 * Aplica fallback automático: ruta exacta → mismos depts → nacional.
 * Retorna null si no hay datos de ningún nivel.
 */
export async function consultarRndc(
  origenRaw: string,
  destinoRaw: string,
  pesoKg: number,
): Promise<RndcResultado | null> {
  const origen  = normalizarCiudad(origenRaw);
  const destino = normalizarCiudad(destinoRaw);

  const pesoMin = Math.round(pesoKg * 0.4);
  const pesoMax = Math.round(pesoKg * 1.6);

  // ── Nivel 1: ruta exacta ──────────────────────────────────────────────────
  const nivel1 = await prisma.manifiestoRndc.findMany({
    where: {
      origen:       { equals: origen,  mode: 'insensitive' },
      destino:      { equals: destino, mode: 'insensitive' },
      pesoKg:       { gte: pesoMin, lte: pesoMax },
      fletePactado: { gt: 0 },
    },
    select: SELECT_FIELDS,
    orderBy: { fechaExpedicion: 'desc' },
  });

  if (nivel1.length >= 3) return toBuildResult(nivel1, pesoKg, 1);

  // ── Nivel 2: mismos departamentos ─────────────────────────────────────────
  const [origenInfo, destinoInfo] = await Promise.all([
    prisma.manifiestoRndc.findFirst({
      where:  { origen:  { equals: origen,  mode: 'insensitive' } },
      select: { origenDept: true },
    }),
    prisma.manifiestoRndc.findFirst({
      where:  { destino: { equals: destino, mode: 'insensitive' } },
      select: { destinoDept: true },
    }),
  ]);

  if (origenInfo && destinoInfo) {
    const nivel2 = await prisma.manifiestoRndc.findMany({
      where: {
        origenDept:   { equals: origenInfo.origenDept,   mode: 'insensitive' },
        destinoDept:  { equals: destinoInfo.destinoDept, mode: 'insensitive' },
        pesoKg:       { gte: pesoMin, lte: pesoMax },
        fletePactado: { gt: 0 },
      },
      select: SELECT_FIELDS,
      orderBy: { fechaExpedicion: 'desc' },
    });

    if (nivel2.length >= 3) return toBuildResult(nivel2, pesoKg, 2);
  }

  // ── Nivel 3: nacional por banda de peso ───────────────────────────────────
  const nivel3 = await prisma.manifiestoRndc.findMany({
    where: {
      pesoKg:       { gte: pesoMin, lte: pesoMax },
      fletePactado: { gt: 0 },
    },
    select: SELECT_FIELDS,
    orderBy: { fechaExpedicion: 'desc' },
  });

  if (nivel3.length > 0) return toBuildResult(nivel3, pesoKg, 3);

  return null;
}
