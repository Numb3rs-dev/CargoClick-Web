# PROMPT 04 – HOME: RespaldoSection

## PRERREQUISITO

Tener implementado `PROMPT 01` (tokens CSS).

## CONTEXTO

**Archivo a implementar:** `components/home/RespaldoSection.tsx`  
**Propósito:** Generar confianza mediante la asociación con Transportes Nuevo Mundo S.A.S. Sección breve, centrada, sobre fondo gris.  
**Posición en la página:** Justo debajo del Hero.

---

## ESPECIFICACIÓN VISUAL

```
┌────────────────────────────────────────────────────────┐
│              background: #F5F7FA  padding: 48px 0      │
│                                                        │
│         Operación respaldada por                       │
│         Transportes Nuevo Mundo S.A.S.                 │
│                                                        │
│         [NuevoMundoLogoNombreLadoDerecho h=60px]       │
└────────────────────────────────────────────────────────┘
```

---

## ESPECIFICACIÓN DETALLADA

### Contenedor de Sección
```css
background:      #F5F7FA;
padding:         48px 0;
text-align:      center;
```

### Contenedor interno
```css
max-width:  1200px;
margin:     0 auto;
padding:    0 40px;  /* 0 20px en mobile */
display:    flex;
flex-direction: column;
align-items: center;
gap: 20px;
```

### Texto principal
```
Texto:       "Operación respaldada por Transportes Nuevo Mundo S.A.S."
color:       #1A1A1A
font-size:   18px (desktop) / 16px (mobile)
font-weight: 600
line-height: 1.4
```

### Logo (Asset)
```typescript
{/* Asset real cuando esté disponible */}
<Image
  src="/assets/NuevoMundoLogoNombreLadoDerecho.svg"
  alt="Transportes Nuevo Mundo S.A.S. – Empresa respaldante de CargoClick"
  height={60}
  width={0}  // width: auto con next/image requiere width explícito o fill
  style={{ height: '60px', width: 'auto' }}
/>
```

### Placeholder temporal (hasta que exista el asset)
```tsx
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 24px',
    border: '2px solid #0B3D91',
    borderRadius: '6px',
  }}
>
  {/* <Building2 size={24} color="#0B3D91" /> de lucide-react */}
  <span style={{ color: '#0B3D91', fontSize: '16px', fontWeight: 700 }}>
    Transportes Nuevo Mundo S.A.S.
  </span>
</div>
```

---

## ESTRUCTURA JSX

```tsx
// components/home/RespaldoSection.tsx
// Server Component – sin 'use client'

import Image from 'next/image';
import { Building2 } from 'lucide-react';

export default function RespaldoSection() {
  // Controlar si el asset existe o mostrar placeholder
  // Por ahora usar siempre el placeholder
  const assetExists = false; // cambiar a true cuando el asset esté en /public/assets/

  return (
    <section
      aria-label="Respaldo operativo"
      style={{ background: '#F5F7FA', padding: '48px 0' }}
    >
      <div style={{ /* contenedor centrado */ }}>
        
        {/* Texto */}
        <p style={{ /* estilos del texto */ }}>
          Operación respaldada por Transportes Nuevo Mundo S.A.S.
        </p>

        {/* Logo o Placeholder */}
        {assetExists ? (
          <Image ... />
        ) : (
          <div> {/* Placeholder estilizado */} </div>
        )}

      </div>
    </section>
  );
}
```

---

## ACCESIBILIDAD

- El `<section>` tiene `aria-label="Respaldo operativo"`.
- La imagen tiene `alt` descriptivo que incluye el nombre completo de la empresa.
- No hay botones ni links interactivos en esta sección.

---

## RESTRICCIONES

- ❌ No agregar CTA ni botones en esta sección.
- ❌ No modificar el texto (debe ser exactamente el especificado).
- ✅ Sección puramente informativa / de confianza.
- ✅ Server Component, sin estado.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `npm run type-check` sin errores.
- [ ] Fondo `#F5F7FA`, texto centrado.
- [ ] Texto "Operación respaldada por Transportes Nuevo Mundo S.A.S." visible con `font-weight: 600`.
- [ ] Logo o placeholder visible debajo del texto, separado `20px`.
- [ ] `gap: 20px` entre texto y logo.
