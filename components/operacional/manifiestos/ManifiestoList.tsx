'use client';

import Link from 'next/link';
import React, { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { colors } from '@/lib/theme/colors';
import { StatusBadge } from '@/components/operacional/shared/StatusBadge';
import { MunicipioAutocomplete } from '@/components/operacional/shared/MunicipioAutocomplete';
import {
  useDebouncedPush,
  formatFecha,
  genericSort,
  type SortDir,
  selectStyle,
  inputStyle,
  FilterCard,
  TableCard,
  EmptyState,
  ClearFiltersButton,
  ExportCsvButton,
  Pagination,
  Th,
  VerButton,
  MESES,
} from '@/components/operacional/shared/ListUtils';
import { ESTADOS_MANIFIESTO, ESTADOS_MANIFIESTO_FILTRO } from '@/lib/constants';

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                       */
/* -------------------------------------------------------------------------- */

export interface ManifiestoListItem {
  id:               string;
  codigoInterno:    string;
  numeroManifiesto: string | null;
  estadoManifiesto: string;
  origenMunicipio:  string;
  destinoMunicipio: string;
  vehiculoPlaca:    string;
  fechaExpedicion:  Date | string | null;
  createdAt:        Date | string;
  conductor: {
    cedula:    string;
    nombres:   string;
    apellidos: string;
  };
  remesas: { id: string }[];
}

type SortKey =
  | 'codigoInterno'
  | 'origenMunicipio'
  | 'conductor'
  | 'vehiculoPlaca'
  | 'estadoManifiesto'
  | 'remesas'
  | 'fechaExpedicion';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function getSortValue(item: ManifiestoListItem, key: SortKey): string | number {
  switch (key) {
    case 'codigoInterno':    return item.codigoInterno;
    case 'origenMunicipio':  return `${item.origenMunicipio} ${item.destinoMunicipio}`;
    case 'conductor':        return `${item.conductor.apellidos} ${item.conductor.nombres}`;
    case 'vehiculoPlaca':    return item.vehiculoPlaca;
    case 'estadoManifiesto': return item.estadoManifiesto;
    case 'remesas':          return item.remesas.length;
    case 'fechaExpedicion':   return new Date(item.fechaExpedicion ?? item.createdAt).getTime();
    default:                 return '';
  }
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface ManifiestoListProps {
  items:              ManifiestoListItem[];
  total:              number;
  page:               number;
  pageSize:           number;
  q?:                 string;
  estadoManifiesto?:  string;
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
  { key: 'codigoInterno',    label: 'Nº Manifiesto' },
  { key: 'origenMunicipio',  label: 'Origen → Destino' },
  { key: 'conductor',        label: 'Conductor' },
  { key: 'vehiculoPlaca',    label: 'Placa' },
  { key: 'estadoManifiesto', label: 'Estado' },
  { key: 'remesas',          label: 'Remesas', align: 'center' },
  { key: 'fechaExpedicion',  label: 'Expedición' },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function ManifiestoList({
  items,
  total,
  page,
  pageSize,
  q                = '',
  estadoManifiesto = '',
  origenDane        = '',
  destinoDane       = '',
  anio             = '',
  mes              = '',
  aniosDisponibles,
}: ManifiestoListProps) {
  const searchParams   = useSearchParams();
  const debouncedPush  = useDebouncedPush();
  const [isPending, startTransition] = useTransition();

  const [sortKey, setSortKey] = useState<SortKey>('fechaExpedicion');
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
    return `/operacional/manifiestos?${p.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hasAnyFilter = !!(q || estadoManifiesto || origenDane || destinoDane || anio || mes);

  function buildExportUrl() {
    const p = new URLSearchParams();
    if (q)                p.set('q', q);
    if (estadoManifiesto) p.set('estadoManifiesto', estadoManifiesto);
    if (origenDane)       p.set('origenDane', origenDane);
    if (destinoDane)      p.set('destinoDane', destinoDane);
    if (anio)             p.set('anio', anio);
    if (mes)              p.set('mes', mes);
    return `/api/manifiestos/export-csv?${p.toString()}`;
  }

  return (
    <div style={{ background: colors.pageBg, minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Filters ── */}
        <FilterCard>
          {/* Fila 1: Búsqueda texto + Estado */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por nº manifiesto, placa, conductor, ruta…"
              defaultValue={q}
              onChange={e => debouncedPush(buildUrl({ q: e.target.value, page: '1' }))}
              style={inputStyle}
            />
            <select
              value={estadoManifiesto}
              onChange={e => startTransition(() => {
                window.location.href = buildUrl({ estadoManifiesto: e.target.value, page: '1' });
              })}
              style={{ ...selectStyle, color: estadoManifiesto ? colors.textDefault : colors.textPlaceholder }}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_MANIFIESTO_FILTRO.map(e => (
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

          {/* Export + Clear */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <ExportCsvButton buildExportUrl={buildExportUrl} />
            {hasAnyFilter && <ClearFiltersButton baseUrl="/operacional/manifiestos" />}
          </div>
        </FilterCard>

        {/* ── Table ── */}
        <TableCard>
          {items.length === 0 ? (
            <EmptyState
              hasFilter={hasAnyFilter}
              emptyText='Crea el primer manifiesto con el botón "+ Manifiesto".'
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
                  <th style={{ padding: '12px 16px', width: 160 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((m, idx) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: idx < sorted.length - 1 ? `1px solid ${colors.borderLighter}` : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = colors.bgLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                      {m.codigoInterno}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textMuted }}>
                      {m.origenMunicipio} → {m.destinoMunicipio}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: colors.textDefault }}>
                      {m.conductor.nombres} {m.conductor.apellidos}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textDefault }}>
                      {m.vehiculoPlaca}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge estado={m.estadoManifiesto} config={ESTADOS_MANIFIESTO} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
                      {m.remesas.length}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.textPlaceholder }}>
                      {formatFecha(m.fechaExpedicion ?? m.createdAt)}
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <VerButton href={`/operacional/manifiestos/${m.id}`} />
                      {m.estadoManifiesto === 'BORRADOR' && (
                        <Link
                          href={`/operacional/manifiestos/${m.id}/editar`}
                          style={{
                            display: 'inline-block', fontSize: 13, fontWeight: 600,
                            color: colors.bgWhite, background: colors.primary,
                            border: `1px solid ${colors.primary}`, borderRadius: 8,
                            padding: '6px 14px', textDecoration: 'none',
                            marginLeft: 8, transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = colors.primaryHover; }}
                          onMouseLeave={e => { e.currentTarget.style.background = colors.primary; }}
                        >
                          ✎ Editar
                        </Link>
                      )}
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
          noun="manifiesto"
          nounPlural="manifiestos"
          buildUrl={buildUrl}
        />
      </div>
    </div>
  );
}
