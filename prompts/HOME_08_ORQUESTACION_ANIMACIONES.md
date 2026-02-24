# PROMPT 08 – HOME: Orquestación de Página + Animaciones de Entrada

## PRERREQUISITO

Todos los prompts anteriores implementados y compilando sin errores:
- `PROMPT 01`: Tokens CSS + estructura + `Button`
- `PROMPT 02`: `Header` (con `NavLinks`)
- `PROMPT 03`: `HeroSection`
- `PROMPT 04`: `RespaldoSection`
- `PROMPT 05`: `FortalezaDualSection`
- `PROMPT 06`: `ComoFuncionaSection`
- `PROMPT 07`: `CtaFinalSection` + `Footer`

## CONTEXTO

**Archivos a crear / modificar:**
1. `app/home/page.tsx` — Página orquestadora principal
2. `app/page.tsx` — Redirección a `/home`
3. Animaciones de entrada scroll-triggered via **Framer Motion** (ya instalado: `"framer-motion": "^12.x"`)

---

## TAREA 1 – `app/home/page.tsx`

### Metadata de SEO

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CargoClick – Soluciones Logísticas con Visión Digital',
  description:
    'CargoClick integra experiencia operativa en transporte de carga con una gestión más organizada y eficiente. Respaldados por Transportes Nuevo Mundo S.A.S.',
  openGraph: {
    title: 'CargoClick – Soluciones Logísticas con Visión Digital',
    description: 'Solicite su cotización de transporte de carga de forma digital y organizada.',
    type: 'website',
  },
};
```

### Estructura JSX

```tsx
// app/home/page.tsx
// Server Component (las animaciones se harán en wrapper client components)

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import RespaldoSection from '@/components/home/RespaldoSection';
import FortalezaDualSection from '@/components/home/FortalezaDualSection';
import ComoFuncionaSection from '@/components/home/ComoFuncionaSection';
import CtaFinalSection from '@/components/home/CtaFinalSection';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <RespaldoSection />
        <FortalezaDualSection />
        <ComoFuncionaSection />
        <CtaFinalSection />
      </main>
      <Footer />
    </>
  );
}
```

> **Nota:** No usar el layout global de `app/layout.tsx` para el Header/Footer de la home. La home maneja su propio Header sticky. El layout global debe estar limpio o solo tener lo mínimo (HTML/body/fonts).

---

## TAREA 2 – `app/page.tsx`

Redirigir `/` a `/home`:

```typescript
// app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
}
```

---

## TAREA 3 – Animaciones de Entrada (Framer Motion)

### Filosofía
- Animaciones **sutiles** y funcionales.
- Scroll-triggered via `whileInView` de Framer Motion.
- Un componente wrapper reutilizable: `FadeInSection`.
- Las animaciones no deben afectar el LCP (Hero se carga sin delay).

### Componente Wrapper: `FadeInSection`

**Crear en:** `components/ui/FadeInSection.tsx`

```tsx
// components/ui/FadeInSection.tsx
'use client';

import { motion } from 'framer-motion';

interface FadeInSectionProps {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'right' | 'none';
  delay?: number;    // en segundos
  duration?: number; // en segundos
  className?: string;
}

export default function FadeInSection({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className,
}: FadeInSectionProps) {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 20 : 0,
      x: direction === 'left' ? -30 : direction === 'right' ? 30 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        delay,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

### Aplicación por sección

Modificar cada sección para envolver su contenido con `FadeInSection`. Como las secciones son Server Components, el wrapper `FadeInSection` actúa como Client Component boundary.

**Tabla de animaciones por sección:**

| Sección | Elemento | direction | delay |
|---------|----------|-----------|-------|
| Hero | Columna de texto | `'up'` | `0` |
| Hero | Columna de imagen | `'none'` (solo opacity) | `0.2` |
| Respaldo | Contenido completo | `'up'` | `0` |
| Fortaleza Dual | Bloque Operación | `'left'` | `0` |
| Fortaleza Dual | Bloque Digital | `'right'` | `0` |
| Cómo Funciona | Card 1 | `'up'` | `0` |
| Cómo Funciona | Card 2 | `'up'` | `0.1` |
| Cómo Funciona | Card 3 | `'up'` | `0.2` |
| CTA Final | Contenido | `'up'` | `0` |

### Ejemplo: HeroSection con animaciones

```tsx
// Modificar HeroSection.tsx para añadir animaciones
import FadeInSection from '@/components/ui/FadeInSection';

export default function HeroSection() {
  return (
    <section ...>
      <div style={{ /* grid container */ }}>
        
        {/* Texto con fadeInUp */}
        <FadeInSection direction="up" delay={0}>
          <div> {/* contenido textual */ } </div>
        </FadeInSection>
        
        {/* Imagen con fadeIn puro */}
        <FadeInSection direction="none" delay={0.2}>
          <div> {/* imagen o placeholder */ } </div>
        </FadeInSection>
        
      </div>
    </section>
  );
}
```

### Ejemplo: ComoFuncionaSection con delay escalonado

```tsx
// En ComoFuncionaSection, envolver cada card individualmente
{PASOS.map((paso, index) => (
  <FadeInSection key={paso.numero} direction="up" delay={index * 0.1}>
    <PasoCard {...paso} />
  </FadeInSection>
))}
```

### Ejemplo: FortalezaDualSection con slide lateral

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-16">
  <FadeInSection direction="left">
    <FortalezaBlock tema="operacion" ... />
  </FadeInSection>
  <FadeInSection direction="right">
    <FortalezaBlock tema="digital" ... />
  </FadeInSection>
</div>
```

---

## TAREA 4 – Verificar `app/layout.tsx`

Revisar que `app/layout.tsx` **no** incluya header ni footer propios que puedan duplicarse con los de la home. Si los tiene, eliminarlos o hacer que sean condicionales.

El layout global solo debe tener:
```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CargoClick',
  description: 'Soluciones Logísticas con Visión Digital',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
```

Si el layout actual tiene ThemeRegistry u otros wrappers necesarios para `/cotizar`, mantenerlos pero asegurarse de que no incluyan Header/Footer.

---

## RESTRICCIONES

- ❌ No animar el `<Header>` (interfiere con sticky).
- ❌ No usar `animate` de Framer Motion en el Hero directamente (puede afectar LCP).  
  Usar `whileInView` en todos los casos.
- ❌ No instalar nuevas dependencias — Framer Motion ya está instalado.
- ✅ `viewport={{ once: true }}` en TODOS los `whileInView` (anima solo una vez, no en re-scroll).
- ✅ El componente `FadeInSection` debe tener `'use client'`.
- ✅ Las secciones que usan `FadeInSection` pueden seguir siendo Server Components (el wrapper crea el boundary).

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. Crear `components/ui/FadeInSection.tsx`
2. Implementar `app/home/page.tsx` con todas las secciones (sin animaciones primero)
3. Verificar que la página carga correctamente en `http://localhost:3000/home`
4. Modificar `app/page.tsx` para redirect a `/home`
5. Aplicar `FadeInSection` wrapper en cada sección según la tabla
6. Verificar animaciones en browser (scroll manual)
7. Ejecutar `npm run type-check`

---

## CRITERIOS DE ACEPTACIÓN FINALES

- [ ] `npm run type-check` sin errores en todo el proyecto.
- [ ] `http://localhost:3000` redirige a `http://localhost:3000/home`.
- [ ] `http://localhost:3000/home` muestra todas las secciones en orden correcto:
  - Header
  - Hero
  - Respaldo
  - Fortaleza Dual
  - Cómo Funciona
  - CTA Final
  - Footer
- [ ] Al hacer scroll, las secciones aparecen con animación de entrada.
- [ ] Las animaciones ocurren solo una vez (no se repiten en re-scroll).
- [ ] `http://localhost:3000/cotizar` sigue funcionando sin cambios.
- [ ] No hay errores en consola del browser.
- [ ] El Header es sticky y la sombra aparece al hacer scroll > 10px.
- [ ] El botón "Solicitar Servicio" y "Solicitar Cotización" navegan correctamente a `/cotizar`.
