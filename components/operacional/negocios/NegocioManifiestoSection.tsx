import Link from 'next/link';
import type { NuevoNegocioDetalle } from '@/lib/repositories/nuevoNegocioRepository';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

type Manifiesto = NuevoNegocioDetalle['manifiestos'][number];

/** Badge de estado del manifiesto */
function ManifiestoBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; className: string }> = {
    CREADO:      { label: 'Creado',         className: 'bg-muted text-muted-foreground' },
    ENVIADO:     { label: '🔄 Enviando…',   className: 'bg-blue-100 text-blue-700 border-blue-200' },
    REGISTRADO:  { label: '✅ Registrado',  className: 'bg-green-100 text-green-700 border-green-200' },
    DESPACHADO:  { label: '🚚 Despachado',  className: 'bg-orange-100 text-orange-700 border-orange-200' },
    CUMPLIDO:    { label: '✓ Cumplido',     className: 'bg-green-100 text-green-700 border-green-200' },
    ANULADO:     { label: '✗ Anulado',      className: 'bg-red-100 text-red-700 border-red-200' },
  };
  const c = config[estado] ?? { label: estado, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={`text-xs ${c.className}`}>{c.label}</Badge>
  );
}

interface NegocioManifiestoSectionProps {
  negocioId:    string;
  manifiestos:  Manifiesto[];
  readonly?:    boolean;
}

/**
 * Sección de manifiestos dentro del Panel de Negocio.
 * Muestra todos los manifiestos del negocio con estado y enlace a creación.
 */
export function NegocioManifiestoSection({ negocioId, manifiestos, readonly = false }: NegocioManifiestoSectionProps) {
  return (
    <section className="space-y-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Manifiestos{' '}
          <span className="ml-1 text-sm font-normal text-muted-foreground">({manifiestos.length})</span>
        </h2>
        {!readonly && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/operacional/negocios/${negocioId}/manifiestos/nuevo`}>+ Crear manifiesto</Link>
          </Button>
        )}
      </div>

      {manifiestos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin manifiestos creados.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {manifiestos.map(m => (
            <Link
              key={m.id}
              href={`/operacional/negocios/${negocioId}/manifiestos/${m.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">{m.codigoInterno}</p>
                <p className="text-xs text-muted-foreground">
                  {m.vehiculoPlaca} · {m.conductorCedula} ·{' '}
                  {new Date(m.fechaDespacho).toLocaleDateString('es-CO', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
                {m.numeroManifiesto && (
                  <p className="text-xs text-muted-foreground font-mono">
                    MF-RNDC: {m.numeroManifiesto}
                  </p>
                )}
              </div>
              <ManifiestoBadge estado={m.estadoManifiesto} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
