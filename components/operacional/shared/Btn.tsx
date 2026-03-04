'use client';

import React from 'react';
import { colors } from '@/lib/theme/colors';

/* ═══════════════════════════════════════════════════════════════════════════════
   Btn — Botón universal para toda la plataforma operacional
   
   Variantes:
     primary   → verde corporativo (#059669)     — acciones principales
     secondary → outline gris                     — cancelar, alternativas
     danger    → rojo                             — eliminar, desactivar
     blue      → azul corporativo                 — PDF, informativo
     ghost     → sin fondo, solo texto            — back, links
   
   Tamaños:
     sm  → tabla, acciones inline (6px 14px, 13px)
     md  → formularios, page headers (9px 22px, 14px)  ← default
     lg  → CTAs grandes (12px 28px, 15px)
   
   Uso:
     <Btn variant="primary" onClick={save}>Guardar</Btn>
     <Btn variant="danger" size="sm" loading>Eliminando…</Btn>
     <Btn variant="secondary" onClick={cancel}>Cancelar</Btn>
   ═══════════════════════════════════════════════════════════════════════════════ */

/* -------------------------------------------------------------------------- */
/*  Variant & size tokens                                                       */
/* -------------------------------------------------------------------------- */

const variantTokens = {
  primary: {
    bg:         colors.primary,
    bgHover:    colors.primaryHover,
    bgDisabled: colors.disabledBtn,
    color:      colors.bgWhite,
    border:     'none',
  },
  secondary: {
    bg:         colors.bgWhite,
    bgHover:    colors.bgLight,
    bgDisabled: colors.bgLight,
    color:      colors.textDefault,
    border:     `1px solid ${colors.border}`,
  },
  danger: {
    bg:         colors.errorBg,
    bgHover:    colors.errorBorderDark,
    bgDisabled: colors.bgLight,
    color:      colors.error,
    border:     `1px solid ${colors.errorBorder}`,
  },
  blue: {
    bg:         colors.blue,
    bgHover:    '#1E40AF',
    bgDisabled: colors.disabledBtn,
    color:      colors.bgWhite,
    border:     'none',
  },
  ghost: {
    bg:         'transparent',
    bgHover:    colors.bgLight,
    bgDisabled: 'transparent',
    color:      colors.textDefault,
    border:     'none',
  },
} as const;

const sizeTokens = {
  sm: { padding: '6px 14px', fontSize: 13, fontWeight: 600 as const },
  md: { padding: '9px 22px', fontSize: 14, fontWeight: 600 as const },
  lg: { padding: '12px 28px', fontSize: 15, fontWeight: 700 as const },
} as const;

export type BtnVariant = keyof typeof variantTokens;
export type BtnSize    = keyof typeof sizeTokens;

/* -------------------------------------------------------------------------- */
/*  Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface BtnProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?:  BtnVariant;
  size?:     BtnSize;
  loading?:  boolean;
  /** Si true, se renderiza como full-width */
  block?:    boolean;
  /** Estilos extra para casos puntuales */
  sx?:       React.CSSProperties;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function Btn({
  variant = 'primary',
  size    = 'md',
  loading = false,
  block   = false,
  sx,
  disabled,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: BtnProps) {
  const v = variantTokens[variant];
  const s = sizeTokens[size];
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: s.padding,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    fontFamily: 'inherit',
    lineHeight: 1.4,
    border: v.border,
    borderRadius: 8,
    background: isDisabled ? v.bgDisabled : v.bg,
    color: isDisabled && variant !== 'secondary' ? colors.bgWhite : v.color,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled && variant === 'ghost' ? 0.5 : 1,
    transition: 'background 0.15s, border-color 0.15s',
    ...(block ? { width: '100%' } : {}),
    ...sx,
  };

  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.background = v.bgHover;
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.background = v.bg;
        }
        onMouseLeave?.(e);
      }}
    >
      {loading && <span style={{ fontSize: s.fontSize - 2 }}>⟳</span>}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Presets de estilo exportados (para uso directo sin el componente)            */
/* -------------------------------------------------------------------------- */

/** Estilo para botones "+ Nuevo" en page headers */
export const pageHeaderBtnStyle: React.CSSProperties = {
  background: colors.primary,
  color: colors.bgWhite,
  borderRadius: 8,
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.15s',
};

/** Estilo para botones de acción en tablas (Editar) */
export const tableEditBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 13,
  fontWeight: 600,
  color: colors.textDefault,
  background: colors.bgWhite,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
};

/** Estilo para botones destructivos en tablas (Cancelar/Desactivar) */
export const tableDangerBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 13,
  fontWeight: 600,
  color: colors.error,
  background: colors.errorBg,
  border: `1px solid ${colors.errorBorder}`,
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  transition: 'background 0.15s',
};
