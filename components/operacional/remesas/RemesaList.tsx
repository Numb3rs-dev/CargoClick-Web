'use client';

import React, { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { MunicipioAutocomplete } from '@/components/operacional/shared/MunicipioAutocomplete';
import { StatusBadge } from '@/components/operacional/shared/StatusBadge';
import {
  useDebouncedPush,
  formatFecha,
  genericSort,
  type SortDir,
  selectStyle,
  inputStyle,
  SortArrow,
  FilterCard,
  TableCard,
  EmptyState,
  ClearFiltersButton,
  Pagination,
  VerButton,
  Th,
  MESES,
} from '@/components/operacional/shared/ListUtils';
import { colors } from '@/lib/theme/colors';
import { ESTADOS_REMESA, ESTADOS_REMESA_FILTRO } from '@/lib/constants';

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                       */
/* -------------------------------------------------------------------------- */

export interface RemesaListItem {
  id:                string;
  numeroRemesa:      string;
  descripcionCarga:  string;
  pesoKg:            number;
  origenMunicipio:   string;
  destinoMunicipio:  string;
  estadoRndc:        string;
  estado:            string;
  createdAt:         Date | string;
  fechaIngresoRndc?:  Date | string | null;
}

type SortKey =
  | 'numeroRemesa'
  | 'descripcionCarga'
  | 'origenMunicipio'
  | 'estadoRndc'
  | 'pesoKg'
  | 'fecha';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function getSortValue(item: RemesaListItem, key: SortKey): string | number {
  switch (key) {
    case 'numeroRemesa':     return item.numeroRemesa;
    case 'descripcionCarga': return item.descripcionCarga;
    case 'origenMunicipio':  return `${item.origenMunicipio} ${item.destinoMunicipio}`;
    case 'estadoRndc':       return item.estadoRndc;
    case 'pesoKg':           return item.pesoKg;
    case 'fecha': {
      const d = item.fechaIngresoRndc ?? item.createdAt;
      return new Date(d).getTime();
    }
    default:                 return '';
  }
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface RemesaListProps {
  items:              RemesaListItem[];
  total:              number;
  page:               number;
  pageSize:           number;
  q?:                 string;
  estadoRndc?:        string;
  origenDane?:        string;
  destinoDane?:       string;
  anio?:              string;
  mes?:               string;
  aniosDisponibles:   number[];
}

/* -------------------------------------------------------------------------- */
/*  Column config                                                               */
/* -------------------------------------------------------------------------- */

interface ColDef { key: SortKey; label: string; align?: 'center' | 'right' }
const COLUMNS: ColDef[] = [
  { key: 'numeroRemesa',     label: 'Nº Remesa' },
  { key: 'descripcionCarga', label: 'Carga' },
  { key: 'origenMunicipio',  label: 'Origen → Destino' },
  { key: 'pesoKg',           label: 'Peso', align: 'right' },
  { key: 'estadoRndc',       label: 'Estado RNDC' },
  { key: 'fecha',            label: 'Fecha' },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function RemesaList({
  items,
  total,
  page,
  pageSize,
  q            = '',
  estadoRndc   = '',
  origenDane   = '',
  destinoDane  = '',
  anio         = '',
  mes          = '',
  aniosDisponibles,
}: RemesaListProps) {
  const searchParams  = useSearchParams();
  const debouncedPush = useDebouncedPush();
  const [isPending, startTransition] = useTransition();

  const [sortKey, setSortKey] = useState<SortKey>('fecha');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function toggleSort(key: string) {
    const k = key as SortKey;
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  const sorted = genericSort(items, i => getSortValue(i, sortKey), sortDir);

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k);
    });
    return `/operacional/remesas?${p.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasAnyFilter = !!(q || estadoRndc || origenDane || destinoDane || anio || mes);

  return (
    <div style={{ background: colors.pageBg, minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Filters ── */}
        <FilterCard>
          {/* Fila 1: Búsqueda + Estado */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por nº remesa, carga, origen, destino…"
              defaultValue={q}
              onChange={e => debouncedPush(buildUrl({ q: e.target.value, page: '1' }))}
              style={inputStyle}
            />
            <select
              value={estadoRndc}
              onChange={e => startTransition(() => {
                window.location.href = buildUrl({ estadoRndc: e.target.value, page: '1' });
              })}
              style={{ ...selectStyle, color: estadoRndc ? colors.textDefault : colors.textPlaceholder }}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_REMESA_FILTRO.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Fila 2: Origen + Destino */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
            <MunicipioAutocomplete
              value={origenDane}
              placeholder="Origen — municipio o DANE…"
              onSelect={dane => startTransition(() => {
                window.location.href = buildUrl({ origenDane: dane, page: '1' });
              })}
            />
            <MunicipioAutocomplete
              value={destinoDane}
              placeholder="Destino — municipio o DANE…"
              onSelect={dane => startTransition(() => {
                window.location.href = buildUrl({ destinoDane: dane, page: '1' });
              })}
            />
          </div>

          {/* Fila 3: Año + Mes */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select
              value={anio}
              onChange={e => startTransition(() => {
                window.location.href = buildUrl({ anio: e.target.value, page: '1' });
              })}
              style={{ ...selectStyle, flex: '0 1 130px', maxWidth: 130, color: anio ? colors.textDefault : colors.textPlaceholder }}
            >
              <option value="">Año</option>
              {aniosDisponibles.map(a => (
                <option key={a} value={String(a)}>{a}</option>
              ))}
            </select>
            <select
              value={mes}
              onChange={e => startTransition(() => {
                window.location.href = buildUrl({ mes: e.target.value, page: '1' });
              })}
              style={{ ...selectStyle, flex: '0 1 150px', maxWidth: 150, color: mes ? colors.textDefault : colors.textPlaceholder }}
            >
              <option value="">Mes</option>
              {MESES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Limpiar filtros */}
          {hasAnyFilter && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ClearFiltersButton baseUrl="/operacional/remesas" />
            </div>
          )}
        </FilterCard>

        {/* ── Table ── */}
        <TableCard>
          {items.length === 0 ? (
            <EmptyState
              hasFilter={hasAnyFilter}
              emptyText='Crea la primera remesa con el botón "+ Remesa".'
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderLight}`, background: colors.bgLight }}>
                  {COLUMNS.map(col => (
                    <Th
                      key={col.key}
                      label={col.label}
                      sortKey={col.key}
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={toggleSort}
                      align={col.align}
                    />
                  ))}
                  <th style={{ padding: '12px 16px', width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: idx < sorted.length - 1 ? `1px solid ${colors.borderLighter}` : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = colors.bgLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                      {r.numeroRemesa}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: colors.textDefault, maxWidth: 220 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {r.descripcionCarga}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textMuted }}>
                      {r.origenMunicipio} → {r.destinoMunicipio}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textDefault, textAlign: 'right' }}>
                      {r.pesoKg.toLocaleString('es-CO')} kg
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge estado={r.estadoRndc} config={ESTADOS_REMESA} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: r.fechaIngresoRndc ? colors.textDefault : colors.textPlaceholder }}>
                      {formatFecha(r.fechaIngresoRndc ?? r.createdAt)}
                      {!r.fechaIngresoRndc && (
                        <span style={{ display: 'block', fontSize: 11, color: colors.border }}>creación</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <VerButton href={`/operacional/remesas/${r.id}`} />
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
          noun="remesa"
          nounPlural="remesas"
          buildUrl={buildUrl}
        />
      </div>
    </div>
  );
}
