# PROMPT 01: ARQUITECTURA DE COMPONENTES UI - SISTEMA CONVERSACIONAL

## CONTEXTO DE NEGOCIO
Estamos construyendo un sistema de cotización B2B que reemplaza el **formulario tradicional** por una **experiencia conversacional** progresiva. El usuario responde preguntas paso a paso como en un chat, y cada respuesta se guarda inmediatamente en base de datos.

**Valor de negocio:** Reducir la tasa de abandono del formulario (objetivo: < 15%) mediante una experiencia más natural y con guardado progresivo que previene pérdida de datos.

## ESPECIFICACIÓN FUNCIONAL

### Paradigma UX: Conversación, NO Formulario
- ❌ **NO construir:** Un formulario con 13 campos visibles simultáneamente
- ✅ **SÍ construir:** Una interfaz de chat donde aparece UNA pregunta a la vez
- El usuario responde, hace click en "Continuar", y aparece la siguiente pregunta
- Las respuestas anteriores permanecen visibles como historial de conversación

### Características Críticas
1. **Guardado progresivo:** Cada respuesta llama a la API inmediatamente
2. **13 pasos totales:** Desde "nombre empresa" hasta "fecha requerida"
3. **Progreso visible:** Indicador "Paso X de 13" siempre visible
4. **Historial persistente:** Todas las preguntas/respuestas anteriores visibles
5. **Responsive mobile-first:** Optimizado para completarse en móvil

## ARQUITECTURA TÉCNICA

### Stack Tecnológico Obligatorio
- Next.js 15.x (App Router)
- React 19.x con TypeScript estricto
- Tailwind CSS 4.x para estilos
- React Hook Form 7.x para gestión de estado del formulario
- Zod 3.x para validación de schemas

### Estructura de Componentes Requerida

```
app/cotizar/page.tsx (Client Component)
│
└── ConversacionCotizacion (Smart Component)
    │
    ├── ProgressIndicator
    │   └── Muestra "Paso X de 13" y barra de progreso
    │
    ├── ChatContainer
    │   │
    │   ├── ChatMessages (Historial completo)
    │   │   ├── BotMessage[] (preguntas del sistema)
    │   │   └── UserMessage[] (respuestas del usuario)
    │   │
    │   └── ChatInput (Input actual según tipo de pregunta)
    │       ├── TextInput (pasos 0,1,5,6,9)
    │       ├── EmailInput (paso 2)
    │       ├── PhoneInput (paso 3)
    │       ├── RadioButtons (paso 4: tipo servicio)
    │       ├── ButtonGroup (paso 7: tipo carga)
    │       ├── NumberInput (pasos 8,10)
    │       ├── CheckboxGroup (paso 11: condiciones)
    │       └── DatePicker (paso 12)
    │
    └── ChatFooter
        ├── ContinueButton ("Continuar" o "Enviar solicitud")
        └── BackButton (opcional, "Atrás")
```

## ESPECIFICACIÓN DE COMPONENTES PRINCIPALES

### 1. ConversacionCotizacion (Smart Component)

**Responsabilidades:**
- Gestionar estado conversacional (paso actual: 0-12)
- Mantener historial de preguntas y respuestas
- Integrar React Hook Form
- Ejecutar llamadas API (POST inicial, PATCH progresivos)
- Controlar navegación entre pasos
- Manejar estados de carga y error

**Estado Interno Requerido:**
```typescript
{
  pasoActual: number              // 0-12
  solicitudId: string | null      // ID generado en paso 0
  historialMensajes: Array<{
    id: string
    tipo: 'bot' | 'user'
    contenido: string
    timestamp: Date
  }>
  isLoading: boolean
  error: string | null
}
```

**Métodos Críticos a Implementar:**

#### crearSolicitudInicial(empresa: string)
- **Cuándo:** Al responder paso 0 (nombre empresa)
- **API:** `POST /api/solicitudes { empresa }`
- **Retorna:** `solicitudId` que se guarda en estado
- **Siguiente:** Avanza a paso 1

#### actualizarSolicitud(campo: string, valor: any)
- **Cuándo:** Al responder cualquier paso 1-11
- **API:** `PATCH /api/solicitudes/:id { [campo]: valor }`
- **Comportamiento:** Guardado optimista (avanza antes de confirmar)
- **Error:** Si falla, mostrar toast pero NO retroceder

#### completarSolicitud(fechaRequerida: Date)
- **Cuándo:** Al responder paso 12 (última pregunta)
- **API:** `PATCH /api/solicitudes/:id { fechaRequerida, estado: "COMPLETADA" }`
- **Efecto:** Dispara notificaciones (email + WhatsApp)
- **Siguiente:** Muestra mensaje de confirmación final

#### siguientePaso()
- Validar respuesta actual con React Hook Form
- Si válida:
  - Agregar respuesta a historial como UserMessage
  - Llamar actualizarSolicitud() o crearSolicitudInicial()
  - Incrementar pasoActual
  - Agregar siguiente pregunta como BotMessage
  - Scroll automático al último mensaje
- Si inválida:
  - Mostrar error debajo del input
  - NO avanzar

### 2. ChatMessages (Presentational Component)

**Propósito:** Renderizar historial completo de conversación

**Props esperadas:**
```typescript
interface ChatMessagesProps {
  mensajes: Array<{
    id: string
    tipo: 'bot' | 'user'
    contenido: string
    timestamp?: Date
  }>
}
```

**Comportamiento:**
- Mostrar mensajes en orden cronológico
- Diferenciar visualmente bot vs user (ver componentes BotMessage/UserMessage)
- Auto-scroll al último mensaje cuando se agrega uno nuevo
- Animación fade-in al aparecer nuevo mensaje

### 3. BotMessage & UserMessage

**BotMessage (pregunta del sistema):**
- Burbuja alineada a la **izquierda**
- Fondo gris claro (`bg-gray-100`)
- Texto gris oscuro (`text-gray-900`)
- Icono opcional del bot (🤖) a la izquierda
- Border radius: `rounded-2xl`
- Padding: `p-4`
- Animación entrada: `animate-fadeInUp`

**UserMessage (respuesta del usuario):**
- Burbuja alineada a la **derecha**
- Fondo color primario (`bg-primary`)
- Texto blanco (`text-white`)
- Border radius: `rounded-2xl`
- Padding: `p-4`
- Animación entrada: `animate-fadeInLeft`

### 4. ChatInput (Input Dinámico)

**Propósito:** Renderizar el tipo de input apropiado según el paso actual

**Lógica de renderizado:**
```typescript
switch (pasoActual) {
  case 0: return <TextInput name="empresa" placeholder="Ej: ACME Transport" />
  case 1: return <TextInput name="contacto" placeholder="Tu nombre" />
  case 2: return <EmailInput name="email" />
  case 3: return <PhoneInput name="telefono" />
  case 4: return <RadioButtons name="tipoServicio" options={['Urbano', 'Nacional']} />
  case 5: return <TextInput name="origen" placeholder="Ciudad o dirección" />
  case 6: return mostrarDestino ? <TextInput name="destino" /> : null
  case 7: return <ButtonGroup name="tipoCarga" options={['Mercancía', 'Maquinaria', 'Muebles']} />
  case 8: return <NumberInput name="pesoKg" suffix="kg" />
  case 9: return <Textarea name="dimensiones" placeholder="200×150×100 cm" />
  case 10: return <NumberInput name="valorAsegurado" prefix="$" />
  case 11: return <CheckboxGroup name="condicionesCargue" options={['Muelle', 'Montacargas', 'Manual']} />
  case 12: return <DatePicker name="fechaRequerida" minDate={new Date()} />
}
```

**Validaciones requeridas:**
- Cada input debe integrarse con React Hook Form
- Validación en tiempo real (onChange)
- Mensajes de error debajo del input
- Input se marca con borde rojo si inválido

### 5. ProgressIndicator

**Propósito:** Mostrar progreso visual del formulario

**Elementos:**
- Texto: "Paso X de 13"
- Porcentaje: "(Y% completado)"
- Barra de progreso horizontal
  - Ancho proporcional: `width: ${(pasoActual / 12) * 100}%`
  - Color: `bg-primary`
  - Altura: `h-2`
  - Animación suave en cambios: `transition-all duration-300`

**Ubicación:** Fijo en la parte superior del contenedor

### 6. ChatFooter

**Elementos:**
- Botón "Continuar" (o "Enviar solicitud" en paso final)
  - Deshabilitado si input actual inválido
  - Loading spinner cuando isLoading = true
  - Color primario: `bg-primary hover:bg-primary-dark`
  - Tamaño: `px-8 py-3 text-lg`
- Botón "Atrás" (opcional)
  - Solo visible si pasoActual > 0
  - Color secundario: `bg-gray-200 hover:bg-gray-300`
  - Al hacer click: retroceder contador pero NO modificar BD

## CRITERIOS DE ACEPTACIÓN

### ✅ Funcionalidad
- [ ] Al cargar `/cotizar`, aparece pregunta del paso 0
- [ ] Al responder paso 0, se crea solicitud en BD y aparece paso 1
- [ ] Al responder cualquier paso 1-11, se actualiza solicitud en BD
- [ ] Al responder paso 12, se marca solicitud como COMPLETADA y dispara notificaciones
- [ ] Historial de conversación siempre visible
- [ ] No se puede avanzar con respuesta inválida
- [ ] Si API falla, muestra error pero no pierde datos locales

### ✅ UX/UI
- [ ] Animación suave al aparecer cada pregunta
- [ ] Auto-scroll al último mensaje
- [ ] Indicador de progreso funcional
- [ ] Loading spinner al guardar
- [ ] Responsive en móvil (mínimo 320px de ancho)
- [ ] Inputs grandes y fáciles de tocar en móvil (min 44px altura)

### ✅ Performance
- [ ] Primera carga < 3 segundos
- [ ] Respuesta API < 500ms (guardado progresivo)
- [ ] Animaciones a 60fps
- [ ] Sin re-renders innecesarios

## RESTRICCIONES TÉCNICAS

### Obligatorias
- Usar TypeScript strict mode
- Todos los componentes con prop types definidos
- Manejo de errores con try-catch en todas las llamadas API
- Accesibilidad WCAG 2.1 AA:
  - Labels en todos los inputs
  - Contraste mínimo 4.5:1
  - Navegación por teclado funcional
  - ARIA labels donde corresponda

### Prohibidas
- NO usar librerías de UI completas (Material-UI, Chakra)
- NO usar Redux (estado local con useState/useReducer)
- NO hacer peticiones API en paralelo innecesarias
- NO almacenar datos sensibles en localStorage sin encriptar

## INTEGRACIÓN CON BACKEND

### Endpoints a consumir

#### POST /api/solicitudes (Paso 0)
```typescript
// Request
{ empresa: string }

// Response 201
{
  success: true,
  data: {
    id: string,
    empresa: string,
    estado: "EN_PROGRESO",
    fechaCreacion: string
  }
}
```

#### PATCH /api/solicitudes/:id (Pasos 1-12)
```typescript
// Request (campos opcionales según paso)
{
  contacto?: string,
  email?: string,
  telefono?: string,
  tipoServicio?: "URBANO" | "NACIONAL",
  origen?: string,
  destino?: string,
  tipoCarga?: string,
  pesoKg?: number,
  dimensiones?: string,
  valorAsegurado?: number,
  condicionesCargue?: string[],
  fechaRequerida?: string,
  estado?: "COMPLETADA"
}

// Response 200
{
  success: true,
  data: { ...solicitud actualizada }
}
```

## DEFINICIÓN DE "TERMINADO"

Este prompt está completo cuando:
1. **Arquitectura clara** de 6 componentes principales está definida
2. **Responsabilidades** de cada componente están especificadas
3. **Estados** y métodos críticos están documentados
4. **Flujo de datos** entre componentes está claro
5. **Integraciones API** están especificadas
6. **Criterios de aceptación** son verificables

## PRÓXIMOS PASOS

Una vez aprobada esta arquitectura:
1. Crear sistema de diseño y tokens CSS (Prompt 02)
2. Implementar motor conversacional con lógica de estados (Prompt 03)
3. Construir componentes de input individuales (Prompt 04)
4. Agregar animaciones y transiciones (Prompt 05)

---

**¿Esta arquitectura de componentes cumple con tus expectativas de claridad y nivel de detalle? ¿Hay algún componente o flujo que requiera más especificación antes de proceder?**
