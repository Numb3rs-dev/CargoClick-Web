'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce genérico — retrasa la actualización de un valor hasta que pasen
 * `ms` milisegundos sin cambios.
 *
 * Uso: const debouncedTerm = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return debounced;
}
