'use client';

import { useRouter } from 'next/navigation';
import { ManifiestoWizard } from '@/components/operacional/manifiestos/ManifiestoWizard';
import type { RemesaItem } from '@/components/operacional/manifiestos/ManifiestoStepRemesas';

interface ManifiestoNuevoClientProps {
  negocioId: string;
  remesasDisponibles: RemesaItem[];
}

/**
 * Wrapper Client Component para el wizard de creación de manifiesto.
 * Gestiona la navegación (onClose → negocio, onSuccess → detalle del manifiesto).
 */
export function ManifiestoNuevoClient({ negocioId, remesasDisponibles }: ManifiestoNuevoClientProps) {
  const router = useRouter();

  function handleClose() {
    router.push(`/operacional/negocios/${negocioId}`);
  }

  function handleSuccess(manifiestoId: string) {
    router.push(`/operacional/negocios/${negocioId}/manifiestos/${manifiestoId}`);
  }

  return (
    <ManifiestoWizard
      negocioId={negocioId}
      remesasDisponibles={remesasDisponibles}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
}
