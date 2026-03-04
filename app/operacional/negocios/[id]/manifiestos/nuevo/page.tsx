import Link from 'next/link';
import { notFound } from 'next/navigation';
import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { ManifiestoNuevoClient } from './ManifiestoNuevoClient';
import type { RemesaItem } from '@/components/operacional/manifiestos/ManifiestoStepRemesas';

export const metadata = { title: 'Crear Manifiesto | Operacional — CargoClick' };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Página para crear un nuevo ManifiestoOperativo via el wizard de 2 pasos.
 * Server Component — obtiene las remesas del negocio y las pasa al wizard.
 *
 * Solo se muestran remesas con estadoRndc=REGISTRADA sin manifiesto (disponibles).
 * Tras completar el wizard, redirige al detalle del manifiesto creado.
 */
export default async function ManifiestoNuevoPage({ params }: Props) {
  const { id: negocioId } = await params;

  const negocio = await nuevoNegocioRepository.findById(negocioId);
  if (!negocio) notFound();

  // Transformar al tipo que espera el wizard
  const remesasDisponibles: RemesaItem[] = negocio.remesas
    .filter(r => r.estadoRndc === 'REGISTRADA' && !r.manifiestoOperativoId)
    .map(r => ({
      id:                   r.id,
      numeroRemesa:         r.numeroRemesa,
      descripcionCarga:     r.descripcionCarga,
      pesoKg:               r.pesoKg,
      origenMunicipio:      r.origenMunicipio,
      destinoMunicipio:     r.destinoMunicipio,
      estadoRndc:           r.estadoRndc,
      manifiestoOperativoId: r.manifiestoOperativoId,
    }));

  const clienteLabel = negocio.clienteNombre ?? 'Cliente externo';

  return (
    <div className="max-w-2xl space-y-6">
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
          {negocio.codigoNegocio}
        </Link>
        <span>›</span>
        <span className="text-foreground">Crear manifiesto</span>
      </nav>

      {/* Título */}
      <div>
        <h1 className="text-2xl font-semibold">Crear Manifiesto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {clienteLabel} — {negocio.codigoNegocio}
        </p>
        {remesasDisponibles.length === 0 && (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
            ⚠️ No hay remesas registradas en el RNDC disponibles para este negocio.
            Primero envía las remesas al RNDC desde el{' '}
            <Link href={`/operacional/negocios/${negocioId}`} className="underline">
              panel del negocio
            </Link>
            .
          </p>
        )}
      </div>

      {/* Wizard */}
      <ManifiestoNuevoClient
        negocioId={negocioId}
        remesasDisponibles={remesasDisponibles}
      />
    </div>
  );
}
