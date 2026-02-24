/**
 * EmailInput - Input especializado para emails
 * 
 * Uso: Paso 2 (email del contacto)
 * 
 * UX: Icono 📧 para identificación visual, teclado email en móvil
 * Accesibilidad: type="email" para validación HTML5, inputMode="email"
 * Mobile: Teclado con @ y . facilitado, altura mínima 48px
 * Validación: Formato email válido (regex estándar)
 * 
 * @component
 * @example
 * ```tsx
 * const { register, formState: { errors } } = useFormContext();
 * 
 * <EmailInput
 *   name="email"
 *   label="Correo electrónico"
 *   autoFocus
 *   required
 * />
 * ```
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface EmailInputProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label visible */
  label: string;
  /** Placeholder del input */
  placeholder?: string;
  /** Auto-focus al montar */
  autoFocus?: boolean;
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function EmailInput({
  name,
  label,
  placeholder = 'ejemplo@empresa.com',
  autoFocus,
  required,
  disabled,
}: EmailInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <InputWrapper name={name} label={label} error={error} required={required}>
      <div className="relative">
        {/* UX: Icono para identificación visual rápida */}
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-xl"
          aria-hidden="true"
        >
          📧
        </span>

        <input
          id={name}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`
            w-full pl-12 pr-4 py-3 rounded-lg border-2
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
      </div>
    </InputWrapper>
  );
}
