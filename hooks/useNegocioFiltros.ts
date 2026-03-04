'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

/**
 * Hook client para gestionar los filtros del listado de negocios via query params.
 * Mantiene la URL linkeable y sincronizada con los controles de filtro.
 */
export function useNegocioFiltros() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /**
   * Actualiza un parámetro de filtro en la URL y resetea a página 1.
   *
   * @param key   - Parámetro a actualizar (q, estado, page, vista...)
   * @param value - Valor nuevo, o null para eliminarlo
   */
  function setFiltro(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Resetear paginación al cambiar filtros (excepto cuando el propio filtro es 'page')
    if (key !== 'page') params.set('page', '1');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return {
    /** Búsqueda de texto (codigoNegocio, clienteNombre) */
    q:         searchParams.get('q')      ?? '',
    /** Estado de negocio, o '' para todos */
    estado:    searchParams.get('estado') ?? '',
    /** Vista activa: tabla | kanban */
    vista:     (searchParams.get('vista') ?? 'tabla') as 'tabla' | 'kanban',
    /** Página actual (1-indexed) */
    page:      Number(searchParams.get('page') ?? 1),
    /** True mientras la navegación está en vuelo */
    isPending,
    setFiltro,
  };
}
