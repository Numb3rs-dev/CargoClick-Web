# 🎨 PROMPT: Mejora Visual de Sistema de Cotización B2B

## 📋 Contexto del Proyecto

**Stack Tecnológico:**
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4.2 con sistema de design tokens configurado
- PostgreSQL + Prisma ORM
- Aplicación tipo wizard/conversacional de 14 pasos

**Ruta principal:** `/cotizar` - Sistema de cotización paso a paso para transporte B2B

**Estado actual:** Funcionalidad completa pero diseño visual plano y básico.

---

## 🎯 Objetivo

Transformar la aplicación de aspecto básico a interfaz **profesional, moderna y atractiva** sin perder la simplicidad del flujo conversacional. Queremos:

1. ✅ Profesionalismo empresarial B2B
2. ✅ Inputs y componentes visuales atractivos
3. ✅ Micro-interacciones y feedback visual
4. ✅ Date picker profesional (calendario visual)
5. ✅ Botones con profundidad y estados claros
6. ✅ Animaciones suaves y transiciones
7. ✅ Sistema consistente en toda la app

---

## 📁 Componentes a Mejorar

### **Componentes Principales (Prioridad Alta)**

1. **DynamicInput.tsx** - 11 tipos de inputs
   - Ubicación: `app/cotizar/components/DynamicInput.tsx`
   - Problema actual: 
     - Date picker nativo HTML5 (muy básico)
     - Inputs planos sin profundidad visual
     - Botones tipo `'buttons'` sin hover effects sofisticados
     - Falta feedback visual al escribir
   - **Solución esperada:**
     - Reemplazar `<input type="date">` por **react-datepicker** (ya instalado)
     - Agregar sombras, gradientes sutiles y estados hover
     - Iconos en inputs (lucide-react)
     - Animaciones de entrada/salida

2. **ConversacionCotizacion.tsx** - Contenedor principal del wizard
   - Ubicación: `app/cotizar/components/ConversacionCotizacion.tsx`
   - Problema actual: Background plano
   - **Solución esperada:**
     - Background con patrón sutil o gradiente
     - Cards elevados con sombras
     - Mejores transiciones entre pasos

3. **LandingPage.tsx** - Pantalla inicial
   - Ubicación: `app/cotizar/components/LandingPage.tsx`
   - **Solución esperada:**
     - Hero section impactante
     - Botón CTA con micro-animación

4. **ProgressIndicator.tsx** - Indicador de progreso (dots)
   - Ubicación: `components/shared/ProgressIndicator.tsx`
   - **Solución esperada:**
     - Animación de progreso suave
     - Conexión visual entre dots
     - Estados más claros

5. **PantallaCompletada.tsx** - Confirmación final
   - **Solución esperada:**
     - Animación de éxito (checkmark animado)
     - Card de confirmación elevado

---

## 🎨 Sistema de Colores Disponible

**Ya configurado en:** `app/globals.css` (líneas 10-32)

```css
/* Colores actuales (personalizables) */
--primary: 220 90% 56%;        /* Azul #3B82F6 */
--secondary: 142 76% 36%;      /* Verde #10B981 */
--accent: 24 95% 53%;          /* Naranja #F59E0B */
--destructive: 0 84% 60%;      /* Rojo #EF4444 */
```

**Usar en código como:**
```tsx
className="bg-primary text-primary-foreground"
className="border-secondary hover:bg-secondary/10"
```

**IMPORTANTE:** Migrar colores hardcoded (`blue-500`, `gray-300`) a variables corporativas.

---

## 📦 Dependencias Disponibles

**Ya instaladas:**
- ✅ `react-datepicker@9.1.0` - NO USADO actualmente
- ✅ `tailwind CSS 4.2`
- ✅ `@tailwindcss/postcss`

**Por instalar (recomendado):**
```bash
npm install lucide-react framer-motion
```

---

## 🎯 Mejoras Específicas por Componente

### **1. Date Picker (Prioridad #1)**

**Archivo:** `app/cotizar/components/DynamicInput.tsx` línea 306-327

**Cambio requerido:**
```tsx
// REEMPLAZAR ESTO:
case 'date':
  return <input type="date" ... />

// POR ESTO:
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

case 'date':
  return (
    <DatePicker
      selected={valor instanceof Date ? valor : new Date()}
      onChange={(date) => setValor(date)}
      dateFormat="dd/MM/yyyy"
      minDate={new Date()}
      placeholderText="Seleccionar fecha"
      className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl 
                focus:border-primary focus:ring-4 focus:ring-primary/20
                text-lg font-medium shadow-sm hover:shadow-md transition-all"
      wrapperClassName="w-full"
      calendarClassName="shadow-2xl border-2 rounded-xl"
      showPopperArrow={false}
    />
  )
```

**Personalizar estilos del calendario:** Agregar CSS custom en `globals.css`

---

### **2. Botones con Profundidad**

**Problema actual:** Botones planos sin estados visuales

**Solución:**
```tsx
// MEJORAR botones tipo 'buttons' (línea 240-260)
<button
  className={`
    group relative overflow-hidden
    px-6 py-4 rounded-xl text-base font-semibold
    transition-all duration-300 min-h-[64px]
    border-2 shadow-md hover:shadow-xl
    transform hover:-translate-y-0.5
    ${valor === opcion.value
      ? 'bg-primary text-primary-foreground border-primary scale-105'
      : 'bg-white text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
    }
  `}
>
  {/* Efecto de brillo al hover */}
  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                   translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
  {opcion.label}
</button>
```

---

### **3. Inputs con Iconos**

**Instalar iconos:**
```bash
npm install lucide-react
```

**Ejemplo de mejora:**
```tsx
import { Mail, Phone, Building, Calendar } from 'lucide-react';

case 'email':
  return (
    <div className="relative">
      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
        type="email"
        className="w-full pl-12 pr-6 py-4 border-2 rounded-xl
                  focus:border-primary focus:ring-4 focus:ring-primary/20
                  text-lg transition-all shadow-sm hover:shadow-md"
        {...props}
      />
    </div>
  )
```

---

### **4. Animaciones con Framer Motion**

**Instalar:**
```bash
npm install framer-motion
```

**Aplicar a ConversacionCotizacion.tsx:**
```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={pasoActual}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {/* Contenido del paso */}
  </motion.div>
</AnimatePresence>
```

---

### **5. Background con Patrón Sutil**

**Agregar a ConversacionCotizacion.tsx:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
  {/* Patrón de dots */}
  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] 
                  [background-size:16px_16px] opacity-40" />
  
  {/* Contenido sobre el patrón */}
  <div className="relative z-10">
    {/* Tu contenido actual */}
  </div>
</div>
```

---

### **6. ProgressIndicator Mejorado**

**Archivo:** `components/shared/ProgressIndicator.tsx`

**Agregar:**
- Línea de conexión animada entre dots
- Números dentro de los dots
- Animación de pulso en el dot activo

```tsx
<div className="flex items-center gap-2">
  {pasos.map((paso, idx) => (
    <>
      {/* Dot */}
      <div className={`
        relative w-10 h-10 rounded-full flex items-center justify-center
        font-semibold text-sm transition-all duration-300
        ${idx <= pasoActual 
          ? 'bg-primary text-primary-foreground shadow-lg scale-110' 
          : 'bg-muted text-muted-foreground'}
        ${idx === pasoActual && 'animate-pulse ring-4 ring-primary/30'}
      `}>
        {idx + 1}
      </div>
      
      {/* Línea de conexión */}
      {idx < pasos.length - 1 && (
        <div className="w-8 h-1 bg-border relative overflow-hidden">
          <div 
            className={`absolute inset-0 bg-primary transition-transform duration-500
                       ${idx < pasoActual ? 'translate-x-0' : 'translate-x-[-100%]'}`}
          />
        </div>
      )}
    </>
  ))}
</div>
```

---

### **7. Toast con Iconos y Animación**

**Archivo:** `components/shared/Toast.tsx`

**Mejorar con:**
- Iconos según tipo (success, error, info)
- Entrada animada desde arriba
- Barra de progreso de auto-cierre

---

## 🎨 Paleta de Colores Sugerida

**Opción 1: Corporativo Profesional** (Recomendada para B2B)
```css
:root {
  --primary: 222 47% 11%;        /* Gris Oscuro/Negro */
  --secondary: 217 91% 60%;      /* Azul Corporativo */
  --accent: 43 96% 56%;          /* Dorado/Amarillo */
  --border: 214 32% 91%;         /* Gris Claro */
}
```

**Opción 2: Moderno y Vibrante**
```css
:root {
  --primary: 258 90% 66%;        /* Morado */
  --secondary: 168 76% 42%;      /* Verde Agua */
  --accent: 31 93% 58%;          /* Naranja */
}
```

---

## ✅ Checklist de Implementación

### **Fase 1: Fundamentos (1-2 horas)**
- [ ] Instalar `lucide-react` y `framer-motion`
- [ ] Implementar react-datepicker en DynamicInput
- [ ] Agregar iconos a inputs (email, phone, etc.)
- [ ] Mejorar botones con sombras y hover effects

### **Fase 2: Profundidad Visual (1 hora)**
- [ ] Background con gradiente/patrón en ConversacionCotizacion
- [ ] Sombras y elevación en cards
- [ ] Border radius consistente usando variables

### **Fase 3: Animaciones (1 hora)**
- [ ] Transiciones entre pasos con Framer Motion
- [ ] Animación de entrada de Toast
- [ ] Progress indicator mejorado
- [ ] Pantalla de completado con checkmark animado

### **Fase 4: Refinamiento (30 min)**
- [ ] Migrar colores hardcoded a variables corporativas
- [ ] Verificar responsive en móvil
- [ ] Loading states mejorados
- [ ] Focus states accesibles

---

## 🎯 Resultado Esperado

**ANTES:** Interfaz funcional pero visualmente plana y básica

**DESPUÉS:** Sistema profesional, moderno y atractivo que:
- ✅ Transmite confianza empresarial
- ✅ Tiene feedback visual en cada interacción
- ✅ Calendario profesional para fechas
- ✅ Botones con profundidad y estados claros
- ✅ Animaciones suaves que mejoran UX
- ✅ Consistencia visual en todos los componentes

---

## 🚀 Comando para Comenzar

```bash
# Instalar dependencias necesarias
npm install lucide-react framer-motion

# Reiniciar servidor
npm run dev
```

---

## 📝 Notas Importantes

1. **Mantener accesibilidad:** No sacrificar ARIA labels ni navegación por teclado
2. **Performance:** Usar `next/dynamic` para componentes pesados si es necesario
3. **Responsive:** Verificar cada cambio en móvil (mobile-first)
4. **Variables CSS:** Priorizar uso de `--primary`, `--secondary` sobre colores fijos
5. **Tipografía:** Ya tienes Inter cargado, úsalo consistente con `font-sans`

---

## 🎨 Referencias Visuales

**Inspiración de interfaces B2B:**
- **Stripe Dashboard** - Limpio y profesional
- **Figma Interface** - Micro-interacciones sutiles
- **Linear App** - Animaciones modernas sin ser excesivas
- **Vercel Dashboard** - Minimalismo elegante

---

## 🔧 Debugging y Solución de Problemas

### **Si react-datepicker no se estiliza:**
```tsx
// Asegúrate de importar los estilos CSS en tu componente
import "react-datepicker/dist/react-datepicker.css";
```

### **Si Framer Motion causa errores de hydration:**
```tsx
// Usa dynamic import con ssr: false
import dynamic from 'next/dynamic';

const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
);
```

### **Si los colores no cambian:**
- Verifica que estés usando `hsl(var(--primary))` y no solo `var(--primary)`
- Reinicia el servidor de desarrollo después de cambiar `globals.css`
- Limpia la caché: `rm -rf .next && npm run dev`

---

## 📊 Comparación Visual Esperada

### **Inputs Actuales vs Mejorados**

**Actual:**
```tsx
<input type="text" className="border rounded px-4 py-2" />
```

**Mejorado:**
```tsx
<div className="relative group">
  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 
                       text-muted-foreground group-focus-within:text-primary 
                       transition-colors" />
  <input 
    type="text" 
    className="w-full pl-12 pr-6 py-4 border-2 border-border rounded-xl
              focus:border-primary focus:ring-4 focus:ring-primary/20
              shadow-sm hover:shadow-md transition-all duration-200
              text-lg font-medium"
  />
</div>
```

### **Botones Actuales vs Mejorados**

**Actual:**
```tsx
<button className="bg-blue-500 text-white px-6 py-3 rounded">
  Continuar
</button>
```

**Mejorado:**
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="bg-primary text-primary-foreground px-8 py-4 rounded-xl
            shadow-lg hover:shadow-xl transition-all duration-300
            font-semibold text-lg relative overflow-hidden group"
>
  <span className="relative z-10 flex items-center gap-2">
    Continuar
    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </span>
  <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 
                   opacity-0 group-hover:opacity-100 transition-opacity" />
</motion.button>
```

---

## 🎯 Implementación Priorizada

**Si solo tienes 30 minutos:**
1. ✅ react-datepicker (mayor impacto visual)
2. ✅ Mejorar botones con sombras
3. ✅ Background con gradiente

**Si tienes 1 hora:**
- Todo lo anterior +
4. ✅ Iconos en inputs con lucide-react
5. ✅ ProgressIndicator mejorado

**Si tienes 2+ horas:**
- Todo lo anterior +
6. ✅ Framer Motion para animaciones
7. ✅ Toast mejorado
8. ✅ Pantalla de completado animada

---

## 🔗 Links Útiles

- **react-datepicker docs:** https://reactdatepicker.com/
- **Lucide React icons:** https://lucide.dev/guide/packages/lucide-react
- **Framer Motion docs:** https://www.framer.com/motion/
- **Tailwind CSS HSL converter:** https://tailwind.simeongriggs.dev/
- **CSS Gradient Generator:** https://cssgradient.io/
- **Pattern Generator:** https://pattern.monster/

---

**✨ Este prompt está listo para implementar. Comienza con la Fase 1 e itera progresivamente.**
