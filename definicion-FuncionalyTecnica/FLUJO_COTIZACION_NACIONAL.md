# Flujo de Cotización — Viaje Nacional
> Enfocado en transporte entre ciudades (SISETAC).  
> El flujo urbano se define por separado.

---

## Principio de diseño UX

> **"Dame lo que necesito para cotizarte, no un formulario eterno."**

El objetivo del wizard es **capturar los datos suficientes** para que el equipo comercial elabore la cotización internamente y la envíe al cliente.  
No hay cotización en pantalla — el precio lo genera el comercial y lo envía por correo o WhatsApp.

Estrategia:
- Los datos de **contacto van primero** — identificamos al cliente desde el inicio.
- Los datos de **empresa son opcionales** y van en su propia pantalla, sin mezclarse con los datos personales.
- El **correo se captura en el paso de empresa** (opcional) — si lo da, se usa para el envío de la cotización.
- El **último paso es un checklist de condiciones** de la carga — rápido de responder y muy útil para el comercial.

---

## Nivel 1 — Flujo principal (7 pasos, ~90 segundos)

> Con estos datos el comercial ya puede generar una cotización completa.

| Paso | Pregunta | Campos | Obligatorio | Guardado BD |
|------|----------|--------|-------------|-------------|
| 0 | ¿Cómo te llamas y cuál es tu celular? | `contacto` + `telefono` | ✅ Ambos | **POST optimista** — avanza inmediatamente; crea en BD en background |
| 1 | ¿Tu envío va a nombre de una empresa? | `empresa` + `email` + `telefonoEmpresa` | ❌ Todo opcional | PATCH progresivo |
| 2 | ¿Desde dónde sale y hacia dónde va? | `origen` + `destino` | ✅ Ambos | PATCH progresivo |
| 3 | ¿Qué tipo de carga vas a transportar? | `tipoCarga` | ✅ | PATCH progresivo |
| 4 | ¿Cuánto pesa y cuáles son las dimensiones? | `pesoKg` + `dimLargoCm/AnchoCm/AltoCm` | ✅ Todos | PATCH progresivo |
| 5 | ¿Para qué fecha necesitas el servicio? | `fechaRequerida` | ✅ (mín. hoy, sin pasado) | **PATCH de cierre** — todos los campos + fecha |
| 6 | ¿Quieres agregar algo más a tu solicitud? | `observaciones` + checklist de condiciones | ❌ Todo opcional | PATCH fire-and-forget (si el usuario envía detalles) |

**Resultado:** solicitud creada en BD al finalizar paso 0; cada paso actualiza progresivamente; el paso 5 garantiza completitud con un PATCH final.

---

## Checklist del paso 6 — Condiciones de la carga (enriquecimiento)

> El usuario puede marcar ninguna, una, o varias. Se envía con “Enviar detalles” o se omite con “Listo, gracias”.  
> Son datos de alto valor para el comercial: afectan tarifa, vehículo y logística.  
> Los items marcados con 💬 abren un textarea de detalle adicional al seleccionarlos.

| Item | Campo | Detalle opcional | Impacto operativo |
|------|-------|-----------------|-------------------|
| ☢️ Carga peligrosa (HAZMAT) | `cargaPeligrosa` | 💬 `detalleCargaPeligrosa` | Requiere permisos especiales, vehículo certificado, documentación, tarifa diferente |
| 🧗 Ayudante en el cargue | `ayudanteCargue` | — | Cargo extra por personal de apoyo en origen |
| 🧗 Ayudante en el descargue | `ayudanteDescargue` | — | Cargo extra por personal de apoyo en destino |
| 🥚 Carga frágil | `cargaFragil` | — | Embalaje reforzado, manejo especial, ajuste de tarifa |
| 📦 Necesita embalaje | `necesitaEmpaque` | — | La carga llega sin empacar; se prepara antes del viaje |
| 🗺️ Entrega en más de un punto | `multiplesDestinosEntrega` | 💬 `detalleMultiplesDestinos` | Tarifa sube por paradas adicionales; el comercial necesita saber cuántas y dónde |
| 🛡️ Requiere escolta de seguridad | `requiereEscolta` | — | Carga de alto valor; coordinación con empresa de escolta, tarifa diferente |
| 🚧 Acceso difícil en origen o destino | `accesosDificiles` | 💬 `detalleAccesosDificiles` | Puede cambiar el tipo de vehículo o hacer la ruta imposible con camión grande |
| 🏗️ Carga sobredimensionada | `cargaSobredimensionada` | 💬 `detalleSobredimensionada` | Puede requerir permiso INVIAS, viaje nocturno, vehículo piloto |

---

## Flujo completo

```
[INICIO]
  │
  ├─► Paso 0: Nombre + Celular              ← avanza inmediato; POST crea solicitud en BD en background
  ├─► Paso 1: Empresa + Email + Tel. fijo   ← PATCH progresivo (no bloqueante)
  ├─► Paso 2: Origen + Destino              ← PATCH progresivo (no bloqueante)
  ├─► Paso 3: Tipo de carga                 ← PATCH progresivo (no bloqueante)
  ├─► Paso 4: Peso + Dimensiones            ← PATCH progresivo (no bloqueante)
  ├─► Paso 5: Fecha del servicio            ← ★ PATCH de cierre (todos los campos + fechaRequerida)
  ├─► Paso 6: Pantalla de confirmación      ← muestra #COT-XXXXXXXX + textarea observaciones + checklist
  │           (enriquecimiento opcional)     ← PATCH si "Enviar detalles"; skip si "Listo, gracias"
  │
  ▼
[COMPLETADO]  ← PantallaCompletada.tsx — resumen, contacto, nueva cotización

Nota: El POST del paso 0 es fire-and-forget — el usuario avanza sin esperar la BD.
Los PATCHes de pasos 1-4 también son fire-and-forget (el usuario sigue aunque fallen).
El PATCH del paso 5 es bloqueante y actúa como red de seguridad: si el POST del paso 0
aun no resolvió, lo hace en este momento antes del PATCH final.
El PATCH del paso 6 es fire-and-forget y solo se envía si el usuario pulsó "Enviar detalles".
Si pulsó "Listo, gracias" (skip), los campos de enriquecimiento quedan en null en la BD.
```

---

## Decisiones de diseño tomadas

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| Empresa en paso separado (paso 1) | En el mismo paso del nombre | Paso 0 quedaba muy cargado; empresa es opcional y tiene su propio contexto |
| Email capturado en paso 1 (empresa) | Paso final obligatorio | El email es opcional; no tiene sentido bloquearlo como último paso |
| Solicitud creada al completar paso 5 (fecha) | Crearse al final del paso 6 | Con los 5 datos obligatorios (ruta, carga, peso, fecha) el comercial ya puede actuar; el enriquecimiento es bonus |
| Paso 6 como pantalla de confirmación + enriquecimiento | Pantalla post-confirmación separada | El usuario ya está comprometido y ve el #COT inmediatamente; los detalles extra son un clic |
| Dos botones en paso 6: "Enviar detalles" / "Listo, gracias" | Un solo botón | Respeta al usuario que no quiere agregar nada — sin presión |
| Checklist sin validación obligatoria | Mínimo 1 item requerido | El caso más común (carga normal) no marca nada — no debe penalizarse |
| Fecha: bloquear pasado en UI, no validar con Zod | Mensaje de error post-submit | El usuario nunca puede seleccionar lo incorrecto — sin errores, sin fricción |
| Atajo "Hoy" en el calendario | Solo datepicker libre | Servicio inmediato es el caso más frecuente; un clic en lugar de navegar |
| Fecha de entrega: no pedirla | Como campo opcional en paso 5 | El cliente no sabe cuándo llegará — el comercial la calcula según ruta y urgencia |

---

## Estado de los campos de enriquecimiento en BD

> Todos los campos del paso 6 están en el schema de Prisma y se guardan por PATCH fire-and-forget.  
> Si el usuario pulsa "Listo, gracias" (skip) no se envía PATCH — los campos quedan en `null`.

| Campo | Tipo BD | Estado |
|-------|---------|--------|
| `observaciones` | `String?` | ✅ En BD |
| `cargaPeligrosa` | `Boolean?` | ✅ En BD |
| `ayudanteCargue` | `Boolean?` | ✅ En BD |
| `ayudanteDescargue` | `Boolean?` | ✅ En BD |
| `cargaFragil` | `Boolean?` | ✅ En BD |
| `necesitaEmpaque` | `Boolean?` | ✅ En BD |
| `multiplesDestinosEntrega` | `Boolean?` | ✅ En BD |
| `requiereEscolta` | `Boolean?` | ✅ En BD |
| `accesosDificiles` | `Boolean?` | ✅ En BD |
| `cargaSobredimensionada` | `Boolean?` | ✅ En BD |
| `detalleCargaPeligrosa` | `String?` | ✅ En BD |
| `detalleMultiplesDestinos` | `String?` | ✅ En BD |
| `detalleAccesosDificiles` | `String?` | ✅ En BD |
| `detalleSobredimensionada` | `String?` | ✅ En BD |

---

## Preguntas descartadas del flujo principal

| Pregunta | Razón |
|----------|-------|
| ¿Facilidades en el destino para descargue? | V2 — unificar con condicionesCargue |
| ¿Cuál es el valor de la carga para seguro? | Post-confirmación opcional (Nivel 2) |
| ¿Fecha de entrega esperada? | El comercial la calcula; pedirla genera confusión |

---

## Flujo urbano (pendiente)

Comparte pasos 0–1 (contacto/empresa), 3 (tipo carga), 4 (peso+dims), 5 (fecha), 6 (checklist) y diverge en la ruta:
- **Nacional:** autocomplete ciudad → ciudad con tabla de distancias DANE
- **Urbano:** dirección libre de recogida + dirección libre de entrega (geocodificación)

> Se desarrolla en una segunda iteración.
