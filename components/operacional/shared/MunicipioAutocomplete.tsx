'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getAllMunicipios, type MunicipioOption } from '@/app/cotizar/config/colombia-dane';
import { colors } from '@/lib/theme/colors';

/* -------------------------------------------------------------------------- */
/*  Catálogo único — se computa una sola vez por bundle                        */
/* -------------------------------------------------------------------------- */

/** Municipios completos (sin filtro visible) con datos para autocomplete */
const CATALOGO: MunicipioItem[] = getAllMunicipios(false).map(m => ({
  codigo5: m.codigo,
  codigo8: `${m.codigo}000`,
  nombre:  m.nombre,
  depto:   m.depto,
  label:   m.label,          // "Pereira, Risaralda"
  search:  norm(`${m.nombre} ${m.depto} ${m.codigo}`),
}));

export interface MunicipioItem {
  /** DANE 5 dígitos  (ej: "66001") */
  codigo5: string;
  /** DANE 8 dígitos  (ej: "66001000") — para compatibilidad con RNDC */
  codigo8: string;
  nombre:  string;
  depto:   string;
  /** "Nombre, Departamento" */
  label:   string;
  /** Pre-normalizado para búsqueda */
  search:  string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Normaliza texto para búsqueda (sin tildes, uppercase, trim) */
function norm(s: string) {
  return s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Convierte un código DANE (5 u 8 dígitos) al formato de 8 dígitos que usa RNDC.
 * "66001" → "66001000"   |  "66001000" → "66001000"
 */
export function toDane8(code: string): string {
  return code.length === 5 ? `${code}000` : code;
}

/**
 * Convierte un código DANE (5 u 8 dígitos) al formato de 5 dígitos del catálogo.
 * "66001000" → "66001"   |  "66001" → "66001"
 */
export function toDane5(code: string): string {
  return code.length === 8 ? code.slice(0, 5) : code;
}

/**
 * Busca un municipio por código DANE (acepta 5 u 8 dígitos).
 */
export function findMunicipio(code: string): MunicipioItem | undefined {
  const c5 = toDane5(code);
  return CATALOGO.find(m => m.codigo5 === c5);
}

/**
 * Devuelve el catálogo completo de municipios.
 * Ideal para pasar como prop o usar en otros componentes.
 */
export function getMunicipioCatalogo(): MunicipioItem[] {
  return CATALOGO;
}

/* -------------------------------------------------------------------------- */
/*  Componente Autocomplete                                                     */
/* -------------------------------------------------------------------------- */

export interface MunicipioAutocompleteProps {
  /**
   * Código DANE actual (acepta 5 u 8 dígitos, o vacío).
   */
  value: string;
  placeholder?: string;
  /**
   * Se invoca con el código DANE en el formato que se indique en `daneFormat`.
   * String vacío ("") cuando el usuario limpia la selección.
   */
  onSelect: (dane: string) => void;
  /**
   * Formato del DANE que recibe `onSelect`:
   * - `'dane8'` (por defecto): 8 dígitos estilo RNDC ("66001000")
   * - `'dane5'`: 5 dígitos estilo catálogo DANE ("66001")
   */
  daneFormat?: 'dane5' | 'dane8';
}

export function MunicipioAutocomplete({
  value,
  placeholder = 'Buscar municipio…',
  onSelect,
  daneFormat = 'dane8',
}: MunicipioAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);

  /* Buscar el item seleccionado (acepta ambos formatos) */
  const selectedItem = value ? findMunicipio(value) : null;

  const filtered = useMemo(() => {
    const q = norm(search);
    if (!q) return CATALOGO.slice(0, 30);
    return CATALOGO.filter(m => m.search.includes(q)).slice(0, 30);
  }, [search]);

  /* Click fuera → cerrar */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayText = selectedItem ? `${selectedItem.label}  (${selectedItem.codigo5})` : '';

  function handleSelect(item: MunicipioItem) {
    const code = daneFormat === 'dane5' ? item.codigo5 : item.codigo8;
    onSelect(code);
    setSearch('');
    setOpen(false);
  }

  function handleClear() {
    onSelect('');
    setSearch('');
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: '1 1 0', minWidth: 160, maxWidth: 360 }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder={placeholder}
          value={open ? search : displayText}
          onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(selectedItem ? '' : search); }}
          style={{
            height: 40, fontSize: 14, color: colors.textDefault,
            background: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: 8,
            padding: '0 32px 0 12px', outline: 'none', width: '100%',
          }}
        />
        {value ? (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: colors.textPlaceholder, padding: 2, lineHeight: 1,
            }}
          >✕</button>
        ) : (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 10, color: colors.textPlaceholder, pointerEvents: 'none',
          }}>▼</span>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 280, overflowY: 'auto',
          marginTop: 4,
        }}>
          {filtered.map((m, i) => (
            <div
              key={m.codigo5}
              onClick={() => handleSelect(m)}
              style={{
                padding: '10px 12px', cursor: 'pointer', fontSize: 13,
                borderBottom: i < filtered.length - 1 ? `1px solid ${colors.borderLighter}` : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = colors.hoverBlue)}
              onMouseLeave={e => (e.currentTarget.style.background = colors.bgWhite)}
            >
              <span>
                <span style={{ color: colors.textDefault, fontWeight: 500 }}>{m.nombre}</span>
                <span style={{ color: colors.textPlaceholder, fontSize: 12, marginLeft: 6 }}>{m.depto}</span>
              </span>
              <span style={{ color: colors.textPlaceholder, fontSize: 11, fontFamily: 'monospace', fontWeight: 600, marginLeft: 8, whiteSpace: 'nowrap' }}>
                {m.codigo5}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
