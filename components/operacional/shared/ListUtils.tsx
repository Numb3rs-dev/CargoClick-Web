'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { colors } from '@/lib/theme/colors';

/* ========================================================================== */
/*  Shared hooks                                                                */
/* ========================================================================== */

export function useDebouncedPush(delayMs = 300) {
  const router   = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return useCallback(
    (url: string) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => router.push(url), delayMs);
    },
    [router, delayMs],
  );
}

/* ========================================================================== */
/*  Formatters                                                                  */
/* ========================================================================== */

export function formatFecha(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-CO', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

export function formatFechaHora(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/* ========================================================================== */
/*  Generic sort helpers                                                        */
/* ========================================================================== */

export type SortDir = 'asc' | 'desc';

export function genericSort<T>(
  items: T[],
  getValue: (item: T) => string | number,
  dir: SortDir,
): T[] {
  return [...items].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' });
    return dir === 'asc' ? cmp : -cmp;
  });
}

/* ========================================================================== */
/*  Pagination helper                                                           */
/* ========================================================================== */

export function buildPageNumbers(
  current: number,
  total: number,
): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

/* ========================================================================== */
/*  MESES                                                                       */
/* ========================================================================== */

export const MESES = [
  { value: '1',  label: 'Enero' },
  { value: '2',  label: 'Febrero' },
  { value: '3',  label: 'Marzo' },
  { value: '4',  label: 'Abril' },
  { value: '5',  label: 'Mayo' },
  { value: '6',  label: 'Junio' },
  { value: '7',  label: 'Julio' },
  { value: '8',  label: 'Agosto' },
  { value: '9',  label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

/* ========================================================================== */
/*  Shared inline styles                                                        */
/* ========================================================================== */

export const selectStyle: React.CSSProperties = {
  height: 40, fontSize: 14, color: colors.textDefault,
  background: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: 8,
  padding: '0 12px', outline: 'none', cursor: 'pointer',
  flex: '1 1 180px', minWidth: 0, maxWidth: 260,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 32,
};

export const inputStyle: React.CSSProperties = {
  height: 40, fontSize: 14, color: colors.textDefault,
  background: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: 8,
  padding: '0 12px', outline: 'none',
  flex: '1 1 260px', minWidth: 0, maxWidth: 400,
};

/* ========================================================================== */
/*  SortArrow                                                                   */
/* ========================================================================== */

export function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return <span style={{ marginLeft: 4, fontSize: 10, color: colors.border }}>⇅</span>;
  return (
    <span style={{ marginLeft: 4, fontSize: 10, color: colors.textPrimary }}>
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

/* ========================================================================== */
/*  Pagination component                                                        */
/* ========================================================================== */

interface PaginationProps {
  page:       number;
  totalPages: number;
  total:      number;
  noun:       string;           // "manifiesto", "remesa", "conductor"…
  nounPlural: string;           // "manifiestos", "remesas", "conductores"…
  buildUrl:   (overrides: Record<string, string>) => string;
}

export function Pagination({ page, totalPages, total, noun, nounPlural, buildUrl }: PaginationProps) {
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const go = (p: number) => startTransition(() => { window.location.href = buildUrl({ page: String(p) }); });

  const btnBase: React.CSSProperties = {
    height: 36, padding: '0 14px',
    fontSize: 13, fontWeight: 600,
    background: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: 8,
    cursor: 'pointer', transition: 'background 0.15s',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 20, flexWrap: 'wrap', gap: 12,
    }}>
      <span style={{ fontSize: 13, color: colors.textMuted }}>
        {total} {total !== 1 ? nounPlural : noun} · Página {page} de {totalPages}
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Anterior */}
        <button
          disabled={page <= 1 || isPending}
          onClick={() => go(page - 1)}
          style={{
            ...btnBase,
            color: page <= 1 ? colors.border : colors.textDefault,
            opacity: page <= 1 ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (page > 1) e.currentTarget.style.background = colors.bgLight; }}
          onMouseLeave={e => { e.currentTarget.style.background = colors.bgWhite; }}
        >
          ← Anterior
        </button>

        {/* Numbered pages */}
        {buildPageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} style={{ fontSize: 13, color: colors.textPlaceholder, padding: '0 4px' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => go(Number(p))}
              disabled={isPending}
              style={{
                height: 36, minWidth: 36, padding: '0 8px',
                fontSize: 13, fontWeight: Number(p) === page ? 700 : 500,
                color: Number(p) === page ? colors.bgWhite : colors.textDefault,
                background: Number(p) === page ? colors.blue : colors.bgWhite,
                border: Number(p) === page ? `1px solid ${colors.blue}` : `1px solid ${colors.borderLight}`,
                borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (Number(p) !== page) e.currentTarget.style.background = colors.bgLight; }}
              onMouseLeave={e => { if (Number(p) !== page) e.currentTarget.style.background = colors.bgWhite; }}
            >
              {p}
            </button>
          ),
        )}

        {/* Ir a */}
        <form
          onSubmit={e => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('goPage') as HTMLInputElement;
            const val = parseInt(input.value, 10);
            if (!val || val < 1 || val > totalPages || val === page) return;
            go(val);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}
        >
          <span style={{ fontSize: 12, color: colors.textPlaceholder, whiteSpace: 'nowrap' }}>Ir a</span>
          <input
            name="goPage"
            type="number"
            min={1}
            max={totalPages}
            placeholder={String(page)}
            style={{
              width: 52, height: 36, fontSize: 13, textAlign: 'center',
              color: colors.textDefault, background: colors.bgWhite,
              border: `1px solid ${colors.borderLight}`, borderRadius: 8,
              outline: 'none', padding: '0 6px',
            }}
          />
        </form>

        {/* Siguiente */}
        <button
          disabled={page >= totalPages || isPending}
          onClick={() => go(page + 1)}
          style={{
            ...btnBase,
            color: page >= totalPages ? colors.border : colors.textDefault,
            opacity: page >= totalPages ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (page < totalPages) e.currentTarget.style.background = colors.bgLight; }}
          onMouseLeave={e => { e.currentTarget.style.background = colors.bgWhite; }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Filter container                                                            */
/* ========================================================================== */

export function FilterCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: colors.bgWhite, borderRadius: 16, padding: '20px 20px 16px',
      border: `1px solid ${colors.borderLight}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {children}
    </div>
  );
}

/* ========================================================================== */
/*  Table card wrapper                                                          */
/* ========================================================================== */

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: colors.bgWhite, borderRadius: 16,
      border: `1px solid ${colors.borderLight}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

/* ========================================================================== */
/*  Empty state                                                                 */
/* ========================================================================== */

export function EmptyState({
  hasFilter,
  emptyText,
}: {
  hasFilter: boolean;
  emptyText: string;
}) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: colors.textMuted }}>
      <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sin resultados</p>
      <p style={{ fontSize: 14 }}>
        {hasFilter ? 'Intenta ajustar los filtros.' : emptyText}
      </p>
    </div>
  );
}

/* ========================================================================== */
/*  Clear filters button                                                        */
/* ========================================================================== */

export function ClearFiltersButton({ baseUrl }: { baseUrl: string }) {
  const [, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => { window.location.href = baseUrl; })}
      style={{
        height: 36, padding: '0 16px',
        fontSize: 13, fontWeight: 600, color: colors.error,
        background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: 8,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.errorBorderDark; }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.errorBg; }}
    >
      ✕ Limpiar filtros
    </button>
  );
}

/* ========================================================================== */
/*  CSV Export button                                                            */
/* ========================================================================== */

export function ExportCsvButton({
  buildExportUrl,
}: {
  buildExportUrl: () => string;
}) {
  return (
    <button
      onClick={() => window.open(buildExportUrl(), '_blank')}
      style={{
        height: 36, padding: '0 16px',
        fontSize: 13, fontWeight: 600, color: colors.blue,
        background: colors.blueBg, border: `1px solid ${colors.blueBorder}`, borderRadius: 8,
        cursor: 'pointer', transition: 'background 0.15s',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.blueHover; }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.blueBg; }}
    >
      ⬇ Exportar CSV
    </button>
  );
}

/* ========================================================================== */
/*  "Ver" link button                                                           */
/* ========================================================================== */

import Link from 'next/link';

export function VerButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
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
  );
}

/* ========================================================================== */
/*  Table header cell (sortable)                                                */
/* ========================================================================== */

export function Th({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onSort,
  align,
}: {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentSortDir: SortDir;
  onSort: (key: string) => void;
  align?: 'center' | 'right';
}) {
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: '12px 16px', textAlign: align ?? 'left',
        fontSize: 12, fontWeight: 600, color: colors.textMuted,
        textTransform: 'uppercase', cursor: 'pointer',
        userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {label}
      <SortArrow active={currentSortKey === sortKey} dir={currentSortDir} />
    </th>
  );
}
