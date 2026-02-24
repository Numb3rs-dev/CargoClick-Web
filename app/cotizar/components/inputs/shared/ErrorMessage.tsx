/**
 * ErrorMessage - Componente para mostrar mensajes de error de validación
 * 
 * UX: Aparece con animación suave, icono visual para fácil identificación
 * Accesibilidad: role="alert" para screen readers, aria-live="polite"
 * 
 * @component
 * @example
 * ```tsx
 * <ErrorMessage message="El email es inválido" />
 * ```
 */

'use client';

interface ErrorMessageProps {
  /** Mensaje de error a mostrar */
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      className="flex items-center gap-1.5 text-destructive text-sm font-medium animate-fadeInUp"
      role="alert"
      aria-live="polite"
    >
      {/* UX: Icono visual para rápida identificación del error */}
      <span className="text-lg" aria-hidden="true">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
