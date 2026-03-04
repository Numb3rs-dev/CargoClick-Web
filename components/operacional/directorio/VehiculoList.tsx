'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Vehiculo } from '@prisma/client';
import {
  useDebouncedPush,
  formatFecha,
  genericSort,
  type SortDir,
  inputStyle,
  FilterCard,
  TableCard,
  EmptyState,
  ClearFiltersButton,
  ExportCsvButton,
  Pagination,
  Th,
} from '@/components/operacional/shared/ListUtils';
import { colors } from '@/lib/theme/colors';

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

export type RndcStatus = { exitoso: boolean | null; createdAt?: Date | string };

export interface VehiculoWithRndc {
  vehiculo:    Vehiculo;
  rndcStatus?: RndcStatus;
}

type SortKey = 'placa' | 'configVehiculo' | 'propietario' | 'capacidad' | 'soat' | 'rndc' | 'estado';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function getRndcLabel(s?: RndcStatus): string {
  if (!s || s.exitoso === null) return 'Borrador';
  return s.exitoso ? 'Registrado' : 'Error RNDC';
}

function getRndcStyle(s?: RndcStatus): React.CSSProperties {
  const base: React.CSSProperties = { borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' };
  if (!s || s.exitoso === null) return { ...base, background: '#FEF3C7', color: '#92400E' };
  if (s.exitoso) return { ...base, background: colors.successBadgeBg, color: colors.primaryDark };
  return { ...base, background: colors.dangerBadgeBg, color: colors.dangerDark };
}

function getSortValue(item: VehiculoWithRndc, key: SortKey): string | number {
  switch (key) {
    case 'placa':           return item.vehiculo.placa;
    case 'configVehiculo':  return item.vehiculo.configVehiculo ?? '';
    case 'propietario':     return item.vehiculo.propietarioNombre ?? '';
    case 'capacidad':       return item.vehiculo.capacidadTon?.toNumber?.() ?? Number(item.vehiculo.capacidadTon ?? 0);
    case 'soat':            return item.vehiculo.soatVigencia ? new Date(item.vehiculo.soatVigencia).getTime() : 0;
    case 'rndc':            return getRndcLabel(item.rndcStatus);
    case 'estado':          return item.vehiculo.activo ? 'Activo' : 'Inactivo';
    default:                return '';
  }
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

interface VehiculoListProps {
  items:    VehiculoWithRndc[];
  total:    number;
  page:     number;
  pageSize: number;
  q?:       string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function VehiculoList({ items, total, page, pageSize, q = '' }: VehiculoListProps) {
  const searchParams  = useSearchParams();
  const debouncedPush = useDebouncedPush();

  const [sortKey, setSortKey] = useState<SortKey>('placa');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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
    return `/operacional/vehiculos?${p.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter = !!q;

  return (
    <div style={{ background: colors.pageBg, minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Filters ── */}
        <FilterCard>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por placa o propietario…"
              defaultValue={q}
              onChange={e => debouncedPush(buildUrl({ q: e.target.value, page: '1' }))}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <ExportCsvButton buildExportUrl={() => {
              const p = new URLSearchParams();
              if (q) p.set('q', q);
              return `/api/vehiculos/export-csv?${p.toString()}`;
            }} />
            {hasFilter && <ClearFiltersButton baseUrl="/operacional/vehiculos" />}
          </div>
        </FilterCard>

        {/* ── Table ── */}
        <TableCard>
          {items.length === 0 ? (
            <EmptyState hasFilter={hasFilter} emptyText='Aún no hay vehículos. Crea el primero con "+ Nuevo vehículo".' />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderLight}`, background: colors.bgLight }}>
                  <Th label="Placa" sortKey="placa" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Config." sortKey="configVehiculo" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Propietario" sortKey="propietario" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Capacidad" sortKey="capacidad" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} align="right" />
                  <Th label="SOAT Vig." sortKey="soat" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="RNDC" sortKey="rndc" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Estado" sortKey="estado" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <th style={{ padding: '12px 16px', width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ vehiculo: v, rndcStatus }, idx) => (
                  <tr
                    key={v.id}
                    style={{ borderBottom: idx < sorted.length - 1 ? `1px solid ${colors.borderLighter}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = colors.bgLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: colors.textPrimary, fontFamily: 'monospace' }}>{v.placa}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textMuted }}>{v.configVehiculo ?? '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: colors.textDefault }}>{v.propietarioNombre ?? '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textMuted, textAlign: 'right' }}>
                      {v.capacidadTon ? `${v.capacidadTon} t` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textMuted }}>{formatFecha(v.soatVigencia)}</td>
                    <td style={{ padding: '14px 16px' }}><span style={getRndcStyle(rndcStatus)}>{getRndcLabel(rndcStatus)}</span></td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: v.activo ? colors.successBadgeBg : colors.borderLighter,
                        color: v.activo ? colors.primaryDark : colors.textPlaceholder,
                        borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                      }}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <Link
                        href={`/operacional/vehiculos/${v.placa}`}
                        style={{
                          display: 'inline-block', fontSize: 13, fontWeight: 600,
                          color: colors.textDefault, background: colors.bgWhite,
                          border: `1px solid ${colors.borderLight}`, borderRadius: 8,
                          padding: '6px 14px', textDecoration: 'none',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = colors.bgLight; e.currentTarget.style.borderColor = colors.border; }}
                        onMouseLeave={e => { e.currentTarget.style.background = colors.bgWhite; e.currentTarget.style.borderColor = colors.borderLight; }}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>

        {/* ── Pagination ── */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          noun="vehículo"
          nounPlural="vehículos"
          buildUrl={buildUrl}
        />
      </div>
    </div>
  );
}
