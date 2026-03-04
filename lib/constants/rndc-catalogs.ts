/* ═══════════════════════════════════════════════════════════════════════════════
   Catálogos RNDC — fuente única de verdad para toda la app

   Basados en los catálogos oficiales del Ministerio de Transporte (procesoid 3),
   validados contra la aplicación RNDC de Nuevo Mundo y 31.722 remesas reales.

   Resolución 20223040045515 de agosto 5 de 2022 + Guía Registro Remesa V4.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Tipo base para opciones de catálogo ─── */
export interface CatalogOption {
  value: string;
  label: string;
  description?: string;
}

export interface EmpaqueOption extends CatalogOption {
  /** Peso mínimo del contenedor vacío en kg (solo contenedores) */
  pesoVacioMin?: number;
  /** Peso máximo del contenedor vacío en kg (solo contenedores) */
  pesoVacioMax?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   1. CODOPERACIONTRANSPORTE — Tipo de operación de la remesa
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * P (Paqueteo) = 62% de remesas reales, G (General) = 37%.
 * C (Consolidada legacy) prácticamente obsoleta — solo 4 registros de 31.722.
 */
export const COD_OPERACION: CatalogOption[] = [
  {
    value: 'G',
    label: 'General',
    description: 'Carga completa o fraccionada que no es contenedor ni paqueteo.',
  },
  {
    value: 'P',
    label: 'Paqueteo',
    description: 'Consolidación de paquetes con múltiples puntos de recolección y/o distribución. Requiere indicar tipo: Recolección, Distribución o Ambas.',
  },
  {
    value: 'CC',
    label: 'Contenedor cargado',
    description: 'Transporte de contenedores con carga. Los empaques se limitan a tipos de contenedor.',
  },
  {
    value: 'CV',
    label: 'Contenedor vacío',
    description: 'Reposicionamiento de contenedores sin carga.',
  },
];

/** Tipo de consolidada — obligatorio cuando operación = P */
export const TIPO_CONSOLIDADA: CatalogOption[] = [
  { value: 'N', label: 'Normal',       description: 'Un solo punto de cargue y uno de descargue.' },
  { value: 'R', label: 'Recolección',  description: 'Recoge en varios puntos, entrega en uno.' },
  { value: 'D', label: 'Distribución', description: 'Recoge en uno, entrega en varios puntos.' },
  { value: 'A', label: 'Ambas',        description: 'Recoge en varios puntos y entrega en varios.' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   2. CODNATURALEZACARGA — Naturaleza de la carga
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * G (Carga general) = 99.5% de remesas reales.
 * Extradimensionada y Extrapesada comparten código E en el RNDC, pero la UI de
 * Nuevo Mundo las muestra por separado. Aquí mantenemos la opción unificada porque
 * el campo XML es uno solo: <CODNATURALEZACARGA>E</CODNATURALEZACARGA>.
 */
export const COD_NATURALEZA: CatalogOption[] = [
  {
    value: 'G',
    label: 'Carga general',
    description: 'Todo tipo de mercancía convencional que no requiere condiciones especiales.',
  },
  {
    value: '2',
    label: 'Mercancía peligrosa',
    description: 'Sustancias peligrosas según el Libro Naranja de la ONU. Requiere código UN, estado y grupo de embalaje.',
  },
  {
    value: 'R',
    label: 'Refrigerada',
    description: 'Mercancía que requiere cadena de frío durante el transporte.',
  },
  {
    value: 'S',
    label: 'Semoviente',
    description: 'Animales vivos. Incluye ganado bovino, porcino, equino, etc.',
  },
  {
    value: 'E',
    label: 'Extradimensionada',
    description: 'Carga que excede las dimensiones vehiculares estándar. Requiere permiso INVIAS.',
  },
  {
    value: 'EP',
    label: 'Extrapesada',
    description: 'Carga que excede los límites de peso estándar. Requiere permiso INVIAS. Código RNDC: E.',
  },
  {
    value: '5',
    label: 'Residuo peligroso',
    description: 'Residuos de sustancias peligrosas. Similar a mercancía peligrosa pero clasificación diferente.',
  },
];

/**
 * Mapea el valor seleccionado en el formulario al código RNDC real.
 * EP (Extrapesada) → E en el XML del RNDC.
 */
export function naturalezaToRndc(value: string): string {
  return value === 'EP' ? 'E' : value;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   3. CODTIPOEMPAQUE — Unidad de empaque
   
   Tabla oficial del RNDC con código, nombre, descripción y rangos de peso
   vacío para contenedores. Validada contra aplicación Nuevo Mundo.
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Empaques para carga general / paqueteo (operaciones G, P) */
export const COD_EMPAQUE_CARGA: EmpaqueOption[] = [
  {
    value: '0',
    label: 'Paquetes',
    description: 'Carga separada en bultos. El peso de cada bulto debe ser mayor a 0.',
  },
  {
    value: '4',
    label: 'Bulto',
    description: 'Unidad de embalaje independiente: bidón, saco, tonel, bolsa, guacal.',
  },
  {
    value: '6',
    label: 'Granel líquido',
    description: 'Carga líquida transportada en forma masiva, homogénea, sin empaque unitario.',
  },
  {
    value: '15',
    label: 'Granel sólido',
    description: 'Carga sólida transportada en forma masiva, homogénea, sin empaque unitario.',
  },
  {
    value: '12',
    label: 'Cilindros',
    description: 'Recipiente para almacenar y transportar gases, entre 5 y 46 kg.',
  },
  {
    value: '17',
    label: 'Varios',
    description: 'Cuando en un mismo viaje van varios tipos de productos con diferentes empaques.',
  },
  {
    value: '18',
    label: 'No aplica',
    description: 'Para automóviles, animales o maquinaria que no requieren empaque.',
  },
  {
    value: '19',
    label: 'Carga estibada',
    description: 'Mercancías estibadas en grandes bultos sobre plataformas, con soportes y barandas.',
  },
];

/** Empaques exclusivos para operaciones de contenedor (CC, CV) */
export const COD_EMPAQUE_CONTENEDOR: EmpaqueOption[] = [
  {
    value: '7',
    label: 'Contenedor 20 pies',
    description: 'Contenedor estándar de 20 pies (6m). Resistente para reutilización.',
    pesoVacioMin: 1800,
    pesoVacioMax: 4000,
  },
  {
    value: '8',
    label: 'Dos contenedores 20 pies',
    description: 'Dos contenedores de 20 pies (6m cada uno) en un mismo vehículo.',
    pesoVacioMin: 3600,
    pesoVacioMax: 8000,
  },
  {
    value: '9',
    label: 'Contenedor 40 pies',
    description: 'Contenedor de 40 pies (12m). Mayor capacidad volumétrica.',
    pesoVacioMin: 2200,
    pesoVacioMax: 6500,
  },
];

/**
 * Retorna los empaques válidos según la operación seleccionada.
 * - G (General) y P (Paqueteo): todos los empaques de carga
 * - CC/CV (Contenedores): solo empaques tipo contenedor
 */
export function empaquesPorOperacion(op: string): EmpaqueOption[] {
  if (op === 'CC' || op === 'CV') return [...COD_EMPAQUE_CONTENEDOR];
  return [...COD_EMPAQUE_CARGA];
}

/** Busca un empaque en todos los catálogos por su código */
export function findEmpaque(code: string): EmpaqueOption | undefined {
  return COD_EMPAQUE_CARGA.find(e => e.value === code)
    ?? COD_EMPAQUE_CONTENEDOR.find(e => e.value === code);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   4. Catálogos auxiliares
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Unidades de medida de producto (aplica para granel líquido — empaque 6) */
export const UNIDAD_MEDIDA_PRODUCTO: CatalogOption[] = [
  { value: 'KGM', label: 'Kilogramo' },
  { value: 'GLL', label: 'Galón' },
  { value: 'MTQ', label: 'Metro cúbico' },
  { value: 'LTR', label: 'Litro' },
  { value: 'MLT', label: 'Mililitro' },
  { value: 'BLL', label: 'Barril' },
  { value: 'UN',  label: 'Unidad' },
];

/** Estado de la mercancía peligrosa */
export const ESTADO_MERCANCIA: CatalogOption[] = [
  { value: 'S', label: 'Sólido' },
  { value: 'L', label: 'Líquido' },
  { value: 'G', label: 'Gaseoso' },
];

/** Grupo de embalaje — mercancía peligrosa (Libro Naranja ONU) */
export const GRUPO_EMBALAJE: CatalogOption[] = [
  { value: 'I',   label: 'I — Muy peligroso' },
  { value: 'II',  label: 'II — Medianamente peligroso' },
  { value: 'III', label: 'III — Poco peligroso' },
];
