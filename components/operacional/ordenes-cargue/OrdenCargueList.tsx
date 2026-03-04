'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { OrdenCargueConRelaciones } from '@/lib/repositories/ordenCargueRepository';
import type { EstadoOrdenCargue } from '@prisma/client';
import { Btn } from '@/components/operacional/shared/Btn';
import {
  useDebouncedPush,
  formatFechaHora,
  genericSort,
  type SortDir,
  inputStyle,
  selectStyle,
  FilterCard,
  TableCard,
  EmptyState,
  ClearFiltersButton,
  ExportCsvButton,
  Pagination,
  Th,
} from '@/components/operacional/shared/ListUtils';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const ESTADO_STYLES: Record<EstadoOrdenCargue, { bg: string; color: string; label: string }> = {
  BORRADOR:   { bg: '#F3F4F6', color: '#6B7280', label: 'Borrador'   },
  ASIGNADA:   { bg: '#EFF6FF', color: '#1D4ED8', label: 'Asignada'   },
  EN_CURSO:   { bg: '#FEF9C3', color: '#92400E', label: 'En curso'   },
  COMPLETADA: { bg: '#D1FAE5', color: '#065F46', label: 'Completada' },
  CANCELADA:  { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelada'  },
};

const ESTADOS_FILTRO: { value: string; label: string }[] = [
  { value: 'BORRADOR',   label: 'Borrador'   },
  { value: 'ASIGNADA',   label: 'Asignada'   },
  { value: 'EN_CURSO',   label: 'En curso'   },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA',  label: 'Cancelada'  },
];

type SortKey = 'numero' | 'negocio' | 'vehiculo' | 'conductor' | 'fechaCargue' | 'lugar' | 'estado';

function getSortValue(o: OrdenCargueConRelaciones, key: SortKey): string | number {
  switch (key) {
    case 'numero':      return o.numeroOrden;
    case 'negocio':     return o.nuevoNegocio.codigoNegocio;
    case 'vehiculo':    return o.vehiculoPlaca ?? '';
    case 'conductor':   return o.conductor ? `${o.conductor.apellidos} ${o.conductor.nombres}` : '';
    case 'fechaCargue': return o.fechaHoraCargue ? new Date(o.fechaHoraCargue).getTime() : 0;
    case 'lugar':       return o.puntoCargueMunicipio ?? '';
    case 'estado':      return o.estado;
    default:            return '';
  }
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

interface Props {
  items:    OrdenCargueConRelaciones[];
  total:    number;
  page:     number;
  pageSize: number;
  q:        string;
  estado:   string;
  onEdit:   (o: OrdenCargueConRelaciones) => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function OrdenCargueList({ items, total, page, pageSize, q, estado, onEdit }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const debouncedPush = useDebouncedPush();

  const [cancelling, setCancelling] = useState<string | null>(null);
  const [sortKey, setSortKey]       = useState<SortKey>('numero');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');

  function toggleSort(key: string) {
    const k = key as SortKey;
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  const sorted = useMemo(
    () => genericSort(items, i => getSortValue(i, sortKey), sortDir),
    [items, sortKey, sortDir],
  );

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k); });
    return `/operacional/ordenes-cargue?${p.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter  = !!(q || estado);

  async function handleCancel(id: string, numero: string) {
    if (!confirm(`¿Cancelar orden ${numero}?`)) return;
    setCancelling(id);
    try {
      await fetch(`/api/ordenes-cargue/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Filters ── */}
        <FilterCard>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por código, placa, municipio…"
              defaultValue={q}
              onChange={e => debouncedPush(buildUrl({ q: e.target.value, page: '1' }))}
              style={inputStyle}
            />
            <select
              defaultValue={estado}
              onChange={e => { window.location.href = buildUrl({ estado: e.target.value, page: '1' }); }}
              style={selectStyle}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_FILTRO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <ExportCsvButton buildExportUrl={() => {
              const p = new URLSearchParams();
              if (q)      p.set('q', q);
              if (estado) p.set('estado', estado);
              return `/api/ordenes-cargue/export-csv?${p.toString()}`;
            }} />
            {hasFilter && <ClearFiltersButton baseUrl="/operacional/ordenes-cargue" />}
          </div>
        </FilterCard>

        {/* ── Table ── */}
        <TableCard>
          {items.length === 0 ? (
            <EmptyState hasFilter={hasFilter} emptyText='Aún no hay órdenes de cargue. Crea la primera con "+ Nueva orden".' />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  <Th label="#Orden"    sortKey="numero"      currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Negocio"   sortKey="negocio"     currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Vehículo"  sortKey="vehiculo"    currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Conductor" sortKey="conductor"   currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Cargue"    sortKey="fechaCargue" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Lugar"     sortKey="lugar"       currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Estado"    sortKey="estado"      currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <th style={{ padding: '12px 16px', width: 160 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((o, idx) => {
                  const estilo = ESTADO_STYLES[o.estado];
                  const editable = !['COMPLETADA', 'CANCELADA'].includes(o.estado);
                  return (
                    <tr
                      key={o.id}
                      style={{ borderBottom: idx < sorted.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', fontSize: 14 }}>
                        {o.numeroOrden}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{o.nuevoNegocio.codigoNegocio}</div>
                        {o.nuevoNegocio.clienteNombre && <div style={{ fontSize: 12, color: '#6B7280' }}>{o.nuevoNegocio.clienteNombre}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#374151', fontSize: 14 }}>
                        {o.vehiculoPlaca ?? <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#374151', fontSize: 13 }}>
                        {o.conductor
                          ? `${o.conductor.nombres} ${o.conductor.apellidos}`
                          : <span style={{ color: '#D1D5DB' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {o.fechaHoraCargue
                          ? formatFechaHora(o.fechaHoraCargue)
                          : <span style={{ color: '#D1D5DB' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: 12 }}>
                        {o.puntoCargueMunicipio
                          ? <span>{o.puntoCargueMunicipio}{o.puntoCargueDireccion && <><br /><span style={{ color: '#9CA3AF' }}>{o.puntoCargueDireccion}</span></>}</span>
                          : <span style={{ color: '#D1D5DB' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: estilo.bg, color: estilo.color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {estilo.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {editable && (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Btn variant="secondary" size="sm" onClick={() => onEdit(o)}>
                              Editar
                            </Btn>
                            <Btn
                              variant="danger" size="sm"
                              onClick={() => handleCancel(o.id, o.numeroOrden)}
                              loading={cancelling === o.id}
                            >
                              {cancelling === o.id ? '…' : 'Cancelar'}
                            </Btn>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableCard>

        {/* ── Pagination ── */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          noun="orden"
          nounPlural="órdenes"
          buildUrl={buildUrl}
        />
      </div>
    </div>
  );
}
