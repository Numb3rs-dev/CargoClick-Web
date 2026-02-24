'use client'

/**
 * BaseRndc.tsx
 *
 * Recuadro colapsable que muestra la referencia histórica de mercado
 * calculada por el motor RNDC (manifiestos reales de carga).
 *
 * Props requeridas: campos rndcXxx de la cotización + fleteRef/tarifaSugerida para comparativos.
 */

import React, { useState } from 'react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Manifiesto serializado (fecha como string para Server → Client) */
export interface ViajeItem {
  manifiesto:   string
  fecha:        string  // ISO string
  pesoKg:       number
  fletePactado: number
  placa:        string | null
}

export interface RndcData {
  estimado:        number
  mediana:         number
  promedio:        number
  minimo:          number
  maximo:          number
  p25:             number
  p75:             number
  copPorKg:        number
  confianza:       'ALTA' | 'MEDIA' | 'BAJA'
  nivelFallback:   number
  nivelLabel:      string
  viajesSimilares: number
  viajes:          ViajeItem[]
}

interface BaseRndcProps {
  rndcData:       RndcData | null
  fleteRef:       number
  tarifaSugerida: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(v)

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(iso))

const pct = (a: number, b: number) => (((a - b) / b) * 100).toFixed(1)

const CONFIANZA_CFG = {
  ALTA:  { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Alta' },
  MEDIA: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Media' },
  BAJA:  { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Baja' },
} as const

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function DiffBadge({ rndc, base, label }: { rndc: number; base: number; label: string }) {
  const d = Number(pct(rndc, base))
  const pos = d >= 0
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #F3F4F6' }}>
      <span style={{ fontSize:12, color:'#6B7280' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12, color:'#9CA3AF' }}>{fmt(rndc)}</span>
        <span style={{
          fontSize:12, fontWeight:700,
          color: pos ? '#059669' : '#DC2626',
          background: pos ? '#F0FDF4' : '#FEF2F2',
          padding:'2px 10px', borderRadius:12, minWidth:64, textAlign:'center',
        }}>
          {pos ? '+' : ''}{d}%
        </span>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function BaseRndc({ rndcData, fleteRef, tarifaSugerida }: BaseRndcProps) {
  const [open,       setOpen]       = useState(true)
  const [showViajes, setShowViajes] = useState(false)
  const [page,       setPage]       = useState(1)
  const PAGE_SIZE = 10

  /* ── Sin datos ── */
  if (!rndcData) {
    return (
      <div style={{ background:'#FFFFFF', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', background:'#F9FAFB', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>📊</span>
          <span style={{ fontSize:14, fontWeight:700, color:'#374151', flex:1 }}>Base Mercado RNDC</span>
          <span style={{ fontSize:11, color:'#9CA3AF', background:'#F3F4F6', padding:'3px 10px', borderRadius:12 }}>Sin datos</span>
        </div>
        <div style={{ padding:'20px 24px', textAlign:'center' }}>
          <p style={{ margin:0, fontSize:13, color:'#9CA3AF' }}>
            No se encontraron manifiestos RNDC similares para esta ruta y peso.
          </p>
        </div>
      </div>
    )
  }

  const cfg   = CONFIANZA_CFG[rndcData.confianza] ?? CONFIANZA_CFG['BAJA']
  const rango = rndcData.maximo - rndcData.minimo || 1
  const pctBar = (v: number) => Math.max(0, Math.min(100, ((v - rndcData.minimo) / rango) * 100))

  return (
    <div style={{ background:'#FFFFFF', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden' }}>

      {/* ── Header colapsable ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', padding:'14px 20px', background:'#F9FAFB',
          borderBottom: open ? '1px solid #E5E7EB' : 'none',
          display:'flex', alignItems:'center', gap:8,
          cursor:'pointer', border:'none', textAlign:'left',
        }}
      >
        <span style={{ fontSize:18 }}>📊</span>
        <span style={{ fontSize:14, fontWeight:700, color:'#374151', flex:1 }}>Base Mercado RNDC</span>

        <span style={{ fontSize:11, fontWeight:700, color:cfg.text, background:cfg.bg, padding:'3px 10px', borderRadius:12, display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, display:'inline-block' }} />
          Confianza {cfg.label}
        </span>

        {!open && (
          <span style={{ fontSize:14, fontWeight:800, color:'#1D4ED8', marginLeft:8 }}>
            {fmt(rndcData.estimado)}
          </span>
        )}

        <span style={{ fontSize:12, color:'#9CA3AF', marginLeft:4, display:'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>▼</span>
      </button>

      {/* ── Contenido ── */}
      {open && (
        <div style={{ padding:'16px 24px' }}>

          {/* Chips de metadatos */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            <span style={{ fontSize:11, padding:'4px 10px', borderRadius:10, background:'#EFF6FF', color:'#1D4ED8', fontWeight:600 }}>
              🔍 {rndcData.nivelLabel}
            </span>
            <span style={{ fontSize:11, padding:'4px 10px', borderRadius:10, background:'#F3F4F6', color:'#374151', fontWeight:500 }}>
              {rndcData.viajesSimilares} manifiestos similares
            </span>
          </div>

          {/* ── Estadísticas ── */}
          <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.05em', textTransform:'uppercase' }}>Estadísticas de precio</p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
            {[
              { label:'Estimado (media pond.)', value: fmt(rndcData.estimado),          highlight: true  },
              { label:'Mediana (P50)',           value: fmt(rndcData.mediana),            highlight: false },
              { label:'Promedio simple',         value: fmt(rndcData.promedio),           highlight: false },
              { label:'COP por kg (promedio)',   value: `${fmt(rndcData.copPorKg)}/kg`,  highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{
                padding:'10px 14px', borderRadius:10,
                background: highlight ? '#EFF6FF' : '#F9FAFB',
                border: highlight ? '1px solid #BFDBFE' : '1px solid #F3F4F6',
              }}>
                <p style={{ margin:'0 0 2px', fontSize:11, color: highlight ? '#1E40AF' : '#9CA3AF' }}>{label}</p>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color: highlight ? '#1D4ED8' : '#111827' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Rango de precios visual ── */}
          <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.05em', textTransform:'uppercase' }}>Rango de precios del mercado</p>

          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:11, color:'#6B7280' }}>Mín · {fmt(rndcData.minimo)}</span>
            <span style={{ fontSize:11, color:'#6B7280' }}>Máx · {fmt(rndcData.maximo)}</span>
          </div>

          {/* Barra P25→P75 con marcadores */}
          <div style={{ position:'relative', height:22, marginBottom:4 }}>
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:4, background:'#E5E7EB', borderRadius:2, transform:'translateY(-50%)' }} />
            <div style={{
              position:'absolute', top:'50%', height:10,
              left: `${pctBar(rndcData.p25)}%`,
              width: `${pctBar(rndcData.p75) - pctBar(rndcData.p25)}%`,
              background:'#93C5FD', borderRadius:4, transform:'translateY(-50%)',
            }} />
            {/* marcador P50 */}
            <div style={{ position:'absolute', top:'50%', left:`${pctBar(rndcData.mediana)}%`, width:3, height:16, background:'#2563EB', borderRadius:2, transform:'translate(-50%,-50%)' }} />
            {/* marcador estimado */}
            <div style={{ position:'absolute', top:'50%', left:`${pctBar(rndcData.estimado)}%`, width:12, height:12, background:'#1D4ED8', borderRadius:'50%', border:'2px solid #FFFFFF', transform:'translate(-50%,-50%)', boxShadow:'0 1px 4px rgba(0,0,0,0.25)' }} />
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
            <span style={{ fontSize:11, color:'#6B7280' }}>P25 · {fmt(rndcData.p25)}</span>
            <div style={{ display:'flex', gap:12 }}>
              <span style={{ fontSize:11, color:'#2563EB', fontWeight:600 }}>│ P50 · {fmt(rndcData.mediana)}</span>
              <span style={{ fontSize:11, color:'#1D4ED8', fontWeight:600 }}>● Est. · {fmt(rndcData.estimado)}</span>
            </div>
            <span style={{ fontSize:11, color:'#6B7280' }}>P75 · {fmt(rndcData.p75)}</span>
          </div>

          {/* ── Comparativo vs SISETAC ── */}
          <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.05em', textTransform:'uppercase' }}>Comparativo vs SISETAC</p>
          <DiffBadge label="RNDC vs Piso SISETAC (flete referencial)" rndc={rndcData.estimado} base={fleteRef} />
          <DiffBadge label="RNDC vs Tarifa sugerida final"             rndc={rndcData.estimado} base={tarifaSugerida} />

          {/* ── Manifiestos similares ── */}
          {rndcData.viajes.length > 0 && (() => {
            const totalPages = Math.ceil(rndcData.viajes.length / PAGE_SIZE)
            const pageViajes = rndcData.viajes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            return (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:20, marginBottom:8 }}>
                  <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                    Manifiestos similares ({rndcData.viajes.length} encontrados)
                  </p>
                  <button
                    onClick={() => { setShowViajes(v => !v); setPage(1) }}
                    style={{ fontSize:11, color:'#2563EB', background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:0 }}
                  >
                    {showViajes ? 'Ocultar ▲' : 'Ver detalle ▼'}
                  </button>
                </div>

                {showViajes && (
                  <>
                    <div style={{ overflowX:'auto', borderRadius:8, border:'1px solid #E5E7EB' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                        <thead>
                          <tr style={{ background:'#F9FAFB' }}>
                            {['Manifiesto','Fecha','Peso (kg)','Flete pactado','Placa'].map(col => (
                              <th key={col} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, color:'#6B7280', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap', fontSize:11 }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageViajes.map((v, i) => (
                            <tr key={v.manifiesto} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                              <td style={{ padding:'8px 12px', color:'#374151', fontWeight:500, fontFamily:'monospace', fontSize:11 }}>{v.manifiesto}</td>
                              <td style={{ padding:'8px 12px', color:'#6B7280', whiteSpace:'nowrap' }}>{fmtDate(v.fecha)}</td>
                              <td style={{ padding:'8px 12px', color:'#374151', textAlign:'right' }}>{v.pesoKg.toLocaleString('es-CO')}</td>
                              <td style={{ padding:'8px 12px', color:'#111827', fontWeight:700, textAlign:'right' }}>{fmt(v.fletePactado)}</td>
                              <td style={{ padding:'8px 12px', color:'#6B7280', fontFamily:'monospace', fontSize:11 }}>{v.placa ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, padding:'6px 4px' }}>
                      <span style={{ fontSize:11, color:'#6B7280' }}>
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rndcData.viajes.length)} de {rndcData.viajes.length}
                      </span>
                      <div style={{ display:'flex', gap:6 }}>
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          style={{
                            padding:'4px 12px', borderRadius:6, border:'1px solid #E5E7EB',
                            background: page === 1 ? '#F9FAFB' : '#FFFFFF',
                            color: page === 1 ? '#D1D5DB' : '#374151',
                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                            fontSize:12, fontWeight:600,
                          }}
                        >‹ Ant.</button>

                        {/* Numéricos */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(n => Math.abs(n - page) <= 2)
                          .map(n => (
                            <button
                              key={n}
                              onClick={() => setPage(n)}
                              style={{
                                padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:700,
                                border: n === page ? 'none' : '1px solid #E5E7EB',
                                background: n === page ? '#2563EB' : '#FFFFFF',
                                color: n === page ? '#FFFFFF' : '#374151',
                                cursor: 'pointer', minWidth:32,
                              }}
                            >{n}</button>
                          ))
                        }

                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          style={{
                            padding:'4px 12px', borderRadius:6, border:'1px solid #E5E7EB',
                            background: page === totalPages ? '#F9FAFB' : '#FFFFFF',
                            color: page === totalPages ? '#D1D5DB' : '#374151',
                            cursor: page === totalPages ? 'not-allowed' : 'pointer',
                            fontSize:12, fontWeight:600,
                          }}
                        >Sig. ›</button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )
          })()}

          {/* Nota */}
          <div style={{ marginTop:16, padding:'10px 14px', background:'#EFF6FF', borderRadius:8, borderLeft:'3px solid #3B82F6' }}>
            <p style={{ margin:0, fontSize:11, color:'#1E40AF', lineHeight:1.5 }}>
              ℹ️ Datos del Registro Nacional de Despacho de Carga (RNDC). Representan
              fletes reales pactados para rutas y pesos similares. Complementan el piso
              regulatorio SISETAC con referencias reales de mercado.
            </p>
          </div>

        </div>
      )}
    </div>
  )
}
