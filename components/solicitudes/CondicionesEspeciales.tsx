'use client';

import { useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Condicion {
  key: string;
  icon: string;
  label: string;
  detail?: string | null;
  /** Valor inicial reportado por el cliente */
  activo: boolean;
  /** Valor sugerido por defecto (COP) para orientar al comercial */
  sugerido?: number;
}

interface CondicionesEspecialesProps {
  condiciones: Condicion[];
  /** Cuando true se omite el card shell — para embeberlo dentro de otro card */
  embedded?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v);
}

function parseCOP(raw: string): number {
  const n = Number(raw.replace(/[^\d]/g, ''));
  return isNaN(n) ? 0 : n;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CondicionesEspeciales({ condiciones, embedded = false }: CondicionesEspecialesProps) {
  // Estado local: por clave → { activo, costo }
  const [estado, setEstado] = useState<
    Record<string, { activo: boolean; costo: string }>
  >(() =>
    Object.fromEntries(
      condiciones.map((c) => [c.key, { activo: c.activo, costo: c.activo && c.sugerido ? String(c.sugerido) : '' }]),
    ),
  );

  function toggleActivo(key: string, sugerido?: number) {
    setEstado((prev) => {
      const next = !prev[key].activo;
      return {
        ...prev,
        [key]: {
          activo: next,
          costo: next && sugerido ? String(sugerido) : '',
        },
      };
    });
  }

  function setCosto(key: string, raw: string) {
    // Sólo dígitos
    const digits = raw.replace(/[^\d]/g, '');
    setEstado((prev) => ({ ...prev, [key]: { ...prev[key], costo: digits } }));
  }

  // Total de sobrecostos activos y con costo cargado
  const totalAdicional = condiciones.reduce((sum, c) => {
    const e = estado[c.key];
    return e.activo ? sum + parseCOP(e.costo) : sum;
  }, 0);

  const hayAlguno = condiciones.some((c) => estado[c.key].activo);

  // ── MODO EMBEBIDO ────────────────────────────────────────────
  if (embedded) {
    return (
      <div>
        {/* Encabezado de sección */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ⚠️  Condiciones especiales
          </p>
          {totalAdicional > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46', background: '#D1FAE5', padding: '3px 10px', borderRadius: 9999 }}>
              +{formatCOP(totalAdicional)} adicional
            </span>
          )}
        </div>

        {/* Grid de condiciones */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2px 16px' }}>
          {condiciones.map((c) => {
            return (
              <div key={c.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{c.icon}</span>
                    <div>
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{c.label}</span>
                      {c.detail && <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{c.detail}</p>}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, flexShrink: 0,
                      background: c.activo ? '#FEF3C7' : '#F3F4F6',
                      color: c.activo ? '#92400E' : '#9CA3AF',
                      boxShadow: c.activo ? '0 0 0 1.5px #F59E0B' : '0 0 0 1px #E5E7EB',
                    }}
                  >
                    {c.activo ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {hayAlguno && (
          <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Total sobrecostos:</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: totalAdicional > 0 ? '#065F46' : '#9CA3AF' }}>
              {totalAdicional > 0 ? formatCOP(totalAdicional) : '—'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── MODO CARD STANDALONE ───────────────────────────────────────
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F9FAFB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
            Condiciones Especiales
          </h2>
        </div>
        {totalAdicional > 0 && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#065F46',
              background: '#D1FAE5',
              padding: '4px 12px',
              borderRadius: 9999,
            }}
          >
            +{formatCOP(totalAdicional)} adicional
          </span>
        )}
      </div>

      {/* Lista */}
      <div style={{ padding: '12px 24px' }}>
        {condiciones.map((c) => {
          const e = estado[c.key];
          const costoParsed = parseCOP(e.costo);

          return (
            <div
              key={c.key}
              style={{
                borderBottom: '1px solid #F3F4F6',
                padding: '10px 0',
              }}
            >
              {/* Fila principal: ícono + label + toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                {/* Lado izquierdo */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 15, marginTop: 1 }}>{c.icon}</span>
                  <div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                      {c.label}
                    </span>
                    {c.detail && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
                        {c.detail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Toggle Sí / No */}
                <button
                  type="button"
                  onClick={() => toggleActivo(c.key, c.sugerido)}
                  title={e.activo ? 'Marcar como No' : 'Marcar como Sí'}
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 14px',
                    borderRadius: 9999,
                    transition: 'all 0.15s',
                    background: e.activo ? '#FEF3C7' : '#F3F4F6',
                    color: e.activo ? '#92400E' : '#9CA3AF',
                    boxShadow: e.activo ? '0 0 0 1.5px #F59E0B' : '0 0 0 1px #E5E7EB',
                  }}
                >
                  {e.activo ? 'Sí' : 'No'}
                </button>
              </div>

              {/* Panel de costo — sólo si está activo */}
              {e.activo && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    background: '#FFFBEB',
                    borderRadius: 8,
                    border: '1px dashed #FCD34D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Sugerido */}
                  {c.sugerido && (
                    <button
                      type="button"
                      title="Usar valor sugerido"
                      onClick={() =>
                        setEstado((prev) => ({
                          ...prev,
                          [c.key]: { ...prev[c.key], costo: String(c.sugerido) },
                        }))
                      }
                      style={{
                        cursor: 'pointer',
                        border: '1px solid #FCD34D',
                        background: '#FEF9C3',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        color: '#92400E',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      💡 Sugerido: {formatCOP(c.sugerido)}
                    </button>
                  )}

                  {/* Input de costo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 180 }}>
                    <span style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>Costo adicional:</span>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 13,
                          color: '#9CA3AF',
                          pointerEvents: 'none',
                        }}
                      >
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={e.costo ? Number(e.costo).toLocaleString('es-CO') : ''}
                        onChange={(ev) => setCosto(c.key, ev.target.value)}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '6px 8px 6px 20px',
                          border: '1px solid #E5E7EB',
                          borderRadius: 6,
                          fontSize: 13,
                          color: '#111827',
                          background: '#FFFFFF',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Importe formateado */}
                  {costoParsed > 0 && (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#065F46',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatCOP(costoParsed)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer total */}
      {hayAlguno && (
        <div
          style={{
            padding: '12px 24px',
            borderTop: '2px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: totalAdicional > 0 ? '#F0FDF4' : '#F9FAFB',
          }}
        >
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
            Total sobrecostos por condiciones
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: totalAdicional > 0 ? '#065F46' : '#9CA3AF',
            }}
          >
            {totalAdicional > 0 ? formatCOP(totalAdicional) : '—'}
          </span>
        </div>
      )}
    </div>
  );
}
