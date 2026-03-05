# 📚 PROMPTS PARA IMPLEMENTACIÓN BACKEND - GUÍA DE USO

## 🎯 Propósito

Esta carpeta contiene **6 prompts arquitectónicamente estructurados** para implementar el backend completo del Sistema de Cotización de Transporte B2B utilizando Next.js 15, TypeScript, Prisma y PostgreSQL.

Cada prompt está diseñado siguiendo los principios de **Clean Architecture** y sigue el framework de **Prompt Architect** para garantizar:
- ✅ Especificaciones técnicas completas
- ✅ Contexto de negocio claro
- ✅ Criterios de aceptación medibles
- ✅ Implementación progresiva (sin código masivo de una vez)
- ✅ Separación de responsabilidades por capas

---

## 📋 Orden de Implementación

### IMPORTANTE: Ejecutar los prompts en orden secuencial

Cada prompt depende del anterior. No saltarse pasos.

```
Prompt 1: Setup Proyecto
    ↓
Prompt 2: Modelo de Datos
    ↓
Prompt 3: Capa de Repositorio
    ↓
Prompt 4: Capa de Servicios
    ↓
Prompt 5: Integraciones Externas
    ↓
Prompt 6: Capa de API
    ↓
🎉 BACKEND COMPLETADO
```

---

## 📁 Descripción de Cada Prompt

### 01 - SETUP PROYECTO
**Archivo:** `01_BACK_SETUP_PROYECTO.md`

**Objetivo:** Configurar infraestructura base del proyecto

**Entregables:**
- Proyecto Next.js 15 inicializado con TypeScript
- Todas las dependencias instaladas (Prisma, Zod, ulid, Resend)
- Estructura de carpetas completa (Clean Architecture)
- Variables de entorno configuradas
- Prisma inicializado con PostgreSQL

**Duración estimada:** 15-20 minutos

**Validación de completitud:**
- `npm run dev` ejecuta sin errores
- Estructura de carpetas creada
- `.env.example` con todas las variables documentadas

---

### 02 - MODELO DE DATOS Y PRISMA
**Archivo:** `02_BACK_MODELO_DATOS_PRISMA.md`

**Objetivo:** Definir esquema de base de datos PostgreSQL

**Entregables:**
- Schema Prisma completo con modelo `Solicitud`
- 3 enumeraciones (TipoServicio, TipoCarga, EstadoSolicitud)
- Índices en campos frecuentemente consultados
- Migración inicial generada
- Cliente Prisma con tipos TypeScript

**Duración estimada:** 20-30 minutos

**Validación de completitud:**
- `npx prisma migrate dev` ejecuta sin errores
- Tipos TypeScript generados correctamente
- Prisma Studio muestra tabla `solicitudes`

---

### 03 - CAPA DE REPOSITORIO
**Archivo:** `03_BACK_CAPA_REPOSITORIO.md`

**Objetivo:** Implementar Data Access Layer (abstracción de Prisma)

**Entregables:**
- Clase `SolicitudRepository` con 8 métodos públicos
- Operaciones CRUD optimizadas (CREATE, READ, UPDATE, COUNT)
- Queries con índices para performance
- JSDoc completo en todos los métodos
- Singleton exportado

**Duración estimada:** 30-40 minutos

**Validación de completitud:**
- Todos los métodos compilan sin errores TypeScript
- Script de testing manual funciona correctamente

---

### 04 - CAPA DE SERVICIOS
**Archivo:** `04_BACK_CAPA_SERVICIOS.md`

**Objetivo:** Implementar Business Logic Layer con reglas de negocio

**Entregables:**
- Schemas Zod para validación
- Clase `SolicitudService` con 6 métodos públicos
- Clase `NotificacionService` para orquestación
- Todas las reglas de negocio implementadas (RN-01 a RN-07)
- Generación de ULID para IDs únicos
- Cálculo automático de `revisionEspecial`

**Duración estimada:** 60-90 minutos

**Validación de completitud:**
- Validaciones Zod funcionando correctamente
- Reglas de negocio aplicadas (rechazar mudanzas, validar destino, etc.)
- No hay errores de TypeScript

---

### 05 - INTEGRACIONES EXTERNAS
**Archivo:** `05_BACK_INTEGRACIONES_EXTERNAS.md`

**Objetivo:** Implementar envío de emails (Resend) y WhatsApp (Ultramsg)

**Entregables:**
- Clase `EmailService` con 2 métodos (cliente + admin)
- Clase `WhatsAppService` con 1 método (admin)
- Templates HTML para emails (confirmación y notificación)
- Formato de mensaje WhatsApp con emojis
- Manejo de errores sin bloquear flujo principal

**Duración estimada:** 45-60 minutos

**Validación de completitud:**
- Email de prueba enviado correctamente
- WhatsApp de prueba enviado correctamente
- Templates HTML renderizando correctamente

**Nota:** Requiere API keys reales de Resend y Ultramsg

---

### 06 - CAPA DE API (ENDPOINTS REST)
**Archivo:** `06_BACK_CAPA_API_ENDPOINTS.md`

**Objetivo:** Implementar API Routes de Next.js con endpoints REST

**Entregables:**
- `POST /api/solicitudes` - Crear solicitud inicial
- `GET /api/solicitudes/:id` - Obtener solicitud
- `PATCH /api/solicitudes/:id` - Actualizar o completar solicitud
- `GET /api/health` - Health check del sistema
- Response structure estandarizado
- Manejo consistente de errores

**Duración estimada:** 45-60 minutos

**Validación de completitud:**
- Todos los endpoints responden correctamente
- Validación manual con curl o Postman exitosa
- Flujo completo end-to-end funciona

---

## 🏗️ Arquitectura Final

Una vez completados los 6 prompts, tendrás la siguiente arquitectura:

```
proyecto/
├── app/
│   ├── api/
│   │   ├── solicitudes/
│   │   │   ├── route.ts           ✅ POST (crear)
│   │   │   └── [id]/
│   │   │       └── route.ts       ✅ GET, PATCH (obtener/actualizar)
│   │   └── health/
│   │       └── route.ts           ✅ GET (health check)
│   └── layout.tsx
├── lib/
│   ├── db/
│   │   └── prisma.ts              ✅ Cliente Prisma singleton
│   ├── repositories/
│   │   └── solicitudRepository.ts ✅ Data Access Layer
│   ├── services/
│   │   ├── solicitudService.ts    ✅ Business Logic
│   │   ├── notificacionService.ts ✅ Orquestación notificaciones
│   │   ├── emailService.ts        ✅ Integración Resend
│   │   └── whatsappService.ts     ✅ Integración Ultramsg
│   ├── validations/
│   │   └── schemas.ts             ✅ Zod schemas
│   └── utils/
│       ├── emailTemplates.ts      ✅ Templates HTML
│       └── httpResponses.ts       ✅ Response helpers
├── types/
│   └── index.ts                   ✅ Tipos globales
├── prisma/
│   └── schema.prisma              ✅ Modelo de datos completo
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Cómo Usar Esta Guía

### Paso 1: Preparación
1. Lee la **DEFINICION_FUNCIONAL.md** completa
2. Lee la **DEFINICION_TECNICA.md** completa
3. Ten PostgreSQL instalado o cuenta de Supabase lista

### Paso 2: Ejecución Secuencial
Para cada prompt (del 1 al 6):

1. **Leer prompt completo** (entender contexto y objetivos)
2. **Copiar prompt al agente de IA** (GitHub Copilot, Claude, ChatGPT)
3. **Ejecutar implementación** (el agente genera el código)
4. **Validar entregables** (checklist de completitud)
5. **Probar funcionamiento** (comandos de validación)
6. **Confirmar antes de continuar** (no avanzar con errores)

### Paso 3: Testing End-to-End
Una vez completados los 6 prompts:

1. Ejecutar `npm run dev`
2. Probar flujo completo con curl/Postman:
   - Crear solicitud inicial (POST)
   - Actualizar progresivamente (PATCH × 12)
   - Completar solicitud (PATCH con completar:true)
   - Verificar notificaciones enviadas (email + WhatsApp)

---

## ⚙️ Pre-requisitos

### Software Requerido
- Node.js 20 LTS o superior
- PostgreSQL 16.x (local o Supabase)
- Git
- Editor de código con TypeScript support

### Cuentas de Servicios Externos
- **Resend** (emails)
  - Crear cuenta en https://resend.com
  - Obtener API key
  - Verificar dominio (opcional para producción)
  
- **Ultramsg** (WhatsApp)
  - Crear cuenta en https://ultramsg.com
  - Obtener API key e Instance ID
  - Conectar número de WhatsApp

---

## 📊 Tiempo Total Estimado

| Fase | Prompt | Tiempo Estimado |
|------|--------|-----------------|
| 1 | Setup Proyecto | 15-20 min |
| 2 | Modelo de Datos | 20-30 min |
| 3 | Capa Repositorio | 30-40 min |
| 4 | Capa Servicios | 60-90 min |
| 5 | Integraciones | 45-60 min |
| 6 | Capa API | 45-60 min |
| **TOTAL** | - | **3.5 - 5 horas** |

**Nota:** Tiempos para desarrollador familiarizado con Next.js y TypeScript

---

## 🛠️ Troubleshooting

### Problemas Comunes

**Error: "Cannot find module '@/lib/...'"**
- Validar `tsconfig.json` tiene `paths: { "@/*": ["./*"] }`

**Error: "Prisma client not generated"**
- Ejecutar `npx prisma generate`

**Error: "Database connection failed"**
- Validar `DATABASE_URL` en `.env`
- Verificar PostgreSQL está corriendo

**Error: "Resend API key invalid"**
- Validar `RESEND_API_KEY` en `.env`
- Obtener key válida en dashboard de Resend

---

## 📝 Checklist General de Completitud

Al finalizar TODOS los prompts, validar:

- [ ] Proyecto compila sin errores TypeScript (`npx tsc --noEmit`)
- [ ] Servidor inicia correctamente (`npm run dev`)
- [ ] Base de datos conecta (`GET /api/health` retorna 200)
- [ ] POST crear solicitud funciona
- [ ] PATCH actualizar solicitud funciona
- [ ] GET obtener solicitud funciona
- [ ] Email de confirmación se envía
- [ ] Email al admin se envía
- [ ] WhatsApp al admin se envía
- [ ] Todas las reglas de negocio aplicadas (rechazar mudanzas, etc.)
- [ ] Variables de entorno configuradas en `.env`

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zod Docs](https://zod.dev)
- [Resend Docs](https://resend.com/docs)

### Definiciones del Proyecto
- `../proyecto/DEFINICION_FUNCIONAL.md`
- `../proyecto/DEFINICION_TECNICA.md`

---

## 🎓 Principios Aplicados

Estos prompts siguen:
- **Clean Architecture** (separación en capas)
- **SOLID Principles** (Single Responsibility, Dependency Inversion)
- **DRY** (Don't Repeat Yourself)
- **Fail Fast** (validar temprano)
- **Thin Controllers** (lógica en servicios, no en controllers)
- **Repository Pattern** (abstracción de persistencia)
- **Service Layer Pattern** (lógica de negocio centralizada)

---

## ✅ Ventajas de Esta Metodología

1. **Progresiva**: Implementas capa por capa, no todo de golpe
2. **Testeable**: Cada capa se puede validar independientemente
3. **Mantenible**: Código estructurado y documentado
4. **Escalable**: Fácil agregar features sin romper existentes
5. **Profesional**: Sigue mejores prácticas de la industria
6. **Completa**: Incluye desde setup hasta integraciones externas

---

## 🎉 Resultado Final

Al completar los 6 prompts tendrás:
- ✅ Backend REST completo y funcional
- ✅ Base de datos PostgreSQL con modelo robusto
- ✅ Validaciones de negocio exhaustivas
- ✅ Integraciones con Email y WhatsApp
- ✅ Código TypeScript tipado y documentado
- ✅ Arquitectura limpia y mantenible
- ✅ Listo para conectar con frontend

---

**¿Listo para comenzar? 🚀**

Empieza con el **Prompt 1: Setup del Proyecto** y sigue la secuencia.

¡Buena suerte con tu implementación!
