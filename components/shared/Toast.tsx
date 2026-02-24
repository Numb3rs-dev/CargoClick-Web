/**
 * Toast - Notificación temporal de confirmación
 * 
 * Muestra mensajes de feedback temporal en la esquina superior derecha.
 * Se auto-cierra después de 3 segundos.
 * 
 * TIPOS:
 * - success: Operación exitosa (verde, checkmark ✅)
 * - error: Error o fallo (rojo, X ❌)
 * - info: Información neutral (azul, info ℹ️)
 * 
 * UX: Posición fixed top-right para no obstruir contenido principal
 * Auto-dismiss después de 3 segundos
 * Animación slideInUp para entrada suave
 * 
 * @component
 * @example
 * ```tsx
 * <Toast 
 *   type="success"
 *   message="Cambios guardados correctamente"
 *   onClose={() => setShowToast(false)}
 * />
 * ```
 */

'use client';

import { useEffect } from 'react';

interface ToastProps {
  /** Tipo de notificación que determina color e icono */
  type: 'success' | 'error' | 'info';
  /** Mensaje a mostrar al usuario */
  message: string;
  /** Callback cuando el toast se cierra (auto o manual) */
  onClose: () => void;
  /** Duración en ms antes de auto-cerrar (default: 3000ms) */
  duration?: number;
}

export function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  // UX: Auto-cerrar después de la duración especificada
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  // Configuración de estilos y emoji según tipo
  const config = {
    success: {
      borderColor: 'border-secondary',
      emoji: '✅',
      ariaLabel: 'Éxito'
    },
    error: {
      borderColor: 'border-destructive',
      emoji: '❌',
      ariaLabel: 'Error'
    },
    info: {
      borderColor: 'border-primary',
      emoji: 'ℹ️',
      ariaLabel: 'Información'
    }
  };
  
  const { borderColor, emoji, ariaLabel } = config[type];
  
  return (
    <div 
      className={`
        fixed top-4 right-4 z-50
        bg-card border-2 rounded-lg shadow-xl p-4
        animate-slideInUp
        max-w-md mx-4
        ${borderColor}
      `}
      role="alert"
      aria-live="assertive"
      aria-label={`${ariaLabel}: ${message}`}
    >
      <div className="flex items-start gap-3">
        {/* Emoji/Icono */}
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          {emoji}
        </span>
        
        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* UX: Botón para cerrar manualmente si usuario quiere */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar notificación"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
