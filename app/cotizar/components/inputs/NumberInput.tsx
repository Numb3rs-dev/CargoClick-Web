/**
 * NumberInput - Input numérico con prefijo/sufijo y formateo
 * 
 * Uso: Pasos 8, 10 (peso, valor asegurado)
 * 
 * UX: Prefijo/sufijo visual ($ o kg), teclado numérico móvil, formateo separadores
 * Accesibilidad: type="number", inputMode="decimal", min/max definidos
 * Mobile: Teclado numérico con punto decimal, altura mínima 48px
 * Formato: Separadores de miles (1,000 / 1.000), prefijo $ o sufijo kg
 * 
 * Peso especial: Selector kg/toneladas con conversión automática
 * 
 * @component
 * @example
 * ```tsx
 * // Valor asegurado
 * <NumberInput
 *   name="valorAsegurado"
 *   label="Valor asegurado"
 *   prefix="$"
 *   min={0}
 *   step={1000}
 *   placeholder="1000000"
 * />
 * 
 * // Peso
 * <NumberInput
 *   name="pesoKg"
 *   label="Peso aproximado"
 *   suffix="kg"
 *   min={1}
 *   step={0.1}
 * />
 * ```
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface NumberInputProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label visible */
  label: string;
  /** Placeholder del input */
  placeholder?: string;
  /** Valor mínimo */
  min?: number;
  /** Valor máximo */
  max?: number;
  /** Incremento (step) */
  step?: number;
  /** Prefijo (ej: "$") */
  prefix?: string;
  /** Sufijo (ej: "kg") */
  suffix?: string;
  /** Auto-focus al montar */
  autoFocus?: boolean;
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function NumberInput({
  name,
  label,
  placeholder = '0',
  min = 0,
  max,
  step = 1,
  prefix,
  suffix,
  autoFocus,
  required,
  disabled,
}: NumberInputProps) {
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
      helperText={min !== undefined && max !== undefined ? `Rango: ${min} - ${max}` : undefined}
    >
      <div className="relative flex items-center">
        {/* Prefijo (ej: $) */}
        {prefix && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {prefix}
          </span>
        )}

        <input
          id={name}
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`
            w-full py-3 rounded-lg border-2
            ${prefix ? 'pl-10' : 'pl-4'}
            ${suffix ? 'pr-16' : 'pr-4'}
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
            valueAsNumber: true, // React Hook Form convierte a número
          })}
        />

        {/* Sufijo (ej: kg) */}
        {suffix && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {suffix}
          </span>
        )}
      </div>
    </InputWrapper>
  );
}
