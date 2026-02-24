'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { UserButton, useAuth } from '@clerk/nextjs';
import NavLinks from './NavLinks';
import Button from '@/components/ui/Button';

/**
 * Header principal de CargoClick.
 *
 * - Sticky con sombra suave al hacer scroll > 10px.
 * - Desktop: logo + nav links horizontales + botón CTA.
 * - Mobile: logo + ícono hamburguesa. Drawer lateral desde la derecha.
 * - Logo: CargoClickLogoNombre.jpeg en /public/assets/ (fallback texto inline).
 */
export default function Header() {
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sombra al hacer scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloqueo de scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Focus al abrir el drawer
  useEffect(() => {
    if (isMobileMenuOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#FFFFFF',
          boxShadow: isScrolled ? '0 1px 6px rgba(0,0,0,0.10)' : 'none',
          transition: 'box-shadow 200ms ease',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            height: '72px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: 'visible',
          }}
          className="px-5 md:px-10"
        >
          {/* Logo – placeholder hasta que exista el asset SVG */}
          <Link
            href="/home"
            aria-label="CargoClick – Ir al inicio"
            style={{ textDecoration: 'none', lineHeight: 1 }}
          >
            <Image
              src="/assets/CargoClickLogoNombre.png"
              alt="CargoClick"
              width={248}
              height={62}
              priority
              style={{ height: '62px', width: 'auto', display: 'block' }}
            />
          </Link>

          {/* Nav links – solo desktop */}
          <nav className="hidden md:flex" aria-label="Navegación principal">
            <NavLinks orientation="horizontal" />
          </nav>

          {/* Botón CTA o menú de usuario – solo desktop */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '16px' }}>
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: { width: 38, height: 38 },
                  },
                }}
              />
            ) : (
              <Button variant="primary" size="md" href="/cotizar">
                Solicitar Cotización
              </Button>
            )}
          </div>

          {/* Botón hamburguesa – solo mobile */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú de navegación"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={24} color="#1A1A1A" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={closeMobileMenu}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 98,
          }}
        />
      )}

      {/* Drawer lateral */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '280px',
          height: '100vh',
          background: '#FFFFFF',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header del drawer */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F5F7FA',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 700 }}>
            <span style={{ color: '#0B3D91' }}>Cargo</span>
            <span style={{ color: '#1F7A5C' }}>Click</span>
          </span>
          <button
            ref={closeButtonRef}
            onClick={closeMobileMenu}
            aria-label="Cerrar menú de navegación"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} color="#1A1A1A" aria-hidden="true" />
          </button>
        </div>

        {/* Nav links verticales */}
        <nav style={{ flex: 1, overflowY: 'auto' }} aria-label="Menú mobile">
          <NavLinks orientation="vertical" onLinkClick={closeMobileMenu} />
        </nav>

        {/* Botón CTA o menú de usuario al fondo del drawer */}
        <div
          style={{
            padding: '24px',
            borderTop: '1px solid #F5F7FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSignedIn ? 'flex-start' : 'stretch',
            gap: '12px',
          }}
        >
          {isSignedIn ? (
            <>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: { width: 38, height: 38 },
                  },
                }}
              />
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Mi cuenta</span>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              href="/cotizar"
              fullWidth
              onClick={closeMobileMenu}
            >
              Solicitar Cotización
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
