'use client';

import { useRouter } from 'next/navigation';
import { ManifiestoWizard } from '@/components/operacional/manifiestos/ManifiestoWizard';
import type { RemesaItem } from '@/components/operacional/manifiestos/ManifiestoStepRemesas';

interface Props {
  remesasDisponibles: RemesaItem[];
}

/**
 * Wrapper Client Component para el wizard standalone de creación de manifiesto.
 * onClose → /operacional/manifiestos
 * onSuccess → /operacional/manifiestos (por ahora, hasta que exista página de detalle)
 */
export function ManifiestoNuevoStandaloneClient({ remesasDisponibles }: Props) {
  const router = useRouter();

  return (
    <ManifiestoWizard
      remesasDisponibles={remesasDisponibles}
      onClose={() => router.push('/operacional/manifiestos')}
      onSuccess={() => router.push('/operacional/manifiestos')}
    />
  );
}
