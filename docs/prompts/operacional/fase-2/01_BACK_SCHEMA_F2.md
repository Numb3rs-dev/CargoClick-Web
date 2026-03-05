# BACK-01-F2 — Extensiones de Schema Prisma (Fase 2)

## Contexto

Extiende el schema Prisma de Fase 1 con tres nuevos modelos para:
- Registrar y auditar la **aceptación electrónica del conductor** en el RNDC
- Persistir **novedades GPS** asociadas a manifiestos
- Gestionar el ciclo de vida completo de la **Factura Electrónica de Transporte**

**Prerequisito:** El schema de Fase 1 está en producción. Aplicar este prompt como nueva migración incremental.

---

## Tarea

Extiende `prisma/schema.prisma` con los siguientes bloques. Luego genera y ejecuta la migración.

### 1. Nuevos Enums

```prisma
enum EstadoFacturaDian {
  BORRADOR
  ENVIADA    // enviada al proveedor DIAN
  APROBADA   // DIAN emitió CUFE válido
  RECHAZADA  // DIAN rechazó (errores técnicos/fiscales)
}

enum EstadoFacturaRndc {
  PENDIENTE    // factura aprobada DIAN, aún no reportada al RNDC
  ENVIADA      // XML enviado al WS RNDC (procesoid 86)
  REGISTRADA   // RNDC confirmó registro exitoso
  ERROR_RNDC   // RNDC rechazó, requiere corrección
}

enum TipoNovedadGPS {
  INICIO_CARGUE
  FIN_CARGUE
  INICIO_VIAJE
  EN_RUTA
  LLEGADA_DESTINO
  INICIO_DESCARGUE
  FIN_DESCARGUE
  NOVEDAD_TRANSITO  // accidente, robo, retención, etc.
}
```

### 2. Modelo `AceptacionConductor`

Registra el flujo de aceptación electrónica del conductor vía RNDC (procesoids 73 consulta y 75 registro).

```prisma
model AceptacionConductor {
  id              String    @id @default(cuid())
  manifiestoId    String    @unique
  manifiesto      Manifiesto @relation(fields: [manifiestoId], references: [id])

  cedula          String    // cédula del conductor
  nombreConductor String

  // Resultado consulta RNDC (procesoid 73)
  estadoRndc      String?   // código de respuesta del WS RNDC
  descripcionRndc String?

  // Aceptación registrada (procesoid 75)
  fechaAceptacion DateTime?
  ipCliente       String?   // IP desde donde firmó (para auditoría)
  tokenAceptacion String?   @unique // token único generado para la URL de firma

  // Metadata
  creadoEn        DateTime  @default(now())
  actualizadoEn   DateTime  @updatedAt

  @@map("aceptaciones_conductor")
}
```

### 3. Modelo `NovedadGPS`

Persiste las novedades de posición o eventos de flota reportados al RNDC (procesoids 45 y 46).

```prisma
model NovedadGPS {
  id              String          @id @default(cuid())
  manifiestoId    String
  manifiesto      Manifiesto      @relation(fields: [manifiestoId], references: [id])

  tipo            TipoNovedadGPS
  latitud         Decimal?        @db.Decimal(9, 6)
  longitud        Decimal?        @db.Decimal(9, 6)
  municipioDane   String?         // cód. DANE del municipio de la novedad
  descripcion     String?

  // Respuesta RNDC (procesoid 45)
  estadoRndc      String?
  codigoRndc      String?
  fechaRegistro   DateTime?       // confirmación de registro en RNDC

  // Metadata
  registradaEn    DateTime        @default(now())
  registradaPor   String?         // userId del operador

  @@map("novedades_gps")
}
```

### 4. Modelo `FacturaElectronica`

Ciclo de vida dual DIAN → RNDC.

```prisma
model FacturaElectronica {
  id                String              @id @default(cuid())
  nuevoNegocioId    String
  nuevoNegocio      NuevoNegocio        @relation(fields: [nuevoNegocioId], references: [id])

  numeroFactura     String              @unique  // ej. FT-001-000001
  cufe              String?             @unique  // CUFE emitido por DIAN
  fechaExpedicion   DateTime            @default(now())

  // Adquirente (cliente que paga)
  nitAdquirente     String
  nombreAdquirente  String

  // Valores
  subtotal          Decimal             @db.Decimal(15, 2)
  iva               Decimal             @default(0) @db.Decimal(15, 2)  // 0% transporte
  total             Decimal             @db.Decimal(15, 2)

  // Estados
  estadoDian        EstadoFacturaDian   @default(BORRADOR)
  estadoRndc        EstadoFacturaRndc   @default(PENDIENTE)

  // Documentos y respuestas
  xmlDian           String?             @db.Text   // XML UBL 2.1 enviado a DIAN
  respuestaDian     Json?               // respuesta cruda del proveedor DIAN
  respuestaRndc     Json?               // respuesta XML parseada del WS RNDC

  // Remesas cubiertas por esta factura
  remesasIds        String[]            @default([])  // Postgres array

  // Metadata
  creadaEn          DateTime            @default(now())
  actualizadaEn     DateTime            @updatedAt
  creadaPor         String?             // userId del operador

  @@map("facturas_electronicas")
}
```

### 5. Relaciones a agregar en modelos existentes

En el modelo `Manifiesto` (definido en Fase 1), agregar:

```prisma
// Relaciones Fase 2
aceptacionConductor AceptacionConductor?
novedadesGPS        NovedadGPS[]
```

En el modelo `NuevoNegocio` (Fase 1), agregar:

```prisma
// Relaciones Fase 2
facturas            FacturaElectronica[]
```

---

## Migración

Una vez editado el schema, ejecutar:

```bash
npx prisma migrate dev --name fase2_factura_aceptacion_gps
npx prisma generate
```

Verificar que la migración crea correctamente:
- Tabla `aceptaciones_conductor`
- Tabla `novedades_gps`
- Tabla `facturas_electronicas`
- Enums `EstadoFacturaDian`, `EstadoFacturaRndc`, `TipoNovedadGPS`

---

## Validaciones del schema

- `numeroFactura` es único por empresa — considerar índice compuesto si hay multi-tenant
- `cufe` puede ser null hasta que DIAN confirme aprobación
- `manifiestoId` en `AceptacionConductor` tiene `@unique` (1:1 relación)
- `manifiestoId` en `NovedadGPS` es N:1 (un manifiesto = múltiples novedades)
- `iva` default 0: el transporte de carga está gravado al 0% de IVA en Colombia
