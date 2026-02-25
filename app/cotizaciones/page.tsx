/**
 * Página de Solicitudes / Cotizaciones
 *
 * Server Component — consulta directamente Prisma.
 * Muestra TODAS las solicitudes desde borrador hasta cotizada,
 * incluyendo los datos de cotización SISETAC cuando ya fueron calculados.
 */

import React, { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '.prisma/client'
import { BuscadorCotizaciones } from '@/components/cotizaciones/BuscadorCotizaciones'
import { DEPARTAMENTOS } from '@/app/cotizar/config/colombia-dane'

// Never pre-render at build time — requires DATABASE_URL at runtime
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cotizaciones | CargoClick',
}

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

const SOL_ESTADOS: Record<string, { bg: string; text: string; label: string }> = {
  EN_PROGRESO: { bg: '#FEF3C7', text: '#92400E', label: 'En progreso' },
  PENDIENTE:   { bg: '#DBEAFE', text: '#1E40AF', label: 'Pendiente' },
  COTIZADO:    { bg: '#D1FAE5', text: '#065F46', label: 'Cotizado' },
  COMPLETADA:  { bg: '#EDE9FE', text: '#5B21B6', label: 'Completada' },
  CANCELADA:   { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelada' },
  RECHAZADO:   { bg: '#FEE2E2', text: '#991B1B', label: 'Rechazado' },
  CERRADO:     { bg: '#F3F4F6', text: '#374151', label: 'Cerrado' },
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

/** Lookup DANE code → city name */
const DANE_MAP: Map<string, string> = new Map(
  DEPARTAMENTOS.flatMap(dep => dep.municipios.map(m => [m.codigo, m.nombre]))
)
function daneToNombre(code: string | null | undefined): string {
  if (!code) return ''
  return DANE_MAP.get(code) ?? code
}

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

// ─── Tipos y helpers de URL ────────────────────────────────────────────────

type RawParams = Record<string, string>

const VALID_SORT_FIELDS = ['createdAt', 'empresa', 'contacto', 'estado'] as const
type SortField = (typeof VALID_SORT_FIELDS)[number]

/** Genera la URL para ordenar por un campo, invirtiendo dirección si ya está activo */
function buildSortLink(params: RawParams, field: SortField): string {
  const p = new URLSearchParams()
  if (params.q) p.set('q', params.q)
  p.set('sortBy', field)
  if (params.sortBy === field) {
    p.set('sortDir', params.sortDir === 'asc' ? 'desc' : 'asc')
  } else {
    p.set('sortDir', field === 'createdAt' ? 'desc' : 'asc')
  }
  p.set('page', '1')
  return `/cotizaciones?${p.toString()}`
}

/** Genera la URL de una página conservando filtro y ordenamiento */
function buildPageLink(params: RawParams, page: number): string {
  const p = new URLSearchParams()
  if (params.q) p.set('q', params.q)
  if (params.sortBy) p.set('sortBy', params.sortBy)
  if (params.sortDir) p.set('sortDir', params.sortDir)
  p.set('page', String(page))
  return `/cotizaciones?${p.toString()}`
}

/** Genera el rango de páginas visibles con elipsis */
function paginationRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const delta = 2
  const range: (number | '…')[] = [1]
  const left = current - delta
  const right = current + delta
  if (left > 2) range.push('…')
  for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) range.push(i)
  if (right < total - 1) range.push('…')
  range.push(total)
  return range
}

/** Estilos para botones de paginación */
function pagBtnStyle(active: boolean, disabled = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 36, height: 34, padding: '0 10px',
    borderRadius: 8, fontSize: 13, fontWeight: active ? 800 : 500,
    textDecoration: 'none', whiteSpace: 'nowrap',
    background: active ? '#1D4ED8' : disabled ? 'transparent' : '#FFFFFF',
    color: active ? '#FFFFFF' : disabled ? '#D1D5DB' : '#374151',
    border: `1px solid ${active ? '#1D4ED8' : disabled ? '#E5E7EB' : '#D1D5DB'}`,
    pointerEvents: (disabled ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
  }
}

/** Encabezado de columna con enlace de ordenamiento */
function SortHeader({
  href, label, field, sortBy, sortDir, align = 'left',
}: {
  href: string; label: string; field: SortField
  sortBy: string; sortDir: string; align?: 'left' | 'center' | 'right'
}) {
  const active = sortBy === field
  const arrow  = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  return (
    <th style={{
      padding: '10px 14px', textAlign: align,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      <Link href={href} style={{
        color: active ? '#1D4ED8' : '#6B7280', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 2,
      }}>
        {label}{arrow}
      </Link>
    </th>
  )
}

const PAGE_SIZE = 20

// ─── Página principal ──────────────────────────────────────────────────────

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const params: RawParams = {
    q:       String(Array.isArray(raw.q)       ? (raw.q[0]       ?? '') : (raw.q       ?? '')),
    sortBy:  String(Array.isArray(raw.sortBy)  ? (raw.sortBy[0]  ?? '') : (raw.sortBy  ?? '')),
    sortDir: String(Array.isArray(raw.sortDir) ? (raw.sortDir[0] ?? '') : (raw.sortDir ?? '')),
    page:    String(Array.isArray(raw.page)    ? (raw.page[0]    ?? '1'): (raw.page    ?? '1')),
  }

  const q       = params.q
  const sortBy  = (VALID_SORT_FIELDS as readonly string[]).includes(params.sortBy)
    ? (params.sortBy as SortField)
    : 'createdAt'
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc'
  const page    = Math.max(1, parseInt(params.page, 10) || 1)

  // ── Cláusula de búsqueda ─────────────────────────────────────────────────
  const where: Prisma.SolicitudWhereInput = q
    ? {
        OR: [
          { empresa:  { contains: q, mode: 'insensitive' } },
          { contacto: { contains: q, mode: 'insensitive' } },
          { telefono: { contains: q, mode: 'insensitive' } },
          { origen:   { contains: q, mode: 'insensitive' } },
          { destino:  { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  // ── Ordenamiento ─────────────────────────────────────────────────────────
  const orderBy: Prisma.SolicitudOrderByWithRelationInput = { [sortBy]: sortDir }

  // ── Include para la tabla ─────────────────────────────────────────────────
  const tableInclude = {
    cotizaciones: {
      orderBy: { createdAt: 'desc' as const },
      take: 1,
      include: {
        ajustesComerciales: {
          where: { estadoNegociacion: { notIn: ['CANCELADO', 'RECHAZADO'] } },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: {
            estadoNegociacion: true,
            tarifaOfertadaCliente: true,
            tarifaConfirmadaCliente: true,
            nombreComercial: true,
          },
        },
      },
    },
  } satisfies Prisma.SolicitudInclude

  // ── Consultas en paralelo ─────────────────────────────────────────────────
  const [
    filteredCount,
    solicitudes,
    estadoGroups,
    enNegociacionCount,
    tarifaAgg,
  ] = await Promise.all([
    // 1. Total de filas que coinciden con el filtro activo (para paginación)
    prisma.solicitud.count({ where }),
    // 2. Página actual filtrada y ordenada
    prisma.solicitud.findMany({
      where, orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: tableInclude,
    }),
    // 3. Conteo global por estado (KPIs — nunca filtrados)
    prisma.solicitud.groupBy({ by: ['estado'], _count: { _all: true } }),
    // 4. Solicitudes con negociación activa (global)
    prisma.solicitud.count({
      where: {
        cotizaciones: {
          some: { ajustesComerciales: { some: { estadoNegociacion: { in: ['EN_OFERTA', 'EN_NEGOCIACION'] } } } },
        },
      },
    }),
    // 5. Suma de tarifas sugeridas sobre todas las cotizaciones (global)
    prisma.cotizacion.aggregate({ _sum: { tarifaSugerida: true } }),
  ])

  // ── KPIs globales ─────────────────────────────────────────────────────────
  const totalGlobal = estadoGroups.reduce((s, g) => s + g._count._all, 0)
  const enProgreso  = estadoGroups.find(g => g.estado === 'EN_PROGRESO')?._count._all ?? 0
  const cotizadas   = estadoGroups.find(g => g.estado === 'COTIZADO')?._count._all    ?? 0
  const tarifaTotal = Number(tarifaAgg._sum.tarifaSugerida ?? 0)
  const totalPages  = Math.ceil(filteredCount / PAGE_SIZE)
  const currentParams: RawParams = { q, sortBy, sortDir, page: String(page) }

  return (
    <>
      <Header />
      <main style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60 }}>

        {/* ── Encabezado ──────────────────────────────────────────────── */}
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
                  Solicitudes y Cotizaciones
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
                  Todas las solicitudes desde borrador hasta cotización cerrada
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

          {/* ── KPIs — siempre globales, sin importar el filtro ─────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total solicitudes', value: totalGlobal,            icon: '📋', color: '#1D4ED8' },
              { label: 'En progreso',        value: enProgreso,             icon: '⏳', color: '#D97706' },
              { label: 'Cotizadas',          value: cotizadas,              icon: '✅', color: '#059669' },
              { label: 'En negociación',     value: enNegociacionCount,     icon: '🤝', color: '#7C3AED' },
              { label: 'Suma tarifas',       value: formatCOP(tarifaTotal), icon: '💰', color: '#065F46' },
            ].map(m => (
              <div key={m.label} style={{
                background: '#FFFFFF', borderRadius: 12, padding: '18px 20px',
                border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  {m.icon} {m.label}
                </p>
                <p style={{ margin: 0, fontSize: typeof m.value === 'string' ? 16 : 28, fontWeight: 900, color: m.color }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Contenedor tabla ──────────────────────────────────────────── */}
          <div style={{
            background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB',
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>

            {/* Barra de herramientas */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #E5E7EB',
              background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 16 }}>📑</span>

              {/* Buscador — cliente, envuelto en Suspense */}
              <Suspense fallback={
                <div style={{ width: 300, height: 38, borderRadius: 10, background: '#E5E7EB' }} />
              }>
                <BuscadorCotizaciones initialValue={q} />
              </Suspense>

              <span style={{ fontSize: 13, color: '#6B7280' }}>
                {q
                  ? <><strong style={{ color: '#111827' }}>{filteredCount}</strong> resultado{filteredCount !== 1 ? 's' : ''} para &ldquo;{q}&rdquo;</>
                  : <><strong style={{ color: '#111827' }}>{totalGlobal}</strong> solicitud{totalGlobal !== 1 ? 'es' : ''} registrada{totalGlobal !== 1 ? 's' : ''}</>
                }
              </span>

              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
                {sortBy === 'createdAt' && `Fecha ${sortDir === 'desc' ? '↓ más reciente' : '↑ más antiguo'}`}
                {sortBy === 'empresa'   && `Cliente ${sortDir === 'asc' ? 'A → Z' : 'Z → A'}`}
                {sortBy === 'contacto'  && `Contacto ${sortDir === 'asc' ? 'A → Z' : 'Z → A'}`}
                {sortBy === 'estado'    && `Estado ${sortDir === 'asc' ? 'A → Z' : 'Z → A'}`}
              </span>
            </div>

            {filteredCount === 0 ? (
              <div style={{ padding: '60px 32px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: 40 }}>{q ? '🔍' : '📭'}</p>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                  {q ? `Sin resultados para "${q}"` : 'Sin solicitudes todavía'}
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280' }}>
                  {q ? 'Intenta con otros términos de búsqueda.' : 'Genera la primera desde el cotizador.'}
                </p>
                {q ? (
                  <Link href="/cotizaciones" style={{
                    display: 'inline-block', padding: '10px 24px', background: '#6B7280',
                    color: '#FFFFFF', borderRadius: 8, fontWeight: 700, textDecoration: 'none',
                  }}>Ver todas las solicitudes</Link>
                ) : (
                  <Link href="/cotizar" style={{
                    display: 'inline-block', padding: '10px 24px', background: '#059669',
                    color: '#FFFFFF', borderRadius: 8, fontWeight: 700, textDecoration: 'none',
                  }}>Ir al cotizador</Link>
                )}
              </div>
            ) : (
              <>
                <style>{`.sol-row:hover { background: #EFF6FF !important; }`}</style>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                        <SortHeader href={buildSortLink(currentParams, 'createdAt')} label="Fecha"          field="createdAt" sortBy={sortBy} sortDir={sortDir} align="left"   />
                        <SortHeader href={buildSortLink(currentParams, 'empresa')}   label="Cliente"        field="empresa"   sortBy={sortBy} sortDir={sortDir} align="left"   />
                        <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', textAlign: 'right' }}>Base SISETAC</th>
                        <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', textAlign: 'right' }}>Base Manifiestos</th>
                        <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', textAlign: 'right' }}>Valor cotizado</th>
                        <SortHeader href={buildSortLink(currentParams, 'estado')}    label="Estado"         field="estado"    sortBy={sortBy} sortDir={sortDir} align="center" />
                        <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', textAlign: 'center' }}>Negociación</th>
                        <th style={{ padding: '10px 14px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudes.map((s, i) => {
                        const cot      = s.cotizaciones[0] ?? null
                        const ajuste   = cot?.ajustesComerciales[0] ?? null
                        const solEst   = SOL_ESTADOS[s.estado] ?? { bg: '#F3F4F6', text: '#374151', label: s.estado }
                        const negEst   = ajuste ? (NEG_ESTADOS[ajuste.estadoNegociacion] ?? NEG_ESTADOS.BORRADOR) : null

                        return (
                          <tr key={s.id} className="sol-row" style={{
                            background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                            borderBottom: '1px solid #F3F4F6',
                          }}>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#6B7280', fontSize: 12 }}>
                              {formatDate(s.createdAt)}
                            </td>
                            <td style={{ padding: '12px 14px', minWidth: 230 }}>
                              {/* Empresa */}
                              {s.empresa
                                ? <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 13 }}>{s.empresa}</p>
                                : <p style={{ margin: 0, fontWeight: 700, color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' }}>Sin empresa</p>}
                              {/* Contacto */}
                              {s.contacto && (
                                <p style={{ margin: '1px 0 0', fontSize: 12, color: '#374151' }}>{s.contacto}</p>
                              )}
                              {/* Referencia y ruta */}
                              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
                                #COT-{s.codigoRef}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
                                {s.origen
                                  ? <>{daneToNombre(s.origen)}{s.destino && <> <span style={{ color: '#9CA3AF' }}>→</span> {daneToNombre(s.destino)}</>}</>
                                  : <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>Sin ruta</span>}
                              </p>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', color: '#374151' }}>
                              {cot ? formatCOP(Number(cot.fleteReferencialSisetac)) : <span style={{ color: '#D1D5DB' }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', color: '#374151' }}>
                              {cot && cot.rndcEstimado != null
                                ? <>
                                    <span>{formatCOP(Number(cot.rndcEstimado))}</span>
                                    {cot.rndcConfianza && (
                                      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9CA3AF' }}>
                                        {cot.rndcConfianza === 'ALTA' ? '🟢' : cot.rndcConfianza === 'MEDIA' ? '🟡' : '🔴'} {cot.rndcConfianza}
                                      </p>
                                    )}
                                  </>
                                : <span style={{ color: '#D1D5DB' }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              {cot ? (
                                (() => {
                                  const valorFinal = ajuste?.tarifaConfirmadaCliente ?? ajuste?.tarifaOfertadaCliente ?? cot.tarifaSugerida
                                  const esConfirmada = !!ajuste?.tarifaConfirmadaCliente
                                  const esOfertada   = !!ajuste?.tarifaOfertadaCliente && !ajuste.tarifaConfirmadaCliente
                                  return (
                                    <>
                                      <span style={{ fontWeight: 800, fontSize: 14, color: esConfirmada ? '#7C3AED' : esOfertada ? '#1D4ED8' : '#065F46' }}>
                                        {formatCOP(Number(valorFinal))}
                                      </span>
                                      {esConfirmada && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#7C3AED' }}>Confirmada</p>}
                                      {esOfertada   && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#1D4ED8' }}>Ofertada</p>}
                                      {!esConfirmada && !esOfertada && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9CA3AF' }}>Base SISETAC</p>}
                                    </>
                                  )
                                })()
                              ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <Badge label={solEst.label} bg={solEst.bg} text={solEst.text} />
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              {ajuste && negEst ? (
                                <div>
                                  <Badge label={ajuste.estadoNegociacion.replace(/_/g, ' ')} bg={negEst.bg} text={negEst.text} />
                                  {ajuste.nombreComercial && (
                                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9CA3AF' }}>{ajuste.nombreComercial}</p>
                                  )}
                                </div>
                              ) : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <Link
                                href={`/solicitudes/${s.codigoRef}`}
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

                {/* ── Pie de tabla: suma global + paginación ─────────────── */}
                <div style={{
                  padding: '14px 20px', borderTop: '2px solid #E5E7EB',
                  background: '#F9FAFB', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                }}>
                  {/* Suma de tarifas (siempre global) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Suma total de tarifas:</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#065F46' }}>
                      {formatCOP(tarifaTotal)}
                    </span>
                  </div>

                  {/* Paginación — server-rendered links, sin JS */}
                  {totalPages > 1 ? (
                    <nav aria-label="Paginación" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      {page > 1
                        ? <Link href={buildPageLink(currentParams, page - 1)} style={pagBtnStyle(false)}>← Ant.</Link>
                        : <span style={pagBtnStyle(false, true)}>← Ant.</span>
                      }

                      {paginationRange(page, totalPages).map((p, idx) =>
                        p === '…'
                          ? <span key={`e${idx}`} style={{ padding: '0 4px', fontSize: 13, color: '#9CA3AF' }}>…</span>
                          : <Link key={p} href={buildPageLink(currentParams, p)} style={pagBtnStyle(p === page)}>{p}</Link>
                      )}

                      {page < totalPages
                        ? <Link href={buildPageLink(currentParams, page + 1)} style={pagBtnStyle(false)}>Sig. →</Link>
                        : <span style={pagBtnStyle(false, true)}>Sig. →</span>
                      }

                      <span style={{ marginLeft: 6, fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                        Pág. {page}/{totalPages} · {filteredCount} registros
                      </span>
                    </nav>
                  ) : (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {filteredCount} registro{filteredCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

