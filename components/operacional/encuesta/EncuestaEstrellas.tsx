'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
}

/**
 * Selector de calificación por estrellitas (1-5).
 * Soporta hover con animación de fill + scale.
 * Cada estrella tiene aria-label para accesibilidad.
 *
 * @param value    - Valor seleccionado actualmente (null = ninguno)
 * @param onChange - Callback llamado con el número de estrellas elegido
 */
export function EncuestaEstrellas({ value, onChange }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div
      className="flex justify-center gap-2"
      role="group"
      aria-label="Calificación del servicio"
    >
      {[1, 2, 3, 4, 5].map(n => {
        const activa = (hover ?? value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            aria-pressed={value === n}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            <Star
              size={40}
              className={`transition-colors duration-100 ${
                activa
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-muted-foreground'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
