/**
 * Textarea - Área de texto multi-línea con auto-expansión
 * 
 * Uso: Paso 9 (dimensiones de la carga)
 * 
 * UX: Auto-expansible (3-10 líneas), contador de caracteres, ejemplos visibles
 * Accesibilidad: <textarea> nativo, aria attributes, maxLength
 * Mobile: Altura mínima 100px, fuente 16px+ (previene zoom iOS)
 * Helper: Ejemplos de formato debajo para guiar al usuario
 * 
 * @component
 * @example
 * ```tsx
 * <Textarea
 *   name="dimensiones"
 *   label="Dimensiones de la carga"
 *   placeholder="200 × 150 × 100 cm"
 *   rows={3}
 *   maxLength={500}
 *   helperText="Ej: 200×150×100 cm o 2m × 1.5m"
 * />
 * ```
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface TextareaProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label visible */
  label: string;
  /** Placeholder del textarea */
  placeholder?: string;
  /** Número de filas iniciales */
  rows?: number;
  /** Longitud máxima de caracteres */
  maxLength?: number;
  /** Texto de ayuda (ejemplos) */
  helperText?: string;
  /** Auto-focus al montar */
  autoFocus?: boolean;
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function Textarea({
  name,
  label,
  placeholder = 'Escribe aquí...',
  rows = 3,
  maxLength = 500,
  helperText,
  autoFocus,
  required,
  disabled,
}: TextareaProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;
  const valorActual = watch(name) || '';

  // UX: Helper text combinado con contador
  const helperTextFull = [
    maxLength ? `${valorActual.length}/${maxLength} caracteres` : '',
    helperText,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <InputWrapper
      name={name}
      label={label}
      error={error}
      required={required}
      helperText={helperTextFull}
    >
      <textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg border-2
          ${error ? 'border-destructive' : 'border-input'}
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted
          text-base font-normal
          bg-background text-foreground
          transition-all duration-200
          resize-none min-h-[100px]
        `}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...register(name)}
      />
    </InputWrapper>
  );
}
