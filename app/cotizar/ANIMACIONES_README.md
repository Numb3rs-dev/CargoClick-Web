# 🎨 Sistema de Animaciones y Transiciones - Guía de Uso

## 📋 Resumen

Sistema completo de animaciones CSS para la experiencia conversacional. Todas las animaciones están optimizadas para **performance** (60fps), **accesibilidad** (`prefers-reduced-motion`), y **UX suave**.

---

## 🎯 Componentes de Animación Disponibles

### 1. TypingIndicator
Indicador de "bot escribiendo..." con tres puntos animados.

```tsx
import { TypingIndicator } from '@/components/shared';

// En tu componente conversacional
{isTyping && <TypingIndicator />}
```

**Cuándo usar:**
- Después de que usuario envía respuesta
- Antes de mostrar siguiente pregunta del bot
- Duración típica: 500-800ms

---

### 2. LoadingOverlay
Overlay modal con spinner para operaciones críticas.

```tsx
import { LoadingOverlay } from '@/components/shared';

<LoadingOverlay 
  show={isCreatingSolicitud} 
  message="Creando tu solicitud..." 
/>
```

**Cuándo usar:**
- Creación inicial de solicitud (paso 0)
- Envío final de formulario (paso 12)
- Operaciones que tardan >2 segundos

**Props:**
- `show: boolean` - Si mostrar o no el overlay
- `message: string` - Mensaje descriptivo de la operación

---

### 3. Toast
Notificación temporal de confirmación/error.

```tsx
import { Toast } from '@/components/shared';
import { useState } from 'react';

function MyComponent() {
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const showSuccessToast = () => {
    setToast({
      show: true,
      type: 'success',
      message: 'Cambios guardados correctamente'
    });
  };

  return (
    <>
      <button onClick={showSuccessToast}>Guardar</button>
      
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </>
  );
}
```

**Props:**
- `type: 'success' | 'error' | 'info'` - Tipo de notificación
- `message: string` - Texto a mostrar
- `onClose: () => void` - Callback cuando se cierra
- `duration?: number` - Milisegundos antes de auto-cerrar (default: 3000)

---

### 4. BotMessage (ya existente)
Burbuja de pregunta del bot con animación `fadeInUp`.

```tsx
import { BotMessage } from '@/components/shared';

<BotMessage texto="¿Cuál es el nombre de tu empresa?" />
```

**Animación automática:** fadeInUp (300ms)

---

### 5. UserMessage (ya existente)
Burbuja de respuesta del usuario con animación `fadeInLeft`.

```tsx
import { UserMessage } from '@/components/shared';

<UserMessage texto="ACME Transport S.A." />
```

**Animación automática:** fadeInLeft (300ms)

---

### 6. ChatMessages (ya existente)
Contenedor con auto-scroll automático.

```tsx
import { ChatMessages } from '@/app/cotizar/components/ChatMessages';

<ChatMessages mensajes={mensajes} />
```

**Características:**
- Auto-scroll suave al último mensaje
- Maneja estado empty
- Roles ARIA para accesibilidad

---

### 7. ProgressIndicator (ya existente)
Barra de progreso con transición suave.

```tsx
import { ProgressIndicator } from '@/components/shared';

<ProgressIndicator pasoActual={2} totalPasos={13} />
```

**Características:**
- Transición suave (500ms) al cambiar de paso
- Porcentaje calculado automáticamente
- Roles ARIA para screen readers

---

## 🎨 Clases CSS de Animación Disponibles

### Animaciones de Entrada

#### `.animate-fadeInUp`
Aparece desde abajo con fade (10px).

```tsx
<div className="animate-fadeInUp">
  Contenido que aparece suavemente
</div>
```

**Duración:** 300ms | **Easing:** ease-out

---

#### `.animate-fadeInLeft`
Aparece desde la derecha con fade (10px).

```tsx
<div className="animate-fadeInLeft">
  Contenido que entra desde la derecha
</div>
```

**Duración:** 300ms | **Easing:** ease-out

---

#### `.animate-slideInUp`
Aparece desde más abajo con fade (20px).

```tsx
<div className="animate-slideInUp">
  Input que aparece al hacer nueva pregunta
</div>
```

**Duración:** 300ms | **Easing:** ease-out  
**Uso:** Inputs nuevos, forms

---

### Animaciones de Feedback

#### `.animate-shake`
Vibración horizontal para errores de validación.

```tsx
<div className={error ? 'animate-shake' : ''}>
  <input {...props} />
  {error && <ErrorMessage />}
</div>
```

**Duración:** 400ms | **Uso:** Errores de validación

---

#### `.animate-pulse`
Pulsación suave para estados de carga.

```tsx
<button disabled={loading}>
  {loading ? (
    <span className="animate-pulse">⏳ Guardando...</span>
  ) : (
    'Continuar'
  )}
</button>
```

**Duración:** 1500ms (infinite) | **Uso:** Loading states

---

#### `.animate-spin`
Rotación continua para spinners.

```tsx
<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
```

**Duración:** 1000ms (infinite) | **Uso:** Spinners, loading

---

### Clases de Transición

#### `.transition-fast`
Transición rápida para interacciones inmediatas.

```tsx
<button className="transition-fast hover:scale-105">
  Click me
</button>
```

**Duración:** 150ms

---

#### `.transition-smooth`
Transición normal para la mayoría de casos.

```tsx
<div className="transition-smooth hover:shadow-lg">
  Card
</div>
```

**Duración:** 300ms

---

#### `.transition-slow`
Transición lenta para cambios visuales importantes.

```tsx
<div 
  className="transition-slow"
  style={{ width: `${progress}%` }}
/>
```

**Duración:** 500ms | **Uso:** Progress bars, cambios de layout

---

## 🪝 Hook: useAutoScroll

Hook personalizado para auto-scroll en contenedores.

```tsx
import { useAutoScroll } from '@/app/cotizar/hooks';

function ChatLog({ messages }) {
  const scrollRef = useAutoScroll(messages.length);
  
  return (
    <div ref={scrollRef} className="overflow-y-auto max-h-96">
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
    </div>
  );
}
```

**Características:**
- Scroll suave automático
- Se dispara cuando cambia la dependencia
- Reutilizable en cualquier lista dinámica

---

## ⏱️ Timing de Secuencia Conversacional

Flujo completo de un paso (ejemplo):

```tsx
const siguientePaso = async (valor: any) => {
  // 1. Agregar respuesta del usuario (0ms)
  agregarMensaje('user', valor);
  
  // 2. Mostrar typing indicator (fadeInUp 300ms)
  setIsTyping(true);
  
  // 3. Guardar en BD (tiempo variable)
  await actualizarSolicitud(campo, valor);
  
  // 4. Delay artificial para UX natural (500ms)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 5. Quitar typing indicator (fadeOut)
  setIsTyping(false);
  
  // 6. Agregar siguiente pregunta (fadeInUp 300ms)
  agregarMensaje('bot', siguientePregunta);
  
  // 7. Auto-scroll (smooth, ~300ms)
  // 8. Input aparece (slideInUp 300ms)
  // 9. Auto-focus en input (50ms después)
};
```

**Tiempo total percibido:** ~1.5-2 segundos (natural, no apresurado)

---

## ♿ Accesibilidad

### Reduced Motion
Todas las animaciones respetan `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Si el usuario tiene configurado "reducir movimiento" en su sistema operativo, las animaciones se ejecutan casi instantáneamente (0.01ms).

### ARIA Labels
Todos los componentes incluyen:
- `role` apropiado (`status`, `alert`, `progressbar`, etc.)
- `aria-live` para lectores de pantalla
- `aria-label` descriptivo
- `aria-busy` para estados de carga

---

## 🚀 Performance

### Optimizaciones Implementadas

1. **GPU Acceleration:**
   - Solo animamos `transform` y `opacity`
   - Nunca `width`, `height`, `top`, `left`

2. **will-change (automático):**
   - Las clases ya optimizan el rendering

3. **Conditional Rendering:**
   - Componentes no renderizados si `show={false}`

4. **React.memo (recomendado):**
```tsx
export const BotMessage = React.memo(({ texto }: Props) => {
  // ...
});
```

---

## 📦 Ejemplo Completo de Integración

```tsx
'use client';

import { useState } from 'react';
import { 
  BotMessage, 
  UserMessage, 
  TypingIndicator,
  LoadingOverlay,
  Toast,
  ProgressIndicator 
} from '@/components/shared';
import { ChatMessages } from '@/app/cotizar/components/ChatMessages';

export function ConversacionCotizacion() {
  const [mensajes, setMensajes] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [pasoActual, setPasoActual] = useState(0);

  const handleContinue = async (valor: any) => {
    // 1. Agregar respuesta usuario
    agregarMensaje('user', valor);
    
    // 2. Typing indicator
    setIsTyping(true);
    
    try {
      // 3. Guardar en BD
      await actualizarSolicitud(campo, valor);
      
      // 4. Delay UX
      await new Promise(r => setTimeout(r, 500));
      
      // 5. Siguiente pregunta
      setIsTyping(false);
      agregarMensaje('bot', siguientePregunta);
      setPasoActual(prev => prev + 1);
      
      // 6. Toast de éxito
      setToast({
        type: 'success',
        message: 'Progreso guardado'
      });
      
    } catch (error) {
      setIsTyping(false);
      setToast({
        type: 'error',
        message: 'Error al guardar. Intenta nuevamente.'
      });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Loading overlay para operaciones críticas */}
      <LoadingOverlay 
        show={isLoading} 
        message="Creando tu solicitud..." 
      />
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Progress bar */}
      <ProgressIndicator 
        pasoActual={pasoActual} 
        totalPasos={13} 
      />
      
      {/* Chat container */}
      <div className="chat-container">
        <ChatMessages mensajes={mensajes} />
        
        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}
        
        {/* Input current step */}
        <div className="animate-slideInUp">
          <DynamicInput
            tipo={pasoActual.tipo}
            onContinue={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

Al usar animaciones en tu componente:

- [ ] ¿La animación mejora la UX o solo es decorativa?
- [ ] ¿Dura menos de 500ms (excepto loops)?
- [ ] ¿Usa `transform` u `opacity` (no `width`/`height`)?
- [ ] ¿Tiene feedback visual inmediato?
- [ ] ¿Incluye ARIA labels apropiados?
- [ ] ¿Respeta `prefers-reduced-motion`?
- [ ] ¿Se ve bien en móvil?
- [ ] ¿No bloquea la interacción del usuario?

---

## 🚫 Prohibiciones

**NUNCA hacer:**
- ❌ Animar `width`, `height`, `top`, `left` directamente
- ❌ Duraciones >500ms (excepto loops intencionales)
- ❌ Muchas animaciones simultáneas
- ❌ Ignorar `prefers-reduced-motion`
- ❌ Animaciones sin propósito UX claro

**SIEMPRE hacer:**
- ✅ Usar `transform` y `opacity`
- ✅ Duraciones 150-300ms
- ✅ Testear en móviles
- ✅ Incluir ARIA labels
- ✅ Pensar: "¿Esto mejora la experiencia?"

---

**¿Dudas?** Revisa [05_FRONT_ANIMACIONES_TRANSICIONES.md](../prompts/05_FRONT_ANIMACIONES_TRANSICIONES.md) para especificación técnica completa.
