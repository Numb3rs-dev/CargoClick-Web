# PROMPT PARA TRANSFORMACIÓN: CHAT → WIZARD NAVEGACIÓN POR PÁGINAS

## 🎯 OBJETIVO
Transformar el flujo conversacional de chat actual a un sistema de navegación tipo wizard página por página (estilo Mudango), donde cada pregunta ocupa una página completa y el usuario navega con botones "Continuar" entre pasos.

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### Arquitectura Existente:
- **Framework**: Next.js 15 + React 19 + TypeScript
- **Estilo**: Chat conversacional con burbujas (tipo WhatsApp)
- **Flujo**: 14 pasos progresivos con historial completo visible
- **Guardado**: Progressive saving (POST inicial, PATCH por paso, PUT final)
- **Componentes principales**:
  - `app/cotizar/components/ConversacionCotizacion.tsx` (152 líneas) - Componente principal
  - `app/cotizar/components/ChatContainer.tsx` - Wrapper del chat
  - `app/cotizar/components/ChatMessages.tsx` - Renderiza todo el historial
  - `components/shared/BotMessage.tsx` - Burbuja del bot (izquierda, gris)
  - `components/shared/UserMessage.tsx` - Burbuja del usuario (derecha, azul)
  - `app/cotizar/components/DynamicInput.tsx` (377 líneas) - Maneja 10 tipos de input
  - `app/cotizar/hooks/useConversacion.ts` (492 líneas) - Motor conversacional completo

### Flujo Actual (14 pasos):
1. **Paso 0**: Nombre empresa (POST crea solicitud)
2. **Paso 1**: Nombre contacto
3. **Paso 2**: Email
4. **Paso 3**: Teléfono
5. **Paso 4**: Tipo servicio (URBANO/NACIONAL) - radio buttons
6. **Paso 5**: Ciudad origen - select (CONDICIONAL si NACIONAL)
7. **Paso 6**: Dirección origen - text (CONDICIONAL si URBANO)
8. **Paso 7**: Ciudad destino - select (CONDICIONAL si NACIONAL)
9. **Paso 8**: Tipo carga - buttons (3 opciones)
10. **Paso 9**: Peso kg - number
11. **Paso 10**: Dimensiones - textarea
12. **Paso 11**: Valor asegurado - number
13. **Paso 12**: Condiciones cargue - checkbox múltiple
14. **Paso 13**: Fecha requerida - date

### Características Actuales a MANTENER:
✅ **Lógica de negocio completa en `useConversacion.ts`:**
- `crearSolicitudInicial()` - POST /api/solicitudes
- `actualizarSolicitud()` - PATCH /api/solicitudes/[id]
- `completarSolicitud()` - PATCH final con estado COMPLETADA
- Limpieza de texto conversacional (`limpiarRespuestaConversacional`)
- Interpolación de variables en preguntas
- Condicionales (pasos que aparecen según respuestas previas)
- Cálculo de progreso
- Manejo de errores no bloqueantes

✅ **Validaciones Zod** en `app/cotizar/config/pasos.ts`

✅ **10 tipos de input** en `DynamicInput.tsx`:
- text, email, phone, select, radio, buttons, number, textarea, checkbox, date

✅ **API backend funcional**:
- `app/api/solicitudes/route.ts` (GET all, POST)
- `app/api/solicitudes/[id]/route.ts` (GET, PATCH)

✅ **Base de datos Prisma**:
- Modelo `Solicitud` con 15 campos + timestamps
- Migraciones existentes

---

## 🎨 DISEÑO OBJETIVO (ESTILO MUDANGO)

### Comportamiento Deseado:

#### **Página 1 - Landing/Bienvenida:**
```
┌─────────────────────────────────────┐
│                                     │
│       👋 ¡Hola!                    │
│                                     │
│   Vamos a conseguir un buen        │
│   precio para tu transporte        │
│                                     │
│         [COMENCEMOS] ───────────►   │
│                                     │
└─────────────────────────────────────┘
```

#### **Página 2 - Primera Pregunta:**
```
┌─────────────────────────────────────┐
│  ◄ Atrás          [●○○○○○○] 1/14    │
│                                     │
│   ¿Cuál es el nombre                │
│   de tu empresa?                    │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ [Input aquí]                │  │
│   └─────────────────────────────┘  │
│                                     │
│         [CONTINUAR] ───────────►    │
│                                     │
└─────────────────────────────────────┘
```

#### **Página 3 - Segunda Pregunta:**
```
┌─────────────────────────────────────┐
│  ◄ Atrás          [●●○○○○○] 2/14    │
│                                     │
│   Perfecto. ¿Cuál es tu            │
│   nombre completo?                  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ [Input aquí]                │  │
│   └─────────────────────────────┘  │
│                                     │
│         [CONTINUAR] ───────────►    │
│                                     │
└─────────────────────────────────────┘
```

### Características del Nuevo Diseño:

**UX/UI:**
- ✅ **Una pregunta por página** (limpia, sin distracciones)
- ✅ **Sin historial visible** (no burbujas de chat)
- ✅ **Navegación con botones**:
  - "◄ Atrás" (arriba izquierda) - volver al paso anterior
  - "CONTINUAR ►" (grande, centrado abajo) - avanzar
  - "COMENCEMOS" en landing page
- ✅ **Indicador de progreso**: Dots `[●●●○○○○]` + "3/14" en header
- ✅ **Transiciones suaves** entre páginas (fade in/out)
- ✅ **Input centrado** debajo de la pregunta
- ✅ **Auto-guardado silencioso** (sin feedback visual invasivo)
- ✅ **Mobile-first responsive**

**Estructura de Página:**
```
Header:
  ← Atrás (izquierda) | Progreso visual (centro) | X (derecha, opcional)

Body (centrado vertical y horizontal):
  Pregunta (texto grande, legible)
  Input (según tipo de paso)

Footer:
  Botón CONTINUAR (grande, primario, centrado)
```

---

## 🔧 TRANSFORMACIONES REQUERIDAS

### 1. **COMPONENTES A ELIMINAR** ❌

Elimina completamente estos archivos (ya no se usan):

```
components/shared/BotMessage.tsx          → Ya no hay burbujas
components/shared/UserMessage.tsx         → Ya no hay burbujas
app/cotizar/components/ChatContainer.tsx  → Ya no hay contenedor de chat
app/cotizar/components/ChatMessages.tsx   → Ya no hay historial visible
```

### 2. **COMPONENTES A MODIFICAR** ✏️

#### **A. `app/cotizar/components/ConversacionCotizacion.tsx`**

**Cambios:**
- ❌ Eliminar imports de `ChatContainer`, `ChatMessages`, `BotMessage`, `UserMessage`
- ❌ Eliminar renderizado de historial completo
- ✅ Renderizar SOLO el paso actual en pantalla completa
- ✅ Agregar botón "◄ Atrás" (solo si pasoActual > 0)
- ✅ Agregar botón "CONTINUAR ►" (reemplaza el submit del form)
- ✅ Agregar página de bienvenida (paso -1 o landing)
- ✅ Mejorar indicador de progreso (dots + fracción)
- ✅ Centrar contenido vertical y horizontalmente
- ✅ Agregar transiciones entre pasos (animate-fadeIn)

**Estructura Nueva:**
```tsx
export function ConversacionCotizacion() {
  const { 
    pasoActual, 
    siguientePaso, 
    pasoAnterior,
    pasoConfig,
    // ... resto
  } = useConversacion();

  // Landing page (no iniciado)
  if (pasoActual === -1) {
    return <LandingPage onStart={iniciarFormulario} />;
  }

  // Formulario completado
  if (pasoActual >= TOTAL_PASOS) {
    return <PantallaCompletada solicitudId={solicitudId} />;
  }

  // Paso actual (1 pregunta por página)
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header: navegación + progreso */}
      <header>
        {pasoActual > 0 && (
          <button onClick={pasoAnterior}>◄ Atrás</button>
        )}
        <ProgressIndicator dots={true} actual={pasoActual} total={TOTAL_PASOS} />
      </header>

      {/* Body: pregunta + input (centrado) */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full px-4">
          {/* Pregunta */}
          <h1 className="text-3xl font-bold mb-8 text-center animate-fadeIn">
            {pasoConfig.pregunta}
          </h1>

          {/* Input */}
          <div className="animate-fadeIn">
            <DynamicInput
              config={pasoConfig}
              onSubmit={siguientePaso}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer: botón continuar */}
      <footer className="p-4">
        <button 
          onClick={handleContinuar} 
          className="btn-primary w-full max-w-md mx-auto"
        >
          CONTINUAR ►
        </button>
      </footer>
    </div>
  );
}
```

#### **B. `app/cotizar/hooks/useConversacion.ts`**

**Cambios:**
- ✅ **MANTENER** toda la lógica de guardado progresivo
- ✅ **MANTENER** funciones: `crearSolicitudInicial`, `actualizarSolicitud`, `completarSolicitud`
- ❌ **ELIMINAR** gestión de historial de mensajes:
  - Eliminar `historialMensajes: Message[]` del state
  - Eliminar `agregarMensaje()` function
  - Eliminar imports de `Message` type
- ✅ **AGREGAR** estado para landing page:
  - Iniciar `pasoActual` en `-1` (landing) en vez de `0`
  - Función `iniciarFormulario()` que cambia a paso 0
- ✅ **MANTENER** `pasoAnterior()` para navegación atrás
- ✅ **SIMPLIFICAR** `siguientePaso()`:
  - Ya no necesita agregar mensajes al historial
  - Solo: validar → guardar BD → avanzar paso

**Estado Nuevo:**
```typescript
interface ConversacionState {
  pasoActual: number;        // Inicia en -1 (landing)
  solicitudId: string | null;
  isLoading: boolean;
  error: string | null;
  datosForm: DatosFormulario;
  // ❌ Ya NO: historialMensajes
}
```

#### **C. `app/cotizar/components/DynamicInput.tsx`**

**Cambios:**
- ✅ **MANTENER** todos los 10 tipos de input
- ✅ **MANTENER** validación Zod
- ✅ **MANTENER** estilos Tailwind
- ❌ **ELIMINAR** el `<form>` wrapper y botón de submit interno
- ✅ Input controla su valor pero no hace submit
- ✅ Exponer `valor` actual mediante callback o ref
- ✅ Botón "CONTINUAR" del componente padre trigger la lógica de submit

**Alternativa:** Mantener el form pero escuchar submit desde el padre con evento.

#### **D. `components/shared/ProgressIndicator.tsx`**

**Cambios:**
- ✅ Agregar soporte para estilo "dots" (●●●○○○○)
- ✅ Mostrar fracción "3/14"
- ✅ Mantener barra de progreso actual como alternativa

```tsx
interface ProgressIndicatorProps {
  pasoActual: number;
  totalPasos: number;
  variant?: 'bar' | 'dots'; // Nuevo prop
}
```

#### **E. `app/globals.css`**

**Cambios:**
- ❌ **ELIMINAR** clases de burbujas de chat:
  - `.bot-message`
  - `.user-message`
  - `.chat-container`
- ✅ **MANTENER** animaciones:
  - `fadeInUp`, `fadeInLeft`, etc.
  - Agregar `fadeIn` general para transiciones de página
- ✅ **AGREGAR** utilidades para wizard:
  - Centrado vertical/horizontal
  - Estilos de botones grandes
  - Contenedores responsive

### 3. **COMPONENTES NUEVOS A CREAR** ✨

#### **A. `app/cotizar/components/LandingPage.tsx`**
```tsx
interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 animate-fadeIn">
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-4xl font-bold">¡Hola!</h1>
        <p className="text-xl text-gray-600">
          Vamos a conseguir un buen precio<br />
          para tu servicio de transporte
        </p>
        <button 
          onClick={onStart}
          className="btn-primary text-lg px-8 py-4 mt-8"
        >
          COMENCEMOS ►
        </button>
      </div>
    </div>
  );
}
```

#### **B. `app/cotizar/components/PantallaCompletada.tsx`**
(Extraer del componente principal para modularidad)

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Limpieza (30 min)
- [ ] Eliminar `BotMessage.tsx`
- [ ] Eliminar `UserMessage.tsx`
- [ ] Eliminar `ChatContainer.tsx`
- [ ] Eliminar `ChatMessages.tsx`
- [ ] Eliminar clases `.bot-message`, `.user-message`, `.chat-container` de globals.css
- [ ] Eliminar imports de estos componentes en `ConversacionCotizacion.tsx`

### Fase 2: Refactor `useConversacion.ts` (45 min)
- [ ] Cambiar `pasoActual` inicial a `-1`
- [ ] Eliminar `historialMensajes` del state
- [ ] Eliminar función `agregarMensaje()`
- [ ] Eliminar imports de `Message` type
- [ ] Simplificar `siguientePaso()` (sin agregar al historial)
- [ ] Agregar función `iniciarFormulario()`
- [ ] Verificar que `pasoAnterior()` funcione
- [ ] Mantener intactas: `crearSolicitudInicial`, `actualizarSolicitud`, `completarSolicitud`

### Fase 3: Crear componentes nuevos (1 hora)
- [ ] Crear `LandingPage.tsx` con diseño de bienvenida
- [ ] Crear `PantallaCompletada.tsx` (extraído del componente principal)
- [ ] Actualizar `ProgressIndicator.tsx` con variante "dots"

### Fase 4: Rediseñar `ConversacionCotizacion.tsx` (1-2 horas)
- [ ] Layout de página completa (min-h-screen flex flex-col)
- [ ] Header: botón Atrás + ProgressIndicator dots
- [ ] Main: pregunta centrada + DynamicInput
- [ ] Footer: botón CONTINUAR grande
- [ ] Renderizar LandingPage si paso === -1
- [ ] Renderizar PantallaCompletada si paso >= TOTAL_PASOS
- [ ] Agregar transiciones animate-fadeIn entre pasos
- [ ] Conectar onClick de CONTINUAR con validación + siguientePaso

### Fase 5: Ajustar `DynamicInput.tsx` (30 min)
- [ ] Opciones:
  - **Opción A**: Eliminar form interno, exponer valor mediante callback
  - **Opción B**: Mantener form pero controlar submit desde padre
- [ ] Asegurar que botón CONTINUAR puede trigger validación

### Fase 6: Estilos finales (30 min)
- [ ] Agregar clase `.btn-primary` mejorada en globals.css
- [ ] Agregar animación `fadeIn` para transiciones
- [ ] Ajustar tamaños de texto (pregunta: text-3xl, inputs: text-lg)
- [ ] Espaciados generosos (mb-8, py-4)
- [ ] Mobile-first responsive (media queries si es necesario)

### Fase 7: Testing (30 min)
- [ ] Flujo completo desde landing hasta completado
- [ ] Navegación atrás funciona correctamente
- [ ] Guardado progresivo funciona (verificar en BD)
- [ ] Validaciones Zod funcionan
- [ ] Condicionales (pasos 5/6 según URBANO/NACIONAL)
- [ ] TypeScript sin errores: `npm run type-check`
- [ ] Responsive en mobile

---

## ⚠️ ADVERTENCIAS IMPORTANTES

1. **NO TOCAR EL BACKEND**: Las APIs funcionan perfecto, no modificar nada en:
   - `app/api/solicitudes/**`
   - `lib/repositories/solicitudRepository.ts`
   - `lib/services/solicitudService.ts`
   - `prisma/schema.prisma`

2. **NO CAMBIAR LÓGICA DE GUARDADO**: El progressive saving (POST → PATCH → PATCH...) es crítico.

3. **MANTENER VALIDACIONES**: Todos los esquemas Zod en `pasos.ts` deben permanecer.

4. **PRESERVAR CONDICIONALES**: Los pasos 5/6/7 tienen lógica condicional según tipo de servicio.

5. **COMPATIBILIDAD NEXT.JS 15**: Los params de API routes son async (Promise).

6. **TIPOS TYPESCRIPT**: Actualizar imports/types donde sea necesario pero mantener tipado estricto.

---

## 📝 RESULTADO ESPERADO

### Antes (actual):
```
Chat con burbujas:
┌───────────────────────────────────┐
│ Bot: ¿Nombre empresa?             │
│                         User: ACME│
│ Bot: ¿Contacto?                   │
│                         User: Juan│
│ Bot: ¿Email?                      │
│ [Input activo aquí]               │
└───────────────────────────────────┘
```

### Después (objetivo):
```
Wizard página por página:

Landing:
┌───────────────────────────────────┐
│                                   │
│       👋 ¡Hola!                  │
│   Vamos a conseguir un buen       │
│   precio para tu transporte       │
│                                   │
│      [COMENCEMOS] ►               │
└───────────────────────────────────┘

Paso 1:
┌───────────────────────────────────┐
│ ◄ Atrás      [●○○○○] 1/14         │
│                                   │
│   ¿Cuál es el nombre              │
│   de tu empresa?                  │
│                                   │
│   [Input empresa]                 │
│                                   │
│      [CONTINUAR] ►                │
└───────────────────────────────────┘

Paso 2:
┌───────────────────────────────────┐
│ ◄ Atrás      [●●○○○] 2/14         │
│                                   │
│   Perfecto. ¿Cuál es tu          │
│   nombre completo?                │
│                                   │
│   [Input contacto]                │
│                                   │
│      [CONTINUAR] ►                │
└───────────────────────────────────┘
```

---

## 🚀 IMPLEMENTACIÓN

Por favor, realiza todos los cambios descritos arriba siguiendo el checklist. Prioriza:
1. Limpieza de código innecesario
2. Funcionalidad sobre estilos perfeccionistas
3. Mantener toda la lógica de negocio intacta
4. Testing frecuente durante desarrollo

**Tiempo estimado total: 4-6 horas**

Cuando termines, el proyecto debe:
- ✅ Navegar como Mudango (página por página)
- ✅ Guardar progresivamente en BD (sin cambios)
- ✅ Tener código limpio (sin componentes de chat)
- ✅ Pasar TypeScript check sin errores
- ✅ Ser responsive y accesible
