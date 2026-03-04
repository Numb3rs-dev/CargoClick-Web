import type { EstadoNegocio } from '@prisma/client';
import { StatusBadge } from '@/components/operacional/shared/StatusBadge';
import { ESTADOS_NEGOCIO } from '@/lib/constants';

/**
 * Badge reutilizable para el estado de un NuevoNegocio.
 * Delega al StatusBadge genérico con la config de ESTADOS_NEGOCIO.
 */
export function NegocioEstadoBadge({ estado }: { estado: EstadoNegocio }) {
  return <StatusBadge estado={estado} config={ESTADOS_NEGOCIO} />;
}
