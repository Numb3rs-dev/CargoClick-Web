/**
 * CheckboxGroup - Selección múltiple con cards clickeables
 * 
 * Uso: Paso 11 (condiciones de cargue)
 * 
 * UX: Cards clickeables (no solo checkbox), selección múltiple visual clara
 * Accesibilidad: Navegable con teclado (Tab + Space), role="group"
 * Mobile: Cards uno abajo del otro, altura mínima táctil 56px
 * Validación: minSelections / maxSelections configurable
 * Visual: Border y fondo cambian al seleccionar, checkmark visible
 * 
 * @component
 * @example
 * ```tsx
 * const options = [
 *   { label: 'Muelle disponible', value: 'MUELLE_DISPONIBLE' },
 *   { label: 'Montacargas disponible', value: 'MONTACARGAS_DISPONIBLE' },
 *   { label: 'Cargue manual', value: 'CARGUE_MANUAL' }
 * ];
 * 
 * <CheckboxGroup
 *   name="condicionesCargue"
 *   label="Condiciones de cargue"
 *   options={options}
 *   minSelections={1}
 *   required
 * />
 * ```
 */

'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface CheckboxOption {
  /** Etiqueta visible */
  label: string;
  /** Valor del campo */
  value: string;
  /** Descripción opcional */
  description?: string;
  /** Icono opcional */
  icon?: string;
}

interface CheckboxGroupProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label del grupo */
  label: string;
  /** Opciones de selección */
  options: CheckboxOption[];
  /** Mínimo de selecciones requeridas */
  minSelections?: number;
  /** Máximo de selecciones permitidas */
  maxSelections?: number;
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function CheckboxGroup({
  name,
  label,
  options,
  minSelections = 0,
  maxSelections,
  required,
  disabled,
}: CheckboxGroupProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  // UX: Helper text dinámico según restricciones
  const helperText = (() => {
    if (minSelections > 0 && maxSelections) {
      return `Selecciona entre ${minSelections} y ${maxSelections} opciones`;
    }
    if (minSelections > 0) {
      return `Selecciona al menos ${minSelections} opción${minSelections > 1 ? 'es' : ''}`;
    }
    if (maxSelections) {
      return `Selecciona máximo ${maxSelections} opciones`;
    }
    return 'Puedes seleccionar múltiples opciones';
  })();

  return (
    <InputWrapper
      name={name}
      label={label}
      error={error}
      required={required}
      helperText={helperText}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const valorArray = Array.isArray(field.value) ? field.value : [];

          return (
            <div
              className="space-y-3"
              role="group"
              aria-label={label}
              aria-required={required}
            >
              {options.map((option) => {
                const isChecked = valorArray.includes(option.value);
                const isMaxReached = !!(maxSelections && valorArray.length >= maxSelections && !isChecked);

                return (
                  <label
                    key={option.value}
                    className={`
                      flex items-start p-4 rounded-lg cursor-pointer
                      border-2 transition-all duration-200
                      ${isChecked
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-input bg-background hover:border-primary/50 hover:bg-primary/5'
                      }
                      ${disabled || isMaxReached ? 'opacity-50 cursor-not-allowed' : ''}
                      min-h-[56px]
                    `}
                  >
                    {/* Checkbox nativo (visualmente oculto pero funcional para a11y) */}
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={isChecked}
                      onChange={(e) => {
                        const newValor = e.target.checked
                          ? [...valorArray, option.value]
                          : valorArray.filter((v) => v !== option.value);
                        field.onChange(newValor);
                      }}
                      onBlur={field.onBlur}
                      disabled={disabled || isMaxReached}
                      className="sr-only"
                      aria-checked={isChecked}
                    />

                    {/* Checkbox visual custom */}
                    <div
                      className={`
                        flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5
                        flex items-center justify-center
                        transition-all duration-200
                        ${isChecked
                          ? 'border-primary bg-primary'
                          : 'border-input bg-background'
                        }
                      `}
                      aria-hidden="true"
                    >
                      {isChecked && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10 3L4.5 8.5L2 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Contenido del card */}
                    <div className="ml-3 flex-1">
                      <div className="text-base font-medium text-foreground">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      )}
                    </div>

                    {/* Checkmark visual cuando está seleccionado */}
                    {isChecked && (
                      <div className="ml-2 text-primary text-xl" aria-hidden="true">
                        ✓
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          );
        }}
      />
    </InputWrapper>
  );
}
