'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme/colors';

const fieldStyle: React.CSSProperties = {
  width: '100%', border: `1px solid ${colors.border}`, borderRadius: 8,
  padding: '8px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none',
  background: colors.bgWhite,
};

interface Solicitud {
  id:               string;
  codigoSolicitud?: string;
  contactoNombre?:  string;
  origenMunicipio?: string;
  destinoMunicipio?: string;
}

interface NegocioDesdeComercialProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function NegocioDesdeComercial({ onBack, onSuccess }: NegocioDesdeComercialProps) {
  const router                            = useRouter();
  const [q, setQ]                         = useState('');
  const [resultados, setResultados]       = useState<Solicitud[]>([]);
  const [cargando, setCargando]           = useState(false);
  const [seleccionada, setSeleccionada]   = useState<Solicitud | null>(null);
  const [guardando, setGuardando]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (q.length < 2) { setResultados([]); return; }
    timerRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const res  = await fetch(`/api/solicitudes?estado=APROBADA&q=${encodeURIComponent(q)}&pageSize=20`);
        const json = await res.json();
        setResultados(json.data ?? []);
      } catch { setResultados([]); }
      finally { setCargando(false); }
    }, 350);
  }, [q]);

  async function handleCrear() {
    if (!seleccionada) return;
    setGuardando(true); setError(null);
    try {
      const res  = await fetch('/api/negocios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: seleccionada.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? 'Error al crear negocio');
      if (onSuccess) { onSuccess(); }
      else { router.push(`/operacional/negocios/${json.data.id}`); }
    } catch (e) { setError((e as Error).message); }
    finally { setGuardando(false); }
  }

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={onBack}
          style={{ padding: '6px 12px', fontSize: 13, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.bgWhite, color: colors.textDefault, cursor: 'pointer' }}>
          ← Atrás
        </button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.textPrimary }}>Desde solicitud aprobada</h2>
          <p style={{ fontSize: 13, color: colors.textMuted }}>Ruta A — ciclo comercial</p>
        </div>
      </div>

      {/* Buscador */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: colors.textDefault, marginBottom: 4 }}>
          Buscar solicitud aprobada
        </label>
        <input
          placeholder="Código, cliente o municipio…"
          value={q}
          onChange={e => { setQ(e.target.value); setSeleccionada(null); }}
          style={fieldStyle}
        />
      </div>

      {/* Resultados */}
      {cargando && <p style={{ fontSize: 13, color: colors.textMuted }}>Buscando…</p>}

      {!cargando && resultados.length === 0 && q.length >= 2 && (
        <p style={{ fontSize: 13, color: colors.textMuted }}>No se encontraron solicitudes aprobadas con ese criterio.</p>
      )}

      {resultados.length > 0 && (
        <ul style={{ border: `1px solid ${colors.borderLight}`, borderRadius: 8, overflow: 'hidden', listStyle: 'none', margin: 0, padding: 0 }}>
          {resultados.map(s => (
            <li
              key={s.id}
              onClick={() => setSeleccionada(s)}
              style={{
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: `1px solid ${colors.borderLight}`,
                background: seleccionada?.id === s.id ? colors.primaryBg : colors.bgWhite,
                borderLeft: seleccionada?.id === s.id ? `3px solid ${colors.primary}` : '3px solid transparent',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: colors.textPrimary }}>
                {s.codigoSolicitud ?? s.id.slice(0, 8)}
              </p>
              <p style={{ fontSize: 13, color: colors.textMuted }}>{s.contactoNombre ?? 'Sin nombre'}</p>
              {s.origenMunicipio && s.destinoMunicipio && (
                <p style={{ fontSize: 12, color: colors.textPlaceholder }}>{s.origenMunicipio} → {s.destinoMunicipio}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Error */}
      {error && <p style={{ fontSize: 13, color: colors.error }}>{error}</p>}

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
        <button type="button" onClick={onBack}
          style={{ padding: '9px 18px', fontSize: 14, fontWeight: 500, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.bgWhite, color: colors.textDefault, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="button" disabled={!seleccionada || guardando} onClick={handleCrear}
          style={{
            padding: '9px 22px', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 8,
            background: (!seleccionada || guardando) ? colors.disabledBtn : colors.primary, color: colors.bgWhite,
            cursor: (!seleccionada || guardando) ? 'not-allowed' : 'pointer',
          }}>
          {guardando ? 'Creando…' : 'Crear negocio →'}
        </button>
      </div>
    </div>
  );
}
