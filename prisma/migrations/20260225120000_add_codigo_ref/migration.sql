-- AddColumn: codigo_ref a la tabla solicitudes
-- Estrategia: añadir con default temporal → poblar → quitar default → unique constraint

-- 1. Añadir la columna con default vacío para no bloquear los registros existentes
ALTER TABLE "solicitudes" ADD COLUMN "codigo_ref" VARCHAR(8) NOT NULL DEFAULT '';

-- 2. Poblar registros existentes con los últimos 8 chars del ULID (id) en mayúsculas
UPDATE "solicitudes" SET "codigo_ref" = UPPER(RIGHT("id", 8));

-- 3. Eliminar el DEFAULT temporal (los nuevos registros siempre se insertan desde la app)
ALTER TABLE "solicitudes" ALTER COLUMN "codigo_ref" DROP DEFAULT;

-- 4. Agregar constraint UNIQUE
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_codigo_ref_key" UNIQUE ("codigo_ref");

-- 5. Índice para búsquedas por codigoRef
CREATE INDEX "solicitudes_codigo_ref_idx" ON "solicitudes"("codigo_ref");
