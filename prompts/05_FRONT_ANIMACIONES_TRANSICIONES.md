# PROMPT 05: ANIMACIONES, TRANSICIONES Y ESTADOS VISUALES

## CONTEXTO DE NEGOCIO
Las animaciones y transiciones visuales son **críticas** para la experiencia conversacional. Deben sentirse naturales, como una conversación real entre humano y bot.

**Valor de negocio:** 
- Mejorar percepción de profesionalismo (+40% confianza según estudios UX)
- Guiar la atención del usuario al contenido relevante
- Reducir tasa de abandono mediante feedback visual inmediato

## PRINCIPIOS DE ANIMACIÓN

### 1. Predecibilidad
Usuario debe anticipar qué va a pasar (dirección, duración)

### 2. Fluidez
60fps constantes, sin lags ni saltos

### 3. Propósito
Cada animación tiene una razón funcional, no es decorativa

### 4. Sutileza
Duraciones cortas (150-300ms), no llamativas

### 5. Accesibilidad
Respetar `prefers-reduced-motion` para usuarios con sensibilidad

## ESPECIFICACIÓN TÉCNICA

### Sistema de Animaciones CSS

**Archivo:** `app/globals.css` (ya definido en Prompt 02, ampliar aquí)

```css
@layer utilities {
  /* =============================================
     ANIMACIONES PARA MENSAJES DEL CHAT
     ============================================= */
  
  /* Mensaje del bot: Aparece desde abajo con fade */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Mensaje del usuario: Aparece desde la derecha con fade */
  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  /* Indicador de escritura (typing indicator) */
  @keyframes typingDot {
    0%, 60% {
      opacity: 0.3;
      transform: translateY(0);
    }
    30% {
      opacity: 1;
      transform: translateY(-4px);
    }
  }
  
  /* =============================================
     ANIMACIONES PARA INPUTS
     ============================================= */
  
  /* Input aparece con fade y ligero slide up */
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Shake (error de validación) */
  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-5px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(5px);
    }
  }
  
  /* Pulse (botón loading) */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  /* =============================================
     ANIMACIONES PARA BARRA DE PROGRESO
     ============================================= */
  
  @keyframes progressGrow {
    from {
      transform: scaleX(0);
      transform-origin: left;
    }
    to {
      transform: scaleX(1);
      transform-origin: left;
    }
  }
  
  /* =============================================
     CLASES UTILITARIAS
     ============================================= */
  
  .animate-fadeInUp {
    animation: fadeInUp var(--duration-normal) var(--ease-out);
  }
  
  .animate-fadeInLeft {
    animation: fadeInLeft var(--duration-normal) var(--ease-out);
  }
  
  .animate-slideInUp {
    animation: slideInUp var(--duration-normal) var(--ease-out);
  }
  
  .animate-shake {
    animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  
  .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  /* Dot para typing indicator */
  .typing-dot {
    animation: typingDot 1.4s infinite;
  }
  
  .typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  /* =============================================
     TRANSICIONES SUAVES
     ============================================= */
  
  .transition-smooth {
    transition: all var(--duration-normal) var(--ease-in-out);
  }
  
  .transition-fast {
    transition: all var(--duration-fast) var(--ease-in-out);
  }
  
  .transition-slow {
    transition: all var(--duration-slow) var(--ease-in-out);
  }
  
  /* =============================================
     ACCESIBILIDAD: REDUCED MOTION
     ============================================= */
  
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

## ANIMACIONES POR COMPONENTE

### 1. BotMessage (Pregunta aparece)

**Cuándo:** Al mostrarse una nueva pregunta del sistema

**Animación:**
- Fade in (0 → 1 opacidad)
- Slide up (10px arriba → posición final)
- Duración: 300ms
- Easing: ease-out

**Implementación:**
```tsx
export function BotMessage({ texto }: Props) {
  return (
    <div className="bot-message animate-fadeInUp">
      <p>{texto}</p>
    </div>
  );
}
```

**Comportamiento:**
- Primera pregunta (mount): Animación completa
- Preguntas siguientes: Animación + auto-scroll suave

---

### 2. UserMessage (Respuesta enviada)

**Cuándo:** Usuario envía su respuesta

**Animación:**
- Fade in (0 → 1 opacidad)
- Slide left (10px derecha → posición final)
- Duración: 300ms
- Easing: ease-out

**Implementación:**
```tsx
export function UserMessage({ texto }: Props) {
  return (
    <div className="user-message animate-fadeInLeft">
      <p>{texto}</p>
    </div>
  );
}
```

**Secuencia:**
1. Usuario hace click "Continuar"
2. Input se deshabilita
3. Respuesta aparece como UserMessage (animación)
4. 500ms delay
5. Siguiente pregunta aparece como BotMessage (animación)

---

### 3. TypingIndicator (Bot "escribiendo")

**Cuándo:** Después de que usuario envía respuesta, antes de mostrar siguiente pregunta

**Duración:** 500-800ms (variable según longitud de pregunta)

**Componente:**
```tsx
export function TypingIndicator() {
  return (
    <div className="bot-message flex items-center gap-1">
      <span className="typing-dot w-2 h-2 rounded-full bg-current" />
      <span className="typing-dot w-2 h-2 rounded-full bg-current" />
      <span className="typing-dot w-2 h-2 rounded-full bg-current" />
    </div>
  );
}
```

**Implementación en flujo:**
```tsx
const siguientePaso = async (valor: any) => {
  // 1. Agregar respuesta del usuario
  agregarMensaje('user', valor);
  
  // 2. Mostrar typing indicator
  setIsTyping(true);
  
  // 3. Guardar en BD
  await actualizarSolicitud(campo, valor);
  
  // 4. Delay artificial (simular "pensamiento")
  await delay(500);
  
  // 5. Quitar typing indicator
  setIsTyping(false);
  
  // 6. Agregar siguiente pregunta
  agregarMensaje('bot', siguientePregunta);
};
```

---

### 4. ChatInput (Entrada de input)

**Cuándo:** Nueva pregunta aparece, input correspondiente se renderiza

**Animación:**
- Slide up (20px arriba → posición final)
- Fade in (0 → 1 opacidad)
- Duración: 300ms
- Auto-focus después de animación

**Implementación:**
```tsx
export function ChatInput({ tipo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Auto-focus después de animación (350ms)
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="animate-slideInUp">
      <TextInput ref={inputRef} {...props} />
    </div>
  );
}
```

---

### 5. ErrorMessage (Validación fallida)

**Cuándo:** Usuario intenta continuar con dato inválido

**Animación:**
- Shake (vibración horizontal)
- Duración: 400ms
- Input con borde rojo pulsante

**Implementación:**
```tsx
export function ChatInput({ error }: Props) {
  const [showError, setShowError] = useState(false);
  
  useEffect(() => {
    if (error) {
      setShowError(true);
      // Quitar shake después de animación
      const timer = setTimeout(() => setShowError(false), 400);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  return (
    <div className={showError ? 'animate-shake' : ''}>
      <input 
        className={error ? 'border-destructive ring-2 ring-destructive/50' : ''}
        {...props}
      />
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
```

---

### 6. ContinueButton (Estados del botón)

**Estados:**
- Idle (esperando)
- Hover (mouse encima)
- Loading (guardando)
- Disabled (inválido)
- Success (guardado exitoso - opcional)

**Animaciones:**

#### Hover
```css
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

#### Loading
```tsx
export function ContinueButton({ loading, onClick }: Props) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className="btn-primary transition-smooth"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <span className="animate-pulse">⏳</span>
          <span>Guardando...</span>
        </div>
      ) : (
        'Continuar'
      )}
    </button>
  );
}
```

#### Success (Micro-interacción)
```tsx
// Al guardar exitosamente, mostrar checkmark brevemente
{showSuccess && (
  <span className="animate-fadeInUp">✅</span>
)}
```

---

### 7. ProgressBar (Barra de progreso)

**Cuándo:** Al avanzar de paso

**Animación:**
- Crecimiento suave (width transition)
- Duración: 500ms
- Easing: ease-in-out

**Implementación:**
```tsx
export function ProgressIndicator({ progreso }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2">
        <span>Paso {pasoActual + 1} de 13</span>
        <span>{progreso}% completado</span>
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-slow"
          style={{ width: `${progreso}%` }}
        />
      </div>
    </div>
  );
}
```

**Comportamiento:**
- Al avanzar: Barra crece suavemente
- Al retroceder: Barra se reduce suavemente
- Nunca saltar valores (siempre transición)

---

### 8. Auto-Scroll Suave

**Cuándo:** Nuevo mensaje agregado (bot o user)

**Implementación:**
```tsx
export function ChatMessages({ mensajes }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Auto-scroll al último mensaje
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [mensajes]);
  
  return (
    <div 
      ref={scrollRef}
      className="overflow-y-auto max-h-[60vh] space-y-4"
    >
      {mensajes.map(msg => (
        msg.tipo === 'bot' 
          ? <BotMessage key={msg.id} {...msg} />
          : <UserMessage key={msg.id} {...msg} />
      ))}
    </div>
  );
}
```

---

### 9. Selección de Cards (Radio/Checkbox/ButtonGroup)

**Cuándo:** Usuario hace click en opción

**Animación:**
- Scale ligero (1 → 1.02)
- Cambio de borde (gris → primario)
- Transición de fondo (transparente → primario/10)
- Duración: 150ms

**Implementación:**
```tsx
export function SelectableCard({ selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      data-selected={selected}
      className="
        card-base transition-fast
        hover:scale-[1.02] hover:shadow-md
        data-[selected=true]:border-primary 
        data-[selected=true]:bg-primary/10
        data-[selected=true]:scale-[1.02]
      "
    >
      {children}
    </button>
  );
}
```

**Micro-interacción:**
- Click: Scale instantáneo + checkmark aparece (fadeIn)
- Hover: Scale + shadow

---

## ESTADOS DE CARGA GLOBAL

### Loading Overlay (Opcional)

**Cuándo:** Guardado crítico (paso 0 inicial, paso 12 final)

**Componente:**
```tsx
export function LoadingOverlay({ show, message }: Props) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeInUp">
      <div className="bg-card p-8 rounded-xl shadow-xl flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
```

**Uso:**
```tsx
<LoadingOverlay 
  show={isCreatingSolicitud} 
  message="Creando tu solicitud..."
/>
```

---

### Toast de Confirmación

**Cuándo:** Acción exitosa (guardado, avance, etc.)

**Componente:**
```tsx
export function Toast({ message, type, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`
      fixed top-4 right-4 z-50
      bg-card border-2 rounded-lg shadow-xl p-4
      animate-slideInUp
      ${type === 'success' && 'border-secondary'}
      ${type === 'error' && 'border-destructive'}
    `}>
      <div className="flex items-center gap-2">
        {type === 'success' && <span className="text-2xl">✅</span>}
        {type === 'error' && <span className="text-2xl">❌</span>}
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}
```

---

## TIMING Y COORDINACIÓN

### Secuencia Completa de un Paso

```
[Usuario escribe respuesta]
                ↓
[Click "Continuar"]
                ↓
[150ms] Input se deshabilita (opacity 0.5)
                ↓
[0ms] UserMessage aparece (fadeInLeft 300ms)
                ↓
[300ms] API call inicia
                ↓
[100ms] TypingIndicator aparece (fadeInUp 200ms)
                ↓
[500ms] API call completa (o timeout)
                ↓
[0ms] TypingIndicator desaparece (fadeOut 200ms)
                ↓
[200ms] BotMessage aparece (fadeInUp 300ms)
                ↓
[100ms] ChatInput aparece (slideInUp 300ms)
                ↓
[300ms] Auto-scroll a último mensaje (smooth)
                ↓
[50ms] Input recibe auto-focus
```

**Total:** ~1,750ms por paso (percibido como rápido y natural)

---

## PERFORMANCE

### Optimizaciones Críticas

1. **CSS Animations > JavaScript:**
   - Usar `transform` y `opacity` (GPU accelerated)
   - Evitar animaciones de `width`, `height`, `left`, `top`

2. **will-change (con cuidado):**
```css
.bot-message {
  will-change: transform, opacity;
}
```

3. **Reducir re-renders:**
```tsx
export const BotMessage = React.memo(({ texto }: Props) => {
  // ...
});
```

4. **Lazy loading de animaciones pesadas:**
```tsx
const HeavyAnimation = lazy(() => import('./HeavyAnimation'));
```

---

## CRITERIOS DE ACEPTACIÓN

### ✅ Animaciones
- [ ] BotMessage aparece con fadeInUp
- [ ] UserMessage aparece con fadeInLeft
- [ ] TypingIndicator funciona (3 dots animados)
- [ ] ChatInput aparece con slideInUp
- [ ] ErrorMessage hace shake
- [ ] ProgressBar crece suavemente

### ✅ Transiciones
- [ ] Botón hover tiene efecto visual
- [ ] Cards seleccionables escalan al seleccionar
- [ ] Auto-scroll suave funciona
- [ ] Input focus tiene efecto visual

### ✅ Estados
- [ ] Loading state en botón (spinner)
- [ ] Disabled state en inputs (opacity)
- [ ] Error state en inputs (borde rojo)
- [ ] Success state (checkmark opcional)

### ✅ Performance
- [ ] 60fps constantes en animaciones
- [ ] No lags al avanzar de paso
- [ ] prefers-reduced-motion respetado
- [ ] Animaciones no bloquean interacción

### ✅ Timing
- [ ] Secuencia completa ~1.5-2 segundos por paso
- [ ] TypingIndicator visible 500-800ms
- [ ] Transiciones coordinadas correctamente

## PROHIBICIONES

### ❌ NO Hacer
- NO animar `width`, `height` directamente (usar scale)
- NO durar más de 500ms (excepto intencional)
- NO usar JavaScript para animaciones CSS
- NO animar muchas propiedades simultáneamente
- NO ignorar `prefers-reduced-motion`

### ✅ SÍ Hacer
- Usar `transform` y `opacity` para animaciones
- Mantener duraciones cortas (150-300ms)
- Coordinar secuencias con delays
- Testear en dispositivos de baja gama
- Medir performance con DevTools

## DEFINICIÓN DE "TERMINADO"

Este prompt está completo cuando:
1. **Animaciones CSS** están definidas en globals.css
2. **Timing de secuencia** está especificado
3. **Componentes animados** tienen ejemplos claros
4. **Performance** está optimizado
5. **Accesibilidad** (reduced motion) implementada
6. **Estados visuales** completos

---

**¿Las animaciones y transiciones están suficientemente detalladas? ¿Hay alguna interacción o micro-animación que requiera más especificación?**
