/* ═══════════════════════════════════════════════════════════════════════════════
   Estados — configuraciones de badge y filtro para TODAS las entidades
   
   Fuente única de verdad: cualquier lista/badge importa desde aquí.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* -------------------------------------------------------------------------- */
/*  Tipo base para la configuración de badge/estado                            */
/* -------------------------------------------------------------------------- */

export interface EstadoConfig {
  label:    string;
  bg:       string;
  color:    string;
  border?:  string;
}

/** Convierte un record de estado-config a un array { value, label } apto para <select> */
export function estadosToOptions<K extends string>(
  config: Record<K, EstadoConfig>,
): { value: K; label: string }[] {
  return (Object.entries(config) as [K, EstadoConfig][]).map(([value, c]) => ({
    value,
    label: c.label,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Remesa — estados RNDC                                                       */
/* -------------------------------------------------------------------------- */

export const ESTADOS_REMESA: Record<string, EstadoConfig> = {
  PENDIENTE:  { label: 'Pendiente',  bg: '#FEF9C3', color: '#A16207', border: '#FDE68A' },
  ENVIADA:    { label: 'Enviada',    bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
  REGISTRADA: { label: 'Registrada', bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
  ANULADA:    { label: 'Anulada',    bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
};

export const ESTADOS_REMESA_FILTRO = estadosToOptions(ESTADOS_REMESA);

/* -------------------------------------------------------------------------- */
/*  Negocio — estados del ciclo                                                 */
/* -------------------------------------------------------------------------- */

export const ESTADOS_NEGOCIO: Record<string, EstadoConfig> = {
  CONFIRMADO:     { label: 'Confirmado',     bg: '#F3F4F6', color: '#6B7280' },
  EN_PREPARACION: { label: 'En preparación', bg: '#DBEAFE', color: '#1E40AF' },
  EN_TRANSITO:    { label: 'En tránsito',    bg: '#FEF3C7', color: '#92400E' },
  COMPLETADO:     { label: 'Completado',     bg: '#D1FAE5', color: '#065F46' },
  CANCELADO:      { label: 'Cancelado',      bg: '#FEE2E2', color: '#991B1B' },
};

export const ESTADOS_NEGOCIO_FILTRO = estadosToOptions(ESTADOS_NEGOCIO);

/* -------------------------------------------------------------------------- */
/*  Manifiesto — estados del ciclo de vida                                      */
/* -------------------------------------------------------------------------- */

export const ESTADOS_MANIFIESTO: Record<string, EstadoConfig> = {
  BORRADOR:           { label: 'Borrador',  bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  ENVIADO:            { label: 'Enviando…',  bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
  REGISTRADO:         { label: 'Registrado', bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  ACEPTADO_CONDUCTOR: { label: 'Aceptado',   bg: '#CCFBF1', color: '#0D9488', border: '#99F6E4' },
  CULMINADO:          { label: 'Culminado',   bg: '#BBF7D0', color: '#166534', border: '#86EFAC' },
  ANULADO:            { label: 'Anulado',     bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
};

export const ESTADOS_MANIFIESTO_FILTRO = estadosToOptions(ESTADOS_MANIFIESTO);

/* -------------------------------------------------------------------------- */
/*  Orden de cargue — estados                                                   */
/* -------------------------------------------------------------------------- */

export const ESTADOS_ORDEN_CARGUE: Record<string, EstadoConfig> = {
  BORRADOR:   { label: 'Borrador',   bg: '#F3F4F6', color: '#6B7280' },
  ASIGNADA:   { label: 'Asignada',   bg: '#EFF6FF', color: '#1D4ED8' },
  EN_CURSO:   { label: 'En curso',   bg: '#FEF9C3', color: '#92400E' },
  COMPLETADA: { label: 'Completada', bg: '#D1FAE5', color: '#065F46' },
  CANCELADA:  { label: 'Cancelada',  bg: '#FEE2E2', color: '#991B1B' },
};

export const ESTADOS_ORDEN_CARGUE_FILTRO = estadosToOptions(ESTADOS_ORDEN_CARGUE);

/* -------------------------------------------------------------------------- */
/*  RNDC sync status (Conductor / Vehículo)                                     */
/* -------------------------------------------------------------------------- */

export const RNDC_SYNC_STATUS = {
  SIN_SINCRONIZAR: { label: 'Sin sincronizar', bg: '#F3F4F6', color: '#6B7280' },
  REGISTRADO:      { label: 'Registrado',      bg: '#D1FAE5', color: '#065F46' },
  ERROR:           { label: 'Error RNDC',       bg: '#FEE2E2', color: '#991B1B' },
} as const;

/* -------------------------------------------------------------------------- */
/*  Hitos de seguimiento                                                        */
/* -------------------------------------------------------------------------- */

/** Hitos disponibles para el seguimiento de negocio */
export const HITOS_SEGUIMIENTO = [
  { value: 'NEGOCIO_CONFIRMADO', label: 'Negocio confirmado' },
  { value: 'REMESAS_ASIGNADAS',  label: 'Remesas asignadas'  },
  { value: 'DESPACHADO',         label: 'Despachado'         },
  { value: 'EN_RUTA',            label: 'En ruta'            },
  { value: 'EN_DESTINO',         label: 'En destino'         },
  { value: 'ENTREGADO',          label: 'Entregado'          },
  { value: 'NOVEDAD',            label: 'Novedad'            },
] as const;

/* -------------------------------------------------------------------------- */
/*  Badge fallback genérico                                                     */
/* -------------------------------------------------------------------------- */

export const FALLBACK_ESTADO: EstadoConfig = {
  label:  '—',
  bg:     '#F3F4F6',
  color:  '#6B7280',
  border: '#E5E7EB',
};
