/**
 * RadioButtons - Selección única con cards clickeables
 * 
 * Uso: Paso 4 (tipo de servicio: Urbano / Nacional)
 * 
 * UX: Cards grandes clickeables (no solo el radio), selección visual clara
 * Accesibilidad: Navegable con teclado (flechas), role="radiogroup"
 * Mobile: Cards uno abajo del otro, hover en desktop, altura mínima táctil
 * Visual: Border y fondo cambian al seleccionar, transición suave
 * 
 * @component
 * @example
 * ```tsx
 * const options = [
 *   { label: '🏙️ Urbano', value: 'URBANO', description: 'Dentro de la ciudad' },
 *   { label: '🌍 Nacional', value: 'NACIONAL', description: 'Entre ciudades' }
 * ];
 * 
 * <RadioButtons
 *   name="tipoServicio"
 *   label="Tipo de servicio"
 *   options={options}
 *   required
 * />
 * ```
 */

'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

interface RadioOption {
  /** Etiqueta visible (puede incluir emoji) */
  label: string;
  /** Valor del campo */
  value: string;
  /** Descripción opcional (texto secundario) */
  description?: string;
  /** Icono opcional */
  icon?: string;
}

interface RadioButtonsProps {
  /** Nombre del campo en React Hook Form */
  name: string;
  /** Label del grupo */
  label: string;
  /** Opciones de selección */
  options: RadioOption[];
  /** Campo requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export function RadioButtons({
  name,
  label,
  options,
  required,
  disabled,
}: RadioButtonsProps) {
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
            className="space-y-3"
            role="radiogroup"
            aria-label={label}
            aria-required={required}
          >
            {options.map((option) => {
              const isSelected = field.value === option.value;

              return (
                <label
                  key={option.value}
                  className={`
                    flex items-start p-4 rounded-lg cursor-pointer
                    border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-input bg-background hover:border-primary/50 hover:bg-primary/5'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    min-h-[56px]
                  `}
                >
                  {/* Radio button nativo (visualmente oculto pero funcional para a11y) */}
                  <input
                    type="radio"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => field.onChange(option.value)}
                    onBlur={field.onBlur}
                    disabled={disabled}
                    className="sr-only"
                    aria-checked={isSelected}
                  />

                  {/* Radio visual custom */}
                  <div
                    className={`
                      flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5
                      flex items-center justify-center
                      transition-all duration-200
                      ${isSelected
                        ? 'border-primary bg-primary'
                        : 'border-input bg-background'
                      }
                    `}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
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
                  {isSelected && (
                    <div className="ml-2 text-primary text-xl" aria-hidden="true">
                      ✓
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        )}
      />
    </InputWrapper>
  );
}
