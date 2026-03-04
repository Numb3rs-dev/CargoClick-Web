/* ═══════════════════════════════════════════════════════════════════════════════
   Tokens de color — fuente única de verdad para TODA la UI operacional
   
   En lugar de hardcodear #059669 en 14+ archivos, importamos:
     import { colors } from '@/lib/theme/colors';
   
   Agrupados por función semántica, no por matiz.
   ═══════════════════════════════════════════════════════════════════════════════ */

export const colors = {
  /* ── Texto ─────────────────────────────────────────────────────────────── */
  textPrimary:   '#111827',   // títulos principales
  textDefault:   '#374151',   // cuerpo / labels
  textMuted:     '#6B7280',   // texto secundario
  textSecondary: '#4B5563',   // texto cuerpo intermedio
  textPlaceholder: '#9CA3AF', // placeholders, subtítulos

  /* ── Bordes / fondos neutros ───────────────────────────────────────────── */
  border:        '#D1D5DB',
  borderLight:   '#E5E7EB',
  borderLighter: '#F3F4F6',
  bgWhite:       '#FFFFFF',
  bgLight:       '#F9FAFB',   // fondo suave para secciones

  /* ── Verde principal (acciones primarias, éxito) ───────────────────────── */
  primary:       '#059669',   // botones, radio activo
  primaryDark:   '#065F46',   // texto sobre fondo verde claro
  primaryHover:  '#047857',
  primaryBg:     '#ECFDF5',   // fondo de radio/pill activo
  successBg:     '#F0FDF4',   // fondo de sección seguro
  successBorder: '#BBF7D0',
  disabledBtn:   '#9CA3AF',   // botón deshabilitado

  /* ── Azul (badges informativos, paginación, export) ────────────────────── */
  blue:          '#1D4ED8',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueHover:     '#DBEAFE',

  /* ── Rojo (errores) ────────────────────────────────────────────────────── */
  error:         '#EF4444',
  errorDark:     '#B91C1C',
  errorBg:       '#FEF2F2',
  errorBorder:   '#FECACA',
  errorBorderDark: '#FEE2E2',

  /* ── Amarillo (warnings / RNDC lock) ───────────────────────────────────── */
  warningDark:   '#92400E',
  warningBg:     '#FEF3C7',
  warningBorder: '#FDE68A',

  /* ── Naranja (mercancía peligrosa) ─────────────────────────────────────── */
  orangeDark:    '#C2410C',
  orangeBg:      '#FFF7ED',
  orangeBorder:  '#FED7AA',

  /* ── Página / layout ────────────────────────────────────────────────────── */
  pageBg:        '#F8FAFC',   // fondo de página (listas)

  /* ── Verde extra (badges de éxito/activo) ──────────────────────────────── */
  successBadgeBg:    '#D1FAE5',  // badge activo/RNDC ok
  successBadgeBorder:'#A7F3D0',  // borde badge éxito

  /* ── Rojo extra (peligro / bajas / errores badge) ──────────────────────── */
  danger:        '#DC2626',   // texto eliminar, badges peligro
  dangerDark:    '#991B1B',   // texto rojo oscuro en badges
  dangerBadgeBg: '#FEE2E2',  // fondo badge error
  dangerBg:      '#FEF2F2',  // fondo alerta rojo
  dangerBorder:  '#FCA5A5',  // borde alerta rojo

  /* ── Amarillo extra (warning banners) ──────────────────────────────────── */
  warningBg2:    '#FFFBEB',   // fondo warning más claro
  warningText:   '#A16207',   // texto warning secundario
  amberDark:     '#B45309',   // texto ámbar oscuro
  amber:         '#D97706',   // texto ámbar / pendiente

  /* ── Naranja extra ─────────────────────────────────────────────────────── */
  orangeText:    '#9A3412',   // texto naranja oscuro

  /* ── Púrpura (badges tipo/canal) ───────────────────────────────────────── */
  purple:        '#7C3AED',
  purpleDark:    '#5B21B6',
  purpleBg:      '#F3E8FF',
  purpleBgLight: '#EDE9FE',

  /* ── Azul extra ────────────────────────────────────────────────────────── */
  blueLight:     '#2563EB',   // azul más claro (gradientes)
  blueBg2:       '#F8FAFF',   // fondo sección azul tenue

  /* ── Dorado (condiciones) ──────────────────────────────────────────────── */
  gold:          '#FCD34D',   // dorado (estrella, condiciones)
  goldDark:      '#F59E0B',   // dorado más oscuro

  /* ── Hover genérico en dropdowns ───────────────────────────────────────── */
  hoverBlue:     '#F0F7FF',

  /* ── Brand / Marketing (páginas públicas) ──────────────────────────────── */
  brandGreen:     '#1F7A5C',   // CTA principal marketing
  brandGreenDark: '#155D47',   // hover CTA marketing
  brandText:      '#1A202C',   // texto principal marketing (ghost btn)
  brandTextDark:  '#1A1A1A',   // texto near-black nav/iconos marketing
  brandNavy:      '#0B3D91',   // azul "Cargo" logo
  brandNavyDark:  '#0A2A5E',   // footer fondo oscuro
  brandBgLight:   '#F5F7FA',   // fondo suave nav mobile / borders

  /* ── Footer (sobre fondo oscuro) ───────────────────────────────────────── */
  footerTextBright: 'rgba(255,255,255,0.80)',
  footerText:       'rgba(255,255,255,0.60)',
  footerTextDim:    'rgba(255,255,255,0.50)',
  footerBorder:     'rgba(255,255,255,0.15)',
} as const;

export type ColorToken = keyof typeof colors;
