# PROMPT 05 – HOME: FortalezaDualSection

## PRERREQUISITO

Tener implementado `PROMPT 01` (tokens CSS).

## CONTEXTO

**Archivo a implementar:** `components/home/FortalezaDualSection.tsx`  
**Sub-componentes:** `FortalezaBlock` (×2) y `BulletItem` (×5 total)  
**Propósito:** Mostrar la propuesta de valor dual: experiencia operativa (Transportes Nuevo Mundo) + capacidad tecnológica (CargoClick).

---

## LAYOUT GENERAL

### Desktop (≥ 768px)

```
┌─────────────────────────────────────────────────────────────┐
│  background: #FFFFFF    padding: 96px 0                     │
│                                                             │
│  [Título sección opcional centrado arriba]                  │
│                                                             │
│  ┌──────────── 50% ───────────┐ ┌──────────── 50% ────────┐ │
│  │  ▬▬▬▬▬▬▬▬ (azul #0B3D91)  │ │  ▬▬▬▬▬▬▬▬ (verde)      │ │
│  │  Transportes Nuevo Mundo   │ │  CargoClick               │ │
│  │                            │ │                           │ │
│  │  ✓ +20 años en transporte  │ │  ✓ Organización digital  │ │
│  │  ✓ Flota confiable nac.    │ │  ✓ Comunicación central  │ │
│  │  ✓ Experiencia en carga    │ │  ✓ Seguimiento organiz.  │ │
│  └────────────────────────────┘ └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

CSS Grid:
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 64px;
max-width: 1200px;
margin: 0 auto;
padding: 0 40px;
```

### Mobile (< 768px)

- Grid a `grid-template-columns: 1fr`
- **Primero Operación**, luego Digital
- `gap: 48px` entre bloques
- `padding: 0 20px`

---

## SUB-COMPONENTE: `BulletItem`

Crear en el mismo archivo o en `components/home/BulletItem.tsx`.

### Props
```typescript
interface BulletItemProps {
  iconSrc?: string;     // path al asset, ej: "/assets/20AnosExp.svg"
  iconAlt?: string;
  iconFallback?: React.ReactNode;  // elemento JSX fallback si no hay asset
  text: string;
  color: string;        // color del ícono: #0B3D91 o #1F7A5C
}
```

### Layout
```
[Ícono 24×24]  [Texto 16px]
  gap: 12px
  align-items: flex-start
  padding vertical: 8px
```

```tsx
<div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
}}>
  {/* Ícono */}
  <div style={{ flexShrink: 0, width: '24px', height: '24px', color: props.color }}>
    {iconSrc ? (
      <Image src={iconSrc} alt={iconAlt || ''} width={24} height={24} />
    ) : (
      iconFallback  // ícono de Lucide como fallback
    )}
  </div>
  {/* Texto */}
  <span style={{ color: '#1A1A1A', fontSize: '16px', lineHeight: '1.5' }}>
    {text}
  </span>
</div>
```

---

## SUB-COMPONENTE: `FortalezaBlock`

### Props
```typescript
interface FortalezaBlockProps {
  tema: 'operacion' | 'digital';
  titulo: string;
  bullets: Array<{
    texto: string;
    iconoSrc?: string;
    iconoAlt?: string;
  }>;
}
```

### Renderizado

```tsx
<div>
  {/* Línea decorativa superior */}
  <div style={{
    height: '4px',
    width: '48px',
    background: tema === 'operacion' ? '#0B3D91' : '#1F7A5C',
    borderRadius: '2px',
    marginBottom: '12px',
  }} />

  {/* Título del bloque */}
  <h3 style={{
    color: tema === 'operacion' ? '#0B3D91' : '#1F7A5C',
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '24px',
  }}>
    {titulo}
  </h3>

  {/* Lista de bullets */}
  <div>
    {bullets.map((bullet, index) => (
      <BulletItem
        key={index}
        text={bullet.texto}
        iconSrc={bullet.iconoSrc}
        iconAlt={bullet.iconoAlt}
        iconFallback={/* ícono de Lucide según tema */}
        color={tema === 'operacion' ? '#0B3D91' : '#1F7A5C'}
      />
    ))}
  </div>
</div>
```

**Íconos Lucide fallback por bullet:**

Bloque Operación (`tema: 'operacion'`):
| # | Asset | Fallback Lucide | Texto |
|---|-------|-----------------|-------|
| 1 | `20AnosExp` | `<Clock />` | `+20 años en transporte de carga` |
| 2 | `CoberturaNacional` | `<MapPin />` | `Flota confiable a nivel nacional` |
| 3 | — | `<Truck />` | `Experiencia en operación de carga` |

Bloque Digital (`tema: 'digital'`):
| # | Asset | Fallback Lucide | Texto |
|---|-------|-----------------|-------|
| 1 | — | `<LayoutDashboard />` | `Organización digital de servicios` |
| 2 | — | `<MessageCircle />` | `Comunicación centralizada` |
| 3 | — | `<Activity />` | `Seguimiento más organizado` |

---

## COMPONENTE PRINCIPAL: `FortalezaDualSection`

```tsx
// components/home/FortalezaDualSection.tsx
// Server Component

import FortalezaBlock from './FortalezaBlock'; // o definir inline

const BULLETS_OPERACION = [
  { texto: '+20 años en transporte de carga', iconoSrc: '/assets/20AnosExp.svg', iconoAlt: '20 años de experiencia' },
  { texto: 'Flota confiable a nivel nacional', iconoSrc: '/assets/CoberturaNacional.svg', iconoAlt: 'Cobertura nacional' },
  { texto: 'Experiencia en operación de carga' },
];

const BULLETS_DIGITAL = [
  { texto: 'Organización digital de servicios' },
  { texto: 'Comunicación centralizada' },
  { texto: 'Seguimiento más organizado' },
];

export default function FortalezaDualSection() {
  return (
    <section
      aria-label="Nuestra fortaleza dual"
      style={{ background: '#FFFFFF', padding: '96px 0' }}
    >
      <div style={{ /* contenedor max-width 1200px */ }}>

        {/* Título de sección (centrado, opcional) */}
        <h2 style={{
          color: '#0B3D91',
          fontSize: '36px',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '64px',
        }}>
          Nuestra Fortaleza Dual
        </h2>

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-[64px]">
          <FortalezaBlock
            tema="operacion"
            titulo="Transportes Nuevo Mundo"
            bullets={BULLETS_OPERACION}
          />
          <FortalezaBlock
            tema="digital"
            titulo="CargoClick"
            bullets={BULLETS_DIGITAL}
          />
        </div>

      </div>
    </section>
  );
}
```

---

## RESTRICCIONES

- ❌ El título H2 "Nuestra Fortaleza Dual" no puede ser verde — solo azul `#0B3D91`.
- ❌ `#0B3D91` no puede usarse en botones — solo en títulos y línea decorativa.
- ✅ Assets de íconos son opcionales: si el archivo no existe en `/public/assets/`, usar el fallback de Lucide.
- ✅ Server Component completo, sin estado.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `npm run type-check` sin errores.
- [ ] Dois columnas en desktop, stack vertical en mobile.
- [ ] Bloque "Operación" con línea azul `#0B3D91` y título azul.
- [ ] Bloque "Digital" con línea verde `#1F7A5C` y título verde.
- [ ] Cada bloque muestra exactamente 3 bullets con ícono + texto.
- [ ] En mobile, "Operación" aparece antes que "Digital".
