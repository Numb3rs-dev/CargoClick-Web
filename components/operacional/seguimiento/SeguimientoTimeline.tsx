import type { HitoSeguimiento } from '@prisma/client';

/** Etiquetas legibles para cada valor del enum HitoSeguimiento */
const HITO_LABELS: Record<HitoSeguimiento, string> = {
  NEGOCIO_CONFIRMADO: 'Negocio confirmado',
  REMESAS_ASIGNADAS:  'Remesas asignadas',
  DESPACHADO:         'Despachado',
  EN_RUTA:            'En ruta',
  EN_DESTINO:         'En destino',
  ENTREGADO:          'Entregado ✓',
  NOVEDAD:            'Novedad',
};

export interface HitoSeguimientoItem {
  id: string;
  hito: string;
  descripcion: string | null;
  createdAt: Date | string;
}

interface Props {
  hitos: HitoSeguimientoItem[];
}

/**
 * Timeline vertical de hitos de seguimiento al cliente.
 * Muestra los hitos en orden cronológico descendente (el más reciente arriba).
 * Server Component — sin estado, puramente presentacional.
 *
 * @param hitos - Lista de hitos del SeguimientoCliente ordenados por la API
 */
export function SeguimientoTimeline({ hitos }: Props) {
  if (hitos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No hay hitos de seguimiento registrados todavía.
      </p>
    );
  }

  // Ordenar descendente: el más reciente primero
  const sorted = [...hitos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ol className="relative border-l border-border ml-3 space-y-0">
      {sorted.map((hito, idx) => {
        const label   = HITO_LABELS[hito.hito as HitoSeguimiento] ?? hito.hito;
        const date    = new Date(hito.createdAt);
        const isFirst = idx === 0; // El más reciente

        return (
          <li key={hito.id} className="mb-6 ml-6 last:mb-0">
            {/* Dot del timeline */}
            <span
              className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${
                isFirst ? 'bg-primary' : 'bg-muted border border-border'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isFirst ? 'bg-primary-foreground' : 'bg-muted-foreground'
                }`}
              />
            </span>

            {/* Contenido del hito */}
            <p
              className={`text-sm font-medium leading-tight ${
                isFirst ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </p>

            {hito.descripcion && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {hito.descripcion}
              </p>
            )}

            <time className="text-xs text-muted-foreground block mt-0.5">
              {date.toLocaleString('es-CO', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
