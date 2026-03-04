'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { NuevoNegocio, EstadoNegocio } from '@prisma/client';
import { NegocioEstadoBadge } from './NegocioEstadoBadge';
import {
  useDebouncedPush,
  formatFecha,
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
  VerButton,
} from '@/components/operacional/shared/ListUtils';
import { colors } from '@/lib/theme/colors';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const ESTADOS: { value: EstadoNegocio; label: string }[] = [
  { value: 'CONFIRMADO',     label: 'Confirmado' },
  { value: 'EN_PREPARACION', label: 'En preparación' },
  { value: 'EN_TRANSITO',    label: 'En tránsito' },
  { value: 'COMPLETADO',     label: 'Completado' },
  { value: 'CANCELADO',      label: 'Cancelado' },
];

type SortKey = 'codigo' | 'cliente' | 'estado' | 'fechaDespacho';

function isFechaVencida(date: Date | string | null | undefined, estado: EstadoNegocio): boolean {
  if (!date) return false;
  if (estado === 'COMPLETADO' || estado === 'CANCELADO') return false;
  return new Date(date) < new Date();
}

function getSortValue(n: NuevoNegocio, key: SortKey): string | number {
  switch (key) {
    case 'codigo':        return n.codigoNegocio;
    case 'cliente':       return n.clienteNombre ?? '';
    case 'estado':        return n.estado;
    case 'fechaDespacho': return n.fechaDespachoEstimada ? new Date(n.fechaDespachoEstimada).getTime() : 0;
    default:              return '';
  }
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface NegocioListProps {
  items:    NuevoNegocio[];
  total:    number;
  page:     number;
  pageSize: number;
  q?:       string;
  estado?:  string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function NegocioList({
  items,
  total,
  page,
  pageSize,
  q      = '',
  estado = '',
}: NegocioListProps) {
  const searchParams  = useSearchParams();
  const debouncedPush = useDebouncedPush();

  const [sortKey, setSortKey] = useState<SortKey>('codigo');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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
    return `/operacional/negocios?${p.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter  = !!(q || estado);

  return (
    <div style={{ background: colors.pageBg, minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Filters ── */}
        <FilterCard>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar código o cliente…"
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
              {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <ExportCsvButton buildExportUrl={() => {
              const p = new URLSearchParams();
              if (q)      p.set('q', q);
              if (estado) p.set('estado', estado);
              return `/api/negocios/export-csv?${p.toString()}`;
            }} />
            {hasFilter && <ClearFiltersButton baseUrl="/operacional/negocios" />}
          </div>
        </FilterCard>

        {/* ── Table ── */}
        <TableCard>
          {items.length === 0 ? (
            <EmptyState hasFilter={hasFilter} emptyText="Aún no hay negocios registrados." />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderLight}`, background: colors.bgLight }}>
                  <Th label="Código"       sortKey="codigo"        currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Cliente"       sortKey="cliente"       currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Estado"        sortKey="estado"        currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Despacho est." sortKey="fechaDespacho" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <th style={{ padding: '12px 16px', width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((n, idx) => {
                  const vencida = isFechaVencida(n.fechaDespachoEstimada, n.estado);
                  return (
                    <tr
                      key={n.id}
                      style={{ borderBottom: idx < sorted.length - 1 ? `1px solid ${colors.borderLighter}` : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = colors.bgLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <Link
                          href={`/operacional/negocios/${n.id}`}
                          style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: colors.blue, textDecoration: 'none' }}
                        >
                          {n.codigoNegocio}
                        </Link>
                      </td>
                      <td style={{ padding: '14px 16px', color: colors.textDefault, fontSize: 14 }}>
                        {n.clienteNombre ?? <span style={{ fontStyle: 'italic', color: colors.textPlaceholder }}>Sin nombre</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <NegocioEstadoBadge estado={n.estado} />
                      </td>
                      <td style={{ padding: '14px 16px', fontVariantNumeric: 'tabular-nums', color: vencida ? colors.danger : colors.textMuted, fontWeight: vencida ? 600 : 400, fontSize: 14 }}>
                        {formatFecha(n.fechaDespachoEstimada)}
                        {vencida && <span style={{ marginLeft: 4, fontSize: 11 }}>(vencida)</span>}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <VerButton href={`/operacional/negocios/${n.id}`} />
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
          noun="negocio"
          nounPlural="negocios"
          buildUrl={buildUrl}
        />
      </div>
    </div>
  );
}
