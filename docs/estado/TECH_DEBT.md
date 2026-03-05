# Deuda Técnica y Mejoras Pendientes

Generado el 25/02/2026 tras revisión completa del codebase.  
Prioridades: 🔴 Alta · 🟡 Media · 🟢 Baja  
Estados: ✅ Resuelto · ⏳ Pendiente decisión externa · 🔜 Siguiente sesión

---

## ⏳ Requieren decisión o acción previa del equipo
> Estos ítems no se pueden resolver automáticamente. Deben hacerse manualmente
> antes de ejecutar la siguiente sesión de correcciones.

### PENDIENTE-A · Instalar framework de testing
Ningún ítem #2, #3 se puede completar sin esto.
```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom
```
Agregar a `package.json`:
```json
"test": "vitest",
"test:coverage": "vitest run --coverage"
```

### PENDIENTE-B · Crear cuenta Upstash y obtener credenciales
Necesario para ítem #4 (rate limiter distribuido).
1. Crear cuenta en https://upstash.com
2. Crear base de datos Redis
3. Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
4. Agregar al `.env` y a las variables de entorno en Railway

### PENDIENTE-C · Decisión arquitectural Tailwind vs MUI (ítem #13)
No se puede resolver sin definir si se migra a una sola solución.
Requiere revisión del diseño y acuerdo del equipo.

---

## 🔜 Siguiente sesión (requieren contexto especial)

*(vacío - todos los ítems de esta categoría han sido resueltos)*

---

## ✅ Resueltos en esta sesión (25/02/2026)

- [x] #5 — Fix `@default(cuid())` engañoso en schema Prisma
- [x] #6 — Eliminado `any` en route, service y hook
- [x] #7 — Logging consistente en todos los servicios
- [x] #8 — Non-null assertions en variables de entorno
- [x] #9 — Fallback silencioso en `pasoConfig` useMemo
- [x] #10 — `DynamicInput.tsx` marcado como deprecated (activo: `DynamicInputMUI.tsx`)
- [x] #11 — Notificaciones verificadas: ya son fire-and-forget + Promise.allSettled ✓
- [x] #12 — Creado `cotizacionRepository.ts`, `cotizadorEngine` desacoplado de Prisma
- [x] #15 — `.env.example` actualizado con pendientes

## ✅ Resueltos en sesión siguiente (26/02/2026)

- [x] #1 — `useConversacion.ts` dividido en 3 archivos:
  - `conversacionUtils.ts` (~270 líneas): helpers puros (`interpolatePregunta`, `formatearRespuesta`, `limpiarRespuestaConversacional`, `aplicarValorAlForm`, `construirPayloadPaso4`, `construirPayloadExtras`)
  - `solicitudApiClient.ts` (~95 líneas): clientes fetch puros (`apiCrearSolicitud`, `apiPatchSolicitud`, `apiDispararCotizacion`, `apiCargarSolicitud`)
  - `useConversacion.ts` reducido a ~430 líneas — solo orquestación React
  - Código muerto eliminado: `crearSolicitudInicial`, `actualizarSolicitud`, `completarSolicitud`
  - `servicioExpreso` añadido a `DatosFormulario` (faltaba en el tipo)
- [x] #14 — `eslint-disable` ya no es necesario en `useConversacion.ts` (la complejidad quedó en las funciones puras)

---

## 🔴 Alta Prioridad (detalle original)

### 1. Dividir `useConversacion.ts` (872 líneas — viola SRP)
**Archivo:** `app/cotizar/hooks/useConversacion.ts`

El hook hace demasiado: llamadas a API, navegación de pasos, lógica condicional de flujo,
limpieza de texto, reanudación de sesiones, formateo de respuestas. Cualquier cambio
tiene alto riesgo de efecto colateral.

**Acción:** Dividir en al menos tres hooks:
- `useSolicitudApi.ts` — encapsula todos los `fetch` (POST, PATCH, GET)
- `useWizardNavigation.ts` — lógica de avance/retroceso y salto de pasos condicionales
- `useFormState.ts` — gestión del estado del formulario y datosForm

---

### 2. Crear tests para el motor de cotización
**Archivo:** `lib/services/cotizadorEngine.ts`

El motor implementa cálculos regulados por la Resolución MinTransporte 20213040034405
(SISETAC). No hay ningún test en todo el proyecto. Un cambio erróneo en las fórmulas
de CF/CV puede generar cotizaciones incorrectas sin que nadie lo detecte.

**Acción:**
- Crear `lib/services/__tests__/cotizadorEngine.test.ts`
- Casos de prueba: C2 corta distancia, C3 larga distancia, carga refrigerada, valores límite peso
- Instalar `vitest` o `jest` + `@testing-library/react` para hooks

---

### 3. Crear tests para validaciones Zod
**Archivo:** `lib/validations/schemas.ts`

Los schemas son la primera línea de defensa del backend. No tienen tests.

**Acción:** Crear `lib/validations/__tests__/schemas.test.ts` cubriendo:
- Teléfonos válidos e inválidos
- Emails con normalización lowercase
- Fechas en el pasado (deben fallar)
- Campos opcionales vs requeridos

---

### 4. Rate limiter no funciona en despliegue multi-instancia
**Archivo:** `lib/utils/ratelimit.ts`

El store es in-memory. En Railway con múltiples workers (o cualquier despliegue
con N instancias), cada instancia tiene su propio contador. El límite efectivo
es `20 × N` requests/min, no 20.

**Acción:**
```bash
npm install @upstash/ratelimit @upstash/redis
```
Reemplazar la implementación por `@upstash/ratelimit` con un cliente Redis de Upstash.
Requiere agregar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` a `.env`.

---

## 🟡 Media Prioridad

### 5. Inconsistencia de IDs en schema de Prisma vs código
**Archivo:** `prisma/schema.prisma` línea ~55

```prisma
// Actual — engañoso:
id  String  @id @default(cuid())

// El código SIEMPRE genera el ID con ulid() antes de insertar.
// El @default(cuid()) nunca se ejecuta.
```

**Acción:** Cambiar a `@default("")` o eliminar el default, y agregar un comentario
que deje claro que el ID es generado por la aplicación con ulid().

```prisma
/// ID único ULID de 26 caracteres — generado en SolicitudService con ulid()
id  String  @id
```

---

### 6. Uso de `any` en puntos críticos del flujo
**Archivos:**
- `app/api/solicitudes/route.ts` → `(solicitud as any).reanudada`
- `lib/services/solicitudService.ts` → `const dataUpdate: any = { ...datosValidados }`
- `app/cotizar/hooks/useConversacion.ts` → `const sol = body.data as any`

El servicio ya define `Promise<Solicitud & { reanudada?: boolean }>` — el cast en
la ruta API no tiene justificación.

**Acción:**
- En la ruta: tipificar correctamente el retorno del servicio y eliminar `as any`
- En el servicio: reemplazar `const dataUpdate: any` por el tipo Prisma correcto
  (`Prisma.SolicitudUpdateInput`)
- En el hook: definir una interfaz `SolicitudApiResponse` en `types/index.ts` y tipificar

---

### 7. Logging inconsistente — servicios ignoran el logger propio
**Archivos:** `lib/services/solicitudService.ts`, `lib/services/emailService.ts`

```typescript
// Mal — en producción estos logs van a salir igualmente:
console.log('[SolicitudService] Creando solicitud...');
console.info('[SolicitudService] Solicitud creada:', solicitud.id);
console.log('✅ Email cliente enviado:', data?.id);
console.error('❌ Error al enviar email:', error);
```

El `logger.ts` existe para controlar qué se muestra según entorno.

**Acción:** Reemplazar todos los `console.log/info/error` en servicios por
`logger.info(...)` / `logger.error(...)`.

---

### 8. Non-null assertion contradictorio en `emailService.ts`
**Archivo:** `lib/services/emailService.ts`

```typescript
const emailFrom = process.env.EMAIL_FROM!;  // dice "no puede ser undefined"
if (!emailFrom) {                            // pero luego lo verifica — contradicción
  throw new Error('EMAIL_FROM no configurado');
}
```

**Acción:**
```typescript
const emailFrom = process.env.EMAIL_FROM;
if (!emailFrom) {
  throw new Error('EMAIL_FROM no configurado en variables de entorno');
}
```

Igual para `EMAIL_ADMIN`. Eliminar todos los `!` en accesos a `process.env`.

---

### 9. Fallback silencioso en `pasoConfig` useMemo del hook
**Archivo:** `app/cotizar/hooks/useConversacion.ts`

```typescript
if (state.pasoActual < 0 || state.pasoActual >= TOTAL_PASOS) {
  return PASOS[0]; // Temporal para evitar errores ← silencia bugs reales
}
```

Si `pasoActual` llega a un valor inválido inesperado (ej: bug en navegación),
el componente renderiza el paso 0 sin error ni log. El bug queda oculto.

**Acción:** Agregar un log de warning explícito y retornar `null` (o un tipo
union que el componente maneje como estado de guard):
```typescript
if (state.pasoActual < 0) return null;  // landing page — esperado
if (state.pasoActual >= TOTAL_PASOS) return null;  // completado — esperado
```

---

### 10. Coexistencia de `DynamicInput.tsx` y `DynamicInputMUI.tsx`
**Directorio:** `app/cotizar/components/`

Dos versiones del componente de input principal. No está documentado cuál es la
activa, si la otra está deprecated, ni si hay un plan de migración.

**Acción:**
1. Determinar cuál está en uso activo
2. Eliminar o mover a `_deprecated/` la que no se usa
3. Agregar un comentario en el componente activo indicando que es la versión vigente

---

### 11. Notificaciones síncronas en el ciclo request/response
**Archivo:** `lib/services/notificacionService.ts` (llamado desde routes)

El envío de email y WhatsApp ocurre dentro de la respuesta HTTP. Si Resend
tarda 2 segundos, el cliente espera 2 segundos extra. Si falla, puede afectar
la respuesta al usuario.

**Acción a futuro:** Mover notificaciones a una cola async (ej: disparar con
`waitUntil` de Next.js, o una tabla `jobs` en BD procesada por un cron).
Por ahora: asegurar que todos los llamados a notificación estén en bloques
`try/catch` que no bloqueen la respuesta principal (verificar que ya sea así).

---

### 12. `cotizadorEngine.ts` hace queries a Prisma directamente
**Archivo:** `lib/services/cotizadorEngine.ts`

El engine de cotización importa y usa `prisma` directamente, saltando la capa
de repositorios.

**Acción:** Crear `lib/repositories/parametrosCotizacionRepository.ts` con los
métodos necesarios, e inyectarlo (o importarlo) en el engine, manteniendo la
coherencia de capas.

---

## 🟢 Baja Prioridad

### 13. Doble sistema de estilos: Tailwind CSS + MUI (Emotion)
**Impacto:** Bundle size innecesariamente grande, dos APIs de estilos en el mismo proyecto.

**Opciones:**
- A) Migrar componentes MUI a componentes propios con Tailwind (más trabajo, resultado más limpio)
- B) Eliminar Tailwind y usar solo MUI con `sx` prop y theme tokens
- C) Mantener ambos pero definir una regla de equipo: MUI para componentes complejos
  (DatePicker, selects avanzados), Tailwind para layout y utilidades.

---

### 14. `eslint-disable-next-line react-hooks/exhaustive-deps` en hook crítico
**Archivo:** `app/cotizar/hooks/useConversacion.ts`

La supresión de la regla de dependencias en el `useEffect` de reanudación es
aceptable si el efecto es genuinamente de "mount only", pero en un hook de 872
líneas con estado complejo es difícil auditar que sea correcto.

**Acción:** Al dividir el hook (ítem #1), revisar este efecto y documentar
explícitamente por qué se omiten las dependencias.

---

### 15. Agregar `.env.example` más completo
**Archivo:** `.env.example`

Verificar que incluya todas las variables necesarias con valores de ejemplo
y comentarios sobre dónde obtenerlas (Railway, Upstash, Resend, Clerk, etc.).

---

## Checklist de Infraestructura

- [ ] Configurar Redis/Upstash para rate limiting (ítem #4)
- [ ] Agregar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` a Railway
- [ ] Verificar que `prisma migrate deploy` corre correctamente en Railway pre-deploy
- [ ] Revisar si el `@default(cuid())` del schema causó inconsistencias en BD existente (ítem #5)
- [ ] Agregar `vitest` o `jest` al proyecto y configurar `npm run test` en CI

---

## Orden de Ataque Sugerido

1. Tests del cotizador (#2) — mayor riesgo de negocio
2. Dividir `useConversacion.ts` (#1) — mayor deuda de mantenibilidad
3. Rate limiter con Redis (#4) — riesgo de abuso en producción
4. Eliminar `any` en tipos (#6) — mejora confianza del compilador
5. Logging consistente (#7, #8) — limpieza rápida, bajo riesgo
6. Resolver DynamicInput duplicado (#10) — limpieza rápida
7. Repositorio para cotizador (#12) — coherencia arquitectural
8. Resto según disponibilidad
