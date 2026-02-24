# Definición Funcional y Técnica — Módulo de Ajuste Comercial

**Versión:** 1.0  
**Fecha:** 2026-02-22  
**Estado:** Borrador para revisión

---

## 1. Contexto y Problema

Hoy el sistema genera automáticamente una `Cotizacion` con la tarifa mínima SISETAC más un margen fijo del 20%. Esto cubre el **piso legal**, pero en la realidad comercial el proceso tiene una segunda capa:

- El comercial negocia y puede ajustar el precio final.
- El precio cobrado al cliente y el pago al conductor son decisiones del comercial, no del motor automático.
- A veces el cliente tiene un vehículo específico en mente o el comercial quiere simular el costo con otro tipo de vehículo.
- Al final del ciclo, los valores reales (lo que se cobró, lo que se pagó) deben quedar registrados para trazabilidad y análisis de rentabilidad.

---

## 2. Separación de Capas (Arquitectura de Datos)

```
Solicitud
    └──► Cotizacion[]          ← Motor SISETAC (automático, inmutable)
              └──► AjusteComercial   ← Decisiones humanas (editable)
```

| Capa | Quién la genera | Inmutable | Propósito |
|---|---|---|---|
| `Cotizacion` | Motor automático | ✅ Sí | Referencia SISETAC legal |
| `AjusteComercial` | Comercial | ❌ No (editable hasta cierre) | Negociación, override, valores reales |

Una `Cotizacion` puede tener máximo un `AjusteComercial` activo.  
Para simular con otro vehículo se genera una **nueva** `Cotizacion` vinculada a la misma solicitud (con overrides de vehículo y margen), y el comercial elige cuál cotización usar como base.

---

## 3. Funcionalidades del Módulo

### 3.1 Simulador de Vehículos y Margen (Recálculo)

El comercial puede:
- Seleccionar un tipo de vehículo diferente al inferido automáticamente.
- Ajustar el porcentaje de margen comercial para esa cotización específica.
- Hacer clic en **"Recalcular"** → genera una nueva `Cotizacion` con los overrides.
- Ver en pantalla el historial de todas las simulaciones para la misma solicitud.
- Marcar una cotización como "la base" para el ajuste comercial.

**Vehículos disponibles:** C2, C3, C2S2, C2S3, C3S2, C3S3  
**Margen simulado:** 0% – 50% (en pasos de 0.5%)

**Regla:** El motor SISETAC siempre calcula el piso real. El simulador solo mueve el margen o el tipo de vehículo — nunca baja del piso SISETAC.

---

### 3.2 Precio Ofertado al Cliente

El comercial puede escribir manualmente el valor que va a ofrecer al cliente.  
Este valor:
- Puede ser diferente a la `tarifaSugerida` (mayor o menor al resultado del simulador, **pero no menor al flete SISETAC**).
- Se guarda en `AjusteComercial.tarifaOfertadaCliente`.
- Genera automáticamente: `margenEfectivoReal` = ((ofertado - fleteRef) / fleteRef) × 100
- Muestra en pantalla: `diferenciaSisetac` = ofertado - fleteRef (positivo = margen sobre piso)

**Validación:** Si el comercial intenta ingresar un valor menor al flete referencial SISETAC, el sistema muestra advertencia pero **no bloquea** (el comercial puede tener una razón justificada — primer cliente, retención, etc.).

---

### 3.3 Valor Confirmado (Lo que se cobró)

Una vez el cliente acepta, el comercial registra el valor definitivo cobrado.  
- Campo: `tarifaConfirmadaCliente` — valor real de la factura / remesa.
- Puede diferir del ofertado (el cliente negoció en el último momento).
- Al guardar este campo el estado de `AjusteComercial` pasa a `ACEPTADO`.
- Este valor alimenta el análisis de rentabilidad real.

---

### 3.4 Pago al Conductor

El comercial registra cuánto se le va a pagar al conductor.  
- Campo: `pagoAlConductor` — valor neto que recibe el conductor.
- **No** es lo mismo que el flete SISETAC (el SISETAC es el bruto antes de retenciones). El pago real al conductor es a criterio del operador.
- El sistema calcula automáticamente:
  - `margenBrutoOperacion` = tarifaConfirmadaCliente - pagoAlConductor
  - `margenBrutoPercent` = (margenBrutoOperacion / tarifaConfirmadaCliente) × 100
- Estos campos alimentan el dashboard de rentabilidad.

---

### 3.5 Otros Campos que el Comercial Debería Poder Gestionar

#### ✅ Campos recomendados (alta utilidad, bajo riesgo):

| Campo | Tipo | Descripción | Por qué es importante |
|---|---|---|---|
| `estadoNegociacion` | Enum | `EN_OFERTA / EN_NEGOCIACION / ACEPTADO / RECHAZADO / CANCELADO` | Trazabilidad del ciclo de ventas |
| `motivoAjuste` | Texto libre | Por qué se modificó el precio (ej: "cliente frecuente", "ruta de retorno") | Auditoría y aprendizaje comercial |
| `nombreComercial` | String | Quién hizo el ajuste | Trazabilidad por vendedor |
| `formaPago` | Enum | `CONTADO / CREDITO_30 / CREDITO_60 / CREDITO_90` | Afecta al riesgo financiero y la oferta |
| `diasCredito` | Int | Días reales de crédito acordados | Para cálculo de costo financiero |
| `fechaAceptacion` | DateTime | Cuándo el cliente confirmó | KPI ciclo de ventas |
| `notasComerciales` | Texto libre | Condiciones especiales pactadas | Solo visible internamente |

#### ⚠️ Campos opcionales (mayor complejidad):

| Campo | Tipo | Descripción | Cuándo incluir |
|---|---|---|---|
| `recargoCargaPeligrosa` | Decimal | % adicional por HAZMAT | Si manejan carga peligrosa frecuente |
| `recargoPrimerizo` | Decimal | Recargo a clientes nuevos | Si tienen política de riesgo |
| `descuentoRetorno` | Decimal | Descuento por viaje de retorno | Si tienen red de retornos |
| `tipoCamionRealUsado` | String | Vehículo que realmente se asignó | Para comparar planeado vs real |

---

## 4. Estados del AjusteComercial (Ciclo de Vida)

```
[BORRADOR] → [EN_OFERTA] → [EN_NEGOCIACION] → [ACEPTADO] → [CERRADO]
                                    ↓
                               [RECHAZADO]
                                    ↓
                              [CANCELADO]
```

| Estado | Descripción | Editable |
|---|---|---|
| `BORRADOR` | Comercial está simulando, no se ha ofertado nada | ✅ Sí |
| `EN_OFERTA` | Se envió precio al cliente | ✅ (puede ajustar) |
| `EN_NEGOCIACION` | Cliente hizo contrapropuesta | ✅ |
| `ACEPTADO` | Cliente confirmó — se registra `tarifaConfirmadaCliente` | Solo `pagoAlConductor` y notas |
| `CERRADO` | Viaje ejecutado — `pagoAlConductor` confirmado | ❌ Solo lectura |
| `RECHAZADO` | Cliente no aceptó | Solo `motivoRechazo` |
| `CANCELADO` | Solicitud cancelada | ❌ |

---

## 5. Modelo de Datos Propuesto (`AjusteComercial`)

```prisma
model AjusteComercial {
  id                     String    @id @default(cuid())

  // ── Relaciones ──
  solicitudId            String    @map("solicitud_id")
  solicitud              Solicitud @relation(fields: [solicitudId], references: [id])

  cotizacionBaseId       String    @map("cotizacion_base_id")
  cotizacionBase         Cotizacion @relation(fields: [cotizacionBaseId], references: [id])

  // ── Simulador usado ──
  vehiculoUsado          String    @db.VarChar(10) @map("vehiculo_usado")   // C2, C3, etc.
  margenSimulado         Decimal   @db.Decimal(5,2) @map("margen_simulado") // % margen base

  // ── Oferta al cliente ──
  tarifaOfertadaCliente  Decimal?  @db.Decimal(15,2) @map("tarifa_ofertada_cliente")
  margenEfectivoOferta   Decimal?  @db.Decimal(6,2)  @map("margen_efectivo_oferta")  // calculado

  // ── Valor confirmado (lo cobrado) ──
  tarifaConfirmadaCliente Decimal? @db.Decimal(15,2) @map("tarifa_confirmada_cliente")
  fechaAceptacion         DateTime? @map("fecha_aceptacion")

  // ── Pago al conductor ──
  pagoAlConductor        Decimal?  @db.Decimal(15,2) @map("pago_al_conductor")
  margenBrutoCop         Decimal?  @db.Decimal(15,2) @map("margen_bruto_cop")        // calculado
  margenBrutoPercent     Decimal?  @db.Decimal(6,2)  @map("margen_bruto_percent")    // calculado

  // ── Condiciones comerciales ──
  formaPago              String    @default("CONTADO") @db.VarChar(20) @map("forma_pago")
  diasCredito            Int       @default(0)          @map("dias_credito")

  // ── Estado y trazabilidad ──
  estadoNegociacion      String    @default("BORRADOR") @db.VarChar(20) @map("estado_negociacion")
  nombreComercial        String?   @db.VarChar(100)     @map("nombre_comercial")
  motivoAjuste           String?   @db.Text             @map("motivo_ajuste")
  motivoRechazo          String?   @db.Text             @map("motivo_rechazo")
  notasComerciales       String?   @db.Text             @map("notas_comerciales")

  // ── Timestamps ──
  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @updatedAt      @map("updated_at")

  @@index([solicitudId])
  @@index([estadoNegociacion])
  @@map("ajustes_comerciales")
}
```

También hay que agregar a `Solicitud`:
```prisma
ajustesComerciales AjusteComercial[]
```

Y a `Cotizacion`:
```prisma
ajustesComerciales AjusteComercial[]
```

---

## 6. APIs Necesarias

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/solicitudes/[id]/cotizar` | Ya existe — recibe `vehiculoOverride` y `margenOverride` para simular |
| `GET` | `/api/solicitudes/[id]/cotizaciones` | Lista todas las simulaciones de la solicitud |
| `POST` | `/api/solicitudes/[id]/ajuste-comercial` | Crea/actualiza el AjusteComercial |
| `PATCH` | `/api/ajustes-comerciales/[id]` | Actualiza campos (oferta, confirmado, conductor, estado) |
| `GET` | `/api/ajustes-comerciales/[id]` | Detalle completo con métricas calculadas |

---

## 7. UI — Pantalla del Comercial (Página `/solicitudes/[id]`)

### Panel de Simulador (nueva sección)
- Selector de vehículo (C2 / C3 / C2S2 / C2S3 / C3S2 / C3S3) con capacidades y costos
- Slider o input de margen (0% – 50%)
- Botón "Recalcular" → llama `POST /cotizar` con overrides
- Tabla comparativa de todas las simulaciones: vehículo | margen | piso SISETAC | tarifa sugerida | $/km | $/ton
- Botón "Usar esta cotización como base"

### Panel de Negociación (nueva sección)
- Campo "Precio ofertado al cliente" (input numérico + badge de margen efectivo)
- Badge de alerta si está por debajo del piso SISETAC
- Selector de estado de negociación
- Campo "Forma de pago" + días de crédito
- Notas comerciales (textarea)
- Botón "Guardar oferta"

### Panel de Cierre (aparece cuando estado = ACEPTADO)
- Campo "Tarifa confirmada" (lo que se factura)
- Campo "Pago al conductor"
- Métricas calculadas en tiempo real:
  - Margen bruto: COP y %
  - Diferencia vs piso SISETAC
  - Diferencia vs oferta inicial
- Quién aceptó y cuándo
- Botón "Cerrar operación"

---

## 8. Reglas de Negocio Clave

1. **No se puede crear un `AjusteComercial` sin una `Cotizacion` base** — siempre hay que calcular SISETAC primero.
2. **La cotización base es inmutable** — si el comercial cambia el vehículo, se crea una nueva `Cotizacion`, no se edita la existente.
3. **El flete SISETAC es el piso legal** — la UI muestra advertencia si `tarifaOfertadaCliente < fleteReferencialSisetac`, pero no bloquea.
4. **Solo puede haber un `AjusteComercial` activo** (no CANCELADO/RECHAZADO) por solicitud.
5. **Al marcar estado ACEPTADO** → `Solicitud.estado` pasa a `COTIZADO` (o un nuevo estado `NEGOCIADO`).
6. **Al marcar estado CERRADO** → `Solicitud.estado` pasa a `CERRADO`.
7. **El `pagoAlConductor` no puede ser mayor a `tarifaConfirmadaCliente`** — el sistema bloquea esta validación.

---

## 9. Métricas de Rentabilidad que se Habilitan

Una vez implementado este módulo, se pueden calcular por solicitud y en agregado:

| Métrica | Fórmula |
|---|---|
| Margen sobre SISETAC | (tarifaConfirmada - fleteRef) / fleteRef × 100 |
| Margen bruto operativo | (tarifaConfirmada - pagoAlConductor) / tarifaConfirmada × 100 |
| Descuento vs tarifa sugerida | tarifaConfirmada - tarifaSugerida SISETAC |
| Tasa de aceptación por comercial | solicitudes ACEPTADAS / ofertas enviadas |
| Ciclo de ventas promedio | fechaAceptacion - createdAt (días) |
| Revenue real vs proyectado | suma tarifaConfirmada vs suma tarifaSugerida |

---

## 10. Dependencias y Orden de Implementación

1. ✅ Motor SISETAC + `Cotizacion` — ya existe
2. **[ ] Fase 1 — Schema:** Agregar `AjusteComercial` al schema Prisma + migración
3. **[ ] Fase 2 — Override en cotizar:** Que `POST /cotizar` acepte `vehiculoOverride` y `margenOverride`
4. **[ ] Fase 3 — API ajuste comercial:** CRUD de `AjusteComercial`
5. **[ ] Fase 4 — UI simulador:** Panel de vehículos + comparativa en `/solicitudes/[id]`
6. **[ ] Fase 5 — UI negociación:** Panel de oferta + estado
7. **[ ] Fase 6 — UI cierre:** Panel de valores confirmados + métricas
8. **[ ] Fase 7 — Dashboard:** Agregados de rentabilidad

---

## 11. Preguntas Abiertas para Validar

1. ¿El comercial trabaja solo o hay varios usuarios con roles? (impacta autenticación en `nombreComercial`)
2. ¿El `pagoAlConductor` es fijo por servicio o puede haber créditos/anticipos parciales?
3. ¿Se necesita envío automático de la cotización al cliente (email/PDF) al pasar a `EN_OFERTA`?
4. ¿El estado `CERRADO` debería desencadenar algún proceso (ej: generar remesa, notificar facturación)?
5. ¿Se necesita historial de cambios del `AjusteComercial` (quién cambió qué y cuándo)?
