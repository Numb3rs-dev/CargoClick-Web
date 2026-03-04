'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { colors } from '@/lib/theme/colors';

/* ═══════════════════════════════════════════════════════════════════════════════
   MiniSearch — dropdown de búsqueda async reutilizable.
   
   Extraído de OrdenCargueForm para poder usarlo en cualquier formulario que
   necesite un buscador con autocompletado y selección.
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface MiniSearchOption {
  value: string;
  label: string;
  sub?:  string;
}

export interface MiniSearchProps {
  label:        string;
  placeholder:  string;
  /** Texto que se muestra cuando hay una opción seleccionada */
  value:        string;
  onSelect:     (opt: MiniSearchOption) => void;
  onClear:      () => void;
  /** Función async que retorna las opciones dado un query de búsqueda */
  fetchOptions: (q: string) => Promise<MiniSearchOption[]>;
  error?:       string;
  required?:    boolean;
  /** Mínimo de caracteres para disparar la búsqueda (default 2) */
  minChars?:    number;
  /** Delay del debounce en ms (default 270) */
  debounceMs?:  number;
}

export function MiniSearch({
  label,
  placeholder,
  value,
  onSelect,
  onClear,
  fetchOptions,
  error,
  required,
  minChars = 2,
  debounceMs = 270,
}: MiniSearchProps) {
  const [q,    setQ]    = useState('');
  const [opts, setOpts] = useState<MiniSearchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const dq  = useDebounce(q, debounceMs);
  const ref = useRef<HTMLDivElement>(null);

  /* Click fuera → cerrar */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Fetch opciones */
  const load = useCallback(
    async (s: string) => {
      if (s.length < minChars) { setOpts([]); return; }
      setBusy(true);
      try { setOpts(await fetchOptions(s)); } catch { setOpts([]); } finally { setBusy(false); }
    },
    [fetchOptions, minChars],
  );

  useEffect(() => { if (!value) load(dq); }, [dq, value, load]);

  /* Estilos */
  const fieldS: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${error ? colors.error : colors.border}`,
    borderRadius: 8,
    padding: '8px 36px 8px 12px',
    fontSize: 14,
    background: value ? colors.bgLight : colors.bgWhite,
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: colors.textDefault, marginBottom: 4 }}>
        {label}{required && <span style={{ color: colors.error }}> *</span>}
      </label>

      <div style={{ position: 'relative' }}>
        <input
          value={value || q}
          readOnly={!!value}
          onChange={e => { if (!value) { setQ(e.target.value); setOpen(true); } }}
          onFocus={() => { if (!value) setOpen(true); }}
          placeholder={placeholder}
          style={fieldS}
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: colors.textPlaceholder, fontSize: 15,
            }}
          >
            ✕
          </button>
        ) : busy ? (
          <span
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              color: colors.textPlaceholder, fontSize: 12,
            }}
          >
            ⟳
          </span>
        ) : null}
      </div>

      {error && <p style={{ fontSize: 12, color: colors.error, marginTop: 3 }}>{error}</p>}

      {open && !value && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0,
            background: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: 8,
            boxShadow: '0 6px 20px rgba(0,0,0,0.10)', zIndex: 100,
            maxHeight: 220, overflowY: 'auto',
          }}
        >
          {q.length < minChars ? (
            <p style={{ padding: '10px 14px', fontSize: 13, color: colors.textPlaceholder }}>
              Escribe para buscar…
            </p>
          ) : opts.length === 0 && !busy ? (
            <p style={{ padding: '10px 14px', fontSize: 13, color: colors.textPlaceholder }}>
              Sin resultados
            </p>
          ) : (
            opts.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onSelect(o); setQ(''); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', borderBottom: `1px solid ${colors.borderLighter}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = colors.bgLight)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary }}>{o.label}</div>
                {o.sub && <div style={{ fontSize: 12, color: colors.textMuted }}>{o.sub}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
