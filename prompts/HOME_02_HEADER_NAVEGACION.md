# PROMPT 02 – HOME: Header con Navegación y Menú Mobile

## PRERREQUISITO

Tener implementado `PROMPT 01`: variables `--cg-*` en `globals.css`, estructura de carpetas y `Button` base.

## CONTEXTO

**Archivo a implementar:** `components/layout/Header.tsx`  
**Contiene:** `NavLinks.tsx` (sub-componente), lógica de menú mobile (drawer)  
**Usado en:** `app/home/page.tsx` (layout de la home page, NO en el layout global)

---

## ESPECIFICACIÓN COMPLETA

### Comportamiento General
- **Sticky:** `position: sticky; top: 0; z-index: 50`  
- **Fondo:** `#FFFFFF` siempre (no transparente en ningún estado)  
- **Sombra base:** ninguna en reposo  
- **Sombra al scroll > 10px:** `0 1px 6px rgba(0,0,0,0.10)` — detectar con `useEffect` + `scroll` listener  
- **Altura:** `72px` desktop / `60px` mobile  

### Layout Desktop (≥ 768px)

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo h=40px]          Inicio  Servicios  Nosotros  [Btn Cotizar] │
└────────────────────────────────────────────────────────────────────┘
```

- `display: flex; justify-content: space-between; align-items: center`
- Contenedor interno: `max-width: 1200px; margin: 0 auto; padding: 0 40px`

### Layout Mobile (< 768px)

```
┌────────────────────────────┐
│  [Logo h=32px]    [☰ btn] │
└────────────────────────────┘
```

- Los nav links se **ocultam** (`hidden` en mobile)  
- Ícono hamburguesa visible a la derecha  
- Al tocar ☰: se abre un **drawer lateral** (panel desde la derecha) con overlay semitransparente  

---

## COMPONENTE `NavLinks.tsx`

**Archivo:** `components/layout/NavLinks.tsx`

```typescript
interface NavLinksProps {
  orientation: 'horizontal' | 'vertical'; // horizontal = desktop, vertical = drawer
  onLinkClick?: () => void; // para cerrar el drawer al navegar
}
```

**Links a renderizar:**

| Texto    | href        |
|----------|-------------|
| Inicio   | `/home`     |
| Servicios| `#servicios`|
| Nosotros | `#nosotros` |

**Estilos por orientación:**

`horizontal`:
```css
display: flex;
flex-direction: row;
gap: 32px;
align-items: center;

a {
  color: #1A1A1A;
  font-weight: 500;
  font-size: 15px;
  text-decoration: none;
  transition: color 200ms ease;
}
a:hover { color: #1F7A5C; }
a.active { color: #1F7A5C; font-weight: 600; }
```

`vertical`:
```css
display: flex;
flex-direction: column;
gap: 0;

a {
  color: #1A1A1A;
  font-weight: 500;
  font-size: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #F5F7FA;
  text-decoration: none;
  transition: color 200ms ease;
}
a:hover { color: #1F7A5C; background-color: #F5F7FA; }
```

Usar `usePathname()` de `next/navigation` para marcar el link activo.

---

## COMPONENTE `Header.tsx`

### Partes del componente

```typescript
'use client';

// Estado interno:
// - isScrolled: boolean → detectado con scroll listener (usar useEffect)
// - isMobileMenuOpen: boolean → toggle del drawer

// ESTRUCTURA JSX:
<header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#FFFFFF', ... }}>
  <div className="container"> {/* max-width 1200px, centrado */}
    
    {/* Logo */}
    <Link href="/home">
      {/* 
        PLACEHOLDER temporal mientras no existen los assets:
        Renderizar el nombre "CargoClick" en texto estilizado:
        - Fondo: transparent
        - "Cargo" en color #0B3D91, peso 700
        - "Click" en color #1F7A5C, peso 700  
        - font-size: 22px desktop / 18px mobile
        
        Cuando el asset CargoClickLogoNombre esté disponible,
        reemplazar por: <Image src="/assets/CargoClickLogoNombre.svg" height={40} alt="CargoClick" />
      */}
    </Link>

    {/* NavLinks horizontal – visible solo desktop */}
    <nav className="hidden md:flex">
      <NavLinks orientation="horizontal" />
    </nav>

    {/* Botón CTA desktop */}
    <div className="hidden md:block">
      <Button variant="primary" size="md" href="/cotizar">
        Solicitar Cotización
      </Button>
    </div>

    {/* Hamburguesa mobile */}
    <button
      className="md:hidden"
      onClick={() => setIsMobileMenuOpen(true)}
      aria-label="Abrir menú de navegación"
    >
      {/* Ícono: usar <Menu size={24} /> de lucide-react, color #1A1A1A */}
    </button>

  </div>

  {/* Mobile Drawer */}
  {/* Ver especificación abajo */}
</header>
```

### Mobile Drawer

- **Trigger:** botón hamburguesa
- **Cierre:** botón X en el drawer, clic en overlay, navegación a cualquier link
- **Animación:** slide desde la derecha → `transform: translateX(100%)` → `translateX(0)`, `300ms ease-out`
- Usar estado local `isMobileMenuOpen` + clase condicional (sin Framer Motion aquí, solo CSS transition)

```
┌──────────────────┐ ┌──────────────────────┐
│  overlay oscuro  │ │    DRAWER          [X]│
│  rgba(0,0,0,0.5) │ │  ─────────────────   │
│                  │ │  Inicio              │
│                  │ │  Servicios           │
│                  │ │  Nosotros            │
│                  │ │  ─────────────────   │
│                  │ │  [Solicitar Cotiz.]  │
└──────────────────┘ └──────────────────────┘
```

**Especificación drawer:**
```css
/* Panel */
position: fixed;
top: 0;
right: 0;
width: 280px;
height: 100vh;
background: #FFFFFF;
z-index: 100;
display: flex;
flex-direction: column;

/* Header del drawer */
padding: 20px 24px;
display: flex;
justify-content: space-between;
align-items: center;
border-bottom: 1px solid #F5F7FA;
```

El botón de cierre usa `<X size={24} />` de lucide-react.

El botón CTA dentro del drawer va al fondo del panel:
```
padding: 24px;
border-top: 1px solid #F5F7FA;
```

### Efecto sombra al scroll

```typescript
useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10);
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

Aplicar en el `<header>`:
```typescript
style={{
  boxShadow: isScrolled ? '0 1px 6px rgba(0,0,0,0.10)' : 'none',
  transition: 'box-shadow 200ms ease',
}}
```

---

## ARCHIVOS A CREAR / MODIFICAR

| Archivo | Acción |
|---------|--------|
| `components/layout/NavLinks.tsx` | Crear completo |
| `components/layout/Header.tsx` | Reemplazar placeholder |

---

## RESTRICCIONES

- ❌ No modificar `app/layout.tsx` — el Header NO va en el layout global, solo en la home.
- ❌ No usar librerías de UI externas (MUI, Radix) para el drawer.
- ✅ El drawer debe ser accesible: `role="dialog"`, `aria-modal="true"`, focus trap básico.
- ✅ `'use client'` obligatorio en Header y NavLinks (usan estado y hooks).
- ✅ El overlay debe prevenir scroll del body cuando el drawer está abierto: `document.body.style.overflow = 'hidden'`.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `npm run type-check` sin errores.
- [ ] Header visible en `/home` con logo texto placeholder "Cargo**Click**".
- [ ] En desktop: nav links horizontales + botón CTA visibles.
- [ ] En mobile: solo logo + ícono hamburguesa visibles.
- [ ] Al tocar hamburguesa: drawer se abre con animación slide.
- [ ] Al tocar link del drawer: drawer se cierra y navega.
- [ ] Sombra aparece suavemente al hacer scroll > 10px.
