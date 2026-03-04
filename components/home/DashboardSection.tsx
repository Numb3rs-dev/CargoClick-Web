'use client';

/**
 * DashboardSection – Panel de acceso rápido a los módulos del sistema.
 *
 * Client Component. Detecta si el usuario está autenticado con useAuth().
 * Autenticado → muestra las tarjetas de módulos.
 * No autenticado → invitación a iniciar sesión.
 */

import Link from 'next/link';
import { type ReactElement } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Briefcase,
  Users,
  Truck,
  FileText,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

interface DashboardModule {
  href: string;
  icon: ReactElement;
  label: string;
  description: string;
  color: string;
  colorText: string;
}

const MODULES: DashboardModule[] = [
  {
    href: '/operacional/negocios',
    icon: <Briefcase size={24} />,
    label: 'Negocios',
    description: 'Gestiona negocios, remesas y manifiestos de transporte.',
    color: '#DBEAFE',
    colorText: '#1D4ED8',
  },
  {
    href: '/cotizaciones',
    icon: <FileText size={24} />,
    label: 'Cotizaciones',
    description: 'Consulta y administra todas las cotizaciones SISETAC.',
    color: '#D1FAE5',
    colorText: '#065F46',
  },
  {
    href: '/operacional/conductores',
    icon: <Users size={24} />,
    label: 'Conductores',
    description: 'Directorio de conductores con sincronización RNDC.',
    color: '#EDE9FE',
    colorText: '#5B21B6',
  },
  {
    href: '/operacional/vehiculos',
    icon: <Truck size={24} />,
    label: 'Vehículos',
    description: 'Directorio de vehículos con registro y hojas de vida.',
    color: '#FEF3C7',
    colorText: '#92400E',
  },
];

export default function DashboardSection() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) {
    return (
      <section
        style={{
          background: '#F8FAFC',
          borderTop: '1px solid #E8EDF3',
          padding: 'clamp(40px, 6vw, 72px) 0',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 clamp(20px, 5vw, 40px)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#E8F5EF',
              color: '#1F7A5C',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            <LayoutDashboard size={14} />
            Plataforma Operacional
          </div>

          <h2
            style={{
              fontSize: 'clamp(22px, 3.5vw, 34px)',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            Accede al panel de operaciones
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: '#6B7280',
              marginBottom: '28px',
              maxWidth: '480px',
              margin: '0 auto 28px',
            }}
          >
            Inicia sesión para gestionar negocios, conductores, vehículos y cotizaciones desde un solo lugar.
          </p>
          <Link
            href="/sign-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#1F7A5C',
              color: '#FFFFFF',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
            }}
          >
            Iniciar sesión
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        background: '#F8FAFC',
        borderTop: '1px solid #E8EDF3',
        padding: 'clamp(40px, 6vw, 72px) 0',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 clamp(20px, 5vw, 40px)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#E8F5EF',
              color: '#1F7A5C',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            <LayoutDashboard size={14} />
            Panel de control
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 3vw, 32px)',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '6px',
              lineHeight: 1.2,
            }}
          >
            Módulos del sistema
          </h2>
          <p style={{ fontSize: '15px', color: '#6B7280' }}>
            Accede rápidamente a todas las secciones operacionales.
          </p>
        </div>

        {/* Grid de módulos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {MODULES.map(({ href, icon, label, description, color, colorText }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#FFFFFF',
                border: '1px solid #E8EDF3',
                borderRadius: '12px',
                padding: '20px',
                textDecoration: 'none',
                transition: 'box-shadow 180ms ease, transform 180ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  '0 4px 16px rgba(0,0,0,0.08)';
                (e.currentTarget as HTMLAnchorElement).style.transform =
                  'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              }}
            >
              {/* Ícono */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: color,
                  color: colorText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>

              {/* Texto */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1A1A1A',
                    marginBottom: '4px',
                  }}
                >
                  {label}
                </p>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.4 }}>
                  {description}
                </p>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ArrowRight size={16} color="#9CA3AF" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
