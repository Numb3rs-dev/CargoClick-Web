'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Plus, Send } from 'lucide-react';
import { SeguimientoTimeline } from '@/components/operacional/seguimiento/SeguimientoTimeline';
import { SeguimientoHitoForm } from '@/components/operacional/seguimiento/SeguimientoHitoForm';
import type { NuevoNegocioDetalle } from '@/lib/repositories/nuevoNegocioRepository';

type Seguimiento = NuevoNegocioDetalle['seguimientos'][number];
type Encuesta    = NuevoNegocioDetalle['encuesta'];

interface NegocioSeguimientoSectionProps {
  negocioId: string;
  hitos:     Seguimiento[];
  encuesta:  Encuesta;
  /** Si true, oculta acciones de escritura (negocio COMPLETADO o CANCELADO) */
  readonly?: boolean;
}

/**
 * Sección de seguimiento del cliente dentro del Panel de Negocio.
 *
 * Muestra:
 * - Timeline de hitos en orden cronológico descendente
 * - Botón para registrar nuevo hito (inline)
 * - Sección de encuesta post-entrega con estado y acción de envío
 */
export function NegocioSeguimientoSection({
  negocioId,
  hitos,
  encuesta,
  readonly = false,
}: NegocioSeguimientoSectionProps) {
  const router                          = useRouter();
  const [showForm,      setShowForm]    = useState(false);
  const [sendingEnc,    setSendingEnc]  = useState(false);
  const [encError,      setEncError]    = useState<string | null>(null);

  /** Estado legible de la encuesta */
  const encuestaEstado = !encuesta
    ? 'Sin encuesta'
    : encuesta.respondidoEn
      ? 'Respondida ✓'
      : encuesta.enviadoEn
        ? 'Enviada — pendiente respuesta'
        : 'Pendiente de envío';

  /**
   * Envía el link de encuesta al cliente (crea o reenvía la encuesta).
   * Llama POST /api/negocios/[id]/encuesta.
   */
  async function handleEnviarEncuesta() {
    setSendingEnc(true);
    setEncError(null);
    try {
      const res = await fetch(`/api/negocios/${negocioId}/encuesta`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error al enviar encuesta');
      router.refresh();
    } catch (e) {
      setEncError((e as Error).message);
    } finally {
      setSendingEnc(false);
    }
  }

  return (
    <section className="space-y-4">

      {/* Header con botón de acción */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Seguimiento del cliente</h2>
        {!readonly && !showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Registrar hito
          </Button>
        )}
      </div>

      {/* Formulario inline (renderizado en lugar del botón) */}
      {showForm && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium mb-4">Registrar hito de seguimiento</p>
          <SeguimientoHitoForm
            negocioId={negocioId}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Timeline de hitos */}
      <SeguimientoTimeline hitos={hitos} />

      {/* ------------------------------------------------------------ */}
      {/* Sección encuesta post-entrega                                  */}
      {/* ------------------------------------------------------------ */}
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 mt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Encuesta post-entrega
        </p>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Estado:{' '}
            <span className={encuesta?.respondidoEn ? 'text-green-600 font-medium' : 'font-medium'}>
              {encuestaEstado}
            </span>
          </p>

          {!readonly && !encuesta?.respondidoEn && (
            <Button
              size="sm"
              variant="outline"
              disabled={sendingEnc}
              onClick={handleEnviarEncuesta}
            >
              <Send className="h-4 w-4 mr-1.5" />
              {sendingEnc
                ? 'Enviando...'
                : encuesta?.enviadoEn
                  ? 'Reenviar encuesta'
                  : 'Enviar encuesta al cliente'}
            </Button>
          )}
        </div>

        {encError && (
          <p className="text-xs text-destructive mt-2">{encError}</p>
        )}
      </div>
    </section>
  );
}
