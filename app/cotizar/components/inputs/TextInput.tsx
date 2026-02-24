/**
 * TextInput - Input de texto simple para datos alfanuméricos
 * 
 * Uso: Pasos 0, 1, 5, 6 (empresa, contacto, origen, destino)
 * 
 * UX: Auto-focus en primer render, contador de caracteres si hay límite
 * Accesibilidad: Asociación label-input, ARIA attributes, max 200 caracteres
 * Mobile: Altura mínima 48px (Ley de Fitts), tamaño fuente 16px+ (previene zoom iOS)
 * 
 * @component
 * @example
 * ```tsx
 * const { register, formState: { errors } } = useFormContext();
 * 
 * <TextInput
 *   name="empresa"
 *   label="Nombre de empresa"
 *   placeholder="ACME Transport"
 *   maxLength={200}
 *   autoFocus
 * />
 * ```
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface TextInputProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label visible */
  label: string;
  /** Placeholder del input */
  placeholder?: string;
  /** Longitud máxima de caracteres */
  maxLength?: number;
  /** Auto-focus al montar */
  autoFocus?: boolean;
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function TextInput({
  name,
  label,
  placeholder = 'Escribe aquí...',
  maxLength = 200,
  autoFocus,
  required,
  disabled,
}: TextInputProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;
  const valorActual = watch(name) || '';

  return (
    <InputWrapper
      name={name}
      label={label}
      error={error}
      required={required}
      helperText={maxLength ? `${valorActual.length}/${maxLength} caracteres` : undefined}
    >
      <input
        id={name}
        type="text"
        placeholder={placeholder}
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
          min-h-[48px]
        `}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...register(name)}
      />
    </InputWrapper>
  );
}
