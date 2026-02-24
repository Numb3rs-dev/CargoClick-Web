/**
 * TypingIndicator - Indicador de "bot escribiendo..."
 * 
 * Muestra tres puntos animados para simular que el bot está escribiendo.
 * Se usa después de que el usuario envía una respuesta y antes de mostrar la siguiente pregunta.
 * 
 * UX: Feedback visual inmediato - usuario sabe que el sistema está procesando
 * Animación sutil de 1.4s con delay escalonado (200ms entre dots)
 * Duración típica en pantalla: 500-800ms
 * 
 * @component
 * @example
 * ```tsx
 * {isTyping && <TypingIndicator />}
 * ```
 */

export function TypingIndicator() {
  return (
    <div 
      className="flex w-full animate-fadeInUp"
      role="status"
      aria-live="polite"
      aria-label="El asistente está escribiendo"
    >
      {/* UX: Usar mismo estilo que bot-message para consistencia visual */}
      <div className="bot-message flex items-center gap-1.5">
        {/* UX: Tres dots con animación escalonada */}
        <span className="typing-dot w-2 h-2 rounded-full bg-current opacity-30" />
        <span className="typing-dot w-2 h-2 rounded-full bg-current opacity-30" />
        <span className="typing-dot w-2 h-2 rounded-full bg-current opacity-30" />
        
        {/* Screen reader text */}
        <span className="sr-only">Escribiendo...</span>
      </div>
    </div>
  );
}
