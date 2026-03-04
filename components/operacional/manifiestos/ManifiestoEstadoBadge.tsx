import { StatusBadge } from '@/components/operacional/shared/StatusBadge';
import { ESTADOS_MANIFIESTO } from '@/lib/constants';

/**
 * Badge visual del estado de un ManifiestoOperativo.
 * Delega al StatusBadge genérico con la config de ESTADOS_MANIFIESTO.
 */
export function ManifiestoEstadoBadge({ estado }: { estado: string }) {
  return <StatusBadge estado={estado} config={ESTADOS_MANIFIESTO} />;
}
