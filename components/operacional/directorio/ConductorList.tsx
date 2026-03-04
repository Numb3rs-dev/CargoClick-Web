'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Conductor } from '@prisma/client';
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

export interface ConductorWithRndc {
  conductor:   Conductor;
  rndcStatus?: RndcStatus;
}

type SortKey = 'cedula' | 'nombre' | 'categoriaLicencia' | 'licenciaVigencia' | 'rndc' | 'estado';

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

function getSortValue(item: ConductorWithRndc, key: SortKey): string | number {
  switch (key) {
    case 'cedula':            return item.conductor.cedula;
    case 'nombre':            return `${item.conductor.apellidos} ${item.conductor.nombres}`;
    case 'categoriaLicencia': return item.conductor.categoriaLicencia ?? '';
    case 'licenciaVigencia':  return item.conductor.licenciaVigencia ? new Date(item.conductor.licenciaVigencia).getTime() : 0;
    case 'rndc':              return getRndcLabel(item.rndcStatus);
    case 'estado':            return item.conductor.activo ? 'Activo' : 'Inactivo';
    default:                  return '';
  }
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

interface ConductorListProps {
  items:    ConductorWithRndc[];
  total:    number;
  page:     number;
  pageSize: number;
  q?:       string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function ConductorList({ items, total, page, pageSize, q = '' }: ConductorListProps) {
  const searchParams  = useSearchParams();
  const debouncedPush = useDebouncedPush();

  const [sortKey, setSortKey] = useState<SortKey>('nombre');
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
    return `/operacional/conductores?${p.toString()}`;
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
              placeholder="Buscar por nombre o cédula…"
              defaultValue={q}
              onChange={e => debouncedPush(buildUrl({ q: e.target.value, page: '1' }))}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <ExportCsvButton buildExportUrl={() => {
              const p = new URLSearchParams();
              if (q) p.set('q', q);
              return `/api/conductores/export-csv?${p.toString()}`;
            }} />
            {hasFilter && <ClearFiltersButton baseUrl="/operacional/conductores" />}
          </div>
        </FilterCard>

        {/* ── Table ── */}
        <TableCard>
          {items.length === 0 ? (
            <EmptyState hasFilter={hasFilter} emptyText='Aún no hay conductores. Crea el primero con "+ Nuevo conductor".' />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderLight}`, background: colors.bgLight }}>
                  <Th label="Cédula" sortKey="cedula" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Nombre" sortKey="nombre" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Cat. Lic." sortKey="categoriaLicencia" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Vig. Licencia" sortKey="licenciaVigencia" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="RNDC" sortKey="rndc" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Estado" sortKey="estado" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <th style={{ padding: '12px 16px', width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ conductor: c, rndcStatus }, idx) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: idx < sorted.length - 1 ? `1px solid ${colors.borderLighter}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = colors.bgLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: colors.textPrimary, fontFamily: 'monospace' }}>{c.cedula}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: colors.textDefault }}>{c.apellidos}, {c.nombres}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textMuted }}>{c.categoriaLicencia ?? '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textMuted }}>{formatFecha(c.licenciaVigencia)}</td>
                    <td style={{ padding: '14px 16px' }}><span style={getRndcStyle(rndcStatus)}>{getRndcLabel(rndcStatus)}</span></td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: c.activo ? colors.successBadgeBg : colors.borderLighter,
                        color: c.activo ? colors.primaryDark : colors.textPlaceholder,
                        borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                      }}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <Link
                        href={`/operacional/conductores/${c.cedula}`}
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
          noun="conductor"
          nounPlural="conductores"
          buildUrl={buildUrl}
        />
      </div>
    </div>
  );
}
