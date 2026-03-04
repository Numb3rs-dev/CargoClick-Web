import Link from 'next/link';
import type { NuevoNegocioDetalle } from '@/lib/repositories/nuevoNegocioRepository';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

type Remesa = NuevoNegocioDetalle['remesas'][number];

/* Etiquetas e iconos para estado RNDC */
function RndcBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; className: string }> = {
    REGISTRADA: { label: '✅ Registrada RNDC',  className: 'bg-green-100 text-green-700 border-green-200' },
    PENDIENTE:  { label: '⚠️ Pendiente RNDC',   className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    ERROR:      { label: '❌ Error RNDC',        className: 'bg-red-100 text-red-700 border-red-200' },
    ENVIADA:    { label: '🔄 Enviada RNDC',      className: 'bg-blue-100 text-blue-700 border-blue-200' },
  };
  const c = config[estado] ?? { label: estado, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={`text-xs ${c.className}`}>{c.label}</Badge>
  );
}

interface NegocioRemesasSectionProps {
  negocioId:  string;
  remesas:    Remesa[];
  readonly?:  boolean;
}

/**
 * Sección de remesas dentro del Panel de Negocio.
 * Muestra todas las remesas del negocio con estado RNDC y enlace a creación.
 */
export function NegocioRemesasSection({ negocioId, remesas, readonly = false }: NegocioRemesasSectionProps) {
  return (
    <section className="space-y-3">
      {/* Encabezado sección */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Remesas{' '}
          <span className="ml-1 text-sm font-normal text-muted-foreground">({remesas.length})</span>
        </h2>
        {!readonly && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/operacional/negocios/${negocioId}/remesas/nueva`}>+ Nueva remesa</Link>
          </Button>
        )}
      </div>

      {remesas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin remesas registradas.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {remesas.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">{r.numeroRemesa}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.descripcionCarga} · {r.pesoKg} kg · {r.origenMunicipio} → {r.destinoMunicipio}
                </p>
              </div>
              <RndcBadge estado={r.estadoRndc} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
