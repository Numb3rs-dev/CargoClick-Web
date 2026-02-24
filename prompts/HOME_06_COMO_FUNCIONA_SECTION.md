# PROMPT 06 – HOME: ComoFuncionaSection

## PRERREQUISITO

Tener implementado `PROMPT 01` (tokens CSS).

## CONTEXTO

**Archivo a implementar:** `components/home/ComoFuncionaSection.tsx`  
**Sub-componente:** `PasoCard` (×3)  
**Propósito:** Reducir fricción cognitiva explicando el proceso en 3 pasos simples. El usuario debe entender en 10 segundos qué pasa después de solicitar.

---

## LAYOUT GENERAL

### Desktop (≥ 768px)

```
┌────────────────────────────────────────────────────────────────┐
│  background: #F5F7FA    padding: 96px 0                        │
│                                                                │
│                     ¿Cómo Funciona?                            │
│                                                                │
│  ┌──── card 1 ────┐  ┌──── card 2 ────┐  ┌──── card 3 ────┐  │
│  │      [ícono]   │  │     [ícono]    │  │     [ícono]    │  │
│  │        01      │  │      02        │  │      03        │  │
│  │  Solicitas     │  │  Coordinamos   │  │  Ejecutamos y  │  │
│  │  el servicio   │  │  la operación  │  │  supervisamos  │  │
│  │                │  │                │  │                │  │
│  │  [descripción] │  │  [descripción] │  │  [descripción] │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

Layout de cards:
```css
display: flex;
flex-direction: row;
gap: 32px;
justify-content: center;
```

### Mobile (< 768px)

- Flex a `flex-direction: column`
- Cada card al `100%` de ancho
- `gap: 20px` entre cards

---

## SUB-COMPONENTE: `PasoCard`

### Props
```typescript
interface PasoCardProps {
  numero: '01' | '02' | '03';
  iconoSrc: string;            // path al asset
  iconoAlt: string;
  fallbackIcon: React.ReactNode; // ícono Lucide si no hay asset
  titulo: string;
  descripcion: string;
}
```

### Especificación visual de la card
```css
/* Card container */
background:    #FFFFFF;
padding:       32px 24px;
border-radius: 8px;
box-shadow:    0 2px 8px rgba(0,0,0,0.06);
text-align:    center;
flex:          1;  /* para que tengan el mismo ancho en flex row */
min-width:     0;  /* evitar overflow en flex */

/* Hover */
box-shadow (hover): 0 4px 16px rgba(0,0,0,0.10);
transition:         box-shadow 250ms ease;
```

### Estructura interna de cada card

```tsx
<div style={{ /* card styles */ }}>
  
  {/* Ícono central */}
  <div style={{ 
    height: '56px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    margin: '0 auto 16px',
  }}>
    {/* Asset o fallback Lucide 40px */}
  </div>

  {/* Número de paso */}
  <p style={{
    color: '#0B3D91',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '1px',
    marginBottom: '8px',
  }}>
    {numero}
  </p>

  {/* Título */}
  <h3 style={{
    color: '#1A1A1A',
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '12px',
  }}>
    {titulo}
  </h3>

  {/* Descripción */}
  <p style={{
    color: '#5E6B78',
    fontSize: '15px',
    lineHeight: '1.6',
  }}>
    {descripcion}
  </p>

</div>
```

---

## DATOS DE LOS 3 PASOS

```typescript
const PASOS = [
  {
    numero: '01' as const,
    iconoSrc: '/assets/SolicitarServicio.svg',
    iconoAlt: 'Formulario de solicitud de servicio',
    fallbackIcon: null, // usar <ClipboardList size={40} color="#0B3D91" />
    titulo: 'Solicitas el servicio',
    descripcion: 'Completa el formulario con los datos de tu operación.',
  },
  {
    numero: '02' as const,
    iconoSrc: '/assets/CoberturaNacional.svg',
    iconoAlt: 'Coordinación de operación logística',
    fallbackIcon: null, // usar <Truck size={40} color="#0B3D91" />
    titulo: 'Coordinamos la operación',
    descripcion: 'Asignamos flota y planificamos el servicio.',
  },
  {
    numero: '03' as const,
    iconoSrc: '/assets/EjecutamosSupervisamos.svg',
    iconoAlt: 'Ejecución y supervisión del servicio',
    fallbackIcon: null, // usar <CheckCircle size={40} color="#0B3D91" />
    titulo: 'Ejecutamos y supervisamos',
    descripcion: 'Monitoreamos el servicio hasta su finalización.',
  },
];
```

**Íconos Lucide fallback por paso:**
| Paso | Ícono Lucide | Import |
|------|-------------|--------|
| 01 | `ClipboardList` | `import { ClipboardList } from 'lucide-react'` |
| 02 | `Truck` | `import { Truck } from 'lucide-react'` |
| 03 | `CheckCircle` | `import { CheckCircle } from 'lucide-react'` |

En todos los casos usar `size={40}` y `color="#0B3D91"`.

---

## COMPONENTE PRINCIPAL: `ComoFuncionaSection`

```tsx
// components/home/ComoFuncionaSection.tsx
// Server Component

import PasoCard from './PasoCard'; // o definir inline en el mismo archivo

export default function ComoFuncionaSection() {
  return (
    <section
      aria-label="Cómo funciona CargoClick"
      style={{ background: '#F5F7FA', padding: '96px 0' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>

        {/* Título de sección */}
        <h2 style={{
          color: '#0B3D91',
          fontSize: '36px',      /* 26px en mobile */
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '48px',
        }}>
          ¿Cómo Funciona?
        </h2>

        {/* Cards container */}
        <div className="flex flex-col md:flex-row gap-5 md:gap-8">
          {PASOS.map((paso) => (
            <PasoCard key={paso.numero} {...paso} />
          ))}
        </div>

      </div>
    </section>
  );
}
```

---

## NOTA SOBRE ASSETS

Los assets `SolicitarServicio.svg`, `CoberturaNacional.svg` y `EjecutamosSupervisamos.svg` van en `public/assets/`. Si no existen, el componente debe mostrar el ícono de Lucide correspondiente sin errores. Implementar con una lógica de fallback:

```tsx
{/* Estrategia: intentar cargar asset, y si falla mostrar fallback */}
{/* Opción simple: usar un flag assetExists por paso */}
const assetExists = false; // cambiar a true cuando los assets estén disponibles

{assetExists ? (
  <Image src={iconoSrc} alt={iconoAlt} width={56} height={56} />
) : (
  fallbackIcon  // ícono de Lucide
)}
```

---

## RESTRICCIONES

- ❌ No usar colores fuera de la paleta CargoClick.
- ❌ No agregar botones o CTAs dentro de las cards.
- ✅ Las 3 cards deben tener exactamente la misma altura en desktop (flex + `align-items: stretch`).
- ✅ `hover` en cards: `box-shadow` más pronunciada, sin otros cambios visuales.
- ✅ Server Component.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `npm run type-check` sin errores.
- [ ] Fondo `#F5F7FA`, título centrado "¿Cómo Funciona?" en azul.
- [ ] 3 cards en fila en desktop, stack vertical en mobile.
- [ ] Cada card muestra número, ícono (o fallback), título y descripción.
- [ ] Cards con `border-radius: 8px` y sombra sutil.
- [ ] Hover en card aumenta la sombra.
- [ ] Textos exactamente como están especificados.
