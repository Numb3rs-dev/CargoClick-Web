/**
 * Sistema de Temas Corporativos - Material-UI
 * 
 * CAMBIAR TEMA: Edita la línea 88 en este archivo
 * 
 * Temas disponibles:
 * - corporateBlue: Azul corporativo profesional (default)
 * - techGreen: Verde tecnológico moderno
 * - elegantPurple: Púrpura elegante premium
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';

// ============================================
// TEMA 1: AZUL CORPORATIVO (Default)
// Empresas: IBM, Microsoft, Facebook
// ============================================
const corporateBlueTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',      // Azul corporativo
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',      // Rosa/rojo de acento
      light: '#f50057',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.1)',
    '0px 8px 16px rgba(0,0,0,0.15)',
    // ... más sombras
  ] as any,
};

// ============================================
// TEMA 2: VERDE TECNOLÓGICO
// Empresas: Spotify, Android, WhatsApp
// ============================================
const techGreenTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#00897b',      // Verde azulado
      light: '#4db6ac',
      dark: '#00695c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6f00',      // Naranja vibrante
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    success: {
      main: '#43a047',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#263238',
      secondary: '#546e7a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
};

// ============================================
// TEMA 3: PÚRPURA ELEGANTE
// Empresas: Stripe, Twitch, Yahoo
// ============================================
const elegantPurpleTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#7b1fa2',      // Púrpura profundo
      light: '#9c27b0',
      dark: '#4a148c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',      // Rosa vibrante
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    success: {
      main: '#388e3c',
    },
    background: {
      default: '#f3e5f5',   // Fondo ligeramente púrpura
      paper: '#ffffff',
    },
    text: {
      primary: '#1a237e',
      secondary: '#5e35b1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 20,
  },
};

// ============================================
// 🎨 CAMBIAR TEMA AQUÍ (Línea 171)
// ============================================
// Descomenta el tema que quieras usar:

export const theme = createTheme(corporateBlueTheme);     // <- TEMA ACTIVO
// export const theme = createTheme(techGreenTheme);
// export const theme = createTheme(elegantPurpleTheme);

// ============================================
// EXPORTS INDIVIDUALES (por si quieres usarlos dinámicamente)
// ============================================
export const themes = {
  corporateBlue: createTheme(corporateBlueTheme),
  techGreen: createTheme(techGreenTheme),
  elegantPurple: createTheme(elegantPurpleTheme),
};

export type ThemeName = keyof typeof themes;
