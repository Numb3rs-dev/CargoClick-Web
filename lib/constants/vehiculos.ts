/* ═══════════════════════════════════════════════════════════════════════════════
   Vehículos & Conductores — catálogos de configuración
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Configuraciones de ejes permitidas para vehículos de carga */
export const CONFIGS_VEHICULO = ['C2', 'C3', 'C2S2', 'C2S3', 'C3S2', 'C3S3'] as const;

/** Tipos de vehículo de carga */
export const TIPOS_VEHICULO = ['CAMION', 'TRACTOCAMION', 'MINIMULA', 'SENCILLO'] as const;

/** Categorías de licencia de conducción colombiana */
export const CATEGORIAS_LICENCIA = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'] as const;
