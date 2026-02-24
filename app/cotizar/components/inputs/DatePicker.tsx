/**
 * DatePicker - Selector de fecha optimizado para móvil
 * 
 * Uso: Paso 12 (fecha requerida)
 * 
 * UX: Input nativo en móvil (mejor UX), calendar dropdown en desktop
 * Accesibilidad: type="date" nativo, minDate para fechas futuras
 * Mobile: Date picker nativo del OS (mejor experiencia táctil)
 * Desktop: react-datepicker con calendar visual
 * Restricción: No permitir fechas pasadas (minDate = hoy)
 * 
 * @component
 * @example
 * ```tsx
 * <DatePicker
 *   name="fechaRequerida"
 *   label="Fecha requerida"
 *   minDate={new Date()}
 *   required
 * />
 * ```
 */

'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface DatePickerProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label visible */
  label: string;
  /** Fecha mínima permitida (default: hoy) */
  minDate?: Date;
  /** Fecha máxima permitida */
  maxDate?: Date;
  /** Fechas excluidas */
  excludeDates?: Date[];
  /** Auto-focus al montar */
  autoFocus?: boolean;
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function DatePicker({
  name,
  label,
  minDate = new Date(),
  maxDate,
  excludeDates,
  autoFocus,
  required,
  disabled,
}: DatePickerProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  // Formatear fecha a string ISO (YYYY-MM-DD) para input type="date"
  const formatDateToISO = (date: Date | null | undefined): string => {
    if (!date || !(date instanceof Date)) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parsear string ISO a Date
  const parseISOToDate = (iso: string): Date | null => {
    if (!iso) return null;
    const date = new Date(iso + 'T00:00:00'); // Forzar hora local
    return isNaN(date.getTime()) ? null : date;
  };

  return (
    <InputWrapper name={name} label={label} error={error} required={required}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const fieldValue = field.value instanceof Date ? field.value : parseISOToDate(field.value);

          return (
            <div className="relative">
              {/* UX: Icono de calendario para identificación visual */}
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none"
                aria-hidden="true"
              >
                📅
              </span>

              {/* UX: Input nativo type="date" - mejor UX en móvil */}
              <input
                id={name}
                type="date"
                value={formatDateToISO(fieldValue)}
                onChange={(e) => {
                  const newDate = parseISOToDate(e.target.value);
                  field.onChange(newDate);
                }}
                onBlur={field.onBlur}
                min={formatDateToISO(minDate)}
                max={maxDate ? formatDateToISO(maxDate) : undefined}
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
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                `}
                aria-label={label}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
              />
            </div>
          );
        }}
      />
    </InputWrapper>
  );
}
