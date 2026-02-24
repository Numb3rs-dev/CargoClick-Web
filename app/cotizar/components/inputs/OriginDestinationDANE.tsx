/**
 * OriginDestinationDANE
 *
 * Dos campos de búsqueda libre estilo Google Maps — "Lugar de origen" y
 * "Lugar de destino" — que filtran municipios en tiempo real conforme el
 * usuario escribe (insensible a tildes/mayúsculas).
 *
 * Muestra: "Pereira, Risaralda"
 * Guarda:  código DANE 5 dígitos  →  expuesto al padre via onChange
 *
 * Bonus: cuando ambos están seleccionados muestra distancia + tiempo estimado.
 */

'use client';

import { useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Stack,
  Divider,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import {
  PlaceOutlined,
  PlaceTwoTone,
  SwapVert,
  LocalShippingOutlined,
  AccessTimeOutlined,
} from '@mui/icons-material';
import {
  getAllMunicipios,
  type MunicipioOption,
} from '@/app/cotizar/config/colombia-dane';
import { getInfoDistancia } from '@/lib/utils/distancias';

// ── helpers ────────────────────────────────────────────────────────────────

/** Normaliza texto eliminando tildes y poniendo en minúsculas */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Lista plana construida una sola vez al cargar el módulo
const TODOS_LOS_MUNICIPIOS: MunicipioOption[] = getAllMunicipios();

// ── tipos ──────────────────────────────────────────────────────────────────

interface OriginDestinationValue {
  origen: string;  // código DANE 5 dígitos
  destino: string; // código DANE 5 dígitos
  // Campos calculados — disponibles cuando ambos están seleccionados
  distanciaKm?: number;
  tramoDistancia?: string;
  tiempoTransitoDesc?: string;
}

interface OriginDestinationDANEProps {
  valor: OriginDestinationValue;
  onChange: (val: OriginDestinationValue) => void;
  disabled?: boolean;
}

// ── subcomponente: un campo de búsqueda ────────────────────────────────────

interface MunicipioSearchProps {
  label: string;
  placeholder: string;
  value: string;       // código DANE
  onChange: (codigo: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  color: 'primary' | 'error';
  icon: React.ReactNode;
}

function MunicipioSearch({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  autoFocus,
  color,
  icon,
}: MunicipioSearchProps) {
  const selectedOption = useMemo(
    () => TODOS_LOS_MUNICIPIOS.find((m) => m.codigo === value) ?? null,
    [value]
  );

  return (
    <Box>
      {/* Encabezado de sección */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={700} color={`${color}.main`}>
          {label}
        </Typography>
      </Box>

      <Autocomplete<MunicipioOption>
        disabled={disabled}
        options={TODOS_LOS_MUNICIPIOS}
        value={selectedOption}
        getOptionLabel={(opt) => opt.label}
        filterOptions={(options, { inputValue }) => {
          if (!inputValue.trim()) return options.slice(0, 12);
          const query = normalizar(inputValue);
          const filtered = options.filter((opt) =>
            normalizar(opt.label).includes(query)
          );
          filtered.sort((a, b) => {
            const aStarts = normalizar(a.nombre).startsWith(query) ? 0 : 1;
            const bStarts = normalizar(b.nombre).startsWith(query) ? 0 : 1;
            return aStarts - bStarts;
          });
          return filtered.slice(0, 10);
        }}
        onChange={(_, opt) => onChange(opt?.codigo ?? '')}
        isOptionEqualToValue={(opt, val) => opt.codigo === val.codigo}
        noOptionsText="No se encontró el municipio"
        renderOption={(props, opt) => {
          const { key, ...rest } = props as { key: React.Key } & React.HTMLAttributes<HTMLLIElement>;
          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
            >
              <PlaceOutlined sx={{ color: 'text.disabled', fontSize: 18, flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                  {opt.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {opt.depto}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ ml: 'auto', fontWeight: 700, fontFamily: 'monospace' }}
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
            label="Ciudad / Municipio"
            size="medium"
            autoFocus={autoFocus}
            color={color}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <PlaceOutlined
                    sx={{
                      color: value ? `${color}.main` : 'text.disabled',
                      fontSize: 20,
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
          <Paper {...props} elevation={0} sx={{ mt: 0.5, boxShadow: '0px 8px 24px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider' }} />
        )}
      />
    </Box>
  );
}

// ── componente principal ────────────────────────────────────────────────────

export function OriginDestinationDANE({
  valor,
  onChange,
  disabled,
}: OriginDestinationDANEProps) {

  const handleOrigenChange = (codigo: string) => {
    const newValor = { ...valor, origen: codigo };
    if (newValor.origen && newValor.destino) {
      const info = getInfoDistancia(newValor.origen, newValor.destino);
      onChange({ ...newValor, distanciaKm: info.distanciaKm, tramoDistancia: info.tramo, tiempoTransitoDesc: info.tiempoTransito.descripcion });
    } else {
      onChange(newValor);
    }
  };

  const handleDestinoChange = (codigo: string) => {
    const newValor = { ...valor, destino: codigo };
    if (newValor.origen && newValor.destino) {
      const info = getInfoDistancia(newValor.origen, newValor.destino);
      onChange({ ...newValor, distanciaKm: info.distanciaKm, tramoDistancia: info.tramo, tiempoTransitoDesc: info.tiempoTransito.descripcion });
    } else {
      onChange(newValor);
    }
  };

  const infoRuta = useMemo(() => {
    if (!valor.origen || !valor.destino) return null;
    return getInfoDistancia(valor.origen, valor.destino);
  }, [valor.origen, valor.destino]);

  return (
    <Stack spacing={0}>
      {/* ── ORIGEN ─────────────────────────────────────────────────────── */}
      <MunicipioSearch
        label="Lugar de origen"
        placeholder="Ej: Medellín, Bogotá, Cali…"
        value={valor.origen}
        onChange={handleOrigenChange}
        disabled={disabled}
        autoFocus
        color="primary"
        icon={<PlaceOutlined sx={{ color: 'primary.main', fontSize: 20 }} />}
      />

      {/* ── Separador con flecha ────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2, px: 1 }}>
        <Divider sx={{ flex: 1 }} />
        <SwapVert sx={{ color: 'text.disabled', fontSize: 20 }} />
        <Divider sx={{ flex: 1 }} />
      </Box>

      {/* ── DESTINO ─────────────────────────────────────────────────────── */}
      <MunicipioSearch
        label="Lugar de destino"
        placeholder="Ej: Barranquilla, Cartagena…"
        value={valor.destino}
        onChange={handleDestinoChange}
        disabled={disabled}
        color="success"
        icon={<PlaceTwoTone sx={{ color: 'success.main', fontSize: 20 }} />}
      />

      {/* ── Tarjeta info de ruta (se muestra cuando ambos están elegidos) ── */}
      {infoRuta && (
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <Chip
            icon={<LocalShippingOutlined sx={{ fontSize: 16 }} />}
            label={`${infoRuta.distanciaKm} km · ${infoRuta.tramo}`}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
            label={infoRuta.tiempoTransito.descripcion}
            size="small"
            variant="outlined"
            color="success"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`Manejo: ${infoRuta.tiempoTransito.tiempoViajeFormato}`}
            size="small"
            variant="filled"
            sx={{
              bgcolor: 'action.selected',
              fontWeight: 500,
              fontSize: '0.72rem',
            }}
          />
        </Box>
      )}
    </Stack>
  );
}
