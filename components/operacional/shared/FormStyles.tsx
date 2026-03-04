'use client';

import React, { useState } from 'react';
import { colors } from '@/lib/theme/colors';

/* ═══════════════════════════════════════════════════════════════════════════════
   Sistema de diseño — Formularios Operacionales CargoClick
   
   Estándar visual para todos los formularios del módulo operacional.
   Usa clases CSS (globals.css → .op-form, .op-grid-*) para responsividad.
   Los estilos inline quedan para colores/tokens de marca.
   
   Importar en cada formulario:
     import { ..., Grid2, Grid3, Grid4, CollapsibleCard, ... } from '@/components/operacional/shared/FormStyles';
   ═══════════════════════════════════════════════════════════════════════════════ */

/* Color acento corporativo para pills de paso */
const NAVY = '#0B3D91';
const NAVY_BG = '#EFF4FF';

/* -------------------------------------------------------------------------- */
/*  Tokens visuales base — campos de formulario                                 */
/* -------------------------------------------------------------------------- */

export const fieldStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #D1D9E0',
  borderRadius: 9,
  padding: '10px 14px',
  fontSize: 14,
  color: '#1E293B',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#FFFFFF',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 5,
  letterSpacing: '0.01em',
};

export const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: colors.textPlaceholder,
  marginBottom: 12,
};

export const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: colors.error,
  marginTop: 4,
};

export const helpText: React.CSSProperties = {
  fontSize: 11,
  color: '#94A3B8',
  marginTop: 3,
  lineHeight: 1.5,
};

/* -------------------------------------------------------------------------- */
/*  Card — contenedor principal de sección                                      */
/* -------------------------------------------------------------------------- */

export const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
};

export const cardHeader: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#0F172A',
  marginBottom: 2,
  lineHeight: 1.4,
};

export const cardSubtitle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748B',
  marginBottom: 0,
  lineHeight: 1.5,
};

export const sectionToggle: React.CSSProperties = {
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  userSelect: 'none',
};

export const chevronStyle = (open: boolean): React.CSSProperties => ({
  fontSize: 16,
  color: '#94A3B8',
  transition: 'transform 0.22s ease',
  transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
  flexShrink: 0,
  marginTop: 3,
  lineHeight: 1,
});

/* -------------------------------------------------------------------------- */
/*  Campos bloqueados / solo lectura                                             */
/* -------------------------------------------------------------------------- */

export const lockedFieldStyle: React.CSSProperties = {
  ...fieldStyle,
  background: '#F8FAFC',
  color: '#64748B',
  cursor: 'not-allowed',
  borderStyle: 'dashed',
  borderColor: '#CBD5E1',
};

/**
 * Overlay de bloqueo para secciones completas (ej: RNDC locked).
 * Uso: `style={{ ...lockedSection(isLocked) }}`
 */
export const lockedSection = (locked: boolean): React.CSSProperties =>
  locked ? { pointerEvents: 'none', opacity: 0.52 } : {};

/* -------------------------------------------------------------------------- */
/*  Sub-sección (remitente/destinatario dentro de un card)                      */
/* -------------------------------------------------------------------------- */

export const subsectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#94A3B8',
  marginBottom: 8,
  paddingBottom: 6,
  borderBottom: '1px solid #F1F5F9',
};

/* -------------------------------------------------------------------------- */
/*  Grid helpers — legacy inline (mantenidos para compatibilidad)               */
/*  PREFERIR los componentes Grid2, Grid3, Grid4 que son responsivos            */
/* -------------------------------------------------------------------------- */

export const grid2col: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
export const grid3col: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };
export const grid4col: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 };

/* -------------------------------------------------------------------------- */
/*  Grid components — responsivos vía clase CSS (globals.css → .op-grid-*)      */
/* -------------------------------------------------------------------------- */

interface GridProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/** 2 columnas en desktop, 1 columna en móvil */
export function Grid2({ children, style, className }: GridProps) {
  return <div className={`op-grid-2${className ? ' ' + className : ''}`} style={style}>{children}</div>;
}

/** 3 columnas en desktop, 2 en tablet, 1 en móvil */
export function Grid3({ children, style, className }: GridProps) {
  return <div className={`op-grid-3${className ? ' ' + className : ''}`} style={style}>{children}</div>;
}

/** 4 columnas en desktop, 2 en tablet/móvil */
export function Grid4({ children, style, className }: GridProps) {
  return <div className={`op-grid-4${className ? ' ' + className : ''}`} style={style}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/*  Utilidad: errBorder                                                         */
/* -------------------------------------------------------------------------- */

export function errBorder(
  field: string,
  fieldErrors: Record<string, string>,
): React.CSSProperties {
  return fieldErrors[field]
    ? { ...fieldStyle, borderColor: colors.error, boxShadow: '0 0 0 3px rgba(239,68,68,0.10)' }
    : fieldStyle;
}

/* -------------------------------------------------------------------------- */
/*  Componentes reutilizables                                                   */
/* -------------------------------------------------------------------------- */

/* ── AlertBanner ──────────────────────────────────────────────────────────── */

const bannerVariants = {
  error:   { bg: colors.errorBg,   border: colors.errorBorder,  text: colors.errorDark   },
  warning: { bg: colors.warningBg, border: colors.warningBorder, text: colors.warningDark },
  success: { bg: colors.successBg, border: colors.successBorder, text: colors.primaryDark },
  orange:  { bg: colors.orangeBg,  border: colors.orangeBorder,  text: colors.orangeDark  },
} as const;

export type AlertVariant = keyof typeof bannerVariants;

export function AlertBanner({
  variant,
  children,
  icon,
}: {
  variant: AlertVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const v = bannerVariants[variant];
  return (
    <div style={{
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 13,
      color: v.text,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {icon && <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

export function FormErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <AlertBanner variant="error">{message}</AlertBanner>;
}

/* ── CollapsibleCard ──────────────────────────────────────────────────────── */

export function CollapsibleCard({
  title,
  subtitle,
  open,
  onToggle,
  extraStyle,
  step,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  extraStyle?: React.CSSProperties;
  /** Número de paso para mostrar el pill numerado (1, 2, 3…) */
  step?: number;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ ...cardStyle, ...extraStyle }}>
      {/* ─── Header ─── */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 24px',
          background: hovered
            ? 'linear-gradient(to right, rgba(11,61,145,0.04), rgba(11,61,145,0.01))'
            : 'linear-gradient(to right, rgba(11,61,145,0.025), transparent)',
          borderBottom: open ? '1px solid #F1F5F9' : 'none',
          transition: 'background 0.18s',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Pill de paso */}
          {step != null && (
            <span style={{
              flexShrink: 0,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: open ? NAVY : '#94A3B8',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
              transition: 'background 0.2s',
              boxShadow: open ? `0 1px 4px ${NAVY}40` : 'none',
            }}>
              {step}
            </span>
          )}
          <div>
            <h3 style={cardHeader}>{title}</h3>
            {subtitle && <p style={cardSubtitle}>{subtitle}</p>}
          </div>
        </div>
        {/* Chevron */}
        <span style={chevronStyle(open)}>▾</span>
      </div>

      {/* ─── Body ─── */}
      {open && (
        <div style={{ padding: '20px 24px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── RadioPillGroup ───────────────────────────────────────────────────────── */

export interface RadioPillOption<T extends string = string> {
  value: T;
  label: string;
}

export const radioPillStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 15px', borderRadius: 8, cursor: 'pointer',
  fontSize: 13, fontWeight: active ? 600 : 400,
  background: active ? NAVY_BG : '#F8FAFC',
  border: `1.5px solid ${active ? NAVY : '#E2E8F0'}`,
  color: active ? NAVY : '#475569',
  transition: 'all 0.15s ease',
  boxShadow: active ? `0 0 0 3px ${NAVY}14` : 'none',
});

export function RadioDot({ active }: { active: boolean }) {
  return (
    <span style={{
      width: 15, height: 15, borderRadius: '50%',
      border: `2px solid ${active ? NAVY : '#CBD5E1'}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      transition: 'border-color 0.15s',
    }}>
      {active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: NAVY }} />}
    </span>
  );
}

export function RadioPillGroup<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: RadioPillOption<T>[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <label key={opt.value} style={radioPillStyle(value === opt.value)}>
          <input
            type="radio" name={name} value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ display: 'none' }}
          />
          <RadioDot active={value === opt.value} />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

/* ── InfoBadge ────────────────────────────────────────────────────────────── */

export function InfoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: NAVY_BG, color: NAVY,
      borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 500,
      display: 'inline-block', border: `1px solid #BFDBFE`,
    }}>
      {children}
    </span>
  );
}

export const bluePillBtnStyle: React.CSSProperties = {
  background: colors.blueBg, color: colors.blue,
  border: `1px solid ${colors.blueBorder}`, borderRadius: 6,
  padding: '4px 12px', fontSize: 12, fontWeight: 600,
  cursor: 'pointer',
};

/* ── HighlightSection ─────────────────────────────────────────────────────── */

export function HighlightSection({
  variant,
  title,
  children,
}: {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
}) {
  const v = bannerVariants[variant];
  return (
    <div style={{
      marginTop: 16, padding: '16px 20px',
      background: v.bg, border: `1px solid ${v.border}`, borderRadius: 10,
    }}>
      {title && (
        <p style={{
          fontSize: 11, fontWeight: 700, color: v.text,
          marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/* ── FieldError ───────────────────────────────────────────────────────────── */

export function FieldError({ error }: { error: string | undefined }) {
  if (!error) return null;
  return (
    <p style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10 }}>⚠</span> {error}
    </p>
  );
}

/* ── FormActions ──────────────────────────────────────────────────────────── */

export function FormActions({
  saving,
  onCancel,
  submitLabel,
  leftContent,
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
  leftContent?: React.ReactNode;
}) {
  const [submitHovered, setSubmitHovered] = useState(false);
  const [cancelHovered, setCancelHovered] = useState(false);

  return (
    <div style={{
      display: 'flex',
      justifyContent: leftContent ? 'space-between' : 'flex-end',
      alignItems: 'center',
      gap: 12,
      paddingTop: 20,
    }}>
      {leftContent ?? <div />}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          onMouseEnter={() => setCancelHovered(true)}
          onMouseLeave={() => setCancelHovered(false)}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            border: '1.5px solid #E2E8F0',
            borderRadius: 9,
            background: cancelHovered ? '#F1F5F9' : '#F8FAFC',
            color: '#374151',
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
            borderColor: cancelHovered ? '#CBD5E1' : '#E2E8F0',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          onMouseEnter={() => setSubmitHovered(true)}
          onMouseLeave={() => setSubmitHovered(false)}
          style={{
            padding: '10px 26px',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            borderRadius: 9,
            background: saving
              ? '#9CA3AF'
              : submitHovered
                ? 'linear-gradient(135deg, #047857 0%, #065F46 100%)'
                : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#FFFFFF',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.18s, transform 0.15s, box-shadow 0.15s',
            boxShadow: saving
              ? 'none'
              : submitHovered
                ? '0 4px 12px rgba(5,150,105,0.35)'
                : '0 2px 6px rgba(5,150,105,0.25)',
            transform: submitHovered && !saving ? 'translateY(-1px)' : 'none',
          }}
        >
          {saving ? '⏳ Guardando…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
