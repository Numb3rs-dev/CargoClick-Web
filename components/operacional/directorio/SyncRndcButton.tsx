'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface SyncRndcButtonProps {
  entityType: 'conductor' | 'vehiculo';
  /** Cédula o placa — coincide con el path param de la API */
  entityId: string;
  /** null = nunca sincronizado | true = OK | false = error */
  syncStatus?: boolean | null;
  lastSyncAt?: Date | null;
}

export function SyncRndcButton({
  entityType,
  entityId,
  syncStatus,
  lastSyncAt,
}: SyncRndcButtonProps) {
  const router = useRouter();
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [logId, setLogId]         = useState<string | null>(null);

  const badgeVariant =
    syncStatus === true  ? 'default'     :
    syncStatus === false ? 'destructive' :
    'secondary';

  const badgeText =
    syncStatus === true  ? 'Registrado en RNDC' :
    syncStatus === false ? 'Error RNDC'          :
    'Borrador';

  async function handleSync() {
    setLoading(true);
    setError(null);
    setLogId(null);
    try {
      const url =
        entityType === 'conductor'
          ? `/api/conductores/${entityId}/sync-rndc`
          : `/api/vehiculos/${entityId}/sync-rndc`;

      const res  = await fetch(url, { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 502) {
          setError(`RNDC rechazó: ${json.message} (Log ID: ${json.syncRndcId})`);
          setLogId(json.syncRndcId ?? null);
        } else {
          setError(json.message ?? 'Error desconocido');
        }
        return;
      }

      router.refresh();
    } catch {
      setError('Error de red al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Badge variant={badgeVariant}>{badgeText}</Badge>
        {lastSyncAt && (
          <span className="text-xs text-muted-foreground">
            {new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(
              Math.round((lastSyncAt.getTime() - Date.now()) / 86_400_000),
              'day'
            )}
          </span>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
        {loading ? 'Sincronizando...' : 'Sincronizar con RNDC'}
      </Button>

      {error && (
        <p className="text-xs text-destructive">
          {error}
          {logId && (
            <span className="mt-1 block font-mono text-[10px]">Log ID: {logId}</span>
          )}
        </p>
      )}
    </div>
  );
}
