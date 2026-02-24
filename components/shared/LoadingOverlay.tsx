/**
 * LoadingOverlay - Overlay de carga para operaciones críticas
 * 
 * Muestra una capa superpuesta con spinner y mensaje durante operaciones importantes.
 * Bloquea la interacción del usuario para evitar acciones durante el procesamiento.
 * 
 * CUÁNDO USAR:
 * - Paso 0: Creación inicial de solicitud
 * - Paso 12: Envío final de solicitud
 * - Operaciones que tardan >2 segundos
 * 
 * UX: Backdrop blur para mantener contexto visual
 * Spinner grande (16x16 = 64px) para visibilidad
 * Mensaje claro de lo que está sucediendo
 * z-50 para aparecer sobre todo el contenido
 * 
 * @component
 * @example
 * ```tsx
 * <LoadingOverlay 
 *   show={isCreatingSolicitud} 
 *   message="Creando tu solicitud..." 
 * />
 * ```
 */

'use client';

interface LoadingOverlayProps {
  /** Si el overlay debe mostrarse o no */
  show: boolean;
  /** Mensaje descriptivo de la operación en curso */
  message: string;
}

export function LoadingOverlay({ show, message }: LoadingOverlayProps) {
  // UX: Early return si no se muestra (evitar renderizar DOM innecesario)
  if (!show) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeInUp"
      role="dialog"
      aria-busy="true"
      aria-live="assertive"
      aria-label={message}
    >
      {/* Card contenedor del loading */}
      <div className="bg-card p-8 rounded-xl shadow-xl flex flex-col items-center gap-4 max-w-sm mx-4">
        {/* UX: Spinner grande para fácil visibilidad */}
        <div 
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
        
        {/* Mensaje descriptivo */}
        <p className="text-lg font-medium text-foreground text-center">
          {message}
        </p>
        
        {/* Texto adicional para dar contexto */}
        <p className="text-sm text-muted-foreground text-center">
          Por favor espera un momento...
        </p>
      </div>
    </div>
  );
}
