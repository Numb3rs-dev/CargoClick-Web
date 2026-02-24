# PROMPT 01 – HOME: Fundamentos, Tokens CSS y Estructura de Carpetas

## CONTEXTO DEL PROYECTO

**Proyecto:** CargoClick – Soluciones Logísticas  
**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Framer Motion  
**Objetivo de este prompt:** Preparar los cimientos para implementar la página de inicio (`/home`). Esto incluye:
1. Agregar los tokens de color CargoClick a `globals.css` (sin romper los tokens existentes del sistema de cotización)
2. Crear la estructura de carpetas de componentes
3. Implementar el componente base `Button` reutilizable

---

## TAREA 1 – Tokens CSS CargoClick en `app/globals.css`

En el archivo `app/globals.css`, dentro del bloque `:root { ... }` existente, **agrega** las siguientes variables CSS **después** de las variables actuales (no las elimines ni modifiques):

```css
/* ============================================
   PALETA CARGOCLICK HOME PAGE
   ============================================ */

/* Azul corporativo – títulos, fondo CTA final, iconografía operativa */
--cg-primary: #0B3D91;

/* Verde acento – botones CTA, iconografía digital, hover nav */
--cg-accent: #1F7A5C;
--cg-accent-hover: #155D47;

/* Fondos */
--cg-bg-primary: #FFFFFF;
--cg-bg-secondary: #F5F7FA;

/* Texto */
--cg-text-primary: #1A1A1A;
--cg-text-secondary: #5E6B78;

/* Footer y secciones oscuras */
--cg-footer-bg: #0A2A5E;
--cg-cta-bg: #0B3D91;
--cg-text-on-dark: #FFFFFF;
--cg-text-on-dark-muted: rgba(255, 255, 255, 0.80);

/* Sombras */
--cg-shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.08);
--cg-shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);
--cg-shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.10);
--cg-shadow-header: 0 1px 6px rgba(0, 0, 0, 0.10);
```

---

## TAREA 2 – Estructura de Carpetas

Crea las siguientes carpetas y archivos vacíos (solo el scaffolding, sin lógica todavía):

```
components/
  layout/
    Header.tsx          ← placeholder: export default function Header() { return null }
    Footer.tsx          ← placeholder: export default function Footer() { return null }
    NavLinks.tsx        ← placeholder: export default function NavLinks() { return null }
  home/
    HeroSection.tsx          ← placeholder
    RespaldoSection.tsx      ← placeholder
    FortalezaDualSection.tsx ← placeholder
    ComoFuncionaSection.tsx  ← placeholder
    CtaFinalSection.tsx      ← placeholder

app/
  home/
    page.tsx            ← placeholder: export default function HomePage() { return <div>Home</div> }
```

Los archivos `public/assets/` se resolverán después. No los crees ahora.

---

## TAREA 3 – Componente Base `Button`

Crea el archivo `components/ui/Button.tsx` con el siguiente componente:

### Interfaz de Props

```typescript
interface ButtonProps {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  href?: string;        // Si se provee, renderiza como <Link> de Next.js
  onClick?: () => void;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
}
```

### Especificación Visual por Variant

**`primary` (todo botón CTA de la home):**
```
background:       #1F7A5C  (var --cg-accent)
color:            #FFFFFF
hover background: #155D47  (var --cg-accent-hover)
hover transform:  translateY(-1px)
active transform: translateY(0) scale(0.98)
transition:       background-color 200ms ease, transform 150ms ease
border-radius:    6px
font-weight:      600
```

**`ghost`:**
```
background:       transparent
color:            var(--cg-text-primary)
hover color:      var(--cg-accent)
border-radius:    6px
font-weight:      500
transition:       color 200ms ease
```

### Tamaños (`size`)

| size | padding          | font-size |
|------|------------------|-----------|
| sm   | 8px 16px         | 14px      |
| md   | 12px 20px        | 15px      |
| lg   | 14px 28px        | 16px      |

### Implementación

```typescript
'use client';

import Link from 'next/link';
// No usar clsx – NO está instalado en el proyecto.
// Construir clases con template literals o arrays + .join(' ')

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  href,
  onClick,
  fullWidth = false,
  className,
  type = 'button',
  disabled = false,
  ariaLabel,
}: ButtonProps) {
  // Construye las clases base
  // Si href está presente, retorna <Link href={href}>
  // Si no, retorna <button>
  // Aplica estilos inline con style={{ }} usando las variables CSS --cg-*
  // NO uses clases de Tailwind para los colores CargoClick, usa style={{ }} directamente
  //   porque las variables --cg-* no están mapeadas en tailwind.config.ts
}
```

### Regla crítica
- Los colores `#1F7A5C`, `#155D47`, `#FFFFFF` deben usarse via `style={{ }}` o clases Tailwind de color arbitrario `bg-[#1F7A5C]`.
- El componente debe funcionar tanto como botón de navegación (href provisto → `<Link>`) como botón de acción (onClick → `<button>`).
- Exportar como `default` desde `components/ui/Button.tsx`.

---

## RESTRICCIONES

- ❌ No modificar ni eliminar variables CSS existentes en `globals.css`.
- ❌ No instalar nuevas dependencias.
- ✅ TypeScript strict: todos los archivos placeholder deben tener types correctos.
- ✅ Usar `export default` en todos los componentes.
- ✅ El componente `Button` debe tener `focus-visible` ring para accesibilidad.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `npm run type-check` pasa sin errores.
- [ ] El archivo `globals.css` tiene las variables `--cg-*` sin romper las existentes.
- [ ] La carpeta `components/layout/` existe con los 3 placeholders.
- [ ] La carpeta `components/home/` existe con los 5 placeholders.
- [ ] `app/home/page.tsx` existe y compila.
- [ ] `components/ui/Button.tsx` funciona como `<Link>` cuando recibe `href` y como `<button>` cuando no.
