/**
 * Página de Detalle de Solicitud y Cotización
 *
 * Ruta: /solicitudes/[ref]  (ref = código de referencia externo, ej: GT3R48P3)
 *
 * Server Component — carga datos directamente desde Prisma.
 * El ULID interno nunca se expone en la URL ni al cliente.
 */

import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/db/prisma'

// Never pre-render at build time — requires DATABASE_URL at runtime
export const dynamic = 'force-dynamic'
import { getNombreMunicipio, getNombreDepto, getDeptoFromMunicipio } from '@/app/cotizar/config/colombia-dane'
import PanelComercial from '@/components/solicitudes/PanelComercial'
import CondicionesEspeciales, { type Condicion } from '@/components/solicitudes/CondicionesEspeciales'
import DesgloseSisetac from '@/components/solicitudes/DesgloseSisetac'
import CardColapsable from '@/components/solicitudes/CardColapsable'
import BaseRndc, { type RndcData } from '@/components/solicitudes/BaseRndc'
import CotizarButton from '@/components/solicitudes/CotizarButton'
import { consultarRndc } from '@/lib/services/rndcEngine'

// ─── Helpers ────────────────────────────────────────────────

function formatCOP(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(date))
}

function formatDatetime(date: Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(date))
}

const ESTADO_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  EN_PROGRESO:  { bg: '#FEF3C7', text: '#92400E', label: 'En Progreso' },
  PENDIENTE:    { bg: '#DBEAFE', text: '#1E40AF', label: 'Pendiente' },
  COTIZADO:     { bg: '#D1FAE5', text: '#065F46', label: 'Cotizado' },
  COMPLETADA:   { bg: '#D1FAE5', text: '#065F46', label: 'Completada' },
  CANCELADA:    { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelada' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_COLORS[estado] ?? { bg: '#F3F4F6', text: '#374151', label: estado }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 9999,
      fontSize: 13,
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.text,
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: cfg.text,
        display: 'inline-block',
      }} />
      {cfg.label}
    </span>
  )
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#F9FAFB',
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</h2>
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
      padding: '8px 0',
      borderBottom: '1px solid #F3F4F6',
    }}>
      <span style={{ fontSize: 13, color: '#6B7280', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function MoneyRow({ label, value, highlight = false, large = false }: {
  label: string
  value: number
  highlight?: boolean
  large?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: large ? '10px 0' : '8px 0',
      borderBottom: highlight ? 'none' : '1px solid #F3F4F6',
      background: highlight ? '#F0FDF4' : 'transparent',
      borderRadius: highlight ? 8 : 0,
      paddingLeft: highlight ? 12 : 0,
      paddingRight: highlight ? 12 : 0,
      marginLeft: highlight ? -12 : 0,
      marginRight: highlight ? -12 : 0,
    }}>
      <span style={{
        fontSize: large ? 14 : 13,
        color: highlight ? '#065F46' : '#374151',
        fontWeight: highlight ? 600 : 400,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: large ? 15 : 13,
        fontWeight: highlight ? 700 : 600,
        color: highlight ? '#065F46' : '#111827',
      }}>
        {formatCOP(value)}
      </span>
    </div>
  )
}

function IconField({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '8px 0',
      borderBottom: '1px solid #F9FAFB',
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, width: 22, textAlign: 'center', marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0, minWidth: 130 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500, lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

// ─── Tipos Prisma ────────────────────────────────────────────

type DesgloseCv = {
  combustible: number
  peajes: number
  llantas: number
  lubricantes: number
  filtros: number
  lavadoEngrase: number
  mantenimiento: number
  imprevistos: number
  total: number
}

type DesgloseCf = {
  capital: number
  salarios: number
  seguros: number
  impuestos: number
  parqueadero: number
  comunicaciones: number
  rtm: number
  totalMes: number
  viajesMes: number
  porViaje: number
}

type ParamsUsados = {
  periodoParams: number
  acpmCopGal: number
  smlmv: number
  interesMensualBr: number
  valorVehiculoCop: number
  viajesMesSimulados: number
  velocidadPromKmH: number
  distribucionTerreno: { plano: number; ondulado: number; montanoso: number }
  fuenteTerreno: string
  fuentePeajes: string
  metodologia: string
}

// ─── Metadata dinámica ───────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ ref: string }> }
): Promise<Metadata> {
  const { ref } = await params
  const solicitud = await prisma.solicitud.findFirst({
    where: { codigoRef: ref.toUpperCase() },
    select: { empresa: true, origen: true, destino: true },
  })
  if (!solicitud) return { title: 'Solicitud no encontrada | CargoClick' }
  const origenLabel = solicitud.origen ? getNombreMunicipio(solicitud.origen) : '?'
  const destinoLabel = solicitud.destino ? getNombreMunicipio(solicitud.destino) : '?'
  return {
    title: `Solicitud ${solicitud.empresa} | ${origenLabel} → ${destinoLabel} | CargoClick`,
  }
}

// ─── Página ──────────────────────────────────────────────────

export default async function SolicitudDetallePage(
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params

  const solicitud = await prisma.solicitud.findFirst({
    where: { codigoRef: ref.toUpperCase() },
    include: {
      cotizaciones: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!solicitud) notFound()

  const cotizacion = solicitud.cotizaciones[0] ?? null

  // Resolver nombres legibles desde códigos DANE (fallback: el propio código)
  const origenNombre = solicitud.origen
    ? `${getNombreMunicipio(solicitud.origen)}, ${getNombreDepto(getDeptoFromMunicipio(solicitud.origen))}`
    : '—'
  const destinoNombre = solicitud.destino
    ? `${getNombreMunicipio(solicitud.destino)}, ${getNombreDepto(getDeptoFromMunicipio(solicitud.destino))}`
    : null

  const desgloseCv = cotizacion?.desgloseCv as DesgloseCv | null
  const desgloseCf = cotizacion?.desgloseCf as DesgloseCf | null
  const params_  = cotizacion?.parametrosUsados as ParamsUsados | null

  const pesoKg = Number(solicitud.pesoKg)
  const tarifaSugerida = cotizacion ? Number(cotizacion.tarifaSugerida) : null
  const fleteRef = cotizacion ? Number(cotizacion.fleteReferencialSisetac) : null
  const cvTotal = cotizacion ? Number(cotizacion.cvTotal) : null
  const cfViaje = cotizacion ? Number(cotizacion.cfPorViaje) : null
  const margen = cotizacion ? Number(cotizacion.margenAplicado) : null

  // Referencia histórica RNDC — re-consultada para obtener detalle completo
  let rndcData: RndcData | null = null
  if (cotizacion && solicitud.destino) {
    const raw = await consultarRndc(origenNombre, destinoNombre ?? '', pesoKg)
    if (raw) {
      rndcData = {
        ...raw,
        viajes: raw.viajes.map(v => ({ ...v, fecha: v.fecha.toISOString() })),
      }
    }
  }

  return (
    <>
      <Header />
      <main style={{ background: '#F3F4F6', minHeight: '100vh', padding: '32px 16px 64px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* ── Breadcrumb ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#6B7280' }}>
            <Link href="/" style={{ color: '#6B7280', textDecoration: 'none' }}>Inicio</Link>
            <span>›</span>
            <Link href="/cotizaciones" style={{ color: '#6B7280', textDecoration: 'none' }}>Cotizaciones</Link>
            <span>›</span>
            <span style={{ color: '#374151', fontWeight: 600 }}>#COT-{solicitud.codigoRef}</span>
          </div>

          {/* ── Encabezado ── */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E5E7EB',
            padding: '28px 32px',
            marginBottom: 24,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <EstadoBadge estado={solicitud.estado} />
                {cotizacion && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Cotizando vence: {formatDatetime(cotizacion.validezHasta)}
                  </span>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
                {solicitud.empresa ?? 'Sin empresa'}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 15, color: '#6B7280' }}>
                {origenNombre}
                {destinoNombre && <> <span style={{ color: '#D1D5DB' }}>→</span> {destinoNombre}</>}
                {solicitud.distanciaKm && (
                  <span style={{ marginLeft: 8, padding: '2px 8px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                    📏 {Number(solicitud.distanciaKm)} km
                  </span>
                )}
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>#COT-{solicitud.codigoRef}</div>
              <div style={{ marginTop: 4 }}>Creado: {formatDate(solicitud.createdAt)}</div>
              <div>Actualizado: {formatDatetime(solicitud.updatedAt)}</div>
            </div>
          </div>

          {/* ── Grid principal ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>

            {/* ── Información General del Servicio (full-width) ── */}
            <div style={{ gridColumn: '1 / -1' }}>
              <CardColapsable icon="📋" title="Información del Servicio Solicitado">

                {/* Cuerpo — tres columnas */}
                <div style={{
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '8px 40px',
                }}>

                  {/* Columna 1: Quién solicita */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quién solicita</p>
                    <IconField icon="🏢" label="Empresa"   value={solicitud.empresa  ?? '—'} />
                    <IconField icon="👤" label="Contacto"  value={solicitud.contacto ?? '—'} />
                    <IconField icon="📞" label="Teléfono"  value={solicitud.telefono ?? '—'} />
                    <IconField icon="✉️" label="Email"     value={solicitud.email    || '—'} />
                  </div>

                  {/* Columna 2: Detalles del servicio */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detalles del servicio</p>
                    <IconField icon="🚚" label="Tipo de servicio"   value={solicitud.tipoServicio} />
                    <IconField icon="📦" label="Tipo de carga"      value={solicitud.tipoCarga} />
                    <IconField icon="📅" label="Fecha requerida"    value={formatDate(solicitud.fechaRequerida)} />
                    <IconField icon="📍" label="Origen"             value={origenNombre} />
                    <IconField icon="🎯" label="Destino"            value={destinoNombre ?? '—'} />
                    <IconField icon="📏" label="Tramo / distancia"  value={`${solicitud.tramoDistancia ?? '—'}${solicitud.distanciaKm ? ` · ${solicitud.distanciaKm} km` : ''}`} />
                    <IconField icon="⏱️" label="Tiempo de tránsito" value={solicitud.tiempoTransitoDesc ?? '—'} />
                  </div>

                  {/* Columna 3: Características de la carga */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Características de la carga</p>
                    <IconField icon="⚖️" label="Peso"
                      value={pesoKg > 0 ? `${pesoKg.toLocaleString('es-CO')} kg` : '—'} />
                    <IconField icon="📐" label="Dimensiones (L×A×A)"
                      value={[solicitud.dimLargoCm, solicitud.dimAnchoCm, solicitud.dimAltoCm].every(Boolean)
                        ? `${solicitud.dimLargoCm} × ${solicitud.dimAnchoCm} × ${solicitud.dimAltoCm} cm`
                        : '—'} />
                    <IconField icon="🧊" label="Volumen"
                      value={solicitud.volumenM3 ? `${Number(solicitud.volumenM3).toFixed(2)} m³` : '—'} />
                    <IconField icon="💰" label="Valor asegurado"
                      value={Number(solicitud.valorAsegurado) > 0 ? formatCOP(Number(solicitud.valorAsegurado)) : '—'} />
                    <IconField icon="🚛" label="Vehículo sugerido"
                      value={solicitud.vehiculoSugeridoNombre ?? '—'} />
                  </div>
                </div>

                {/* Observaciones — al pie si existen */}
                {solicitud.observaciones && (
                  <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #F3F4F6' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💬</span>
                      <span style={{ fontWeight: 600 }}>Observaciones del cliente</span>
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{solicitud.observaciones}</p>
                  </div>
                )}
                {/* Condiciones especiales — embebidas al pie del card */}
                <div style={{ padding: '16px 24px 20px', borderTop: '1px solid #F3F4F6' }}>
                  <CondicionesEspeciales
                    embedded
                    condiciones={[
                      { key: 'servicioExpreso',          icon: '⚡',  label: 'Servicio expreso',                                                              activo: !!solicitud.servicioExpreso,         sugerido: 0       },
                      { key: 'cargaPeligrosa',          icon: '☢️',  label: 'Carga peligrosa',           detail: solicitud.detalleCargaPeligrosa,    activo: !!solicitud.cargaPeligrosa,          sugerido: 150_000 },
                      { key: 'cargaFragil',              icon: '🥚',  label: 'Carga frágil',                                                              activo: !!solicitud.cargaFragil,             sugerido: 80_000  },
                      { key: 'requiereEscolta',          icon: '🛡️',  label: 'Requiere escolta',                                                          activo: !!solicitud.requiereEscolta,         sugerido: 350_000 },
                      { key: 'cargaSobredimensionada',   icon: '📏',  label: 'Carga sobredimensionada',    detail: solicitud.detalleSobredimensionada,  activo: !!solicitud.cargaSobredimensionada,  sugerido: 200_000 },
                      { key: 'accesosDificiles',         icon: '🚧', label: 'Accesos difíciles',           detail: solicitud.detalleAccesosDificiles,  activo: !!solicitud.accesosDificiles,        sugerido: 100_000 },
                      { key: 'necesitaEmpaque',          icon: '📦',  label: 'Necesita empaque',                                                          activo: !!solicitud.necesitaEmpaque,         sugerido: 60_000  },
                      { key: 'multiplesDestinosEntrega', icon: '🗺️', label: 'Múltiples destinos',          detail: solicitud.detalleMultiplesDestinos, activo: !!solicitud.multiplesDestinosEntrega,sugerido: 120_000 },
                      { key: 'ayudanteCargue',           icon: '💪',  label: 'Ayudante en cargue',                                                        activo: !!solicitud.ayudanteCargue,          sugerido: 80_000  },
                      { key: 'ayudanteDescargue',        icon: '💪',  label: 'Ayudante en descargue',                                                     activo: !!solicitud.ayudanteDescargue,       sugerido: 80_000  },
                    ] satisfies Condicion[]}
                  />
                </div>
              </CardColapsable>
            </div>

          </div>

          {/* ── Sección cotización ── */}
          {cotizacion && desgloseCv && desgloseCf
            && cvTotal !== null && cfViaje !== null
            && fleteRef !== null && tarifaSugerida !== null && margen !== null ? (
            <>
              {/* Build active conditions list for PanelComercial */}
              {(() => {
                const condicionesActivas = [
                  { key: 'servicioExpreso',          icon: '⚡',  label: 'Servicio expreso',          monto: 0,       activo: !!solicitud.servicioExpreso },
                  { key: 'cargaPeligrosa',          icon: '☢️',  label: 'Carga peligrosa',          monto: 150_000, activo: !!solicitud.cargaPeligrosa },
                  { key: 'cargaFragil',              icon: '🥚',  label: 'Carga frágil',              monto: 80_000,  activo: !!solicitud.cargaFragil },
                  { key: 'requiereEscolta',          icon: '🛡️',  label: 'Requiere escolta',          monto: 350_000, activo: !!solicitud.requiereEscolta },
                  { key: 'cargaSobredimensionada',   icon: '📏',  label: 'Carga sobredimensionada',   monto: 200_000, activo: !!solicitud.cargaSobredimensionada },
                  { key: 'accesosDificiles',         icon: '🚧', label: 'Accesos difíciles',          monto: 100_000, activo: !!solicitud.accesosDificiles },
                  { key: 'necesitaEmpaque',          icon: '📦',  label: 'Necesita empaque',          monto: 60_000,  activo: !!solicitud.necesitaEmpaque },
                  { key: 'multiplesDestinosEntrega', icon: '🗺️', label: 'Múltiples destinos',         monto: 120_000, activo: !!solicitud.multiplesDestinosEntrega },
                  { key: 'ayudanteCargue',           icon: '💪',  label: 'Ayudante en cargue',        monto: 80_000,  activo: !!solicitud.ayudanteCargue },
                  { key: 'ayudanteDescargue',        icon: '💪',  label: 'Ayudante en descargue',     monto: 80_000,  activo: !!solicitud.ayudanteDescargue },
                ]
                return (
                  <>
                    <DesgloseSisetac
                desgloseCv={desgloseCv}
                desgloseCf={desgloseCf}
                cvTotal={cvTotal}
                cfViaje={cfViaje}
                fleteRef={fleteRef}
                tarifaSugerida={tarifaSugerida}
                margen={margen}
                distanciaKm={cotizacion.distanciaKm}
                configVehiculo={cotizacion.configVehiculo}
                params_={params_}
              />

              {/* ── Base Mercado RNDC ── */}
              <div style={{ marginTop: 24 }}>
                <BaseRndc
                  rndcData={rndcData}
                  fleteRef={fleteRef}
                  tarifaSugerida={tarifaSugerida}
                />
              </div>

              {/* ── Panel Comercial ── */}
              <div style={{ marginTop: 24 }}>
                <PanelComercial
                  solicitudId={solicitud.id}
                  cotizacionActualId={cotizacion.id}
                  vehiculoActual={cotizacion.configVehiculo}
                  margenActual={Number(cotizacion.margenAplicado)}
                  fleteRefActual={Number(cotizacion.fleteReferencialSisetac)}
                  pesoKg={solicitud.pesoKg ? Number(solicitud.pesoKg) : null}
                  distanciaKm={cotizacion.distanciaKm}
                  origen={origenNombre}
                  destino={destinoNombre}
                  condicionesEspeciales={condicionesActivas}
                />
              </div>
                  </>
                )
              })()}

            </>
          ) : (
            /* ── Sin cotización ── */
            <div style={{
              marginTop: 32,
              background: '#FFFFFF',
              borderRadius: 16,
              border: '2px dashed #D1D5DB',
              padding: '40px 32px',
              textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 40 }}>📋</p>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                Esta solicitud aún no tiene cotización
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280' }}>
                La solicitud se encuentra en estado <strong>{solicitud.estado}</strong>.
                {solicitud.distanciaKm && Number(solicitud.distanciaKm) > 0
                  ? ' Puedes generar la cotización SISETAC ahora.'
                  : ' Completa el flujo del cotizador para tener todos los datos necesarios.'}
              </p>
              {solicitud.distanciaKm && Number(solicitud.distanciaKm) > 0 ? (
                <CotizarButton solicitudId={solicitud.id} />
              ) : (
                <Link
                  href={`/cotizar?reanudar=${solicitud.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 24px', background: '#059669', color: '#FFFFFF',
                    borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  }}
                >
                  Completar cotizador →
                </Link>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
