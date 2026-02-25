-- CreateTable
CREATE TABLE "distancias" (
    "origen" VARCHAR(5) NOT NULL,
    "destino" VARCHAR(5) NOT NULL,
    "km" INTEGER NOT NULL,
    "validado" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "distancias_pkey" PRIMARY KEY ("origen","destino")
);
