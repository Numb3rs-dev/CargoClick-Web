import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { NegocioEstadoBadge } from './NegocioEstadoBadge';
import { NegocioRemesasSection } from './NegocioRemesasSection';
import { NegocioManifiestoSection } from './NegocioManifiestoSection';
import { NegocioSeguimientoSection } from './NegocioSeguimientoSection';
import { NegocioCancelarButton } from './NegocioCancelarButton';
import type { EstadoNegocio } from '@prisma/client';

const ESTADOS_READONLY: EstadoNegocio[] = ['COMPLETADO', 'CANCELADO'];

function formatFechaDespacho(date: Date | string | null | undefined, estado: EstadoNegocio): {
  texto: string;
  vencida: boolean;
} {
  if (!date) return { texto: '—', vencida: false };
  const d       = new Date(date);
  const vencida = d < new Date() && !ESTADOS_READONLY.includes(estado);
  return {
    texto: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
    vencida,
  };
}

interface NegocioPanelProps {
  id: string;
}

/**
 * Panel principal de detalle de un NuevoNegocio.
 * Server Component — obtiene datos directamente desde el repositorio.
 *
 * Muestra: header (código, cliente, estado), remesas, manifiestos y seguimiento.
 * Negocios en estado COMPLETADO o CANCELADO se muestran en modo sólo lectura.
 */
export async function NegocioPanel({ id }: NegocioPanelProps) {
  const negocio = await nuevoNegocioRepository.findById(id);

  if (!negocio) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">Negocio no encontrado.</p>
      </div>
    );
  }

  const readonly               = ESTADOS_READONLY.includes(negocio.estado);
  const { texto: fechaTexto, vencida } = formatFechaDespacho(negocio.fechaDespachoEstimada, negocio.estado);
  const clienteLabel           = negocio.clienteNombre ?? 'Cliente externo';

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* Header del negocio                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Lado izquierdo: código + cliente */}
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">
            {negocio.codigoNegocio}
          </h1>
          <p className="mt-1 text-muted-foreground">{clienteLabel}</p>
          {negocio.clienteNit && (
            <p className="text-sm text-muted-foreground">NIT: {negocio.clienteNit}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Creado:{' '}
            {new Date(negocio.createdAt).toLocaleDateString('es-CO', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* Lado derecho: estado + despacho + cancelar */}
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <NegocioEstadoBadge estado={negocio.estado} />
          <p className={`text-sm ${vencida ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
            Despacho est.: {fechaTexto}
            {vencida && <span className="ml-1 text-xs">(vencida)</span>}
          </p>
          {!readonly && (
            <NegocioCancelarButton
              negocioId={negocio.id}
              codigoNegocio={negocio.codigoNegocio}
            />
          )}
          {readonly && (
            <p className="text-xs text-muted-foreground italic">Negocio en modo sólo lectura</p>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Notas internas (si existen)                                          */}
      {/* ------------------------------------------------------------------ */}
      {negocio.notas && (
        <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Notas internas
          </p>
          <p className="text-sm whitespace-pre-line">{negocio.notas}</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Remesas                                                               */}
      {/* ------------------------------------------------------------------ */}
      <NegocioRemesasSection
        negocioId={id}
        remesas={negocio.remesas}
        readonly={readonly}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Manifiestos                                                           */}
      {/* ------------------------------------------------------------------ */}
      <NegocioManifiestoSection
        negocioId={id}
        manifiestos={negocio.manifiestos}
        readonly={readonly}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Seguimiento del cliente                                               */}
      {/* ------------------------------------------------------------------ */}
      <NegocioSeguimientoSection
        negocioId={id}
        hitos={negocio.seguimientos}
        encuesta={negocio.encuesta}
        readonly={readonly}
      />
    </div>
  );
}
