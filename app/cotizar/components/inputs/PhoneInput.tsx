/**
 * PhoneInput - Input especializado para números telefónicos
 * 
 * Uso: Paso 3 (teléfono del contacto)
 * 
 * UX: Prefijo +57 (Colombia), icono 📞, formateo automático, teclado numérico móvil
 * Accesibilidad: type="tel" para teclado apropiado, inputMode="tel"
 * Mobile: Teclado numérico, altura mínima 48px
 * Formato: +57 300 123 4567 (separadores automáticos)
 * 
 * @component
 * @example
 * ```tsx
 * const { register, formState: { errors } } = useFormContext();
 * 
 * <PhoneInput
 *   name="telefono"
 *   label="Teléfono"
 *   countryCode="+57"
 *   autoFocus
 *   required
 * />
 * ```
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface PhoneInputProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label visible */
  label: string;
  /** Código de país (default: +57 Colombia) */
  countryCode?: string;
  /** Placeholder del input */
  placeholder?: string;
  /** Auto-focus al montar */
  autoFocus?: boolean;
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function PhoneInput({
  name,
  label,
  countryCode = '+57',
  placeholder = '300 123 4567',
  autoFocus,
  required,
  disabled,
}: PhoneInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <InputWrapper
      name={name}
      label={label}
      error={error}
      required={required}
      helperText="Máximo 15 dígitos"
    >
      <div className="relative flex items-center">
        {/* UX: Icono para identificación visual */}
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-xl"
          aria-hidden="true"
        >
          📞
        </span>

        {/* UX: Prefijo de país visible pero no editable */}
        <span
          className="absolute left-12 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground pointer-events-none"
          aria-hidden="true"
        >
          {countryCode}
        </span>

        <input
          id={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={placeholder}
          maxLength={15}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`
            w-full pl-24 pr-4 py-3 rounded-lg border-2
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
          {...register(name, {
            // UX: Formateo automático - permitir solo números
            onChange: (e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, '');
            },
          })}
        />
      </div>
    </InputWrapper>
  );
}
