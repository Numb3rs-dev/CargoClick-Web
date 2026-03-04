'use client';

import Link from 'next/link';
import type { NuevoNegocio, EstadoNegocio } from '@prisma/client';
import { NegocioEstadoBadge } from './NegocioEstadoBadge';

/* -------------------------------------------------------------------------- */
/*  Configuración de columnas kanban                                            */
/* -------------------------------------------------------------------------- */

const COLUMNAS: { estado: EstadoNegocio; titulo: string; colorHeader: string }[] = [
  { estado: 'CONFIRMADO',     titulo: 'Confirmado',      colorHeader: 'bg-muted' },
  { estado: 'EN_PREPARACION', titulo: 'En preparación',  colorHeader: 'bg-blue-50 dark:bg-blue-950/30' },
  { estado: 'EN_TRANSITO',    titulo: 'En tránsito',     colorHeader: 'bg-orange-50 dark:bg-orange-950/30' },
  { estado: 'COMPLETADO',     titulo: 'Completado',      colorHeader: 'bg-green-50 dark:bg-green-950/30' },
  { estado: 'CANCELADO',      titulo: 'Cancelado',       colorHeader: 'bg-red-50 dark:bg-red-950/30' },
];

/* -------------------------------------------------------------------------- */
/*  Componente                                                                  */
/* -------------------------------------------------------------------------- */

interface NegocioKanbanProps {
  items: NuevoNegocio[];
}

/**
 * Vista Kanban del listado de negocios.
 * Agrupa los negocios por EstadoNegocio en columnas horizontales.
 * Solo muestra columnas con al menos un negocio (excepto CONFIRMADO y EN_PREPARACION).
 */
export function NegocioKanban({ items }: NegocioKanbanProps) {
  const byEstado = new Map<EstadoNegocio, NuevoNegocio[]>(
    COLUMNAS.map(c => [c.estado, []])
  );
  for (const neg of items) {
    byEstado.get(neg.estado)?.push(neg);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNAS.map(col => {
        const colItems = byEstado.get(col.estado) ?? [];
        return (
          <div key={col.estado} className="flex-shrink-0 w-64">
            {/* Header columna */}
            <div className={`rounded-t-lg px-3 py-2 ${col.colorHeader} border border-border border-b-0`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.titulo}
                </span>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                  {colItems.length}
                </span>
              </div>
            </div>

            {/* Tarjetas */}
            <div className="rounded-b-lg border border-border bg-muted/30 min-h-[120px] space-y-2 p-2">
              {colItems.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">Sin negocios</p>
              )}
              {colItems.map(neg => (
                <Link
                  key={neg.id}
                  href={`/operacional/negocios/${neg.id}`}
                  className="block rounded-md border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <p className="font-mono text-xs font-semibold text-primary">{neg.codigoNegocio}</p>
                  <p className="mt-1 text-sm text-foreground line-clamp-1">
                    {neg.clienteNombre ?? <span className="italic text-muted-foreground">Sin nombre</span>}
                  </p>
                  {neg.fechaDespachoEstimada && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Despacho:{' '}
                      {new Date(neg.fechaDespachoEstimada).toLocaleDateString('es-CO', {
                        day:   'numeric',
                        month: 'short',
                      })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
