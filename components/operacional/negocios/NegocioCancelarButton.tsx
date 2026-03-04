'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface NegocioCancelarButtonProps {
  negocioId:     string;
  codigoNegocio: string;
}

/**
 * Botón con modal de confirmación para cancelar un negocio.
 * Hace POST /api/negocios/[id]/cancelar y redirige al listado al completar.
 */
export function NegocioCancelarButton({ negocioId, codigoNegocio }: NegocioCancelarButtonProps) {
  const router                  = useRouter();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleCancelar() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/negocios/${negocioId}/cancelar`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? 'Error al cancelar');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      {/* Botón principal */}
      <Button
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={() => setConfirming(true)}
      >
        {loading ? 'Cancelando…' : 'Cancelar negocio'}
      </Button>

      {/* Modal de confirmación inline */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirming(false)}
          />
          {/* Dialog */}
          <div className="relative z-10 mx-4 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <h3 className="text-base font-semibold">¿Cancelar negocio {codigoNegocio}?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta acción cambiará el estado a <strong>CANCELADO</strong>.
              Las remesas y manifiestos existentes quedarán en su estado actual.
              Esta operación no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
              >
                No, volver
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { setConfirming(false); handleCancelar(); }}
              >
                Sí, cancelar negocio
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
