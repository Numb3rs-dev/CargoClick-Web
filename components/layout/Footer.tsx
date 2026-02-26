/**
 * Footer – Cierre del sitio con datos de contacto.
 *
 * Server Component estático. Fondo #0A2A5E.
 * Desktop: logo izquierda / contacto derecha (flex-row).
 * Mobile: stack vertical centrado.
 *
 * Los datos de contacto son placeholders — reemplazar con
 * valores reales antes de producción.
 */
import Image from 'next/image';

/** Cambiar a true cuando exista el asset en /public/assets/ */
const ASSET_LOGO_EXISTS = true;

export default function Footer() {
  return (
    <footer style={{ background: '#0A2A5E', padding: '48px 0' }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
        className="px-5 md:px-10"
      >
        {/* Fila principal: logo + contacto */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between md:gap-0">

          {/* Logo */}
          <div>
            {ASSET_LOGO_EXISTS ? (
              <Image
                src="/assets/CargoClickLogo.jpeg"
                alt="CargoClick"
                height={36}
                width={120}
                style={{ height: '36px', width: 'auto' }}
              />
            ) : (
              <span
                style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1 }}
                aria-label="CargoClick"
              >
                <span style={{ color: '#FFFFFF' }}>Cargo</span>
                <span style={{ color: '#1F7A5C' }}>Click</span>
              </span>
            )}
          </div>

          {/* Datos de contacto */}
          <address
            style={{ fontStyle: 'normal' }}
            className="not-italic text-center md:text-right"
          >
            <p
              style={{
                color: 'rgba(255,255,255,0.80)',
                fontSize: '14px',
                lineHeight: '1.8',
                margin: 0,
              }}
            >
              <a
                href="mailto:info@cargoclick.com.co"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                info@cargoclick.com.co
              </a>
            </p>
            <p
              style={{
                color: 'rgba(255,255,255,0.80)',
                fontSize: '14px',
                lineHeight: '1.8',
                margin: 0,
              }}
            >
              Bogotá, Colombia
            </p>
          </address>

        </div>

        {/* Copyright */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: '24px',
            marginTop: '32px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.60)',
            fontSize: '12px',
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <p style={{ margin: 0 }}>© 2026 CargoClick. Todos los derechos reservados.</p>
          <a
            href="/privacidad"
            style={{ color: 'rgba(255,255,255,0.50)', textDecoration: 'none', fontSize: '12px' }}
          >
            Política de Privacidad
          </a>
        </div>

      </div>
    </footer>
  );
}
