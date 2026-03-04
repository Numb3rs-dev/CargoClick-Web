'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Selector de vista Tabla / Kanban para el listado de negocios.
 * Cambia el query param `vista` en la URL.
 */
export function NegocioVistaToggle() {
  const searchParams  = useSearchParams();
  const pathname      = usePathname();
  const router        = useRouter();
  const [, start]     = useTransition();
  const vistaActual   = searchParams.get('vista') ?? 'tabla';

  function cambiarVista(v: 'tabla' | 'kanban') {
    const params = new URLSearchParams(searchParams.toString());
    if (v === 'tabla') {
      params.delete('vista');
    } else {
      params.set('vista', v);
    }
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex gap-1 rounded-md border border-border p-0.5">
      <Button
        variant={vistaActual === 'tabla' ? 'secondary' : 'ghost'}
        size="sm"
        className="px-3 py-1 text-xs"
        onClick={() => cambiarVista('tabla')}
      >
        ▣ Tabla
      </Button>
      <Button
        variant={vistaActual === 'kanban' ? 'secondary' : 'ghost'}
        size="sm"
        className="px-3 py-1 text-xs"
        onClick={() => cambiarVista('kanban')}
      >
        ⊞ Kanban
      </Button>
    </div>
  );
}
