# PROMPT 07 – HOME: CtaFinalSection + Footer

## PRERREQUISITO

Tener implementado `PROMPT 01` (tokens CSS) y `PROMPT 02` (componente `Button`).

## CONTEXTO

**Archivos a implementar:**
1. `components/home/CtaFinalSection.tsx`
2. `components/layout/Footer.tsx`

Ambas secciones van al final de la página, son Server Components, y trabajan sobre fondos oscuros.

---

# PARTE A: CtaFinalSection

## Propósito
Captura de conversión para el usuario que llegó hasta el fondo de la página. Visualmente contrastante (fondo azul oscuro).

## Layout

```
┌────────────────────────────────────────────────────────┐
│               background: #0B3D91                      │
│               padding: 80px 0                          │
│                                                        │
│         Optimiza tu Operación Logística Hoy            │
│                                                        │
│               [Solicitar Cotización]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Especificación visual

### Contenedor sección
```css
background: #0B3D91;
padding:    80px 0;
text-align: center;
```

### Contenedor interno
```css
max-width: 1200px;
margin:    0 auto;
padding:   0 40px; /* 0 20px mobile */
```

### Título
```
Texto:       "Optimiza tu Operación Logística Hoy"
color:       #FFFFFF
font-size:   36px (desktop) / 26px (mobile)
font-weight: 700
line-height: 1.2
margin-bottom: 32px
```

### Botón CTA
```
Componente: <Button variant="primary" size="lg" href="/cotizar">
Texto:      "Solicitar Cotización"

Colores:
  background:       #1F7A5C
  hover background: #155D47
  color texto:      #FFFFFF
  padding:          14px 32px
  border-radius:    6px
  font-weight:      600
  font-size:        16px
```

> **Regla crítica:** El botón es VERDE `#1F7A5C` sobre fondo AZUL `#0B3D91`. Nunca invertir.

## Código JSX

```tsx
// components/home/CtaFinalSection.tsx
// Server Component

import Button from '@/components/ui/Button';

export default function CtaFinalSection() {
  return (
    <section
      aria-label="Llamada a la acción final"
      style={{ background: '#0B3D91', padding: '80px 0' }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 40px',
        textAlign: 'center',
      }}>
        
        <h2 style={{
          color: '#FFFFFF',
          fontSize: 'clamp(26px, 4vw, 36px)',
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: '32px',
        }}>
          Optimiza tu Operación Logística Hoy
        </h2>

        <Button variant="primary" size="lg" href="/cotizar">
          Solicitar Cotización
        </Button>

      </div>
    </section>
  );
}
```

---

# PARTE B: Footer

## Propósito
Cierre del sitio con datos de contacto. No es sección de conversión. Fondo azul más oscuro que el CTA.

## Layout

### Desktop (≥ 768px)

```
┌────────────────────────────────────────────────────────────────┐
│  background: #0A2A5E    padding: 48px 0                        │
│                                                                │
│  [CargoClickLogo]              Contacto:                       │
│                                info@cargoclick.com             │
│                                +57 XXX XXX XXXX                │
│                                Bogotá, Colombia                │
│                                                                │
│  ─────────────────────────────────────────────────────────     │
│       © 2026 CargoClick. Todos los derechos reservados.        │
└────────────────────────────────────────────────────────────────┘
```

```css
/* Fila principal */
display:         flex;
justify-content: space-between;
align-items:     flex-start;
```

### Mobile (< 768px)
- Stack vertical, centrado
- Logo arriba → Datos de contacto abajo
- `gap: 24px`

## Especificación visual

### Contenedor sección
```css
background: #0A2A5E;
padding:    48px 0;
```

### Logo (columna izquierda)

Asset real:
```typescript
<Image
  src="/assets/CargoClickLogo.svg"  
  // versión solo icono o logo+nombre en blanco
  alt="CargoClick"
  height={36}
  width={0}
  style={{ height: '36px', width: 'auto' }}
/>
```

Placeholder temporal:
```tsx
<span style={{
  color: '#FFFFFF',
  fontSize: '20px',
  fontWeight: 700,
}}>
  <span style={{ color: '#FFFFFF' }}>Cargo</span>
  <span style={{ color: '#1F7A5C' }}>Click</span>
</span>
```

### Bloque de datos de contacto (columna derecha)

```
Texto general:
  color:       rgba(255, 255, 255, 0.80)
  font-size:   14px
  line-height: 1.8
```

| Campo | Valor placeholder |
|-------|-------------------|
| Email | `info@cargoclick.com` |
| Teléfono | `+57 300 000 0000` |
| Ciudad | `Bogotá, Colombia` |

> **IMPORTANTE:** Estos son valores placeholder. El desarrollador debe reemplazarlos con los datos reales del negocio antes de producción.

```tsx
<div>
  <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: '14px', lineHeight: '1.8' }}>
    info@cargoclick.com
  </p>
  <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: '14px', lineHeight: '1.8' }}>
    +57 300 000 0000
  </p>
  <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: '14px', lineHeight: '1.8' }}>
    Bogotá, Colombia
  </p>
</div>
```

### Línea de copyright

```tsx
<p style={{
  borderTop: '1px solid rgba(255,255,255,0.15)',
  paddingTop: '24px',
  marginTop: '32px',
  textAlign: 'center',
  color: 'rgba(255,255,255,0.60)',
  fontSize: '12px',
}}>
  © 2026 CargoClick. Todos los derechos reservados.
</p>
```

## Código JSX completo

```tsx
// components/layout/Footer.tsx
// Server Component

import Image from 'next/image';

export default function Footer() {
  const assetExists = false; // cambiar cuando exista el asset

  return (
    <footer style={{ background: '#0A2A5E', padding: '48px 0' }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 40px',
      }}>
        
        {/* Fila principal: logo + contacto */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-0">
          
          {/* Logo */}
          <div>
            {assetExists ? (
              <Image src="/assets/CargoClickLogo.svg" alt="CargoClick" height={36} width={120} />
            ) : (
              <span><span style={{ color: '#FFFFFF', fontWeight: 700 }}>Cargo</span><span style={{ color: '#1F7A5C', fontWeight: 700 }}>Click</span></span>
            )}
          </div>

          {/* Datos de contacto */}
          <div style={{ textAlign: 'right' }} className="md:text-right text-left">
            {/* email, teléfono, ciudad */}
          </div>

        </div>

        {/* Copyright */}
        {/* ... */}

      </div>
    </footer>
  );
}
```

---

## RESTRICCIONES COMPARTIDAS

- ❌ No usar `#0B3D91` en botones dentro de ninguna de las dos secciones.
- ❌ No agregar nav links en el Footer (solo datos de contacto).
- ✅ Ambas son Server Components, sin estado.
- ✅ El Footer debe tener `<footer>` semántico.
- ✅ La sección CTA debe tener `<section>` con `aria-label`.

---

## CRITERIOS DE ACEPTACIÓN

**CtaFinalSection:**
- [ ] `npm run type-check` sin errores.
- [ ] Fondo `#0B3D91`, texto blanco, botón verde.
- [ ] Título "Optimiza tu Operación Logística Hoy" correcto.
- [ ] Botón navega a `/cotizar`.
- [ ] En mobile: `font-size` del título se reduce (usar `clamp()` o breakpoint Tailwind).

**Footer:**
- [ ] `npm run type-check` sin errores.
- [ ] Fondo `#0A2A5E`.
- [ ] Logo (o placeholder "Cargo**Click**") y datos de contacto visibles.
- [ ] En desktop: logo a la izquierda, contacto a la derecha.
- [ ] En mobile: stack vertical centrado.
- [ ] Línea de copyright al fondo con `opacity: 0.60`.
