/**
 * Catálogo de vehículos de carga — Colombia
 *
 * Alineado con las configuraciones vehiculares del SICE-TAC
 * (Resolución 20213040034405, MinTransporte, 2021).
 *
 * Cada vehículo define:
 *   - Capacidad máxima de peso en kg
 *   - Capacidad volumétrica en m³
 *   - Dimensiones interiores útiles del furgón/plataforma (m)
 *   - Configuración SICE-TAC (para cálculo de costos)
 *
 * Lógica de selección del vehículo mínimo:
 *   Se elige el primer vehículo (ordenado de menor a mayor capacidad)
 *   donde TODOS los criterios se cumplen simultáneamente:
 *     peso ≤ capacidadPesoKg  AND
 *     volumen_carga ≤ capacidadM3  AND
 *     largo_carga ≤ dim.largoM  AND
 *     ancho_carga ≤ dim.anchoM  AND
 *     alto_carga  ≤ dim.altoM
 */

export interface VehiculoSisetac {
  /** Identificador único */
  id: string;
  /** Nombre comercial en Colombia */
  nombre: string;
  /** Configuración SICE-TAC (para cálculo de costos) */
  configuracionSisetac: 'C2_LIVIANO' | 'C2' | 'C3' | 'C3S3' | 'CAMIONETA';
  /** Capacidad máxima de carga en kg */
  capacidadPesoKg: number;
  /** Capacidad volumétrica total en m³ */
  capacidadM3: number;
  /** Dimensiones interiores útiles del espacio de carga */
  dimensionesInteriores: {
    largoM: number;
    anchoM: number;
    altoM: number;
  };
  /** Emoji representativo para la UI */
  emoji: string;
  /** Descripción corta para mostrar al usuario */
  descripcionCorta: string;
  /** Ejemplos de usos típicos */
  ejemplos: string;
}

/**
 * Lista ordenada de menor a mayor capacidad.
 * El algoritmo de selección itera en este orden para encontrar el mínimo.
 */
export const VEHICULOS_SISETAC: VehiculoSisetac[] = [
  {
    id: 'CAMIONETA_350',
    nombre: 'Camioneta 350',
    configuracionSisetac: 'CAMIONETA',
    capacidadPesoKg: 800,
    capacidadM3: 3.0,
    dimensionesInteriores: { largoM: 2.0, anchoM: 1.5, altoM: 1.0 },
    emoji: '🚐',
    descripcionCorta: 'Hasta 800 kg · 3 m³',
    ejemplos: 'Paquetes medianos, electrodomésticos, repuestos pequeños',
  },
  {
    id: 'NHR',
    nombre: 'Turbo (NHR)',
    configuracionSisetac: 'C2_LIVIANO',
    capacidadPesoKg: 1_500,
    capacidadM3: 10,
    dimensionesInteriores: { largoM: 4.0, anchoM: 2.0, altoM: 1.25 },
    emoji: '🚚',
    descripcionCorta: 'Hasta 1.500 kg · 10 m³',
    ejemplos: 'Mudanzas parciales, mercancía general liviana, herramientas',
  },
  {
    id: 'NPR_SENCILLO',
    nombre: 'Camión NPR (sencillo)',
    configuracionSisetac: 'C2',
    capacidadPesoKg: 5_000,
    capacidadM3: 32,
    dimensionesInteriores: { largoM: 5.5, anchoM: 2.4, altoM: 2.4 },
    emoji: '🚛',
    descripcionCorta: 'Hasta 5.000 kg · 32 m³',
    ejemplos: 'Maquinaria mediana, paletas, mercancía paletizada',
  },
  {
    id: 'NPR_LARGO',
    nombre: 'NPR largo / Furgón extendido',
    configuracionSisetac: 'C2',
    capacidadPesoKg: 8_000,
    capacidadM3: 48,
    dimensionesInteriores: { largoM: 7.0, anchoM: 2.4, altoM: 2.8 },
    emoji: '🚛',
    descripcionCorta: 'Hasta 8.000 kg · 48 m³',
    ejemplos: 'Mobiliario de oficina, equipos industriales medianos',
  },
  {
    id: 'CAMION_3_EJES',
    nombre: 'Camión 3 ejes (C3)',
    configuracionSisetac: 'C3',
    capacidadPesoKg: 17_000,
    capacidadM3: 65,
    dimensionesInteriores: { largoM: 8.5, anchoM: 2.4, altoM: 2.8 },
    emoji: '🚛',
    descripcionCorta: 'Hasta 17.000 kg · 65 m³',
    ejemplos: 'Carga industrial, volúmenes medianos de mercancía general',
  },
  {
    id: 'DOBLE_TROQUE',
    nombre: 'Doble troque / Tractocamión (C3S3)',
    configuracionSisetac: 'C3S3',
    capacidadPesoKg: 35_000,
    capacidadM3: 90,
    dimensionesInteriores: { largoM: 13.0, anchoM: 2.4, altoM: 2.8 },
    emoji: '🚛',
    descripcionCorta: 'Hasta 35.000 kg · 90 m³',
    ejemplos: 'Cargas completas (FTL), maquinaria pesada, exportaciones',
  },
];

// ── Algoritmo de selección ──────────────────────────────────────────────────

export interface ResultadoVehiculo {
  vehiculo: VehiculoSisetac | null;
  /** Motivo si ningún vehículo cubre la carga */
  motivoSinVehiculo?: string;
  /** m³ calculados de la carga */
  volumenM3: number;
  /** Porcentaje de uso del peso sobre el vehículo sugerido */
  usoPesoPercent: number;
  /** Porcentaje de uso del volumen sobre el vehículo sugerido */
  usoVolumenPercent: number;
}

/**
 * Determina el vehículo mínimo requerido para una carga dada.
 *
 * @param pesoKg      - Peso total de la carga en kg
 * @param dimLargoCm  - Largo de la carga en cm
 * @param dimAnchoCm  - Ancho de la carga en cm
 * @param dimAltoCm   - Alto de la carga en cm
 */
export function sugerirVehiculo(
  pesoKg: number,
  dimLargoCm: number,
  dimAnchoCm: number,
  dimAltoCm: number,
): ResultadoVehiculo {
  const largoM = dimLargoCm / 100;
  const anchoM = dimAnchoCm / 100;
  const altoM  = dimAltoCm  / 100;
  const volumenM3 = largoM * anchoM * altoM;

  for (const v of VEHICULOS_SISETAC) {
    const d = v.dimensionesInteriores;

    const pesoCabe    = pesoKg  <= v.capacidadPesoKg;
    const volumenCabe = volumenM3 <= v.capacidadM3;
    const largoCabe   = largoM  <= d.largoM;
    const anchoCabe   = anchoM  <= d.anchoM;
    const altoCabe    = altoM   <= d.altoM;

    if (pesoCabe && volumenCabe && largoCabe && anchoCabe && altoCabe) {
      return {
        vehiculo: v,
        volumenM3,
        usoPesoPercent:    Math.round((pesoKg   / v.capacidadPesoKg) * 100),
        usoVolumenPercent: Math.round((volumenM3 / v.capacidadM3)     * 100),
      };
    }
  }

  // Ningún vehículo cubre: carga sobredimensionada o muy pesada
  const ultimo = VEHICULOS_SISETAC[VEHICULOS_SISETAC.length - 1];
  const motivoPeso    = pesoKg > ultimo.capacidadPesoKg ? `peso (${pesoKg.toLocaleString()} kg > máximo ${ultimo.capacidadPesoKg.toLocaleString()} kg)` : null;
  const motivoVolumen = volumenM3 > ultimo.capacidadM3  ? `volumen (${volumenM3.toFixed(2)} m³ > máximo ${ultimo.capacidadM3} m³)` : null;
  const motivoDim = (largoM > ultimo.dimensionesInteriores.largoM || anchoM > ultimo.dimensionesInteriores.anchoM || altoM > ultimo.dimensionesInteriores.altoM)
    ? `dimensiones (${dimLargoCm}×${dimAnchoCm}×${dimAltoCm} cm)` : null;

  const motivos = [motivoPeso, motivoVolumen, motivoDim].filter(Boolean).join('; ');

  return {
    vehiculo: null,
    motivoSinVehiculo: `Carga supera la capacidad del mayor vehículo disponible por: ${motivos}. Consulta con un asesor.`,
    volumenM3,
    usoPesoPercent: 0,
    usoVolumenPercent: 0,
  };
}
