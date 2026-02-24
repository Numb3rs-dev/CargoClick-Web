/**
 * ButtonGroup - Selección visual única con botones grandes
 * 
 * Uso: Paso 7 (tipo de carga: Mercancía / Maquinaria / Muebles)
 * 
 * UX: Cards más visuales que RadioButtons, icono grande centrado
 * Accesibilidad: role="group", navegable con teclado, aria-pressed
 * Mobile: Grid 1 columna, desktop 3 columnas, animación scale al seleccionar
 * Visual: Transformación suave (scale 1.05) al seleccionar, sombra
 * 
 * @component
 * @example
 * ```tsx
 * const options = [
 *   { label: 'Mercancía', value: 'MERCANCIA_EMPRESARIAL', icon: '📦' },
 *   { label: 'Maquinaria', value: 'MAQUINARIA', icon: '⚙️' },
 *   { label: 'Muebles', value: 'MUEBLES_EMBALADOS', icon: '🪑' }
 * ];
 * 
 * <ButtonGroup
 *   name="tipoCarga"
 *   label="Tipo de carga"
 *   options={options}
 *   required
 * />
 * ```
 */

'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface ButtonOption {
  /** Etiqueta visible */
  label: string;
  /** Valor del campo */
  value: string;
  /** Icono grande */
  icon?: string;
}

interface ButtonGroupProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label del grupo */
  label: string;
  /** Opciones de selección */
  options: ButtonOption[];
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function ButtonGroup({
  name,
  label,
  options,
  required,
  disabled,
}: ButtonGroupProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <InputWrapper name={name} label={label} error={error} required={required}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            role="group"
            aria-label={label}
            aria-required={required}
          >
            {options.map((option) => {
              const isSelected = field.value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (!disabled) {
                      field.onChange(option.value);
                    }
                  }}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  className={`
                    flex flex-col items-center justify-center
                    p-6 rounded-xl border-2 cursor-pointer
                    transition-all duration-200
                    ${isSelected
                      ? 'border-primary bg-primary/10 shadow-lg scale-105'
                      : 'border-input bg-background hover:border-primary/50 hover:bg-primary/5 hover:scale-102 hover:shadow-md'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    min-h-[120px]
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                  `}
                  aria-pressed={isSelected}
                  aria-label={`${option.label}${isSelected ? ' (seleccionado)' : ''}`}
                >
                  {/* Icono grande centrado */}
                  {option.icon && (
                    <div
                      className="text-5xl mb-3"
                      aria-hidden="true"
                    >
                      {option.icon}
                    </div>
                  )}

                  {/* Label */}
                  <div
                    className={`
                      text-base font-semibold text-center
                      ${isSelected ? 'text-primary' : 'text-foreground'}
                    `}
                  >
                    {option.label}
                  </div>

                  {/* Checkmark cuando está seleccionado */}
                  {isSelected && (
                    <div
                      className="absolute top-2 right-2 text-primary text-2xl"
                      aria-hidden="true"
                    >
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      />
    </InputWrapper>
  );
}
