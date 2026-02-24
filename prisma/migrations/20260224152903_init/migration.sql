-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('urbano', 'nacional');

-- CreateEnum
CREATE TYPE "TipoCarga" AS ENUM ('carga_general', 'refrigerada', 'contenedor', 'granel_solido', 'granel_liquido');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('en_progreso', 'completada', 'pendiente', 'cotizado', 'rechazado', 'cerrado');

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" TEXT NOT NULL,
    "tipoServicio" "TipoServicio" NOT NULL,
    "origen" VARCHAR(200) NOT NULL,
    "destino" VARCHAR(200),
    "distancia_km" DOUBLE PRECISION,
    "tramo_distancia" VARCHAR(20),
    "tiempo_transito_desc" VARCHAR(100),
    "tipoCarga" "TipoCarga" NOT NULL,
    "pesoKg" DECIMAL(10,2) NOT NULL,
    "dimLargoCm" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dimAnchoCm" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dimAltoCm" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "volumen_m3" DOUBLE PRECISION,
    "vehiculo_sugerido_id" VARCHAR(50),
    "vehiculo_sugerido_nombre" VARCHAR(200),
    "valorAsegurado" DECIMAL(15,2) NOT NULL,
    "condicionesCargue" JSONB NOT NULL,
    "fechaRequerida" DATE NOT NULL,
    "empresa" VARCHAR(200),
    "telefono_empresa" VARCHAR(50),
    "contacto" VARCHAR(200) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "observaciones" TEXT,
    "carga_peligrosa" BOOLEAN DEFAULT false,
    "detalle_carga_peligrosa" TEXT,
    "ayudante_cargue" BOOLEAN DEFAULT false,
    "ayudante_descargue" BOOLEAN DEFAULT false,
    "carga_fragil" BOOLEAN DEFAULT false,
    "necesita_empaque" BOOLEAN DEFAULT false,
    "multiples_destinos_entrega" BOOLEAN DEFAULT false,
    "detalle_multiples_destinos" TEXT,
    "requiere_escolta" BOOLEAN DEFAULT false,
    "accesos_dificiles" BOOLEAN DEFAULT false,
    "detalle_accesos_dificiles" TEXT,
    "carga_sobredimensionada" BOOLEAN DEFAULT false,
    "detalle_sobredimensionada" TEXT,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "revisionEspecial" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_params" (
    "id" SERIAL NOT NULL,
    "periodoYyyyMm" INTEGER NOT NULL,
    "acpmPriceCopGal" DECIMAL(12,2) NOT NULL,
    "smlmv" DECIMAL(15,2) NOT NULL,
    "interesMensualBr" DECIMAL(8,6) NOT NULL,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_params" (
    "id" SERIAL NOT NULL,
    "configId" VARCHAR(10) NOT NULL,
    "ano" INTEGER NOT NULL,
    "valorVehiculoCop" DECIMAL(15,2) NOT NULL,
    "mesesRecuperacion" INTEGER NOT NULL,
    "soatAnualCop" DECIMAL(12,2) NOT NULL,
    "seguroTodoRiesgoAnualCop" DECIMAL(12,2) NOT NULL,
    "rtmAnualCop" DECIMAL(12,2) NOT NULL,
    "comunicacionesMesCop" DECIMAL(12,2) NOT NULL,
    "parqueaderoNocheCop" DECIMAL(12,2) NOT NULL,
    "precioLlantaTraccionCop" DECIMAL(12,2) NOT NULL,
    "qtyLlantasTraccion" INTEGER NOT NULL,
    "vidaUtilTraccionKm" INTEGER NOT NULL,
    "precioLlantaDireccionalCop" DECIMAL(12,2) NOT NULL,
    "qtyLlantasDireccional" INTEGER NOT NULL,
    "vidaUtilDireccionalKm" INTEGER NOT NULL,
    "indicadorLubricantesCopKm" DECIMAL(10,4) NOT NULL,
    "indicadorFiltrosCopKm" DECIMAL(10,4) NOT NULL,
    "indicadorLavadoEngraseCopKm" DECIMAL(10,4) NOT NULL,
    "mantenimientoCopKm" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "vehicle_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_terrain" (
    "id" SERIAL NOT NULL,
    "origenDane" VARCHAR(10) NOT NULL,
    "destinoDane" VARCHAR(10) NOT NULL,
    "kmPlanoPercent" DECIMAL(5,2) NOT NULL,
    "kmOnduladoPercent" DECIMAL(5,2) NOT NULL,
    "kmMontanosoPercent" DECIMAL(5,2) NOT NULL,
    "totalPeajesC2Cop" DECIMAL(12,2) NOT NULL,
    "totalPeajesC3Cop" DECIMAL(12,2) NOT NULL,
    "fuente" VARCHAR(100),
    "vigenciaDesde" DATE NOT NULL,

    CONSTRAINT "route_terrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_params" (
    "id" SERIAL NOT NULL,
    "vigenciaDesde" DATE NOT NULL,
    "margenOperadorPercent" DECIMAL(5,2) NOT NULL,
    "redondeoMilCop" INTEGER NOT NULL DEFAULT 50000,
    "validezCotizacionHoras" INTEGER NOT NULL DEFAULT 48,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,

    CONSTRAINT "commercial_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "periodo_parametros" INTEGER NOT NULL,
    "config_vehiculo" VARCHAR(10) NOT NULL,
    "distancia_km" DOUBLE PRECISION NOT NULL,
    "cv_total" DECIMAL(15,2) NOT NULL,
    "cf_por_viaje" DECIMAL(15,2) NOT NULL,
    "costo_tecnico_base" DECIMAL(15,2) NOT NULL,
    "flete_referencial_sisetac" DECIMAL(15,2) NOT NULL,
    "tarifa_sugerida" DECIMAL(15,2) NOT NULL,
    "margen_aplicado" DECIMAL(5,2) NOT NULL,
    "desglose_cv" JSONB NOT NULL,
    "desglose_cf" JSONB NOT NULL,
    "parametros_usados" JSONB NOT NULL,
    "rndc_estimado" DECIMAL(15,2),
    "rndc_mediana" DECIMAL(15,2),
    "rndc_confianza" VARCHAR(10),
    "rndc_viajes_similares" INTEGER,
    "rndc_nivel_fallback" INTEGER,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'VIGENTE',
    "validez_hasta" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes_comerciales" (
    "id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "cotizacion_base_id" TEXT NOT NULL,
    "vehiculo_usado" VARCHAR(10) NOT NULL,
    "margen_simulado" DECIMAL(5,2) NOT NULL,
    "tarifa_ofertada_cliente" DECIMAL(15,2),
    "margen_efectivo_oferta" DECIMAL(6,2),
    "tarifa_confirmada_cliente" DECIMAL(15,2),
    "fecha_aceptacion" TIMESTAMP(3),
    "pago_al_conductor" DECIMAL(15,2),
    "margen_bruto_cop" DECIMAL(15,2),
    "margen_bruto_percent" DECIMAL(6,2),
    "forma_pago" VARCHAR(20) NOT NULL DEFAULT 'CONTADO',
    "dias_credito" INTEGER NOT NULL DEFAULT 0,
    "estado_negociacion" VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    "nombre_comercial" VARCHAR(100),
    "creado_por" VARCHAR(100),
    "modificado_por" VARCHAR(100),
    "motivo_ajuste" TEXT,
    "motivo_rechazo" TEXT,
    "notas_comerciales" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ajustes_comerciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifiestos_rndc" (
    "id" SERIAL NOT NULL,
    "manifiesto" VARCHAR(30) NOT NULL,
    "fecha_expedicion" DATE NOT NULL,
    "origen" VARCHAR(100) NOT NULL,
    "origen_dept" VARCHAR(60) NOT NULL,
    "destino" VARCHAR(100) NOT NULL,
    "destino_dept" VARCHAR(60) NOT NULL,
    "peso_kg" INTEGER NOT NULL,
    "flete_pactado" DECIMAL(15,2) NOT NULL,
    "flete_neto" DECIMAL(15,2) NOT NULL,
    "retencion_ica" DECIMAL(15,2) NOT NULL,
    "placa" VARCHAR(10),
    "conductor_id" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manifiestos_rndc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_created_at_idx" ON "solicitudes"("created_at" DESC);

-- CreateIndex
CREATE INDEX "solicitudes_email_idx" ON "solicitudes"("email");

-- CreateIndex
CREATE INDEX "solicitudes_empresa_idx" ON "solicitudes"("empresa");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_params_periodoYyyyMm_key" ON "monthly_params"("periodoYyyyMm");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_params_configId_ano_key" ON "vehicle_params"("configId", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "route_terrain_origenDane_destinoDane_key" ON "route_terrain"("origenDane", "destinoDane");

-- CreateIndex
CREATE INDEX "cotizaciones_solicitud_id_idx" ON "cotizaciones"("solicitud_id");

-- CreateIndex
CREATE INDEX "ajustes_comerciales_solicitud_id_idx" ON "ajustes_comerciales"("solicitud_id");

-- CreateIndex
CREATE INDEX "ajustes_comerciales_estado_negociacion_idx" ON "ajustes_comerciales"("estado_negociacion");

-- CreateIndex
CREATE INDEX "manifiestos_rndc_origen_destino_idx" ON "manifiestos_rndc"("origen", "destino");

-- CreateIndex
CREATE INDEX "manifiestos_rndc_peso_kg_idx" ON "manifiestos_rndc"("peso_kg");

-- CreateIndex
CREATE INDEX "manifiestos_rndc_fecha_expedicion_idx" ON "manifiestos_rndc"("fecha_expedicion");

-- CreateIndex
CREATE UNIQUE INDEX "manifiestos_rndc_manifiesto_key" ON "manifiestos_rndc"("manifiesto");

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_comerciales" ADD CONSTRAINT "ajustes_comerciales_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_comerciales" ADD CONSTRAINT "ajustes_comerciales_cotizacion_base_id_fkey" FOREIGN KEY ("cotizacion_base_id") REFERENCES "cotizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
