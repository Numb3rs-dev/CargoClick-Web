'use client';

import { ESTADOS_REMESA, FALLBACK_ESTADO, type EstadoConfig } from '@/lib/constants/estados';

const EMOJIS: Record<string, string> = {
  PENDIENTE:  '⚠️',
  ENVIADA:    '🔄',
  REGISTRADA: '✅',
  ANULADA:    '✗',
};

/**
 * Badge visual del estado RNDC de una remesa.
 * Usa colores de ESTADOS_REMESA + emojis locales.
 */
export function RemesaEstadoBadge({ estado }: { estado: string }) {
  const c: EstadoConfig = ESTADOS_REMESA[estado] ?? { ...FALLBACK_ESTADO, label: estado };
  const emoji = EMOJIS[estado] ?? '';
  return (
    <span style={{
      display: 'inline-block', fontSize: 12, fontWeight: 600,
      padding: '3px 10px', borderRadius: 9999,
      background: c.bg, color: c.color,
      border: c.border ? `1px solid ${c.border}` : undefined,
      whiteSpace: 'nowrap',
    }}>
      {emoji ? `${emoji} ${c.label}` : c.label}
    </span>
  );
}
