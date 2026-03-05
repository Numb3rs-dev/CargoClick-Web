# 📦 Módulo Operacional — Guía de Implementación

## Propósito

Esta carpeta contiene los **prompts de implementación** organizados en tres fases para construir el **módulo operacional de CargoClick**: manifiestos de carga, reporte al RNDC del Ministerio de Transporte, seguimiento al cliente, integraciones avanzadas y casos especiales.

> **Prerequisito de entrada:** El cotizador (solicitudes, cotizaciones, ajustes comerciales) ya está implementado. Este módulo es la capa operativa que viene después del cierre comercial.

---

## Estructura de fases

```
prompts/operacional/
├── README.md              ← este archivo
├── fase-1/                ← ✅ Implementada — núcleo operativo completo
├── fase-2/                ← Integraciones avanzadas RNDC
└── fase-3/                ← Integraciones con entidades externas (RUNT, SIMIT)
```

### Fase 1 — Núcleo operativo
9 prompts que cubren el flujo base: schema, repositorios, RNDC core, servicios, API y 4 módulos UI.
→ Ver [fase-1/README implícito](./fase-1/) — la Fase 1 ya fue **completamente implementada**.

### Fase 2 — Integraciones avanzadas
7 prompts: SICE-TAC, corrección remesas, aceptación conductor, GPS, factura electrónica.
→ Ver [fase-2/README.md](./fase-2/README.md)

### Fase 3 — Integraciones externas
3 prompts: RUNT Bridge real-time, SIMIT multas, transporte municipal y mercancías peligrosas.
→ Ver [fase-3/README.md](./fase-3/README.md) — **Requiere trámites formales previos.**

---

## Estado actual

| Fase | Estado | Prompts | Descripción |
|------|--------|---------|-------------|
| Fase 1 | ✅ Implementada | 9 | Núcleo completo operativo |
| Fase 2 | 🔵 Lista para implementar | 7 | Requiere Fase 1 en producción |
| Fase 3 | ⏳ Pendiente gestiones | 3 | Requiere trámites externos |

> **Prerequisito:** El cotizador (solicitudes, cotizaciones, ajustes comerciales) ya está implementado. Este módulo es la capa operativa que viene después del cierre comercial.

---

## Arquitectura del módulo

```
CAPA COMERCIAL (ya existe)          CAPA OPERACIONAL (este módulo)
══════════════════════════          ═══════════════════════════════

Solicitud  →  Cotizacion  →  AjusteComercial
                                       ↓
                               NuevoNegocio  ←── Fase 1 (BACK-02/04/05)
                                       ↓
                               Remesa (×N)   ←── procesoid 3 RNDC (Fase 1)
                                       ↓
                           ManifiestoOperativo ←── procesoid 4 RNDC (Fase 1)
                                       ↓
                    SeguimientoCliente + EncuestaPostEntrega (Fase 1)
                                       ↓
              ┌────────────────────────────────────────────────┐
              │ FASE 2                                          │
              │  ├─ FacturaElectronica (procesoid 86)          │
              │  ├─ AceptacionConductor (procesoids 73/75)     │
              │  ├─ NovedadGPS (procesoids 45/46)              │
              │  └─ SiceTac RT (procesoid 26)                  │
              └────────────────────────────────────────────────┘
                                       ↓
              ┌────────────────────────────────────────────────┐
              │ FASE 3                                          │
              │  ├─ RUNT Bridge real-time                      │
              │  ├─ SIMIT multas                               │
              │  └─ Transporte municipal + Merc. peligrosas    │
              └────────────────────────────────────────────────┘
```

---

## Fase 1 — Documentos (implementados)

| # | Archivo | Capa | Alcance |
|---|---------|------|---------|
| BACK-01 | [fase-1/01_BACK_SCHEMA_EXTENSIONES.md](./fase-1/01_BACK_SCHEMA_EXTENSIONES.md) | DB | 9 modelos Prisma nuevos + migraciones |
| BACK-02 | [fase-1/02_BACK_REPOSITORIOS.md](./fase-1/02_BACK_REPOSITORIOS.md) | Repo | Repositorios para cada modelo nuevo |
| BACK-03 | [fase-1/03_BACK_SERVICIO_RNDC.md](./fase-1/03_BACK_SERVICIO_RNDC.md) | Integración | Cliente SOAP RNDC + SyncRndc |
| BACK-04 | [fase-1/04_BACK_SERVICIOS_OPERACIONALES.md](./fase-1/04_BACK_SERVICIOS_OPERACIONALES.md) | Services | Lógica de negocio completa |
| BACK-05 | [fase-1/05_BACK_API_ENDPOINTS.md](./fase-1/05_BACK_API_ENDPOINTS.md) | API | ~41 endpoints (9 grupos) |
| FRONT-01 | [fase-1/06_FRONT_DIRECTORIO.md](./fase-1/06_FRONT_DIRECTORIO.md) | UI | Conductores + vehículos |
| FRONT-02 | [fase-1/07_FRONT_NEGOCIOS.md](./fase-1/07_FRONT_NEGOCIOS.md) | UI | Dashboard operativo + NuevoNegocio |
| FRONT-03 | [fase-1/08_FRONT_OPERACION.md](./fase-1/08_FRONT_OPERACION.md) | UI | Remesas + ManifiestoOperativo |
| FRONT-04 | [fase-1/09_FRONT_CLIENTE.md](./fase-1/09_FRONT_CLIENTE.md) | UI | Seguimiento público + encuesta |

---

## Stack y convenciones

| Decisión | Valor |
|----------|-------|
| Framework | Next.js 15 App Router |
| Lenguaje | TypeScript strict |
| ORM | Prisma + PostgreSQL |
| Validación | Zod |
| Autenticación | Clerk |
| RNDC WS | SOAP sobre HTTP (`axios` + XML manual en ISO-8859-1) |
| Estilos | Tailwind CSS + tokens del design system existente |
| Componentes | shadcn/ui como base |
| Estado global | Ninguno — server components + `useQuery` cliente |
| Respuesta API | `{ data, meta? }` / `{ error, message, fields? }` |

---

## Variables de entorno necesarias (nuevas)

```env
# ─── RNDC — Ministerio de Transporte ──────────────────────────────────────────

# Modo: "test" (default) | "produccion"
RNDC_MODO=test

# URLs
RNDC_WS_URL_TEST=http://plc.mintransporte.gov.co:8080/ws/maestros?wsdl
RNDC_WS_URL=http://rndcws.mintransporte.gov.co:8080/ws/maestros?wsdl

# Credenciales TEST (diferentes a produccion)
RNDC_USUARIO_TEST=usuario_pruebas
RNDC_CLAVE_TEST=clave_pruebas

# Credenciales PRODUCCIÓN
RNDC_USUARIO=usuario_produccion
RNDC_CLAVE=clave_produccion

# Credenciales de la empresa (solo para RNDC_MODO=produccion)
RNDC_NIT_EMPRESA=900123456          # NIT de Transportes Nuevo Mundo
RNDC_USUARIO=usuario_empresa
RNDC_CLAVE=clave_empresa

# ─── RUNT (Fase 3 — dejar placeholder) ────────────────────────────────────────
# RUNT_WS_URL=
# RUNT_TOKEN=
```

> Siempre se trabaja contra el WS real del Ministerio. `RNDC_MODO=test` usa `plc.mintransporte.gov.co`
> con credenciales de prueba separadas de las de producción.

---

## Criterios de completitud del módulo

- [ ] `prisma db migrate dev` ejecuta sin errores
- [ ] `GET /api/health` sigue funcionando
- [ ] Un conductor puede crearse y sincronizarse al RNDC (procesoid 11)
- [ ] Un vehículo puede crearse y sincronizarse al RNDC (procesoid 12)
- [ ] Un NuevoNegocio puede crearse por Ruta A y Ruta B
- [ ] Una Remesa puede crearse → enviarse al RNDC → quedar `estadoRndc=REGISTRADA`
- [ ] Un ManifiestoOperativo puede crearse con remesas registradas → quedar `REGISTRADO`
- [ ] El flow de corrección (`anular` + `corregir`) funciona end-to-end
- [ ] El seguimiento muestra la timeline de hitos al operador
- [ ] La encuesta funciona con URL pública (sin login)
- [ ] `GET /api/rndc/sync-log` muestra todas las llamadas SOAP con su resultado
