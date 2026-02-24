# PROMPT 03: MOTOR CONVERSACIONAL Y GUARDADO PROGRESIVO

## CONTEXTO DE NEGOCIO
El motor conversacional es el **cerebro** del sistema. Controla el flujo de 13 pasos, gestiona el guardado progresivo en base de datos, y coordina la experiencia paso a paso.

**Valor de negocio:** Reducir tasa de abandono mediante guardado automático que previene pérdida de datos, incluso si el usuario cierra el navegador.

## ESPECIFICACIÓN FUNCIONAL

### Flujo Completo de 13 Pasos

| Paso | Pregunta | Tipo Input | Campo BD | Validación |
|------|----------|------------|----------|------------|
| 0 | "¿Cuál es el nombre de tu empresa?" | Text | `empresa` | min 3 chars |
| 1 | "¿Y con quién tengo el gusto?" | Text | `contacto` | min 3 chars |
| 2 | "¿Cuál es tu email?" | Email | `email` | email válido |
| 3 | "¿Un número de teléfono?" | Phone | `telefono` | formato válido |
| 4 | "¿Qué tipo de servicio necesitas?" | Radio | `tipoServicio` | URBANO o NACIONAL |
| 5 | "¿Desde dónde necesitas el servicio?" | Text | `origen` | min 3 chars |
| 6 | "¿Hacia qué ciudad va el envío?" (condicional) | Text | `destino` | min 3 chars |
| 7 | "¿Qué tipo de carga transportarás?" | Buttons | `tipoCarga` | opciones válidas |
| 8 | "¿Cuál es el peso aproximado?" | Number | `pesoKg` | > 0, < 50000 |
| 9 | "¿Cuáles son las dimensiones?" | Textarea | `dimensiones` | min 5 chars |
| 10 | "¿Qué valor tiene tu carga?" | Number | `valorAsegurado` | > 0 |
| 11 | "¿Facilidades de cargue?" | Checkbox | `condicionesCargue` | min 1 selección |
| 12 | "¿Para qué fecha necesitas el servicio?" | Date | `fechaRequerida` | >= hoy |

### Características Críticas del Motor

1. **Creación inicial (Paso 0):**
   - Usuario responde nombre empresa
   - Sistema ejecuta `POST /api/solicitudes { empresa }`
   - Backend crea registro con `estado: "EN_PROGRESO"`
   - Sistema guarda `solicitudId` en estado
   - Sistema avanza a paso 1

2. **Guardado progresivo (Pasos 1-11):**
   - Usuario responde pregunta
   - Sistema valida localmente (React Hook Form + Zod)
   - Sistema ejecuta `PATCH /api/solicitudes/:id { campo: valor }`
   - Backend actualiza registro parcialmente
   - Sistema avanza al siguiente paso (NO espera confirmación del servidor)
   - Si falla guardado: log error pero continúa (datos se recuperan en siguiente guardado exitoso)

3. **Completar solicitud (Paso 12):**
   - Usuario responde última pregunta
   - Sistema ejecuta `PATCH /api/solicitudes/:id { fechaRequerida, estado: "COMPLETADA" }`
   - Backend actualiza estado y dispara notificaciones
   - Sistema muestra mensaje de confirmación
   - Sistema deshabilita navegación (solicitud finalizada)

4. **Paso condicional (Paso 6 - Destino):**
   - Solo aparece si en paso 4 seleccionó "NACIONAL"
   - Si seleccionó "URBANO", omite paso 6 y salta a paso 7

## ARQUITECTURA TÉCNICA

### Gestión de Estado

**Tecnología:** React useState + useReducer (NO Redux)

**Estado del componente ConversacionCotizacion:**

```typescript
interface ConversacionState {
  // Control de flujo
  pasoActual: number;                    // 0-12
  solicitudId: string | null;            // ID generado en paso 0
  
  // Historial visual
  historialMensajes: Array<{
    id: string;                          // ULID para key de React
    tipo: 'bot' | 'user';
    contenido: string;
    timestamp: Date;
  }>;
  
  // Estados de UI
  isLoading: boolean;                    // Guardando en BD
  error: string | null;                  // Error actual (si existe)
  
  // Datos del formulario
  datosForm: {
    empresa?: string;
    contacto?: string;
    email?: string;
    telefono?: string;
    tipoServicio?: 'URBANO' | 'NACIONAL';
    origen?: string;
    destino?: string;
    tipoCarga?: 'MERCANCIA_EMPRESARIAL' | 'MAQUINARIA' | 'MUEBLES_EMBALADOS';
    pesoKg?: number;
    dimensiones?: string;
    valorAsegurado?: number;
    condicionesCargue?: string[];
    fechaRequerida?: Date;
  };
}
```

### Definición de Pasos (Configuración)

**Archivo:** `app/cotizar/config/pasos.ts`

```typescript
export interface PasoConfig {
  id: number;
  pregunta: string;
  campoFormulario: string;
  tipoInput: 'text' | 'email' | 'phone' | 'radio' | 'buttons' | 'number' | 'textarea' | 'checkbox' | 'date';
  opciones?: Array<{ label: string; value: string }>;
  validacion: z.ZodType<any>;
  condicional?: (datos: any) => boolean;  // Para paso 6
}

export const PASOS: PasoConfig[] = [
  {
    id: 0,
    pregunta: "👋 ¡Hola! Para comenzar, ¿cuál es el nombre de tu empresa?",
    campoFormulario: "empresa",
    tipoInput: "text",
    validacion: z.string().min(3, "Mínimo 3 caracteres").max(200),
  },
  {
    id: 1,
    pregunta: "Perfecto, {empresa}. ¿Y con quién tengo el gusto de hablar?",
    campoFormulario: "contacto",
    tipoInput: "text",
    validacion: z.string().min(3, "Mínimo 3 caracteres").max(200),
  },
  {
    id: 2,
    pregunta: "Excelente, {contacto}. ¿Cuál es tu correo electrónico?",
    campoFormulario: "email",
    tipoInput: "email",
    validacion: z.string().email("Email inválido"),
  },
  {
    id: 3,
    pregunta: "¿Y un número de teléfono donde podamos contactarte?",
    campoFormulario: "telefono",
    tipoInput: "phone",
    validacion: z.string().regex(/^\+?[0-9]{10,15}$/, "Teléfono inválido"),
  },
  {
    id: 4,
    pregunta: "Ahora, cuéntame sobre tu envío. ¿Qué tipo de servicio necesitas?",
    campoFormulario: "tipoServicio",
    tipoInput: "radio",
    opciones: [
      { label: "🏙️ Urbano (dentro de la ciudad)", value: "URBANO" },
      { label: "🌍 Nacional (entre ciudades)", value: "NACIONAL" },
    ],
    validacion: z.enum(["URBANO", "NACIONAL"]),
  },
  {
    id: 5,
    pregunta: "¿Desde dónde necesitas el servicio de transporte?",
    campoFormulario: "origen",
    tipoInput: "text",
    validacion: z.string().min(3, "Mínimo 3 caracteres"),
  },
  {
    id: 6,
    pregunta: "¿Y hacia qué ciudad va el envío?",
    campoFormulario: "destino",
    tipoInput: "text",
    validacion: z.string().min(3, "Mínimo 3 caracteres"),
    condicional: (datos) => datos.tipoServicio === "NACIONAL",
  },
  {
    id: 7,
    pregunta: "Perfecto. ¿Qué tipo de carga vas a transportar?",
    campoFormulario: "tipoCarga",
    tipoInput: "buttons",
    opciones: [
      { label: "📦 Mercancía empresarial", value: "MERCANCIA_EMPRESARIAL" },
      { label: "⚙️ Maquinaria", value: "MAQUINARIA" },
      { label: "🪑 Muebles embalados", value: "MUEBLES_EMBALADOS" },
    ],
    validacion: z.enum(["MERCANCIA_EMPRESARIAL", "MAQUINARIA", "MUEBLES_EMBALADOS"]),
  },
  {
    id: 8,
    pregunta: "¿Cuál es el peso aproximado de tu carga (en kg)?",
    campoFormulario: "pesoKg",
    tipoInput: "number",
    validacion: z.number().min(0.01, "Debe ser mayor a 0").max(50000, "Máximo 50,000 kg"),
  },
  {
    id: 9,
    pregunta: "¿Cuáles son las dimensiones? (formato: largo × alto × ancho en cm)",
    campoFormulario: "dimensiones",
    tipoInput: "textarea",
    validacion: z.string().min(5, "Describe las dimensiones"),
  },
  {
    id: 10,
    pregunta: "¿Qué valor tiene tu carga para efectos de seguro?",
    campoFormulario: "valorAsegurado",
    tipoInput: "number",
    validacion: z.number().min(0.01, "Debe ser mayor a 0"),
  },
  {
    id: 11,
    pregunta: "¿Con qué facilidades cuentas en el origen para el cargue?",
    campoFormulario: "condicionesCargue",
    tipoInput: "checkbox",
    opciones: [
      { label: "Muelle disponible", value: "muelle" },
      { label: "Montacargas disponible", value: "montacargas" },
      { label: "Cargue manual", value: "manual" },
    ],
    validacion: z.array(z.string()).min(1, "Selecciona al menos una opción"),
  },
  {
    id: 12,
    pregunta: "¿Para qué fecha necesitas el servicio?",
    campoFormulario: "fechaRequerida",
    tipoInput: "date",
    validacion: z.date().min(new Date(), "La fecha no puede ser en el pasado"),
  },
];
```

### Hooks Personalizados

#### useConversacion (Hook principal)

**Archivo:** `app/cotizar/hooks/useConversacion.ts`

```typescript
interface UseConversacionReturn {
  // Estado actual
  pasoActual: number;
  historialMensajes: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Datos
  solicitudId: string | null;
  datosForm: any;
  
  // Configuración del paso
  pasoConfig: PasoConfig;
  mostrarPaso: boolean;  // Maneja condicionales
  progreso: number;      // Porcentaje 0-100
  
  // Acciones
  siguientePaso: (valor: any) => Promise<void>;
  pasoAnterior: () => void;
  resetear: () => void;
}

export function useConversacion(): UseConversacionReturn {
  // Implementación del hook
  // Ver sección "Lógica del Hook" más abajo
}
```

#### Lógica del Hook useConversacion

```typescript
export function useConversacion(): UseConversacionReturn {
  const [state, setState] = useState<ConversacionState>({
    pasoActual: 0,
    solicitudId: null,
    historialMensajes: [],
    isLoading: false,
    error: null,
    datosForm: {},
  });
  
  // Obtener configuración del paso actual
  const pasoConfig = useMemo(() => {
    const paso = PASOS.find(p => p.id === state.pasoActual);
    if (!paso) throw new Error(`Paso ${state.pasoActual} no encontrado`);
    return paso;
  }, [state.pasoActual]);
  
  // Determinar si el paso actual debe mostrarse (condicionales)
  const mostrarPaso = useMemo(() => {
    if (!pasoConfig.condicional) return true;
    return pasoConfig.condicional(state.datosForm);
  }, [pasoConfig, state.datosForm]);
  
  // Calcular progreso (0-100%)
  const progreso = useMemo(() => {
    return Math.round((state.pasoActual / (PASOS.length - 1)) * 100);
  }, [state.pasoActual]);
  
  // Agregar mensaje al historial
  const agregarMensaje = useCallback((tipo: 'bot' | 'user', contenido: string) => {
    const nuevoMensaje: Message = {
      id: ulid(),
      tipo,
      contenido,
      timestamp: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      historialMensajes: [...prev.historialMensajes, nuevoMensaje],
    }));
  }, []);
  
  // Crear solicitud inicial (paso 0)
  const crearSolicitudInicial = useCallback(async (empresa: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa }),
      });
      
      if (!response.ok) throw new Error('Error al crear solicitud');
      
      const { data } = await response.json();
      
      setState(prev => ({
        ...prev,
        solicitudId: data.id,
        datosForm: { empresa },
        isLoading: false,
      }));
      
      return data.id;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al crear solicitud. Intenta nuevamente.',
        isLoading: false,
      }));
      throw error;
    }
  }, []);
  
  // Actualizar solicitud (pasos 1-11)
  const actualizarSolicitud = useCallback(async (campo: string, valor: any) => {
    if (!state.solicitudId) {
      throw new Error('No hay solicitud iniciada');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/solicitudes/${state.solicitudId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: valor }),
      });
      
      if (!response.ok) throw new Error('Error al actualizar solicitud');
      
      setState(prev => ({
        ...prev,
        datosForm: { ...prev.datosForm, [campo]: valor },
        isLoading: false,
      }));
    } catch (error) {
      // NO bloquear: log error pero continúa
      console.error('Error al guardar:', error);
      
      setState(prev => ({
        ...prev,
        datosForm: { ...prev.datosForm, [campo]: valor },
        isLoading: false,
        error: 'Error al guardar. Continuaremos e intentaremos nuevamente.',
      }));
    }
  }, [state.solicitudId]);
  
  // Completar solicitud (paso 12)
  const completarSolicitud = useCallback(async (fechaRequerida: Date) => {
    if (!state.solicitudId) {
      throw new Error('No hay solicitud iniciada');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/solicitudes/${state.solicitudId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fechaRequerida: fechaRequerida.toISOString(),
          estado: 'COMPLETADA',
        }),
      });
      
      if (!response.ok) throw new Error('Error al completar solicitud');
      
      setState(prev => ({
        ...prev,
        datosForm: { ...prev.datosForm, fechaRequerida },
        isLoading: false,
      }));
      
      // Agregar mensaje de confirmación
      agregarMensaje('bot', `✅ ¡Listo, ${state.datosForm.contacto}! Tu solicitud #${state.solicitudId.slice(-8)} ha sido completada. Te contactaremos pronto.`);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al completar solicitud. Intenta nuevamente.',
        isLoading: false,
      }));
      throw error;
    }
  }, [state.solicitudId, state.datosForm, agregarMensaje]);
  
  // Avanzar al siguiente paso
  const siguientePaso = useCallback(async (valor: any) => {
    const campo = pasoConfig.campoFormulario;
    
    // Agregar respuesta del usuario al historial
    agregarMensaje('user', formatearRespuesta(valor));
    
    // Guardar en BD según el paso
    if (state.pasoActual === 0) {
      await crearSolicitudInicial(valor);
    } else if (state.pasoActual === PASOS.length - 1) {
      await completarSolicitud(valor);
      return; // NO avanzar más (última pregunta)
    } else {
      await actualizarSolicitud(campo, valor);
    }
    
    // Avanzar al siguiente paso
    let siguientePasoNum = state.pasoActual + 1;
    
    // Saltar pasos condicionales
    while (siguientePasoNum < PASOS.length) {
      const siguientePaso = PASOS[siguientePasoNum];
      if (!siguientePaso.condicional || siguientePaso.condicional(state.datosForm)) {
        break;
      }
      siguientePasoNum++;
    }
    
    if (siguientePasoNum < PASOS.length) {
      const siguientePasoConfig = PASOS[siguientePasoNum];
      
      // Interpolar variables en pregunta (ej: {empresa}, {contacto})
      const pregunta = interpolatePregunta(siguientePasoConfig.pregunta, state.datosForm);
      
      // Agregar pregunta del bot al historial
      agregarMensaje('bot', pregunta);
      
      setState(prev => ({
        ...prev,
        pasoActual: siguientePasoNum,
      }));
    }
  }, [pasoConfig, state, agregarMensaje, crearSolicitudInicial, actualizarSolicitud, completarSolicitud]);
  
  // Retroceder un paso
  const pasoAnterior = useCallback(() => {
    if (state.pasoActual > 0) {
      setState(prev => ({
        ...prev,
        pasoActual: prev.pasoActual - 1,
        // NO remover mensajes del historial (mantener conversación)
      }));
    }
  }, [state.pasoActual]);
  
  // Resetear conversación
  const resetear = useCallback(() => {
    setState({
      pasoActual: 0,
      solicitudId: null,
      historialMensajes: [],
      isLoading: false,
      error: null,
      datosForm: {},
    });
    
    // Agregar primera pregunta
    agregarMensaje('bot', PASOS[0].pregunta);
  }, [agregarMensaje]);
  
  // Inicializar conversación al montar
  useEffect(() => {
    if (state.historialMensajes.length === 0) {
      agregarMensaje('bot', PASOS[0].pregunta);
    }
  }, []);
  
  return {
    pasoActual: state.pasoActual,
    historialMensajes: state.historialMensajes,
    isLoading: state.isLoading,
    error: state.error,
    solicitudId: state.solicitudId,
    datosForm: state.datosForm,
    pasoConfig,
    mostrarPaso,
    progreso,
    siguientePaso,
    pasoAnterior,
    resetear,
  };
}
```

### Funciones Utilitarias

```typescript
// Interpolar variables en preguntas (ej: "Hola, {contacto}")
function interpolatePregunta(pregunta: string, datos: any): string {
  return pregunta.replace(/{(\w+)}/g, (match, key) => {
    return datos[key] || match;
  });
}

// Formatear respuesta para visualización
function formatearRespuesta(valor: any): string {
  if (Array.isArray(valor)) {
    return valor.join(', ');
  }
  if (valor instanceof Date) {
    return valor.toLocaleDateString('es-ES');
  }
  return String(valor);
}
```

## INTEGRACIÓN CON REACT HOOK FORM

### Configuración del Formulario

```typescript
const formMethods = useForm({
  mode: 'onChange',  // Validar en cada cambio
  resolver: zodResolver(pasoConfig.validacion),
  defaultValues: {
    [pasoConfig.campoFormulario]: datosForm[pasoConfig.campoFormulario] || '',
  },
});

const { handleSubmit, formState: { errors, isValid } } = formMethods;
```

### Manejo del Submit

```typescript
const onSubmit = handleSubmit(async (data) => {
  const valor = data[pasoConfig.campoFormulario];
  await siguientePaso(valor);
});
```

## MANEJO DE ERRORES

### Estrategias por Tipo

| Escenario | Comportamiento |
|-----------|----------------|
| **Validación falla** | Mostrar error debajo input, NO avanzar |
| **POST inicial falla** | Mostrar toast error, permitir reintentar |
| **PATCH falla (pasos 1-11)** | Log error, continuar (datos locales guardados) |
| **PATCH final falla (paso 12)** | Mostrar error modal, permitir reintentar 3 veces |
| **Red cae a mitad** | Datos en estado local, reintentar al reconectar |

### Recuperación de Sesión (Opcional - Fase 2)

```typescript
// Guardar en localStorage cada X pasos
useEffect(() => {
  if (solicitudId) {
    localStorage.setItem('solicitud_en_progreso', JSON.stringify({
      solicitudId,
      pasoActual,
      datosForm,
      timestamp: Date.now(),
    }));
  }
}, [solicitudId, pasoActual]);

// Recuperar al montar
useEffect(() => {
  const saved = localStorage.getItem('solicitud_en_progreso');
  if (saved) {
    const { solicitudId, pasoActual, datosForm, timestamp } = JSON.parse(saved);
    
    // Si fue hace menos de 24 horas
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      // Mostrar modal: "¿Continuar solicitud anterior?"
      // Si sí: restaurar estado
      // Si no: limpiar localStorage
    }
  }
}, []);
```

## CRITERIOS DE ACEPTACIÓN

### ✅ Flujo Completo
- [ ] Paso 0 crea solicitud en BD
- [ ] Pasos 1-11 actualizan solicitud progresivamente
- [ ] Paso 12 marca solicitud como COMPLETADA
- [ ] Paso 6 (Destino) solo aparece si tipoServicio = NACIONAL
- [ ] Progreso visual funciona (0-100%)

### ✅ Guardado Progresivo
- [ ] Cada respuesta llama a API inmediatamente
- [ ] Si API falla, datos quedan en estado local
- [ ] Usuario puede cerrar y retomar (Fase 2)
- [ ] NO se pierden datos si hay error temporal

### ✅ UX
- [ ] Preguntas con interpolación funcionan (ej: "Hola, {contacto}")
- [ ] Historial de mensajes persiste
- [ ] Scroll automático al último mensaje
- [ ] Indicador de loading al guardar
- [ ] Mensajes de error claros

### ✅ Validación
- [ ] Validación local con Zod antes de enviar
- [ ] Botón "Continuar" deshabilitado si inválido
- [ ] Errores mostrados debajo del input
- [ ] Validaciones específicas por tipo (email, teléfono, etc.)

## PROHIBICIONES

### ❌ NO Hacer
- NO bloquear UI si guardado falla (excepto paso final)
- NO permitir avanzar con validación inválida
- NO perder datos locales si API falla
- NO mostrar stack traces técnicos al usuario
- NO guardar datos sensibles en localStorage sin encriptar

## DEFINICIÓN DE "TERMINADO"

Este prompt está completo cuando:
1. **Configuración de pasos** está definida (`pasos.ts`)
2. **Hook useConversacion** está especificado con toda su lógica
3. **Guardado progresivo** está claramente explicado
4. **Paso condicional** (destino) está implementado
5. **Manejo de errores** tiene estrategias definidas
6. **Recuperación de sesión** (opcional) está planteada

---

**¿La lógica del motor conversacional está clara? ¿Hay algún flujo o caso extremo que requiera más especificación?**
