import type { HitoSeguimiento } from '@prisma/client';

/** Etiquetas legibles por HitoSeguimiento */
const HITO_LABELS: Record<HitoSeguimiento, string> = {
  NEGOCIO_CONFIRMADO: 'Negocio confirmado',
  REMESAS_ASIGNADAS:  'Remesas asignadas',
  DESPACHADO:         'Despachado',
  EN_RUTA:            'En ruta',
  EN_DESTINO:         'En destino',
  ENTREGADO:          'Entregado',
  NOVEDAD:            'Novedad',
};

export interface HitoItem {
  id: string;
  hito: HitoSeguimiento | string;
  descripcion: string | null;
  createdAt: Date | string;
}

interface NegocioTimelineProps {
  hitos: HitoItem[];
  className?: string;
}

/**
 * Timeline vertical de seguimiento del negocio.
 * Muestra cada hito con su fecha y descripción opcional.
 */
export function NegocioTimeline({ hitos, className }: NegocioTimelineProps) {
  if (hitos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Sin hitos registrados.
      </p>
    );
  }

  return (
    <ol className={`relative border-l border-border ml-3 ${className ?? ''}`}>
      {hitos.map((h, idx) => {
        const label       = HITO_LABELS[h.hito as HitoSeguimiento] ?? h.hito;
        const date        = new Date(h.createdAt);
        const isLast      = idx === hitos.length - 1;

        return (
          <li key={h.id} className="mb-6 ml-6 last:mb-0">
            {/* Dot */}
            <span
              className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${
                isLast ? 'bg-primary' : 'bg-muted border border-border'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isLast ? 'bg-primary-foreground' : 'bg-muted-foreground'}`}
              />
            </span>

            <p className={`text-sm font-medium ${isLast ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </p>
            <time className="text-xs text-muted-foreground">
              {date.toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
            {h.descripcion && (
              <p className="mt-1 text-sm text-muted-foreground">{h.descripcion}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
