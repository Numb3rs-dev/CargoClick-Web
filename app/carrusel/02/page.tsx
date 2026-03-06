'use client';
import { useState } from 'react';

/* ──────────────────────────────────────────────────────
   DESIGN TOKENS
────────────────────────────────────────────────────── */
const C = {
  navy:    '#0A2A5E',
  blue:    '#0B3D91',
  green:   '#1A7A54',
  light:   '#F0F4FA',
  white:   '#FFFFFF',
  body:    '#1E2D4A',
  muted:   '#6B7280',
  danger:  '#D94F3D',
  dark:    '#060E1E',
};

/* ──────────────────────────────────────────────────────
   REUSABLE PRIMITIVES
────────────────────────────────────────────────────── */
function GreenBar() {
  return <div style={{ width: '52px', height: '5px', background: C.green, borderRadius: '3px' }} />;
}

function SlideCounter({ current, total = 5 }: { current: number; total?: number }) {
  return (
    <div style={{
      position: 'absolute', top: '44px', right: '64px',
      background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.24)',
      borderRadius: '20px', padding: '7px 20px',
      color: C.white, fontSize: '13px', fontWeight: 600, letterSpacing: '1.5px',
    }}>
      {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </div>
  );
}

function LogoBar({ variant = 'light' }: { variant?: 'dark' | 'light' }) {
  const isDark = variant === 'dark';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isDark ? 0.40 : 0.50 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isDark ? '/assets/CargoClickLogoNombre-white.png' : '/assets/CargoClickLogoNombre.png'}
        alt="CargoClick"
        style={{ height: '40px', display: 'block' }}
      />
      <div style={{ width: '1px', height: '48px', background: isDark ? 'rgba(255,255,255,0.30)' : '#D1D5DB', flexShrink: 0 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/NuevoMundoLogoNombreAbajo.png"
        alt="Transportes Nuevo Mundo"
        style={{ height: '80px', display: 'block', filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
      />
    </div>
  );
}

function NavDots({ active, total = 5 }: { active: number; total?: number }) {
  return (
    <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === active - 1 ? '24px' : '7px',
          height: '7px', borderRadius: '4px',
          background: i === active - 1 ? C.green : 'rgba(255,255,255,0.35)',
        }} />
      ))}
    </div>
  );
}

function NavDotsLight({ active, total = 5 }: { active: number; total?: number }) {
  return (
    <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === active - 1 ? '24px' : '7px',
          height: '7px', borderRadius: '4px',
          background: i === active - 1 ? C.green : '#D1D5DB',
        }} />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 1 — HOOK / PORTADA
   Pregunta-gancho · fondo tecnológico oscuro
────────────────────────────────────────────────────── */
function Slide1() {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      background: C.dark,
    }}>
      {/* Imagen de fondo con overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/carrusel-slide-1.jpeg" alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.42 }}
      />

      {/* Overlay gradiente azul/verde tecnológico */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(145deg, ${C.dark}EE 0%, ${C.navy}BB 55%, ${C.green}22 100%)`,
      }} />

      {/* Patrón de puntos sutil */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Barra verde izquierda */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', background: `linear-gradient(180deg, ${C.green}, ${C.blue})` }} />

      {/* Línea decorativa horizontal */}
      <div style={{ position: 'absolute', bottom: '220px', left: '80px', right: '80px', height: '1px', background: 'rgba(255,255,255,0.10)' }} />

      <SlideCounter current={1} />

      {/* Contenido principal */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px 90px 80px 88px',
      }}>
        {/* Chip etiqueta */}
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          background: `${C.green}33`, border: `1px solid ${C.green}66`,
          color: '#6EE7B7', fontSize: '12px', fontWeight: 700,
          letterSpacing: '2.5px', textTransform: 'uppercase' as const,
          padding: '8px 20px', borderRadius: '6px', marginBottom: '36px',
        }}>
          Seguimiento de carga
        </div>

        {/* Headline principal */}
        <div style={{
          fontSize: '62px', fontWeight: 800, color: C.white,
          lineHeight: 1.0, letterSpacing: '-2px', marginBottom: '28px',
        }}>
          ¿Tu empresa<br />
          <span style={{ color: '#6EE7B7' }}>realmente sabe</span><br />
          dónde está<br />su carga?
        </div>

        {/* Línea verde */}
        <div style={{ width: '52px', height: '4px', background: C.green, borderRadius: '3px', marginBottom: '24px' }} />

        {/* Subtítulo */}
        <div style={{
          fontSize: '19px', fontWeight: 400, color: 'rgba(255,255,255,0.65)',
          letterSpacing: '-0.2px', lineHeight: 1.5,
        }}>
          Seguimiento real<br />
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '17px' }}>vs</span>{' '}
          seguimiento improvisado.
        </div>
      </div>

      {/* Footer: dots centrados, logos a la derecha */}
      <div style={{
        position: 'absolute', bottom: '36px', left: '88px', right: '88px',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
      }}>
        <div />
        <NavDots active={1} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LogoBar variant="dark" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 2 — LA REALIDAD ACTUAL
   Pasos desordenados · identificación de la pyme
────────────────────────────────────────────────────── */
function Slide2() {
  const colLeft  = [
    { icon: '📦', text: 'Se despacha la mercancía' },
    { icon: '📞', text: 'Se llama al conductor' },
  ];
  const colRight = [
    { icon: '⏳', text: 'Se espera respuesta' },
    { icon: '💬', text: 'Se cruzan mensajes por WhatsApp' },
  ];

  function StepItem({ icon, text }: { icon: string; text: string }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        background: C.white,
        border: `1.5px solid ${C.navy}14`,
        borderLeft: `4px solid ${C.navy}`,
        borderRadius: '12px',
        padding: '18px 20px',
        boxShadow: '0 3px 12px rgba(10,42,94,0.07)',
      }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%',
          background: C.light,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ fontSize: '17px', fontWeight: 600, color: C.body, lineHeight: 1.35 }}>
          {text}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      background: C.light,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Barra navy izquierda */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', background: `linear-gradient(180deg, ${C.navy}, ${C.blue})`, zIndex: 2 }} />

      <SlideCounter current={2} />

      {/* TÍTULO */}
      <div style={{ padding: '52px 88px 20px 88px', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: C.green, letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
          La realidad actual
        </div>
        <div style={{
          fontSize: '38px', fontWeight: 800, color: C.navy,
          lineHeight: 1.0, letterSpacing: '-1px', marginBottom: '16px',
        }}>
          En muchas pymes<br />el transporte funciona así:
        </div>
        <GreenBar />
      </div>

      {/* IMAGEN — más pequeña, máscara RGB exacta del fondo */}
      <div style={{
        position: 'relative',
        padding: '0 140px',
        flexShrink: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/carrusel-slide-2.jpeg" alt="Transporte improvisado"
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
        />
        {/* Fades con rgba exacto del fondo #F0F4FA → rgb(240,244,250) */}
        <div style={{ position: 'absolute', top: 0, left: '140px', right: '140px', height: '90px',    background: 'linear-gradient(to bottom, rgba(240,244,250,1) 0%, rgba(240,244,250,0.85) 50%, rgba(240,244,250,0) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '140px', right: '140px', height: '90px', background: 'linear-gradient(to top,    rgba(240,244,250,1) 0%, rgba(240,244,250,0.85) 50%, rgba(240,244,250,0) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0,  width: '200px', background: 'linear-gradient(to right, rgba(240,244,250,1) 0%, rgba(240,244,250,0.9) 45%, rgba(240,244,250,0) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '200px', background: 'linear-gradient(to left,  rgba(240,244,250,1) 0%, rgba(240,244,250,0.9) 45%, rgba(240,244,250,0) 100%)', pointerEvents: 'none' }} />
      </div>

      {/* DOS COLUMNAS */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '14px', padding: '16px 88px 52px 88px',
        flexShrink: 0,
      }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {colLeft.map((s, i) => <StepItem key={i} {...s} />)}
        </div>
        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {colRight.map((s, i) => <StepItem key={i} {...s} />)}
        </div>
      </div>

      {/* Bottom bar: dots centrados, logos a la derecha */}
      <div style={{ position: 'absolute', bottom: '18px', left: '88px', right: '88px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
        <div />
        <NavDotsLight active={2} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LogoBar variant="light" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 3 — EL PROBLEMA (consecuencia operativa)
   Frase + 4 íconos de consecuencias
────────────────────────────────────────────────────── */
function Slide3() {
  const consequences = [
    { icon: '⏱️', title: 'Tiempo perdido' },
    { icon: '📋', title: 'Errores administrativos' },
    { icon: '🔌', title: 'Falta de conexión' },
    { icon: '😤', title: 'Estrés operativo' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      background: `linear-gradient(155deg, ${C.dark} 0%, ${C.navy} 70%, ${C.blue} 100%)`,
    }}>
      {/* Patrón de puntos */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Barra verde izquierda */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', background: `linear-gradient(180deg, ${C.green}, ${C.blue})` }} />

      <SlideCounter current={3} />

      {/* Contenido */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '80px 88px 64px 88px',
      }}>
        {/* Label */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#6EE7B7', letterSpacing: '2.5px', textTransform: 'uppercase' as const, marginBottom: '32px' }}>
          La consecuencia
        </div>

        {/* Frase principal en 2 líneas */}
        <div style={{
          fontSize: '52px', fontWeight: 800, color: C.white,
          lineHeight: 1.0, letterSpacing: '-1.5px', marginBottom: '20px',
        }}>
          Cuando no hay<br />seguimiento estructurado,
        </div>
        <div style={{
          fontSize: '52px', fontWeight: 300, color: 'rgba(255,255,255,0.60)',
          lineHeight: 1.0, letterSpacing: '-1.5px', marginBottom: '44px',
        }}>
          la operación<br />paga el precio.
        </div>

        {/* Línea separadora */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.14)', marginBottom: '40px' }} />

        {/* 4 consecuencias */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', flex: 1, alignContent: 'start' }}>
          {consequences.map((c, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              padding: '22px 12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', lineHeight: 1 }}>{c.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.80)', lineHeight: 1.4 }}>{c.title}</div>
            </div>
          ))}
        </div>

        {/* Bottom bar: dots centrados, logos a la derecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginTop: '28px' }}>
          <div />
          <NavDots active={3} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LogoBar variant="dark" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 4 — IMPACTO FINANCIERO
   Ultra minimalista · frase ejecutiva grande
────────────────────────────────────────────────────── */
function Slide4() {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      background: C.white,
    }}>
      {/* Línea de acento verde izquierda (fina) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: C.green }} />

      {/* Detalle decorativo sutil — ángulo navy esquina superior derecha */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '280px', height: '280px',
        background: `linear-gradient(225deg, ${C.light} 0%, transparent 70%)`,
      }} />

      {/* Ícono sutil de costo/tiempo — esquina inferior derecha */}
      <div style={{
        position: 'absolute', bottom: '120px', right: '88px',
        fontSize: '100px', opacity: 0.05, lineHeight: 1, userSelect: 'none',
      }}>
        💸
      </div>

      <SlideCounter current={4} />

      {/* Contenido centrado */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px 100px',
      }}>
        {/* Label muted */}
        <div style={{
          fontSize: '12px', fontWeight: 700, color: C.green,
          letterSpacing: '2.5px', textTransform: 'uppercase' as const,
          marginBottom: '44px',
        }}>
          Impacto real
        </div>

        {/* Línea decorativa */}
        <div style={{ width: '40px', height: '3px', background: C.navy, borderRadius: '2px', marginBottom: '36px' }} />

        {/* Frase principal */}
        <div style={{
          fontSize: '68px', fontWeight: 800, color: C.navy,
          lineHeight: 0.96, letterSpacing: '-2.5px', marginBottom: '8px',
        }}>
          El costo no es
        </div>
        <div style={{
          fontSize: '68px', fontWeight: 800, color: C.navy,
          lineHeight: 0.96, letterSpacing: '-2.5px', marginBottom: '36px',
        }}>
          el transporte.
        </div>
        <div style={{
          fontSize: '52px', fontWeight: 300, color: C.muted,
          lineHeight: 1.0, letterSpacing: '-1.2px', marginBottom: '8px',
        }}>
          Es el desorden
        </div>
        <div style={{
          fontSize: '68px', fontWeight: 800,
          background: `linear-gradient(90deg, ${C.green}, ${C.blue})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 0.96, letterSpacing: '-2px',
        }}>
          que genera.
        </div>

        {/* Bottom bar: dots centrados, logos a la derecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginTop: '64px' }}>
          <div />
          <NavDotsLight active={4} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LogoBar variant="light" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 5 — REFLEXIÓN + CONVERSACIÓN
   CTA minimalista · sin venta agresiva
────────────────────────────────────────────────────── */
function Slide5() {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      background: C.light,
    }}>
      {/* Barra verde izquierda */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', background: `linear-gradient(180deg, ${C.green}, ${C.blue})` }} />

      {/* Forma decorativa esquina superior */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: `${C.navy}08`,
        border: `2px solid ${C.navy}10`,
      }} />

      <SlideCounter current={5} />

      {/* Contenido */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '80px 88px 60px 88px',
      }}>
        {/* Label */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: C.green, letterSpacing: '2.5px', textTransform: 'uppercase' as const, marginBottom: '36px' }}>
          Una reflexión
        </div>

        {/* Texto principal */}
        <div style={{
          fontSize: '38px', fontWeight: 700, color: C.navy,
          lineHeight: 1.1, letterSpacing: '-0.8px', marginBottom: '16px',
        }}>
          Las pymes no necesitan<br />estructuras complejas.
        </div>
        <div style={{
          fontSize: '38px', fontWeight: 400, color: C.body,
          lineHeight: 1.1, letterSpacing: '-0.8px', marginBottom: '36px',
        }}>
          Necesitan <span style={{ fontWeight: 700, color: C.navy }}>claridad</span> y<br />
          <span style={{ fontWeight: 700, color: C.green }}>comunicación centralizada.</span>
        </div>

        <GreenBar />

        {/* Quote box — pregunta que invita a la conversación */}
        <div style={{
          marginTop: '32px',
          background: C.white,
          border: `1.5px solid ${C.navy}18`,
          borderLeft: `5px solid ${C.green}`,
          borderRadius: '12px',
          padding: '24px 28px',
          flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(10,42,94,0.08)',
        }}>
          <div style={{
            fontSize: '18px', fontWeight: 500, color: C.body,
            lineHeight: 1.65,
          }}>
            En <strong style={{ color: C.navy }}>CargoClick</strong> estamos construyendo
            una forma más clara de coordinar
            el transporte empresarial.
          </div>
        </div>

        {/* CTA + logos */}
        <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: C.navy }}>
              👇 Comunícate con nosotros.
            </div>
            <div style={{ fontSize: '14px', color: C.muted }}>
              cargoclick.com.co
            </div>
          </div>

          {/* Dots + logos: grid 3 columnas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0', flex: 1 }}>
            <div />
            <NavDotsLight active={5} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <LogoBar variant="light" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   PÁGINA PRINCIPAL
────────────────────────────────────────────────────── */
const SLIDES = [
  { id: 1, label: 'Slide 1 — Hook' },
  { id: 2, label: 'Slide 2 — La realidad actual' },
  { id: 3, label: 'Slide 3 — El problema' },
  { id: 4, label: 'Slide 4 — Impacto financiero' },
  { id: 5, label: 'Slide 5 — Reflexión + CTA' },
];

function renderSlide(id: number) {
  switch (id) {
    case 1: return <Slide1 />;
    case 2: return <Slide2 />;
    case 3: return <Slide3 />;
    case 4: return <Slide4 />;
    case 5: return <Slide5 />;
    default: return null;
  }
}

export default function Carrusel02Page() {
  const [fullscreen, setFullscreen] = useState<number | null>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #D8DEE8; }
        .slide-wrap { width: 540px; height: 540px; overflow: hidden; border-radius: 12px;
          box-shadow: 0 8px 36px rgba(0,0,0,0.20); cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .slide-wrap:hover { transform: translateY(-5px); box-shadow: 0 18px 56px rgba(0,0,0,0.28); }
        .slide-inner { transform: scale(0.5); transform-origin: top left; width: 1080px; height: 1080px; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.90); z-index: 1000;
          display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 22px; }
        .fs-frame { overflow: hidden; border-radius: 12px; box-shadow: 0 28px 96px rgba(0,0,0,0.55); }
        .fs-inner { transform: scale(0.8); transform-origin: top left; width: 1080px; height: 1080px; }
        .nav-btn { background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.22);
          color: #fff; padding: 11px 30px; border-radius: 8px; cursor: pointer;
          font-size: 14px; font-family: Inter, sans-serif; font-weight: 500; }
        .nav-btn:hover { background: rgba(255,255,255,0.22); }
        @media print {
          @page { size: 1080px 1080px; margin: 0; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .slide-wrap { width: 1080px !important; height: 1080px !important; border-radius: 0 !important;
            box-shadow: none !important; page-break-after: always; break-after: page; }
          .slide-inner { transform: none !important; width: 100% !important; height: 100% !important; }
        }
      `}</style>

      {fullscreen !== null && (
        <div className="overlay" onClick={() => setFullscreen(null)}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
            {SLIDES[fullscreen].label} · Clic para cerrar
          </div>
          <div className="fs-frame" style={{ width: 'min(88vw,88vh)', height: 'min(88vw,88vh)' }} onClick={e => e.stopPropagation()}>
            <div className="fs-inner">{renderSlide(SLIDES[fullscreen].id)}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="nav-btn" onClick={() => setFullscreen(f => f! > 0 ? f! - 1 : f)}>← Anterior</button>
            <button className="nav-btn" onClick={() => setFullscreen(f => f! < SLIDES.length - 1 ? f! + 1 : f)}>Siguiente →</button>
          </div>
        </div>
      )}

      <div className="no-print" style={{ background: '#0A2A5E', color: '#fff', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.50, marginBottom: '4px' }}>CargoClick · Redes Sociales</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Carrusel 02 — ¿Tu empresa sabe dónde está su carga?</div>
          <div style={{ fontSize: '13px', opacity: 0.55, marginTop: '4px' }}>5 slides · 1080×1080 px · LinkedIn e Instagram</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', opacity: 0.55, textAlign: 'right', lineHeight: 1.6 }}>Clic en un slide<br />para pantalla completa</div>
          <button onClick={() => window.print()} style={{ background: '#1A7A54', border: 'none', color: '#fff', padding: '12px 26px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            🖨 Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '36px', padding: '44px 48px', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        {SLIDES.map((slide, i) => (
          <div key={slide.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, letterSpacing: '0.5px' }}>{slide.label}</div>
            <div className="slide-wrap" onClick={() => setFullscreen(i)}>
              <div className="slide-inner">{renderSlide(slide.id)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
