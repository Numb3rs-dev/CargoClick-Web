/**
 * DynamicInput - Material-UI Version
 * 
 * Componente que renderiza inputs de Material-UI según el tipo de paso.
 * Mucho más fácil de mantener y con estilos profesionales listos.
 * 
 * Tipos soportados: text, email, phone, select, radio, buttons, number, textarea, checkbox, date, dimensions
 * 
 * @component
 */

'use client';

import { useState, useEffect } from 'react';
import type { PasoConfig } from '@/types';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Box,
  Stack,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Card,
  Collapse,
  Typography,
  IconButton,
  Chip,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  Email,
  Phone,
  ArrowForward,
  Business,
  Person,
  CalendarMonth,
  InfoOutlined,
  CheckCircleOutline,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { OriginDestinationDANE } from './inputs/OriginDestinationDANE';
import { WeightDimensionsInput, type WeightDimensionsValue } from './inputs/WeightDimensionsInput';

interface DynamicInputProps {
  config: PasoConfig;
  onSubmit: (valor: any) => Promise<void>;
  isLoading: boolean;
  defaultValue?: any;
  /** ID de la solicitud ya creada (disponible desde paso 6 en adelante) */
  solicitudId?: string | null;
}

const PAISES = [
  { code: '+57',  iso: 'co', name: 'Colombia',        minLen: 10, maxLen: 10, placeholder: '300 123 4567'   },
  { code: '+1',   iso: 'us', name: 'USA / Canadá',    minLen: 10, maxLen: 10, placeholder: '202 555 1234'   },
  { code: '+52',  iso: 'mx', name: 'México',          minLen: 10, maxLen: 10, placeholder: '55 1234 5678'   },
  { code: '+54',  iso: 'ar', name: 'Argentina',       minLen: 10, maxLen: 10, placeholder: '11 1234 5678'   },
  { code: '+55',  iso: 'br', name: 'Brasil',          minLen: 10, maxLen: 11, placeholder: '11 91234 5678'  },
  { code: '+56',  iso: 'cl', name: 'Chile',           minLen:  9, maxLen:  9, placeholder: '9 1234 5678'    },
  { code: '+51',  iso: 'pe', name: 'Perú',            minLen:  9, maxLen:  9, placeholder: '987 654 321'    },
  { code: '+593', iso: 'ec', name: 'Ecuador',         minLen:  9, maxLen:  9, placeholder: '99 123 4567'    },
  { code: '+58',  iso: 've', name: 'Venezuela',       minLen: 10, maxLen: 10, placeholder: '412 123 4567'   },
  { code: '+502', iso: 'gt', name: 'Guatemala',       minLen:  8, maxLen:  8, placeholder: '5123 4567'      },
  { code: '+503', iso: 'sv', name: 'El Salvador',     minLen:  8, maxLen:  8, placeholder: '7123 4567'      },
  { code: '+504', iso: 'hn', name: 'Honduras',        minLen:  8, maxLen:  8, placeholder: '9123 4567'      },
  { code: '+505', iso: 'ni', name: 'Nicaragua',       minLen:  8, maxLen:  8, placeholder: '8123 4567'      },
  { code: '+506', iso: 'cr', name: 'Costa Rica',      minLen:  8, maxLen:  8, placeholder: '8123 4567'      },
  { code: '+507', iso: 'pa', name: 'Panamá',          minLen:  8, maxLen:  8, placeholder: '6123 4567'      },
  { code: '+53',  iso: 'cu', name: 'Cuba',            minLen:  8, maxLen:  8, placeholder: '5123 4567'      },
  { code: '+1',   iso: 'do', name: 'Rep. Dominicana', minLen: 10, maxLen: 10, placeholder: '809 123 4567'   },
  { code: '+591', iso: 'bo', name: 'Bolivia',         minLen:  8, maxLen:  8, placeholder: '7123 4567'      },
  { code: '+595', iso: 'py', name: 'Paraguay',        minLen:  9, maxLen:  9, placeholder: '961 123 456'    },
  { code: '+598', iso: 'uy', name: 'Uruguay',         minLen:  9, maxLen:  9, placeholder: '91 234 567'     },
  { code: '+34',  iso: 'es', name: 'España',          minLen:  9, maxLen:  9, placeholder: '612 345 678'    },
  { code: '+44',  iso: 'gb', name: 'Reino Unido',     minLen: 10, maxLen: 10, placeholder: '7911 123456'    },
];

export function DynamicInput({ config, onSubmit, isLoading, defaultValue, solicitudId }: DynamicInputProps) {
  const [valor, setValor] = useState<any>(defaultValue || '');
  const [error, setError] = useState<string | null>(null);
  // Prefijo de país para el campo celular (separado del número)
  const [prefijoCelular, setPrefijoCelular] = useState('+57');
  // Panel de info expandible para tarjetas de tipo de carga
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

  // Reset cuando cambia el paso
  useEffect(() => {
    setValor(defaultValue || '');
    setError(null);
    setPrefijoCelular('+57');
    setExpandedInfo(null);
  }, [config.id, defaultValue]);

  // Validar con Zod
  const validar = (val: any): boolean => {
    try {
      config.validacion.parse(val);
      setError(null);
      return true;
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Valor inválido');
      return false;
    }
  };

  const esValorValido = (): boolean => {
    // Pasos 100% opcionales: el botón nunca se deshabilita
    if (config.tipoInput === 'company-data') return true;
    try {
      config.validacion.parse(valor);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Paso opcional: nunca bloquear, coercer string vacío a objeto vacío
    if (config.tipoInput === 'company-data') {
      const valorFinal = (typeof valor === 'object' && valor !== null) ? valor : {};
      try {
        await onSubmit(valorFinal);
        setValor('');
        setError(null);
      } catch (err) {
        setError('Error al guardar. Intenta nuevamente.');
      }
      return;
    }

    if (!validar(valor)) return;

    try {
      await onSubmit(valor);
      setValor('');
      setError(null);
    } catch (err) {
      setError('Error al guardar. Intenta nuevamente.');
    }
  };

  // Auto-submit para radio y buttons
  const autoSubmit = ['radio', 'buttons'].includes(config.tipoInput);

  useEffect(() => {
    if (autoSubmit && valor && !isLoading) {
      const timer = setTimeout(() => {
        if (validar(valor)) {
          onSubmit(valor);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [valor, autoSubmit, isLoading]);

  // Renderizar input según tipo
  const renderInput = () => {
    const { tipoInput, opciones } = config;

    switch (tipoInput) {
      case 'text':
      case 'email':
      case 'phone':
        // Icono según tipo
        const getIcon = () => {
          if (tipoInput === 'email') return <Email />;
          if (tipoInput === 'phone') return <Phone />;
          return config.campoFormulario === 'empresa' ? <Business /> : <Person />;
        };

        return (
          <TextField
            fullWidth
            type={tipoInput === 'email' ? 'email' : tipoInput === 'phone' ? 'tel' : 'text'}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => validar(valor)}
            placeholder={
              config.placeholder ||
              (tipoInput === 'email' ? 'ejemplo@empresa.com' :
              tipoInput === 'phone' ? '+573001234567' :
              'Escribe aquí...')
            }
            disabled={isLoading}
            error={!!error}
            autoFocus
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {getIcon()}
                </InputAdornment>
              ),
              sx: { fontSize: '1.125rem', fontWeight: 500 }
            }}
          />
        );

      case 'phone-email': {
        // valor es { telefono: string (prefijo+número), email: string }
        const pv = (typeof valor === 'object' && valor !== null && 'telefono' in valor)
          ? valor as { telefono: string; email: string }
          : { telefono: '', email: '' };

        // Extraer solo el número sin prefijo para mostrarlo en el campo
        const numeroCelular = pv.telefono.startsWith(prefijoCelular)
          ? pv.telefono.slice(prefijoCelular.length)
          : pv.telefono;

        const handleNumeroCelular = (num: string) => {
          // Solo dígitos, sin cero inicial (el prefijo ya lo maneja)
          const limpio = num.replace(/[^0-9]/g, '');
          setValor({ ...pv, telefono: prefijoCelular + limpio });
        };

        const handlePrefijo = (nuevoPrefijo: string) => {
          setPrefijoCelular(nuevoPrefijo);
          // Reconstruir telefono con nuevo prefijo manteniendo el número
          const numActual = pv.telefono.startsWith(prefijoCelular)
            ? pv.telefono.slice(prefijoCelular.length)
            : pv.telefono;
          setValor({ ...pv, telefono: nuevoPrefijo + numActual });
        };

        const paisActual = PAISES.find(p => p.code === prefijoCelular) ?? PAISES[0];

        return (
          <Stack spacing={2.5}>
            {/* Celular: selector de país + campo de número */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-start',
                }}
              >
                {/* Selector de prefijo */}
                <FormControl size="medium" sx={{ minWidth: 140, flexShrink: 0 }}>
                  <InputLabel>País</InputLabel>
                  <Select
                    value={prefijoCelular}
                    label="País"
                    onChange={(e) => handlePrefijo(e.target.value)}
                    disabled={isLoading}
                    renderValue={() => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <img
                          src={`https://flagcdn.com/20x15/${paisActual.iso}.png`}
                          width={20}
                          height={15}
                          alt={paisActual.name}
                          style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{prefijoCelular}</span>
                      </Box>
                    )}
                    MenuProps={{ PaperProps: { elevation: 2, sx: { maxHeight: 320 } } }}
                  >
                    {PAISES.map((pais, idx) => (
                      <MenuItem key={`${pais.code}-${idx}`} value={pais.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          <img
                            src={`https://flagcdn.com/20x15/${pais.iso}.png`}
                            width={20}
                            height={15}
                            alt={pais.name}
                            style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                            <span style={{ fontSize: '0.9rem' }}>{pais.name}</span>
                            <span style={{ color: '#8895A2', fontWeight: 600, fontSize: '0.85rem' }}>{pais.code}</span>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Campo de número */}
                <TextField
                  fullWidth
                  type="tel"
                  label="Número de celular"
                  value={numeroCelular}
                  onChange={(e) => handleNumeroCelular(e.target.value)}
                  onBlur={() => validar(valor)}
                  placeholder="300 123 4567"
                  disabled={isLoading}
                  autoFocus
                  size="medium"
                  inputProps={{ inputMode: 'numeric' }}
                  InputProps={{
                    sx: { fontSize: '1.125rem', fontWeight: 500 },
                  }}
                />
              </Box>
            </Box>

            {/* Correo electrónico */}
            <TextField
              fullWidth
              type="email"
              label="Correo electrónico"
              value={pv.email}
              onChange={(e) => setValor({ ...pv, email: e.target.value })}
              onBlur={() => validar(valor)}
              placeholder="ejemplo@empresa.com"
              disabled={isLoading}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
                sx: { fontSize: '1.125rem', fontWeight: 500 },
              }}
            />
          </Stack>
        );
      }

      case 'name-company': {
        // valor es { contacto: string, empresa?: string }
        const nv = (typeof valor === 'object' && valor !== null && 'contacto' in valor)
          ? valor as { contacto: string; empresa?: string }
          : { contacto: '', empresa: '' };

        return (
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Tu nombre"
              value={nv.contacto}
              onChange={(e) => setValor({ ...nv, contacto: e.target.value })}
              onBlur={() => validar(valor)}
              placeholder="Ej: María González"
              disabled={isLoading}
              autoFocus
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
                sx: { fontSize: '1.125rem', fontWeight: 500 },
              }}
            />
            <TextField
              fullWidth
              label="Empresa (opcional)"
              value={nv.empresa ?? ''}
              onChange={(e) => setValor({ ...nv, empresa: e.target.value })}
              placeholder="Opcional – puedes dejarlo vacío"
              disabled={isLoading}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business />
                  </InputAdornment>
                ),
                sx: { fontSize: '1.125rem', fontWeight: 500 },
              }}
            />
          </Stack>
        );
      }

      case 'client-data': {
        // valor es { contacto, telefono } — solo datos personales obligatorios
        type CdVal = { contacto: string; telefono: string };
        const cv = (typeof valor === 'object' && valor !== null && 'contacto' in valor)
          ? valor as CdVal
          : { contacto: '', telefono: '' };

        const paisActualCd = PAISES.find(p => p.code === prefijoCelular) ?? PAISES[0];

        const numeroCelularCd = cv.telefono?.startsWith(prefijoCelular)
          ? cv.telefono.slice(prefijoCelular.length)
          : cv.telefono ?? '';

        const handleNumeroCelularCd = (num: string) => {
          const limpio = num.replace(/[^0-9]/g, '').slice(0, paisActualCd.maxLen);
          setValor({ ...cv, telefono: prefijoCelular + limpio });
        };

        const handlePrefijoCd = (nuevoPrefijo: string) => {
          setPrefijoCelular(nuevoPrefijo);
          const numActual = cv.telefono?.startsWith(prefijoCelular)
            ? cv.telefono.slice(prefijoCelular.length)
            : cv.telefono ?? '';
          setValor({ ...cv, telefono: nuevoPrefijo + numActual });
        };

        // Validación visual de longitud por país
        const numLen = numeroCelularCd.length;
        const phoneOk = numLen === 0 || (numLen >= paisActualCd.minLen && numLen <= paisActualCd.maxLen);
        const phoneHint = numLen > 0 && !phoneOk
          ? `${paisActualCd.name} usa ${paisActualCd.minLen === paisActualCd.maxLen ? paisActualCd.minLen : `${paisActualCd.minLen}–${paisActualCd.maxLen}`} dígitos (ingresaste ${numLen})`
          : null;

        return (
          <Stack spacing={2.5}>

            {/* ── OBLIGATORIOS ───────────────────────────────────── */}

            {/* Nombre */}
            <TextField
              fullWidth
              label="Tu nombre completo"
              value={cv.contacto}
              onChange={(e) => setValor({ ...cv, contacto: e.target.value })}
              onBlur={() => validar(valor)}
              placeholder="Ej: María González"
              disabled={isLoading}
              autoFocus
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
                sx: { fontSize: '1.125rem', fontWeight: 500 },
              }}
            />

            {/* Celular con selector de país */}
            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                {/* Selector de país */}
                <FormControl size="medium" sx={{ minWidth: 140, flexShrink: 0 }}>
                  <InputLabel>País</InputLabel>
                  <Select
                    value={prefijoCelular}
                    label="País"
                    onChange={(e) => handlePrefijoCd(e.target.value)}
                    disabled={isLoading}
                    renderValue={() => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <img
                          src={`https://flagcdn.com/20x15/${paisActualCd.iso}.png`}
                          width={20}
                          height={15}
                          alt={paisActualCd.name}
                          style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{prefijoCelular}</span>
                      </Box>
                    )}
                    MenuProps={{ PaperProps: { elevation: 2, sx: { maxHeight: 320 } } }}
                  >
                    {PAISES.map((pais, idx) => (
                      <MenuItem key={`${pais.code}-${idx}`} value={pais.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          <img
                            src={`https://flagcdn.com/20x15/${pais.iso}.png`}
                            width={20}
                            height={15}
                            alt={pais.name}
                            style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                            <span style={{ fontSize: '0.9rem' }}>{pais.name}</span>
                            <span style={{ color: '#8895A2', fontWeight: 600, fontSize: '0.85rem' }}>{pais.code}</span>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Número */}
                <TextField
                  fullWidth
                  type="tel"
                  label="Celular"
                  value={numeroCelularCd}
                  onChange={(e) => handleNumeroCelularCd(e.target.value)}
                  onBlur={() => validar(valor)}
                  placeholder={paisActualCd.placeholder}
                  disabled={isLoading}
                  size="medium"
                  error={!!phoneHint}
                  inputProps={{ inputMode: 'numeric', maxLength: paisActualCd.maxLen }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ fontSize: '1.1rem', color: phoneOk && numLen > 0 ? 'success.main' : 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    sx: { fontSize: '1.125rem', fontWeight: 500 },
                  }}
                />
              </Box>
              {/* Hint de longitud por país */}
              {phoneHint && (
                <FormHelperText error sx={{ mt: 0.5, ml: 0.5 }}>
                  {phoneHint}
                </FormHelperText>
              )}
            </Box>

          </Stack>
        );
      }

      case 'company-data': {
        // valor es { empresa?, email?, telefonoEmpresa? } — todos opcionales
        type CmpVal = { empresa?: string; email?: string; telefonoEmpresa?: string };
        const initEmpresa = typeof defaultValue === 'string' ? defaultValue : '';
        const cv2 = (typeof valor === 'object' && valor !== null && !('contacto' in valor))
          ? valor as CmpVal
          : { empresa: initEmpresa, email: '', telefonoEmpresa: '' };

        return (
          <Stack spacing={2.5}>

            {/* Banner: todo opcional */}
            <Alert
              severity="info"
              icon={<InfoOutlined />}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-message': { fontSize: '0.875rem', lineHeight: 1.6 },
              }}
            >
              <strong>Todo aquí es opcional.</strong> Si no representas una empresa o prefieres no agregar estos
              datos ahora, simplemente continúa sin llenar nada.
            </Alert>

            {/* Empresa */}
            <TextField
              fullWidth
              label="Nombre de la empresa"
              value={cv2.empresa ?? ''}
              onChange={(e) => setValor({ ...cv2, empresa: e.target.value })}
              placeholder="Ej: Transportes Andinos S.A.S."
              disabled={isLoading}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                sx: { fontSize: '1.125rem', fontWeight: 500 },
              }}
            />

            {/* Correo de contacto */}
            <TextField
              fullWidth
              type="email"
              label="Correo electrónico"
              value={cv2.email ?? ''}
              onChange={(e) => setValor({ ...cv2, email: e.target.value })}
              onBlur={() => validar(valor)}
              placeholder="ejemplo@empresa.com"
              disabled={isLoading}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                sx: { fontSize: '1.125rem', fontWeight: 500 },
              }}
            />

            {/* Teléfono fijo de la empresa */}
            <TextField
              fullWidth
              type="tel"
              label="Teléfono de la empresa"
              value={cv2.telefonoEmpresa ?? ''}
              onChange={(e) => setValor({ ...cv2, telefonoEmpresa: e.target.value.replace(/[^0-9+\-\s()]/g, '') })}
              placeholder="Ej: 601 123 4567"
              disabled={isLoading}
              size="medium"
              inputProps={{ inputMode: 'tel' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ fontSize: '1.1rem', color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                sx: { fontSize: '1.125rem', fontWeight: 500 },
              }}
            />

          </Stack>
        );
      }

      case 'origin-destination': {
        // valor es { origen: string (DANE 5 dígitos), destino: string }
        const ov = (typeof valor === 'object' && valor !== null && 'origen' in valor)
          ? valor as { origen: string; destino: string }
          : { origen: '', destino: '' };

        return (
          <OriginDestinationDANE
            valor={ov}
            onChange={(nuevoValor) => {
              setValor(nuevoValor);
              // Disparar validación al actualizar
              try { config.validacion.parse(nuevoValor); setError(null); } catch { /* pendiente */ }
            }}
            disabled={isLoading}
          />
        );
      }

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            value={valor}
            onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
            onBlur={() => validar(valor)}
            placeholder="0"
            disabled={isLoading}
            error={!!error}
            autoFocus
            size="medium"
            InputProps={{
              sx: { fontSize: '1.125rem', fontWeight: 500 }
            }}
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => validar(valor)}
            placeholder="Escribe aquí..."
            disabled={isLoading}
            error={!!error}
            autoFocus
            InputProps={{
              sx: { fontSize: '1.125rem', fontWeight: 500 }
            }}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth error={!!error} size="medium">
            <InputLabel>Selecciona una opción</InputLabel>
            <Select
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onBlur={() => validar(valor)}
              disabled={isLoading}
              autoFocus
              sx={{ fontSize: '1.125rem', fontWeight: 500 }}
              MenuProps={{ PaperProps: { elevation: 2, sx: { maxHeight: 320 } } }}
            >
              {opciones?.map((opcion) => (
                <MenuItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            >
              {opciones?.map((opcion) => (
                <FormControlLabel
                  key={opcion.value}
                  value={opcion.value}
                  control={<Radio />}
                  label={
                    opcion.icon ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <img
                          src={opcion.icon}
                          alt=""
                          width={28}
                          height={28}
                          style={{ objectFit: 'contain', flexShrink: 0 }}
                        />
                        <span>{opcion.label}</span>
                      </Box>
                    ) : opcion.label
                  }
                  disabled={isLoading}
                  sx={{
                    mb: 1,
                    p: 2,
                    border: '2px solid',
                    borderColor: valor === opcion.value ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: 'action.hover',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'buttons': {
        // Detectar si hay contenido rico (descripciones expandibles)
        const tieneContenidoRico = opciones?.some(o => o.subtexto || o.descripcion);

        if (!tieneContenidoRico) {
          // Render simple ToggleButtonGroup (retrocompatible)
          return (
            <ToggleButtonGroup
              value={valor}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) setValor(newValue);
              }}
              fullWidth
              color="primary"
              disabled={isLoading}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              {opciones?.map((opcion) => (
                <ToggleButton
                  key={opcion.value}
                  value={opcion.value}
                  sx={{
                    py: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  {opcion.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          );
        }

        // Tarjetas expandibles con descripciones SISETAC
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {opciones?.map((opcion) => {
              const isSelected = valor === opcion.value;
              const isExpanded = expandedInfo === opcion.value;
              const tieneInfo = !!(opcion.descripcion || opcion.ejemplos || (opcion.checklist && opcion.checklist.length > 0));

              return (
                <Card
                  key={opcion.value}
                  elevation={0}
                  sx={{
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    opacity: isLoading ? 0.6 : 1,
                    boxShadow: isSelected
                      ? '0px 4px 12px rgba(25, 118, 210, 0.25)'
                      : '0px 1px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  <Box
                    onClick={() => !isLoading && setValor(opcion.value)}
                    sx={{
                      p: 2,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: tieneInfo ? '0' : 'inherit',
                      borderTopLeftRadius: 'inherit',
                      borderTopRightRadius: 'inherit',
                      borderBottomLeftRadius: tieneInfo ? 0 : 'inherit',
                      borderBottomRightRadius: tieneInfo ? 0 : 'inherit',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color={isSelected ? 'primary.main' : 'text.primary'}
                        >
                          {opcion.icon && <span style={{ marginRight: 6 }}>{opcion.icon}</span>}
                          {opcion.label}
                        </Typography>
                        {opcion.subtexto && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {opcion.subtexto}
                          </Typography>
                        )}
                      </Box>
                      {tieneInfo && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedInfo(isExpanded ? null : opcion.value);
                          }}
                          color={isExpanded ? 'primary' : 'default'}
                          sx={{ ml: 1, mt: -0.5 }}
                        >
                          <InfoOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  {tieneInfo && (
                    <Collapse in={isExpanded} unmountOnExit>
                      <Box
                        sx={{
                          px: 2,
                          pb: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'action.hover',
                        }}
                      >
                        {opcion.descripcion && (
                          <Typography variant="body2" sx={{ mt: 1.5 }}>
                            {opcion.descripcion}
                          </Typography>
                        )}
                        {opcion.ejemplos && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Ejemplos:</strong> {opcion.ejemplos}
                          </Typography>
                        )}
                        {opcion.checklist && opcion.checklist.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {opcion.checklist.map((item, i) => (
                              <Chip
                                key={i}
                                size="small"
                                icon={<CheckCircleOutline sx={{ fontSize: '14px !important' }} />}
                                label={item}
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  )}
                </Card>
              );
            })}
          </Box>
        );
      }

      case 'checkbox':
        const valorArray = Array.isArray(valor) ? valor : [];
        return (
          <FormControl component="fieldset" fullWidth>
            <FormGroup>
              {opciones?.map((opcion) => {
                const isChecked = valorArray.includes(opcion.value);
                return (
                  <FormControlLabel
                    key={opcion.value}
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => {
                          const newValor = e.target.checked
                            ? [...valorArray, opcion.value]
                            : valorArray.filter(v => v !== opcion.value);
                          setValor(newValor);
                        }}
                        disabled={isLoading}
                      />
                    }
                    label={opcion.label}
                    sx={{
                      mb: 1,
                      p: 2,
                      border: '2px solid',
                      borderColor: isChecked ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: 'primary.light',
                        bgcolor: 'action.hover',
                      },
                    }}
                  />
                );
              })}
            </FormGroup>
          </FormControl>
        );

      case 'date':
        // DatePicker de MUI — fechas pasadas bloqueadas en la UI, hoy siempre disponible
        return (
          <DatePicker
            value={valor ? dayjs(valor) : null}
            onChange={(newValue: Dayjs | null) => {
              setValor(newValue?.toDate() || null);
              if (newValue) validar(newValue.toDate());
            }}
            disabled={isLoading}
            minDate={dayjs().startOf('day')} // Hoy incluido, pasado bloqueado
            format="DD/MM/YYYY"
            slots={{ shortcuts: undefined }}
            slotProps={{
              desktopPaper: { elevation: 2 },
              shortcuts: {
                items: [
                  {
                    label: 'Hoy',
                    getValue: () => dayjs().startOf('day'),
                  },
                ],
              },
              textField: {
                fullWidth: true,
                error: !!error,
                size: 'medium',
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '1.125rem', fontWeight: 500 }
                },
              },
            }}
          />
        );

      case 'weight-dimensions': {
        const wdv: WeightDimensionsValue = (
          typeof valor === 'object' && valor !== null && 'pesoKg' in valor
        )
          ? valor as WeightDimensionsValue
          : { pesoKg: 0, dimLargoCm: 0, dimAnchoCm: 0, dimAltoCm: 0 };
        return (
          <WeightDimensionsInput
            valor={wdv}
            onChange={(nuevoValor) => {
              setValor(nuevoValor);
              setError(null);
            }}
            disabled={isLoading}
          />
        );
      }

      case 'dimensions':
        const dims = valor || { dimLargoCm: 0, dimAnchoCm: 0, dimAltoCm: 0 };
        return (
          <Stack spacing={3}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
            >
              <TextField
                fullWidth
                type="number"
                label="Largo (cm)"
                value={dims.dimLargoCm || ''}
                onChange={(e) => {
                  const newDims = { ...dims, dimLargoCm: parseFloat(e.target.value) || 0 };
                  setValor(newDims);
                }}
                onBlur={() => validar(valor)}
                disabled={isLoading}
                error={!!error}
                autoFocus
                InputProps={{
                  sx: { fontSize: '1.125rem', fontWeight: 500 }
                }}
              />
              <TextField
                fullWidth
                type="number"
                label="Ancho (cm)"
                value={dims.dimAnchoCm || ''}
                onChange={(e) => {
                  const newDims = { ...dims, dimAnchoCm: parseFloat(e.target.value) || 0 };
                  setValor(newDims);
                }}
                onBlur={() => validar(valor)}
                disabled={isLoading}
                error={!!error}
                InputProps={{
                  sx: { fontSize: '1.125rem', fontWeight: 500 }
                }}
              />
              <TextField
                fullWidth
                type="number"
                label="Alto (cm)"
                value={dims.dimAltoCm || ''}
                onChange={(e) => {
                  const newDims = { ...dims, dimAltoCm: parseFloat(e.target.value) || 0 };
                  setValor(newDims);
                }}
                onBlur={() => validar(valor)}
                disabled={isLoading}
                error={!!error}
                InputProps={{
                  sx: { fontSize: '1.125rem', fontWeight: 500 }
                }}
              />
            </Stack>

            {/* Cálculo de volumen */}
            {dims.dimLargoCm > 0 && dims.dimAnchoCm > 0 && dims.dimAltoCm > 0 && (
              <Alert severity="info" icon={false}>
                Volumen aproximado: {((dims.dimLargoCm * dims.dimAnchoCm * dims.dimAltoCm) / 1000000).toFixed(2)} m³
              </Alert>
            )}
          </Stack>
        );

      case 'checklist-extras': {
        type ClVal = { cargaPeligrosa: boolean; ayudanteCargue: boolean; ayudanteDescargue: boolean; cargaFragil: boolean; necesitaEmpaque: boolean };
        const initCl: ClVal = { cargaPeligrosa: false, ayudanteCargue: false, ayudanteDescargue: false, cargaFragil: false, necesitaEmpaque: false };
        const cl: ClVal = (typeof valor === 'object' && valor !== null && 'cargaPeligrosa' in valor)
          ? valor as ClVal
          : initCl;

        const toggle = (key: keyof ClVal) => setValor({ ...cl, [key]: !cl[key] });

        const items: { key: keyof ClVal; icon: string; label: string; sublabel: string }[] = [
          { key: 'cargaPeligrosa',    icon: '☢️', label: 'Carga peligrosa (HAZMAT)',     sublabel: 'Sustancias inflamables, corrosivas, tóxicas o explosivas' },
          { key: 'ayudanteCargue',    icon: '🚵', label: 'Ayudante en el cargue',        sublabel: 'Necesitas personal para subir o cargar la mercancía' },
          { key: 'ayudanteDescargue', icon: '🚵', label: 'Ayudante en el descargue',     sublabel: 'Necesitas personal para bajar o descargar la mercancía' },
          { key: 'cargaFragil',       icon: '🥚', label: 'Carga frágil',                  sublabel: 'Vidrio, cerámica, electrónicos, objetos delicados' },
          { key: 'necesitaEmpaque',   icon: '📦', label: 'Necesita embalaje',            sublabel: 'La carga llega sin empacar y hay que prepararla antes del viaje' },
        ];

        return (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
              Marca todo lo que aplique. Puedes continuar sin marcar nada.
            </Typography>

            {items.map(({ key, icon, label, sublabel }) => (
              <Box
                key={key}
                onClick={() => !isLoading && toggle(key)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.75,
                  borderRadius: 2,
                  border: '1.5px solid',
                  borderColor: cl[key] ? 'primary.main' : 'divider',
                  bgcolor: cl[key] ? 'primary.50' : 'background.paper',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { borderColor: 'primary.main', bgcolor: cl[key] ? 'primary.50' : 'action.hover' },
                }}
              >
                <Checkbox
                  checked={cl[key]}
                  disabled={isLoading}
                  onChange={() => toggle(key)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ p: 0.5, color: cl[key] ? 'primary.main' : 'text.disabled' }}
                />
                <Box sx={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{icon}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" fontWeight={cl[key] ? 600 : 400} sx={{ lineHeight: 1.3 }}>
                    {label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    {sublabel}
                  </Typography>
                </Box>
                {cl[key] && <CheckCircleOutline sx={{ color: 'primary.main', flexShrink: 0 }} />}
              </Box>
            ))}
          </Stack>
        );
      }

      case 'confirmation-extras': {
        type BoolKey = 'cargaPeligrosa' | 'ayudanteCargue' | 'ayudanteDescargue' | 'cargaFragil' | 'necesitaEmpaque' | 'multiplesDestinosEntrega' | 'requiereEscolta' | 'accesosDificiles' | 'cargaSobredimensionada';
        type DetailKey = 'detalleCargaPeligrosa' | 'detalleMultiplesDestinos' | 'detalleAccesosDificiles' | 'detalleSobredimensionada';
        type ConfVal = {
          observaciones: string;
          cargaPeligrosa: boolean; ayudanteCargue: boolean; ayudanteDescargue: boolean;
          cargaFragil: boolean; necesitaEmpaque: boolean;
          multiplesDestinosEntrega: boolean; requiereEscolta: boolean;
          accesosDificiles: boolean; cargaSobredimensionada: boolean;
          detalleCargaPeligrosa: string; detalleMultiplesDestinos: string;
          detalleAccesosDificiles: string; detalleSobredimensionada: string;
          skip?: boolean;
        };
        const initConf: ConfVal = {
          observaciones: '',
          cargaPeligrosa: false, ayudanteCargue: false, ayudanteDescargue: false,
          cargaFragil: false, necesitaEmpaque: false,
          multiplesDestinosEntrega: false, requiereEscolta: false,
          accesosDificiles: false, cargaSobredimensionada: false,
          detalleCargaPeligrosa: '', detalleMultiplesDestinos: '',
          detalleAccesosDificiles: '', detalleSobredimensionada: '',
        };
        const conf: ConfVal = (typeof valor === 'object' && valor !== null)
          ? { ...initConf, ...(valor as Partial<ConfVal>) }
          : initConf;

        const toggleConf = (key: BoolKey) => setValor({ ...conf, [key]: !conf[key] });
        const setDetalle = (key: DetailKey, val: string) => setValor({ ...conf, [key]: val });

        const confItems: { key: BoolKey; icon: string; label: string; sublabel: string; detalleKey?: DetailKey; detallePlaceholder?: string }[] = [
          { key: 'cargaPeligrosa',           icon: '☢️', label: 'Carga peligrosa (HAZMAT)',           sublabel: 'Sustancias inflamables, corrosivas, tóxicas o explosivas',
            detalleKey: 'detalleCargaPeligrosa',    detallePlaceholder: '¿Qué tipo de material? (clase HAZMAT, número ONU si lo conoces)' },
          { key: 'ayudanteCargue',           icon: '🧗', label: 'Ayudante en el cargue',              sublabel: 'Necesitas personal para subir o cargar la mercancía' },
          { key: 'ayudanteDescargue',        icon: '🧗', label: 'Ayudante en el descargue',           sublabel: 'Necesitas personal para bajar o descargar la mercancía' },
          { key: 'cargaFragil',              icon: '🥚', label: 'Carga frágil',                      sublabel: 'Vidrio, cerámica, electrónicos, objetos delicados' },
          { key: 'necesitaEmpaque',          icon: '📦', label: 'Necesita embalaje',                   sublabel: 'La carga llega sin empacar y hay que prepararla antes del viaje' },
          { key: 'multiplesDestinosEntrega', icon: '🗺️', label: 'Entrega en más de un punto',        sublabel: 'El camión necesita hacer varias paradas de descargue en el mismo viaje',
            detalleKey: 'detalleMultiplesDestinos',  detallePlaceholder: '¿Cuántas paradas? Indica las ciudades o direcciones aproximadas' },
          { key: 'requiereEscolta',          icon: '🛡️', label: 'Requiere escolta de seguridad',     sublabel: 'Carga de alto valor: efectivo, joyería, electrónicos de alto costo' },
          { key: 'accesosDificiles',         icon: '🚧', label: 'Acceso difícil en origen o destino',  sublabel: 'Vía sin pavimento, puente con límite de peso, portería con altura máxima',
            detalleKey: 'detalleAccesosDificiles',   detallePlaceholder: 'Describe la restricción: puente límite 5t, calle sin pavimento, portería baja...' },
          { key: 'cargaSobredimensionada',   icon: '🏗️', label: 'Carga sobredimensionada',            sublabel: 'Longitud o altura fuera de límites legales — puede requerir permiso INVIAS',
            detalleKey: 'detalleSobredimensionada',  detallePlaceholder: 'Dimensiones aproximadas que exceden lo normal (largo × ancho × alto)' },
        ];

        const idCorto = solicitudId?.slice(-8).toUpperCase() || '…';

        return (
          <Stack spacing={3}>
            {/* Encabezado de éxito */}
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <CheckCircleOutline sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700} color="success.dark" gutterBottom>
                ¡Solicitud recibida!
              </Typography>
              <Chip
                label={`#COT-${idCorto}`}
                color="primary"
                sx={{ fontSize: '0.95rem', fontWeight: 700, px: 1, mt: 0.5 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 380, mx: 'auto' }}>
                Un asesor se contactará contigo con la cotización.
              </Typography>
            </Box>

            <Divider />

            {/* Observaciones */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                ¿Alguna instrucción especial?
              </Typography>
              <TextField
                multiline
                rows={3}
                label="Observaciones (opcional)"
                placeholder="Ej: recogida solo en la mañana, acceso restringido por peso, manejo delicado..."
                value={conf.observaciones}
                onChange={(e) => setValor({ ...conf, observaciones: e.target.value })}
                disabled={isLoading}
                fullWidth
                variant="outlined"
              />
            </Box>

            {/* Checklist de condiciones */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                ¿Aplica alguna de estas condiciones?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Marca todo lo que aplique — ayuda al comercial a cotizar mejor.
              </Typography>
              <Stack spacing={1.5}>
                {confItems.map(({ key, icon, label, sublabel, detalleKey, detallePlaceholder }) => (
                  <Box key={key}>
                    <Box
                      onClick={() => !isLoading && toggleConf(key)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.75,
                        borderRadius: 2,
                        border: '1.5px solid',
                        borderColor: conf[key] ? 'primary.main' : 'divider',
                        bgcolor: conf[key] ? 'primary.50' : 'background.paper',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: 'primary.main', bgcolor: conf[key] ? 'primary.50' : 'action.hover' },
                      }}
                    >
                      <Checkbox
                        checked={conf[key]}
                        disabled={isLoading}
                        onChange={() => toggleConf(key)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ p: 0.5, color: conf[key] ? 'primary.main' : 'text.disabled' }}
                      />
                      <Box sx={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{icon}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={conf[key] ? 600 : 400} sx={{ lineHeight: 1.3 }}>
                          {label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                          {sublabel}
                        </Typography>
                      </Box>
                      {conf[key] && <CheckCircleOutline sx={{ color: 'primary.main', flexShrink: 0 }} />}
                    </Box>
                    {detalleKey && (
                      <Collapse in={conf[key]}>
                        <Box sx={{ pl: 6.5, pt: 1 }}>
                          <TextField
                            multiline
                            rows={2}
                            size="small"
                            label="Detalle (opcional)"
                            placeholder={detallePlaceholder}
                            value={conf[detalleKey]}
                            onChange={(e) => setDetalle(detalleKey, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={isLoading}
                            fullWidth
                            variant="outlined"
                          />
                        </Box>
                      </Collapse>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Botones de acción */}
            <Stack spacing={1}>
              <Button
                variant="contained"
                size="large"
                disabled={isLoading}
                onClick={() => onSubmit({ ...conf, skip: false })}
                endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                sx={{
                  py: 2,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 3,
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                  transition: 'all 0.3s',
                }}
              >
                {isLoading ? 'Guardando...' : 'Enviar detalles'}
              </Button>
              <Button
                variant="text"
                size="medium"
                disabled={isLoading}
                onClick={() => onSubmit({ skip: true })}
                sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 400 }}
              >
                Listo, gracias — no necesito agregar nada
              </Button>
            </Stack>
          </Stack>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* Input dinámico */}
        {renderInput()}

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ fontSize: '0.875rem' }}>
            {error}
          </Alert>
        )}

        {/* Botón continuar (solo para inputs que no son auto-submit ni manejan sus propios botones) */}
        {!autoSubmit && config.tipoInput !== 'confirmation-extras' && (
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading || !esValorValido()}
            endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
            sx={{
              py: 2.5,
              fontSize: '1.125rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s',
            }}
          >
            {isLoading ? 'Guardando...' : 'Continuar'}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
