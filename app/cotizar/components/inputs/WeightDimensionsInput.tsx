/**
 * WeightDimensionsInput
 *
 * Paso unificado de Peso + Dimensiones en una sola página.
 *
 * Funcionalidades:
 *   - Campo de peso en kg
 *   - 3 campos de dimensiones (largo × ancho × alto) en cm
 *   - Cálculo automático del volumen en m³
 *   - Sugerencia en tiempo real del vehículo mínimo requerido
 *     (basado en catálogo SICE-TAC Colombia)
 *
 * El valor emitido al padre es un objeto:
 *   { pesoKg, dimLargoCm, dimAnchoCm, dimAltoCm }
 */

'use client';

import { useMemo } from 'react';
import {
  Box,
  Stack,
  TextField,
  Typography,
  Divider,
  LinearProgress,
  Chip,
  Alert,
  Paper,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  FitnessCenterOutlined,
  StraightenOutlined,
  LocalShippingOutlined,
  CheckCircleOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import {
  VEHICULOS_SISETAC,
  sugerirVehiculo,
  type VehiculoSisetac,
} from '@/app/cotizar/config/vehicles-sisetac';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface WeightDimensionsValue {
  pesoKg: number;
  dimLargoCm: number;
  dimAnchoCm: number;
  dimAltoCm: number;
  // Campos calculados — derivados automáticamente al cambiar peso/dimensiones
  volumenM3?: number | null;
  vehiculoSugeridoId?: string | null;
  vehiculoSugeridoNombre?: string | null;
}

interface WeightDimensionsInputProps {
  valor: WeightDimensionsValue;
  onChange: (val: WeightDimensionsValue) => void;
  disabled?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function campoValido(v: number): boolean {
  return v > 0 && isFinite(v);
}

function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
  return `${kg.toLocaleString('es-CO')} kg`;
}

// ── Subcomponente: barra de uso de capacidad ───────────────────────────────

function BarraCapacidad({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" fontWeight={700} color="primary.main">
          {percent}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percent, 100)}
        color="primary"
        sx={{ borderRadius: 4, height: 6 }}
      />
    </Box>
  );
}

// ── Subcomponente: tarjeta de vehículo ─────────────────────────────────────

function TarjetaVehiculo({
  vehiculo,
  esMinimo,
}: {
  vehiculo: VehiculoSisetac;
  esMinimo: boolean;
}) {
  const { dimensionesInteriores: d } = vehiculo;

  return (
    <Paper
      elevation={esMinimo ? 3 : 0}
      sx={{
        p: 1.5,
        border: '2px solid',
        borderColor: esMinimo ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: esMinimo ? 'primary.50' : 'background.paper',
        opacity: esMinimo ? 1 : 0.6,
        transition: 'all 0.25s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography fontSize={20}>{vehiculo.emoji}</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={esMinimo ? 700 : 500}
            color={esMinimo ? 'primary.main' : 'text.secondary'}
            noWrap
          >
            {vehiculo.nombre}
          </Typography>
          <Typography variant="caption" color="text.disabled" noWrap>
            {d.largoM}×{d.anchoM}×{d.altoM} m · {vehiculo.capacidadPesoKg.toLocaleString()} kg
          </Typography>
        </Box>
        {esMinimo && (
          <Chip
            label="Mínimo"
            size="small"
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
          />
        )}
      </Box>
    </Paper>
  );
}

// ── Componente principal ────────────────────────────────────────────────────

export function WeightDimensionsInput({
  valor,
  onChange,
  disabled,
}: WeightDimensionsInputProps) {

  const update = (partial: Partial<WeightDimensionsValue>) => {
    const merged = { ...valor, ...partial };
    // Recalcular derivados inmediatamente con los valores fusionados
    const { pesoKg, dimLargoCm, dimAnchoCm, dimAltoCm } = merged;
    const newVolumen = (campoValido(dimLargoCm) && campoValido(dimAnchoCm) && campoValido(dimAltoCm))
      ? (dimLargoCm * dimAnchoCm * dimAltoCm) / 1_000_000
      : null;
    const newResultado = (campoValido(pesoKg) && newVolumen !== null)
      ? sugerirVehiculo(pesoKg, dimLargoCm, dimAnchoCm, dimAltoCm)
      : null;
    onChange({
      ...merged,
      volumenM3: newVolumen,
      vehiculoSugeridoId: newResultado?.vehiculo?.id ?? null,
      vehiculoSugeridoNombre: newResultado?.vehiculo?.nombre ?? null,
    });
  };

  // ── Calculados en tiempo real ──────────────────────────────────────────
  const todosCamposCompletos = useMemo(
    () =>
      campoValido(valor.pesoKg) &&
      campoValido(valor.dimLargoCm) &&
      campoValido(valor.dimAnchoCm) &&
      campoValido(valor.dimAltoCm),
    [valor]
  );

  const volumenM3 = useMemo(() => {
    if (!campoValido(valor.dimLargoCm) || !campoValido(valor.dimAnchoCm) || !campoValido(valor.dimAltoCm))
      return null;
    return (valor.dimLargoCm * valor.dimAnchoCm * valor.dimAltoCm) / 1_000_000;
  }, [valor.dimLargoCm, valor.dimAnchoCm, valor.dimAltoCm]);

  const resultado = useMemo(() => {
    if (!todosCamposCompletos) return null;
    return sugerirVehiculo(valor.pesoKg, valor.dimLargoCm, valor.dimAnchoCm, valor.dimAltoCm);
  }, [todosCamposCompletos, valor]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Stack spacing={3}>

      {/* ── PESO ─────────────────────────────────────────────────────── */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FitnessCenterOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            Peso de la carga
          </Typography>
        </Box>

        <TextField
          fullWidth
          type="number"
          label="Peso (kg)"
          placeholder="Ej: 1500"
          value={valor.pesoKg || ''}
          onChange={(e) => {
            const raw = parseInt(e.target.value, 10) || 0;
            update({ pesoKg: Math.min(raw, 34_999) });
          }}
          disabled={disabled}
          autoFocus
          inputProps={{ min: 1, max: 34999, step: 1 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Typography color="text.secondary" variant="body2" fontWeight={600}>kg</Typography>
                </InputAdornment>
              ),
            },
          }}
          helperText={
            campoValido(valor.pesoKg)
              ? `≈ ${formatKg(valor.pesoKg)}`
              : 'Peso total de toda la carga'
          }
        />
      </Box>

      {/* ── Separador ────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Divider sx={{ flex: 1 }} />
        <StraightenOutlined sx={{ color: 'text.disabled', fontSize: 18 }} />
        <Divider sx={{ flex: 1 }} />
      </Box>

      {/* ── DIMENSIONES ──────────────────────────────────────────────── */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <StraightenOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            Dimensiones de la carga
          </Typography>
          <Tooltip title="Mide el espacio total que ocupa la carga: largo (la dimensión más larga), ancho y alto en centímetros." arrow>
            <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
          </Tooltip>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            type="number"
            label="Largo (cm)"
            placeholder="Ej: 120"
            value={valor.dimLargoCm || ''}
            onChange={(e) => update({ dimLargoCm: parseFloat(e.target.value) || 0 })}
            disabled={disabled}
            inputProps={{ min: 1, max: 10000, step: 1 }}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">cm</Typography></InputAdornment>,
              },
            }}
          />
          <TextField
            fullWidth
            type="number"
            label="Ancho (cm)"
            placeholder="Ej: 80"
            value={valor.dimAnchoCm || ''}
            onChange={(e) => update({ dimAnchoCm: parseFloat(e.target.value) || 0 })}
            disabled={disabled}
            inputProps={{ min: 1, max: 10000, step: 1 }}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">cm</Typography></InputAdornment>,
              },
            }}
          />
          <TextField
            fullWidth
            type="number"
            label="Alto (cm)"
            placeholder="Ej: 100"
            value={valor.dimAltoCm || ''}
            onChange={(e) => update({ dimAltoCm: parseFloat(e.target.value) || 0 })}
            disabled={disabled}
            inputProps={{ min: 1, max: 10000, step: 1 }}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">cm</Typography></InputAdornment>,
              },
            }}
          />
        </Stack>

        {/* Volumen calculado */}
        {volumenM3 !== null && (
          <Box
            sx={{
              mt: 1.5,
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Chip
              size="small"
              icon={<StraightenOutlined sx={{ fontSize: '16px !important' }} />}
              label={`Volumen: ${volumenM3.toFixed(3)} m³`}
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="caption" color="text.disabled">
              {valor.dimLargoCm} × {valor.dimAnchoCm} × {valor.dimAltoCm} cm
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── SUGERENCIA DE VEHÍCULO ────────────────────────────────────── */}
      {todosCamposCompletos && resultado && (
        <Box>
          <Divider sx={{ mb: 2 }}>
            <Chip
              icon={<LocalShippingOutlined sx={{ fontSize: '16px !important' }} />}
              label="Vehículo sugerido"
              size="small"
              color="primary"
              variant="outlined"
            />
          </Divider>

          {resultado.vehiculo && (
            <Stack spacing={1.5}>
              {/* Barras de capacidad */}
              <Stack spacing={1}>
                <BarraCapacidad label={`Capacidad estimada — peso: ${formatKg(valor.pesoKg)} / ${resultado.vehiculo.capacidadPesoKg.toLocaleString()} kg`} percent={resultado.usoPesoPercent} />
                <BarraCapacidad label={`Capacidad estimada — volumen: ${volumenM3!.toFixed(2)} m³ / ${resultado.vehiculo.capacidadM3} m³`} percent={resultado.usoVolumenPercent} />
              </Stack>

              {/* Lista de vehículos — mínimo destacado */}
              <Stack spacing={1}>
                {VEHICULOS_SISETAC.map((v) => (
                  <TarjetaVehiculo
                    key={v.id}
                    vehiculo={v}
                    esMinimo={v.id === resultado.vehiculo!.id}
                  />
                ))}
              </Stack>

              {/* Nota informativa */}
              <Alert
                severity="info"
                icon={<CheckCircleOutlined fontSize="small" />}
                sx={{ fontSize: '0.78rem' }}
              >
                <strong>Vehículo mínimo:</strong> {resultado.vehiculo.nombre} —{' '}
                {resultado.vehiculo.descripcionCorta}.{' '}
                <Typography variant="caption" color="text.secondary">
                  Usos típicos: {resultado.vehiculo.ejemplos}.
                </Typography>
              </Alert>
            </Stack>
          )}
        </Box>
      )}
    </Stack>
  );
}
