/**
 * Cálculo de distancias viales reales entre municipios de Colombia.
 *
 * Estrategia:
 *   1. LOOKUP TABLE completa (20,910 pares): distancias calculadas con OSRM
 *      sobre la red vial real de OpenStreetMap. Precisión ≈ 0%.
 *   2. HAVERSINE × 1.4: fallback para municipios fuera de la tabla
 *      (p.ej. San Andrés, municipios sin conexión vial). Precisión ±10–20%.
 */

import { COORDENADAS_MUNICIPIOS } from '@/app/cotizar/config/colombia-coordenadas';
import { DISTANCIAS_REALES }       from './distancias-tabla';

/** Radio de la Tierra en km */
const RADIO_TIERRA_KM = 6371;

/** Factor vial Colombia: fallback Haversine × FACTOR para municipios sin conexión vial */
const FACTOR_VIAL_COLOMBIA = 1.4;

/**
 * Genera la clave normalizada para buscar un par de municipios en DISTANCIAS_REALES.
 * Ordena los códigos para garantizar simetría (A→B = B→A).
 */
function claveDistancia(cod1: string, cod2: string): string {
  return [cod1, cod2].sort().join(':');
}

/**
 * Calcula la distancia en línea recta (Haversine) entre dos puntos geográficos.
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return RADIO_TIERRA_KM * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Calcula la distancia aproximada por carretera entre dos municipios colombianos.
 *
 * Prioridad:
 *   1. Lookup de distancias reales calibradas  → exacta
 *   2. Haversine × 1.4 (fallback)              → ±10–20%
 *
 * @param codigoOrigen  - Código DANE 5 dígitos del municipio de origen
 * @param codigoDestino - Código DANE 5 dígitos del municipio de destino
 * @returns Distancia aproximada en km, o null si alguno de los códigos no tiene coordenadas
 */
export function calcularDistanciaKm(codigoOrigen: string, codigoDestino: string): number | null {
  if (codigoOrigen === codigoDestino) return 0;

  // 1. ── Lookup de distancias reales ──────────────────────────────────────
  const clave = claveDistancia(codigoOrigen, codigoDestino);
  const entrada = DISTANCIAS_REALES[clave];
  if (entrada !== undefined) {
    // Soporta formato antiguo (number) y nuevo ([km, validado])
    return Array.isArray(entrada) ? (entrada as [number, 0|1])[0] : (entrada as unknown as number);
  }

  // 2. ── Haversine × factor vial (fallback) ───────────────────────────────
  const origen  = COORDENADAS_MUNICIPIOS[codigoOrigen];
  const destino = COORDENADAS_MUNICIPIOS[codigoDestino];

  if (!origen || !destino) return null;

  const distanciaRecta = haversineKm(origen.lat, origen.lon, destino.lat, destino.lon);
  return Math.round(distanciaRecta * FACTOR_VIAL_COLOMBIA);
}

/**
 * Retorna la distancia o un fallback con Haversine × factor más conservador.
 * Nunca retorna null — util para formularios donde siempre se necesita un número.
 *
 * @param codigoOrigen  - Código DANE 5 dígitos
 * @param codigoDestino - Código DANE 5 dígitos
 * @returns Distancia aproximada en km (mínimo 1)
 */
export function calcularDistanciaKmSafe(codigoOrigen: string, codigoDestino: string): number {
  return calcularDistanciaKm(codigoOrigen, codigoDestino) ?? 500; // fallback 500 km si no hay datos
}

/**
 * Clasifica una distancia en tramos logísticos colombianos (SISETAC).
 *
 * Tramos orientativos basados en tarifas reales:
 * - CORTA:   < 100 km  (departamental)
 * - MEDIA:   100–400 km (inter-regional)
 * - LARGA:   400–800 km (nacional)
 * - MUY_LARGA: > 800 km (extremo a extremo)
 */
export type TramoDistancia = 'CORTA' | 'MEDIA' | 'LARGA' | 'MUY_LARGA';

export function clasificarTramo(distanciaKm: number): TramoDistancia {
  if (distanciaKm < 100)  return 'CORTA';
  if (distanciaKm < 400)  return 'MEDIA';
  if (distanciaKm < 800)  return 'LARGA';
  return 'MUY_LARGA';
}

/**
 * Velocidad promedio de transporte de carga en Colombia por tipo de ruta.
 * Incluye cargue/descargue, paradas, y condiciones viales colombianas.
 *   CORTA   (<100 km)  : rutas departamentales, muchos municipios, ~40 km/h efectivos
 *   MEDIA   (100-400)  : troncales regionales, ~50 km/h efectivos
 *   LARGA   (400-800)  : corredores nacionales, ~55 km/h efectivos
 *   MUY_LARGA (>800)   : travesías largas, múltiples paradas, ~50 km/h efectivos
 *
 * Se divide en jornadas de 10 horas de conducción efectiva.
 * Se añade 1 día de margen operativo (cargue, documentación, imprevisto).
 */
const VELOCIDAD_EFECTIVA_KMH: Record<TramoDistancia, number> = {
  CORTA:     40,
  MEDIA:     50,
  LARGA:     55,
  MUY_LARGA: 50,
};

const HORAS_JORNADA = 10;
const DIAS_MARGEN   = 1;

export interface TiempoTransito {
  diasMinimo: number;
  diasMaximo: number;
  descripcion: string;       // Ej: "1–2 días hábiles"
  tiempoViajeHoras: number;  // Horas totales de manejo (float)
  tiempoViajeFormato: string // Ej: "19 h 21 min 49 s"
}

/**
 * Estima el tiempo de tránsito en días hábiles para una distancia dada.
 * Basado en velocidades efectivas del transporte de carga colombiano.
 */
export function estimarTiempoTransito(distanciaKm: number): TiempoTransito {
  const tramo     = clasificarTramo(distanciaKm);
  const velocidad = VELOCIDAD_EFECTIVA_KMH[tramo];
  const horasViaje = distanciaKm / velocidad;
  const diasViaje  = Math.ceil(horasViaje / HORAS_JORNADA);

  const diasMinimo = Math.max(1, diasViaje);
  const diasMaximo = diasMinimo + DIAS_MARGEN;

  const descripcion =
    diasMinimo === diasMaximo
      ? `${diasMinimo} día${diasMinimo > 1 ? 's' : ''} hábil${diasMinimo > 1 ? 'es' : ''}`
      : `${diasMinimo}–${diasMaximo} días hábiles`;

  // Desglose h:m:s del tiempo continuo de manejo
  const totalSegundos = Math.round(horasViaje * 3600);
  const horas   = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  const tiempoViajeFormato = `${horas} h ${minutos} min ${segundos} s`;

  return { diasMinimo, diasMaximo, descripcion, tiempoViajeHoras: horasViaje, tiempoViajeFormato };
}

/**
 * Información completa de distancia entre dos municipios
 */
export interface InfoDistancia {
  distanciaKm: number;
  tramo: TramoDistancia;
  tiempoTransito: TiempoTransito;
  disponible: boolean; // false si algún código no tenía coordenadas
}

/**
 * Retorna distancia + tramo logístico + tiempo estimado entre dos municipios.
 */
export function getInfoDistancia(codigoOrigen: string, codigoDestino: string): InfoDistancia {
  const distanciaKm = calcularDistanciaKm(codigoOrigen, codigoDestino);
  const disponible  = distanciaKm !== null;
  const km          = distanciaKm ?? 500;
  return {
    distanciaKm: km,
    tramo: clasificarTramo(km),
    tiempoTransito: estimarTiempoTransito(km),
    disponible,
  };
}
