'use client';

import { useState, useEffect } from 'react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CiudadOption {
  ciudad: string;
  dept: string;
  label: string;
}

interface RutaTop {
  origen: string;
  destino: string;
  viajes: number;
}

interface ViajeHistorico {
  manifiesto: string;
  fecha: string;
  pesoKg: number;
  fletePactado: number;
  placa: string | null;
}

interface ResultadoHistorico {
  ok: boolean;
  origen: string;
  destino: string;
  pesoKgConsultado: number;
  estimado: number;
  mediana: number;
  promedio: number;
  minimo: number;
  maximo: number;
  p25: number;
  p75: number;
  copPorKg: number;
  confianza: 'ALTA' | 'MEDIA' | 'BAJA';
  nivelFallback: number;
  nivelLabel: string;
  viajesSimilares: number;
  viajes: ViajeHistorico[];
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const fmtN = (n: number) =>
  new Intl.NumberFormat('es-CO').format(n);

const CONF_COLOR: Record<string, string> = {
  ALTA:  '#16A34A',
  MEDIA: '#D97706',
  BAJA:  '#DC2626',
};

const CONF_BG: Record<string, string> = {
  ALTA:  '#F0FDF4',
  MEDIA: '#FFFBEB',
  BAJA:  '#FEF2F2',
};

const NIVEL_ICONS: Record<number, string> = {
  1: '🎯',
  2: '🗺️',
  3: '🌎',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function CotizadorHistoricoPage() {
  const [origenes, setOrigenes]   = useState<CiudadOption[]>([]);
  const [destinos, setDestinos]   = useState<CiudadOption[]>([]);
  const [rutasTop, setRutasTop]   = useState<RutaTop[]>([]);
  const [loadingListas, setLoadingListas] = useState(true);

  const [origen,  setOrigen]  = useState('');
  const [destino, setDestino] = useState('');
  const [pesoKg,  setPesoKg]  = useState<string>('500');

  const [loading,   setLoading]   = useState(false);
  const [resultado, setResultado] = useState<ResultadoHistorico | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  // Cargar listas al montar
  useEffect(() => {
    Promise.all([
      fetch('/api/cotizar/historico?tipo=origenes').then(r => r.json()),
      fetch('/api/cotizar/historico?tipo=destinos').then(r => r.json()),
      fetch('/api/cotizar/historico?tipo=rutas').then(r => r.json()),
    ]).then(([o, d, r]) => {
      setOrigenes(o.data ?? []);
      setDestinos(d.data ?? []);
      setRutasTop(r.data ?? []);
    }).finally(() => setLoadingListas(false));
  }, []);

  const handleConsultar = async () => {
    if (!origen || !destino || !pesoKg) return;
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch('/api/cotizar/historico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origen: origen.toUpperCase(), destino: destino.toUpperCase(), pesoKg: Number(pesoKg) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al consultar');
      } else {
        setResultado(data);
      }
    } catch (e) {
      setError('Error de red al consultar');
    } finally {
      setLoading(false);
    }
  };

  const usarRuta = (ruta: RutaTop) => {
    setOrigen(ruta.origen);
    setDestino(ruta.destino);
    setResultado(null);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <a href="/cotizar" style={{ color: '#6B7280', fontSize: 14, textDecoration: 'none' }}>
            ← Cotizador SISETAC
          </a>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={{ color: '#6B7280', fontSize: 14 }}>Histórico RNDC</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#111827' }}>
          Cotizador Histórico RNDC
        </h1>
        <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 15 }}>
          Consulta cuánto cobró el mercado real por rutas similares, basado en manifiestos registrados en el RNDC.
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <span style={{ fontSize: 13, background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 20 }}>
            📋 1,156 manifiestos
          </span>
          <span style={{ fontSize: 13, background: '#F0FDF4', color: '#16A34A', padding: '4px 10px', borderRadius: 20 }}>
            🗺️ 255 rutas únicas
          </span>
          <span style={{ fontSize: 13, background: '#FFF7ED', color: '#C2410C', padding: '4px 10px', borderRadius: 20 }}>
            📅 Mar–Dic 2025
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>

        {/* ── Panel izquierdo: formulario + rutas top */}
        <div>
          {/* Formulario */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#374151' }}>Consultar ruta</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Ciudad de origen
              </label>
              <input
                list="list-origenes"
                value={origen}
                onChange={e => setOrigen(e.target.value)}
                placeholder="Ej: BOGOTA, COTA, MEDELLIN"
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
                  borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <datalist id="list-origenes">
                {origenes.map(o => (
                  <option key={o.label} value={o.ciudad}>{o.label}</option>
                ))}
              </datalist>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Ciudad de destino
              </label>
              <input
                list="list-destinos"
                value={destino}
                onChange={e => setDestino(e.target.value)}
                placeholder="Ej: MEDELLIN, CALI, BARRANQUILLA"
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
                  borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
                }}
              />
              <datalist id="list-destinos">
                {destinos.map(d => (
                  <option key={d.label} value={d.ciudad}>{d.label}</option>
                ))}
              </datalist>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Peso de la carga (kg)
              </label>
              <input
                type="number"
                value={pesoKg}
                onChange={e => setPesoKg(e.target.value)}
                min={1}
                placeholder="Ej: 500"
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
                  borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleConsultar}
              disabled={loading || !origen || !destino || !pesoKg}
              style={{
                width: '100%', padding: '12px', background: loading ? '#93C5FD' : '#2563EB',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 15,
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? '⏳ Consultando...' : '🔍 Consultar histórico'}
            </button>

            {error && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#FEF2F2', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Rutas más frecuentes */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
              🔥 Rutas más frecuentes
            </h3>
            {loadingListas ? (
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>Cargando...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rutasTop.slice(0, 8).map((r, i) => (
                  <button
                    key={i}
                    onClick={() => usarRuta(r)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB',
                      borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontSize: 13,
                    }}
                  >
                    <span style={{ color: '#374151' }}>{r.origen} → {r.destino}</span>
                    <span style={{ color: '#6B7280', fontSize: 12 }}>{r.viajes} viajes</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Panel derecho: resultado */}
        <div>
          {!resultado && !loading && (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', color: '#9CA3AF', border: '2px dashed #E5E7EB',
              borderRadius: 12, padding: 40,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Selecciona origen, destino y peso</p>
              <p style={{ margin: '8px 0 0', fontSize: 14 }}>
                o elige una ruta frecuente para ver el análisis histórico
              </p>
            </div>
          )}

          {resultado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── Badge de confianza + nivel */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: CONF_BG[resultado.confianza],
                border: `1px solid ${CONF_COLOR[resultado.confianza]}30`,
                borderRadius: 10,
              }}>
                <div>
                  <span style={{ fontSize: 13, color: '#374151' }}>
                    {NIVEL_ICONS[resultado.nivelFallback]} Basado en <strong>{resultado.nivelLabel}</strong>
                  </span>
                  <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 12 }}>
                    {resultado.viajesSimilares} viajes similares
                  </span>
                </div>
                <span style={{
                  background: CONF_COLOR[resultado.confianza], color: '#fff',
                  padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                }}>
                  Confianza {resultado.confianza}
                </span>
              </div>

              {/* ── Tarifa estimada principal */}
              <div style={{
                background: '#1E3A5F', color: '#fff', borderRadius: 12, padding: '24px 28px',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.7 }}>
                  Flete estimado para {fmtN(resultado.pesoKgConsultado)} kg
                </p>
                <p style={{ margin: '0 0 4px', fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>
                  {fmt(resultado.estimado)}
                </p>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
                  {resultado.origen} → {resultado.destino} · {fmt(resultado.copPorKg)} / kg
                </p>
              </div>

              {/* ── Rango P25-P75 */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Rango de precios del mercado
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Mínimo',   val: resultado.minimo,   sub: '' },
                    { label: 'P25',      val: resultado.p25,      sub: '25% de viajes' },
                    { label: 'Mediana',  val: resultado.mediana,  sub: '50% de viajes' },
                    { label: 'P75',      val: resultado.p75,      sub: '75% de viajes' },
                  ].map(({ label, val, sub }) => (
                    <div
                      key={label}
                      style={{ textAlign: 'center', padding: '12px 8px', background: '#F9FAFB', borderRadius: 8 }}
                    >
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9CA3AF' }}>{label}</p>
                      <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#1E3A5F' }}>
                        {fmt(val)}
                      </p>
                      {sub && <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{sub}</p>}
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 12, display: 'flex', justifyContent: 'space-between',
                  padding: '8px 12px', background: '#EFF6FF', borderRadius: 8, fontSize: 13,
                }}>
                  <span style={{ color: '#374151' }}>Promedio histórico:</span>
                  <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{fmt(resultado.promedio)}</span>
                </div>
              </div>

              {/* ── Info adicional */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20,
              }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9CA3AF' }}>Precio máximo registrado</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#374151' }}>{fmt(resultado.maximo)}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9CA3AF' }}>Costo por kilogramo</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#374151' }}>{fmt(resultado.copPorKg)}</p>
                </div>
              </div>

              {/* ── Muestra de viajes */}
              {resultado.viajes.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                  <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    Últimos viajes similares
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        {['Manifiesto', 'Fecha', 'Peso (kg)', 'Flete', 'Placa'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#6B7280', fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.viajes.map((v, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '8px', color: '#374151', fontWeight: 500 }}>{v.manifiesto}</td>
                          <td style={{ padding: '8px', color: '#6B7280' }}>
                            {new Date(v.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '8px', color: '#374151' }}>{fmtN(v.pesoKg)}</td>
                          <td style={{ padding: '8px', color: '#1D4ED8', fontWeight: 600 }}>{fmt(v.fletePactado)}</td>
                          <td style={{ padding: '8px', color: '#6B7280' }}>{v.placa ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Disclaimer */}
              <div style={{
                padding: '12px 16px', background: '#FFFBEB', borderRadius: 8, fontSize: 12,
                color: '#92400E', border: '1px solid #FDE68A',
              }}>
                <strong>⚠️ Nota:</strong> Estos valores son lo que los transportadores cobraron a Nuevo Mundo, no la tarifa final al cliente.
                Úsalos como referencia de mercado junto con el piso SISETAC para construir tu propuesta comercial.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
