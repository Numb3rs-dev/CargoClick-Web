/**
 * ConversacionCotizacion - Wizard principal del flujo de cotización
 * 
 * Gestiona el flujo completo en estilo wizard página por página:
 * - Landing page (paso -1)
 * - 14 pasos progresivos (paso 0-13) 
 * - Pantalla de completado (paso >= 14)
 * 
 * INTEGRADO CON:
 * - useConversacion hook: Motor de wizard con guardado progresivo
 * - DynamicInput: Inputs especializados según tipo de paso
 * - ProgressIndicator: Dots visuales de progreso
 * - LandingPage: Pantalla de bienvenida
 * - PantallaCompletada: Pantalla de éxito
 * 
 * UX: Una pregunta por página, navegación con botones, auto-guardado silencioso
 * Accesibilidad: ARIA labels, navegación con teclado, estados claros
 * 
 * @component
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { useConversacion } from '../hooks/useConversacion';
import { DynamicInput } from './DynamicInputMUI'; // MUI version
import { ProgressIndicator } from '@/components/shared/ProgressIndicator';
import { LandingPage } from './LandingPage';
import { PantallaCompletada } from './PantallaCompletada';
import { TOTAL_PASOS } from '../config/pasos';
import { Box, Container, IconButton, Typography, Paper, Alert, Fade, LinearProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

export function ConversacionCotizacion() {
  // Detectar si venimos desde "/cotizar?reanudar=<id>" (enlace de solicitud existente)
  const searchParams = useSearchParams();
  const reanudarId = searchParams.get('reanudar') ?? undefined;

  // Hook principal con toda la lógica del wizard
  const {
    pasoActual,
    isLoading,
    error,
    solicitudId,
    datosForm,
    pasoConfig,
    mostrarPaso,
    iniciarFormulario,
    siguientePaso,
    pasoAnterior,
    resetear,
  } = useConversacion(reanudarId);

  // Landing page (no iniciado)
  if (pasoActual === -1) {
    return <LandingPage onStart={iniciarFormulario} />;
  }

  // Formulario completado
  if (pasoActual >= TOTAL_PASOS) {
    return (
      <PantallaCompletada
        solicitudId={solicitudId}
        email={datosForm.email}
        onNuevaCotizacion={resetear}
      />
    );
  }

  // Skip paso si no debe mostrarse (condicional)
  // Esto se maneja automáticamente en siguientePaso()

  // Renderizar paso actual (wizard)
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FDFCFE',
      }}
    >
      {/* Loading bar superior */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        />
      )}

      {/* Header: navegación + progreso */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid rgba(200,202,208,0.5)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
            }}
          >
            {/* Botón Atrás */}
            {pasoActual > 0 ? (
              <IconButton
                onClick={pasoAnterior}
                disabled={isLoading}
                size="large"
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
            ) : (
              <Box sx={{ width: 48 }} />
            )}

            {/* Indicador de progreso */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <ProgressIndicator
                pasoActual={pasoActual}
                totalPasos={TOTAL_PASOS}
                variant="dots"
              />
            </Box>

            <Box sx={{ width: 48 }} />
          </Box>
        </Container>
      </Paper>

      {/* Main: pregunta + input */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 8,
        }}
      >
        <Fade in timeout={500}>
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="h3"
                component="h1"
                fontWeight={700}
                gutterBottom
                sx={{
                  fontSize: { xs: '1.8rem', md: '2.6rem' },
                  color: '#0B3D91',
                  lineHeight: 1.25,
                }}
              >
                {pasoConfig.pregunta}
              </Typography>
            </Box>

            <DynamicInput
              config={pasoConfig}
              onSubmit={siguientePaso}
              isLoading={isLoading}
              defaultValue={
                pasoConfig.tipoInput === 'client-data'
                  ? { contacto: datosForm.contacto ?? '', telefono: datosForm.telefono ?? '' }
                  : pasoConfig.tipoInput === 'company-data'
                  ? { empresa: datosForm.empresa ?? '', email: datosForm.email ?? '', telefonoEmpresa: datosForm.telefonoEmpresa ?? '' }
                  : pasoConfig.tipoInput === 'origin-destination'
                  ? { origen: datosForm.origen ?? '', destino: datosForm.destino ?? '' }
                  : pasoConfig.tipoInput === 'weight-dimensions'
                  ? { pesoKg: datosForm.pesoKg ?? 0, dimLargoCm: datosForm.dimLargoCm ?? 0, dimAnchoCm: datosForm.dimAnchoCm ?? 0, dimAltoCm: datosForm.dimAltoCm ?? 0 }
                  : datosForm[pasoConfig.campoFormulario as keyof typeof datosForm]
              }
              solicitudId={solicitudId}
            />

            {/* Error global */}
            {error && (
              <Fade in>
                <Alert severity="error" sx={{ mt: 3 }}>
                  {error}
                </Alert>
              </Fade>
            )}
          </Container>
        </Fade>
      </Box>

      {/* Footer */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#FFFFFF',
          borderTop: '1px solid rgba(200,202,208,0.5)',
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            fontWeight={500}
          >
            Paso {pasoActual + 1} de {TOTAL_PASOS} • 
            <Typography
              component="span"
              color="success.main"
              fontWeight={600}
              sx={{ ml: 1 }}
            >
              ✓ Guardado automático
            </Typography>
          </Typography>
        </Container>
      </Paper>
    </Box>
  );
}
