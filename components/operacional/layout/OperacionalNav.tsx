'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/operacional/negocios',        label: 'Negocios'        },
  { href: '/operacional/remesas',         label: 'Remesas'         },
  { href: '/operacional/manifiestos',     label: 'Manifiestos'     },
  { href: '/operacional/conductores',     label: 'Conductores'     },
  { href: '/operacional/vehiculos',       label: 'Vehículos'       },
  { href: '/operacional/clientes',        label: 'Clientes'        },
  { href: '/operacional/ordenes-cargue',  label: 'Órd. Cargue'    },
] as const;

export function OperacionalNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      background:   '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      position:     'sticky',
      top:          64,
      zIndex:       40,
    }}>
      <div style={{
        maxWidth: 1200,
        margin:   '0 auto',
        padding:  '0 24px',
        display:  'flex',
        gap:      0,
      }}>
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                padding:        '14px 16px',
                fontSize:       14,
                fontWeight:     isActive ? 700 : 500,
                color:          isActive ? '#1D4ED8' : '#6B7280',
                textDecoration: 'none',
                borderBottom:   isActive ? '2px solid #1D4ED8' : '2px solid transparent',
                transition:     'color 0.15s, border-color 0.15s',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
