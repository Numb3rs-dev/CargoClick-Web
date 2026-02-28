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
};

const DOT_PATTERN = 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)';

/* ──────────────────────────────────────────────────────
   REUSABLE PRIMITIVES
────────────────────────────────────────────────────── */
function Chip({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignSelf: 'flex-start',
      background: light ? C.green : `linear-gradient(90deg, ${C.navy}, ${C.blue})`,
      color: C.white, fontSize: '13px', fontWeight: 700,
      letterSpacing: '2px', textTransform: 'uppercase' as const,
      padding: '9px 24px', borderRadius: '6px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>{text}</div>
  );
}

function GreenBar() {
  return <div style={{ width: '52px', height: '5px', background: C.green, borderRadius: '3px' }} />;
}

function LogoPill({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{ background: C.white, borderRadius: '10px', padding: '12px 22px', boxShadow: '0 6px 28px rgba(0,0,0,0.28)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ height: '34px', display: 'block' }} />
    </div>
  );
}

function Watermark() {
  return (
    <div style={{ position: 'absolute', bottom: '32px', right: '56px', opacity: 0.10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/CargoClickLogoNombre.png" alt="" style={{ height: '22px' }} />
    </div>
  );
}

function LeftBar() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '100%', background: `linear-gradient(180deg, ${C.navy}, ${C.blue})` }} />
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 1 — PORTADA
   pack1-A · foto arriba · fondo blanco abajo · formas
────────────────────────────────────────────────────── */
function Slide1() {
  return (
    <div style={{ width: '100%', height: '100%', background: C.white, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Foto hero */}
      <div style={{ height: '460px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pack1-A.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        {/* Fade al blanco */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: `linear-gradient(to bottom, transparent, ${C.white})` }} />
        {/* Barra navy izquierda sobre la foto */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '100%', background: `linear-gradient(180deg, ${C.navy}, ${C.blue})` }} />
        {/* Contador */}
        <div style={{ position: 'absolute', top: '44px', right: '72px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.30)', borderRadius: '20px', padding: '7px 20px', color: C.white, fontSize: '13px', fontWeight: 600, letterSpacing: '1.5px' }}>
          01 / 06
        </div>
      </div>

      {/* Contenido en blanco */}
      <div style={{ flex: 1, padding: '18px 72px 36px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        {/* Forma decorativa */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: C.light, border: `3px solid ${C.navy}18`, zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logos de ambas empresas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '24px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/CargoClickLogoNombre.png" alt="CargoClick" style={{ height: '52px', display: 'block' }} />
            <div style={{ fontSize: '40px', color: '#D1D5DB', fontWeight: 200, lineHeight: 1, margin: '0 -8px 0 18px' }}>+</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/NuevoMundoLogoNombreAbajo.png" alt="Transportes Nuevo Mundo" style={{ height: '130px', display: 'block' }} />
          </div>

          <div style={{ marginBottom: '16px' }}><GreenBar /></div>
          <div style={{ fontSize: '56px', fontWeight: 800, color: C.navy, lineHeight: 1.0, letterSpacing: '-2px', marginBottom: '16px' }}>
            20 años de<br />operación.<br />
            <span style={{ fontWeight: 400, fontSize: '38px', color: C.muted, letterSpacing: '-1px' }}>
              Tecnología de hoy.
            </span>
          </div>
        </div>

        {/* Dots + desliza */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.muted, fontSize: '14px', fontWeight: 500 }}>
            <span>Desliza para conocer la historia</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </div>
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width: i === 0 ? '24px' : '7px', height: '7px', borderRadius: '4px', background: i === 0 ? C.green : '#D1D5DB' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 2 — EL PROBLEMA
   pack1-B · foto hero arriba · copy abajo
────────────────────────────────────────────────────── */
function Slide2() {
  return (
    <div style={{ width: '100%', height: '100%', background: C.light, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <LeftBar />
      <div style={{ height: '430px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pack1-B.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px', background: `linear-gradient(to bottom, transparent, ${C.light})` }} />
        <div style={{ position: 'absolute', top: '40px', left: '68px' }}>
          <Chip text="Así funciona" />
        </div>
      </div>
      <div style={{ flex: 1, padding: '20px 72px 48px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '46px', fontWeight: 800, color: C.navy, lineHeight: 1.08, letterSpacing: '-1px', marginBottom: '20px' }}>
          Solicitud en minutos.<br />Asesor que te<br />acompaña.
        </div>
        <div style={{ marginBottom: '20px' }}><GreenBar /></div>
        <div style={{ fontSize: '20px', color: '#374151', lineHeight: 1.70 }}>
          Ingresa los datos de tu carga en nuestra plataforma.{' '}
          <strong style={{ color: C.navy }}>Un asesor especializado te contacta para coordinar cada detalle.</strong>
        </div>
      </div>
      <Watermark />
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 3 — LA ALIANZA
   pack2-A · foto arriba · blanco abajo · logos naturales
────────────────────────────────────────────────────── */
function Slide3() {
  return (
    <div style={{ width: '100%', height: '100%', background: C.white, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <LeftBar />

      {/* Foto hero */}
      <div style={{ height: '400px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pack2-A.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px', background: `linear-gradient(to bottom, transparent, ${C.white})` }} />
        <div style={{ position: 'absolute', top: '40px', left: '68px' }}>
          <Chip text="La alianza" />
        </div>
      </div>

      {/* Contenido blanco */}
      <div style={{ flex: 1, padding: '12px 72px 40px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        {/* Forma decorativa — línea diagonal navy como acento */}
        <div style={{ position: 'absolute', right: '48px', top: '10px', width: '3px', height: '80px', background: `linear-gradient(180deg, ${C.green}, transparent)`, borderRadius: '2px' }} />

        <div style={{ fontSize: '42px', fontWeight: 800, color: C.navy, lineHeight: 1.05, letterSpacing: '-1px', marginBottom: '16px' }}>
          Lo mejor de dos<br />mundos, unido.
        </div>

        {/* Logos — mismo patrón que Slide 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '18px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/CargoClickLogoNombre.png" alt="CargoClick" style={{ height: '52px', display: 'block' }} />
          <div style={{ fontSize: '40px', color: '#D1D5DB', fontWeight: 200, lineHeight: 1, margin: '0 -8px 0 18px' }}>+</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/NuevoMundoLogoNombreAbajo.png" alt="Transportes Nuevo Mundo" style={{ height: '130px', display: 'block' }} />
        </div>
        <div style={{ marginBottom: '18px' }}><GreenBar /></div>

        {/* Dos columnas — qué aporta cada uno */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.green, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Operación</div>
            <div style={{ fontSize: '16px', color: '#374151', lineHeight: 1.6 }}>
              Experiencia, seguridad y acceso a{' '}
              <strong style={{ color: C.navy }}>vehículos confiables</strong> en todo el país.
            </div>
          </div>
          <div style={{ width: '1px', background: C.light, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.green, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Plataforma</div>
            <div style={{ fontSize: '16px', color: '#374151', lineHeight: 1.6 }}>
              <strong style={{ color: C.navy }}>IA para mayor velocidad</strong> y agilidad en toda la operatividad administrativa.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 4 — ¿QUÉ OFRECEMOS?
   pack1-C · foto arriba · cards navy sobre blanco
────────────────────────────────────────────────────── */
function Slide4() {
  const items = [
    { icon: '💻', title: 'Cotización en línea', desc: 'Precio en menos de 2 min' },
    { icon: '📦', title: 'Embalaje disponible', desc: 'Lo gestionamos como adicional' },
    { icon: '🛰️', title: 'Monitoreo satelital', desc: 'Seguimiento en tiempo real' },
    { icon: '🇨🇴', title: 'Cobertura nacional', desc: 'Todas las ciudades' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: C.light, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <LeftBar />

      {/* Foto hero */}
      <div style={{ height: '360px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pack1-C.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: `linear-gradient(to bottom, transparent, ${C.light})` }} />
        <div style={{ position: 'absolute', top: '40px', left: '68px' }}>
          <Chip text="¿Qué ofrecemos?" />
        </div>
      </div>

      {/* Título */}
      <div style={{ padding: '8px 80px 18px', position: 'relative' }}>
        <div style={{ fontSize: '40px', fontWeight: 800, color: C.navy, lineHeight: 1.05, letterSpacing: '-1px', marginBottom: '14px' }}>
          Todo lo que necesita<br />tu empresa
        </div>
        <GreenBar />
      </div>

      {/* Cards 2×2 sobre fondo claro */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '16px 80px 48px', flex: 1, alignContent: 'start' }}>
        {items.map(item => (
          <div key={item.title} style={{
            background: C.white,
            border: `1.5px solid #E5E7EB`,
            borderLeft: `4px solid ${C.navy}`,
            borderRadius: '12px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <div style={{ fontSize: '28px', lineHeight: 1 }}>{item.icon}</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: C.navy }}>{item.title}</div>
            <div style={{ fontSize: '14px', color: C.muted, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <Watermark />
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 5 — EL RESULTADO
   pack2-B hero · stats · pack2-C + pack2-D abajo
────────────────────────────────────────────────────── */
function Slide5() {
  const stats = [
    { value: '20+', label: 'años de operación' },
    { value: '2 min', label: 'para cotizar' },
    { value: '100%', label: 'cobertura nacional' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: C.white, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <LeftBar />
      <div style={{ height: '380px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pack2-B.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: `linear-gradient(to bottom, transparent, ${C.white})` }} />
        <div style={{ position: 'absolute', top: '40px', left: '68px' }}>
          <Chip text="El resultado" />
        </div>
      </div>

      <div style={{ display: 'flex', padding: '24px 80px 0', gap: '0' }}>
        {stats.map((s, i) => (
          <div key={s.value} style={{
            flex: 1,
            borderRight: i < stats.length - 1 ? '1px solid #E5E7EB' : 'none',
            paddingRight: i < stats.length - 1 ? '32px' : '0',
            paddingLeft: i > 0 ? '32px' : '0',
          }}>
            <div style={{ fontSize: '50px', fontWeight: 800, color: C.navy, lineHeight: 1, letterSpacing: '-1px', marginBottom: '6px' }}>{s.value}</div>
            <div style={{ fontSize: '14px', color: C.muted, fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 80px 16px' }}>
        <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '18px' }} />
        <div style={{ fontSize: '20px', fontWeight: 700, color: C.navy }}>
          Sin llamadas. Sin intermediarios.{' '}
          <span style={{ color: C.green }}>Todo incluido.</span>
        </div>
      </div>

      {/* pack2-C y pack2-D: transparent top se funde con el blanco */}
      <div style={{ display: 'flex', gap: '16px', padding: '0 80px 52px', flex: 1 }}>
        <div style={{ flex: 1, borderRadius: '14px', overflow: 'hidden', background: C.light, minHeight: '100px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/pack2-C.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom' }} />
        </div>
        <div style={{ flex: 1, borderRadius: '14px', overflow: 'hidden', background: C.light, minHeight: '100px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/pack2-D.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom' }} />
        </div>
      </div>

      <Watermark />
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SLIDE 6 — CTA FINAL
   pack1-D · foto arriba · blanco abajo · URL navy
────────────────────────────────────────────────────── */
function Slide6() {
  return (
    <div style={{ width: '100%', height: '100%', background: C.white, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <LeftBar />

      {/* Foto hero */}
      <div style={{ height: '420px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pack1-D.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px', background: `linear-gradient(to bottom, transparent, ${C.white})` }} />
        {/* Chip sobre la foto */}
        <div style={{ position: 'absolute', top: '40px', left: '68px' }}>
          <Chip text="Empieza hoy" light />
        </div>
      </div>

      {/* Contenido CTA en blanco */}
      <div style={{ flex: 1, padding: '12px 72px 44px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        {/* Forma decorativa — rectángulo verde acento top-right */}
        <div style={{ position: 'absolute', top: 0, right: '72px', width: '60px', height: '5px', background: C.green, borderRadius: '3px' }} />

        <div style={{ fontSize: '52px', fontWeight: 800, color: C.navy, lineHeight: 1.0, letterSpacing: '-1.5px', marginBottom: '18px' }}>
          ¿Mueves carga<br />en Colombia?
        </div>
        <div style={{ marginBottom: '24px' }}><GreenBar /></div>
        <div style={{ fontSize: '19px', color: '#374151', lineHeight: 1.7, marginBottom: '32px' }}>
          Cotiza en línea en menos de <strong style={{ color: C.navy }}>2 minutos</strong>.<br />
          Sin llamadas. Sin intermediarios.
        </div>

        {/* URL block navy */}
        <div style={{ background: C.navy, color: C.white, fontSize: '20px', fontWeight: 800, padding: '22px 32px', borderRadius: '12px', letterSpacing: '-0.2px', borderLeft: `5px solid ${C.green}` }}>
          cargoclick.com.co/cotizar
        </div>

        {/* Logos al pie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/CargoClickLogoNombre.png" alt="CargoClick" style={{ height: '24px', display: 'block' }} />
          <div style={{ width: '1px', height: '20px', background: '#E5E7EB' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/NuevoMundoLogoNombreLadoDerecho.png" alt="Transportes Nuevo Mundo" style={{ height: '24px', display: 'block' }} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   PÁGINA PRINCIPAL
────────────────────────────────────────────────────── */
const SLIDES = [
  { id: 1, label: 'Slide 1 — Portada' },
  { id: 2, label: 'Slide 2 — El problema' },
  { id: 3, label: 'Slide 3 — La alianza' },
  { id: 4, label: 'Slide 4 — ¿Qué ofrecemos?' },
  { id: 5, label: 'Slide 5 — El resultado' },
  { id: 6, label: 'Slide 6 — CTA' },
];

function renderSlide(id: number) {
  switch (id) {
    case 1: return <Slide1 />;
    case 2: return <Slide2 />;
    case 3: return <Slide3 />;
    case 4: return <Slide4 />;
    case 5: return <Slide5 />;
    case 6: return <Slide6 />;
    default: return null;
  }
}

export default function Carrusel01Page() {
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
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Carrusel 01 — Quiénes somos: La alianza</div>
          <div style={{ fontSize: '13px', opacity: 0.55, marginTop: '4px' }}>6 slides · 1080×1080 px · LinkedIn e Instagram</div>
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
