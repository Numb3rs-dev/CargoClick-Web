'use client';

import React, { useMemo } from 'react';
import { Autocomplete, TextField, Box, Typography, Paper } from '@mui/material';
import { PlaceOutlined } from '@mui/icons-material';
import { getAllMunicipios, type MunicipioOption } from '@/app/cotizar/config/colombia-dane';

/* -------------------------------------------------------------------------- */
/*  Catálogo único — se computa una sola vez por bundle                        */
/* -------------------------------------------------------------------------- */

/** Lista base en formato MunicipioOption (código 5 dígitos) */
const CATALOGO_MUI: MunicipioOption[] = getAllMunicipios(false);

/** Catálogo extendido con campos de búsqueda y código 8 dígitos */
const CATALOGO: MunicipioItem[] = CATALOGO_MUI.map(m => ({
  codigo5: m.codigo,
  codigo8: `${m.codigo}000`,
  nombre:  m.nombre,
  depto:   m.depto,
  label:   m.label,     // "Pereira, Risaralda"
}));

export interface MunicipioItem {
  /** DANE 5 dígitos (ej: "66001") */
  codigo5: string;
  /** DANE 8 dígitos (ej: "66001000") — para compatibilidad con RNDC */
  codigo8: string;
  nombre:  string;
  depto:   string;
  /** "Nombre, Departamento" */
  label:   string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Normaliza texto para búsqueda (sin tildes, minúsculas, trim) */
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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
 */
export function getMunicipioCatalogo(): MunicipioItem[] {
  return CATALOGO;
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface MunicipioAutocompleteProps {
  /** Código DANE actual (acepta 5 u 8 dígitos, o vacío). */
  value: string;
  /**
   * Se invoca con el código DANE en el formato indicado en `daneFormat`.
   * String vacío ("") cuando el usuario limpia la selección.
   */
  onSelect: (dane: string) => void;
  /**
   * Opcional: recibe el item completo al seleccionar.
   * Útil para poblar nombre + código al mismo tiempo (ej: sedes de cliente).
   * Recibe `null` cuando se limpia la selección.
   */
  onSelectItem?: (item: MunicipioItem | null) => void;
  /**
   * Formato del código que recibe `onSelect`:
   * - `'dane8'` (por defecto): 8 dígitos estilo RNDC ("66001000")
   * - `'dane5'`: 5 dígitos estilo catálogo DANE ("66001")
   */
  daneFormat?: 'dane5' | 'dane8';
  placeholder?: string;
  /** Etiqueta del campo TextField (opcional) */
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Tamaño del campo — `'small'` por defecto (operacional), `'medium'` para el cotizador */
  size?: 'small' | 'medium';
}

/* -------------------------------------------------------------------------- */
/*  Componente                                                                  */
/* -------------------------------------------------------------------------- */

export function MunicipioAutocomplete({
  value,
  onSelect,
  onSelectItem,
  daneFormat = 'dane8',
  placeholder = 'Buscar municipio…',
  label,
  disabled,
  autoFocus,
  size = 'small',
}: MunicipioAutocompleteProps) {

  /** Encuentra la opción MUI actual a partir del código (acepta 5 u 8 dígitos) */
  const selectedOption = useMemo(
    () => value ? (CATALOGO_MUI.find(m => m.codigo === toDane5(value)) ?? null) : null,
    [value],
  );

  function handleChange(opt: MunicipioOption | null) {
    if (!opt) {
      onSelect('');
      onSelectItem?.(null);
      return;
    }
    const item  = CATALOGO.find(m => m.codigo5 === opt.codigo) ?? null;
    const code  = daneFormat === 'dane5' ? opt.codigo : `${opt.codigo}000`;
    onSelect(code);
    onSelectItem?.(item);
  }

  return (
    <Autocomplete<MunicipioOption>
      disabled={disabled}
      options={CATALOGO_MUI}
      value={selectedOption}
      getOptionLabel={(opt) => opt.label}
      filterOptions={(options, { inputValue }) => {
        if (!inputValue.trim()) return options.slice(0, 12);
        const q = norm(inputValue);
        const filtered = options.filter(opt =>
          norm(`${opt.nombre} ${opt.depto} ${opt.codigo}`).includes(q)
        );
        filtered.sort((a, b) => {
          const aStarts = norm(a.nombre).startsWith(q) ? 0 : 1;
          const bStarts = norm(b.nombre).startsWith(q) ? 0 : 1;
          return aStarts - bStarts;
        });
        return filtered.slice(0, 10);
      }}
      onChange={(_, opt) => handleChange(opt)}
      isOptionEqualToValue={(opt, val) => opt.codigo === val.codigo}
      noOptionsText="No se encontró el municipio"
      renderOption={(props, opt) => {
        const { key, ...rest } = props as { key: React.Key } & React.HTMLAttributes<HTMLLIElement>;
        return (
          <Box component="li" key={key} {...rest}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}
          >
            <PlaceOutlined sx={{ color: 'text.disabled', fontSize: 16, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                {opt.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {opt.depto}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.disabled"
              sx={{ fontWeight: 700, fontFamily: 'monospace', ml: 'auto', flexShrink: 0 }}
            >
              {opt.codigo}
            </Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          label={label}
          size={size}
          autoFocus={autoFocus}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <PlaceOutlined
                  sx={{
                    color: value ? 'primary.main' : 'text.disabled',
                    fontSize: size === 'medium' ? 20 : 17,
                    mr: 0.5,
                    flexShrink: 0,
                  }}
                />
              ),
            },
          }}
        />
      )}
      PaperComponent={(props) => (
        <Paper
          {...props}
          elevation={0}
          sx={{
            mt: 0.5,
            boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      )}
    />
  );
}
