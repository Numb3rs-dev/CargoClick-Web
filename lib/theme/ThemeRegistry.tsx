/**
 * ThemeRegistry - Provider de Material-UI para Next.js
 * 
 * Envuelve la aplicación con el tema de Material-UI
 * Compatible con Next.js 15 + App Router
 */

'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es'; // Español para fechas
import { theme } from './themes';

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline: Resetea CSS y aplica estilos base de MUI */}
      <CssBaseline />
      
      {/* LocalizationProvider: Para date pickers en español */}
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
