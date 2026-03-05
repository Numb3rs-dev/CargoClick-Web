# BACK-01: Extensión del Schema Prisma — Módulo Operacional

## CONTEXTO DE NEGOCIO

**Problema:** El schema actual cubre la capa comercial (Solicitud, Cotizacion, AjusteComercial). Para operar necesitamos los modelos de la capa operacional: conductores, vehículos, remesas enviadas al RNDC, manifiestos de carga y el seguimiento post-despacho.

**Usuarios afectados:** Todo el módulo operacional — desde el operador que crea un manifiesto hasta el cliente que recibe la encuesta post-entrega.

**Valor:** Con este schema el sistema puede reemplazar la plataforma actual de Transportes Nuevo Mundo — registrar manifiestos directamente en el RNDC sin salir de CargoClick.

---

## ENUMS NUEVOS

Agregar al final del bloque de enums en `prisma/schema.prisma`:

```prisma
enum CategoriaLicencia {
  A1
  A2
  B1
  B2
  B3
  C1
  C2
  C3
}

enum EstadoRndcRemesa {
  PENDIENTE    // creada internamente, no enviada al RNDC
  ENVIADA      // petición SOAP enviada, esperando respuesta
  REGISTRADA   // RNDC asignó NUMREMESA
  ANULADA      // anulada vía procesoid 38
}

enum EstadoOperativoRemesa {
  PENDIENTE    // sin asignar a manifiesto
  ASIGNADA     // asignada a un ManifiestoOperativo
  EN_TRANSITO  // manifiesto despachado
  ENTREGADA    // carga entregada exitosamente
  NOVEDAD      // incidente durante el transporte
}

enum EstadoManifiesto {
  BORRADOR           // creado internamente, no enviado
  ENVIADO            // petición SOAP enviada
  REGISTRADO         // RNDC asignó número de manifiesto
  ACEPTADO_CONDUCTOR // conductor firmó vía app (Fase 2)
  CULMINADO          // procesoid 5+6 completados
  ANULADO            // anulado vía procesoid 32
}

enum EstadoNegocio {
  CONFIRMADO      // negocio cerrado, pendiente de armar viaje
  EN_PREPARACION  // remesas y manifiestos en proceso
  EN_TRANSITO     // al menos un manifiesto despachado
  COMPLETADO      // todos los manifiestos culminados
  CANCELADO       // negocio cancelado
}

enum HitoSeguimiento {
  NEGOCIO_CONFIRMADO
  REMESAS_ASIGNADAS
  DESPACHADO
  EN_RUTA
  EN_DESTINO
  ENTREGADO
  NOVEDAD
}

enum CanalNotificacion {
  WHATSAPP
  EMAIL
  PORTAL
  SMS
}

enum TipoConsultaRunt {
  CONDUCTOR
  VEHICULO
}
```

---

## MODELOS NUEVOS

Agregar después de los modelos existentes en `prisma/schema.prisma`:

```prisma
// ══════════════════════════════════════════════════════
// DIRECTORIO OPERATIVO
// ══════════════════════════════════════════════════════

model Conductor {
  id                  String             @id @default(cuid())
  cedula              String             @unique
  nombres             String
  apellidos           String
  categoriaLicencia   CategoriaLicencia
  licenciaVigencia    DateTime?          @db.Date
  telefono            String?
  email               String?
  activo              Boolean            @default(true)
  notas               String?            @db.Text
  ultimaConsultaRunt  DateTime?
  snapshotRunt        Json?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  manifiestos         ManifiestoOperativo[]
  consultasRunt       ConsultaRunt[]

  @@map("conductores")
}

model Vehiculo {
  id                  String    @id @default(cuid())
  placa               String    @unique
  propietarioNombre   String?
  propietarioId       String?
  configVehiculo      String?   // C2, C3, C2S2, C2S3, C3S2, C3S3
  capacidadTon        Decimal?  @db.Decimal(8, 2)
  tipoVehiculo        String?   // CAMION, TRACTOCAMION, MINIMULA, etc.
  anioVehiculo        Int?
  soatVigencia        DateTime? @db.Date
  rtmVigencia         DateTime? @db.Date
  activo              Boolean   @default(true)
  notas               String?   @db.Text
  ultimaConsultaRunt  DateTime?
  snapshotRunt        Json?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  manifiestos         ManifiestoOperativo[]
  consultasRunt       ConsultaRunt[]

  @@map("vehiculos")
}

model ConsultaRunt {
  id               String           @id @default(cuid())
  tipo             TipoConsultaRunt
  identificador    String           // cédula o placa al momento de la consulta
  respuestaJson    Json
  realizadaPor     String?          // userId Clerk
  conductorCedula  String?
  vehiculoPlaca    String?
  createdAt        DateTime         @default(now())

  conductor        Conductor?       @relation(fields: [conductorCedula], references: [cedula])
  vehiculo         Vehiculo?        @relation(fields: [vehiculoPlaca], references: [placa])

  @@index([tipo, identificador])
  @@index([createdAt])
  @@map("consultas_runt")
}

// ══════════════════════════════════════════════════════
// MÓDULO OPERACIONAL CORE
// ══════════════════════════════════════════════════════

model NuevoNegocio {
  id                    String        @id @default(cuid())
  codigoNegocio         String        @unique // NEG-2026-NNNN
  solicitudId           String?
  cotizacionId          String?
  ajusteComercialId     String?
  clienteNombre         String?
  clienteNit            String?
  fechaCierre           DateTime      @default(now())
  fechaDespachoEstimada DateTime?     @db.Date
  estado                EstadoNegocio @default(CONFIRMADO)
  notas                 String?       @db.Text
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  remesas               Remesa[]
  manifiestos           ManifiestoOperativo[]
  seguimientos          SeguimientoCliente[]
  encuesta              EncuestaPostEntrega?

  @@index([estado])
  @@index([clienteNit])
  @@map("nuevos_negocios")
}

model Remesa {
  id                       String                @id @default(cuid())
  numeroRemesa             String                @unique // REM-2026-NNNN
  nuevoNegocioId           String
  manifiestoOperativoId    String?

  // Descripción de la carga
  descripcionCarga         String                // max 60 chars
  codigoAranceladoCarga    String?
  pesoKg                   Int
  volumenM3                Decimal?              @db.Decimal(8, 3)
  unidadMedidaProducto     String                @default("KGM")
  cantidadProducto         Decimal?              @db.Decimal(12, 3)

  // Clasificación RNDC
  codOperacionTransporte   String                @default("G")
  codNaturalezaCarga       String                @default("G")
  codigoEmpaque            Int                   @default(10)

  // Remitente
  tipoIdRemitente          String                @default("N")
  nitRemitente             String
  codSedeRemitente         String                @default("1")
  empresaRemitente         String?

  // Destinatario
  tipoIdDestinatario       String                @default("N")
  nitDestinatario          String
  codSedeDestinatario      String                @default("1")
  empresaDestinataria      String?

  // Propietario de la carga
  tipoIdPropietario        String                @default("N")
  nitPropietario           String

  // Puntos origen-destino
  origenMunicipio          String
  origenDane               String                // DANE 8 dígitos
  destinoMunicipio         String
  destinoDane              String                // DANE 8 dígitos
  direccionOrigen          String?
  direccionDestino         String?

  // Tiempos logísticos (obligatorio RNDC desde nov 2025)
  fechaHoraCitaCargue      DateTime?
  fechaHoraCitaDescargue   DateTime?
  horasPactoCarga          Int                   @default(4)
  minutosPactoCarga        Int                   @default(0)
  horasPactoDescargue      Int                   @default(4)
  minutosPactoDescargue    Int                   @default(0)

  // Valores
  valorDeclarado           Decimal?              @db.Decimal(15, 2)
  valorAsegurado           Decimal?              @db.Decimal(15, 2)
  ordenServicioGenerador   String?               // max 20 chars
  instruccionesEspeciales  String?               @db.Text

  // Estado RNDC
  numeroRemesaRndc         String?
  estadoRndc               EstadoRndcRemesa      @default(PENDIENTE)
  respuestaRndcJson        Json?

  // Estado operativo
  estado                   EstadoOperativoRemesa @default(PENDIENTE)

  createdAt                DateTime              @default(now())
  updatedAt                DateTime              @updatedAt

  nuevoNegocio             NuevoNegocio          @relation(fields: [nuevoNegocioId], references: [id])
  manifiestoOperativo      ManifiestoOperativo?  @relation(fields: [manifiestoOperativoId], references: [id])

  @@index([nuevoNegocioId])
  @@index([manifiestoOperativoId])
  @@index([estadoRndc])
  @@index([estado])
  @@map("remesas")
}

model ManifiestoOperativo {
  id                       String            @id @default(cuid())
  codigoInterno            String            @unique // MF-2026-NNNN — clave idempotente
  numeroManifiesto         String?           // asignado por el RNDC
  nuevoNegocioId           String
  reemplazaManifiestoId    String?           // FK al manifiesto anulado (correcciones)
  motivoAnulacion          String?

  // Conductor y vehículo (FK a cedula/placa, no a id)
  conductorCedula          String
  vehiculoPlaca            String
  placaRemolque            String?
  placaRemolque2           String?

  // Ruta del viaje
  origenMunicipio          String
  origenDane               String            // DANE 8 dígitos
  destinoMunicipio         String
  destinoDane              String            // DANE 8 dígitos

  // Peso (campo derivado — suma de remesas[].pesoKg al construir XML)
  pesoTotalKg              Int

  // Fechas
  fechaExpedicion          DateTime          @db.Date
  fechaDespacho            DateTime          @db.Date

  // Valores económicos
  fletePactado             Decimal           @db.Decimal(15, 2)
  retencionIca             Int               @default(4)
  valorAnticipo            Decimal           @default(0) @db.Decimal(15, 2)
  municipioPagoSaldo       String?           // DANE 8 dígitos, default = destino
  fechaPagoSaldo           DateTime?         @db.Date
  responsablePagoCargue    String            @default("E")  // E, T, G
  responsablePagoDescargue String            @default("E")

  // Aceptación y observaciones
  aceptacionElectronica    Boolean           @default(true)
  observaciones            String?           @db.Text

  // Estado RNDC
  estadoManifiesto         EstadoManifiesto  @default(BORRADOR)
  respuestaRndcJson        Json?

  createdAt                DateTime          @default(now())
  updatedAt                DateTime          @updatedAt

  nuevoNegocio             NuevoNegocio      @relation(fields: [nuevoNegocioId], references: [id])
  conductor                Conductor         @relation(fields: [conductorCedula], references: [cedula])
  vehiculo                 Vehiculo          @relation(fields: [vehiculoPlaca], references: [placa])
  remesas                  Remesa[]
  reemplazadoPor           ManifiestoOperativo?  @relation("Correccion", fields: [reemplazaManifiestoId], references: [id])
  reemplazos               ManifiestoOperativo[] @relation("Correccion")

  @@index([nuevoNegocioId])
  @@index([conductorCedula])
  @@index([vehiculoPlaca])
  @@index([estadoManifiesto])
  @@index([fechaDespacho])
  @@map("manifiestos_operativos")
}

// ══════════════════════════════════════════════════════
// SEGUIMIENTO Y FEEDBACK
// ══════════════════════════════════════════════════════

model SeguimientoCliente {
  id                    String             @id @default(cuid())
  nuevoNegocioId        String
  manifiestoOperativoId String?
  hito                  HitoSeguimiento
  descripcion           String?
  ubicacionActual       String?
  canalNotificacion     CanalNotificacion  @default(PORTAL)
  notificadoEn          DateTime?
  notificadoA           String?
  registradoPor         String?            // userId Clerk
  createdAt             DateTime           @default(now())

  nuevoNegocio          NuevoNegocio       @relation(fields: [nuevoNegocioId], references: [id])

  @@index([nuevoNegocioId])
  @@map("seguimientoCliente")
}

model EncuestaPostEntrega {
  id                    String      @id @default(cuid())
  nuevoNegocioId        String      @unique
  calificacionGeneral   Int         // 1-5
  calificacionTiempos   Int?
  calificacionTrato     Int?
  calificacionEstadoCarga Int?
  comentario            String?     @db.Text
  recomendaria          Boolean?
  tokenEncuesta         String      @unique @default(cuid())
  enviadoEn             DateTime?   // cuándo se envió el link
  respondidoEn          DateTime?   // null hasta que el cliente responde

  nuevoNegocio          NuevoNegocio @relation(fields: [nuevoNegocioId], references: [id])

  @@map("encuestas_post_entrega")
}

// ══════════════════════════════════════════════════════
// AUDIT LOG RNDC (append-only)
// ══════════════════════════════════════════════════════

model SyncRndc {
  id                  String   @id @default(cuid())
  sessionId           String?  // agrupa llamadas del mismo flujo
  processId           Int      // 3=Remesa, 4=Manifiesto, 5=CumplirRemesa, etc.
  tipoSolicitud       Int      // 1=enviar, 2=maestros, 3=consultar
  entidadTipo         String   // "Remesa" | "ManifiestoOperativo" | "Conductor" | "Vehiculo"
  entidadId           String
  requestXml          String   @db.Text   // sin contraseña
  responseXml         String?  @db.Text
  httpStatus          Int?
  exitoso             Boolean
  ingresoidRespuesta  String?
  errorMensaje        String?  @db.Text
  duracionMs          Int?
  createdAt           DateTime @default(now())

  @@index([entidadTipo, entidadId])
  @@index([processId])
  @@index([exitoso])
  @@index([createdAt])
  @@map("sync_rndc")
}
```

---

## MIGRACIÓN

### 1. Ejecutar la migración

```bash
npx prisma migrate dev --name modulo-operacional
```

### 2. Verificar que el seed no rompe

```bash
npx prisma db seed
```

### 3. Abrir Prisma Studio para validar modelos

```bash
npx prisma studio
```

---

## GENERACIÓN DE CONSECUTIVOS

Los campos `codigoNegocio`, `numeroRemesa` y `codigoInterno` (manifiesto) necesitan un consecutivo por año. Implementar en `lib/utils/consecutivos.ts`:

```typescript
/**
 * Genera el siguiente código consecutivo para una entidad.
 * Formato: PREFIX-YYYY-NNNN (ej: NEG-2026-0001)
 * 
 * Requiere que la tabla tenga un campo `codigoXxx` con el patrón correcto
 * y que la consulta se haga en la misma transacción para evitar race conditions.
 */
export async function generarConsecutivo(
  tx: PrismaClient,
  modelo: 'nuevoNegocio' | 'remesa' | 'manifiestoOperativo',
  prefijo: 'NEG' | 'REM' | 'MF'
): Promise<string> {
  const anio = new Date().getFullYear();
  const patron = `${prefijo}-${anio}-`;

  // Buscar el último código del año actual
  // Usar un campo específico según el modelo
  const campoCode = {
    nuevoNegocio: 'codigoNegocio',
    remesa: 'numeroRemesa',
    manifiestoOperativo: 'codigoInterno',
  }[modelo];

  const ultimo = await (tx[modelo] as any).findFirst({
    where: { [campoCode]: { startsWith: patron } },
    orderBy: { [campoCode]: 'desc' },
    select: { [campoCode]: true },
  });

  const siguiente = ultimo
    ? parseInt(ultimo[campoCode].split('-')[2]) + 1
    : 1;

  return `${patron}${String(siguiente).padStart(4, '0')}`;
}
```

> **Nota de concurrencia:** usar `generarConsecutivo` dentro de una transacción Prisma (`$transaction`) para evitar colisiones en alta concurrencia.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `npx prisma migrate dev` ejecuta sin errores
- [ ] `npx prisma studio` muestra los 9 modelos nuevos con sus campos
- [ ] Los enums se muestran correctamente en Prisma Studio
- [ ] Los índices compuestos se crean correctamente en PostgreSQL
- [ ] Los campos `@unique` (`cedula`, `placa`, `codigoNegocio`, `numeroRemesa`, `codigoInterno`, `tokenEncuesta`) rechazan duplicados
- [ ] Las relaciones `Conductor ↔ ManifiestoOperativo` y `Vehiculo ↔ ManifiestoOperativo` usan `cedula`/`placa` como FK (no el `id` cuid)
- [ ] La auto-relación `ManifiestoOperativo.reemplazadoPor` permite navegar la cadena de correcciones
- [ ] `SyncRndc` no tiene `@updatedAt` — es append-only por diseño
