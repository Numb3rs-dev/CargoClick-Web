# Conexión Ministerio de Transporte — Investigación y Hoja de Ruta

> **Fecha:** Febrero 2026  
> **Branch:** `conexion-ministerio-de-transporte`  
> **Propósito:** Uso interno — no público  
> **Contexto:** Transportes Nuevo Mundo ya opera con estos sistemas vía otra plataforma. El objetivo es integrarlos directamente en CargoClick para ganar velocidad operativa y automatizar flujos.

---

## Índice

1. [Panorama — qué sistemas existen](#1-panorama--qué-sistemas-existen)
2. [RNDC — Registro Nacional de Despacho de Carga](#2-rndc--registro-nacional-de-despacho-de-carga)
3. [SICE-TAC — Costos Eficientes](#3-sice-tac--costos-eficientes)
4. [RUNT — Registro Único Nacional de Tránsito](#4-runt--registro-único-nacional-de-tránsito)
5. [SIMIT — Multas y sanciones](#5-simit--multas-y-sanciones)
6. [Normativa vigente clave](#6-normativa-vigente-clave)
7. [Novedades críticas 2025–2026](#7-novedades-críticas-20252026)
8. [Hoja de ruta de integración](#8-hoja-de-ruta-de-integración)
9. [Prioridades y decisiones pendientes](#9-prioridades-y-decisiones-pendientes)
10. [Modelo de base de datos](#10-modelo-de-base-de-datos)
11. [Flujo operacional completo](#11-flujo-operacional-completo)
12. [Alineación del modelo con el RNDC — principios y decisiones](#12-alineación-del-modelo-con-el-rndc--principios-y-decisiones)
13. [Web Service RNDC — Especificaciones técnicas reales](#13-web-service-rndc--especificaciones-técnicas-reales)
14. [Proceso 3 — Remesa Terrestre de Carga — Campos XML exactos](#14-proceso-3--remesa-terrestre-de-carga--campos-xml-exactos)
15. [Proceso 4 — Manifiesto Electrónico de Carga — Campos XML exactos](#15-proceso-4--manifiesto-electrónico-de-carga--campos-xml-exactos)
16. [SICE-TAC via Web Service — Consulta de tarifas en tiempo real](#16-sice-tac-via-web-service--consulta-de-tarifas-en-tiempo-real)
17. [Proceso 86 — Factura Electrónica de Transporte](#17-proceso-86--factura-electrónica-de-transporte)
18. [Alcance completo del ecosistema RNDC](#18-alcance-completo-del-ecosistema-rndc)
19. [Capa API — Endpoints a implementar](#19-capa-api--endpoints-a-implementar)

---

## 1. Panorama — qué sistemas existen

El Ministerio de Transporte de Colombia gestiona cuatro sistemas relevantes para una empresa de transporte de carga:

| Sistema | ¿Para qué sirve? | Tipo de acceso | Urgencia |
|---------|-------------------|----------------|----------|
| **RNDC** | Registro de manifiestos de carga (obligatorio por viaje) | Web + login empresa | 🔴 Alta |
| **SICE-TAC** | Costos eficientes del flete (piso legal de precios) | Web público + consulta | 🟡 Media |
| **RUNT** | Consulta de vehículos y conductores | Web services (requiere acuerdo) | 🟡 Media |
| **SIMIT** | Consulta de multas e infracciones | Web pública / API privada | 🟢 Baja |

---

## 2. RNDC — Registro Nacional de Despacho de Carga

### ¿Qué es?
Sistema oficial del Ministerio de Transporte donde cada empresa de transporte debe registrar **cada manifiesto de carga** antes o durante el despacho. Es la bitácora pública del sector.

### URL
`https://sicetac.mintransporte.gov.co/RNDC`  
(También accesible en: `https://plc.mintransporte.gov.co/RNDC`)  
Requiere login con credenciales de la empresa registrada ante el Ministerio.

### Qué información maneja

| Campo | Descripción |
|-------|-------------|
| `NUMMANIFIESTOCARGA` | ID único del manifiesto (ej: M001874) |
| `MANORIGEN` | Ciudad + Departamento de origen |
| `MANDESTINO` | Ciudad + Departamento de destino |
| `MANKILOGRAMOSREMESAS` | Peso total de la carga en kg |
| `VALORFLETEPACTADOVIAJE` | Flete pactado con el transportador |
| `MANVLRTOTFLETE` | Flete neto (after retención ICA ~4%) |
| `FECHAEXPEDICIONMANIFIESTO` | Fecha del despacho |
| `NUMPLACA` | Placa del vehículo |

### Estado actual en CargoClick
La empresa ya tiene **1.156 manifiestos** registrados (marzo–diciembre 2025) en otra plataforma. Este historial es una fuente valiosa para el cotizador de referencia de mercado.

### Tipo de integración disponible
- **Interfaz web**: login manual, formulario por manifiesto
- **API directa**: no documentada públicamente — requiere gestión directa con el Ministerio (Mesa de Servicio)
- **Exportación de datos**: descarga en Excel disponible para el operador

### Qué podría hacer CargoClick
1. **Corto plazo**: automatizar la **captura de datos** desde la exportación Excel del RNDC → alimentar cotizador histórico
2. **Mediano plazo**: usar los datos para construir cotizador de referencia de mercado (cuánto cobra realmente el mercado por ruta/peso)
3. **Largo plazo**: integración directa vía API para registro de manifiestos desde la plataforma (requiere convenio con Ministerio)

---

## 3. SICE-TAC — Costos Eficientes del Transporte

### ¿Qué es?
Sistema de Información de Costos Eficientes para el Transporte Automotor de Carga por Carretera. Calcula el **piso legal del flete**: lo mínimo que se puede cobrar según la metodología oficial.

### URL
`https://plc.mintransporte.gov.co/Runtime/empresa/ctl/SiceTAC/mid/417`

### Estado actual (febrero 2026)
- Última actualización: **2026/02/01** (Resolución 20243040057465 de 2024)
- ACPM de referencia Bogotá: **$11.276/galón**
- Salario mínimo aplicado: **$1.750.905**
- Actualización mensual de costos variables + anual de costos fijos

### Cómo funciona el cálculo
```
FLETE TOTAL = Costo Fijo (CF) + Costo Variable (CV) + Otros Costos (OC)
```

**CF** (costo de tener el camión disponible): capital, salarios, seguros, impuestos, parqueadero, GPS, RTM  
**CV** (costo de hacer el viaje): ACPM, peajes, llantas, lubricantes, filtros, mantenimiento, imprevistos  
**OC** (factores comerciales): administración 5%, comisión conductor 8%, retención ICA 3%, retención fuente 1%

### Tipo de integración disponible
- **Interfaz web pública** (no requiere login para consultar)
- **Sin API oficial publicada** — el sistema usa formulario web (ASP.NET)
- **Parámetros exportables**: listas de rutas, distancias, peajes (Excel descargable)

### Qué ya tiene CargoClick
El cotizador SICE-TAC ya está **definido y documentado** en detalle en `DEFINICION_COTIZADOR_SISETAC.md`. La lógica del cálculo está lista para implementar sin necesidad de conectarse al sistema del Ministerio — se re-implementa la metodología localmente con los mismos parámetros.

### Qué falta
- Ingerir periódicamente los parámetros actualizados (ACPM, peajes, salario mínimo) para mantener el cotizador al día
- Estrategia: scraping mensual del SICE-TAC **o** ingreso manual por parte del operador

---

## 4. RUNT — Registro Único Nacional de Tránsito

### ¿Qué es?
Base de datos nacional de todos los vehículos, conductores, licencias, seguros y empresas de transporte de Colombia. Es el sistema de **identidad y habilitación** del sector. La información de conductores y vehículos **no le pertenece a ninguna empresa** — es patrimonio nacional administrado por el Estado. Cualquier empresa puede consultarla.

### URL
`https://www.runt.gov.co/`

---

### Diferencia crítica: RUNT vs RNDC para conductores

Estos dos sistemas son diferentes y complementarios:

| Aspecto | RNDC procesoid 11 | RUNT |
|---------|-------------------|------|
| **¿Qué hace?** | Registra/actualiza el conductor en el RNDC para poder usarlo en manifiestos | Base de datos nacional de identidad y habilitación |
| **Dirección** | **PUSH** — tú envías datos al RNDC | **PULL** — tú consultas datos que ya existen |
| **¿Qué contiene?** | Licencia, cédula, datos para el manifiesto | Licencias, infracciones, historial de viajes en TODAS las empresas |
| **Histórico en otras empresas** | ❌ No | ✅ Sí — todos los manifiestos donde apareció ese conductor |
| **Disponibilidad** | Solo con credenciales RNDC de la empresa | Portal público gratuito + API para actores habilitados |

> **Clave:** cuando registras un conductor en el RNDC (procesoid 11), el RNDC valida internamente contra el RUNT que ese conductor exista y tenga licencia vigente. Son dos sistemas que se retroalimentan.

---

### ¿Qué datos históricos puedes ver de un conductor?

A través del **RUNT "Histórico conductor"** puedes consultar por número de cédula:

| Dato | Disponible |
|------|------------|
| Nombre completo, tipo y número de documento | ✅ |
| Licencias de conducción: categorías (C1, C2, C3…), fechas expedición y vencimiento | ✅ |
| Examen médico: vigencia y resultado | ✅ |
| **Manifiestos de viaje en que ha participado** — con qué empresas, qué rutas, qué fechas | ✅ |
| Infracciones de tránsito registradas | ✅ (también en SIMIT) |
| Estado de habilitación (activo / suspendido / inhabilitado) | ✅ |
| Vehículos con los que ha operado | ✅ |

> El historial de manifiestos es posible porque **todas las empresas de transporte** legalmente obligadas usan el RNDC. Cuando cualquier empresa registra un manifiesto con ese conductor, queda en el sistema nacional. El RUNT consolida y expone esa información.

---

### ¿Puede usarlo Transportes Nuevo Mundo hoy?

| Canal | Costo | Registro previo | Disponible hoy |
|-------|-------|-----------------|----------------|
| Portal ciudadano web | Gratis | Ninguno | ✅ Sí |
| API / Web service RUNT | Costo según convenio | Proceso formal como actor RUNT | ✅ Sí, con trámite |

**Para el portal ciudadano** (consulta manual): no se necesita nada. Puedes entrar hoy a las URLs de abajo y consultar cualquier conductor por cédula.

**Para la API** (integración automática en CargoClick): la empresa debe registrarse como actor en RUNT. Como TNM ya está inscrita en el RNDC como empresa de transporte, cumple exactamente el perfil que RUNT requiere. El trámite es independiente al del RNDC pero el camino es paralelo.

---

### Consultas disponibles públicamente

| Consulta | URL |
|----------|-----|
| Conductor por documento (datos actuales) | `https://www.runt.gov.co/actores/ciudadano/consulta-por-tipo-de-documento` |
| **Histórico conductor** (manifiestos en todas las empresas) | `https://www.runt.gov.co/actores/ciudadano/consulta-historico-conductor` |
| Vehículo por placa | `https://www.runt.gov.co/actores/ciudadano/consulta-de-vehiculos-por-placa` |
| Histórico vehicular | `https://www.runt.gov.co/actores/ciudadano/consulta-historico-vehicular` |
| Infracciones de tránsito | `https://www.runt.gov.co/actores/ciudadano/consulta-de-infracciones-de-transito` |
| Consulta peso bruto vehículos | `https://www.runt.gov.co/actores/consulta-peso-bruto-vehiculos-rigidos` |

---

### Tipo de integración disponible (API)

- **Web services oficiales** — RUNT tiene servicios SOAP/REST documentados para actores habilitados
- Requiere proceso formal de vinculación como actor del sistema
- Revisar: `Servicios Web – Requisitos de Cumplimiento de Auditoria Seguridad de la Información` (disponible en runt.gov.co)
- **Portal Bridge** (ambiente de pruebas): `https://www.runt.gov.co/runt/appback/portalTestBridgeApp/#/`

---

### Valor para CargoClick

**Flujo de alta de conductor en CargoClick (usando RUNT):**
1. Operador ingresa la cédula del conductor
2. CargoClick consulta RUNT → trae automáticamente: nombre, categoría licencia, vigencia, estado de habilitación
3. Sistema valida: ¿licencia categría C3 o superior? ¿vigente? ¿no inhabilitado?
4. Operador ve el historial de viajes del conductor en otras empresas (contexto de experiencia)
5. Si pasa validación → conductor queda en `Conductor` table local con snapshot del RUNT
6. Al asignar a manifiesto → procesoid 11 sincroniza con RNDC

**Lo que habilita para el negocio:**
- Validar conductores nuevos antes de asignarles un viaje (sin depender del papel)
- Ver experiencia real: cuántos viajes, en qué empresas, con qué frecuencia
- Detectar conductores inhabilitados o con licencia vencida automáticamente
- No depender del conductor para que traiga sus documentos — la fuente es el Estado

---

### Proceso para conectarse a la API

1. Registrarse como actor en RUNT (`https://www.runt.gov.co/actores/empresas-de-transporte`)
2. Solicitar acceso a servicios web a través de Mesa de Servicio Remedy
3. Cumplir auditoría de seguridad de la información
4. Implementar el servicio web en CargoClick

---

## 5. SIMIT — Multas y Sanciones

### ¿Qué es?
Sistema Integrado de Información sobre Multas y Sanciones por Infracciones de Tránsito. Permite consultar si un vehículo o conductor tiene multas pendientes.

### URL
`https://www.simit.org.co/`

### Valor para CargoClick
- Validar si un transportador tiene comparendos antes de asignarlo
- Revisión rápida de antecedentes de tránsito

### Tipo de integración
- Consulta web pública disponible
- No tiene API pública oficial — requiere gestión directa con la Federación Colombiana de Municipios (que opera SIMIT)

---

## 6. Normativa vigente clave

| Norma | Descripción | Impacto en CargoClick |
|-------|-------------|----------------------|
| **Ley 105 de 1993** | Estatuto básico del transporte en Colombia | Marco general de habilitación |
| **Ley 336 de 1996** | Estatuto Nacional del Transporte | Obligaciones de la empresa |
| **Decreto 1079 de 2015** | Decreto Único Reglamentario del sector transporte | Regula manifiesto, empresa, habilitación |
| **Resolución 20213040034405 (2021)** | Protocolo SICE-TAC — metodología de costos | Base del cotizador SISETAC |
| **Resolución 20243040057465 (2024)** | Última actualización SICE-TAC (vigente feb 2026) | Parámetros actuales del cotizador |
| **Decreto 1089 de 2024** | Normalización de vehículos de carga | Venció ago 2025 — ya no aplica para nuevos registros |

### Obligaciones operativas de la empresa (Decreto 1079/2015)
- Registro del manifiesto de carga **antes o durante** el despacho en RNDC
- Habilitación de conductores y vehículos en RUNT
- Mantener SOAT y revisión técnico-mecánica (RTM) vigentes
- Registrar **tiempos logísticos** en el manifiesto vía sistema de monitoreo de flota (novedad nov 2025)

---

## 7. Novedades críticas 2025–2026

### 🔴 CRÍTICO — Tiempos logísticos en RNDC (vigente desde 30 nov 2025)
A partir del 30 de noviembre de 2025, es **obligatorio registrar los tiempos logísticos** (horas de cargue + horas de descargue) en el manifiesto de carga a través del sistema de monitoreo de flota. El RNDC toma estos datos para calcular el sobrecosto por espera usando la tarifa hora del SICE-TAC.

**Impacto en CargoClick**: el formulario de creación de viaje/manifiesto debe incluir campos de:
- Horas totales de cargue (espera + cargue)
- Horas totales de descargue (espera + descargue)

Estos datos pasan al RNDC y pueden generar cobros adicionales al remitente si hay esperas.

### 🟡 IMPORTANTE — ACPM actualizado mensualmente
El precio del ACPM se actualiza cada mes en SICE-TAC. El cotizador debe tener un mecanismo para actualizar este valor sin necesidad de redeploy.

### 🟡 IMPORTANTE — Nueva resolución SICE-TAC (Res. 20243040057465)
Entró en vigencia en 2024. Actualiza costos fijos, tarifas de peajes y metodología. Los parámetros del cotizador actual en `DEFINICION_COTIZADOR_SISETAC.md` deben verificarse contra esta resolución.

---

## 8. Hoja de ruta de integración

> **Contexto actualizado (mar 2026):** El web service SOAP del RNDC está disponible, documentado (ver Sección 13) y se puede usar directamente con las credenciales existentes de Transportes Nuevo Mundo. No requiere convenio especial. Esto adelanta la integración RNDC de "largo plazo" a **Fase 1**.

### Fase 1 — Operaciones core (RNDC + cotizador) 🎯
**Objetivo**: CargoClick reemplaza la plataforma actual — se crean remesas, manifiestos y se reporta al RNDC directamente.

| # | Tarea | Sistema | Requisito previo |
|---|-------|---------|------------------|
| 1 | Cotizador SICE-TAC (motor de cálculo local) + panel actualización mensual | SICE-TAC | Ninguno |
| 2 | Módulo operativo: `NuevoNegocio` + `Remesa` + `ManifiestoOperativo` | Interno | Cotizador |
| 3 | Sync Conductores/Vehículos al RNDC (procesoid 11, 12) | RNDC | Credenciales empresa |
| 4 | Registro automático de Remesas en RNDC (procesoid 3) vía SOAP | RNDC | Paso 3 |
| 5 | Registro automático de Manifiestos en RNDC (procesoid 4) vía SOAP | RNDC | Paso 4 (**remesas deben estar registradas primero**) |
| 6 | Cumplidos: Remesa (procesoid 5) + Manifiesto (procesoid 6) | RNDC | Paso 5 |
| 7 | Seguimiento al cliente + Encuesta post-entrega | Interno | Paso 5 |

### Fase 2 — Factura electrónica + GPS + SICE-TAC tiempo real
| # | Tarea | Sistema | Requisito previo |
|---|-------|---------|------------------|
| 8 | Consulta SICE-TAC en tiempo real (procesoid 26 vía RNDC web service) | SICE-TAC/RNDC | Fase 1 |
| 9 | Aceptación electrónica del conductor (procesoid 73/75) | RNDC | Fase 1 |
| 10 | Corrección de remesas (procesoid 38) | RNDC | Fase 1 |
| 11 | Anulación y recreación de manifiestos (procesoid 32 → 4) | RNDC | Fase 1 |
| 12 | Monitoreo de flota GPS + novedades (procesoid 45, 46) | RNDC | Hardware GPS |
| 13 | Factura Electrónica de Transporte (procesoid 86) → DIAN + RNDC | DIAN + RNDC | Habilitación DIAN |

### Fase 3 — Validación de terceros + mercados especiales
| # | Tarea | Sistema | Requisito previo |
|---|-------|---------|------------------|
| 13 | Consulta vehículo/conductor en RUNT (tiempo real) | RUNT | Proceso formal de vinculación al RUNT |
| 14 | Consulta de multas SIMIT | SIMIT | Gestión con Federación de Municipios |
| 15 | Transporte municipal (procesoid 81, 83) | RNDC | Fase 1 |
| 16 | Mercancías peligrosas (código UN, declaraciones RESPEL) | RNDC | Fase 1 |

---

## 9. Prioridades y decisiones pendientes

### Decisiones a tomar
1. **¿Implementamos el cotizador SICE-TAC localmente o nos conectamos al web del Ministerio?**  
   → Recomendación: implementar localmente (ya tenemos toda la metodología documentada). Más rápido, más control, sin depender del uptime del Ministerio.

2. **¿Hacemos scraping de parámetros SICE-TAC o los ingresa el operador manualmente?**  
   → Para empezar: ingreso manual mensual (5 valores: ACPM, salario, peajes principales). Después automatizar.

3. **¿Cuál es la prioridad real: cotizador o registro de manifiestos?**  
   → Definir si el primer entregable es ayudar a cotizar o ayudar a registrar el despacho (RNDC).

4. **¿Iniciamos el proceso formal con RUNT para acceder a sus web services?**  
   → Proceso largo (auditoría de seguridad requerida). Empezar la solicitud ya si esto es prioridad.

### Próximo paso inmediato sugerido
Construir el **módulo de parámetros operativos** (panel admin simple) donde el operador actualiza mensualmente:
- Precio ACPM
- Salario mínimo
- Tabla de peajes principales

Este módulo alimenta el cotizador SICE-TAC y hace el sistema legalmente alineado con las resoluciones del Ministerio.

---

## Recursos y URLs de referencia

| Recurso | URL |
|---------|-----|
| Portal Logístico MinTransporte | `https://sicetac.mintransporte.gov.co/` |
| SICE-TAC (calculadora) | `https://plc.mintransporte.gov.co/Runtime/empresa/ctl/SiceTAC/mid/417` |
| RNDC | `https://sicetac.mintransporte.gov.co/RNDC` |
| RUNT | `https://www.runt.gov.co/` |
| RUNT Portal Bridge (pruebas) | `https://www.runt.gov.co/runt/appback/portalTestBridgeApp/#/` |
| SIMIT | `https://www.simit.org.co/` |
| INVIAS (vías e incidentes) | `https://hermes.invias.gov.co/carreteras/` |
| SINC (conectividad terrestre) | `https://sitio-sinc-mintransporte-mintransporte.hub.arcgis.com/` |
| Resolución SICE-TAC 2021 | Resolución 20213040034405 |
| Resolución SICE-TAC vigente | Resolución 20243040057465 de 2024 |
| Decreto base del sector | Decreto 1079 de 2015 |

---

## 10. Modelo de base de datos

> **Decisión de arquitectura:** Todo el módulo de integración con el Ministerio vive en **CargoClick-Web** (mismo Next.js, misma PostgreSQL). No se abre un microservicio separado. Si el volumen o los convenios con el Ministerio lo justifican en el futuro, la capa `/api/ministerio/` es fácilmente extractable.

### Contexto del schema existente

El proyecto ya tiene en `prisma/schema.prisma`:
- `Solicitud` — el pedido de transporte del cliente
- `Cotizacion` + `MonthlyParams` + `VehicleParams` + `RouteTerrain` → motor SICE-TAC
- `ManifiestoRndc` → histórico importado de manifiestos reales (referencia de precios de mercado)
- `Distancia` → tabla de distancias viales por par DANE

Los modelos nuevos **no tocan** ninguno de los anteriores (excepto relación opcional `Solicitud → ManifiestoOperativo`).

---

### Diagrama de relaciones (módulo Ministerio)

```
                          ┌────────────────┐       ┌──────────────────┐
  Solicitud (existente)──►│  NuevoNegocio  │◄──────│  AjusteComercial │
  Cotizacion (existente)─►│                │       │  (existente)     │
                          │ id (PK)        │       └──────────────────┘
                          │ solicitudId?   │
                          │ cotizacionId?  │
                          │ clienteNombre? │
                          │ clienteNit?    │
                          └───────┬────────┘
                                  │ 1:N
                          ┌───────▼────────┐
                          │    Remesa      │──────────► RNDC procesoid 3
                          │                │
                          │ nuevoNegocioId │
                          │ manifiestoId?  │
                          │ origenDane     │
                          │ destinoDane    │
                          │ pesoKg         │
                          └───────┬────────┘
                                  │ N:1
                          ┌───────▼────────────────────────────┐
                          │       ManifiestoOperativo           │──► RNDC procesoid 4
                          │                                     │
                          │ nuevoNegocioId                      │
                          │ conductorCedula (FK)                │
                          │ vehiculoPlaca   (FK)                │
                          │ reemplazaManifiestoId? (anulaciones)│
                          └──────┬─────────────┬───────────────┘
                                 │             │
                    ┌────────────▼──┐   ┌──────▼──────────┐
                    │   Conductor   │   │    Vehiculo      │
                    │ cedula (PK)   │   │ placa (PK)       │
                    │ categoriaLic  │   │ soatVigencia     │
                    │ licVigencia   │   │ rtmVigencia      │
                    └──────┬────────┘   └──────┬───────────┘
                           │                   │
                    ┌──────▼───────────────────▼──┐
                    │        ConsultaRunt          │
                    │ (audit log RUNT — append-only)│
                    └─────────────────────────────┘
```

---

### Tabla: `Conductor`

> Directorio operativo de conductores frecuentes. **No reemplaza el RNC nacional** — el Ministerio lleva el registro oficial. Aquí se guarda un shortlist local con la última validación RUNT cacheada.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | cuid | PK interno |
| `cedula` | String UNIQUE | Cédula de ciudadanía — identificador nacional |
| `nombres` | String | Nombres del conductor |
| `apellidos` | String | Apellidos del conductor |
| `categoriaLicencia` | Enum | A1, A2, B1, B2, B3, C1, C2, C3 |
| `licenciaVigencia` | Date? | Fecha de vencimiento de la licencia |
| `telefono` | String? | Contacto |
| `email` | String? | Opcional |
| `activo` | Boolean | ¿Está en el directorio activo? |
| `notas` | Text? | Notas internas |
| `ultimaConsultaRunt` | DateTime? | Cuándo se validó por última vez en RUNT |
| `snapshotRunt` | Json? | Respuesta completa del RUNT en la última consulta |
| `createdAt` / `updatedAt` | DateTime | Auditoría |

**Índices:** `cedula` (unique)  
**Relaciones:** `manifiestos[]`, `consultasRunt[]`

> 💡 **Nota de diseño:** `id` es el PK interno de Prisma (cuid, para joins internos). `cedula` es el **identificador de negocio** — todas las FKs externas referencian `cedula`, no `id` (ej: `ManifiestoOperativo.conductorCedula`). El mismo patrón aplica para `Vehiculo`: las FKs externas referencian `placa`, no `id`.

---

### Tabla: `Vehiculo`

> Vehículos de carga del directorio operativo. Los datos de SOAT, RTM y propietario se traen del RUNT y se guardan localmente para validación rápida offline.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | cuid | PK interno |
| `placa` | String UNIQUE | Placa del vehículo (formato colombiano) |
| `propietarioNombre` | String? | Nombre del propietario / empresa dueña |
| `propietarioId` | String? | NIT o cédula del propietario |
| `configVehiculo` | String? | Configuración SISETAC: C2, C3, C2S2, C2S3, C3S2, C3S3 |
| `capacidadTon` | Decimal? | Capacidad nominal en toneladas |
| `tipoVehiculo` | String? | CAMION, TRACTOCAMION, MINIMULA, DOBLETROQUE, SENCILLO |
| `anioVehiculo` | Int? | Año modelo |
| `soatVigencia` | Date? | Vencimiento SOAT |
| `rtmVigencia` | Date? | Vencimiento RTM (Revisión Técnico-Mecánica) |
| `activo` | Boolean | ¿Está en el directorio activo? |
| `notas` | Text? | Notas internas |
| `ultimaConsultaRunt` | DateTime? | Cuándo se consultó por última vez en RUNT |
| `snapshotRunt` | Json? | Respuesta completa del RUNT en la última consulta |
| `createdAt` / `updatedAt` | DateTime | Auditoría |

**Índices:** `placa` (unique)  
**Relaciones:** `manifiestos[]`, `consultasRunt[]`

---

### Tabla: `ManifiestoOperativo`

> 📌 **Definición completa en Sección 11** — este modelo fue actualizado con el chain `NuevoNegocio → Remesas → ManifiestoOperativo` y todos los campos RNDC requeridos. Ver la definición canónica en la sección de flujo operacional.

---

### Tabla: `ConsultaRunt`

> Log de auditoría de todas las consultas al RUNT. **Append-only** (nunca se edita). Sirve como caché offline y evidencia regulatoria de que se validaron los documentos antes de cada viaje.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | cuid | PK |
| `tipo` | Enum | `VEHICULO` o `CONDUCTOR` |
| `identificador` | String | Placa (si VEHICULO) o cédula (si CONDUCTOR) |
| `respuestaJson` | Json | Snapshot completo de la respuesta del RUNT |
| `realizadaPor` | String? | userId Clerk del operador que hizo la consulta |
| `conductorCedula` | String? | FK a `Conductor` (si tipo=CONDUCTOR) |
| `vehiculoPlaca` | String? | FK a `Vehiculo` (si tipo=VEHICULO) |
| `createdAt` | DateTime | Fecha/hora exacta de la consulta |

**Índices:** `(tipo, identificador)`, `createdAt`

> 💡 **Nota:** `identificador` es la cédula o placa en texto plano al momento de la consulta (campo indexado para búsquedas rápidas del log). `conductorCedula` y `vehiculoPlaca` son las FKs al directorio local (`Conductor`, `Vehiculo`) y pueden ser `null` si el conductor/vehículo aún no está registrado en el directorio. El campo `identificador` evita hacer JOIN solo para filtrar el historial de consultas.

---

### Resumen — qué se agrega vs qué ya existe

| Tabla | Estado | Propósito |
|-------|--------|-----------|
| `ManifiestoRndc` | ✅ YA EXISTE | Histórico importado — referencia de precios de mercado |
| `MonthlyParams` | ✅ YA EXISTE | Parámetros SICE-TAC (ACPM, salario) — ya cubre el caso |
| `RouteTerrain` | ✅ YA EXISTE | Terreno y peajes por corredor — ya cubre el caso |
| `Conductor` | 🆕 NUEVO | Directorio operativo de conductores |
| `Vehiculo` | 🆕 NUEVO | Directorio operativo de vehículos + estado SOAT/RTM |
| `ManifiestoOperativo` | 🆕 NUEVO | Manifiestos que CargoClick genera y envía al RNDC |
| `ConsultaRunt` | 🆕 NUEVO | Log de auditoría de consultas al RUNT |

### Nota sobre SICE-TAC

`MonthlyParams` y `RouteTerrain` ya existen en el schema y cubren exactamente lo que el cotizador SICE-TAC necesita. **No hay que agregar tablas nuevas para SICE-TAC.** Solo asegurarse de que el proceso de actualización mensual de parámetros esté bien documentado y sea fácil de ejecutar para el operador.

---

## 11. Flujo operacional completo

> Esta sección documenta el flujo de extremo a extremo — desde que el cliente llega hasta que da feedback post-entrega. Define los módulos nuevos que deben construirse más allá del cotizador.

### El flujo

```
CLIENTE                         SISTEMA INTERNO                    RNDC (MinTransporte)
══════════════                  ════════════════                   ════════════════════

── RUTA A: Con solicitud web ──────────────────────────────────────────────────────────
[Solicitud UX]                  ← YA EXISTE
 El cliente llena el wizard web
 (tipo, peso, origen, destino)
        ↓
[Cotización SICE-TAC]           ← YA EXISTE
 Precio calculado + ajuste comercial
 ← El comercial cierra
        ↓
── RUTA B: Negocio directo (sin solicitud web) ─────────────────────────────────────────
                                [Operador crea NuevoNegocio directamente]
                                 desde el backoffice, sin wizard de cliente
                                 (cliente frecuente, acuerdo por teléfono, etc.)
        ↓                                ↓
        └────────────────────────────────┘
[NuevoNegocio]                  ← NUEVO — solicitudId? y cotizacionId? son opcionales
 clienteNombre y clienteNit registrados directamente si no hay Solicitud
        ↓
[Remesas]                       ← NUEVO                ──────────► procesoid 3
 Una por cada tipo de carga       Mapeo interno:                    Registrar Remesa
 Valores RNDC con defaults        TipoCarga → RNDC codes           ↓
 sensatos (G, estiba, 4hs…)      tiempos, empaques, sedes    RNDC asigna NUMREMESA
                                                              → numeroRemesaRndc
                                                              → estadoRndc = REGISTRADA

                                ⚠️  Las remesas DEBEN estar REGISTRADAS
                                    en el RNDC antes del siguiente paso

[ManifiestoOperativo]           ← NUEVO                ──────────► procesoid 4
 Agrupa remesas del mismo viaje   XML incluye REMESASMAN             Expedir Manifiesto
 Asigna conductor + vehículo      con los CONSECUTIVOREMESA         ↓
 Define flete, anticipo, ICA      de las remesas ya registradas RNDC asigna NUMMANIFIESTO
                                                              → numeroManifiesto
                                                              → estadoManifiesto = REGISTRADO
                                                              ↓
                                                         procesoid 73/75
                                                         Aceptación electrónica conductor
                                                         → estadoManifiesto = ACEPTADO_CONDUCTOR
        ↓
[SeguimientoCliente]            ← NUEVO
 Notifica al cliente en cada hito
 (despachado → en ruta → entregado)
                                                              ↓
                                                         Al entregar:
                                                         procesoid 5 — Cumplir Remesa (×N)
                                                         procesoid 6 — Cumplir Manifiesto
                                                         → estadoManifiesto = CULMINADO
        ↓
[EncuestaPostEntrega]           ← NUEVO — NPS post-servicio
```

---

### Relación clave: NuevoNegocio → Remesas → Manifiesto

```
NuevoNegocio
│  id, codigoNegocio
│  solicitudId? (opcional), cotizacionId? (opcional)
│  clienteNombre?, clienteNit?   ← para negocios directos sin Solicitud
│  estado, fechaCierre
│
├── Remesa 1: 500 Kg de electrónicos  →  Medellín
├── Remesa 2: 300 Kg de textiles      →  Medellín
└── Remesa 3: 200 Kg de alimentos     →  Bogotá

         ↓ Al despachar

ManifiestoOperativo A (Bogotá → Medellín)
  vehiculo: TRK-001 | conductor: 12345678
  ├── Remesa 1 (electrónicos)
  └── Remesa 2 (textiles)

ManifiestoOperativo B (Bogotá → Bogotá)
  vehiculo: TRK-002 | conductor: 87654321
  └── Remesa 3 (alimentos)
```

> Un `ManifiestoOperativo` agrupa las remesas que van en el mismo camión y viaje.  
> Un `NuevoNegocio` puede generar uno o varios manifiestos dependiendo de cuántos viajes se necesitan.

---

### Módulos nuevos requeridos

#### `NuevoNegocio`

Cierre comercial confirmado. Agrupa todas las cargas (remesas) que el cliente necesita mover en el marco de ese acuerdo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | cuid | PK |
| `codigoNegocio` | String UNIQUE | Consecutivo interno (ej: NEG-2026-0012) |
| `solicitudId` | String? | FK opcional a `Solicitud` — el negocio puede crearse sin wizard web |
| `cotizacionId` | String? | FK opcional a `Cotizacion` — puede haber precio pactado fuera del sistema |
| `ajusteComercialId` | String? | FK a `AjusteComercial` si hubo negociación de precio |
| `clienteNombre` | String? | Nombre del cliente — se copia desde Solicitud o se ingresa directo |
| `clienteNit` | String? | NIT del cliente generador de carga — usado en remesas y factura electrónica |
| `fechaCierre` | DateTime | Cuándo se confirmó el negocio |
| `fechaDespachoEstimada` | Date? | Cuando se planea iniciar el despacho |
| `estado` | Enum | `CONFIRMADO → EN_PREPARACION → EN_TRANSITO → COMPLETADO → CANCELADO` |
| `notas` | Text? | Notas internas del operador |
| `createdAt` / `updatedAt` | DateTime | Auditoría |

**Relaciones:** `remesas[]`, `manifestos[]`, `seguimientos[]`, `encuesta?`

> ⚠️ **Deuda técnica — Fase 2:** `clienteNombre` y `clienteNit` son strings libres sin FK a una tabla `Cliente`. Esto es intencional para Fase 1 (agilidad de implementación). En Fase 2 se recomienda crear una tabla `Cliente` para habilitar: historial de embarques por cliente, condiciones comerciales recurrentes y contactos de notificación precargados.

---

#### `Remesa`

Cada carga individual dentro del `NuevoNegocio`. Corresponde al XML del procesoid 3 del RNDC.

**Principio clave — capa UX vs capa RNDC:** `Solicitud.tipoCarga` usa la terminología del cliente (`CARGA_GENERAL`, `REFRIGERADA`, `CONTENEDOR`, etc.). Al crear la `Remesa` internamente, el sistema mapea esos valores a los campos técnicos del RNDC. La mayoría tienen valores por defecto razonables y solo se cambian cuando el caso es especial.

| Campo | Tipo | Descripción | Campo RNDC |
|-------|------|-------------|------------|
| `id` | cuid | PK | |
| `numeroRemesa` | String UNIQUE | Consecutivo interno (ej: REM-2026-0045) | `CONSECUTIVOREMESA` |
| `nuevoNegocioId` | String | FK a `NuevoNegocio` | |
| `manifiestoOperativoId` | String? | FK a `ManifiestoOperativo` cuando se asigna a un viaje | |
| **— Descripción de la carga —** | | | |
| `descripcionCarga` | String | Descripción comercial de la mercancía (max 60 chars) ej: "Televisores en cajas" | `DESCRIPCIONCORTAPRODUCTO` |
| `codigoAranceladoCarga` | String? | Código Sistema Armonizado ej: `000201` = Trigo (mínimo 4 dígitos del capítulo + partida) | `MERCANCIAREMESA` |
| `pesoKg` | Int | Peso de esta remesa en kilogramos | `CANTIDADCARGADA` |
| `volumenM3` | Decimal? | Volumen en m³ (informativo interno) | |
| `unidadMedidaProducto` | String default `KGM` | `KGM`/`GLL`/`MTQ`/`LTR`/`MLT`/`BLL`/`UN` — relevante solo para granel líquido | `UNIDADMEDIDAPRODUCTO` |
| `cantidadProducto` | Decimal? | Cantidad en unidad comercial (ej: 800 galones) — solo granel líquido | `CANTIDADPRODUCTO` |
| **— Clasificación RNDC (mapeada internamente desde `Solicitud.tipoCarga`) —** | | | |
| `codOperacionTransporte` | String default `G` | `G`=General, `C`=Consolidada, `CC`=Contenedor cargado, `CV`=Contenedor vacío | `CODOPERACIONTRANSPORTE` |
| `codNaturalezaCarga` | String default `G` | `G`=General, `2`=Peligrosa, `R`=Refrigerada, `S`=Semoviente, `E`=Extradimensionada | `CODNATURALEZACARGA` |
| `codigoEmpaque` | Int default `10` | Tipo de empaque externo (10=Estiba, 0=Sin empaque) | `CODTIPOEMPAQUE` |
| **— Remitente —** | | | |
| `tipoIdRemitente` | String default `N` | `C`=Cédula, `N`=NIT, `E`=Extranjero | `CODTIPOIDREMITENTE` |
| `nitRemitente` | String | NIT o cédula de quien envía | `NUMIDREMITENTE` |
| `codSedeRemitente` | String default `1` | Código sede del remitente en el RNDC | `CODSEDEREMITENTE` |
| `empresaRemitente` | String? | Nombre descriptivo del remitente (uso interno) | |
| **— Destinatario —** | | | |
| `tipoIdDestinatario` | String default `N` | `C`=Cédula, `N`=NIT, `E`=Extranjero | `CODTIPOIDDESTINATARIO` |
| `nitDestinatario` | String | NIT o cédula de quien recibe | `NUMIDDESTINATARIO` |
| `codSedeDestinatario` | String default `1` | Código sede del destinatario en el RNDC | `CODSEDEDESTINATARIO` |
| `empresaDestinataria` | String? | Nombre descriptivo del destinatario (uso interno) | |
| **— Propietario de la carga / Póliza —** | | | |
| `tipoIdPropietario` | String default `N` | Tipo ID del dueño de la póliza de seguros | `CODTIPOIDPROPIETARIO` |
| `nitPropietario` | String | NIT del propietario/asegurador (default: NIT de Transportes Nuevo Mundo) | `NUMIDPROPIETARIO` |
| **— Puntos de la remesa —** | | | |
| `origenMunicipio` | String | Nombre ciudad de recogida | |
| `origenDane` | String | Código DANE **8 dígitos** (ej: `76001000` = Cali) | referencia para el manifiesto |
| `destinoMunicipio` | String | Nombre ciudad de entrega | |
| `destinoDane` | String | Código DANE **8 dígitos** (ej: `11001000` = Bogotá) | referencia para el manifiesto |
| `direccionOrigen` | String? | Dirección exacta de recogida | |
| `direccionDestino` | String? | Dirección exacta de entrega | |
| **— Tiempos logísticos (obligatorio RNDC desde nov 2025) —** | | | |
| `fechaHoraCitaCargue` | DateTime? | Cita acordada para el cargue — **requerida antes de enviar al RNDC** | `FECHACITAPACTADACARGUE` + `HORACITAPACTADACARGUE` |
| `fechaHoraCitaDescargue` | DateTime? | Cita acordada para el descargue — **requerida antes de enviar al RNDC** | `FECHACITAPACTADADESCARGUE` + `HORACITAPACTADADESCARGUEREMESA` |
| `horasPactoCarga` | Int default `4` | Horas pactadas de espera en cargue | `HORASPACTOCARGA` |
| `minutosPactoCarga` | Int default `0` | Minutos adicionales de cargue | `MINUTOSPACTOCARGA` |
| `horasPactoDescargue` | Int default `4` | Horas pactadas de espera en descargue | `HORASPACTODESCARGUE` |
| `minutosPactoDescargue` | Int default `0` | Minutos adicionales de descargue | `MINUTOSPACTODESCARGUE` |
| **— Valores —** | | | |
| `valorDeclarado` | Decimal? | Valor comercial de la mercancía en COP | |
| `valorAsegurado` | Decimal? | Valor asegurado ante aseguradora — puede diferir del declarado | `VALORASEGURADO` |
| `ordenServicioGenerador` | String? | Número de orden de compra del cliente (max 20 chars) — referencia para la factura | `ORDENSERVICIOGENERADOR` |
| `instruccionesEspeciales` | Text? | Manejo especial, refrigeración, escolta, etc. (uso interno) | |
| **— Estado RNDC —** | | | |
| `numeroRemesaRndc` | String? | Número asignado por el RNDC al registrar exitosamente | `ingresoid` de la respuesta |
| `estadoRndc` | Enum | `PENDIENTE → ENVIADA → REGISTRADA → ANULADA` | |
| `respuestaRndcJson` | Json? | Snapshot completo de la respuesta del RNDC | |
| **— Estado operativo —** | | | |
| `estado` | Enum | `PENDIENTE → ASIGNADA → EN_TRANSITO → ENTREGADA → NOVEDAD` | |
| `createdAt` / `updatedAt` | DateTime | Auditoría | |

**Índices:** `numeroRemesa`, `nuevoNegocioId`, `manifiestoOperativoId`, `estadoRndc`, `estado`

> 💡 **Coordinación de los dos estados:** `estadoRndc` y `estado` son **independientes** — siguen dimensiones distintas y no se bloquean entre sí.
>
> | Transición | Qué la dispara |
> |-----------|----------------|
> | `estadoRndc`: `PENDIENTE → ENVIADA` | Petición SOAP enviada al RNDC (procesoid 3) |
> | `estadoRndc`: `ENVIADA → REGISTRADA` | RNDC responde con `<ingresoid>` válido |
> | `estadoRndc`: `REGISTRADA → ANULADA` | Anulación vía procesoid 38 (error en la remesa) |
> | `estado`: `PENDIENTE → ASIGNADA` | Remesa asignada a un `ManifiestoOperativo` |
> | `estado`: `ASIGNADA → EN_TRANSITO` | Manifiesto despachado (operador confirma salida) |
> | `estado`: `EN_TRANSITO → ENTREGADA` | Operador registra entrega exitosa |
> | `estado`: `→ NOVEDAD` | Cualquier incidente durante el transporte |
>
> **Regla crítica:** para crear `ManifiestoOperativo`, las remesas que incluye **deben tener** `estadoRndc = REGISTRADA`. El estado operativo `estado` puede estar en `PENDIENTE` o `ASIGNADA` en ese momento.

**Mapeo interno desde `Solicitud.tipoCarga` al crear la Remesa:**

| Enum UX (`Solicitud`) | `codOperacionTransporte` | `codNaturalezaCarga` | Notas |
|-----------------------|--------------------------|----------------------|-------|
| `CARGA_GENERAL` | `G` | `G` | Caso más común |
| `REFRIGERADA` | `G` | `R` | Requiere temperatura de transporte |
| `CONTENEDOR` | `CC` (cargado) / `CV` (vacío) | `G` | Según estado del contenedor |
| `GRANEL_SOLIDO` | `G` | `G` | `codigoEmpaque=0`, sin empaque |
| `GRANEL_LIQUIDO` | `G` | `G` | Requiere `unidadMedidaProducto` + `cantidadProducto` |
| `PELIGROSA`* | `G` | `2` | Requiere `codigoUN`. No enviar `descripcionCarga` al RNDC |

> `PELIGROSA` se puede agregar al enum `TipoCarga` cuando se necesite — el impacto es solo añadir la opción al wizard del cliente.

> Una remesa solo puede estar en un manifiesto a la vez. El manifiesto se crea **después** de tener las remesas registradas en el RNDC (estadoRndc = REGISTRADA).

---

#### `ManifiestoOperativo`

Planilla oficial que se registra ante el Ministerio de Transporte (RNDC). Corresponde a un viaje específico: un vehículo, un conductor, un origen-destino. Agrupa las remesas que van en ese viaje y corresponde al XML del procesoid 4.

| Campo | Tipo | Descripción | Campo RNDC |
|-------|------|-------------|------------|
| `id` | cuid | PK interno | |
| `codigoInterno` | String UNIQUE | Código generado antes del envío (ej: MF-2026-0001) — permite reintentos idempotentes | `NUMMANIFIESTOCARGA` |
| `numeroManifiesto` | String? | Número asignado por el RNDC (null hasta registrar exitosamente) | `ingresoid` de la respuesta |
| `nuevoNegocioId` | String | FK a `NuevoNegocio` que originó el manifiesto | |
| `conductorCedula` | String | FK a `Conductor.cedula` | `NUMIDCONDUCTOR` |
| `vehiculoPlaca` | String | FK a `Vehiculo.placa` | `NUMPLACA` |
| `placaRemolque` | String? | Placa del remolque (si aplica) | `NUMPLACAREMOLQUE` |
| `placaRemolque2` | String? | Placa de segundo remolque (si aplica) | `NUMPLACAREMOLQUE2` |
| `origenMunicipio` | String | Nombre ciudad de origen del viaje | |
| `origenDane` | String | Código DANE **8 dígitos** (ej: `76001000` = Cali) | `CODMUNICIPIOORIGENMANIFIESTO` |
| `destinoMunicipio` | String | Nombre ciudad de destino del viaje | |
| `destinoDane` | String | Código DANE **8 dígitos** (ej: `11001000` = Bogotá) | `CODMUNICIPIODESTINOMANIFIESTO` |
| `pesoTotalKg` | Int | **Campo derivado** — suma de `remesas[].pesoKg`. Se calcula al construir el XML del procesoid 4; no debe almacenarse como campo editable permanente (o mantenerse sincronizado via trigger/computed query) para evitar desincronización con las remesas reales. | |
| `fechaExpedicion` | Date | Fecha de expedición del manifiesto | `FECHAEXPEDICIONMANIFIESTO` |
| `fechaDespacho` | Date | Fecha de salida del vehículo (puede diferir de la expedición) | |
| **— Valores económicos —** | | | |
| `fletePactado` | Decimal | Flete total reportado al RNDC. **≠ `pagoAlConductor`** — el split interno nunca llega al RNDC | `VALORFLETEPACTADOVIAJE` |
| `retencionIca` | Int default `4` | Retención ICA en por mil (estándar: 3–4) | `RETENCIONICAMANIFIESTOCARGA` |
| `valorAnticipo` | Decimal default `0` | Anticipo pagado al transportador antes del viaje | `VALORANTICIPOMANIFIESTO` |
| `municipioPagoSaldo` | String? | DANE 8 dígitos donde se paga el saldo (default = destino) | `CODMUNICIPIOPAGOSALDO` |
| `fechaPagoSaldo` | Date? | Fecha pactada de pago del saldo al transportador | `FECHAPAGOSALDOMANIFIESTO` |
| `responsablePagoCargue` | String default `E` | `E`=Empresa, `T`=Transportador, `G`=Generador | `CODRESPONSABLEPAGOCARGUE` |
| `responsablePagoDescargue` | String default `E` | Quien absorbe el costo de espera en descargue | `CODRESPONSABLEPAGODESCARGUE` |
| **— Aceptación y observaciones —** | | | |
| `aceptacionElectronica` | Boolean default `true` | Campo XML del procesoid 4 — la empresa acepta el manifiesto en nombre del titular (SI/NO). **Distinto** de procesoid 73/75 (firma del conductor vía app, Fase 2). | `ACEPTACIONELECTRONICA` (SI/NO) |
| `observaciones` | Text? | Instrucciones adicionales para el viaje | `OBSERVACIONES` |
| **— Estado y trazabilidad RNDC —** | | | |
| `estadoManifiesto` | Enum | `BORRADOR → ENVIADO → REGISTRADO → ACEPTADO_CONDUCTOR → CULMINADO → ANULADO` | |
| `respuestaRndcJson` | Json? | Snapshot completo de la respuesta del RNDC | |
| `createdAt` / `updatedAt` | DateTime | Auditoría | |

**Relaciones:** `remesas[]`, `conductor`, `vehiculo`, `nuevoNegocio`

**Índices:** `codigoInterno`, `conductorCedula`, `vehiculoPlaca`, `estadoManifiesto`, `fechaDespacho`

**Enum `EstadoManifiestoOp`:**
```
BORRADOR           → creado internamente, aún no enviado
ENVIADO            → petición SOAP enviada, esperando respuesta (timeout posible)
REGISTRADO         → RNDC asignó número de manifiesto
ACEPTADO_CONDUCTOR → conductor firmó electrónicamente vía app (procesoid 73 o 75) — Fase 2
CULMINADO          → remesas y manifiesto cumplidos (procesoid 5 + 6)
ANULADO            → anulado vía procesoid 32 (reemplazado o cancelado)
```

**Campos adicionales para soportar correcciones:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `reemplazaManifiestoId` | String? | FK al manifiesto anterior que fue anulado al crear este |
| `motivoAnulacion` | String? | Motivo de anulación — obligatorio al hacer procesoid 32 |

---

#### Flujo de corrección de Manifiesto ya Registrado en el RNDC

> ⚠️ **Regla RNDC fundamental:** un manifiesto en estado `REGISTRADO` o superior **no puede editarse directamente**. Es inmutable en el RNDC. Para cualquier corrección el procedimiento obligatorio es anular + recrear.

```
Manifiesto con error                    CargoClick                      RNDC
════════════════════                    ══════════                      ════

1. Operador detecta el error
   (placa equivocada, conductor
    incorrecto, flete mal, etc.)
          ↓
2. Operador abre "Corregir manifiesto"   → sistema crea form pre-llenado
   con los datos del manifiesto original    con los datos a corregir
          ↓
3. Operador corrige el dato y confirma
          ↓
4. Sistema anula el original ────────────────────────────────► procesoid 32
   (motivoAnulacion registrado)                                 Anular Manifiesto
   estadoManifiesto = ANULADO                                   ↓
                                                          RNDC confirma anulación
                                                          (manifiesto queda en
                                                           historial como ANULADO)
          ↓
5. Sistema crea nuevo ManifiestoOperativo
   reemplazaManifiestoId = ID del anulado ────────────────► procesoid 4
   Las remesas se reasignan al nuevo                        Nuevo Manifiesto
   estadoManifiesto = BORRADOR → ENVIADO                    ↓
                                                          RNDC asigna nuevo número
                                                          estadoManifiesto = REGISTRADO
```

**Reglas importantes:**
- Las **remesas** NO se anulan ni recrean en el RNDC al corregir el manifiesto — solo se reasignan al nuevo manifiesto internamente
- La excepción es si el error está en **la remesa misma** (peso mal, NIT incorrecto): en ese caso se usa **procesoid 38** (Corregir Remesa) sin tocar el manifiesto
- El manifiesto anulado queda en el RNDC como registro histórico — esto es esperado y no genera sanción

| Error detectado | Qué se anula/corrige | ProcessID |
|----------------|---------------------|----------|
| Conductor equivocado | Manifiesto | 32 → 4 |
| Placa equivocada | Manifiesto | 32 → 4 |
| Añadir o quitar una remesa | Manifiesto | 32 → 4 |
| Flete mal reportado | Manifiesto | 32 → 4 |
| Peso de una remesa incorrecto | Solo esa Remesa | 38 |
| NIT del remitente/destinatario | Solo esa Remesa | 38 |
| Manifiesto completo duplicado | Manifiesto | 32 (sin recrear) |

---

#### `SeguimientoCliente`

Registro de cada hito de estado que se comunica al cliente durante el viaje. Sirve también como log de notificaciones enviadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | cuid | PK |
| `nuevoNegocioId` | String | FK a `NuevoNegocio` |
| `manifiestoOperativoId` | String? | FK al manifiesto específico si aplica |
| `hito` | Enum | `NEGOCIO_CONFIRMADO`, `REMESAS_ASIGNADAS`, `DESPACHADO`, `EN_RUTA`, `EN_DESTINO`, `ENTREGADO`, `NOVEDAD` |
| `descripcion` | String? | Mensaje personalizado para el cliente |
| `ubicacionActual` | String? | Ciudad/lugar donde se reporta el hito |
| `canalNotificacion` | Enum | `WHATSAPP`, `EMAIL`, `PORTAL`, `SMS` |
| `notificadoEn` | DateTime? | Cuándo se envió la notificación |
| `notificadoA` | String? | Email o teléfono al que se notificó |
| `registradoPor` | String? | userId Clerk del operador que registró el hito |
| `createdAt` | DateTime | Timestamp del hito |

---

#### `EncuestaPostEntrega`

Feedback del cliente después de completado el negocio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | cuid | PK |
| `nuevoNegocioId` | String UNIQUE | FK a `NuevoNegocio` (1 encuesta por negocio) |
| `calificacionGeneral` | Int | 1 a 5 estrellas |
| `calificacionTiempos` | Int? | 1 a 5 — ¿llegó en el tiempo prometido? |
| `calificacionTrato` | Int? | 1 a 5 — trato del conductor |
| `calificacionEstadoCarga` | Int? | 1 a 5 — carga llegó en buen estado |
| `comentario` | Text? | Texto libre del cliente |
| `recomendaria` | Boolean? | Net Promoter Score simplificado |
| `enviadoEn` | DateTime? | Cuándo se envió el link de la encuesta al cliente |
| `respondidoEn` | DateTime? | Cuándo completó la encuesta — `null` hasta que el cliente responde |
| `tokenEncuesta` | String UNIQUE | Token único para el link de la encuesta (sin login) |

---

#### `SyncRndc`

Log de auditoría de todas las llamadas al web service del RNDC. **Append-only** — se inserta una fila por cada llamada, tanto exitosa como fallida. Crítico para debugging, reintentos y evidencia operativa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | cuid | PK |
| `sessionId` | String? | Agrupa las llamadas de un mismo flujo (ej: Remesa + Manifiesto del mismo NuevoNegocio) |
| `processId` | Int | Process ID del RNDC (3=Remesa, 4=Manifiesto, 5=CumplirRemesa…) |
| `tipoSolicitud` | Int | Tipo XML (1=enviar, 2=consultar maestros, 3=consultar docs) |
| `entidadTipo` | String | `Remesa` / `ManifiestoOperativo` / `Conductor` / `Vehiculo` |
| `entidadId` | String | ID interno de la entidad que se está registrando |
| `requestXml` | Text | XML enviado al RNDC (sin la contraseña) |
| `responseXml` | Text? | XML de respuesta del RNDC |
| `httpStatus` | Int? | Código HTTP de la respuesta |
| `exitoso` | Boolean | `true` si RNDC respondió con `<ingresoid>` |
| `ingresoidRespuesta` | String? | Número asignado por el RNDC en respuestas exitosas |
| `errorMensaje` | Text? | Descripción del error si `exitoso=false` |
| `duracionMs` | Int? | Tiempo de respuesta del web service en ms |
| `createdAt` | DateTime | Timestamp exacto |

**Índices:** `(entidadTipo, entidadId)`, `processId`, `exitoso`, `createdAt`

---

### Resumen completo de modelos — estado final

| Tabla | Estado | Fase | Módulo |
|-------|--------|------|--------|
| `Solicitud` | ✅ EXISTE | — | Captación UX (terminología del cliente) |
| `Cotizacion` | ✅ EXISTE | — | Motor de cotización SICE-TAC |
| `AjusteComercial` | ✅ EXISTE | — | Negociación y cierre comercial |
| `MonthlyParams` | ✅ EXISTE | — | Parámetros variables SICE-TAC (ACPM, SMLMV) |
| `VehicleParams` | ✅ EXISTE | — | Parámetros por configuración vehicular |
| `RouteTerrain` | ✅ EXISTE | — | Terreno y peajes por corredor vial |
| `ManifiestoRndc` | ⚠️ LEGADO | — | Import CSV (1.156 manifiestos). Texto libre, sin códigos DANE ni RNDC. **No tocar** — el cotizador de referencia de mercado depende de esta tabla hoy. |
| `Distancia` | ✅ EXISTE | — | Distancias viales (DANE 5 dígitos) — puente natural al migrar el cotizador al nuevo modelo |
| `Conductor` | 🆕 NUEVO | Fase 1 | Directorio operativo — RUNT snapshot |
| `Vehiculo` | 🆕 NUEVO | Fase 1 | Directorio operativo — SOAT/RTM snapshot |
| `NuevoNegocio` | 🆕 NUEVO | Fase 1 | Puente comercial → operativo |
| `Remesa` | 🆕 NUEVO | Fase 1 | Cada carga → RNDC procesoid 3 |
| `ManifiestoOperativo` | 🆕 NUEVO | Fase 1 | Planilla de viaje → RNDC procesoid 4 |
| `SyncRndc` | 🆕 NUEVO | Fase 1 | Audit log de todas las llamadas SOAP al RNDC |
| `ConsultaRunt` | 🆕 NUEVO | Fase 1 | Audit log de consultas al RUNT |
| `SeguimientoCliente` | 🆕 NUEVO | Fase 1 | Hitos del viaje visibles al cliente |
| `EncuestaPostEntrega` | 🆕 NUEVO | Fase 1 | NPS / feedback post-servicio |
| `FacturaElectronica` | 🆕 NUEVO | Fase 2 | Factura DIAN + RNDC procesoid 86 |

---

## 12. Alineación del modelo con el RNDC — principios y decisiones

> **Estado:** Los modelos están completos y alineados con el RNDC real. Las secciones 13–18 documentan las especificaciones técnicas exactas extraídas de los manuales oficiales del Ministerio de Transporte (documentos V4 de 2025).

---

### Principio: Capa UX vs Capa RNDC

CargoClick maneja dos niveles de abstracción que **nunca se mezclan**:

| Capa | Modelo | Terminología | Audiencia |
|------|--------|-------------|----------|
| **UX / Comercial** | `Solicitud`, `Cotizacion`, `AjusteComercial` | Granel, Refrigerada, Contenedor, Carga General | Cliente + Comercial |
| **Operativo / RNDC** | `Remesa`, `ManifiestoOperativo` | `CODOPERACIONTRANSPORTE`, `CODNATURALEZACARGA`, `CONSECUTIVOREMESA` | Operador + Ministerio |

El mapeo entre las dos capas ocurre **al crear la Remesa** (proceso interno, no visible al cliente). El campo `Solicitud.tipoCarga` sirve como punto de partida; el operador puede ajustar cuando el caso es especial. Ver tabla de mapeo detallada en la sección `Remesa` de la Sección 11.

---

### Orden obligatorio de registro en el RNDC

El RNDC tiene dependencias estrictas. Romper el orden genera errores de negocio:

```
① SYNC previo (una sola vez por conductor/vehículo)
   Conductor → procesoid 11   |   Vehículo → procesoid 12

② Por cada Remesa del negocio
   Registrar en RNDC → procesoid 3
   ← RNDC devuelve NUMREMESA → guardar en numeroRemesaRndc
   → estadoRndc = REGISTRADA

③ ⚠️ Las Remesas DEBEN estar en estadoRndc=REGISTRADA antes de continuar

④ Crear ManifiestoOperativo
   XML incluye REMESASMAN con los CONSECUTIVOREMESA registrados
   Enviar → procesoid 4
   ← RNDC devuelve NUMMANIFIESTO → guardar en numeroManifiesto
   → estadoManifiesto = REGISTRADO

⑤ Conductor firma electrónicamente
   procesoid 73 (consultar estado) o 75 (delegar al conductor)
   → estadoManifiesto = ACEPTADO_CONDUCTOR

⑥ Al entregar
   procesoid 5 × N remesas — Cumplir Remesa
   procesoid 6 — Cumplir Manifiesto
   → estadoManifiesto = CULMINADO
```

---

### Decisiones de arquitectura tomadas

| Decisión | Razonamiento |
|----------|-------------|
| **Todo en CargoClick-Web monorepo** | Sin microservicio separado. La capa `/api/ministerio/` es extractable si escala. |
| **`codigoInterno` antes del RNDC** | ID generado internamente (MF-2026-0001 / REM-2026-0045) antes de llamar al RNDC. Permite reintentos idempotentes sin duplicar. |
| **Estado `ENVIADO` como puente** | Si el RNDC tarda o hay timeout, la entidad queda en `ENVIADO`. Un job de reconciliación puede consultar y actualizar. |
| **`SyncRndc` append-only** | Cada llamada SOAP queda registrada con request/response (sin contraseñas). Facilita soporte, reintentos y análisis de fallos. |
| **`fletePactado` ≠ `pagoAlConductor`** | El manifiesto RNDC lleva el flete total reportado (`fletePactado`). El split interno (margen vs pago conductor) vive en `AjusteComercial` y nunca va al RNDC. |
| **DANE 8 dígitos en operativo** | `Remesa` y `ManifiestoOperativo` usan DANE de 8 dígitos (`76001000`). `Distancia` usa 5 dígitos (`76001`) — conversión trivial con sufijo `000`. |
| **Defaults sensatos en `Remesa`** | `codOperacionTransporte=G`, `codigoEmpaque=10`, `tipoIdRemitente=N`, `horasPactoCarga=4` — el operador solo ajusta los que no son estándar. |

---

### Mejores prácticas operativas

| Práctica | Detalle |
|----------|---------|
| **No bloquear el despacho por el RNDC** | El camión puede salir mientras el registro queda en `ENVIADO`. El RNDC permite registrar cierto tiempo después del despacho. |
| **Validar SOAT/RTM antes de enviar** | El RNDC puede rechazar un manifiesto si el SOAT del vehículo está vencido. Revisar snapshot RUNT antes de intentar el registro. |
| **Guardar siempre la respuesta** | `respuestaRndcJson` se llena incluso con errores de negocio — facilita soporte y diagnóstico. |
| **`ordenServicioGenerador` desde el inicio** | Si el cliente da una orden de compra, capturarla en la Remesa. Luego se referencia en la Factura Electrónica (Fase 2). Capturarla desde el inicio evita correcciones posteriores. |
| **`valorAsegurado` vs `valorDeclarado`** | `valorDeclarado` = valor comercial para liquidar el flete. `valorAsegurado` = monto de la póliza para reclamaciones — puede ser mayor. El RNDC los trata como campos distintos. |

---

## 13. Web Service RNDC — Especificaciones Técnicas Reales

> **Fuente:** GUIA Uso del Web Service en el RNDC_LC V4.pdf (35 pgs) — documento oficial del Ministerio de Transporte, Grupo de Logística. Versión 4, aprobada 22/06/2023.

---

### URLs de conexión

| Ambiente | URL WSDL |
|----------|----------|
| **Producción primaria** | `http://rndcws.mintransporte.gov.co:8080/ws` |
| **Producción contingencia** | `http://rndcws2.mintransporte.gov.co:8080/ws` |
| **Pruebas (test)** | `http://plc.mintransporte.gov.co:8080/ws` |
| **Portal nuevas remesas (RNDC2)** | `https://rndc2.mintransporte.gov.co` |

**Endpoint SOAP:**
```
http://rndcws.mintransporte.gov.co:8080/soap/IBPMServices
```

**Herramienta de pruebas (wstest):**
```
https://rndc.mintransporte.gov.co/wstest/default.aspx   ← servidor primario
https://rndc.mintransporte.gov.co/wstest/default2.aspx  ← servidor secundario
```

---

### Protocolo

- **Protocolo:** SOAP (Simple Object Access Protocol)
- **Formato de datos:** XML con encoding `ISO-8859-1`
- **Método principal:** `AtenderMensajeRNDC`
- **Parámetro de entrada:** `Request` (string XML)
- **Respuesta exitosa:** XML con `<ingresoid>N</ingresoid>` (consecutivo de radicado)
- **Respuesta error:** XML con mensajes de error

---

### Estructura XML base

```xml
<?xml version='1.0' encoding='ISO-8859-1' ?>
<root>
  <acceso>
    <username>USUARIO_EMPRESA</username>
    <password>CLAVE_EMPRESA</password>
  </acceso>
  <solicitud>
    <tipo>X</tipo>          <!-- ver tabla de tipos abajo -->
    <procesoid>XX</procesoid>
  </solicitud>
  <variables>
    <!-- campos del proceso específico -->
  </variables>
  <documento>
    <!-- solo para consultas (tipo 2, 3) -->
  </documento>
</root>
```

**Respuesta exitosa:**
```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
<root>
  <ingresoid>12345</ingresoid>
</root>
```

---

### Tipos de operación — el campo `<tipo>`

El campo `<tipo>` dentro de `<solicitud>` no es solo 1 o 3 — son **9 tipos documentados** por el Ministerio. Esto es fundamental porque los tipos 2, 3, 5, 6 y 8 son **consultas**, no registros. Todos usan las mismas credenciales RNDC de la empresa, sin costo adicional.

| `<tipo>` | Operación | Descripción |
|----------|-----------|-------------|
| `1` | **Registrar** | Envía información a cualquier proceso (remesas, manifiestos, terceros, cumplidos…) |
| `2` | **Consultar Maestros** | Consulta el diccionario de datos, lista de vehículos propios, lista de terceros registrados |
| `3` | **Consultar Documentos** | Consulta registros de cualquier proceso propio por filtros y rangos de fecha |
| `4` | Consulta Policía | Uso exclusivo para la Policía Nacional — no aplica a empresas |
| `5` | **Consulta Generador de Carga** | Para clientes/generadores consultando sus propias remesas |
| `6` | **Consultar Maestros especiales** | Maestros de referencia (municipios, tipos de empaque, configuraciones vehiculares…) |
| `7` | Crear usuario app | Crear usuario desde la app RNDC del transportador |
| `8` | **Consulta de un conductor** | Busca datos de un conductor por cédula en el RNDC nacional — **cross-empresa** |
| `9` | Consultas GPS | Remesas autorizadas para empresas de monitoreo GPS |

> **Qué implica el tipo=8:** el RNDC confirma explícitamente en su guía oficial este tipo como "Consulta de un conductor". Al usar el mismo web service con las credenciales de la empresa, puedes buscar cualquier conductor por número de cédula y obtener sus datos registrados en el RNDC a nivel nacional. Es la alternativa dentro del mismo ecosistema RNDC sin necesitar el RUNT para una validación básica.

---

### Consultas prácticas con tipo=3 — ejemplos reales de la guía

El tipo=3 permite consultar **tus propios documentos** con filtros variados. Casos de uso confirmados con ejemplos XML en la guía oficial:

**Caso 1 — Consultar si un manifiesto ya fue firmado electrónicamente (procesoid=73):**
```xml
<?xml version='1.0' encoding='ISO-8859-1' ?>
<root>
  <acceso>
    <username>TU_USUARIO</username>
    <password>TU_CLAVE</password>
  </acceso>
  <solicitud>
    <tipo>3</tipo>
    <procesoid>73</procesoid>
  </solicitud>
  <variables>
    INGRESOID,FECHAING,INGRESOIDMANIFIESTO,TIPO,CODIDCONDUCTOR,NUMIDCONDUCTOR,OBSERVACION
  </variables>
  <documento>
    <NUMNITEMPRESATRANSPORTE>TU_NIT</NUMNITEMPRESATRANSPORTE>
  </documento>
  <documentorango>
    <iniFECHAING>'2026/01/01'</iniFECHAING>
    <finFECHAING>'2026/03/31'</finFECHAING>
  </documentorango>
</root>
```
Respuesta incluye: `ingresoid`, `fechaing`, `ingresoidmanifiesto`, `numidconductor`, `observacion`

**Caso 2 — Manifiestos pendientes de aceptación electrónica (procesoid=4):**
```xml
<solicitud>
  <tipo>3</tipo>
  <procesoid>4</procesoid>
</solicitud>
<variables>
  INGRESOID,FECHAING,NUMMANIFIESTOCARGA,NUMIDTITULARMANIFIESTO,NUMPLACA,NUMIDCONDUCTOR
</variables>
<documento>
  <NUMNITEMPRESATRANSPORTE>TU_NIT</NUMNITEMPRESATRANSPORTE>
  <ACEPTACIONELECTRONICA>NULL</ACEPTACIONELECTRONICA>   <!-- NULL = pendientes -->
</documento>
<documentorango>
  <iniFECHAING>'2026/01/01'</iniFECHAING>
  <finFECHAING>'2026/03/31'</finFECHAING>
</documentorango>
```

---

### Qué puedes consultar vía RNDC por tipo de información

| Qué quieres saber | Tipo | ProcessID | Scope |
|-------------------|------|-----------|-------|
| Datos de un conductor por cédula | `8` | `11` | Nacional (todas las empresas) |
| Vehículos registrados por tu empresa | `2` | `12` | Tu empresa |
| Terceros registrados por tu empresa | `2` | `11` | Tu empresa |
| Remesas registradas en un rango de fechas | `3` | `3` | Tu empresa |
| Manifiestos registrados/pendientes | `3` | `4` | Tu empresa |
| Manifiestos pendientes de firma electrónica | `3` | `73` | Tu empresa |
| Remesas cumplidas | `3` | `5` | Tu empresa |
| Configuraciones vehiculares válidas | `6` | `12` | Catálogo nacional |
| Municipios y códigos DANE | `6` | cualquiera | Catálogo nacional |
| Tipos de empaque, naturaleza de carga | `6` | cualquiera | Catálogo nacional |
| Catálogo de tarifas SICE-TAC | `1` | `26` | Nacional |

> **Limitación importante:** los tipos 3, 5 usan `NUMNITEMPRESATRANSPORTE` como filtro — solo ves **los documentos de tu empresa**. Para ver manifiestos de otras empresas donde aparece un conductor, la vía es el tipo=8 (RNDC) o el RUNT (requiere convenio). Ningún sistema expone directamente los documentos privados de otras empresas como consulta libre.

---

### Catálogo completo de Process IDs

| ProcessID | Tipo | Operación | Relevancia CargoClick |
|-----------|------|-----------|----------------------|
| **1** | Registrar | Información de Carga (prefijo a la remesa) | Fase 2 |
| **2** | Registrar | Información de Viaje | Fase 2 |
| **3** | Registrar | **Expedir Remesa Terrestre de Carga** | ⭐ FASE 1 |
| **4** | Registrar | **Expedir Manifiesto de Carga** | ⭐ FASE 1 |
| **5** | Registrar | Cumplir Remesa Terrestre de Carga | Fase 1 |
| **6** | Registrar | Cumplir Manifiesto de Carga | Fase 1 |
| **7** | Anular | Información de Carga | Fase 2 |
| **8** | Anular | Información del Viaje | Fase 2 |
| **9** | Anular | Remesa Terrestre de Carga | Fase 1 |
| **11** | Maestro | Crear/Actualizar Tercero (conductor, propietario, cliente) | ⭐ FASE 1 |
| **12** | Maestro | Crear/Actualizar Vehículo | ⭐ FASE 1 |
| **17** | Maestro | Diccionario de datos | Referencia |
| **26** | Consulta | **SICE-TAC** (tarifas de referencia) | ⭐ YA USADO en cotizador |
| **27** | Maestro | Diccionario de errores | Referencia |
| **28** | Anular | Cumplido de Remesa | Fase 1 |
| **29** | Anular | Cumplido de Manifiesto | Fase 1 |
| **32** | Anular | Manifiesto de Carga | Fase 1 |
| **34** | Consulta | Tarifas/Fletes del Generador de Carga | Fase 3 |
| **38** | Corregir | Remesa | Fase 1 |
| **39** | Registrar | Control en Carretera | Fase 3 |
| **40** | Maestro | Puesto de Control en Carretera | Fase 3 |
| **41** | Anular | Flete del Generador de Carga | Fase 3 |
| **45** | Registrar | Cumplido Inicial de Remesa (GPS) | Fase 2 |
| **46** | Registrar | Novedades de Empresa GPS | Fase 2 |
| **48** | Maestro | Registro Nacional Automotor | Fase 2 |
| **54** | Anular | Cumplido Inicial de Remesa | Fase 2 |
| **73** | Registrar | **Aceptación Electrónica del Manifiesto** | ⭐ FASE 1 |
| **75** | Delegar | Aceptación Electrónica al Conductor | Fase 1 |
| **79** | Cumplido | Viaje Municipal | Fase 3 |
| **81** | Registrar | Registro de Viaje Municipal | Fase 3 |
| **83** | Registrar | Remesa Municipal | Fase 3 |
| **86** | Registrar | **Factura Electrónica de Transporte** | ⭐ FASE 2 |
| **91** | Anular | Registros de Viaje Municipal | Fase 3 |
| **92** | Anular | Remesa Municipal | Fase 3 |
| **93** | Anular | Cumplido de Viaje Municipal | Fase 3 |

---

## 14. Proceso 3 — Remesa Terrestre de Carga — Campos XML exactos

> **Fuente:** Guía Registro Remesa Revisión 01_12_25_GAADS V4.pdf (56 pgs) — documento oficial, aprobado 2025.

---

### XML mínimo (carga general)

```xml
<?xml version='1.0' encoding='ISO-8859-1' ?>
<root>
  <acceso>
    <username>USUARIO_EMPRESA</username>
    <password>CLAVE_EMPRESA</password>
  </acceso>
  <solicitud>
    <tipo>1</tipo>
    <procesoid>3</procesoid>
  </solicitud>
  <variables>
    <NUMNITEMPRESATRANSPORTE>NIT_EMPRESA</NUMNITEMPRESATRANSPORTE>
    <CONSECUTIVOREMESA>REM-2026-0001</CONSECUTIVOREMESA>
    <CODOPERACIONTRANSPORTE>G</CODOPERACIONTRANSPORTE>
    <CODNATURALEZACARGA>G</CODNATURALEZACARGA>
    <MERCANCIAREMESA>000201</MERCANCIAREMESA>
    <DESCRIPCIONCORTAPRODUCTO>TRIGO BLANCO</DESCRIPCIONCORTAPRODUCTO>
    <CANTIDADCARGADA>22000</CANTIDADCARGADA>
    <UNIDADMEDIDACAPACIDAD>1</UNIDADMEDIDACAPACIDAD>
    <CODTIPOEMPAQUE>10</CODTIPOEMPAQUE>
    <CODTIPOIDREMITENTE>N</CODTIPOIDREMITENTE>
    <NUMIDREMITENTE>900123456</NUMIDREMITENTE>
    <CODSEDEREMITENTE>1</CODSEDEREMITENTE>
    <CODTIPOIDDESTINATARIO>N</CODTIPOIDDESTINATARIO>
    <NUMIDDESTINATARIO>800987654</NUMIDDESTINATARIO>
    <CODSEDEDESTINATARIO>1</CODSEDEDESTINATARIO>
    <HORASPACTOCARGA>4</HORASPACTOCARGA>
    <MINUTOSPACTOCARGA>0</MINUTOSPACTOCARGA>
    <HORASPACTODESCARGUE>3</HORASPACTODESCARGUE>
    <MINUTOSPACTODESCARGUE>0</MINUTOSPACTODESCARGUE>
    <CODTIPOIDPROPIETARIO>N</CODTIPOIDPROPIETARIO>
    <NUMIDPROPIETARIO>NIT_EMPRESA</NUMIDPROPIETARIO>
    <CODSEDEPROPIETARIO>1</CODSEDEPROPIETARIO>
    <FECHACITAPACTADACARGUE>14/03/2026</FECHACITAPACTADACARGUE>
    <HORACITAPACTADACARGUE>08:00</HORACITAPACTADACARGUE>
    <FECHACITAPACTADADESCARGUE>15/03/2026</FECHACITAPACTADADESCARGUE>
    <HORACITAPACTADADESCARGUEREMESA>09:00</HORACITAPACTADADESCARGUEREMESA>
  </variables>
</root>
```

---

### Diccionario de campos — Proceso 3 (Remesa)

| Campo XML | Obligatorio | Tipo/Valores | Descripción |
|-----------|-------------|--------------|-------------|
| `NUMNITEMPRESATRANSPORTE` | ✅ | NIT numérico | NIT de la empresa de transporte (Transportes Nuevo Mundo) |
| `CONSECUTIVOREMESA` | ✅ | String max 15 chars | Número interno de la remesa (alfanumérico, único por empresa) |
| `CODOPERACIONTRANSPORTE` | ✅ | `G`/`C`/`CC`/`CV` | G=General, C=Consolidada, CC=Contenedor cargado, CV=Contenedor vacío |
| `CODNATURALEZACARGA` | ✅ | Ver catálogo | G=Carga General, 2=Mercancía Peligrosa, R=Refrigerada, S=Semoviente, E=Extrapesada |
| `MERCANCIAREMESA` | ✅ | String 6 chars | Código armonizado de producto (ej: `000201` = Trigo blanco) — requiere `00` al inicio |
| `DESCRIPCIONCORTAPRODUCTO` | ✅ carga general | String max 60 chars | Descripción del producto. **NO se envía para mercancías peligrosas** |
| `CODIGOUN` | ✅ merc. peligrosa | 4 dígitos numéricos | Código ONU del libro naranja (ej: `1203` = gasolina) |
| `SUBPARTIDA_CODE` | Condicional | 2 dígitos | Tercer nivel codificación armonizada (solo cuando aplique) |
| `CODIGOARANCEL_CODE` | Condicional | 2 dígitos | Cuarto nivel codificación armonizada (solo cuando aplique) |
| `GRUPOEMBALAJEENVASE` | Condicional | `I` / `II` / `III` | Solo para merc. peligrosas con varios grupos de embalaje |
| `ESTADOMERCANCIA` | Condicional | `S` / `L` / `G` | Sólido, Líquido, Gaseoso — solo merc. peligrosas |
| `CANTIDADCARGADA` | ✅ | Numérico | Peso en kilogramos de la mercancía |
| `UNIDADMEDIDACAPACIDAD` | ✅ | `1` | `1` = kilogramos (estándar) |
| `UNIDADMEDIDAPRODUCTO` | Condicional | Ver abajo | Solo obligatorio para granel líquido |
| `CANTIDADPRODUCTO` | Condicional | Numérico | Cantidad en la unidad comercial (galones, litros, etc.) |
| `CODTIPOEMPAQUE` | ✅ | Catálogo numérico | Tipo de empaque (0=Sin empaque, 10=Estiba, etc.) |
| `EMPAQUEPRIMARIO` | Opcional | Código empaque | Código del empaque con contacto directo con mercancía |
| `CODTIPOIDREMITENTE` | ✅ | `C` / `N` / `E` | Tipo ID: C=Cédula, N=NIT, E=Extranjero |
| `NUMIDREMITENTE` | ✅ | Numérico | Documento del remitente (quien envía la carga) |
| `CODSEDEREMITENTE` | ✅ | Numérico | Código de sede del remitente registrada en RNDC |
| `CODTIPOIDDESTINATARIO` | ✅ | `C` / `N` / `E` | Tipo ID del destinatario |
| `NUMIDDESTINATARIO` | ✅ | Numérico | Documento del destinatario (quien recibe la carga) |
| `CODSEDEDESTINATARIO` | ✅ | Numérico | Código de sede del destinatario |
| `CODTIPOIDPROPIETARIO` | ✅ | `C` / `N` | Tipo ID del propietario de la carga (usualmente la empresa de transporte como generador) |
| `NUMIDPROPIETARIO` | ✅ | Numérico | NIT del propietario de la póliza de seguros |
| `CODSEDEPROPIETARIO` | ✅ | Numérico | Sede del propietario |
| `HORASPACTOCARGA` | ✅ | Numérico entero | Horas pactadas para el cargue (decreto tiempos logísticos) |
| `MINUTOSPACTOCARGA` | ✅ | 0-59 | Minutos adicionales del tiempo pactado de cargue |
| `HORASPACTODESCARGUE` | ✅ | Numérico entero | Horas pactadas para el descargue |
| `MINUTOSPACTODESCARGUE` | ✅ | 0-59 | Minutos adicionales del tiempo pactado de descargue |
| `FECHACITAPACTADACARGUE` | ✅ | `DD/MM/AAAA` | Fecha de la cita acordada para el cargue |
| `HORACITAPACTADACARGUE` | ✅ | `HH:MM` (24h) | Hora de la cita para el cargue |
| `FECHACITAPACTADADESCARGUE` | ✅ | `DD/MM/AAAA` | Fecha de la cita acordada para el descargue |
| `HORACITAPACTADADESCARGUEREMESA` | ✅ | `HH:MM` (24h) | Hora de la cita para el descargue |
| `ORDENSERVICIOGENERADOR` | Opcional | String max 20 chars | Número de orden de compra/trabajo del generador de carga |
| `NUMPOLIZATRANSPORTE` | Opcional | String | Número de póliza del seguro de la carga |
| `FECHAVENCIMIENTOPOLIZACARGA` | Opcional | `DD/MM/AAAA` | Fecha de vencimiento de la póliza |
| `COMPANIASEGURO` | Opcional | NIT | NIT de la compañía aseguradora |
| `PERMISOCARGAEXTRA` | Condicional | String | Número de permiso INVIAS (solo carga extradimensionada) |
| `NUMIDGPS` | Opcional | Numérico | Identificación del dispositivo GPS (si aplica) |

**`UNIDADMEDIDAPRODUCTO` valores:**
```
KGM = Kilogramo   |  GLL = Galón    |  MTQ = Metro Cúbico
CMQ = Centímetro³ |  LTR = Litro    |  MLT = Mililitro
BLL = Barril      |  UN  = Unidad
```

---

### Relación con campos internos de CargoClick

| Campo RNDC | Campo en modelo `Remesa` | Notas |
|-----------|--------------------------|-------|
| `NUMNITEMPRESATRANSPORTE` | Config global (NIT Transportes Nuevo Mundo) | |
| `CONSECUTIVOREMESA` | `numeroRemesa` | Se genera internamente (ej: REM-2026-0001) |
| `CODOPERACIONTRANSPORTE` | `tipoCarga` / `operacionTipo` | Nuevo campo a añadir |
| `CODNATURALEZACARGA` | `naturalezaCarga` | Mapeo de valores |
| `MERCANCIAREMESA` | `codigoAranceladoCarga` | Nuevo campo a añadir |
| `DESCRIPCIONCORTAPRODUCTO` | `descripcionProducto` | Nuevo campo (max 60 chars) |
| `CANTIDADCARGADA` | `pesoKg` | Ya existe |
| `NUMIDREMITENTE` (+ tipo) | `nitRemitente` + `tipoIdRemitente` | `tipoId` como nuevo campo |
| `NUMIDDESTINATARIO` (+ tipo) | `nitDestinataria` + `tipoIdDestinatario` | |
| `HORASPACTOCARGA` | `horasPactoCarga` | Nuevo campo (la guía confirma obligatorio) |
| `MINUTOSPACTOCARGA` | `minutosPactoCarga` | Nuevo campo |
| `HORASPACTODESCARGUE` | `horasPactoDescargue` | Nuevo campo |
| `MINUTOSPACTODESCARGUE` | `minutosPactoDescargue` | Nuevo campo |
| `FECHACITAPACTADACARGUE` + `HORACITAPACTADACARGUE` | `fechaHoraCitaCargue` | DateTime |
| `FECHACITAPACTADADESCARGUE` + `HORACITAPACTADADESCARGUEREMESA` | `fechaHoraCitaDescargue` | DateTime |
| N/A | `numeroRemesaRndc` | Asignado por RNDC en respuesta |
| N/A | `estadoRndc` | Estado del registro en RNDC |

---

## 15. Proceso 4 — Manifiesto Electrónico de Carga — Campos XML exactos

> **Fuente:** GUIA Uso del Web Service en el RNDC_LC V4.pdf + FORMATO MANIFIESTO DE CARGA Y ANEXO.xlsx

---

### XML del Manifiesto

```xml
<?xml version='1.0' encoding='ISO-8859-1' ?>
<root>
  <acceso>
    <username>USUARIO_EMPRESA</username>
    <password>CLAVE_EMPRESA</password>
  </acceso>
  <solicitud>
    <tipo>1</tipo>
    <procesoid>4</procesoid>
  </solicitud>
  <variables>
    <NUMNITEMPRESATRANSPORTE>NIT_EMPRESA</NUMNITEMPRESATRANSPORTE>
    <NUMMANIFIESTOCARGA>MF-2026-0001</NUMMANIFIESTOCARGA>
    <CODOPERACIONTRANSPORTE>G</CODOPERACIONTRANSPORTE>
    <FECHAEXPEDICIONMANIFIESTO>01/03/2026</FECHAEXPEDICIONMANIFIESTO>
    <CODMUNICIPIOORIGENMANIFIESTO>76001000</CODMUNICIPIOORIGENMANIFIESTO>
    <CODMUNICIPIODESTINOMANIFIESTO>11001000</CODMUNICIPIODESTINOMANIFIESTO>
    <CODIDTITULARMANIFIESTO>C</CODIDTITULARMANIFIESTO>
    <NUMIDTITULARMANIFIESTO>79616565</NUMIDTITULARMANIFIESTO>
    <NUMPLACA>ABC123</NUMPLACA>
    <NUMPLACAREMOLQUE>XYZ456</NUMPLACAREMOLQUE>
    <CODIDCONDUCTOR>C</CODIDCONDUCTOR>
    <NUMIDCONDUCTOR>12345678</NUMIDCONDUCTOR>
    <VALORFLETEPACTADOVIAJE>3250000</VALORFLETEPACTADOVIAJE>
    <RETENCIONICAMANIFIESTOCARGA>4</RETENCIONICAMANIFIESTOCARGA>
    <VALORANTICIPOMANIFIESTO>1000000</VALORANTICIPOMANIFIESTO>
    <CODMUNICIPIOPAGOSALDO>11001000</CODMUNICIPIOPAGOSALDO>
    <FECHAPAGOSALDOMANIFIESTO>03/03/2026</FECHAPAGOSALDOMANIFIESTO>
    <CODRESPONSABLEPAGOCARGUE>E</CODRESPONSABLEPAGOCARGUE>
    <CODRESPONSABLEPAGODESCARGUE>E</CODRESPONSABLEPAGODESCARGUE>
    <ACEPTACIONELECTRONICA>SI</ACEPTACIONELECTRONICA>
    <OBSERVACIONES>Fragil - Manipular con cuidado</OBSERVACIONES>
    <REMESASMAN procesoid="43">
      <REMESA>
        <CONSECUTIVOREMESA>REM-2026-0001</CONSECUTIVOREMESA>
      </REMESA>
      <REMESA>
        <CONSECUTIVOREMESA>REM-2026-0002</CONSECUTIVOREMESA>
      </REMESA>
    </REMESASMAN>
  </variables>
</root>
```

---

### Diccionario de campos — Proceso 4 (Manifiesto)

| Campo XML | Obligatorio | Tipo/Valores | Descripción | Campo en ManifiestoOperativo |
|-----------|-------------|--------------|-------------|------------------------------|
| `NUMNITEMPRESATRANSPORTE` | ✅ | NIT | NIT Transportes Nuevo Mundo | Config global |
| `NUMMANIFIESTOCARGA` | ✅ | String | Número interno del manifiesto (alfanumérico) | `codigoInterno` |
| `CODOPERACIONTRANSPORTE` | ✅ | `G`/`I`/otros | G=General | Campo nuevo (default G) |
| `FECHAEXPEDICIONMANIFIESTO` | ✅ | `DD/MM/AAAA` | Fecha de expedición del manifiesto | `fechaDespacho` |
| `CODMUNICIPIOORIGENMANIFIESTO` | ✅ | Código DANE 8 dígitos | Municipio de origen del viaje | `origenDane` |
| `CODMUNICIPIODESTINOMANIFIESTO` | ✅ | Código DANE 8 dígitos | Municipio de destino del viaje | `destinoDane` |
| `CODIDTITULARMANIFIESTO` | ✅ | `C` / `N` | Tipo ID del titular del manifiesto | Campo en tabla Conductor |
| `NUMIDTITULARMANIFIESTO` | ✅ | Numérico | Cédula/NIT del titular del manifiesto | `conductorCedula` |
| `NUMPLACA` | ✅ | String | Placa del vehículo | `vehiculoPlaca` |
| `NUMPLACAREMOLQUE` | Opcional | String | Placa del remolque si aplica | Campo nuevo en ManifiestoOperativo |
| `NUMPLACAREMOLQUE2` | Opcional | String | Placa del segundo remolque | Campo nuevo |
| `CODIDCONDUCTOR` | ✅ | `C` / `N` | Tipo ID del conductor | Campo en tabla Conductor |
| `NUMIDCONDUCTOR` | ✅ | Numérico | Cédula del conductor del vehículo | `conductorCedula` |
| `CODIDCONDUCTOR2` | Opcional | `C` | Tipo ID segundo conductor | |
| `NUMIDCONDUCTOR2` | Opcional | Numérico | Cédula segundo conductor | |
| `VALORFLETEPACTADOVIAJE` | ✅ | Numérico COP | Flete total pactado con el transportador | `fletePactado` |
| `RETENCIONICAMANIFIESTOCARGA` | ✅ | Numérico (promedio 3-4) | Retención ICA en promedio 3-4 por mil | Campo nuevo (default 4) |
| `VALORANTICIPOMANIFIESTO` | Opcional | Numérico COP | Valor del anticipo pagado | Campo nuevo |
| `CODMUNICIPIOPAGOSALDO` | ✅ | Código DANE | Municipio donde se paga el saldo | Campo nuevo |
| `FECHAPAGOSALDOMANIFIESTO` | ✅ | `DD/MM/AAAA` | Fecha pactada de pago del saldo | Campo nuevo |
| `CODRESPONSABLEPAGOCARGUE` | ✅ | `E` / `T` / `G` | E=Empresa, T=Transportador, G=Generador | Campo nuevo (default E) |
| `CODRESPONSABLEPAGODESCARGUE` | ✅ | `E` / `T` / `G` | Quien paga el descargue | Campo nuevo (default E) |
| `ACEPTACIONELECTRONICA` | ✅ | `SI` / `NO` | Aceptación digital del manifiesto | Default SI |
| `OBSERVACIONES` | Opcional | String | Instrucciones adicionales para el viaje | `notas` |
| `REMESASMAN` | ✅ | Array de remesas | Lista de remesas asociadas al manifiesto (procesoid="43") | Relación `remesas[]` |

**Estructura de `REMESASMAN`:**
```xml
<REMESASMAN procesoid="43">
  <REMESA>
    <CONSECUTIVOREMESA>REM-2026-0001</CONSECUTIVOREMESA>
  </REMESA>
  <!-- una por cada remesa del viaje -->
</REMESASMAN>
```

---

### Formato del Manifiesto Impreso (Excel oficial)

El manifiesto tiene **dos hojas**:

**Hoja "Manifiesto"** (documento principal):
- Datos de la empresa de transporte (nombre, NIT, dirección, teléfono)
- Número de manifiesto + número de autorización RNDC
- Fecha expedición + fecha/hora radicación
- Origen y destino del viaje
- Titular del manifiesto (cédula, nombre, dirección, teléfono, ciudad)
- Vehículo (placa, marca, placa remolque/s, configuración, peso vacío, SOAT, vencimiento)
- Conductor (nombre, cédula, dirección, teléfono, licencia, ciudad)
- Conductor 2 (opcional)
- Poseedor/Tenedor del vehículo (cédula, nombre, dirección)
- Por cada remesa: Nro, unidad medida, cantidad, naturaleza carga, empaque, remitente, destinatario
- Valores: flete total, retención fuente, retención ICA, flete neto, anticipo, saldo
- Lugar de pago, fecha de pago
- Responsable cargue, responsable descargue
- Observaciones
- Firma digital titular + firma digital conductor

**Hoja "Anexo"** (tiempos logísticos por remesa):
- Placa del vehículo
- Nombre del conductor + C.C.
- Por cada remesa: horas pactadas cargue/descargue, llegada/salida cargue, llegada/salida descargue
- Firmas: remitente, conductor (cargue), destinatario, conductor (descargue)

---

### Campos adicionales identificados para `ManifiestoOperativo`

Comparando el XML con el modelo actual, faltan estos campos:

| Campo nuevo | Tipo | Descripción |
|-------------|------|-------------|
| `placaRemolque` | String? | Placa del remolque si aplica |
| `placaRemolque2` | String? | Segunda placa de remolque |
| `titularManifiestoId` | String | Puede ser diferente al conductor (titular = dueño póliza) |
| `retencionIca` | Int | Retención ICA en por mil (default 4) |
| `valorAnticipo` | Decimal? | Anticipo al transportador |
| `municipioPagoSaldo` | String? | Donde se paga el saldo |
| `fechaPagoSaldo` | Date? | Cuando se paga el saldo |
| `responsablePagoCargue` | Enum? | E=Empresa, T=Transportador, G=Generador |
| `responsablePagoDescargue` | Enum? | E=Empresa, T=Transportador, G=Generador |
| `aceptacionElectronica` | Boolean | Default true |

---

## 16. SICE-TAC via Web Service — Consulta de Tarifas

> **Fuente:** GUIA CONSULTA SICETAC- WEB SERVICE.pdf — documento oficial agosto 2025.

Este proceso ya está implícitamente **en uso en el cotizador de CargoClick** (los parámetros SICE-TAC se leen de la DB). Sin embargo, ahora podemos consultar directamente el SICE-TAC en tiempo real usando el web service del RNDC.

---

### XML de consulta SICE-TAC

```xml
<?xml version='1.0' encoding='ISO-8859-1' ?>
<root>
  <acceso>
    <username>USUARIO</username>
    <password>CLAVE</password>
  </acceso>
  <solicitud>
    <tipo>6</tipo>
    <procesoid>26</procesoid>
  </solicitud>
  <documento>
    <PERIODO>'202603'</PERIODO>              <!-- AñoMes YYYYMM -->
    <CONFIGURACIONESID>'3S3'</CONFIGURACIONESID>  <!-- tipo de vehículo -->
    <CONDICIONCARGAID>'1'</CONDICIONCARGAID>  <!-- 1=Cargado, 2=Vacío -->
    <ORIGEN>'76001000'</ORIGEN>              <!-- código DANE Cali -->
    <DESTINO>'11001000'</DESTINO>            <!-- código DANE Bogotá -->
  </documento>
</root>
```

**Respuesta con todos los campos:**
```xml
<root>
  <documento>
    <periodo>202603</periodo>
    <fechaingreso>20260301</fechaingreso>
    <origen>76001000</origen>
    <nomorigen>CALI VALLE DEL CAUCA</nomorigen>
    <destino>11001000</destino>
    <nomdestino>BOGOTA BOGOTA D. C.</nomdestino>
    <condicioncarga>CARGADO</condicioncarga>
    <configuracion>3S3</configuracion>
    <tipocarga>1</tipocarga>
    <nombretipocarga>Carga General</nombretipocarga>
    <unidadtransporte>1</unidadtransporte>
    <nombreunidadtransporte>TRACTOCAMION</nombreunidadtransporte>
    <kilometros>480</kilometros>
    <valormoviliza>3450000</valormoviliza>    <!-- flete total (COP) -->
    <valorhora>85000</valorhora>             <!-- valor por hora de espera -->
    <horasrecorrido>11.5</horasrecorrido>    <!-- tiempo estimado viaje -->
    <viaestandar>SI</viaestandar>
    <rutasid>106</rutasid>
    <via>BUENAVENTURA,CALI,PALMIRA,BUGA,IBAGUE,BOGOTA</via>
  </documento>
</root>
```

---

### Configuraciones de vehículo disponibles

| Código | Descripción | Capacidad típica |
|--------|-------------|------------------|
| `3S3` | Tractocamión 3 ejes + semiremolque 3 ejes | 34 tons |
| `3S2` | Tractocamión 3 ejes + semiremolque 2 ejes | 28 tons |
| `2S3` | Tractocamión 2 ejes + semiremolque 3 ejes | 30 tons |
| `2S2` | Tractocamión 2 ejes + semiremolque 2 ejes | 25 tons |
| `3` | Camión 3 ejes | 16 tons |
| `2` | Camión 2 ejes (PBV > 10,500 kg) | 8-10 tons |
| `2L1` | Camión 2 ejes liviano PBV 9,001-10,500 kg | 5-6 tons |
| `2L2` | Camión 2 ejes liviano PBV 8,001-9,000 kg | 4-5 tons |
| `2L3` | Camión 2 ejes liviano PBV 7,500-8,000 kg | 3-4 tons |
| `V2` | Volqueta 2 ejes | 12 tons |
| `V3` | Volqueta 3 ejes | 18 tons |
| `V4` | Volqueta 4 ejes | 22 tons |

---

### Implicación para el cotizador

Actualmente el cotizador lee los parámetros SICE-TAC de la DB (`MonthlyParams`, `VehicleParams`, `RouteTerrain`). Con el web service podemos:

1. **Actualizar en tiempo real** — en vez de esperar actualización manual de la DB
2. **Obtener el valor exacto por ruta** — en vez de calcular por fórmula aproximada
3. **Obtener el valor por hora de espera** (`valorhora`) — para cobrar tiempos muertos
4. **Obtener el tiempo estimado del viaje** (`horasrecorrido`) — para prometerle al cliente

Esta integración debería ser **Fase 2** del módulo de cotizador.

---

## 17. Proceso 86 — Factura Electrónica de Transporte

> **Fuente:** GUIA XML_FacturaElectronica V11.pdf (72 pgs) — documento oficial, versión 11, revisado hasta 2024.

---

### Descripción general

La Factura Electrónica de Transporte es obligatoria y debe:
1. Ser generada y validada por la empresa ante la **DIAN** (tributario)
2. Ser reportada al **RNDC** con el proceso 86 (Ministerio de Transporte)
3. Referenciar las **remesas** específicas que cubre (una o varias por línea de factura)

El proceso tiene dos pasos:
```
1. Empresa genera factura electrónica → la envía a la DIAN (exterior al RNDC)
2. DIAN valida y aprueba la factura
3. Empresa reporta la factura aprobada al RNDC (procesoid=86) → ligando con las remesas del RNDC
```

---

### Operaciones disponibles en Factura Electrónica

| Operación | ProcessID | Descripción |
|-----------|-----------|-------------|
| Registrar factura | 86 | Carga el XML de factura electrónica en el RNDC |
| Nota crédito | 86 (tipo especial) | Anulación parcial o total de factura |
| Nota débito | 86 (tipo especial) | Ajuste al alza de factura |
| Factura por mandato | 86 | Facturación cuando la empresa actúa como mandatario |
| Factura de consorcio/UT | 86 | Consorcios o uniones temporales |

---

### ¿Qué necesita el sistema para emitir facturas?

| Requisito | Descripción |
|-----------|-------------|
| **Habilitación DIAN** | La empresa debe estar habilitada como facturador electrónico ante la DIAN |
| **Software de facturación** | Sistema que genere XML UBL 2.1 según el Anexo Técnico 1.8 de la DIAN |
| **NIT del adquirente** | Cada remesa debe tener el NIT del generador de carga (el cliente) |
| **Remesas previas en RNDC** | La factura referencia remesas que ya deben estar registradas en el RNDC |
| **Orden de Servicio** | Si el generador lo exige, el campo `ORDENSERVICIOGENERADOR` de la remesa debe coincidir con la factura |

---

### Impacto en el modelo de datos

La Factura Electrónica requiere una tabla nueva: `FacturaElectronica`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | cuid | PK |
| `nuevoNegocioId` | String | FK al negocio facturado |
| `numeroFactura` | String UNIQUE | Número de factura (ej: FETV-2026-000001) |
| `cufe` | String UNIQUE | Código Único de Factura Electrónica (asignado por DIAN) |
| `fechaExpedicion` | DateTime | Fecha de la factura |
| `nitAdquirente` | String | NIT del cliente (generador de carga) |
| `nombreAdquirente` | String | Nombre del cliente |
| `subtotal` | Decimal | Valor antes de impuestos |
| `iva` | Decimal | IVA (generalmente 0% en transporte) |
| `total` | Decimal | Total facturado |
| `estadoDian` | Enum | `BORRADOR → ENVIADA → APROBADA → RECHAZADA` |
| `estadoRndc` | Enum | `PENDIENTE → ENVIADA → REGISTRADA` |
| `xmlDian` | Text? | XML aprobado por la DIAN |
| `respuestaDian` | Json? | Respuesta de la DIAN |
| `respuestaRndc` | Json? | Respuesta del RNDC al registrar |
| `remesasIds` | String[] | IDs de las remesas que cubre la factura |

> **Nota de implementación:** La emisión de la factura electrónica requiere un software de facturación electrónica certificado por la DIAN (por ejemplo: Siigo, Alegra, Factura1) o desarrollar un módulo propio que cumpla el Anexo Técnico 1.8. Esto es **Fase 2 del roadmap**.

---

## 18. Alcance completo del ecosistema — Lo que los documentos revelan

> Esta sección consolida toda la información extraída de los 13 documentos del Ministerio de Transporte, identificando el alcance real del ecosistema y cómo CargoClick encaja en él.

---

### Inventario de documentos procesados

| Documento | Páginas | Relevancia |
|-----------|---------|------------|
| GUIA Uso del Web Service en el RNDC_LC V4.pdf | 35 | ⭐⭐⭐ URLs, WSDL, process IDs, ejemplos XML |
| Guía Registro Remesa Revisión 01_12_25_GAADS V4.pdf | 56 | ⭐⭐⭐ Todos los campos de la remesa, tipos de carga |
| MANUAL SISTEMA RNDC 2022.pdf | 57 | ⭐⭐ Manual completo del sistema RNDC |
| GUIA USUARIOS RNDC 2024 _v2.pdf | 52 | ⭐⭐ Proceso manual de expedición |
| Guia de monitoreo de flota_v8.pdf | 49 | ⭐⭐ Monitoreo GPS, cumplidos, novedades |
| GUIA XML_FacturaElectronica V11.pdf | 72 | ⭐⭐⭐ Factura electrónica de transporte |
| CERTIFICADO DE CUMPLIMIENTO... V1.pdf | 2 | ⭐ Requisito para habilitar web service |
| GUIA CONSULTA SICETAC- WEB SERVICE.pdf | 6 | ⭐⭐⭐ Tarifas en tiempo real |
| Consulta de SiceTac desde webservice y portal web.pdf | 13 | ⭐⭐ Complemento SiceTAC |
| GUIA PROCESO DE TRANSBORDO - SISTEMA RNDC-V1.pdf | 21 | ⭐ Transbordos intermodales |
| GUIA TRANSPORTE MUNICIPAL V5 FINAL_06032023.pdf | 36 | ⭐ Transporte urbano (<500 km) |
| FORMATO MANIFIESTO DE CARGA Y ANEXO.xlsx | - | ⭐⭐⭐ Formato oficial del manifiesto |
| PROPUESTA REMESA MERCANCIAS PELIGROSA.xlsx | - | ⭐ Mercancías peligrosas |
| Codificacion Sistema Armonizado.pdf | 342 | ⭐⭐ Catálogo de productos (84 capítulos) |

---

### El ecosistema completo — Operaciones posibles

```
NIVEL 1 — YA EN CARGOCLICK O FASE 1 INMEDIATA
═══════════════════════════════════════════════
[Solicitud] → [Cotización SICE-TAC] → [NuevoNegocio] → [Remesas]
    → [ManifiestoOperativo/RNDC] → [CumplirRemesa/RNDC] → [CumplirManifiesto/RNDC]
    → [AceptaciónElectrónica] → [SeguimientoCliente] → [EncuestaPostEntrega]

NIVEL 2 — FASE 2 (siguiente módulo)
════════════════════════════════════
[FacturaElectronica/DIAN+RNDC] — ligada a remesas ya registradas
[MonitoreoFlota/GPS] — procesoid 45, 46 — cumplidos iniciales y novedades
[SiceTAC en tiempo real] — procesoid 26 — tarifas actualizadas via web service
[CorreccionRemesa] — procesoid 38 — correcciones posteriores al registro

NIVEL 3 — FASE 3 (futuro)
══════════════════════════
[Transbordos] — procesoid a definir — cambio de vehículo en ruta
[TransporteMunicipal] — procesoid 81, 83, 79 — viajes dentro del mismo municipio
[ControlCarretera] — procesoid 39 — reporte de puestos de control
[RUNT] — consulta conductores y vehículos (API diferente al RNDC)
[Codificación Armonizada] — 342 páginas, catálogo completo de mercancías
[MercanciasPeligrosas] — capítulo especial con código UN y declaraciones especiales
```

---

### Flujo técnico completo Fase 1

```
CargoClick                              RNDC Web Service
═══════════════════════════════════════════════════════════

REGISTRO DE TERCEROS (1 vez por cliente/conductor)
────────────────────────────────────────────────────
1. Sync Conductor a RNDC ─────────────► procesoid=11 (Crear Tercero con licencia)
2. Sync Vehículo a RNDC ──────────────► procesoid=12 (Crear Vehículo)

POR CADA REMESA
───────────────────────────────────────────────────
3. Guardar Remesa en DB (estado=PENDIENTE_RNDC)
4. Enviar Remesa al RNDC ─────────────► procesoid=3 (Expedir Remesa)
5. RNDC responde ◄────────────────────── <ingresoid>NUMREMESA</ingresoid>
6. Actualizar Remesa: numeroRemesaRndc = NUMREMESA, estadoRndc = REGISTRADA

POR MANIFIESTO (agrupación de remesas en un vehículo)
──────────────────────────────────────────────────────
7. Crear ManifiestoOperativo en DB (estado=BORRADOR)
8. Enviar Manifiesto al RNDC ─────────► procesoid=4 (Expedir Manifiesto)
   Incluir REMESASMAN con los CONSECUTIVOREMESA
9. RNDC responde ◄────────────────────── <ingresoid>NUMMANIFIESTOCARGA</ingresoid>
10. Actualizar manifiesto: numeroManifiesto = asignado, estado = REGISTRADO

ACEPTACIÓN ELECTRÓNICA (conductor firma digitalmente)
───────────────────────────────────────────────────────
11. Consultar estado firma ───────────► procesoid=3 tipo=73 (consultar aceptación)
12. Si no aceptado: enviar delegación ► procesoid=75 (delegar al conductor)

CUMPLIDOS (confirmar entrega)
──────────────────────────────
13. Cumplir cada remesa ──────────────► procesoid=5 (Cumplir Remesa)
14. Cumplir manifiesto ───────────────► procesoid=6 (Cumplir Manifiesto)

[FASE 2]: FACTURA ELECTRÓNICA
──────────────────────────────
15. Generar XML factura (con cufe DIAN)
16. Reportar al RNDC ─────────────────► procesoid=86 (Factura Electrónica)
```

---

### Catálogo de tipos de naturaleza de carga (CODNATURALEZACARGA)

| Código | Descripción | Consideraciones |
|--------|-------------|-----------------|
| `G` | Carga General | La más común. Solo requiere descripción del producto. |
| `2` | Mercancía Peligrosa | Requiere código UN (libro naranja ONU), grupo de embalaje, estado |
| `R` | Carga Refrigerada | Temperatura controlada |
| `S` | Semovientes (animales vivos) | Requiere guía sanitaria |
| `E` | Carga Extradimensionada / Extrapesada | Requiere permiso INVIAS |
| `C` | Mercancía Consolidada | Paquetes pequeños, múltiples destinatarios en mismo municipio |

---

### Cruce de datos: modelo CargoClick vs RNDC

**Campos en nuestra DB que NO existen en el RNDC (datos exclusivos de negocio):**
- `nuevoNegocioId`, `codigoNegocio`, `ajusteComercialId` — gestión interna
- `seguimientoCliente`, `encuestaPostEntrega` — experiencia de cliente
- `fechaDespachoEstimada`, `tiempoTransitoHoras` — planificación interna

**Campos del RNDC que debemos agregar a nuestra DB:**
- En `Remesa`: `codigoAranceladoCarga`, `subpartidaCodigo`, `codigoArancelCodigo`, `codigoUN`, `grupoEmbalaje`, `estadoMercancia`, `unidadMedidaProducto`, `cantidadProducto`, `codigoTipoEmpaque`, `empaquePrimario`, `tipoIdRemitente`, `tipoIdDestinatario`, `horasPactoCarga`, `minutosPactoCarga`, `horasPactoDescargue`, `minutosPactoDescargue`, `fechaHoraCitaCargue`, `fechaHoraCitaDescargue`, `ordenServicioGenerador`
- En `ManifiestoOperativo`: `placaRemolque`, `retencionIca`, `valorAnticipo`, `municipioPagoSaldo`, `fechaPagoSaldo`, `responsablePagoCargue`, `responsablePagoDescargue`

**Tablas nuevas para Fase 2:**
- `FacturaElectronica` — ligada a remesas, DIAN + RNDC
- `SyncRndc` — log de todas las operaciones contra el web service (auditoría)


---

## 19. Capa API — Endpoints a implementar

> Esta sección documenta todos los endpoints REST que CargoClick debe exponer para cubrir la operación completa descrita en las secciones anteriores. El stack es **Next.js App Router** (`app/api/**/route.ts`).
>
> **Contexto de autenticación:** todos los endpoints marcados como internos requieren sesión Clerk válida (middleware). Los endpoints marcados como **público** no llevan `Authorization` — son accedidos directamente por el cliente vía token/link.
>
> **Ya existen:** `POST /api/solicitudes`, `POST /api/cotizar`, `GET|PATCH /api/ajustes-comerciales/[id]`, `GET /api/distancia`, `GET /api/health`.

---

### Grupo 1 — Directorio de Conductores

`app/api/conductores/`

| Método | Ruta | Descripción | Procesoid RNDC |
|--------|------|-------------|----------------|
| `GET` | `/api/conductores` | Listar conductores del directorio. Filtros: `?activo=`, `?q=` (nombre/cédula) | — |
| `POST` | `/api/conductores` | Crear conductor en el directorio local | — |
| `GET` | `/api/conductores/[cedula]` | Detalle del conductor + último `snapshotRunt` cacheado | — |
| `PATCH` | `/api/conductores/[cedula]` | Actualizar datos del conductor (teléfono, notas, activo) | — |
| `POST` | `/api/conductores/[cedula]/sync-rndc` | Registrar/actualizar conductor en el RNDC vía SOAP | `procesoid 11` |
| `POST` | `/api/conductores/[cedula]/consultar-runt` | Ejecutar consulta RUNT en tiempo real y guardar en `ConsultaRunt` | — |

**Body `POST /api/conductores`:**
```json
{
  "cedula": "12345678",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez López",
  "categoriaLicencia": "C2",
  "licenciaVigencia": "2027-06-15",
  "telefono": "3001234567"
}
```

**Body `POST /api/conductores/[cedula]/sync-rndc`:**
```json
{}
// Sin body — usa los datos ya registrados en la DB local.
// Devuelve { ingresoidRndc, estadoSync, syncRndcId }
```

---

### Grupo 2 — Directorio de Vehículos

`app/api/vehiculos/`

| Método | Ruta | Descripción | Procesoid RNDC |
|--------|------|-------------|----------------|
| `GET` | `/api/vehiculos` | Listar vehículos. Filtros: `?activo=`, `?q=` (placa/propietario) | — |
| `POST` | `/api/vehiculos` | Crear vehículo en el directorio local | — |
| `GET` | `/api/vehiculos/[placa]` | Detalle + estado SOAT/RTM + último snapshot RUNT | — |
| `PATCH` | `/api/vehiculos/[placa]` | Actualizar datos (soatVigencia, rtmVigencia, activo, notas) | — |
| `POST` | `/api/vehiculos/[placa]/sync-rndc` | Registrar/actualizar vehículo en el RNDC vía SOAP | `procesoid 12` |
| `POST` | `/api/vehiculos/[placa]/consultar-runt` | Ejecutar consulta RUNT en tiempo real y guardar en `ConsultaRunt` | — |

> **Nota:** conductor y vehículo deben estar sincronizados al RNDC antes de poder crear un `ManifiestoOperativo`. El endpoint de creación del manifiesto valida esto.

---

### Grupo 3 — NuevoNegocio

`app/api/negocios/`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/negocios` | Listar negocios. Filtros: `?estado=`, `?clienteNit=`, `?desde=`, `?hasta=` |
| `POST` | `/api/negocios` | Crear negocio (Ruta A: desde `solicitudId`/`cotizacionId`, o Ruta B: directo con `clienteNombre`/`clienteNit`) |
| `GET` | `/api/negocios/[id]` | Detalle completo: negocio + remesas + manifiestos + seguimiento |
| `PATCH` | `/api/negocios/[id]` | Actualizar: `estado`, `notas`, `fechaDespachoEstimada` |
| `DELETE` | `/api/negocios/[id]` | Cancelar → `estado = CANCELADO` (solo si no tiene manifiestos REGISTRADOS) |

**Body `POST /api/negocios` — Ruta A (desde wizard web):**
```json
{
  "solicitudId": "clb...",
  "cotizacionId": "clb...",
  "ajusteComercialId": "clb...",
  "fechaDespachoEstimada": "2026-03-10"
}
```

**Body `POST /api/negocios` — Ruta B (negocio directo):**
```json
{
  "clienteNombre": "Supermercados La Gran Colombia S.A.",
  "clienteNit": "900123456",
  "notas": "Cliente frecuente, acuerdo telefónico 2026-03-01",
  "fechaDespachoEstimada": "2026-03-12"
}
```

> **Devuelve:** `{ id, codigoNegocio, estado, ... }` — el `codigoNegocio` se genera automáticamente con el consecutivo `NEG-YYYY-NNNN`.

---

### Grupo 4 — Remesas

`app/api/negocios/[id]/remesas/` y `app/api/remesas/`

| Método | Ruta | Descripción | Procesoid RNDC | Fase |
|--------|------|-------------|----------------|------|
| `GET` | `/api/negocios/[id]/remesas` | Listar remesas del negocio con ambos estados | — | 1 |
| `POST` | `/api/negocios/[id]/remesas` | Crear remesa (queda en `estadoRndc=PENDIENTE`) | — | 1 |
| `GET` | `/api/remesas/[id]` | Detalle completo de la remesa | — | 1 |
| `PATCH` | `/api/remesas/[id]` | Editar remesa — **solo si `estadoRndc = PENDIENTE`** | — | 1 |
| `POST` | `/api/remesas/[id]/enviar-rndc` | Registrar remesa en el RNDC vía SOAP | `procesoid 3` | 1 |
| `POST` | `/api/remesas/[id]/cumplir` | Cumplir remesa al entregar la carga | `procesoid 5` | 1 |
| `POST` | `/api/remesas/[id]/anular` | Anular remesa con error ya registrada en RNDC | `procesoid 38` | 2 |

**Body `POST /api/negocios/[id]/remesas`:**
```json
{
  "descripcionCarga": "Televisores en cajas",
  "pesoKg": 1500,
  "origenMunicipio": "Cali",
  "origenDane": "76001000",
  "destinoMunicipio": "Bogotá",
  "destinoDane": "11001000",
  "nitRemitente": "900123456",
  "nitDestinatario": "800456789",
  "valorDeclarado": 45000000,
  "fechaHoraCitaCargue": "2026-03-10T08:00:00",
  "fechaHoraCitaDescargue": "2026-03-11T14:00:00"
}
```

> `codOperacionTransporte` y `codNaturalezaCarga` se mapean automáticamente desde `Solicitud.tipoCarga` si existió solicitud, o se pueden especificar directamente.

**Body `POST /api/remesas/[id]/enviar-rndc`:**
```json
{}
// Sin body — usa todos los campos ya guardados en la DB.
// Construye XML del procesoid 3, ejecuta SOAP, guarda en SyncRndc.
// Devuelve: { numeroRemesaRndc, estadoRndc, syncRndcId }
```

> ⚠️ **Precondición validada por el endpoint:** `fechaHoraCitaCargue` y `fechaHoraCitaDescargue` son obligatorias desde nov 2025.

---

### Grupo 5 — ManifiestoOperativo

`app/api/negocios/[id]/manifiestos/` y `app/api/manifiestos/`

| Método | Ruta | Descripción | Procesoid RNDC | Fase |
|--------|------|-------------|----------------|------|
| `GET` | `/api/negocios/[id]/manifiestos` | Listar manifiestos del negocio | — | 1 |
| `POST` | `/api/manifiestos` | Crear manifiesto + enviar al RNDC en una sola operación | `procesoid 4` | 1 |
| `GET` | `/api/manifiestos/[id]` | Detalle completo (remesas incluidas + estado RNDC) | — | 1 |
| `POST` | `/api/manifiestos/[id]/enviar-rndc` | Reenviar si `estadoManifiesto = BORRADOR` o `ENVIADO` con error | `procesoid 4` | 1 |
| `POST` | `/api/manifiestos/[id]/cumplir` | Cumplir el manifiesto al finalizar el viaje | `procesoid 6` | 1 |
| `POST` | `/api/manifiestos/[id]/anular` | Anular manifiesto registrado en el RNDC | `procesoid 32` | 1 |
| `POST` | `/api/manifiestos/[id]/corregir` | Flow completo: anula el original (32) + crea y envía el nuevo (4) | `procesoid 32+4` | 1 |
| `POST` | `/api/manifiestos/[id]/aceptacion-conductor` | Aceptación electrónica del conductor vía app | `procesoid 73/75` | 2 |

**Body `POST /api/manifiestos`:**
```json
{
  "nuevoNegocioId": "clb...",
  "conductorCedula": "12345678",
  "vehiculoPlaca": "ABC123",
  "placaRemolque": "XYZ789",
  "remesasIds": ["clb...", "clb..."],
  "origenMunicipio": "Cali",
  "origenDane": "76001000",
  "destinoMunicipio": "Bogotá",
  "destinoDane": "11001000",
  "fletePactado": 4500000,
  "valorAnticipo": 2000000,
  "retencionIca": 4,
  "fechaExpedicion": "2026-03-10",
  "fechaDespacho": "2026-03-10",
  "observaciones": "Frágil, no apilar"
}
```

**Validaciones antes de llamar al RNDC:**
1. Conductor existe en DB y tiene sync RNDC exitoso (procesoid 11)
2. Vehículo existe en DB y tiene sync RNDC exitoso (procesoid 12)
3. Todas las `remesasIds` tienen `estadoRndc = REGISTRADA`
4. Todas las remesas pertenecen al mismo `nuevoNegocioId`
5. Ninguna remesa está ya asignada a otro manifiesto activo
6. SOAT y RTM del vehículo no vencidos (si `ultimaConsultaRunt` disponible en DB)

**Body `POST /api/manifiestos/[id]/corregir`:**
```json
{
  "motivoAnulacion": "Placa del vehículo incorrecta",
  "vehiculoPlaca": "DEF456"
}
// El endpoint: (1) procesoid 32 sobre el original,
// (2) nuevo ManifiestoOperativo con reemplazaManifiestoId = id original,
// (3) procesoid 4 con los datos corregidos.
// Devuelve: { manifiestoAnuladoId, nuevoManifiestoId, nuevoNumeroRndc }
```

---

### Grupo 6 — Seguimiento al cliente

`app/api/negocios/[id]/seguimiento/`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/negocios/[id]/seguimiento` | Listar hitos en orden cronológico |
| `POST` | `/api/negocios/[id]/seguimiento` | Registrar hito + disparar notificación al cliente |

**Body `POST /api/negocios/[id]/seguimiento`:**
```json
{
  "manifiestoOperativoId": "clb...",
  "hito": "DESPACHADO",
  "descripcion": "Tu carga salió desde Cali. ETA: mañana 2pm.",
  "ubicacionActual": "Cali, Valle del Cauca",
  "canalNotificacion": "WHATSAPP",
  "notificadoA": "+573001234567"
}
```

**Hitos y cuándo registrarlos:**

| Hito | Cuándo |
|------|--------|
| `NEGOCIO_CONFIRMADO` | Al crear el `NuevoNegocio` (puede ser automático) |
| `REMESAS_ASIGNADAS` | Cuando todas las remesas tienen manifiesto asignado |
| `DESPACHADO` | Al registrar exitosamente el manifiesto (procesoid 4) |
| `EN_RUTA` | Durante el viaje (manual en Fase 1, GPS en Fase 2) |
| `EN_DESTINO` | Vehículo llegó al punto de descargue |
| `ENTREGADO` | Carga entregada — dispara creación automática de encuesta |
| `NOVEDAD` | Cualquier incidente (demora, accidente, rechazo) |

---

### Grupo 7 — Encuesta post-entrega

`app/api/negocios/[id]/encuesta/` y `app/api/encuestas/`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/negocios/[id]/encuesta/enviar` | Interno | Genera token único + envía link al cliente (email/WhatsApp) |
| `GET` | `/api/encuestas/[token]` | **Público** | Datos del negocio para pre-llenar la encuesta (sin login) |
| `POST` | `/api/encuestas/[token]` | **Público** | El cliente envía su respuesta — guarda en `EncuestaPostEntrega` |

> Las rutas `/api/encuestas/[token]` son públicas por diseño: el link con token único no requiere cuenta en CargoClick.

**Body `POST /api/encuestas/[token]`:**
```json
{
  "calificacionGeneral": 5,
  "calificacionTiempos": 4,
  "calificacionTrato": 5,
  "calificacionEstadoCarga": 5,
  "recomendaria": true,
  "comentario": "Excelente servicio, llegaron antes de lo esperado."
}
```

---

### Grupo 8 — RNDC Admin / Audit log

`app/api/rndc/`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/rndc/sync-log` | Historial de `SyncRndc`. Filtros: `?procesoid=`, `?exitoso=`, `?entidadTipo=`, `?desde=`, `?hasta=` |
| `POST` | `/api/rndc/sync-log/[id]/reintentar` | Reintentar una llamada fallida — reenvía el `requestXml` guardado |
| `POST` | `/api/rndc/maestros/refrescar` | Refrescar maestros locales desde el RNDC (municipios, catálogos) |

> El log de `SyncRndc` es append-only y nunca se edita. Es el único registro de evidencia ante auditorías del Ministerio.

---

### Grupo 9 — Parámetros SICE-TAC

`app/api/parametros/`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/parametros/mensuales` | Listar todos los periodos cargados |
| `POST` | `/api/parametros/mensuales` | Agregar parámetros del nuevo mes (ACPM, SMLMV, etc.) |
| `GET` | `/api/parametros/mensuales/[mes]` | Parámetros de un mes específico (formato `YYYY-MM`) |

> Operación crítica el 1ro de cada mes: actualizar ACPM y SMLMV para mantener el cotizador al día.

---

### Resumen por fase

#### Fase 1

| Grupo | Endpoints | Operaciones RNDC clave |
|-------|-----------|------------------------|
| Conductores | 6 | `sync-rndc` → procesoid 11 |
| Vehículos | 6 | `sync-rndc` → procesoid 12 |
| NuevoNegocio | 5 | — |
| Remesas | 6 | `enviar-rndc` → procesoid 3 · `cumplir` → procesoid 5 |
| ManifiestoOperativo | 7 | `POST` → procesoid 4 · `cumplir` → procesoid 6 · `anular` → procesoid 32 · `corregir` → 32+4 |
| Seguimiento | 2 | — |
| Encuesta | 3 | — (2 rutas públicas) |
| RNDC Admin | 3 | `reintentar` |
| Parámetros | 3 | — |
| **Total Fase 1** | **~41** | |

#### Fase 2

| Endpoint | Descripción | Procesoid |
|----------|-------------|-----------|
| `POST /api/remesas/[id]/anular` | Anular remesa con error ya registrada | `38` |
| `POST /api/manifiestos/[id]/aceptacion-conductor` | Firma del conductor vía app | `73/75` |
| `GET /api/conductores/[cedula]/consultas-runt` | Historial RUNT de un conductor | — |
| `GET /api/vehiculos/[placa]/consultas-runt` | Historial RUNT de un vehículo | — |
| `POST /api/rndc/sice-tac` | Consulta tarifa SICE-TAC en tiempo real | `26` |
| `POST /api/manifiestos/[id]/gps-novedad` | Registrar novedad GPS durante el viaje | `45/46` |
| `POST /api/facturas` | Generar Factura Electrónica de Transporte | `86` |

---

### Convenciones de respuesta

```ts
// Éxito (200 / 201)
{ data: { ... }, meta?: { total, page } }

// Error de validación (400)
{ error: "VALIDATION_ERROR", message: "...", fields?: { campo: "mensaje" } }

// Precondición de negocio fallida (422)
{ error: "PRECONDITION_FAILED", message: "Las remesas deben tener estadoRndc=REGISTRADA antes de crear un manifiesto" }

// Error RNDC (502)
{ error: "RNDC_ERROR", message: "...", rndcResponse: "<XML crudo>", syncRndcId: "clb..." }
```

> Los errores RNDC incluyen siempre el `syncRndcId` — permite al operador consultar el log completo y usar `POST .../reintentar`.
