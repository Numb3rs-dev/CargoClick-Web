import { Suspense } from 'react';
import Link from 'next/link';
import { ManifiestoDetalle } from '@/components/operacional/manifiestos/ManifiestoDetalle';

export const metadata = { title: 'Manifiesto | Operacional — CargoClick' };

interface Props {
  params: Promise<{ id: string; manifiestoId: string }>;
}

/**
 * Página de detalle de un ManifiestoOperativo.
 * Server Component — delega el fetching y renderizado a ManifiestoDetalle.
 *
 * Muestra conductor, vehículo, remesas incluidas, ruta, fletes
 * y acciones disponibles (cumplir / anular) según el estado.
 */
export default async function ManifiestoDetallePage({ params }: Props) {
  const { id: negocioId, manifiestoId } = await params;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/operacional/negocios" className="hover:text-foreground transition-colors">
          Negocios
        </Link>
        <span>›</span>
        <Link
          href={`/operacional/negocios/${negocioId}`}
          className="font-mono hover:text-foreground transition-colors"
        >
          {negocioId}
        </Link>
        <span>›</span>
        <span className="text-foreground">Manifiesto</span>
      </nav>

      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-32 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
        }
      >
        <ManifiestoDetalle manifiestoId={manifiestoId} negocioId={negocioId} />
      </Suspense>
    </div>
  );
}
