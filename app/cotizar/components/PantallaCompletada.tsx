'use client';

import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Fade,
  Stack,
} from '@mui/material';
import { CheckCircle, AddCircleOutline, WhatsApp, Email } from '@mui/icons-material';

interface PantallaCompletadaProps {
  /** ID de la solicitud creada (ULID) */
  solicitudId: string | null;
  /** Email del contacto (para confirmación) */
  email?: string;
  /** Callback para iniciar nueva cotización */
  onNuevaCotizacion: () => void;
}

export function PantallaCompletada({
  solicitudId,
  email,
  onNuevaCotizacion,
}: PantallaCompletadaProps) {
  const idCorto = solicitudId?.slice(-8).toUpperCase() || 'N/A';

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#FDFCFE',
        px: 3,
        py: 8,
      }}
    >
      <Fade in timeout={600}>
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              border: '1.5px solid',
              borderColor: 'divider',
              borderRadius: 3,
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              bgcolor: '#FFFFFF',
            }}
            role="alert"
            aria-live="polite"
          >
            {/* Icono de éxito */}
            <Box sx={{ mb: 2.5 }}>
              <CheckCircle
                sx={{
                  fontSize: 72,
                  color: 'primary.main',
                  filter: 'drop-shadow(0 4px 12px rgba(25,118,210,0.25))',
                }}
              />
            </Box>

            {/* Título */}
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              sx={{ color: '#0B3D91', mb: 1.5 }}
            >
              ¡Solicitud recibida!
            </Typography>

            {/* Número de referencia */}
            <Chip
              label={`#COT-${idCorto}`}
              color="primary"
              sx={{ fontSize: '1rem', fontWeight: 700, px: 1.5, mb: 3 }}
            />

            <Divider sx={{ mb: 3 }} />

            {/* Qué sigue */}
            <Stack spacing={1.5} sx={{ textAlign: 'left', mb: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                ¿Qué sigue?
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Typography sx={{ fontSize: '1.1rem', lineHeight: 1.5 }}>📋</Typography>
                <Typography variant="body2" color="text.secondary">
                  Nuestro equipo ya recibió tu solicitud y la está revisando.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Typography sx={{ fontSize: '1.1rem', lineHeight: 1.5 }}>👤</Typography>
                <Typography variant="body2" color="text.secondary">
                  Un asesor se comunicará contigo para enviarte la cotización.
                </Typography>
              </Box>

              {email && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Email sx={{ fontSize: '1.15rem', mt: 0.2, color: 'text.disabled' }} />
                  <Typography variant="body2" color="text.secondary">
                    Cotización al correo{' '}
                    <Typography component="span" fontWeight={600} color="text.primary" variant="body2">
                      {email}
                    </Typography>
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <WhatsApp sx={{ fontSize: '1.15rem', mt: 0.2, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">
                  También podemos contactarte por WhatsApp al número que nos diste.
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Referencia */}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
              Guarda tu número de referencia{' '}
              <Typography component="span" fontWeight={700} color="primary.main" variant="caption">
                #COT-{idCorto}
              </Typography>{' '}
              para hacer seguimiento.
            </Typography>

            {/* Botón nueva cotización */}
            <Button
              variant="contained"
              size="large"
              onClick={onNuevaCotizacion}
              startIcon={<AddCircleOutline />}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: 3,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.25s ease',
              }}
              aria-label="Iniciar nueva cotización"
            >
              Cotizar otro envío
            </Button>
          </Paper>
        </Container>
      </Fade>
    </Box>
  );
}
