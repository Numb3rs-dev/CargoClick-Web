'use client'

/**
 * PanelComercial
 *
 * Panel interactivo para el comercial en la página de detalle de solicitud.
 * Incluye:
 * 1. Emulador de escenarios  el comercial ajusta vehículo y comisión y emula
 *    sin afectar los datos SISETAC/RNDC originales de arriba.
 * 2. Comparativa de escenarios  tabla opcional de escenarios que el comercial
 *    agrega manualmente.
 * 3. Panel de negociación (oferta, confirmación, pago conductor).
 */

import React, { useState, useEffect, useCallback } from 'react'

//  Tipos 

type ConfigVehiculo = 'C2' | 'C3' | 'C2S2' | 'C2S3' | 'C3S2' | 'C3S3'

const VEHICULOS: { id: ConfigVehiculo; label: string; capacidad: string; maxTon: number }[] = [
  { id: 'C2',   label: 'Camión 2 ejes (C2)',      capacidad: 'hasta 8 ton',  maxTon: 8  },
  { id: 'C3',   label: 'Camión 3 ejes (C3)',      capacidad: 'hasta 17 ton', maxTon: 17 },
  { id: 'C2S2', label: 'Tracto doble (C2S2)',     capacidad: 'hasta 25 ton', maxTon: 25 },
  { id: 'C2S3', label: 'Tracto triple (C2S3)',    capacidad: 'hasta 30 ton', maxTon: 30 },
  { id: 'C3S2', label: 'Tracto 3+2 ejes (C3S2)', capacidad: 'hasta 32 ton', maxTon: 32 },
  { id: 'C3S3', label: 'Tracto 3+3 ejes (C3S3)', capacidad: 'hasta 35 ton', maxTon: 35 },
]

const CONFIANZA_COLOR: Record<string, string> = {
  ALTA: '#059669', MEDIA: '#D97706', BAJA: '#DC2626',
}

const ESTADOS_NEGOCIACION = [
  { value: 'BORRADOR',       label: 'Borrador',       color: '#6B7280' },
  { value: 'EN_OFERTA',      label: 'En oferta',      color: '#2563EB' },
  { value: 'EN_NEGOCIACION', label: 'En negociación', color: '#D97706' },
  { value: 'ACEPTADO',       label: 'Aceptado ',     color: '#059669' },
  { value: 'RECHAZADO',      label: 'Rechazado',      color: '#DC2626' },
  { value: 'CANCELADO',      label: 'Cancelado',      color: '#9CA3AF' },
  { value: 'CERRADO',        label: 'Cerrado',        color: '#7C3AED' },
]

interface AjusteComercial {
  id: string
  cotizacionBaseId: string
  vehiculoUsado: string
  margenSimulado: number
  tarifaOfertadaCliente: number | null
  margenEfectivoOferta: number | null
  tarifaConfirmadaCliente: number | null
  pagoAlConductor: number | null
  margenBrutoCop: number | null
  margenBrutoPercent: number | null
  estadoNegociacion: string
  nombreComercial: string | null
  motivoAjuste: string | null
  notasComerciales: string | null
  formaPago: string
  diasCredito: number
  updatedAt: string | null
}

interface CondicionEspecial {
  key: string
  icon: string
  label: string
  monto: number
  activo?: boolean
}

interface ResultadoEmulacion {
  cotizacionId: string
  vehiculo: ConfigVehiculo
  comisionPct: number
  pisoSisetac: number
  tarifaFinal: number
  distanciaKm: number
  rndc: {
    estimado: number | null
    confianza: string | null
    nivelLabel: string | null
    viajesSimilares: number | null
  } | null
}

interface Escenario extends ResultadoEmulacion {
  label: string
  hora: string
}

//  Helpers 

function fmt(v: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(v)
}

function pctDiff(a: number | null, b: number): string | null {
  if (a === null) return null
  const p = ((a - b) / b) * 100
  return (p >= 0 ? '+' : '') + p.toFixed(1) + '%'
}

function inputStyle(warning?: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${warning ? '#F59E0B' : '#D1D5DB'}`,
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    background: '#FFFFFF',
    boxSizing: 'border-box',
  }
}

function Badge({ estado }: { estado: string }) {
  const cfg = ESTADOS_NEGOCIACION.find(e => e.value === estado)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
      background: (cfg?.color ?? '#6B7280') + '20',
      color: cfg?.color ?? '#6B7280',
      border: `1px solid ${(cfg?.color ?? '#6B7280')}40`,
    }}>
      {cfg?.label ?? estado}
    </span>
  )
}

//  Componente principal 

interface PanelComercialProps {
  solicitudId: string
  cotizacionActualId: string | null
  vehiculoActual: string | null
  margenActual: number | null
  fleteRefActual: number | null
  pesoKg: number | null
  distanciaKm: number | null
  origen: string | null
  destino: string | null
  condicionesEspeciales: CondicionEspecial[]
}

export default function PanelComercial({
  solicitudId,
  cotizacionActualId,
  vehiculoActual,
  margenActual,
  fleteRefActual,
  pesoKg,
  distanciaKm,
  origen,
  destino,
  condicionesEspeciales,
}: PanelComercialProps) {

  //  Emulador 
  const [vehiculoSim, setVehiculoSim] = useState<ConfigVehiculo>((vehiculoActual as ConfigVehiculo) ?? 'C3')
  const [calculando, setCalculando]   = useState(false)
  const [simError, setSimError]       = useState<string | null>(null)
  const [resultado, setResultado]     = useState<ResultadoEmulacion | null>(null)
  const [escenarios, setEscenarios]   = useState<Escenario[]>([])

  // Construye tu oferta
  const [ofertaPiso, setOfertaPiso]         = useState<string>(fleteRefActual ? String(fleteRefActual) : '')
  const [ofertaComision, setOfertaComision] = useState<number>(margenActual ?? 20)
  const [condicionesLocal, setCondicionesLocal] = useState<(CondicionEspecial & { activo: boolean })[]>(
    () => condicionesEspeciales.map(c => ({ ...c, activo: c.activo ?? false }))
  )
  // Todos los cálculos derivados a nivel de componente — se recalculan en cada render
  const ofertaPisoN        = ofertaPiso ? Number(ofertaPiso.replace(/[^\d]/g, '')) : 0
  const ofertaPisoRef      = resultado?.pisoSisetac ?? fleteRefActual ?? 0
  const ofertaKmRef        = resultado?.distanciaKm ?? distanciaKm ?? 0
  const ofertaTarifaBase   = ofertaPisoN > 0 ? Math.round(ofertaPisoN * (1 + ofertaComision / 100)) : 0
  const sumaCondicionesActivas = condicionesLocal.filter(c => c.activo).reduce((acc, c) => acc + c.monto, 0)
  const ofertaTotalFinal   = ofertaTarifaBase + sumaCondicionesActivas

  //  Ajuste comercial 
  const [ajuste, setAjuste]               = useState<AjusteComercial | null>(null)
  const [loadingAjuste, setLoadingAjuste] = useState(true)
  const [guardando, setGuardando]         = useState(false)

  //  Formulario negociación 
  const [ofertada, setOfertada]           = useState('')
  const [confirmada, setConfirmada]       = useState('')
  const [pagoConductor, setPagoConductor] = useState('')
  const [estadoNeg, setEstadoNeg]         = useState('BORRADOR')
  const [nombreCom, setNombreCom]         = useState('')
  const [motivoAjuste, setMotivoAjuste]   = useState('')
  const [notas, setNotas]                 = useState('')
  const [formaPago, setFormaPago]         = useState('CONTADO')

  const cargarAjuste = useCallback(async () => {
    setLoadingAjuste(true)
    try {
      const r = await fetch(`/api/solicitudes/${solicitudId}/ajuste-comercial`)
      if (r.ok) {
        const data = await r.json()
        if (data.ajuste) {
          setAjuste(data.ajuste)
          setOfertada(data.ajuste.tarifaOfertadaCliente ? String(data.ajuste.tarifaOfertadaCliente) : '')
          setConfirmada(data.ajuste.tarifaConfirmadaCliente ? String(data.ajuste.tarifaConfirmadaCliente) : '')
          setPagoConductor(data.ajuste.pagoAlConductor ? String(data.ajuste.pagoAlConductor) : '')
          setEstadoNeg(data.ajuste.estadoNegociacion ?? 'BORRADOR')
          setNombreCom(data.ajuste.nombreComercial ?? '')
          setMotivoAjuste(data.ajuste.motivoAjuste ?? '')
          setNotas(data.ajuste.notasComerciales ?? '')
          setFormaPago(data.ajuste.formaPago ?? 'CONTADO')
        }
      }
    } finally {
      setLoadingAjuste(false)
    }
  }, [solicitudId])

  useEffect(() => { cargarAjuste() }, [cargarAjuste])

  //  Emular (auto-triggered on vehicle change) 
  const emular = useCallback(async (vehiculo: ConfigVehiculo) => {
    setCalculando(true)
    setSimError(null)
    try {
      const r = await fetch(`/api/solicitudes/${solicitudId}/cotizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configVehiculo: vehiculo, margen: 0 }),
      })
      const data = await r.json()
      if (!r.ok) { setSimError(data.message ?? 'Error al calcular'); return }
      const pisoSimulado = data.resumen.fleteReferencialSisetac
      setOfertaPiso(String(pisoSimulado))
      setResultado({
        cotizacionId: data.cotizacionId,
        vehiculo,
        comisionPct:  0,
        pisoSisetac:  pisoSimulado,
        tarifaFinal:  data.resumen.tarifaSugerida,
        distanciaKm:  data.resumen.distanciaKm,
        rndc: data.referenciaRndc ? {
          estimado:        data.referenciaRndc.estimado,
          confianza:       data.referenciaRndc.confianza,
          nivelLabel:      data.referenciaRndc.nivelLabel,
          viajesSimilares: data.referenciaRndc.viajesSimilares,
        } : null,
      })
    } finally {
      setCalculando(false)
    }
  }, [solicitudId])

  // Auto-emular cuando cambia el vehículo
  useEffect(() => { emular(vehiculoSim) }, [vehiculoSim, emular])

  const agregarEscenario = () => {
    if (!resultado) return
    const n = escenarios.length + 1
    setEscenarios(prev => [...prev, {
      ...resultado,
      label: `Escenario ${n}`,
      hora:  new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    }])
  }

  const eliminarEscenario = (idx: number) =>
    setEscenarios(prev => prev.filter((_, i) => i !== idx))

  //  Crear ajuste 
  const crearAjuste = async () => {
    if (!cotizacionActualId) return
    setGuardando(true)
    try {
      const r = await fetch(`/api/solicitudes/${solicitudId}/ajuste-comercial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cotizacionBaseId: cotizacionActualId,
          vehiculoUsado:    vehiculoActual ?? vehiculoSim,
          margenSimulado:   margenActual ?? ofertaComision,
          nombreComercial:  nombreCom || null,
        }),
      })
      const data = await r.json()
      if (data.ajuste) setAjuste(data.ajuste)
    } finally {
      setGuardando(false)
    }
  }

  //  Guardar ajuste 
  const guardarAjuste = async () => {
    if (!ajuste) return
    setGuardando(true)
    try {
      const body: Record<string, unknown> = {}
      if (ofertaTotalFinal > 0) {
        body.tarifaOfertadaCliente  = ofertaTotalFinal
        body.tarifaConfirmadaCliente = ofertaTotalFinal
      }
      if (estadoNeg)     body.estadoNegociacion       = estadoNeg
      if (nombreCom)     body.nombreComercial         = nombreCom
      if (motivoAjuste)  body.motivoAjuste            = motivoAjuste
      if (notas)         body.notasComerciales        = notas
      body.formaPago   = formaPago

      const r = await fetch(`/api/ajustes-comerciales/${ajuste.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (r.ok) await cargarAjuste()
    } finally {
      setGuardando(false)
    }
  }

  //  Imprimir cotización 
  const imprimirCotizacion = () => {
    const vehiculoLabel = VEHICULOS.find(v => v.id === vehiculoSim)?.label ?? vehiculoSim
    const condicionesActivas = condicionesLocal.filter(c => c.activo)
    const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    const baseUrl = window.location.origin
    const html = `<!DOCTYPE html>
<html lang="es"><head>
  <meta charset="UTF-8">
  <title>Cotización de Servicio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111827; padding: 40px; }
    .header { border-bottom: 3px solid #1D4ED8; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; }
    .logos { display: flex; align-items: center; gap: 18px; }
    .logos img { height: 48px; width: auto; object-fit: contain; }
    .logos .sep { width: 1px; height: 36px; background: #E5E7EB; }
    .subtitulo { font-size: 12px; color: #6B7280; margin-top: 6px; }
    .info-fecha { text-align: right; font-size: 12px; color: #6B7280; line-height: 1.6; }
    .seccion { margin-bottom: 22px; }
    .seccion h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9CA3AF; font-weight: 700; margin-bottom: 10px; border-bottom: 1px solid #F3F4F6; padding-bottom: 5px; }
    .fila { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; border-bottom: 1px solid #F9FAFB; }
    .fila .lbl { color: #6B7280; }
    .fila .val { font-weight: 600; color: #111827; }
    .total-box { margin-top: 28px; padding: 24px; background: #1D4ED8; border-radius: 12px; text-align: center; color: #fff; }
    .total-box .tt { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.8; margin-bottom: 8px; }
    .total-box .tv { font-size: 38px; font-weight: 900; letter-spacing: -1px; }
    .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head><body>
  <div class="header">
    <div>
      <div class="logos">
        <img src="${baseUrl}/assets/NuevoMundoLogoNombreLadoDerecho.png" alt="Nuevo Mundo" />
        <div class="sep"></div>
        <img src="${baseUrl}/assets/CargoClickLogoNombre.png" alt="Cargo Click" />
      </div>
      <div class="subtitulo">Cotizaci\u00f3n de Servicio de Transporte</div>
    </div>
    <div class="info-fecha">
      <div>${fechaHoy}</div>
      ${nombreCom ? `<div>Comercial: ${nombreCom}</div>` : ''}
    </div>
  </div>

  <div class="seccion">
    <h3>Detalles del Servicio</h3>
    ${origen ? `<div class="fila"><span class="lbl">Origen</span><span class="val">${origen}</span></div>` : ''}
    ${destino ? `<div class="fila"><span class="lbl">Destino</span><span class="val">${destino}</span></div>` : ''}
    ${ofertaKmRef > 0 ? `<div class="fila"><span class="lbl">Distancia estimada</span><span class="val">${ofertaKmRef.toLocaleString('es-CO')} km</span></div>` : ''}
    ${pesoKg ? `<div class="fila"><span class="lbl">Peso de la carga</span><span class="val">${(pesoKg / 1000).toLocaleString('es-CO', { maximumFractionDigits: 2 })} ton</span></div>` : ''}
    <div class="fila"><span class="lbl">Tipo de veh\u00edculo</span><span class="val">${vehiculoLabel}</span></div>
    ${formaPago ? `<div class="fila"><span class="lbl">Forma de pago</span><span class="val">${formaPago.replace('_', ' ')}</span></div>` : ''}
  </div>

  ${condicionesActivas.length > 0 ? `<div class="seccion">
    <h3>Condiciones Especiales</h3>
    ${condicionesActivas.map(c => `<div class="fila"><span class="lbl">${c.icon} ${c.label}</span><span class="val">${fmt(c.monto)}</span></div>`).join('')}
  </div>` : ''}

  <div class="total-box">
    <div class="tt">Valor Total del Servicio</div>
    <div class="tv">${ofertaTotalFinal > 0 ? fmt(ofertaTotalFinal) : '\u2014'}</div>
  </div>

  <div class="footer">
    Esta cotizaci\u00f3n es v\u00e1lida por 24 horas\u00a0\u00b7\u00a0Forma de pago: ${formaPago.replace('_', ' ')}${nombreCom ? '\u00a0\u00b7\u00a0Comercial: ' + nombreCom : ''}
  </div>
</body></html>`
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      const win  = window.open(url, '_blank', 'width=860,height=980')
      if (win) {
        win.addEventListener('load', () => {
          // pequeño delay para que las imágenes terminen de renderizar
          setTimeout(() => {
            win.focus()
            win.print()
            URL.revokeObjectURL(url)
          }, 400)
        })
      } else {
        URL.revokeObjectURL(url)
        alert('El navegador bloqueó la ventana de impresión.\nPor favor, permite las ventanas emergentes para este sitio y vuelve a intentarlo.')
      }
    } catch (err) {
      console.error('Error al generar cotización:', err)
      alert('Ocurrió un error al generar la cotización. Revisa la consola para más detalles.')
    }
  }

  //  Métricas 
  const fleteRef     = fleteRefActual ?? 0
  const margenOferta = ofertaTotalFinal > 0 && fleteRef > 0
    ? (((ofertaTotalFinal - fleteRef) / fleteRef) * 100).toFixed(1)
    : null

  //  Render 
  return (
    <div>

      {/* 
          SECCIÓN 1  EMULADOR DE ESCENARIOS
           */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB',
        overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #F3F4F6',
          background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}></span>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
              Emulador de Escenarios
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
              Cambia parámetros y emula. Los datos SISETAC y RNDC de arriba no se modifican.
            </p>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Contexto del servicio */}
          <div style={{
            display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20,
            padding: '10px 14px', background: '#F9FAFB', borderRadius: 10,
            border: '1px solid #E5E7EB',
          }}>
            {origen && destino && (
              <span style={{ fontSize: 12, color: '#4B5563' }}>
                 <strong>{origen}</strong>  <strong>{destino}</strong>
              </span>
            )}
            {distanciaKm !== null && (
              <span style={{ fontSize: 12, color: '#4B5563' }}>
                 <strong>{distanciaKm.toLocaleString('es-CO')} km</strong>
              </span>
            )}
            {pesoKg !== null && (
              <span style={{ fontSize: 12, color: '#4B5563' }}>
                 <strong>{pesoKg.toLocaleString('es-CO')} kg</strong>
              </span>
            )}
          </div>

          {/* Controles */}
          {(() => {
            const pesoTon = pesoKg !== null ? pesoKg / 1000 : null
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Tipo de vehículo</label>
                  {calculando && (
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>⏳ Calculando piso…</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {VEHICULOS.map(v => {
                    const isSelected    = vehiculoSim === v.id
                    const excedeEste    = pesoTon !== null && pesoTon > v.maxTon
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVehiculoSim(v.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                          border: isSelected ? '2px solid #2563EB' : '1px solid #E5E7EB',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          textAlign: 'left', fontSize: 13, transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? '#1D4ED8' : '#374151' }}>
                          {v.label}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 500,
                          color: excedeEste ? '#B45309' : '#6B7280',
                          background: excedeEste ? '#FEF3C7' : '#F3F4F6',
                          padding: '2px 7px', borderRadius: 999,
                        }}>
                          {v.capacidad}{excedeEste ? ' ⚠️' : ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {pesoTon !== null && (() => {
                  const vehiculoInfo    = VEHICULOS.find(v => v.id === vehiculoSim)
                  const excedeCapacidad = vehiculoInfo && pesoTon > vehiculoInfo.maxTon
                  return excedeCapacidad ? (
                    <div style={{
                      marginTop: 8, padding: '8px 12px',
                      background: '#FFFBEB', border: '1px solid #FDE68A',
                      borderRadius: 8, fontSize: 12, color: '#92400E',
                    }}>
                      ⚠️ La carga ({pesoTon.toFixed(1)} ton) supera la capacidad del vehículo seleccionado
                      ({vehiculoInfo!.maxTon} ton). El cálculo se realiza igual, pero verifica con operaciones.
                    </div>
                  ) : null
                })()}
              </div>
            )
          })()}

          {simError && (
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: 8, color: '#DC2626', fontSize: 13,
            }}>
               {simError}
            </div>
          )}

          {/* Resultado emulación — solo tras emular */}
          {resultado && (
            <div style={{ marginTop: 20 }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Resultado — {VEHICULOS.find(v => v.id === resultado.vehiculo)?.label ?? resultado.vehiculo}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

                {/* Piso SISETAC */}
                <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#065F46', fontWeight: 600 }}>Piso SISETAC</p>
                  <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: '#065F46' }}>
                    {fmt(resultado.pisoSisetac)}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
                    {resultado.distanciaKm} km · {fmt(Math.round(resultado.pisoSisetac / resultado.distanciaKm))}/km
                  </p>
                </div>

                {/* RNDC */}
                {resultado.rndc && resultado.rndc.estimado !== null ? (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#92400E', fontWeight: 600 }}>
                      Ref. RNDC
                      {resultado.rndc.confianza && (
                        <span style={{
                          marginLeft: 6, padding: '1px 6px', borderRadius: 9999, fontSize: 10,
                          background: (CONFIANZA_COLOR[resultado.rndc.confianza] ?? '#6B7280') + '20',
                          color: CONFIANZA_COLOR[resultado.rndc.confianza] ?? '#6B7280',
                        }}>{resultado.rndc.confianza}</span>
                      )}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: '#92400E' }}>
                      {fmt(resultado.rndc.estimado)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
                      {pctDiff(resultado.rndc.estimado, resultado.pisoSisetac)} vs piso SISETAC
                      {resultado.rndc.viajesSimilares !== null && ` · ${resultado.rndc.viajesSimilares} viajes`}
                    </p>
                  </div>
                ) : (
                  <div style={{
                    padding: '14px 16px', borderRadius: 12,
                    background: '#F9FAFB', border: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                      Sin referencia RNDC
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 4 }}>
                <button
                  onClick={agregarEscenario}
                  style={{
                    padding: '8px 20px',
                    background: '#FFFFFF', color: '#374151',
                    border: '1px solid #D1D5DB', borderRadius: 8,
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  ➕ Agregar a comparativa
                </button>
                {escenarios.length > 0 && (
                  <span style={{ marginLeft: 10, fontSize: 12, color: '#6B7280' }}>
                    {escenarios.length} escenario{escenarios.length !== 1 ? 's' : ''} guardado{escenarios.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Construye tu oferta — siempre visible ── */}
          <div style={{
            marginTop: 20, padding: '20px', background: '#F8FAFF',
            borderRadius: 12, border: '1px solid #BFDBFE',
          }}>
            <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>
              🏗️ Construye tu oferta
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Piso deseado */}
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                  Piso base deseado (COP)
                </label>
                <input
                  type="text"
                  value={ofertaPiso}
                  onChange={e => setOfertaPiso(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Ej: 3500000"
                  style={{
                    ...inputStyle(ofertaPisoRef > 0 && ofertaPisoN > 0 && ofertaPisoN < ofertaPisoRef),
                    fontWeight: 700,
                  }}
                />
                {ofertaPisoN > 0 && ofertaPisoRef > 0 && ofertaPisoN < ofertaPisoRef && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#DC2626' }}>
                    ⚠️ Por debajo del piso SISETAC ({fmt(ofertaPisoRef)})
                  </p>
                )}
                {ofertaPisoN > 0 && ofertaPisoRef > 0 && ofertaPisoN >= ofertaPisoRef && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#059669' }}>
                    +{fmt(ofertaPisoN - ofertaPisoRef)} sobre piso SISETAC
                  </p>
                )}
              </div>

              {/* Comisión */}
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                  Comisión comercial:&nbsp;
                  <strong style={{ color: '#1D4ED8', fontSize: 14 }}>{ofertaComision}%</strong>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="range" min={0} max={500} step={0.5}
                    value={ofertaComision}
                    onChange={e => setOfertaComision(Number(e.target.value))}
                    style={{ flex: 1, cursor: 'pointer' }}
                  />
                  <input
                    type="number" min={0} max={500} step={0.5}
                    value={ofertaComision}
                    onChange={e => setOfertaComision(Number(e.target.value))}
                    style={{ ...inputStyle(), width: 80, textAlign: 'center' }}
                  />
                </div>
                {ofertaPisoN > 0 && ofertaComision > 0 && (
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6B7280' }}>
                    Flete con comisión: <strong style={{ color: '#1D4ED8' }}>{fmt(ofertaTarifaBase)}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Condiciones especiales — siempre visible */}
            <div style={{
              marginBottom: 16, padding: '12px 14px',
              background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A',
            }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                📋 Costos adicionales (condiciones especiales)
              </p>
              {condicionesLocal.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                  No hay condiciones especiales registradas en esta solicitud.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {condicionesLocal.map((c, i) => (
                    <div key={c.key} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 13, padding: '4px 6px', borderRadius: 6,
                      background: c.activo ? 'transparent' : '#F9FAFB',
                      opacity: c.activo ? 1 : 0.5,
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={c.activo}
                          onChange={e => {
                            const next = [...condicionesLocal]
                            next[i] = { ...next[i], activo: e.target.checked }
                            setCondicionesLocal(next)
                          }}
                          style={{ cursor: 'pointer', width: 15, height: 15 }}
                        />
                        {c.icon} {c.label}
                      </label>
                      {c.activo ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={c.monto > 0 ? c.monto.toLocaleString('es-CO') : ''}
                          onChange={e => {
                            const val = Number(e.target.value.replace(/[^\d]/g, '')) || 0
                            const next = [...condicionesLocal]
                            next[i] = { ...next[i], monto: val }
                            setCondicionesLocal(next)
                          }}
                          style={{
                            width: 120, textAlign: 'right', fontWeight: 700, color: '#92400E',
                            border: '1px solid #FCD34D', borderRadius: 6, padding: '3px 8px',
                            fontSize: 13, background: '#FFFBEB', outline: 'none', cursor: 'text',
                          }}
                        />
                      ) : (
                        <span style={{ fontWeight: 700, color: '#9CA3AF' }}>
                          {fmt(c.monto)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Total — fuente única de verdad */}
              <div style={{
                marginTop: 10, paddingTop: 8, borderTop: '1px solid #FDE68A',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Total costos adicionales</span>
                <span style={{ fontWeight: 800, color: '#92400E', fontSize: 15 }}>{fmt(sumaCondicionesActivas)}</span>
              </div>
            </div>

            {/* Oferta final — siempre visible */}
            <div style={{
              padding: '16px 20px', borderRadius: 12,
              background: ofertaTotalFinal > 0
                ? 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)'
                : '#E5E7EB',
              color: ofertaTotalFinal > 0 ? '#FFFFFF' : '#9CA3AF',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, opacity: 0.85, fontWeight: 500 }}>
                💰 Oferta total al cliente
              </p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px' }}>
                {ofertaTotalFinal > 0 ? fmt(ofertaTotalFinal) : '—'}
              </p>
              <div style={{
                marginTop: 12, paddingTop: 10,
                borderTop: `1px solid ${ofertaTotalFinal > 0 ? 'rgba(255,255,255,0.25)' : '#D1D5DB'}`,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.9 }}>
                  <span>Flete base</span>
                  <span style={{ fontWeight: 700 }}>{ofertaPisoN > 0 ? fmt(ofertaPisoN) : '—'}</span>
                </div>
                {ofertaComision > 0 && ofertaPisoN > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.9 }}>
                    <span>+ Comisión {ofertaComision}%</span>
                    <span style={{ fontWeight: 700 }}>+{fmt(ofertaTarifaBase - ofertaPisoN)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.9 }}>
                  <span>+ Costos adicionales</span>
                  <span style={{ fontWeight: 700, color: sumaCondicionesActivas > 0 ? (ofertaTotalFinal > 0 ? '#FDE68A' : '#B45309') : 'inherit' }}>
                    {sumaCondicionesActivas > 0 ? `+${fmt(sumaCondicionesActivas)}` : '$0'}
                  </span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800,
                  paddingTop: 6, marginTop: 2,
                  borderTop: `1px solid ${ofertaTotalFinal > 0 ? 'rgba(255,255,255,0.35)' : '#D1D5DB'}`,
                }}>
                  <span>Total</span>
                  <span>{ofertaTotalFinal > 0 ? fmt(ofertaTotalFinal) : '—'}</span>
                </div>
              </div>
              {ofertaPisoRef > 0 && ofertaTotalFinal > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 11, opacity: 0.8 }}>
                  <span>vs piso SISETAC: <strong>{pctDiff(ofertaTotalFinal, ofertaPisoRef) ?? '—'}</strong></span>
                  {ofertaKmRef > 0 && <span><strong>{fmt(Math.round(ofertaTotalFinal / ofertaKmRef))}</strong>/km</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 
          SECCIÓN 2  COMPARATIVA DE ESCENARIOS
           */}
      {escenarios.length > 0 && (
        <div style={{
          background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB',
          overflow: 'hidden', marginBottom: 20,
        }}>
          <div style={{
            padding: '14px 24px', borderBottom: '1px solid #F3F4F6',
            background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 17 }}></span>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
              Comparativa de Escenarios ({escenarios.length})
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Escenario</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Vehículo</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Piso SISETAC</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Comisión</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Tarifa final</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Ref. RNDC</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>$/km</th>
                  <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 600, color: '#6B7280', fontSize: 12 }}></th>
                </tr>
              </thead>
              <tbody>
                {escenarios.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{e.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{e.hora}</p>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#1D4ED8' }}>{e.vehiculo}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#374151' }}>{fmt(e.pisoSisetac)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#374151' }}>{e.comisionPct}%</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#065F46' }}>{fmt(e.tarifaFinal)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#92400E' }}>
                      {e.rndc?.estimado != null ? fmt(e.rndc.estimado) : ''}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#6B7280', fontSize: 12 }}>
                      {fmt(Math.round(e.tarifaFinal / e.distanciaKm))}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                      <button
                        onClick={() => eliminarEscenario(i)}
                        title="Eliminar"
                        style={{
                          padding: '3px 9px', fontSize: 12, cursor: 'pointer',
                          background: 'none', border: '1px solid #E5E7EB',
                          borderRadius: 6, color: '#9CA3AF',
                        }}
                      ></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 
          SECCIÓN 3  AJUSTE COMERCIAL / NEGOCIACIÓN
           */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #F3F4F6',
          display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB',
        }}>
          <span style={{ fontSize: 18 }}></span>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
            Ajuste Comercial y Negociación
          </h2>
          {ajuste && <Badge estado={ajuste.estadoNegociacion} />}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {loadingAjuste ? (
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Cargando ajuste</p>
          ) : !ajuste ? (
            <div>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
                No hay ajuste comercial activo. Crea el ajuste para comenzar el proceso de negociación con el cliente.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>Nombre del comercial</label>
                <input
                  type="text" value={nombreCom} onChange={e => setNombreCom(e.target.value)}
                  placeholder="Ej: Carlos López"
                  style={{ ...inputStyle(), maxWidth: 300 }}
                />
              </div>
              <button
                onClick={crearAjuste}
                disabled={!cotizacionActualId || guardando}
                style={{
                  padding: '10px 24px',
                  background: cotizacionActualId ? '#059669' : '#D1D5DB',
                  color: '#FFFFFF', border: 'none', borderRadius: 8,
                  fontWeight: 700, fontSize: 14,
                  cursor: cotizacionActualId ? 'pointer' : 'default',
                }}
              >
                {guardando ? ' Creando' : '+ Crear ajuste comercial'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{
                padding: '10px 14px', background: '#F0FDF4', borderRadius: 8,
                border: '1px solid #A7F3D0', marginBottom: 20,
                display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#065F46' }}>Vehículo base</p>
                  <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#065F46' }}>{ajuste.vehiculoUsado}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#065F46' }}>Piso SISETAC</p>
                  <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#065F46' }}>{fmt(fleteRef)}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* Columna izquierda — Tarifa al cliente (solo lectura, tomada de "Construye tu oferta") */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Banner total */}
                  <div style={{
                    padding: '18px 20px',
                    background: ofertaTotalFinal > 0
                      ? 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)'
                      : '#E5E7EB',
                    borderRadius: 12,
                    color: ofertaTotalFinal > 0 ? '#FFFFFF' : '#9CA3AF',
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Tarifa al cliente / Manifiesto
                    </p>
                    <p style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px' }}>
                      {ofertaTotalFinal > 0 ? fmt(ofertaTotalFinal) : '—'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.7 }}>
                      Tomado de &ldquo;Construye tu oferta&rdquo;
                    </p>
                  </div>

                  {/* Desglose */}
                  <div style={{
                    padding: '14px 16px',
                    background: '#F9FAFB',
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Desglose</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6B7280' }}>Flete base (piso)</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{ofertaPisoN > 0 ? fmt(ofertaPisoN) : '—'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6B7280' }}>Comisión ({ofertaComision}%)</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{ofertaTarifaBase > 0 ? fmt(ofertaTarifaBase - ofertaPisoN) : '—'}</span>
                    </div>

                    {sumaCondicionesActivas > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#6B7280' }}>Costos adicionales</span>
                        <span style={{ fontWeight: 600, color: '#92400E' }}>{fmt(sumaCondicionesActivas)}</span>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ fontWeight: 700, color: '#111827' }}>Total</span>
                      <span style={{ fontWeight: 800, color: '#1D4ED8' }}>{ofertaTotalFinal > 0 ? fmt(ofertaTotalFinal) : '—'}</span>
                    </div>
                  </div>

                  {margenOferta !== null && fleteRef > 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: Number(margenOferta) >= 0 ? '#059669' : '#DC2626', fontWeight: 600 }}>
                      {Number(margenOferta) >= 0 ? '▲' : '▼'} {margenOferta}% sobre piso SISETAC ({fmt(fleteRef)})
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>Estado negociación</label>
                    <select value={estadoNeg} onChange={e => setEstadoNeg(e.target.value)} style={{ ...inputStyle(), cursor: 'pointer' }}>
                      {ESTADOS_NEGOCIACION.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>Forma de pago</label>
                    <select value={formaPago} onChange={e => setFormaPago(e.target.value)} style={{ ...inputStyle(), cursor: 'pointer' }}>
                      {['CONTADO', 'CREDITO_30', 'CREDITO_60', 'CREDITO_90'].map(f => (
                        <option key={f} value={f}>{f.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>Nombre del comercial</label>
                    <input type="text" value={nombreCom} onChange={e => setNombreCom(e.target.value)} placeholder="Quién gestiona" style={inputStyle()} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>Motivo del ajuste de precio</label>
                    <input type="text" value={motivoAjuste} onChange={e => setMotivoAjuste(e.target.value)} placeholder="Ej: cliente frecuente, viaje de retorno" style={inputStyle()} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>Notas internas</label>
                    <textarea
                      value={notas} onChange={e => setNotas(e.target.value)}
                      placeholder="Solo visible internamente"
                      rows={3}
                      style={{ ...inputStyle(), resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {ajuste.tarifaConfirmadaCliente && fleteRef > 0 && (
                <div style={{
                  marginTop: 20, padding: '14px 16px',
                  background: '#F0FDF4', borderRadius: 10, border: '1px solid #A7F3D0',
                  display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
                }}>
                  <div style={{ fontSize: 12, color: '#065F46', fontWeight: 700 }}>📋 Último guardado</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Tarifa guardada</p>
                    <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#065F46' }}>{fmt(ajuste.tarifaConfirmadaCliente)}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Diferencia vs piso SISETAC</p>
                    <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: ajuste.tarifaConfirmadaCliente >= fleteRef ? '#059669' : '#DC2626' }}>
                      {fmt(ajuste.tarifaConfirmadaCliente - fleteRef)}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={guardarAjuste}
                  disabled={guardando}
                  style={{
                    padding: '10px 28px',
                    background: guardando ? '#D1D5DB' : '#059669',
                    color: '#FFFFFF', border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: 14,
                    cursor: guardando ? 'default' : 'pointer',
                  }}
                >
                  {guardando ? '⏳ Guardando' : '💾 Guardar ajuste'}
                </button>
                <button
                  onClick={imprimirCotizacion}
                  disabled={ofertaTotalFinal === 0}
                  style={{
                    padding: '10px 24px',
                    background: ofertaTotalFinal > 0 ? '#1D4ED8' : '#D1D5DB',
                    color: '#FFFFFF', border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: 14,
                    cursor: ofertaTotalFinal > 0 ? 'pointer' : 'default',
                  }}
                >
                  🖨️ Imprimir cotización
                </button>
                {ajuste.updatedAt && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Último guardado: {new Date(ajuste.updatedAt).toLocaleString('es-CO')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}