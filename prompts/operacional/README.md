# 📦 Módulo Operacional — Guía de Implementación

## Propósito

Esta carpeta contiene **9 prompts de implementación** para construir el **módulo operacional de CargoClick**: el corazón del negocio donde se gestionan manifiestos de carga, se reporta al RNDC del Ministerio de Transporte y se hace seguimiento al cliente.

> **Prerequisito:** El cotizador (solicitudes, cotizaciones, ajustes comerciales) ya está implementado. Este módulo es la capa operativa que viene después del cierre comercial.

---

## Arquitectura del módulo

```
CAPA COMERCIAL (ya existe)          CAPA OPERACIONAL (este módulo)
══════════════════════════          ═══════════════════════════════

Solicitud  →  Cotizacion  →  AjusteComercial
                                       ↓
                               NuevoNegocio  ←── BACK-02, BACK-04, BACK-05
                                       ↓
                               Remesa (×N)   ←── procesoid 3 RNDC
                                       ↓
                           ManifiestoOperativo ←── procesoid 4 RNDC
                                       ↓
                           SeguimientoCliente + EncuestaPostEntrega
```

---

## Orden de implementación

### IMPORTANTE: respetar el orden. Cada capa depende de la anterior.

```
FASE A: BASE DE DATOS (BACK-01)
  └─ Extender schema Prisma con 9 modelos nuevos

FASE B: REPOSITORIOS (BACK-02)
  └─ Capa de acceso a datos para cada modelo nuevo

FASE C: INTEGRACIÓN RNDC SOAP (BACK-03)
  └─ Cliente SOAP + parser XML + log SyncRndc

FASE D: SERVICIOS DE NEGOCIO (BACK-04)
  └─ Business logic: NuevoNegocio, Remesa, Manifiesto, Orchestration

FASE E: API ENDPOINTS (BACK-05)
  └─ Todos los grupos (conductores, vehículos, negocios, remesas,
     manifiestos, seguimiento, encuesta, rndc-admin, parámetros)

FASE F: UI — DIRECTORIO (FRONT-01)
  └─ Pantallas de conductores y vehículos

FASE G: UI — NEGOCIOS (FRONT-02)
  └─ Dashboard operativo + creación de NuevoNegocio

FASE H: UI — OPERACIÓN (FRONT-03)
  └─ Gestión de remesas y manifiestos dentro de un negocio

FASE I: UI — CLIENTE (FRONT-04)
  └─ Seguimiento público + encuesta post-entrega
```

---

## Documentos

| # | Archivo | Capa | Alcance |
|---|---------|------|---------|
| BACK-01 | [01_BACK_SCHEMA_EXTENSIONES.md](./01_BACK_SCHEMA_EXTENSIONES.md) | DB | 9 modelos Prisma nuevos + migraciones |
| BACK-02 | [02_BACK_REPOSITORIOS.md](./02_BACK_REPOSITORIOS.md) | Repo | Repositorios para cada modelo nuevo |
| BACK-03 | [03_BACK_SERVICIO_RNDC.md](./03_BACK_SERVICIO_RNDC.md) | Integración | Cliente SOAP RNDC + SyncRndc |
| BACK-04 | [04_BACK_SERVICIOS_OPERACIONALES.md](./04_BACK_SERVICIOS_OPERACIONALES.md) | Services | Lógica de negocio completa |
| BACK-05 | [05_BACK_API_ENDPOINTS.md](./05_BACK_API_ENDPOINTS.md) | API | ~41 endpoints (9 grupos) |
| FRONT-01 | [06_FRONT_DIRECTORIO.md](./06_FRONT_DIRECTORIO.md) | UI | Conductores + vehículos |
| FRONT-02 | [07_FRONT_NEGOCIOS.md](./07_FRONT_NEGOCIOS.md) | UI | Dashboard operativo + NuevoNegocio |
| FRONT-03 | [08_FRONT_OPERACION.md](./08_FRONT_OPERACION.md) | UI | Remesas + ManifiestoOperativo |
| FRONT-04 | [09_FRONT_CLIENTE.md](./09_FRONT_CLIENTE.md) | UI | Seguimiento público + encuesta |

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
