/**
 * Página de Reporte de Cotizaciones
 *
 * Server Component — consulta directamente Prisma.
 * Lista todas las cotizaciones con sus datos básicos y acceso
 * rápido a la solicitud correspondiente.
 */

import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/db/prisma'

export const metadata: Metadata = {
  title: 'Reporte de Cotizaciones | CargoClick',
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCOP(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
  }).format(d)
}

// ─── Colores de estado solicitud ──────────────────────────────

const SOL_ESTADOS: Record<string, { bg: string; text: string; label: string }> = {
  EN_PROGRESO: { bg: '#FEF3C7', text: '#92400E', label: 'En progreso' },
  PENDIENTE:   { bg: '#DBEAFE', text: '#1E40AF', label: 'Pendiente' },
  COTIZADO:    { bg: '#D1FAE5', text: '#065F46', label: 'Cotizado' },
  COMPLETADA:  { bg: '#D1FAE5', text: '#065F46', label: 'Completada' },
  CANCELADA:   { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelada' },
  RECHAZADO:   { bg: '#FEE2E2', text: '#991B1B', label: 'Rechazado' },
  CERRADO:     { bg: '#EDE9FE', text: '#5B21B6', label: 'Cerrado' },
}

const NEG_ESTADOS: Record<string, { bg: string; text: string }> = {
  BORRADOR:       { bg: '#F3F4F6', text: '#6B7280' },
  EN_OFERTA:      { bg: '#DBEAFE', text: '#1D4ED8' },
  EN_NEGOCIACION: { bg: '#FEF9C3', text: '#854D0E' },
  ACEPTADO:       { bg: '#D1FAE5', text: '#065F46' },
  CERRADO:        { bg: '#EDE9FE', text: '#5B21B6' },
  RECHAZADO:      { bg: '#FEE2E2', text: '#991B1B' },
  CANCELADO:      { bg: '#F3F4F6', text: '#9CA3AF' },
}

const CONFIG_LABEL: Record<string, string> = {
  C2: 'Camión 2E', C3: 'Camión 3E',
  C2S2: 'Tracto C2S2', C2S3: 'Tracto C2S3',
  C3S2: 'Tracto C3S2', C3S3: 'Tracto C3S3',
}

// ─── Componente Badge inline ─────────────────────────────────

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 9999,
      fontSize: 11, fontWeight: 700, background: bg, color: text,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ─── Página ───────────────────────────────────────────────────

export default async function CotizacionesPage() {
  // Traer todas las cotizaciones con datos de su solicitud
  const cotizaciones = await prisma.cotizacion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      solicitud: {
        select: {
          id: true,
          empresa: true,
          origen: true,
          destino: true,
          estado: true,
          tipoCarga: true,
          distanciaKm: true,
        },
      },
      ajustesComerciales: {
        where: {
          estadoNegociacion: { notIn: ['CANCELADO', 'RECHAZADO'] },
        },
        select: {
          estadoNegociacion: true,
          tarifaOfertadaCliente: true,
          tarifaConfirmadaCliente: true,
          nombreComercial: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  // ── Métricas de resumen ──
  const total = cotizaciones.length
  const conAjuste = cotizaciones.filter(c => c.ajustesComerciales.length > 0).length
  const cerradas = cotizaciones.filter(c => c.ajustesComerciales[0]?.estadoNegociacion === 'CERRADO').length
  const enNegociacion = cotizaciones.filter(c =>
    ['EN_OFERTA', 'EN_NEGOCIACION'].includes(c.ajustesComerciales[0]?.estadoNegociacion ?? '')
  ).length
  const tarifaTotal = cotizaciones.reduce((sum, c) => sum + Number(c.tarifaSugerida), 0)

  // ── Agrupar solicitds únicas ──
  const solicitudesUnicas = new Set(cotizaciones.map(c => c.solicitudId)).size

  return (
    <>
      <Header />
      <main style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60 }}>

        {/* ── Encabezado de sección ── */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '28px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6B7280' }}>
                  <Link href="/home" style={{ color: '#6B7280', textDecoration: 'none' }}>Inicio</Link>
                  {' / '}
                  <span style={{ color: '#111827' }}>Cotizaciones</span>
                </p>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
                  Reporte de Cotizaciones
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
                  Todas las simulaciones y análisis comerciales generados
                </p>
              </div>
              <Link
                href="/cotizar"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: '#059669', color: '#FFFFFF',
                  borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}
              >
                + Nueva cotización
              </Link>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

          {/* ── Tarjetas de métricas ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total cotizaciones', value: total, icon: '📊', color: '#1D4ED8' },
              { label: 'Solicitudes únicas', value: solicitudesUnicas, icon: '📋', color: '#059669' },
              { label: 'Con ajuste comercial', value: conAjuste, icon: '💼', color: '#D97706' },
              { label: 'En negociación', value: enNegociacion, icon: '🤝', color: '#7C3AED' },
              { label: 'Operaciones cerradas', value: cerradas, icon: '✅', color: '#065F46' },
            ].map(m => (
              <div key={m.label} style={{
                background: '#FFFFFF', borderRadius: 12, padding: '18px 20px',
                border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  {m.icon} {m.label}
                </p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* ── Tabla principal ── */}
          {cotizaciones.length === 0 ? (
            <div style={{
              background: '#FFFFFF', borderRadius: 16, border: '2px dashed #D1D5DB',
              padding: '60px 32px', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 40 }}>📭</p>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                Sin cotizaciones todavía
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280' }}>
                Genera la primera desde el cotizador.
              </p>
              <Link href="/cotizar" style={{
                display: 'inline-block', padding: '10px 24px', background: '#059669',
                color: '#FFFFFF', borderRadius: 8, fontWeight: 700, textDecoration: 'none',
              }}>
                Ir al cotizador
              </Link>
            </div>
          ) : (
            <div style={{
              background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB',
              overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              {/* Cabecera de tabla */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #E5E7EB',
                background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 16 }}>📑</span>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
                  {total} cotización{total !== 1 ? 'es' : ''} registrada{total !== 1 ? 's' : ''}
                </h2>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
                  Ordenadas por fecha de creación — más reciente primero
                </span>
              </div>

              {/* Estilos hover via CSS (server component — no event handlers) */}
              <style>{`
                .cot-row:hover { background: #EFF6FF !important; }
              `}</style>

              {/* Scroll horizontal para tablas anchas */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                      {[
                        ['Fecha', 'left'],
                        ['Empresa / Ruta', 'left'],
                        ['Vehículo', 'center'],
                        ['km', 'right'],
                        ['Piso SISETAC', 'right'],
                        ['Tarifa sugerida', 'right'],
                        ['Margen', 'right'],
                        ['Estado solicitud', 'center'],
                        ['Negociación', 'center'],
                        ['', 'center'],
                      ].map(([h, align]) => (
                        <th key={String(h)} style={{
                          padding: '10px 14px', textAlign: align as React.CSSProperties['textAlign'],
                          fontSize: 11, fontWeight: 700, color: '#6B7280',
                          textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cotizaciones.map((c, i) => {
                      const sol = c.solicitud
                      const ajuste = c.ajustesComerciales[0] ?? null
                      const solEstado = SOL_ESTADOS[sol.estado] ?? { bg: '#F3F4F6', text: '#374151', label: sol.estado }
                      const negEstado = ajuste ? (NEG_ESTADOS[ajuste.estadoNegociacion] ?? NEG_ESTADOS.BORRADOR) : null
                      const tarifa = formatCOP(Number(c.tarifaSugerida))
                      const pisoRef = formatCOP(Number(c.fleteReferencialSisetac))
                      const margen = `${Number(c.margenAplicado).toFixed(1)}%`

                      return (
                        <tr key={c.id} className="cot-row" style={{
                          background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                          borderBottom: '1px solid #F3F4F6',
                        }}>
                          {/* Fecha */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#6B7280', fontSize: 12 }}>
                            {formatDate(c.createdAt)}
                          </td>

                          {/* Empresa + ruta */}
                          <td style={{ padding: '12px 14px', minWidth: 220 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 13 }}>
                              {sol.empresa ?? <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Sin empresa</span>}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
                              {sol.origen}
                              {sol.destino && (
                                <> <span style={{ color: '#9CA3AF' }}>→</span> {sol.destino}</>
                              )}
                            </p>
                          </td>

                          {/* Vehículo */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 8px',
                              background: '#EFF6FF', color: '#1D4ED8',
                              borderRadius: 6, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                            }}>
                              {c.configVehiculo}
                            </span>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                              {CONFIG_LABEL[c.configVehiculo] ?? c.configVehiculo}
                            </p>
                          </td>

                          {/* km */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                            {Math.round(c.distanciaKm).toLocaleString('es-CO')}
                            <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>km</span>
                          </td>

                          {/* Piso SISETAC */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', color: '#374151' }}>
                            {pisoRef}
                          </td>

                          {/* Tarifa sugerida */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: '#065F46' }}>{tarifa}</span>
                            {ajuste?.tarifaConfirmadaCliente && (
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>
                                Confirmada: {formatCOP(Number(ajuste.tarifaConfirmadaCliente))}
                              </p>
                            )}
                            {ajuste?.tarifaOfertadaCliente && !ajuste.tarifaConfirmadaCliente && (
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#1D4ED8' }}>
                                Ofertada: {formatCOP(Number(ajuste.tarifaOfertadaCliente))}
                              </p>
                            )}
                          </td>

                          {/* Margen */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#374151' }}>
                            {margen}
                          </td>

                          {/* Estado solicitud */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <Badge label={solEstado.label} bg={solEstado.bg} text={solEstado.text} />
                          </td>

                          {/* Negociación */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {ajuste && negEstado ? (
                              <div>
                                <Badge label={ajuste.estadoNegociacion.replace('_', ' ')} bg={negEstado.bg} text={negEstado.text} />
                                {ajuste.nombreComercial && (
                                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9CA3AF' }}>{ajuste.nombreComercial}</p>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                            )}
                          </td>

                          {/* Acción */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <Link
                              href={`/solicitudes/${sol.id}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', background: '#1D4ED8', color: '#FFFFFF',
                                borderRadius: 7, fontWeight: 700, fontSize: 12,
                                textDecoration: 'none', whiteSpace: 'nowrap',
                              }}
                            >
                              Ver detalle →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer de tabla — total acumulado */}
              <div style={{
                padding: '14px 20px', borderTop: '2px solid #E5E7EB',
                background: '#F9FAFB', display: 'flex', justifyContent: 'flex-end',
                alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Suma de tarifas sugeridas:</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#065F46' }}>
                  {formatCOP(tarifaTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
