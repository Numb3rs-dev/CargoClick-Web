/**
 * ProgressIndicator - Indicador de progreso del wizard
 * 
 * Muestra el paso actual y el progreso visual mediante dots o barra.
 * Debe estar siempre visible para que el usuario sepa dónde está en el proceso.
 * 
 * UX: Variantes "dots" (wizard) o "bar" (chat conversacional)
 * Feedback visual claro del progreso
 * Animación suave en cambios de progreso
 * 
 * @component
 * @example
 * ```tsx
 * // Modo dots para wizard (default)
 * <ProgressIndicator pasoActual={2} totalPasos={14} variant="dots" />
 * 
 * // Modo barra tradicional
 * <ProgressIndicator pasoActual={2} totalPasos={14} variant="bar" />
 * ```
 */

interface ProgressIndicatorProps {
  /** Paso actual (0-indexed, 0 = primer paso) */
  pasoActual: number;
  /** Total de pasos del flujo */
  totalPasos: number;
  /** Variante visual: dots para wizard, bar para chat */
  variant?: 'dots' | 'bar';
}

export function ProgressIndicator({ 
  pasoActual, 
  totalPasos,
  variant = 'dots' 
}: ProgressIndicatorProps) {
  // UX: pasoActual es 0-indexed, mostramos human-readable (1-indexed)
  const pasoHumano = pasoActual + 1;
  const porcentaje = Math.round((pasoActual / (totalPasos - 1)) * 100);
  
  // Renderizar variante dots (wizard)
  if (variant === 'dots') {
    return (
      <div 
        className="flex items-center justify-center gap-3"
        role="progressbar" 
        aria-valuenow={pasoHumano}
        aria-valuemin={1}
        aria-valuemax={totalPasos}
        aria-label={`Paso ${pasoHumano} de ${totalPasos}`}
      >
        {/* Dots visuales */}
        <div className="flex items-center gap-2.5">
          {Array.from({ length: Math.min(totalPasos, 7) }).map((_, index) => {
            // UX: Mostrar máximo 7 dots para no saturar
            const isActive = index < pasoHumano;
            return (
              <div
                key={index}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 scale-110 shadow-md' 
                    : 'bg-gray-300 scale-90'
                  }
                `}
                aria-hidden="true"
              />
            );
          })}
        </div>
        
        {/* Fracción numérica */}
        <span className="text-sm font-bold text-gray-800 ml-3 px-3 py-1 bg-white/80 rounded-full shadow-sm">
          {pasoHumano}/{totalPasos}
        </span>
      </div>
    );
  }
  
  // Renderizar variante barra (chat conversacional)
  return (
    <div 
      className="w-full mb-6" 
      role="progressbar" 
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progreso del formulario: ${porcentaje}% completado`}
    >
      {/* Texto descriptivo */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-foreground">
          Paso {pasoHumano} de {totalPasos}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {porcentaje}% completado
        </span>
      </div>
      
      {/* Barra de progreso */}
      {/* UX: h-2 para que sea visible pero no invasiva */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${porcentaje}%` }}
          // UX: Animación suave de 300ms al cambiar de paso
        />
      </div>
    </div>
  );
}
