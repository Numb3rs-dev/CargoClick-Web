'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RemesaEstadoBadge } from './RemesaEstadoBadge';

interface RemesaEnviarRndcBtnProps {
  remesaId: string;
  estadoRndc: string;
  /** Callback opcional para notificar al padre tras el envío exitoso */
  onSuccess?: () => void;
}

/**
 * Botón para enviar / re-enviar una remesa al RNDC (procesoid 3).
 *
 * - Solo muestra el botón si estadoRndc es PENDIENTE o ERROR (no si ya está REGISTRADA)
 * - Muestra spinner durante el envío
 * - Muestra feedback de error RNDC con syncRndcId para debugging
 * - Idempotente: si ya estaba REGISTRADA no re-envía
 *
 * RNDC: HTTP 200 puede contener error — el servicio siempre verifica ingresoid.
 */
export function RemesaEnviarRndcBtn({ remesaId, estadoRndc, onSuccess }: RemesaEnviarRndcBtnProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rndcError, setRndcError] = useState<{ message: string; syncRndcId?: string } | null>(null);

  // Remesas REGISTRADAS o ANULADAS no necesitan el botón
  if (estadoRndc === 'REGISTRADA' || estadoRndc === 'ANULADA') {
    return <RemesaEstadoBadge estado={estadoRndc} />;
  }

  async function handleEnviar() {
    setLoading(true);
    setRndcError(null);
    try {
      const res = await fetch(`/api/remesas/${remesaId}/enviar-rndc`, {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 502) {
          // Error RNDC — HTTP 200 del Ministerio pero ingresoid=0
          setRndcError({ message: json.message, syncRndcId: json.syncRndcId });
        } else {
          setRndcError({ message: json.message ?? 'Error al enviar al RNDC' });
        }
        return;
      }

      // Éxito: refrescar datos SSR y notificar padre
      router.refresh();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant={estadoRndc === 'ENVIADA' ? 'outline' : 'default'}
        onClick={handleEnviar}
        disabled={loading || estadoRndc === 'ENVIADA'}
      >
        {loading ? (
          <>
            <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Enviando…
          </>
        ) : estadoRndc === 'ENVIADA' ? (
          '🔄 Esperando RNDC…'
        ) : (
          '↑ Enviar al RNDC'
        )}
      </Button>

      {rndcError && (
        <Alert variant="destructive" className="text-xs">
          <AlertDescription>
            <p>{rndcError.message}</p>
            {rndcError.syncRndcId && (
              <p className="font-mono mt-1">ID log: {rndcError.syncRndcId}</p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
