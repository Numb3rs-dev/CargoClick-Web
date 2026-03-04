-- CreateEnum
CREATE TYPE "CategoriaLicencia" AS ENUM ('A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3');

-- CreateEnum
CREATE TYPE "EstadoRndcRemesa" AS ENUM ('PENDIENTE', 'ENVIADA', 'REGISTRADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoOperativoRemesa" AS ENUM ('PENDIENTE', 'ASIGNADA', 'EN_TRANSITO', 'ENTREGADA', 'NOVEDAD');

-- CreateEnum
CREATE TYPE "EstadoManifiesto" AS ENUM ('BORRADOR', 'ENVIADO', 'REGISTRADO', 'ACEPTADO_CONDUCTOR', 'CULMINADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "EstadoNegocio" AS ENUM ('CONFIRMADO', 'EN_PREPARACION', 'EN_TRANSITO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "HitoSeguimiento" AS ENUM ('NEGOCIO_CONFIRMADO', 'REMESAS_ASIGNADAS', 'DESPACHADO', 'EN_RUTA', 'EN_DESTINO', 'ENTREGADO', 'NOVEDAD');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('WHATSAPP', 'EMAIL', 'PORTAL', 'SMS');

-- CreateEnum
CREATE TYPE "TipoConsultaRunt" AS ENUM ('CONDUCTOR', 'VEHICULO');

-- CreateTable
CREATE TABLE "conductores" (
    "id" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "categoriaLicencia" "CategoriaLicencia" NOT NULL,
    "licenciaVigencia" DATE,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "ultimaConsultaRunt" TIMESTAMP(3),
    "snapshotRunt" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conductores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "propietarioNombre" TEXT,
    "propietarioId" TEXT,
    "configVehiculo" TEXT,
    "capacidadTon" DECIMAL(8,2),
    "tipoVehiculo" TEXT,
    "anioVehiculo" INTEGER,
    "soatVigencia" DATE,
    "rtmVigencia" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "ultimaConsultaRunt" TIMESTAMP(3),
    "snapshotRunt" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_runt" (
    "id" TEXT NOT NULL,
    "tipo" "TipoConsultaRunt" NOT NULL,
    "identificador" TEXT NOT NULL,
    "respuestaJson" JSONB NOT NULL,
    "realizadaPor" TEXT,
    "conductorCedula" TEXT,
    "vehiculoPlaca" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_runt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nuevos_negocios" (
    "id" TEXT NOT NULL,
    "codigoNegocio" TEXT NOT NULL,
    "solicitudId" TEXT,
    "cotizacionId" TEXT,
    "ajusteComercialId" TEXT,
    "clienteNombre" TEXT,
    "clienteNit" TEXT,
    "fechaCierre" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaDespachoEstimada" DATE,
    "estado" "EstadoNegocio" NOT NULL DEFAULT 'CONFIRMADO',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nuevos_negocios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remesas" (
    "id" TEXT NOT NULL,
    "numeroRemesa" TEXT NOT NULL,
    "nuevoNegocioId" TEXT NOT NULL,
    "manifiestoOperativoId" TEXT,
    "descripcionCarga" TEXT NOT NULL,
    "codigoAranceladoCarga" TEXT,
    "pesoKg" INTEGER NOT NULL,
    "volumenM3" DECIMAL(8,3),
    "unidadMedidaProducto" TEXT NOT NULL DEFAULT 'KGM',
    "cantidadProducto" DECIMAL(12,3),
    "codOperacionTransporte" TEXT NOT NULL DEFAULT 'G',
    "codNaturalezaCarga" TEXT NOT NULL DEFAULT 'G',
    "codigoEmpaque" INTEGER NOT NULL DEFAULT 10,
    "tipoIdRemitente" TEXT NOT NULL DEFAULT 'N',
    "nitRemitente" TEXT NOT NULL,
    "codSedeRemitente" TEXT NOT NULL DEFAULT '1',
    "empresaRemitente" TEXT,
    "tipoIdDestinatario" TEXT NOT NULL DEFAULT 'N',
    "nitDestinatario" TEXT NOT NULL,
    "codSedeDestinatario" TEXT NOT NULL DEFAULT '1',
    "empresaDestinataria" TEXT,
    "tipoIdPropietario" TEXT NOT NULL DEFAULT 'N',
    "nitPropietario" TEXT NOT NULL,
    "origenMunicipio" TEXT NOT NULL,
    "origenDane" TEXT NOT NULL,
    "destinoMunicipio" TEXT NOT NULL,
    "destinoDane" TEXT NOT NULL,
    "direccionOrigen" TEXT,
    "direccionDestino" TEXT,
    "fechaHoraCitaCargue" TIMESTAMP(3),
    "fechaHoraCitaDescargue" TIMESTAMP(3),
    "horasPactoCarga" INTEGER NOT NULL DEFAULT 4,
    "minutosPactoCarga" INTEGER NOT NULL DEFAULT 0,
    "horasPactoDescargue" INTEGER NOT NULL DEFAULT 4,
    "minutosPactoDescargue" INTEGER NOT NULL DEFAULT 0,
    "valorDeclarado" DECIMAL(15,2),
    "valorAsegurado" DECIMAL(15,2),
    "ordenServicioGenerador" TEXT,
    "instruccionesEspeciales" TEXT,
    "numeroRemesaRndc" TEXT,
    "estadoRndc" "EstadoRndcRemesa" NOT NULL DEFAULT 'PENDIENTE',
    "respuestaRndcJson" JSONB,
    "estado" "EstadoOperativoRemesa" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifiestos_operativos" (
    "id" TEXT NOT NULL,
    "codigoInterno" TEXT NOT NULL,
    "numeroManifiesto" TEXT,
    "nuevoNegocioId" TEXT NOT NULL,
    "reemplazaManifiestoId" TEXT,
    "motivoAnulacion" TEXT,
    "conductorCedula" TEXT NOT NULL,
    "vehiculoPlaca" TEXT NOT NULL,
    "placaRemolque" TEXT,
    "placaRemolque2" TEXT,
    "origenMunicipio" TEXT NOT NULL,
    "origenDane" TEXT NOT NULL,
    "destinoMunicipio" TEXT NOT NULL,
    "destinoDane" TEXT NOT NULL,
    "pesoTotalKg" INTEGER NOT NULL,
    "fechaExpedicion" DATE NOT NULL,
    "fechaDespacho" DATE NOT NULL,
    "fletePactado" DECIMAL(15,2) NOT NULL,
    "retencionIca" INTEGER NOT NULL DEFAULT 4,
    "valorAnticipo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "municipioPagoSaldo" TEXT,
    "fechaPagoSaldo" DATE,
    "responsablePagoCargue" TEXT NOT NULL DEFAULT 'E',
    "responsablePagoDescargue" TEXT NOT NULL DEFAULT 'E',
    "aceptacionElectronica" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "estadoManifiesto" "EstadoManifiesto" NOT NULL DEFAULT 'BORRADOR',
    "respuestaRndcJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manifiestos_operativos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientoCliente" (
    "id" TEXT NOT NULL,
    "nuevoNegocioId" TEXT NOT NULL,
    "manifiestoOperativoId" TEXT,
    "hito" "HitoSeguimiento" NOT NULL,
    "descripcion" TEXT,
    "ubicacionActual" TEXT,
    "canalNotificacion" "CanalNotificacion" NOT NULL DEFAULT 'PORTAL',
    "notificadoEn" TIMESTAMP(3),
    "notificadoA" TEXT,
    "registradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguimientoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encuestas_post_entrega" (
    "id" TEXT NOT NULL,
    "nuevoNegocioId" TEXT NOT NULL,
    "calificacionGeneral" INTEGER NOT NULL,
    "calificacionTiempos" INTEGER,
    "calificacionTrato" INTEGER,
    "calificacionEstadoCarga" INTEGER,
    "comentario" TEXT,
    "recomendaria" BOOLEAN,
    "tokenEncuesta" TEXT NOT NULL,
    "enviadoEn" TIMESTAMP(3),
    "respondidoEn" TIMESTAMP(3),

    CONSTRAINT "encuestas_post_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_rndc" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "processId" INTEGER NOT NULL,
    "tipoSolicitud" INTEGER NOT NULL,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "requestXml" TEXT NOT NULL,
    "responseXml" TEXT,
    "httpStatus" INTEGER,
    "exitoso" BOOLEAN NOT NULL,
    "ingresoidRespuesta" TEXT,
    "errorMensaje" TEXT,
    "duracionMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_rndc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conductores_cedula_key" ON "conductores"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE INDEX "consultas_runt_tipo_identificador_idx" ON "consultas_runt"("tipo", "identificador");

-- CreateIndex
CREATE INDEX "consultas_runt_createdAt_idx" ON "consultas_runt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "nuevos_negocios_codigoNegocio_key" ON "nuevos_negocios"("codigoNegocio");

-- CreateIndex
CREATE INDEX "nuevos_negocios_estado_idx" ON "nuevos_negocios"("estado");

-- CreateIndex
CREATE INDEX "nuevos_negocios_clienteNit_idx" ON "nuevos_negocios"("clienteNit");

-- CreateIndex
CREATE UNIQUE INDEX "remesas_numeroRemesa_key" ON "remesas"("numeroRemesa");

-- CreateIndex
CREATE INDEX "remesas_nuevoNegocioId_idx" ON "remesas"("nuevoNegocioId");

-- CreateIndex
CREATE INDEX "remesas_manifiestoOperativoId_idx" ON "remesas"("manifiestoOperativoId");

-- CreateIndex
CREATE INDEX "remesas_estadoRndc_idx" ON "remesas"("estadoRndc");

-- CreateIndex
CREATE INDEX "remesas_estado_idx" ON "remesas"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "manifiestos_operativos_codigoInterno_key" ON "manifiestos_operativos"("codigoInterno");

-- CreateIndex
CREATE INDEX "manifiestos_operativos_nuevoNegocioId_idx" ON "manifiestos_operativos"("nuevoNegocioId");

-- CreateIndex
CREATE INDEX "manifiestos_operativos_conductorCedula_idx" ON "manifiestos_operativos"("conductorCedula");

-- CreateIndex
CREATE INDEX "manifiestos_operativos_vehiculoPlaca_idx" ON "manifiestos_operativos"("vehiculoPlaca");

-- CreateIndex
CREATE INDEX "manifiestos_operativos_estadoManifiesto_idx" ON "manifiestos_operativos"("estadoManifiesto");

-- CreateIndex
CREATE INDEX "manifiestos_operativos_fechaDespacho_idx" ON "manifiestos_operativos"("fechaDespacho");

-- CreateIndex
CREATE INDEX "seguimientoCliente_nuevoNegocioId_idx" ON "seguimientoCliente"("nuevoNegocioId");

-- CreateIndex
CREATE UNIQUE INDEX "encuestas_post_entrega_nuevoNegocioId_key" ON "encuestas_post_entrega"("nuevoNegocioId");

-- CreateIndex
CREATE UNIQUE INDEX "encuestas_post_entrega_tokenEncuesta_key" ON "encuestas_post_entrega"("tokenEncuesta");

-- CreateIndex
CREATE INDEX "sync_rndc_entidadTipo_entidadId_idx" ON "sync_rndc"("entidadTipo", "entidadId");

-- CreateIndex
CREATE INDEX "sync_rndc_processId_idx" ON "sync_rndc"("processId");

-- CreateIndex
CREATE INDEX "sync_rndc_exitoso_idx" ON "sync_rndc"("exitoso");

-- CreateIndex
CREATE INDEX "sync_rndc_createdAt_idx" ON "sync_rndc"("createdAt");

-- AddForeignKey
ALTER TABLE "consultas_runt" ADD CONSTRAINT "consultas_runt_conductorCedula_fkey" FOREIGN KEY ("conductorCedula") REFERENCES "conductores"("cedula") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_runt" ADD CONSTRAINT "consultas_runt_vehiculoPlaca_fkey" FOREIGN KEY ("vehiculoPlaca") REFERENCES "vehiculos"("placa") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remesas" ADD CONSTRAINT "remesas_nuevoNegocioId_fkey" FOREIGN KEY ("nuevoNegocioId") REFERENCES "nuevos_negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remesas" ADD CONSTRAINT "remesas_manifiestoOperativoId_fkey" FOREIGN KEY ("manifiestoOperativoId") REFERENCES "manifiestos_operativos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiestos_operativos" ADD CONSTRAINT "manifiestos_operativos_nuevoNegocioId_fkey" FOREIGN KEY ("nuevoNegocioId") REFERENCES "nuevos_negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiestos_operativos" ADD CONSTRAINT "manifiestos_operativos_conductorCedula_fkey" FOREIGN KEY ("conductorCedula") REFERENCES "conductores"("cedula") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiestos_operativos" ADD CONSTRAINT "manifiestos_operativos_vehiculoPlaca_fkey" FOREIGN KEY ("vehiculoPlaca") REFERENCES "vehiculos"("placa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiestos_operativos" ADD CONSTRAINT "manifiestos_operativos_reemplazaManifiestoId_fkey" FOREIGN KEY ("reemplazaManifiestoId") REFERENCES "manifiestos_operativos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientoCliente" ADD CONSTRAINT "seguimientoCliente_nuevoNegocioId_fkey" FOREIGN KEY ("nuevoNegocioId") REFERENCES "nuevos_negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuestas_post_entrega" ADD CONSTRAINT "encuestas_post_entrega_nuevoNegocioId_fkey" FOREIGN KEY ("nuevoNegocioId") REFERENCES "nuevos_negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
