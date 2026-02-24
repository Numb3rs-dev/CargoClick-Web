/**
 * InputWrapper - Componente wrapper común para todos los inputs
 * 
 * Proporciona estructura consistente: label, input, error, helper text
 * UX: Marca requeridos con asterisco rojo, helper text para guiar usuario
 * Accesibilidad: Asociación label-input con htmlFor/id
 * 
 * @component
 * @example
 * ```tsx
 * <InputWrapper 
 *   name="email" 
 *   label="Correo electrónico"
 *   error="Email inválido"
 *   required
 * >
 *   <input type="email" id="email" />
 * </InputWrapper>
 * ```
 */

'use client';

import { ErrorMessage } from './ErrorMessage';

interface InputWrapperProps {
  /** Nombre del campo (usado para id) */
  name: string;
  /** Label visible del input */
  label: string;
  /** Mensaje de error (si existe) */
  error?: string;
  /** Texto de ayuda (mostrado cuando no hay error) */
  helperText?: string;
  /** Indica si el campo es requerido */
  required?: boolean;
  /** Input component (children) */
  children: React.ReactNode;
}

export function InputWrapper({
  name,
  label,
  error,
  helperText,
  required,
  children,
}: InputWrapperProps) {
  return (
    <div className="w-full space-y-2">
      {/* Label */}
      <label
        htmlFor={name}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {/* UX: Asterisco rojo para campos requeridos */}
        {required && (
          <span className="text-destructive ml-1" aria-label="requerido">
            *
          </span>
        )}
      </label>

      {/* Input (children) */}
      <div className="relative">{children}</div>

      {/* Helper text - Solo mostrar si NO hay error */}
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {/* Error message - Prioridad sobre helper text */}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
