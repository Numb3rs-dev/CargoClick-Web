# 🎨 Prompts de Arquitectura UI/UX - Sistema de Cotización Conversacional

## 📋 Descripción General

Esta carpeta contiene **5 prompts arquitectónicos modulares** para construir la interfaz de usuario del sistema de cotización B2B con experiencia conversacional.

**Diferencia clave:** Estos NO son solicitudes de código completo. Son **guías arquitectónicas detalladas** que especifican QUÉ construir y CÓMO debe funcionar, permitiendo implementación paso a paso sin recibir código masivo difícil de revisar.

---

## 🎯 Objetivo de los Prompts

Proporcionar pautas claras y detalladas para que un desarrollador (humano o IA) pueda:
1. Entender la arquitectura completa
2. Conocer las responsabilidades de cada componente
3. Implementar módulo por módulo de forma independiente
4. Mantener consistencia en toda la aplicación
5. Cumplir con estándares de calidad y accesibilidad

---

## 📁 Estructura de Prompts

| # | Archivo | Propósito | Cuando Usar |
|---|---------|-----------|-------------|
| 01 | [ARQUITECTURA_COMPONENTES_UI.md](./01_FRONT_ARQUITECTURA_COMPONENTES_UI.md) | Define estructura completa de componentes, estados, métodos y flujo de datos | **PRIMERO** - Antes de escribir cualquier código |
| 02 | [SISTEMA_DISENO_TOKENS.md](./02_FRONT_SISTEMA_DISENO_TOKENS.md) | Establece variables CSS, colores, tipografía y sistema de personalización | **SEGUNDO** - Antes de estilizar componentes |
| 03 | [MOTOR_CONVERSACIONAL.md](./03_FRONT_MOTOR_CONVERSACIONAL.md) | Especifica lógica de flujo paso a paso, guardado progresivo y hooks personalizados | **TERCERO** - Para implementar la lógica del flujo |
| 04 | [COMPONENTES_INPUTS.md](./04_FRONT_COMPONENTES_INPUTS.md) | Detalla 9 tipos de inputs especializados con validaciones | **CUARTO** - Al construir formularios |
| 05 | [ANIMACIONES_TRANSICIONES.md](./05_FRONT_ANIMACIONES_TRANSICIONES.md) | Define animaciones, timing, micro-interacciones y estados visuales | **QUINTO** - Para refinar la experiencia |

---

## 🚀 Flujo de Uso Recomendado

### Fase 1: Comprensión (NO escribir código aún)
```
1. Leer 01_FRONT_ARQUITECTURA_COMPONENTES_UI.md
   → Entender estructura completa
   → Identificar componentes principales
   → Visualizar flujo de datos

2. Leer 02_FRONT_SISTEMA_DISENO_TOKENS.md
   → Entender sistema de colores
   → Conocer tokens CSS disponibles
   → Planear personalización

3. Leer 03_FRONT_MOTOR_CONVERSACIONAL.md
   → Comprender lógica de 13 pasos
   → Entender guardado progresivo
   → Conocer hooks necesarios
```

### Fase 2: Implementación Modular
```
Módulo 1: Sistema de Diseño
├── Crear globals.css con variables
├── Configurar tailwind.config.ts
└── Testear variables con componente dummy

Módulo 2: Estructura Base
├── Crear componentes contenedores (ConversacionCotizacion, ChatContainer)
├── Implementar BotMessage y UserMessage
└── Testear con datos estáticos

Módulo 3: Motor Conversacional
├── Crear configuración de pasos (pasos.ts)
├── Implementar hook useConversacion
├── Integrar con API (POST inicial, PATCH progresivos)
└── Testear flujo completo sin inputs reales

Módulo 4: Componentes de Input
├── Implementar InputWrapper (componente base)
├── Crear 9 tipos de input uno por uno
├── Integrar React Hook Form
└── Testear validaciones

Módulo 5: Animaciones y Polish
├── Agregar animaciones CSS
├── Implementar transiciones
├── Agregar micro-interacciones
└── Optimizar performance
```

---

## 💡 Cómo Usar Cada Prompt

### Con GitHub Copilot o IA Assistant

**❌ MAL (solicitar todo el código):**
```
"Implementa todo el sistema conversacional completo con los 13 pasos"
```

**✅ BIEN (solicitar módulo específico):**
```
"Usando el prompt 01_FRONT_ARQUITECTURA_COMPONENTES_UI.md como referencia,
crea únicamente el componente ConversacionCotizacion con su estado inicial
y estructura. NO implementes todavía la lógica de pasos."
```

**✅ MEJOR (referencia específica):**
```
"Siguiendo la sección 'ConversacionCotizacion (Smart Component)' del prompt 01,
implementa los métodos crearSolicitudInicial() y actualizarSolicitud().
Usa los contratos de API especificados en la sección 'Integración con Backend'."
```

### Con Desarrollador Humano

**Entrega los prompts como documentación técnica:**
1. "Lee estos 5 documentos antes de empezar"
2. "Implementa según las especificaciones"
3. "Los criterios de aceptación están al final de cada prompt"

---

## 🎯 Beneficios de Este Enfoque

### Para Desarrollo con IA
- ✅ Prompts claros previenen malentendidos
- ✅ Implementación modular más fácil de revisar
- ✅ Menos iteraciones necesarias
- ✅ Código más consistente

### Para Desarrollo Humano
- ✅ Documentación técnica completa
- ✅ Decisiones arquitectónicas ya tomadas
- ✅ Especificaciones verificables
- ✅ Guía para nuevos desarrolladores

### Para el Proyecto
- ✅ Calidad consistente
- ✅ Menos deuda técnica
- ✅ Facilita escalabilidad
- ✅ Documentación viva

---

## 📊 Matriz de Decisiones Arquitectónicas

| Decisión | Opción Elegida | Alternativa Rechazada | Razón |
|----------|---------------|----------------------|-------|
| **Gestión de Estado** | useState + useReducer | Redux | Simplicidad, menos boilerplate |
| **Formularios** | React Hook Form + Zod | Formik | Mejor performance, TypeScript nativo |
| **Estilos** | Tailwind + CSS Variables | Styled Components | Personalización dinámica más fácil |
| **Componentes UI** | Custom + shadcn/ui | Material-UI | Control total, peso liviano |
| **Animaciones** | CSS Animations | Framer Motion | Performance, menos dependencias |
| **Validación** | Zod (cliente + servidor) | Yup | Inferencia de tipos TypeScript |
| **IDs únicos** | ULID | UUID | Sortable, más cortos |

---

## 🔧 Stack Tecnológico Completo

```
Frontend Framework:
├── Next.js 15.x (App Router)
├── React 19.x
└── TypeScript 5.x (strict mode)

Estilos:
├── Tailwind CSS 4.x
├── CSS Custom Properties (variables)
└── shadcn/ui (componentes base)

Formularios:
├── React Hook Form 7.x
└── Zod 3.x (validación)

Estado:
├── useState (estado local)
└── useReducer (estado complejo)

Animaciones:
└── CSS Animations (nativas)

Utilidades:
├── ulid (IDs únicos)
└── date-fns (manejo de fechas)
```

---

## ✅ Criterios de Completitud

Un prompt arquitectónico está completo cuando:
- [ ] **Contexto de negocio** está claro (por qué existe)
- [ ] **Especificación funcional** define QUÉ debe hacer
- [ ] **Arquitectura técnica** define CÓMO implementarlo
- [ ] **Criterios de aceptación** son verificables
- [ ] **Restricciones** están documentadas
- [ ] **Prohibiciones** previenen errores comunes
- [ ] **Ejemplos** clarifican conceptos complejos

---

## 🎓 Convenciones de Código

### Nomenclatura
- **Archivos:** `camelCase.tsx`
- **Componentes:** `PascalCase`
- **Funciones:** `camelCase`
- **Tipos/Interfaces:** `PascalCase`
- **Constantes:** `UPPER_SNAKE_CASE`
- **CSS Variables:** `--kebab-case`

### Estructura de Archivos
```
app/cotizar/
├── page.tsx                      # Página principal
├── components/
│   ├── ConversacionCotizacion.tsx  # Smart component
│   ├── ChatContainer.tsx
│   ├── ChatMessages.tsx
│   ├── ChatInput.tsx
│   ├── ProgressIndicator.tsx
│   ├── inputs/
│   │   ├── TextInput.tsx
│   │   ├── EmailInput.tsx
│   │   ├── ... (9 inputs)
│   │   └── shared/
│   │       ├── InputWrapper.tsx
│   │       └── ErrorMessage.tsx
│   └── ui/
│       ├── BotMessage.tsx
│       └── UserMessage.tsx
├── hooks/
│   └── useConversacion.ts
├── config/
│   └── pasos.ts
└── types/
    └── index.ts
```

---

## 🐛 Troubleshooting

### "No sé por dónde empezar"
→ Lee los prompts 01, 02 y 03 en orden. NO empieces a codear hasta entenderlos.

### "El código generado no coincide con el prompt"
→ Referencia secciones específicas del prompt en tu solicitud.

### "¿Puedo modificar la arquitectura?"
→ Sí, pero documenta cambios y razones. Actualiza los prompts.

### "¿Los prompts son inmutables?"
→ No. Evolucionan con el proyecto. Mantén versión en cada prompt.

---

## 📚 Recursos Adicionales

### Documentación de Referencia
- [DEFINICION_FUNCIONAL.md](../definicion-FuncionalyTecnica/DEFINICION_FUNCIONAL.md)
- [DEFINICION_TECNICA.md](../definicion-FuncionalyTecnica/DEFINICION_TECNICA.md)

### Ejemplos de Uso
Ver carpeta `ai-modes/ejemplos/` para patrones de prompts efectivos.

---

## 📝 Control de Versiones de Prompts

| Prompt | Versión | Fecha | Cambios |
|--------|---------|-------|---------|
| 01_FRONT_ARQUITECTURA | 1.0 | 2026-02-19 | Versión inicial |
| 02_FRONT_SISTEMA_DISENO | 1.0 | 2026-02-19 | Versión inicial |
| 03_FRONT_MOTOR_CONVERSACIONAL | 1.0 | 2026-02-19 | Versión inicial |
| 04_FRONT_COMPONENTES_INPUTS | 1.0 | 2026-02-19 | Versión inicial |
| 05_FRONT_ANIMACIONES | 1.0 | 2026-02-19 | Versión inicial |

---

## 🎯 Siguientes Pasos

1. **Lee los 5 prompts en orden** (1-2 horas)
2. **Revisa definiciones funcional y técnica** (contexto completo)
3. **Comienza implementación modular** (Prompt 01 → Prompt 05)
4. **Valida con criterios de aceptación** (al final de cada prompt)
5. **Itera y refina** según feedback

---

## 🤝 Contribuciones

Si encuentras:
- Ambigüedades en especificaciones
- Casos extremos no cubiertos
- Mejores prácticas a incorporar
- Errores o inconsistencias

→ Actualiza el prompt correspondiente y documenta el cambio.

---

**¿Listo para construir una experiencia conversacional excepcional? ¡Empieza con el Prompt 01!** 🚀
