/* ═══════════════════════════════════════════════════════════════════════════════
   Tipos de Identificación — catálogo unificado
   
   Unifica las variantes que existían en ClienteForm (N/C/P) y
   SucursalSelector (N/C/E).  Ahora todos los formularios usan la misma lista.
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface TipoIdentificacion {
  value: string;
  label: string;
}

/** Catálogo completo de tipos de identificación */
export const TIPOS_IDENTIFICACION: readonly TipoIdentificacion[] = [
  { value: 'N', label: 'NIT' },
  { value: 'C', label: 'Cédula' },
  { value: 'P', label: 'Pasaporte' },
  { value: 'E', label: 'Cédula de Extranjería' },
] as const;
