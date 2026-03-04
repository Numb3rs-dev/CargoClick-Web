'use client';

import React from 'react';
import { colors } from '@/lib/theme/colors';
import { Btn, type BtnVariant } from './Btn';

/* ═══════════════════════════════════════════════════════════════════════════════
   PageHeader — Franja superior estándar para todas las páginas operacionales
   
   Reemplaza el patrón repetido en 7+ PageClient con:
     - Breadcrumb ("Operacional")
     - Título + subtítulo
     - Botón de acción principal opcional (+ Remesa, + Negocio, etc.)
   
   Uso:
     <PageHeader
       breadcrumb="Operacional"
       title="Remesas"
       subtitle={`${total} remesa${total !== 1 ? 's' : ''} en total`}
       actionLabel="+ Remesa"
       onAction={() => router.push('/operacional/remesas/nueva')}
     />
   ═══════════════════════════════════════════════════════════════════════════════ */

interface PageHeaderAction {
  label:    string;
  onClick:  () => void;
  variant?: BtnVariant;
}

export interface PageHeaderProps {
  breadcrumb?:  string;
  title:        string;
  subtitle?:    string;
  /** Atajo simple para un solo botón primario */
  actionLabel?: string;
  onAction?:    () => void;
  /** Para múltiples acciones o variantes personalizadas */
  actions?:     PageHeaderAction[];
  /** Contenido extra a la derecha (en lugar de acciones) */
  rightContent?: React.ReactNode;
}

export function PageHeader({
  breadcrumb,
  title,
  subtitle,
  actionLabel,
  onAction,
  actions,
  rightContent,
}: PageHeaderProps) {
  return (
    <div style={{
      background: colors.bgWhite,
      borderBottom: `1px solid ${colors.borderLight}`,
      padding: '28px 0',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {breadcrumb && (
          <p style={{ fontSize: 12, color: colors.textPlaceholder, marginBottom: 4 }}>
            {breadcrumb}
          </p>
        )}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 14, color: colors.textMuted, margin: '4px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Acciones */}
          {rightContent ?? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {actions?.map((a, i) => (
                <Btn key={i} variant={a.variant ?? 'primary'} onClick={a.onClick}>
                  {a.label}
                </Btn>
              ))}
              {actionLabel && onAction && (
                <Btn variant="primary" onClick={onAction}>
                  {actionLabel}
                </Btn>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
