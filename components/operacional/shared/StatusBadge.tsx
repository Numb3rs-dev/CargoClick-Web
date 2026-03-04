'use client';

import React from 'react';
import { type EstadoConfig, FALLBACK_ESTADO } from '@/lib/constants/estados';

/* ═══════════════════════════════════════════════════════════════════════════════
   StatusBadge — badge genérico para cualquier entidad con estados.
   
   Reemplaza RemesaEstadoBadge, NegocioEstadoBadge, ManifiestoEstadoBadge
   y los badge inline de OrdenCargueList / ConductorList / VehiculoList.
   ═══════════════════════════════════════════════════════════════════════════════ */

interface StatusBadgeProps {
  /** El key del estado (e.g. 'PENDIENTE', 'CONFIRMADO') */
  estado: string;
  /** Record de configuración por clave de estado */
  config: Record<string, EstadoConfig>;
  /** Prefijo emoji opcional (e.g. '⚠️', '✅') — se prepone al label */
  emoji?: string;
}

/**
 * Badge visual reutilizable.
 * 
 * ```tsx
 * <StatusBadge estado={row.estadoRndc} config={ESTADOS_REMESA} />
 * ```
 */
export function StatusBadge({ estado, config, emoji }: StatusBadgeProps) {
  const c = config[estado] ?? { ...FALLBACK_ESTADO, label: estado };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 9999,
        background: c.bg,
        color: c.color,
        border: c.border ? `1px solid ${c.border}` : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {emoji ? `${emoji} ${c.label}` : c.label}
    </span>
  );
}
