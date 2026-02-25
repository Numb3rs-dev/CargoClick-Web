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

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Stack,
  Divider,
  Typography,
  Chip,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlaceOutlined,
  PlaceTwoTone,
  SwapVert,
  LocalShippingOutlined,
  AccessTimeOutlined,
  ErrorOutline,
} from '@mui/icons-material';
import {
  getAllMunicipios,
  type MunicipioOption,
} from '@/app/cotizar/config/colombia-dane';
import type { FuenteDistancia } from '@/lib/utils/distancias';

// ── tipos API ──────────────────────────────────────────────────────────────

type ApiDistancia =
  | { km: number; fuente: 'osrm' | 'haversine'; tramo?: string; tiempoTransito?: { descripcion: string; tiempoViajeFormato: string } }
  | { fuente: 'sin_datos' };

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
  /** Fuente de la distancia: 'osrm' = ruta vial real, 'haversine' / 'sin_datos' = sin ruta */
  rutaFuente?: FuenteDistancia;
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
  color: 'primary' | 'error' | 'success';
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

  // Estado local para la info de ruta (resultado de la API)
  const [infoRuta, setInfoRuta] = useState<ApiDistancia | null>(() => {
    // Restaurar desde valor si ya fue calculado (usuario volvió atrás en el wizard)
    if (valor.rutaFuente === 'sin_datos') return { fuente: 'sin_datos' };
    if (valor.distanciaKm !== undefined && valor.rutaFuente) {
      return {
        km: valor.distanciaKm,
        fuente: valor.rutaFuente as 'osrm' | 'haversine',
        tramo: valor.tramoDistancia,
        tiempoTransito: valor.tiempoTransitoDesc
          ? { descripcion: valor.tiempoTransitoDesc, tiempoViajeFormato: '' }
          : undefined,
      };
    }
    return null;
  });
  const [rutaCargando, setRutaCargando] = useState(false);

  // Llamada a la API de distancias (server-side via Next.js Route Handler)
  const fetchDistancia = useCallback(async (
    origen: string,
    destino: string,
    base: OriginDestinationValue,
  ) => {
    setRutaCargando(true);
    setInfoRuta(null);
    try {
      const res  = await fetch(`/api/distancia?origen=${origen}&destino=${destino}`);
      const data: ApiDistancia = await res.json();
      setInfoRuta(data);
      if ('km' in data) {
        onChange({ ...base, distanciaKm: data.km, tramoDistancia: data.tramo, tiempoTransitoDesc: data.tiempoTransito?.descripcion, rutaFuente: data.fuente });
      } else {
        onChange({ ...base, rutaFuente: data.fuente, distanciaKm: undefined });
      }
    } catch {
      setInfoRuta(null);
    } finally {
      setRutaCargando(false);
    }
  }, []); // sin deps — recibe todo por parámetro

  // Fetch inicial si ambos ya están seleccionados pero aún sin distancia (e.g. estado restaurado sin rutaFuente)
  useEffect(() => {
    if (valor.origen && valor.destino && !valor.rutaFuente) {
      fetchDistancia(valor.origen, valor.destino, valor);
    }
  }, []); // solo al montar

  const handleOrigenChange = (codigo: string) => {
    const base: OriginDestinationValue = { ...valor, origen: codigo, distanciaKm: undefined, tramoDistancia: undefined, tiempoTransitoDesc: undefined, rutaFuente: undefined };
    onChange(base);
    if (codigo && valor.destino) fetchDistancia(codigo, valor.destino, base);
    else setInfoRuta(null);
  };

  const handleDestinoChange = (codigo: string) => {
    const base: OriginDestinationValue = { ...valor, destino: codigo, distanciaKm: undefined, tramoDistancia: undefined, tiempoTransitoDesc: undefined, rutaFuente: undefined };
    onChange(base);
    if (valor.origen && codigo) fetchDistancia(valor.origen, codigo, base);
    else setInfoRuta(null);
  };

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

      {/* ── Indicador de carga ──────────────────────────────────────────── */}
      {rutaCargando && (
        <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
          <CircularProgress size={16} thickness={4} />
          <Typography variant="caption">Calculando distancia…</Typography>
        </Box>
      )}

      {/* ── Alerta: ruta sin conexión vial en OSRM ───────────────────────── */}
      {!rutaCargando && infoRuta && infoRuta.fuente !== 'osrm' && (
        <Alert
          severity="error"
          icon={<ErrorOutline />}
          sx={{ mt: 2.5, borderRadius: 2, fontSize: '0.85rem' }}
        >
          Ruta no disponible para estos municipios.
        </Alert>
      )}

      {/* ── Tarjeta info de ruta (solo cuando fuente es OSRM) ────────────── */}
      {!rutaCargando && infoRuta && infoRuta.fuente === 'osrm' && 'km' in infoRuta && (
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
            label={`${infoRuta.km} km · ${infoRuta.tramo ?? ''}`}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
            label={infoRuta.tiempoTransito?.descripcion ?? ''}
            size="small"
            variant="outlined"
            color="success"
            sx={{ fontWeight: 600 }}
          />
          {infoRuta.tiempoTransito?.tiempoViajeFormato && (
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
          )}
        </Box>
      )}
    </Stack>
  );
}
