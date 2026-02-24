# Definición Detallada – Página de Inicio (Home Page)

**Fecha:** 20 de febrero de 2026  
**Versión:** 1.0  
**Tipo:** Documento Funcional + Técnico Unificado  
**Proyecto:** CargoClick – Soluciones Logísticas

---

## 📋 Índice

1. [Propósito de la Página](#1-propósito-de-la-página)
2. [Sistema de Diseño Base](#2-sistema-de-diseño-base)
3. [Estructura General y Responsive](#3-estructura-general-y-responsive)
4. [Sección 1 – HEADER](#4-sección-1--header)
5. [Sección 2 – HERO](#5-sección-2--hero)
6. [Sección 3 – RESPALDO](#6-sección-3--respaldo)
7. [Sección 4 – NUESTRA FORTALEZA DUAL](#7-sección-4--nuestra-fortaleza-dual)
8. [Sección 5 – CÓMO FUNCIONA](#8-sección-5--cómo-funciona)
9. [Sección 6 – CTA FINAL](#9-sección-6--cta-final)
10. [Sección 7 – FOOTER](#10-sección-7--footer)
11. [Assets Requeridos](#11-assets-requeridos)
12. [Interacciones y Animaciones](#12-interacciones-y-animaciones)
13. [Accesibilidad](#13-accesibilidad)
14. [Reglas y Restricciones de Diseño](#14-reglas-y-restricciones-de-diseño)
15. [Especificación de Componentes React](#15-especificación-de-componentes-react)

---

## 1. Propósito de la Página

### 1.1. Objetivo Principal
La página de inicio es el **punto de entrada principal** del sitio web de CargoClick. Debe cumplir tres objetivos simultáneos:

1. **Comunicar identidad** – Transmitir que CargoClick es una empresa de tecnología logística seria, moderna y confiable, respaldada por Transportes Nuevo Mundo S.A.S.
2. **Generar confianza** – Mostrar la trayectoria operativa (+20 años) y la capacidad tecnológica como diferenciales.
3. **Convertir visitantes** – Dirigir al usuario hacia la acción de solicitar una cotización de transporte.

### 1.2. Audiencia Objetivo
| Perfil | Necesidad | Mensaje clave |
|--------|-----------|---------------|
| Gerente de logística empresarial | Transportar carga con proveedor confiable | "+20 años de experiencia operativa" |
| Coordinador de compras B2B | Gestión organizada de servicios | "Organización digital de servicios" |
| Director de operaciones | Visibilidad y seguimiento | "Monitoreamos el servicio hasta su finalización" |

### 1.3. Métrica de Éxito
- El usuario comprende la propuesta de valor en menos de 5 segundos (above the fold).
- El CTA "Solicitar Servicio" o "Solicitar Cotización" es visible sin scroll en desktop y mobile.
- La sección "Cómo Funciona" reduce la fricción cognitiva antes de solicitar.

---

## 2. Sistema de Diseño Base

### 2.1. Paleta de Colores

| Token | Hex | Uso |
|-------|-----|-----|
| `color-primary` | `#0B3D91` | Títulos principales, fondo CTA final, iconografía operativa, línea superior bloque Operación |
| `color-accent` | `#1F7A5C` | Botones principales, iconografía digital, línea superior bloque CargoClick, hover de nav links |
| `color-accent-hover` | `#155D47` | Estado hover de todos los botones principales |
| `color-bg-primary` | `#FFFFFF` | Fondo principal del sitio |
| `color-bg-secondary` | `#F5F7FA` | Fondo de secciones alternas (RESPALDO, CÓMO FUNCIONA) |
| `color-text-primary` | `#1A1A1A` | Texto de cuerpo principal |
| `color-text-secondary` | `#5E6B78` | Subtítulos, textos de apoyo, metadatos |
| `color-footer-bg` | `#0A2A5E` | Fondo del Footer |
| `color-text-on-dark` | `#FFFFFF` | Texto sobre fondos oscuros (CTA, Footer) |
| `color-text-on-dark-muted` | `rgba(255,255,255,0.80)` | Texto secundario sobre fondos oscuros |

### 2.2. Tipografía

| Elemento | Familia | Peso | Tamaño Desktop | Tamaño Mobile | Color |
|----------|---------|------|----------------|---------------|-------|
| H1 (Hero título) | Sans-serif (Inter / Poppins) | 700 | 42–48px | 28–34px | `#0B3D91` |
| H2 (Títulos de sección) | Sans-serif | 700 | 32–36px | 24–28px | `#0B3D91` |
| H3 (Títulos de bloque/card) | Sans-serif | 700 | 20–22px | 18–20px | Heredado del tema del bloque |
| Body (párrafo estándar) | Sans-serif | 400 | 16px | 15px | `#1A1A1A` |
| Subtítulo Hero | Sans-serif | 400 | 18px | 16px | `#5E6B78` |
| Caption / Label | Sans-serif | 600 | 14px | 13px | `#5E6B78` |
| Botón | Sans-serif | 600 | 16px | 15px | `#FFFFFF` |

### 2.3. Espaciado (Spacing Scale)

```
spacing-xs:  4px
spacing-sm:  8px
spacing-md:  16px
spacing-lg:  24px
spacing-xl:  40px
spacing-2xl: 64px
spacing-3xl: 96px
```

**Padding de secciones:**
- Desktop: `96px` vertical, `80px` horizontal máximo en contenedor centrado
- Mobile: `48px` vertical, `20px` horizontal

### 2.4. Sombras

La filosofía de diseño es **minimal**. No se usan sombras fuertes.

| Tipo | Valor CSS | Uso |
|------|-----------|-----|
| Sombra suave | `0 2px 8px rgba(0,0,0,0.06)` | Cards de "Cómo Funciona" (opcional, muy sutil) |
| Sin sombra | — | Imágenes, hero, logo |

### 2.5. Border Radius

| Elemento | Valor |
|----------|-------|
| Botón principal | `6px` |
| Card de sección | `8px` |
| Imagen decorativa | `0px` (sin border-radius) |

---

## 3. Estructura General y Responsive

### 3.1. Contenedor Principal

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px; /* Desktop */
}

@media (max-width: 768px) {
  .container {
    padding: 0 20px;
  }
}
```

### 3.2. Breakpoints Responsivos

| Nombre | Ancho mínimo | Descripción |
|--------|-------------|-------------|
| `mobile` | 320px | Teléfonos pequeños |
| `sm` | 480px | Teléfonos grandes |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops / Tablets grandes |
| `xl` | 1200px | Desktop estándar |
| `2xl` | 1440px | Desktop grande |

### 3.3. Layout por Sección

| Sección | Desktop | Mobile |
|---------|---------|--------|
| Header | Flex row: logo + nav + botón | Logo + ícono hamburguesa |
| Hero | Grid 2 cols: 45% texto / 55% imagen | Stack vertical: texto arriba, imagen abajo |
| Respaldo | Flex row centrado | Stack vertical centrado |
| Fortaleza Dual | Grid 2 cols 50/50 | Stack vertical: Operación → Digital |
| Cómo Funciona | Flex row 3 bloques iguales | Stack vertical 3 bloques |
| CTA Final | Centrado | Centrado |
| Footer | Flex row: logo izq / datos der | Stack vertical |

---

## 4. Sección 1 – HEADER

### 4.1. Propósito Funcional
Proporcionar navegación principal persistente y acceso directo a la acción de conversión.

### 4.2. Comportamiento
- **Sticky:** Se mantiene fijo en la parte superior durante el scroll.
- **Fondo:** Blanco sólido `#FFFFFF` en todo momento (sin transparencia al inicio ni cambio en scroll).
- **z-index:** Superior al resto del contenido (mínimo `z-index: 50`).

### 4.3. Especificación Visual

```
┌────────────────────────────────────────────────────────────────────┐
│  [CargoClickLogoNombre h=40px]          Inicio  Servicios  Nosotros  [Solicitar Cotización] │
└────────────────────────────────────────────────────────────────────┘
```

| Elemento | Especificación |
|----------|----------------|
| Fondo | `#FFFFFF` |
| Altura header | `72px` desktop / `60px` mobile |
| Sombra inferior | `0 1px 4px rgba(0,0,0,0.08)` (sutil, solo para separar del contenido) |
| Logo | `CargoClickLogoNombre`, `height: 40px`, `width: auto` |
| Links de navegación | `color: #1A1A1A`, `font-weight: 500`, `font-size: 15px` |
| Link hover | `color: #1F7A5C`, transición `color 200ms ease` |
| Link activo / current | `color: #1F7A5C`, `font-weight: 600` |
| Separación entre links | `gap: 32px` |

### 4.4. Botón "Solicitar Cotización"

| Propiedad | Valor |
|-----------|-------|
| Fondo | `#1F7A5C` |
| Texto | `Blanco #FFFFFF` |
| Peso tipográfico | `600` |
| Border-radius | `6px` |
| Padding | `12px 20px` |
| Hover fondo | `#155D47` |
| Transición hover | `background-color 200ms ease` |
| Acción | Navega a `/cotizar` (la página de formulario conversacional) |

### 4.5. Comportamiento Mobile (< 768px)

- El menú de links se oculta.
- Se muestra un ícono de hamburguesa (☰) a la derecha.
- Al hacer clic, se despliega un menú drawer vertical con todos los links + botón CTA.
- El botón "Solicitar Cotización" permanece visible en el drawer.

---

## 5. Sección 2 – HERO

### 5.1. Propósito Funcional
Comunicar la propuesta de valor principal de CargoClick en el primer vistazo (above the fold). Debe responder en 3 segundos: **¿Qué hace? ¿Para quién? ¿Qué debo hacer?**

### 5.2. Especificación Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Soluciones Logísticas          [  CamionConCarga image  ]     │
│   con Visión Digital                                            │
│                                                                 │
│   CargoClick integra                                            │
│   experiencia operativa...                                      │
│                                                                 │
│   [Solicitar Servicio]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Elemento | Especificación |
|----------|----------------|
| Fondo sección | `#FFFFFF` |
| Padding vertical | `96px` arriba y abajo |
| Layout | CSS Grid: `grid-template-columns: 45fr 55fr` |
| Alineación columna texto | `align-self: center` |

### 5.3. Columna Izquierda – Contenido Textual

| Elemento | Valor |
|----------|-------|
| Eyebrow (opcional) | Texto pequeño previo al H1, ej: "Logística B2B" – `font-size: 13px`, `font-weight: 600`, `color: #1F7A5C`, `letter-spacing: 1.5px`, `text-transform: uppercase` |
| **H1 – Título** | `"Soluciones Logísticas con Visión Digital"` |
| H1 color | `#0B3D91` |
| H1 font-size | `42px` → `48px` (desktop), `28px` (mobile) |
| H1 font-weight | `700` |
| H1 line-height | `1.15` |
| Subtítulo | `"CargoClick integra experiencia operativa en transporte de carga con una gestión más organizada y eficiente."` |
| Subtítulo color | `#5E6B78` |
| Subtítulo font-size | `18px` desktop / `16px` mobile |
| Subtítulo font-weight | `400` |
| Subtítulo line-height | `1.6` |
| Margen H1 → subtítulo | `16px` (spacing-md) |
| Margen subtítulo → botón | `32px` |

### 5.4. Botón CTA Hero

| Propiedad | Valor |
|-----------|-------|
| Texto | `Solicitar Servicio` |
| Fondo | `#1F7A5C` |
| Hover | `#155D47` |
| Padding | `14px 28px` |
| Border-radius | `6px` |
| Font-size | `16px` |
| Font-weight | `600` |
| Color texto | `#FFFFFF` |
| Transición | `background-color 200ms ease, transform 150ms ease` |
| Hover transform | `translateY(-1px)` (sutil lift) |
| Acción | Navega a `/cotizar` |

### 5.5. Columna Derecha – Imagen

| Propiedad | Valor |
|-----------|-------|
| Imagen | `CamionConCarga` |
| Ancho | `100%` de su columna (55% del grid) |
| Altura | Auto, proporcional |
| Object-fit | `contain` |
| Sombra | **Ninguna** |
| Fondo adicional | **Ninguno** |
| Border-radius | `0px` |
| Alt text | `"Camión de carga CargoClick en operación logística"` |

### 5.6. Comportamiento Mobile

- El grid pasa a una sola columna: texto arriba, imagen abajo.
- La imagen se limita a `height: 220px` para no ocupar demasiado espacio.
- El título H1 se reduce a `28px`.

---

## 6. Sección 3 – RESPALDO

### 6.1. Propósito Funcional
Generar confianza mediante la asociación explícita con Transportes Nuevo Mundo S.A.S., empresa con trayectoria operativa. Es una señal de legitimidad y solidez.

### 6.2. Especificación Visual

```
┌────────────────────────────────────────────────────────┐
│                  #F5F7FA                               │
│     Operación respaldada por                           │
│     Transportes Nuevo Mundo S.A.S.                     │
│                                                        │
│         [NuevoMundoLogoNombreLadoDerecho  h=60px]      │
└────────────────────────────────────────────────────────┘
```

| Elemento | Especificación |
|----------|----------------|
| Fondo | `#F5F7FA` |
| Padding vertical | `48px` |
| Alineación | Centrada horizontal |
| Texto principal | `"Operación respaldada por Transportes Nuevo Mundo S.A.S."` |
| Color texto | `#1A1A1A` |
| Font-weight | `600` |
| Font-size | `18px` desktop / `16px` mobile |
| Separación texto → logo | `20px` |
| Logo | `NuevoMundoLogoNombreLadoDerecho` |
| Altura logo | `60px` |
| Logo width | `auto` |
| Alt text logo | `"Transportes Nuevo Mundo S.A.S. – Empresa respaldante de CargoClick"` |

---

## 7. Sección 4 – NUESTRA FORTALEZA DUAL

### 7.1. Propósito Funcional
Mostrar la propuesta de valor diferencial: la combinación de experiencia operativa (Transportes Nuevo Mundo) y capacidad tecnológica (CargoClick). Esta sección convierte el respaldo en argumento de venta.

### 7.2. Especificación Visual Global

| Elemento | Especificación |
|----------|----------------|
| Fondo | `#FFFFFF` |
| Padding vertical | `96px` |
| Layout | CSS Grid: `grid-template-columns: 1fr 1fr`, `gap: 64px` |
| Título de sección (opcional) | `"Nuestra Fortaleza Dual"` centrado arriba, `color: #0B3D91`, `font-weight: 700` |

### 7.3. Columna Izquierda – Bloque Operación (Transportes Nuevo Mundo)

| Elemento | Especificación |
|----------|----------------|
| Línea superior decorativa | `height: 4px`, `background: #0B3D91`, `width: 48px`, `border-radius: 2px` |
| Título bloque | `"Transportes Nuevo Mundo"` |
| Color título | `#0B3D91` |
| Font-weight | `700` |
| Font-size | `22px` |
| Margen línea → título | `12px` |
| Margen título → lista | `24px` |

**Lista de bullets:**

| # | Icono | Asset o Ícono | Texto | Color icono |
|---|-------|---------------|-------|-------------|
| 1 | Imagen | `20AnosExp` | `+20 años en transporte de carga` | `#0B3D91` |
| 2 | Imagen | `CoberturaNacional` | `Flota confiable a nivel nacional` | `#0B3D91` |
| 3 | SVG / Icono genérico | — | `Experiencia en operación de carga` | `#0B3D91` |

**Especificación de cada bullet item:**
```
[Ícono 24px]  [Texto 16px color #1A1A1A]
  gap: 12px entre icono y texto
  padding vertical por item: 8px
```

### 7.4. Columna Derecha – Bloque Digital (CargoClick)

| Elemento | Especificación |
|----------|----------------|
| Línea superior decorativa | `height: 4px`, `background: #1F7A5C`, `width: 48px`, `border-radius: 2px` |
| Título bloque | `"CargoClick"` |
| Color título | `#1F7A5C` |
| Font-weight | `700` |
| Font-size | `22px` |
| Margen línea → título | `12px` |
| Margen título → lista | `24px` |

**Lista de bullets:**

| # | Icono | Texto | Color icono |
|---|-------|-------|-------------|
| 1 | SVG / Icono digital | `Organización digital de servicios` | `#1F7A5C` |
| 2 | SVG / Icono comunicación | `Comunicación centralizada` | `#1F7A5C` |
| 3 | SVG / Icono seguimiento | `Seguimiento más organizado` | `#1F7A5C` |

### 7.5. Comportamiento Mobile

- Las dos columnas se apilan verticalmente.
- Primero aparece el bloque **Operación** (Transportes Nuevo Mundo).
- Luego aparece el bloque **Digital** (CargoClick).
- `gap` entre bloques en mobile: `48px`.

---

## 8. Sección 5 – CÓMO FUNCIONA

### 8.1. Propósito Funcional
Reducir la fricción cognitiva del usuario explicando el proceso de manera simple y visual. El usuario debe entender en 10 segundos qué pasa después de solicitar.

### 8.2. Especificación Visual

```
┌────────────────────────────────────────────────────────────────┐
│                        #F5F7FA                                 │
│                     ¿Cómo Funciona?                            │
│                                                                │
│   [Bloque 1]          [Bloque 2]          [Bloque 3]           │
│   Solicitas           Coordinamos         Ejecutamos           │
│   el servicio         la operación        y supervisamos       │
└────────────────────────────────────────────────────────────────┘
```

| Elemento | Especificación |
|----------|----------------|
| Fondo sección | `#F5F7FA` |
| Padding vertical | `96px` |
| Título de sección | `"¿Cómo Funciona?"` |
| Título color | `#0B3D91` |
| Título font-weight | `700` |
| Título font-size | `36px` desktop / `26px` mobile |
| Alineación título | `text-align: center` |
| Margen título → bloques | `48px` |
| Layout bloques | `display: flex`, `flex-direction: row`, `gap: 32px`, `justify-content: center` |

### 8.3. Especificación de Cada Bloque de Paso

| Elemento | Especificación |
|----------|----------------|
| Ancho | `calc(33.33% - 22px)` |
| Fondo | `#FFFFFF` |
| Padding | `32px 24px` |
| Border-radius | `8px` |
| Sombra | `0 2px 8px rgba(0,0,0,0.06)` |
| Alineación interna | `text-align: center` |

**Bloque 1 – Solicitas el servicio:**

| Elemento | Especificación |
|----------|----------------|
| Número paso | `"01"` o numeración visual, `color: #0B3D91`, `font-size: 13px`, `font-weight: 700` |
| Icono | `SolicitarServicio` (asset), `height: 56px`, `margin: 0 auto 16px` |
| Título | `"Solicitas el servicio"` |
| Título color | `#1A1A1A` |
| Título font-weight | `700` |
| Título font-size | `18px` |
| Texto | `"Completa el formulario con los datos de tu operación."` |
| Texto color | `#5E6B78` |
| Texto font-size | `15px` |
| Texto line-height | `1.6` |

**Bloque 2 – Coordinamos la operación:**

| Elemento | Especificación |
|----------|----------------|
| Número paso | `"02"` |
| Icono | `CoberturaNacional` (versión reducida, `height: 56px`) |
| Título | `"Coordinamos la operación"` |
| Texto | `"Asignamos flota y planificamos el servicio."` |

**Bloque 3 – Ejecutamos y supervisamos:**

| Elemento | Especificación |
|----------|----------------|
| Número paso | `"03"` |
| Icono | `EjecutamosSupervisamos` (asset), `height: 56px` |
| Título | `"Ejecutamos y supervisamos"` |
| Texto | `"Monitoreamos el servicio hasta su finalización."` |

### 8.4. Comportamiento Mobile

- Los 3 bloques se apilan verticalmente.
- Cada bloque ocupa el `100%` del ancho del contenedor.
- `gap` entre bloques: `20px`.

---

## 9. Sección 6 – CTA FINAL

### 9.1. Propósito Funcional
Captura de conversión al final del scroll. Para el usuario que llegó hasta aquí, es el último llamado a la acción antes del Footer. Debe ser visualmente contrastante y motivador.

### 9.2. Especificación Visual

```
┌────────────────────────────────────────────────────────┐
│                    #0B3D91                             │
│                                                        │
│         Optimiza tu Operación Logística Hoy            │
│                                                        │
│               [Solicitar Cotización]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

| Elemento | Especificación |
|----------|----------------|
| Fondo sección | `#0B3D91` |
| Padding vertical | `80px` |
| Alineación | `text-align: center` |
| Título | `"Optimiza tu Operación Logística Hoy"` |
| Título color | `#FFFFFF` |
| Título font-size | `36px` desktop / `26px` mobile |
| Título font-weight | `700` |
| Margen título → botón | `32px` |

### 9.3. Botón CTA Final

| Propiedad | Valor |
|-----------|-------|
| Texto | `Solicitar Cotización` |
| Fondo | `#1F7A5C` |
| Hover fondo | `#155D47` |
| Color texto | `#FFFFFF` |
| Font-weight | `600` |
| Font-size | `16px` |
| Padding | `14px 32px` |
| Border-radius | `6px` |
| Transición | `background-color 200ms ease, transform 150ms ease` |
| Hover transform | `translateY(-1px)` |
| Acción | Navega a `/cotizar` |

---

## 10. Sección 7 – FOOTER

### 10.1. Propósito Funcional
Cierre del sitio con datos de contacto e identidad visual. No es una sección de conversión sino de confianza y accesibilidad de contacto.

### 10.2. Especificación Visual

```
┌────────────────────────────────────────────────────────────────┐
│  #0A2A5E                                                       │
│  [CargoClickLogo]                    Datos de contacto         │
│                                      email@cargoclick.com      │
│                                      +57 xxx xxx xxxx          │
│                                      Ciudad, País              │
└────────────────────────────────────────────────────────────────┘
```

| Elemento | Especificación |
|----------|----------------|
| Fondo | `#0A2A5E` |
| Padding vertical | `48px` |
| Layout | `display: flex`, `justify-content: space-between`, `align-items: flex-start` |
| Logo | `CargoClickLogo` (versión solo logo o logo+nombre en blanco), `height: 36px` |
| Color texto general | `rgba(255, 255, 255, 0.80)` |
| Font-size | `14px` |
| Line-height | `1.8` |
| Copyright line | `"© 2026 CargoClick. Todos los derechos reservados."` `font-size: 12px`, `opacity: 0.6`, centrado abajo |

### 10.3. Bloque de Datos de Contacto (columna derecha)

| Campo | Valor de ejemplo |
|-------|-----------------|
| Email | Dato real del negocio |
| Teléfono | Dato real del negocio |
| Ciudad / País | Dato real del negocio |

### 10.4. Comportamiento Mobile

- Logo arriba centrado.
- Datos de contacto abajo centrados.
- `gap: 24px` entre secciones.

---

## 11. Assets Requeridos

| Nombre del Asset | Uso | Formato Recomendado | Restricciones |
|-----------------|-----|---------------------|---------------|
| `CargoClickLogoNombre` | Header | SVG / PNG transparente | `height: 40px` |
| `CargoClickLogo` | Footer | SVG / PNG blanco | `height: 36px` |
| `NuevoMundoLogoNombreLadoDerecho` | Sección Respaldo | SVG / PNG transparente | `height: 60px` |
| `CamionConCarga` | Hero | WebP / PNG transparente | `≥ 600px width`, sin fondo |
| `20AnosExp` | Fortaleza Dual – Operación bullet 1 | SVG / PNG | `24px` como icono list |
| `CoberturaNacional` | Fortaleza Dual – Operación bullet 2 + Paso 2 "Cómo Funciona" | SVG / PNG | `24px` list / `56px` card |
| `SolicitarServicio` | Cómo Funciona – Paso 1 | SVG / PNG | `56px` |
| `EjecutamosSupervisamos` | Cómo Funciona – Paso 3 | SVG / PNG | `56px` |

---

## 12. Interacciones y Animaciones

### 12.1. Filosofía de Animación
Las animaciones deben ser **sutiles y funcionales**, no decorativas. Refuerzan la sensación de modernidad sin distraer.

### 12.2. Transiciones Globales

| Elemento | Interacción | Efecto |
|----------|-------------|--------|
| Nav links | Hover | `color` cambia en `200ms ease` |
| Botones principales | Hover | `background-color` en `200ms ease` + `translateY(-1px)` en `150ms` |
| Botones principales | Active (clic) | `translateY(0)` + ligero `scale(0.98)` |
| Cards "Cómo Funciona" | Hover | `box-shadow` pasa a `0 4px 16px rgba(0,0,0,0.10)` en `250ms ease` |

### 12.3. Animaciones de Entrada (Scroll-triggered)

Usando `IntersectionObserver` o librería como Framer Motion:

| Sección | Animación de entrada |
|---------|---------------------|
| Hero – texto | `fadeInUp`: `opacity: 0 → 1`, `translateY(20px → 0)`, `500ms ease-out` |
| Hero – imagen | `fadeIn`: `opacity: 0 → 1`, `600ms ease-out`, `delay: 200ms` |
| Sección Respaldo | `fadeIn` al entrar en viewport |
| Bloques Fortaleza Dual | Columna izq. `slideInLeft`, columna der. `slideInRight`, `400ms ease-out` |
| Cards Cómo Funciona | Escalonado: `delay: 0ms / 100ms / 200ms`, `fadeInUp` |
| CTA Final | `fadeIn` al entrar en viewport |

### 12.4. Header – Comportamiento en Scroll

- El header permanece siempre `#FFFFFF`. No hay cambio al hacer scroll.
- Se puede añadir una sombra inferior que aparece suavemente tras hacer scroll > 10px: `box-shadow: 0 1px 6px rgba(0,0,0,0.10)`.

---

## 13. Accesibilidad

### 13.1. Requisitos Mínimos (WCAG 2.1 AA)

| Requisito | Especificación |
|-----------|----------------|
| Contraste de color | Todos los textos sobre fondos deben superar ratio 4.5:1 |
| `#0B3D91` sobre `#FFFFFF` | ✅ Ratio ≈ 8.4:1 (pasa) |
| `#1F7A5C` sobre `#FFFFFF` | ✅ Ratio ≈ 4.7:1 (pasa) |
| `#5E6B78` sobre `#FFFFFF` | ✅ Ratio ≈ 4.6:1 (pasa) |
| `#FFFFFF` sobre `#0B3D91` | ✅ Ratio ≈ 8.4:1 (pasa) |
| `#FFFFFF` sobre `#1F7A5C` | ✅ Ratio ≈ 4.7:1 (pasa) |
| Foco de teclado | Todos los elementos interactivos deben tener `focus-visible` con outline claro |
| Alt text en imágenes | Obligatorio en todos los `<img>` |
| Estructura de headings | H1 único por página, jerarquía H1 → H2 → H3 respetada |
| Links descriptivos | Los botones no deben decir solo "clic aquí" |
| `aria-label` | Botón hamburguesa mobile: `aria-label="Abrir menú de navegación"` |

### 13.2. Navegación por Teclado

| Elemento | Comportamiento |
|----------|----------------|
| Tab order | Header → Hero → Secciones → CTA → Footer |
| Botón hamburguesa | Activable con Enter / Space |
| Menú mobile drawer | Trampable (focus trap mientras esté abierto) |
| Links nav | Navegables con Tab, activos con Enter |

---

## 14. Reglas y Restricciones de Diseño

> Estas reglas son **no negociables** y deben respetarse en toda implementación.

| Regla | Detalle |
|-------|---------|
| ❌ Verde nunca en títulos principales | `#1F7A5C` solo se usa en botones, iconografía accent, y línea del bloque CargoClick |
| ❌ Azul nunca en botones principales | `#0B3D91` solo se usa en títulos, fondo CTA Final y línea del bloque Operación |
| ❌ Sin sombras fuertes | Nunca `box-shadow` con `blur > 20px` o `opacity > 0.15` en diseño general |
| ❌ Sin texto dentro de imágenes | Todo el texto debe ser HTML/CSS, nunca parte del asset de imagen |
| ❌ Sin mezcla de estilos | El sistema de colores es cerrado; no introducir colores fuera de la paleta definida |
| ✅ Consistencia de botones | Todos los botones CTA deben ser `#1F7A5C` con hover `#155D47` |
| ✅ H1 único | Solo una etiqueta `<h1>` por página |
| ✅ Imágenes con alt text | Todas las imágenes deben tener `alt` descriptivo |

---

## 15. Especificación de Componentes React

### 15.1. Árbol de Componentes

```
app/home/page.tsx
 ├── Header (components/layout/Header.tsx)
 │    ├── Logo (components/ui/Logo.tsx)
 │    ├── NavLinks (components/layout/NavLinks.tsx)
 │    └── Button "Solicitar Cotización"
 ├── HeroSection (components/home/HeroSection.tsx)
 │    ├── HeroText
 │    └── HeroImage
 ├── RespaldoSection (components/home/RespaldoSection.tsx)
 ├── FortalezaDualSection (components/home/FortalezaDualSection.tsx)
 │    ├── FortalezaBlock (×2 – Operación y Digital)
 │    └── BulletItem (×5 en total)
 ├── ComoFuncionaSection (components/home/ComoFuncionaSection.tsx)
 │    └── PasoCard (×3)
 ├── CtaFinalSection (components/home/CtaFinalSection.tsx)
 └── Footer (components/layout/Footer.tsx)
```

### 15.2. Props de Componentes Clave

**`FortalezaBlock`**
```typescript
interface FortalezaBlockProps {
  tema: 'operacion' | 'digital';  // define colores
  titulo: string;
  bullets: Array<{
    texto: string;
    iconoSrc?: string;          // asset path
    iconoAlt?: string;
  }>;
}
```

**`PasoCard`**
```typescript
interface PasoCardProps {
  numero: '01' | '02' | '03';
  iconoSrc: string;
  iconoAlt: string;
  titulo: string;
  descripcion: string;
}
```

**`Button` (componente base reutilizable)**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  href?: string;       // si es link de navegación
  onClick?: () => void;
  fullWidth?: boolean;
}
```

### 15.3. Rutas y Archivo

| Archivo | Responsabilidad |
|---------|----------------|
| `app/home/page.tsx` | Página de inicio, orquesta todas las secciones |
| `app/page.tsx` | Redirige a `/home` o renderiza directamente la home |
| `components/layout/Header.tsx` | Header sticky con navegación |
| `components/layout/Footer.tsx` | Footer con datos de contacto |
| `components/home/HeroSection.tsx` | Sección hero completa |
| `components/home/RespaldoSection.tsx` | Sección de respaldo con logo Nuevo Mundo |
| `components/home/FortalezaDualSection.tsx` | Sección de dos columnas de valor |
| `components/home/ComoFuncionaSection.tsx` | Sección de 3 pasos |
| `components/home/CtaFinalSection.tsx` | Sección CTA con fondo azul |

---

*Fin del documento. Versión 1.0 – 20 de febrero de 2026.*
