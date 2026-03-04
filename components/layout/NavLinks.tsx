'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CSSProperties } from 'react';
import { colors } from '@/lib/theme/colors';

/**
 * Links de navegación reutilizables para desktop y drawer mobile.
 *
 * @param orientation - 'horizontal' (desktop) | 'vertical' (drawer)
 * @param onLinkClick - Callback para cerrar el drawer al navegar
 */
interface NavLinksProps {
  orientation: 'horizontal' | 'vertical';
  onLinkClick?: () => void;
}

const NAV_LINKS = [
  { text: 'Inicio', href: '/home' },
  { text: 'Servicios', href: '/servicios' },
  { text: 'Quiénes Somos', href: '/quienes-somos' },
  { text: 'Operacional', href: '/operacional/negocios' },
  { text: 'Cotizaciones', href: '/cotizaciones' },
];

export default function NavLinks({ orientation, onLinkClick }: NavLinksProps) {
  const pathname = usePathname();

  const containerStyle: CSSProperties =
    orientation === 'horizontal'
      ? { display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'center' }
      : { display: 'flex', flexDirection: 'column', gap: '0' };

  return (
    <ul style={{ ...containerStyle, listStyle: 'none', margin: 0, padding: 0 }}>
      {NAV_LINKS.map(({ text, href }) => {
        const isActive = pathname === href;

        const linkStyle: CSSProperties =
          orientation === 'horizontal'
            ? {
                color: isActive ? colors.brandGreen : colors.brandTextDark,
                fontWeight: isActive ? 600 : 500,
                fontSize: '15px',
                textDecoration: 'none',
                transition: 'color 200ms ease',
              }
            : {
                display: 'block',
                color: isActive ? colors.brandGreen : colors.brandTextDark,
                fontWeight: 500,
                fontSize: '16px',
                padding: '16px 24px',
                borderBottom: `1px solid ${colors.brandBgLight}`,
                textDecoration: 'none',
                transition: 'color 200ms ease, background-color 200ms ease',
              };

        return (
          <li key={href}>
            <Link
              href={href}
              style={linkStyle}
              onClick={onLinkClick}
              aria-current={isActive ? 'page' : undefined}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = colors.brandGreen;
                if (orientation === 'vertical') {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = colors.brandBgLight;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = isActive ? colors.brandGreen : colors.brandTextDark;
                if (orientation === 'vertical') {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              {text}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
