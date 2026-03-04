'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface ManifiestoAccionesProps {
  manifiestoId: string;
  estado: string;
}

type Accion = 'cumplir' | 'anular';

/**
 * Botones de acción para un ManifiestoOperativo:
 * - Cumplir (procesoid 6 al RNDC)
 * - Anular (procesoid 32 al RNDC — requiere motivo ≥10 chars)
 *
 * Solo se muestran cuando estadoManifiesto === 'REGISTRADO'.
 * Muestra un modal inline de confirmación antes de ejecutar cada acción.
 *
 * RNDC: HTTP 200 puede contener error — el servicio siempre verifica ingresoid.
 */
export function ManifiestoAcciones({ manifiestoId, estado }: ManifiestoAccionesProps) {
  const router = useRouter();
  const [accion, setAccion] = useState<Accion | null>(null);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo manifiestos REGISTRADOS tienen acciones disponibles
  if (estado !== 'REGISTRADO') return null;

  async function ejecutar() {
    if (!accion) return;
    setLoading(true);
    setError(null);

    try {
      const url = `/api/manifiestos/${manifiestoId}/${accion}`;
      const body = accion === 'anular' ? JSON.stringify({ motivoAnulacion: motivo }) : undefined;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.message ?? `Error al ejecutar ${accion}`;
        // Error RNDC — mostrar con syncRndcId si disponible
        setError(json.syncRndcId ? `${msg}\nID log: ${json.syncRndcId}` : msg);
        return;
      }

      setAccion(null);
      setMotivo('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function cancelarConfirm() {
    setAccion(null);
    setMotivo('');
    setError(null);
  }

  const esAnular = accion === 'anular';
  const puedeConfirmar = !loading && (!esAnular || motivo.length >= 10);

  return (
    <>
      {/* ── Botones de acción ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={() => setAccion('cumplir')}>
          ✓ Cumplir manifiesto
        </Button>
        <Button variant="outline" onClick={() => setAccion('anular')}>
          ✗ Anular
        </Button>
      </div>

      {/* ── Modal inline de confirmación ── */}
      {accion !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-semibold">
                {esAnular ? 'Anular manifiesto' : 'Confirmar cumplido'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {esAnular
                  ? 'El manifiesto será anulado en el RNDC (procesoid 32). Las remesas quedarán disponibles para reasignación. Esta acción no se puede deshacer.'
                  : 'Esta acción registrará el cumplido en el RNDC (procesoid 6). No se puede deshacer.'}
              </p>
            </div>

            {esAnular && (
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="motivo-anulacion">
                  Motivo de anulación *{' '}
                  <span className="text-muted-foreground font-normal">(mínimo 10 caracteres)</span>
                </label>
                <Textarea
                  id="motivo-anulacion"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Por ejemplo: Error en datos del conductor asignado…"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{motivo.length}/10 mínimo</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={cancelarConfirm} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={ejecutar}
                disabled={!puedeConfirmar}
                variant={esAnular ? 'outline' : 'default'}
                className={esAnular ? 'border-destructive text-destructive hover:bg-destructive/10' : ''}
              >
                {loading ? (
                  <>
                    <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Procesando…
                  </>
                ) : (
                  'Confirmar'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
