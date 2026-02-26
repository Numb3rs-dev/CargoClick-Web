// TypeScript global type definitions

/**
 * Tipos para el Motor de Wizard de Cotización
 */

/**
 * Tipo de input para cada paso del formulario
 */
export type TipoInput = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'client-data'
  | 'company-data'
  | 'client-company-data'
  | 'name-company'
  | 'phone-email'
  | 'origin-destination'
  | 'weight-dimensions'
  | 'select'
  | 'radio' 
  | 'buttons' 
  | 'number' 
  | 'textarea' 
  | 'checkbox' 
  | 'date'
  | 'dimensions'
  | 'checklist-extras'
  | 'confirmation-extras';

/**
 * Opción para inputs de selección (radio, buttons, checkbox)
 */
export interface OpcionInput {
  /** Etiqueta visible */
  label: string;
  /** Valor del campo */
  value: string;
  /** URL de imagen/icono opcional */
  icon?: string;
  /** Subtexto siempre visible debajo del label (ejemplos cortos) */
  subtexto?: string;
  /** Descripción expandible — párrafo explicativo en lenguaje llano */
  descripcion?: string;
  /** Ejemplos concretos para la descripción expandida */
  ejemplos?: string;
  /** Lista de criterios "¿cómo saber si esta es tu opción?" */
  checklist?: string[];
}

/**
 * Configuración de un paso en el flujo conversacional
 */
export interface PasoConfig {
  /** Número del paso (0-13) */
  id: number;
  /** Pregunta que el bot hace al usuario */
  pregunta: string;
  /** Campo del formulario que se actualiza */
  campoFormulario: keyof DatosFormulario;
  /** Tipo de input a renderizar */
  tipoInput: TipoInput;
  /** Opciones para inputs de selección */
  opciones?: OpcionInput[];
  /** Función de validación Zod */
  validacion: any; // ZodType pero sin importar zod en types
  /** Función condicional (ej: paso 6 solo si tipoServicio = NACIONAL) */
  condicional?: (datos: Partial<DatosFormulario>) => boolean;
  /** Placeholder personalizado para el input */
  placeholder?: string;
}

/**
 * Datos del formulario de cotización
 */
export interface DatosFormulario {
  empresa?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  telefonoEmpresa?: string;
  tipoServicio?: 'URBANO' | 'NACIONAL';
  origen?: string;
  destino?: string;
  tipoCarga?: 'CARGA_GENERAL' | 'GRANEL_SOLIDO' | 'GRANEL_LIQUIDO';
  pesoKg?: number;
  dimLargoCm?: number;
  dimAnchoCm?: number;
  dimAltoCm?: number;
  valorAsegurado?: number;
  requiereEmpaque?: 'NO' | 'BASICO' | 'REFORZADO';
  cantidadAyudantes?: string;
  condicionesCargue?: string[];
  fechaRequerida?: Date;
  // Checklist de detalles adicionales (paso 6 — enrichment)
  servicioExpreso?: boolean;
  cargaPeligrosa?: boolean;
  ayudanteCargue?: boolean;
  ayudanteDescargue?: boolean;
  cargaFragil?: boolean;
  necesitaEmpaque?: boolean;
  multiplesDestinosEntrega?: boolean;
  requiereEscolta?: boolean;
  accesosDificiles?: boolean;
  cargaSobredimensionada?: boolean;
  // Textos de detalle para items con textarea
  detalleCargaPeligrosa?: string;
  detalleMultiplesDestinos?: string;
  detalleAccesosDificiles?: string;
  detalleSobredimensionada?: string;
  // Observaciones libres (paso 6 — enrichment)
  observaciones?: string;
  // Campos calculados / derivados — origen-destino (paso 2)
  distanciaKm?: number;
  tramoDistancia?: string;
  tiempoTransitoDesc?: string;
  // Campos calculados / derivados — peso y dimensiones (paso 4)
  volumenM3?: number | null;
  vehiculoSugeridoId?: string | null;
  vehiculoSugeridoNombre?: string | null;
}

/**
 * Estado completo del wizard
 */
export interface ConversacionState {
  /** Paso actual (-1 = landing, 0-13 = pasos, >=14 = completado) */
  pasoActual: number;
  /** ID de la solicitud en BD (generado en paso 0) */
  solicitudId: string | null;
  /** Estado de carga (guardando en BD) */
  isLoading: boolean;
  /** Error actual (si existe) */
  error: string | null;
  /** Datos del formulario */
  datosForm: DatosFormulario;
}

/**
 * Retorno del hook useConversacion (Wizard)
 */
export interface UseConversacionReturn {
  // Estado actual
  pasoActual: number;
  isLoading: boolean;
  error: string | null;
  
  // Datos
  solicitudId: string | null;
  datosForm: DatosFormulario;
  
  // Configuración del paso
  /** null cuando pasoActual === -1 (landing) o >= TOTAL_PASOS (completado) */
  pasoConfig: PasoConfig | null;
  mostrarPaso: boolean;
  progreso: number; // 0-100
  
  // Acciones
  iniciarFormulario: () => void;
  siguientePaso: (valor: any) => Promise<void>;
  pasoAnterior: () => void;
  resetear: () => void;
}
