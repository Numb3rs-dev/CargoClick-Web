'use client';

import { useState, Fragment } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DesgloseCv {
  combustible: number; peajes: number; llantas: number; lubricantes: number;
  filtros: number; lavadoEngrase: number; mantenimiento: number; imprevistos: number; total: number;
}
interface DesgloseCf {
  capital: number; salarios: number; seguros: number; impuestos: number;
  parqueadero: number; comunicaciones: number; rtm: number;
  totalMes: number; viajesMes: number; porViaje: number;
}
interface ParamsUsados {
  periodoParams: number; acpmCopGal: number; smlmv: number; interesMensualBr: number;
  valorVehiculoCop: number; velocidadPromKmH: number; viajesMesSimulados: number;
  distribucionTerreno: { plano: number; ondulado: number; montanoso: number };
  fuenteTerreno: string; fuentePeajes: string; metodologia: string;
}

export interface DesgloseSisetacProps {
  desgloseCv:    DesgloseCv;
  desgloseCf:    DesgloseCf;
  cvTotal:       number;
  cfViaje:       number;
  fleteRef:      number;
  tarifaSugerida: number;
  margen:        number;
  distanciaKm:   number;
  configVehiculo: string;
  params_:       ParamsUsados | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ColapsableSection({
  icon, title, total, totalLabel, highlight = false, noTotal = false, children,
}: {
  icon: string; title: string; total: number; totalLabel: string;
  highlight?: boolean; noTotal?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Cabecera — siempre visible, clicable */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', cursor: 'pointer', border: 'none', outline: 'none',
          background: open ? '#F9FAFB' : '#FFFFFF', textAlign: 'left', gap: 12,
          borderBottom: open ? '1px solid #F3F4F6' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 17 }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Total siempre visible */}
          {!noTotal && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{totalLabel}</p>
              <p style={{
                margin: 0, fontSize: 15, fontWeight: 800,
                color: highlight ? '#065F46' : '#111827',
              }}>
                {fmt(total)}
              </p>
            </div>
          )}
          {noTotal && (
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{totalLabel}</span>
          )}
          {/* Chevron */}
          <span style={{
            fontSize: 12, color: '#6B7280', transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}>▾</span>
        </div>
      </button>

      {/* Cuerpo colapsable */}
      {open && (
        <div style={{ padding: '16px 20px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MRow({ label, value, note, bold }: { label: string; value: number; note?: string; bold?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '7px 0', borderBottom: '1px solid #F9FAFB', gap: 8,
    }}>
      <div>
        <span style={{ fontSize: 13, color: bold ? '#111827' : '#374151', fontWeight: bold ? 700 : 400 }}>{label}</span>
        {note && <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{note}</p>}
      </div>
      <span style={{ fontSize: 13, fontWeight: bold ? 800 : 600, color: bold ? '#065F46' : '#111827', whiteSpace: 'nowrap' }}>
        {fmt(value)}
      </span>
    </div>
  );
}

function IRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 16, padding: '7px 0', borderBottom: '1px solid #F9FAFB',
    }}>
      <span style={{ fontSize: 13, color: '#6B7280', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DesgloseSisetac({
  desgloseCv, desgloseCf, cvTotal, cfViaje, fleteRef,
  tarifaSugerida, margen, distanciaKm, configVehiculo, params_,
}: DesgloseSisetacProps) {
  const [cardOpen, setCardOpen] = useState(true);

  // Cálculos cascada
  const costoTecnico   = cvTotal + cfViaje;
  const gastoAdmin     = Math.round(costoTecnico * 0.05);
  const subtotalAdmin  = costoTecnico + gastoAdmin;
  const absorbidosOC   = Math.round(fleteRef - subtotalAdmin);
  const pctAbsorbidos  = ((absorbidosOC / fleteRef) * 100).toFixed(2);
  const margenValor    = Math.round(fleteRef * margen / 100);
  const tarifaBruta    = fleteRef + margenValor;
  const ajusteRedondeo = tarifaSugerida - tarifaBruta;

  return (
    <div style={{ marginTop: 32 }}>
      {/* ── Card contenedor blanco ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}>
        {/* Cabecera del card — clicable */}
        <button
          type="button"
          onClick={() => setCardOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', cursor: 'pointer', border: 'none', outline: 'none',
            background: '#F9FAFB', borderBottom: cardOpen ? '1px solid #F3F4F6' : 'none',
            textAlign: 'left', gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Gastos del viaje según SISETAC</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!cardOpen && (
              <span style={{ fontSize: 15, fontWeight: 700, color: '#065F46' }}>{fmt(fleteRef)}</span>
            )}
            <span style={{
              fontSize: 13, color: '#9CA3AF', display: 'inline-block',
              transition: 'transform 0.2s',
              transform: cardOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>▾</span>
          </div>
        </button>

        {/* Paneles colapsables */}
        {cardOpen && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Costos Variables ── */}
        <ColapsableSection
          icon="⛽" title="Costos Variables"
          total={desgloseCv.total} totalLabel="Total CV por viaje"
        >
          <MRow label="Combustible ACPM"   value={desgloseCv.combustible} />
          <MRow label="Peajes"             value={desgloseCv.peajes} />
          <MRow label="Llantas"            value={desgloseCv.llantas} />
          <MRow label="Lubricantes"        value={desgloseCv.lubricantes} />
          <MRow label="Filtros"            value={desgloseCv.filtros} />
          <MRow label="Lavado y engrase"   value={desgloseCv.lavadoEngrase} />
          <MRow label="Mantenimiento"      value={desgloseCv.mantenimiento} />
          <MRow label="Imprevistos (7.5%)" value={desgloseCv.imprevistos} />
          <div style={{ borderTop: '2px solid #E5E7EB', marginTop: 8, paddingTop: 8 }}>
            <MRow label="Total CV" value={desgloseCv.total} bold />
          </div>
        </ColapsableSection>

        {/* ── Costos Fijos ── */}
        <ColapsableSection
          icon="🏢" title="Costos Fijos"
          total={desgloseCf.porViaje} totalLabel="CF por viaje"
        >
          <MRow label="Capital (amortización)"    value={desgloseCf.capital} />
          <MRow label="Salarios y prestaciones"   value={desgloseCf.salarios} />
          <MRow label="Seguros"                   value={desgloseCf.seguros} />
          <MRow label="Impuestos vehículo"         value={desgloseCf.impuestos} />
          <MRow label="Parqueadero"               value={desgloseCf.parqueadero} />
          <MRow label="Comunicaciones"            value={desgloseCf.comunicaciones} />
          <MRow label="RTM / Revisión"            value={desgloseCf.rtm} />
          <div style={{ borderTop: '1px dashed #E5E7EB', margin: '8px 0', paddingTop: 8 }}>
            <IRow label="Total mensual CF"      value={<strong>{fmt(desgloseCf.totalMes)}</strong>} />
            <IRow label="Viajes/mes estimados"  value={`${desgloseCf.viajesMes} viajes`} />
          </div>
          <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: 8 }}>
            <MRow label="CF por viaje" value={desgloseCf.porViaje} bold />
          </div>
        </ColapsableSection>

        {/* ── Costos Técnicos ── */}
        <ColapsableSection
          icon="📐" title="Costos Técnicos"
          total={gastoAdmin + absorbidosOC} totalLabel="Total costos técnicos"
        >
          <MRow label="Administración (5%)"           value={gastoAdmin}                         note="Res. SISETAC 20213040034405" />
          <MRow label="Seguridad social conductor"    value={Math.round(fleteRef * 0.194552)}    note="19.46% s/ flete referencial" />
          <MRow label="ICA"                           value={Math.round(fleteRef * 0.008)}       note="0.80% s/ flete referencial" />
          <MRow label="Retención en la fuente"        value={Math.round(fleteRef * 0.012)}       note="1.20% s/ flete referencial" />
          <div style={{ borderTop: '2px solid #E5E7EB', marginTop: 8, paddingTop: 8 }}>
            <MRow label="Total costos técnicos" value={gastoAdmin + absorbidosOC} bold />
          </div>
        </ColapsableSection>

        {/* ── Parámetros ── */}
        {params_ && (
          <ColapsableSection
            icon="🔬" title="Parámetros utilizados"
            total={0} totalLabel={`Período ${params_.periodoParams}`}
            noTotal
          >
            <IRow label="Período base"          value={String(params_.periodoParams)} />
            <IRow label="ACPM"                  value={`${fmt(params_.acpmCopGal)} / galón`} />
            <IRow label="SMLMV"                 value={fmt(params_.smlmv)} />
            <IRow label="Interés mensual (BR)"  value={`${(params_.interesMensualBr * 100).toFixed(2)}%`} />
            <IRow label="Valor vehículo"         value={fmt(params_.valorVehiculoCop)} />
            <IRow label="Velocidad promedio"    value={`${params_.velocidadPromKmH.toFixed(1)} km/h`} />
            <IRow label="Viajes/mes simulados"  value={params_.viajesMesSimulados} />
            <IRow label="Terreno (P/O/M)"
              value={`${Math.round(params_.distribucionTerreno.plano * 100)}% / ${Math.round(params_.distribucionTerreno.ondulado * 100)}% / ${Math.round(params_.distribucionTerreno.montanoso * 100)}%`} />
            <IRow label="Fuente terreno"  value={params_.fuenteTerreno} />
            <IRow label="Fuente peajes"   value={params_.fuentePeajes} />
            <div style={{ marginTop: 10, padding: '8px 10px', background: '#F0FDF4', borderRadius: 6 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#065F46', fontWeight: 500 }}>📋 {params_.metodologia}</p>
            </div>
          </ColapsableSection>
        )}

        {/* ── Total SISETAC ── */}
        <ColapsableSection
          icon="💰" title="Total SISETAC"
          total={fleteRef} totalLabel="Piso SISETAC"
          highlight
        >
          {/* Resumen de componentes */}
          <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr auto auto', gap: '0 8px', marginBottom: 4 }}>
            <span /><span />
            <span style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>valor</span>
            <span style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', minWidth: 96 }}>acumulado</span>
          </div>

          {[
            { op: ' ', label: 'Costos Variables',     note: 'combustible · peajes · llantas · mant.', val: cvTotal,  acc: cvTotal,      bg: undefined,  clr: undefined },
            { op: '+', label: 'Costos Fijos / viaje', note: 'capital · salarios · seguros · otros',  val: cfViaje,  acc: costoTecnico, bg: undefined,  clr: undefined },
            { op: '=', label: 'Piso SISETAC',         note: `+ administ. 5% · + OC ÷ 0.7554`,        val: fleteRef, acc: fleteRef,     bg: '#F0FDF4',  clr: '#065F46'  },
          ].map(({ op, label, note, val, acc, bg, clr }) => (
            <div key={label} style={{
              display: 'grid', gridTemplateColumns: '26px 1fr auto auto',
              gap: '0 8px', alignItems: 'center',
              padding: bg ? '7px 8px' : '5px 0',
              background: bg, borderRadius: bg ? 6 : 0,
              margin: bg ? '4px -4px' : 0,
            }}>
              <span style={{ fontWeight: 900, fontSize: 15, color: op === '+' ? '#2563EB' : op === '=' ? '#065F46' : '#9CA3AF', textAlign: 'center' }}>{op}</span>
              <div>
                <span style={{ fontSize: 12, color: clr ?? '#374151', fontWeight: bg ? 700 : 400 }}>{label}</span>
                {note && <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{note}</p>}
              </div>
              <span style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {op !== '=' ? (val >= 0 ? `+${fmt(val)}` : fmt(val)) : ''}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: clr ?? '#9CA3AF', textAlign: 'right', whiteSpace: 'nowrap', minWidth: 96 }}>
                {fmt(acc)}
              </span>
            </div>
          ))}

          {/* Resultado final */}
          <div style={{
            marginTop: 12, padding: '14px 16px', background: '#065F46', borderRadius: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Piso SISETAC (flete referencial)</p>
              <p style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>{fmt(fleteRef)}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.85 }}>
              <p style={{ margin: 0 }}>CV + CF + costos técnicos</p>
            </div>
          </div>
        </ColapsableSection>

          </div>
        )}
      </div>
    </div>
  );
}
