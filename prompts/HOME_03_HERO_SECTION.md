# PROMPT 03 – HOME: HeroSection

## PRERREQUISITO

Tener implementado `PROMPT 01` (tokens CSS) y `PROMPT 02` (componente `Button`).

## CONTEXTO

**Archivo a implementar:** `components/home/HeroSection.tsx`  
**Propósito:** Primera sección visible de la home. Comunicar propuesta de valor en < 3 segundos.  
**Lema de implementación:** Texto a la izquierda, imagen a la derecha. CTA verde. Nada más.

---

## ESPECIFICACIÓN DE LAYOUT

### Desktop (≥ 768px)

```
┌─────────────────────────────────────────────────────────────────┐
│  background: #FFFFFF    padding: 96px 0                         │
│                                                                 │
│  ┌────────────────── 45% ──────────────┐ ┌─── 55% ───────────┐ │
│  │  [Eyebrow]                          │ │                   │ │
│  │  Soluciones Logísticas              │ │  [CamionConCarga] │ │
│  │  con Visión Digital                 │ │   imagen contain  │ │
│  │                                     │ │                   │ │
│  │  Subtítulo descriptivo...           │ │                   │ │
│  │                                     │ │                   │ │
│  │  [Solicitar Servicio →]             │ │                   │ │
│  └─────────────────────────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

CSS Grid:
```css
display: grid;
grid-template-columns: 45fr 55fr;
gap: 64px;
align-items: center;
max-width: 1200px;
margin: 0 auto;
padding: 96px 40px;
```

### Mobile (< 768px)

- Grid pasa a `grid-template-columns: 1fr` (una columna)
- Imagen va **debajo** con `order: 2` y `height: 220px; object-fit: contain`
- Texto va **arriba** con `order: 1`
- `padding: 48px 20px`

---

## CONTENIDO TEXTUAL (Columna izquierda)

### Eyebrow (opcional, encima del H1)
```
Texto:          "Logística B2B"
font-size:      13px
font-weight:    600
color:          #1F7A5C
letter-spacing: 1.5px
text-transform: UPPERCASE
margin-bottom:  12px
```

### H1 – Título Principal
```
Texto:       "Soluciones Logísticas con Visión Digital"
color:       #0B3D91
font-size:   48px (desktop) / 28px (mobile)
font-weight: 700
line-height: 1.15
```

> **Regla de diseño:** El título tiene un quiebre de línea natural después de "Logísticas":
> ```
> Soluciones Logísticas
> con Visión Digital
> ```
> NO forzar quiebre con `<br/>`. Usar `line-height` y ancho de columna naturalmente.

### Subtítulo
```
Texto:       "CargoClick integra experiencia operativa en transporte de carga 
              con una gestión más organizada y eficiente."
color:       #5E6B78
font-size:   18px (desktop) / 16px (mobile)
font-weight: 400
line-height: 1.6
margin-top:  16px
```

### Botón CTA
```
Texto:         "Solicitar Servicio"
Componente:    <Button variant="primary" size="lg" href="/cotizar">
margin-top:    32px
```

---

## COLUMNA DERECHA – Imagen

### Asset real (cuando exista)
```typescript
<Image
  src="/assets/CamionConCarga.webp"
  alt="Camión de carga CargoClick en operación logística"
  width={600}
  height={500}
  style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
  priority  // LCP image, cargar con prioridad
/>
```

### Placeholder temporal (hasta que exista el asset)
Usar un placeholder visual que comunique el espacio reservado:

```tsx
<div
  style={{
    width: '100%',
    aspectRatio: '6/5',
    background: 'linear-gradient(135deg, #F0F4FF 0%, #E8F5F0 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '12px',
  }}
>
  {/* Ícono de camión de Lucide: <Truck size={64} color="#0B3D91" /> */}
  <p style={{ color: '#5E6B78', fontSize: '14px', fontWeight: 500 }}>
    Imagen: CamionConCarga
  </p>
</div>
```

> **Nota:** Cuando el asset esté en `public/assets/CamionConCarga.webp`, reemplazar el placeholder por el `<Image>` de Next.js.

---

## ESTRUCTURA JSX COMPLETA

```tsx
// components/home/HeroSection.tsx
// NO requiere 'use client' – es un Server Component

import Image from 'next/image';
import Button from '@/components/ui/Button';
import { Truck } from 'lucide-react'; // placeholder temporal

export default function HeroSection() {
  return (
    <section
      aria-label="Sección principal"
      style={{ background: '#FFFFFF' }}
    >
      <div style={{ /* grid container */ }}>
        
        {/* Columna izquierda: texto */}
        <div style={{ /* align-self: center */ }}>
          {/* Eyebrow */}
          {/* H1 */}
          {/* Subtítulo */}
          {/* Botón */}
        </div>
        
        {/* Columna derecha: imagen */}
        <div style={{ /* order: 2 en mobile */ }}>
          {/* Placeholder o Image */}
        </div>
        
      </div>
    </section>
  );
}
```

---

## RESPONSIVE: MEDIA QUERIES

Implementar con Tailwind CSS clases responsivas o con CSS-in-JS style objects condicionales. El componente es Server Component por lo que **no puede usar** `useState` ni `useEffect` para responsive. 

**Opción recomendada:** clases de Tailwind directamente:

```tsx
{/* Grid container */}
<div className="
  max-w-[1200px] mx-auto px-10 py-24
  grid grid-cols-1 md:grid-cols-[45fr_55fr]
  gap-16 items-center
  md:px-10 px-5 md:py-24 py-12
">

{/* Columna texto */}
<div className="order-1">...</div>

{/* Columna imagen */}
<div className="order-2 md:order-none">
  <div className="h-[220px] md:h-auto md:aspect-[6/5]">...</div>
</div>
```

---

## ACCESIBILIDAD

- El `<section>` debe tener `aria-label="Sección principal"` o `aria-labelledby` apuntando al H1.
- El H1 debe ser el único `<h1>` de la página.
- La imagen debe tener `alt` descriptivo siempre (sea placeholder o real).

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `npm run type-check` sin errores.
- [ ] H1 con texto correcto, color `#0B3D91`, desktop 48px / mobile 28px.
- [ ] Subtítulo en `#5E6B78`.
- [ ] Botón "Solicitar Servicio" verde que navega a `/cotizar`.
- [ ] Grid 2 columnas en desktop, 1 columna en mobile.
- [ ] Imagen (o placeholder) ocupa la columna derecha sin sombra ni border-radius.
- [ ] Columna imagen baja debajo del texto en mobile con `height: 220px`.
