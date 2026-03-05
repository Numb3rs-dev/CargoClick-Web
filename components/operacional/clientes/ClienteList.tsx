'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Cliente, SucursalCliente } from '@prisma/client';
import { Btn } from '@/components/operacional/shared/Btn';
import {
  useDebouncedPush,
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

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

export type ClienteConSucursales = Cliente & { sucursales: SucursalCliente[] };

type SortKey = 'razonSocial' | 'identificacion' | 'sedes' | 'contacto' | 'estado';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const TIPO_LABEL: Record<string, string> = { N: 'NIT', C: 'Cédula', P: 'Pasaporte' };

function getSortValue(item: ClienteConSucursales, key: SortKey): string | number {
  switch (key) {
    case 'razonSocial':    return item.razonSocial;
    case 'identificacion': return item.numeroId;
    case 'sedes':          return item.sucursales.length;
    case 'contacto':       return item.email ?? '';
    case 'estado':         return item.activo ? 'Activo' : 'Inactivo';
    default:               return '';
  }
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

interface Props {
  items:    ClienteConSucursales[];
  total:    number;
  page:     number;
  pageSize: number;
  q:        string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function ClienteList({ items, total, page, pageSize, q }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const debouncedPush = useDebouncedPush();

  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [sortKey, setSortKey]           = useState<SortKey>('razonSocial');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');

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
    return `/operacional/clientes?${p.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter = !!q;

  async function handleDeactivate(id: string, nombre: string) {
    if (!confirm(`¿Desactivar cliente "${nombre}"?`)) return;
    setDeactivating(id);
    try {
      await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setDeactivating(null);
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
              placeholder="Buscar por razón social o NIT…"
              defaultValue={q}
              onChange={e => debouncedPush(buildUrl({ q: e.target.value, page: '1' }))}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <ExportCsvButton buildExportUrl={() => {
              const p = new URLSearchParams();
              if (q) p.set('q', q);
              return `/api/clientes/export-csv?${p.toString()}`;
            }} />
            {hasFilter && <ClearFiltersButton baseUrl="/operacional/clientes" />}
          </div>
        </FilterCard>

        {/* ── Table ── */}
        <TableCard>
          {items.length === 0 ? (
            <EmptyState hasFilter={hasFilter} emptyText='Aún no hay clientes. Crea el primero con "+ Nuevo cliente".' />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  <Th label="Razón Social" sortKey="razonSocial" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Identificación" sortKey="identificacion" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Sedes" sortKey="sedes" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} align="center" />
                  <Th label="Contacto" sortKey="contacto" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <Th label="Estado" sortKey="estado" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
                  <th style={{ padding: '12px 16px', width: 160 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: idx < sorted.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', fontSize: 14 }}>{c.razonSocial}</td>
                    <td style={{ padding: '14px 16px', color: '#374151', fontSize: 14 }}>
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginRight: 4 }}>{TIPO_LABEL[c.tipoId] ?? c.tipoId}</span>
                      {c.numeroId}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        background: '#EFF6FF', color: '#1D4ED8',
                        borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                      }}>
                        {c.sucursales.length} sede{c.sucursales.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: 13 }}>
                      {c.email && <div>{c.email}</div>}
                      {c.telefono && <div>{c.telefono}</div>}
                      {!c.email && !c.telefono && <span style={{ color: '#D1D5DB' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: c.activo ? '#D1FAE5' : '#F3F4F6',
                        color: c.activo ? '#065F46' : '#9CA3AF',
                        borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                      }}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Btn variant="ghost" size="sm" onClick={() => router.push(`/operacional/clientes/${c.id}`)}>
                          Ver
                        </Btn>
                        <Btn variant="secondary" size="sm" onClick={() => router.push(`/operacional/clientes/${c.id}/editar`)}>
                          Editar
                        </Btn>
                        {c.activo && (
                          <Btn
                            variant="danger" size="sm"
                            onClick={() => handleDeactivate(c.id, c.razonSocial)}
                            loading={deactivating === c.id}
                          >
                            {deactivating === c.id ? '…' : 'Desactivar'}
                          </Btn>
                        )}
                      </div>
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
          noun="cliente"
          nounPlural="clientes"
          buildUrl={buildUrl}
        />
      </div>
    </div>
  );
}
