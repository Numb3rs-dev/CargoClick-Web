# PROMPT 04: COMPONENTES DE INPUT INDIVIDUALES

## CONTEXTO DE NEGOCIO
Cada tipo de pregunta requiere un componente de input especializado que:
- Proporcione la mejor UX para ese tipo de dato
- Funcione perfectamente en móvil (touch-friendly)
- Se integre con React Hook Form automáticamente
- Muestre validaciones claras

**Valor de negocio:** Reducir errores de captura y mejorar tasa de completado mediante inputs optimizados por tipo de dato.

## ESPECIFICACIÓN FUNCIONAL

### Requisitos Generales de TODOS los Inputs

1. **Integración React Hook Form:**
   - Usar `register()` o `Controller` según complejidad
   - Mostrar errores de `formState.errors`
   - Marcar visualmente cuando hay error (borde rojo)
   - Marcar visualmente cuando es válido (borde verde opcional)

2. **Accesibilidad:**
   - Label asociado con `htmlFor` / `id`
   - ARIA labels donde aplique
   - Navegación por teclado funcional
   - Contraste mínimo WCAG AA (4.5:1)

3. **Mobile-First:**
   - Altura mínima táctil: 44px
   - Espaciado entre elementos: 8px
   - Tamaño de fuente legible: 16px+ (previene zoom en iOS)
   - Teclado apropiado (`inputMode`, `type`)

4. **Estados Visuales:**
   - Default (idle)
   - Focus (usuario editando)
   - Error (validación fallida)
   - Disabled (loading o paso completado)

## COMPONENTES A IMPLEMENTAR

### 1. TextInput (Texto simple)

**Uso:** Pasos 0, 1, 5, 6 (empresa, contacto, origen, destino)

**Props:**
```typescript
interface TextInputProps {
  name: string;              // Nombre del campo en formulario
  label: string;             // Label visible
  placeholder?: string;      // Placeholder del input
  error?: string;            // Mensaje de error (de React Hook Form)
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;       // Auto-focus al aparecer
}
```

**Especificación:**
- Tipo: `<input type="text" />`
- Auto-focus: Primera vez que aparece un input de texto
- Max length visual: Mostrar "X/200" si tiene límite
- Validación: En tiempo real (onChange)
- Borde rojo si error, verde si válido

**Ejemplo visual:**
```
┌─────────────────────────────────────┐
│ Nombre de empresa                   │
├─────────────────────────────────────┤
│ ACME Transport                      │ ← Input
│                                     │
│ 14/200 caracteres                   │ ← Counter
└─────────────────────────────────────┘
```

### 2. EmailInput (Email)

**Uso:** Paso 2 (email)

**Props:** Iguales a `TextInput`

**Especificación:**
- Tipo: `<input type="email" />`
- inputMode: `email` (teclado móvil con @ y .)
- autoComplete: `email`
- Validación: Formato email válido
- Icono: 📧 dentro del input (lado izquierdo)

**Validación visual:**
- Mientras escribe: Sin validar
- Al salir del campo (onBlur): Validar formato
- Si inválido: Borde rojo + mensaje "Email inválido"

### 3. PhoneInput (Teléfono)

**Uso:** Paso 3 (teléfono)

**Props:** Iguales a `TextInput` + `countryCode`

**Especificación:**
- Tipo: `<input type="tel" />`
- inputMode: `tel` (teclado numérico en móvil)
- Formato: +57 300 123 4567 (separadores automáticos)
- Prefijo: "+57" por defecto (Colombia)
- Selector de país: Dropdown opcional (Fase 2)
- Icono: 📞 dentro del input

**Funcionalidad especial:**
- Formateo automático mientras escribe
- Permitir solo números (quitar letras automáticamente)
- Máximo 15 dígitos

**Ejemplo:**
```
┌─────────────────────────────────────┐
│ Teléfono                            │
├─────────────────────────────────────┤
│ 📞 +57 │ 300 123 4567               │
│        └─ Flag  └─ Input             │
└─────────────────────────────────────┘
```

### 4. RadioButtons (Selección única)

**Uso:** Paso 4 (tipo de servicio: Urbano / Nacional)

**Props:**
```typescript
interface RadioButtonsProps {
  name: string;
  label: string;
  options: Array<{ label: string; value: string; icon?: string }>;
  error?: string;
  disabled?: boolean;
}
```

**Especificación:**
- Diseño: Botones grandes (tipo cards)
- Layout: Vertical en móvil, horizontal en desktop
- Selección: Click en todo el card (no solo radio)
- Visual: 
  - No seleccionado: Borde gris, fondo blanco
  - Seleccionado: Borde primario, fondo primario suave
  - Hover: Sombra ligera

**Ejemplo visual:**
```
┌─────────────────────────────────────┐
│ 🏙️  Urbano                          │ ← Card clickeable
│   Dentro de la ciudad               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🌍  Nacional                  ✓     │ ← Seleccionado
│   Entre ciudades                    │
└─────────────────────────────────────┘
```

### 5. ButtonGroup (Selección visual única)

**Uso:** Paso 7 (tipo de carga: Mercancía / Maquinaria / Muebles)

**Props:** Iguales a `RadioButtons`

**Especificación:**
- Similar a RadioButtons pero más visual
- Cards más grandes con iconos prominentes
- Layout: Grid 1 columna móvil, 3 columnas desktop
- Animación: Escala al seleccionar (scale 1.02)
- Icono grande centrado + texto debajo

**Ejemplo:**
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│    📦    │ │    ⚙️    │ │    🪑    │
│          │ │          │ │          │
│Mercancía │ │Maquinaria│ │ Muebles  │
└──────────┘ └──────────┘ └──────────┘
```

### 6. NumberInput (Numérico)

**Uso:** Pasos 8, 10 (peso, valor asegurado)

**Props:**
```typescript
interface NumberInputProps {
  name: string;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;        // Ej: "$"
  suffix?: string;        // Ej: "kg"
  error?: string;
  disabled?: boolean;
}
```

**Especificación:**
- Tipo: `<input type="number" />`
- inputMode: `decimal` (teclado numérico con .)
- Formateo: Separadores de miles (1,000 / 1.000 según locale)
- Prefijo/Sufijo: Visualmente dentro del input pero no editables
- Validación: min/max en tiempo real

**Paso 8 (Peso) - Especial:**
- Selector de unidad: kg / toneladas (dropdown o toggle)
- Conversión automática: 1 tonelada = 1,000 kg
- Guarda siempre en kg en BD

**Ejemplo:**
```
┌─────────────────────────────────────┐
│ Peso aproximado                     │
├─────────────────────────────────────┤
│ │ 1,500  │ ▼ kg    │                │
│ └─ Input   └─ Unit  │                │
│                                     │
│ = 1.5 toneladas                     │ ← Helper text
└─────────────────────────────────────┘
```

### 7. Textarea (Texto multi-línea)

**Uso:** Paso 9 (dimensiones)

**Props:**
```typescript
interface TextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
}
```

**Especificación:**
- Elemento: `<textarea>`
- Altura: Auto-expandible (start 3 lines, max 10 lines)
- Counter: "X/500 caracteres"
- Ejemplos: Mostrar ejemplos de formato debajo
  - "Ej: 200 × 150 × 100 cm"
  - "Ej: 2 metros de largo, 1.5 de alto"

**Ejemplo:**
```
┌─────────────────────────────────────┐
│ Dimensiones de la carga             │
├─────────────────────────────────────┤
│ 200 × 150 × 100                     │
│                                     │ ← Textarea
│                                     │
├─────────────────────────────────────┤
│ 15/500 caracteres                   │
│ Ej: "200×150×100 cm" o "2m × 1.5m" │
└─────────────────────────────────────┘
```

### 8. CheckboxGroup (Selección múltiple)

**Uso:** Paso 11 (condiciones de cargue)

**Props:**
```typescript
interface CheckboxGroupProps {
  name: string;
  label: string;
  options: Array<{ label: string; value: string; icon?: string }>;
  minSelections?: number;
  maxSelections?: number;
  error?: string;
  disabled?: boolean;
}
```

**Especificación:**
- Layout: Lista vertical de opciones
- Diseño: Checkbox custom + label clickeable
- Card: Cada opción es un card clickeable
- Visual:
  - No seleccionado: Borde gris, checkbox vacío
  - Seleccionado: Borde primario, checkbox con ✓ primario
- Validación: Mínimo 1 selección

**Ejemplo:**
```
┌─────────────────────────────────────┐
│ ☐  Muelle disponible                │ ← Card clickeable
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ☑  Montacargas disponible           │ ← Seleccionado
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ☑  Cargue manual                    │ ← Seleccionado
└─────────────────────────────────────┘

Selecciona al menos 1 opción
```

### 9. DatePicker (Selección de fecha)

**Uso:** Paso 12 (fecha requerida)

**Props:**
```typescript
interface DatePickerProps {
  name: string;
  label: string;
  minDate?: Date;
  maxDate?: Date;
  excludeDates?: Date[];
  error?: string;
  disabled?: boolean;
}
```

**Especificación:**
- Librería: `react-datepicker` o componente personalizado
- Mobile: Input nativo `type="date"` (mejor UX móvil)
- Desktop: Calendar dropdown
- Restricción: minDate = hoy (no fechas pasadas)
- Formato: DD/MM/YYYY (localizado)
- Icono: 📅 al lado del input

**Ejemplo Desktop:**
```
┌─────────────────────────────────────┐
│ Fecha requerida                     │
├─────────────────────────────────────┤
│ 📅 │ 15/03/2026  │ ▼               │
│    └─ Input        └─ Trigger        │
└─────────────────────────────────────┘
       ↓ Click
┌─────────────────────────────────────┐
│     Marzo 2026          ◀  ▶        │
│ L  M  M  J  V  S  D                 │
│ 1  2  3  4  5  6  7                 │
│ 8  9  10 11 12 13 14                │
│ [15] 16 17 18 19 20 21 ← Seleccionado
│ 22 23 24 25 26 27 28                │
│ 29 30 31                            │
└─────────────────────────────────────┘
```

**Ejemplo Mobile:**
- Usa input nativo: `<input type="date" />`
- Abre date picker nativo del OS
- Mejor UX en dispositivos táctiles

## ESTRUCTURA DE COMPONENTES

### Ubicación de Archivos

```
app/cotizar/components/inputs/
├── TextInput.tsx
├── EmailInput.tsx
├── PhoneInput.tsx
├── RadioButtons.tsx
├── ButtonGroup.tsx
├── NumberInput.tsx
├── Textarea.tsx
├── CheckboxGroup.tsx
├── DatePicker.tsx
├── index.ts               # Re-exports
└── shared/
    ├── InputWrapper.tsx   # Componente wrapper común
    └── ErrorMessage.tsx   # Componente de error
```

### InputWrapper (Componente Base)

**Propósito:** Wrapper común para todos los inputs que incluye:
- Label
- Input (children)
- Mensaje de error
- Helper text opcional

```typescript
interface InputWrapperProps {
  name: string;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function InputWrapper({ name, label, error, helperText, required, children }: InputWrapperProps) {
  return (
    <div className="w-full space-y-2">
      {/* Label */}
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {/* Input */}
      <div className="relative">
        {children}
      </div>
      
      {/* Helper text */}
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      
      {/* Error message */}
      {error && (
        <ErrorMessage message={error} />
      )}
    </div>
  );
}
```

### ErrorMessage (Componente de Error)

```typescript
interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center gap-1 text-destructive text-sm animate-fadeInUp">
      <span className="text-lg">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
```

## INTEGRACIÓN CON REACT HOOK FORM

### Ejemplo: TextInput con React Hook Form

```typescript
import { useFormContext } from 'react-hook-form';
import { InputWrapper } from './shared/InputWrapper';

export function TextInput({ 
  name, 
  label, 
  placeholder, 
  maxLength, 
  autoFocus 
}: TextInputProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;
  
  return (
    <InputWrapper 
      name={name} 
      label={label} 
      error={error}
      helperText={maxLength ? `Máximo ${maxLength} caracteres` : undefined}
    >
      <input
        id={name}
        type="text"
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={`
          w-full px-4 py-3 rounded-lg border
          ${error ? 'border-destructive' : 'border-input'}
          focus:outline-none focus:ring-2 focus:ring-ring
          disabled:opacity-50 disabled:cursor-not-allowed
          text-base
        `}
        {...register(name)}
      />
    </InputWrapper>
  );
}
```

## ESTILOS COMPARTIDOS (Tailwind Classes)

### Input Base
```
w-full px-4 py-3 rounded-lg border border-input
focus:outline-none focus:ring-2 focus:ring-ring
disabled:opacity-50 disabled:cursor-not-allowed
text-base font-normal
bg-background text-foreground
```

### Card Selectable (Radio/Checkbox)
```
w-full p-4 rounded-lg border-2 cursor-pointer
transition-all duration-200
hover:shadow-md
border-input bg-background
data-[selected=true]:border-primary data-[selected=true]:bg-primary/10
```

### Button Large (ButtonGroup)
```
flex flex-col items-center justify-center
p-6 rounded-xl border-2 cursor-pointer
transition-all duration-200
hover:scale-102 hover:shadow-lg
border-input bg-background
data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 data-[selected=true]:scale-105
```

## CRITERIOS DE ACEPTACIÓN

### ✅ Por Componente
- [ ] Integración con React Hook Form funciona
- [ ] Validación en tiempo real (onChange o onBlur)
- [ ] Errores mostrados claramente debajo del input
- [ ] Estados visuales (default, focus, error, disabled)
- [ ] Accesible con teclado (Tab para navegar, Enter para seleccionar)
- [ ] Mobile-friendly (altura > 44px, teclado apropiado)

### ✅ General
- [ ] Todos los 9 tipos de input implementados
- [ ] InputWrapper reutilizable funciona para todos
- [ ] ErrorMessage consistente en todos
- [ ] Estilos desde sistema de tokens (no hardcoded)
- [ ] Auto-focus en primer input funciona

## PROHIBICIONES

### ❌ NO Hacer
- NO usar librerías de UI completas (Material-UI, Ant Design)
- NO hardcodear colores (usar variables CSS)
- NO inputs pequeños en móvil (mín 44px altura)
- NO validar solo en cliente (backend también valida)
- NO mostrar múltiples errores simultáneos (solo el primero)

### ✅ SÍ Hacer
- Usar componentes base de shadcn/ui si están disponibles
- Personalizar con Tailwind y variables CSS
- Teclados nativos apropiados (type, inputMode)
- Auto-complete donde aplique (email, name)
- Mostrar feedback visual inmediato

## DEFINICIÓN DE "TERMINADO"

Este prompt está completo cuando:
1. **9 componentes de input** están especificados
2. **Props interfaces** están definidas
3. **InputWrapper** compartido está diseñado
4. **Integración React Hook Form** está clara
5. **Estilos Tailwind** están documentados
6. **Mobile-first UX** está garantizada

---

**¿Los componentes de input están suficientemente especificados? ¿Hay algún tipo de input o comportamiento que requiera más detalle?**
