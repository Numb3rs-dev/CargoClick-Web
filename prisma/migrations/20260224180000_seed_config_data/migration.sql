-- Migration: seed_config_data
-- Data migration: inserts required SISETAC configuration data.
-- Uses ON CONFLICT DO NOTHING so it is safe to run multiple times.

-- ─── 1. MONTHLY PARAMS — Febrero 2026 ───────────────────────────────────────
INSERT INTO "monthly_params" (
  "periodoYyyyMm", "acpmPriceCopGal", "smlmv",
  "interesMensualBr", "notas", "created_at", "updated_at"
) VALUES (
  202602, 10850.00, 1423500.00, 0.008400,
  'Seed inicial — ACPM MinMinas ene-2026, SMLMV Decreto 2025, BR dic-2025',
  NOW(), NOW()
)
ON CONFLICT ("periodoYyyyMm") DO NOTHING;

-- ─── 2. VEHICLE PARAMS — 6 configuraciones 2026 ─────────────────────────────
INSERT INTO "vehicle_params" (
  "configId", "ano",
  "valorVehiculoCop", "mesesRecuperacion",
  "soatAnualCop", "seguroTodoRiesgoAnualCop",
  "rtmAnualCop", "comunicacionesMesCop", "parqueaderoNocheCop",
  "precioLlantaTraccionCop", "qtyLlantasTraccion", "vidaUtilTraccionKm",
  "precioLlantaDireccionalCop", "qtyLlantasDireccional", "vidaUtilDireccionalKm",
  "indicadorLubricantesCopKm", "indicadorFiltrosCopKm",
  "indicadorLavadoEngraseCopKm", "mantenimientoCopKm"
) VALUES
  ('C2',   2026, 180000000, 120, 1800000,  4500000,  450000,  120000, 20000, 950000,  4, 80000, 900000,  2, 100000, 28.50,  8.20,  5.10,  85.00),
  ('C3',   2026, 350000000, 192, 2400000,  8750000,  600000,  120000, 25000, 1200000, 4, 80000, 1100000, 2, 100000, 42.00, 12.50,  7.80, 128.00),
  ('C2S2', 2026, 500000000, 192, 3200000, 12500000,  900000,  140000, 35000, 1250000, 8, 80000, 1150000, 2, 100000, 55.00, 15.00,  9.50, 162.00),
  ('C2S3', 2026, 580000000, 192, 3500000, 14500000, 1000000,  140000, 38000, 1250000,12, 80000, 1150000, 2, 100000, 58.00, 16.00, 10.00, 172.00),
  ('C3S2', 2026, 620000000, 192, 3500000, 15500000, 1100000,  140000, 38000, 1280000,10, 80000, 1150000, 2, 100000, 62.00, 16.50, 10.50, 182.00),
  ('C3S3', 2026, 750000000, 192, 3800000, 18750000, 1200000,  150000, 40000, 1350000,12, 80000, 1200000, 4, 100000, 68.00, 18.00, 12.00, 195.00)
ON CONFLICT ("configId", "ano") DO NOTHING;

-- ─── 3. ROUTE TERRAIN — 10 corredores principales ───────────────────────────
INSERT INTO "route_terrain" (
  "origenDane", "destinoDane",
  "kmPlanoPercent", "kmOnduladoPercent", "kmMontanosoPercent",
  "totalPeajesC2Cop", "totalPeajesC3Cop",
  "fuente", "vigenciaDesde"
) VALUES
  ('11001','05001', 0.30, 0.40, 0.30,  75000, 110000, 'INVIAS 2024', '2024-01-01'),
  ('11001','76001', 0.40, 0.30, 0.30,  80000, 115000, 'INVIAS 2024', '2024-01-01'),
  ('11001','08001', 0.55, 0.30, 0.15, 140000, 200000, 'INVIAS 2024', '2024-01-01'),
  ('11001','68001', 0.35, 0.35, 0.30,  65000,  92000, 'INVIAS 2024', '2024-01-01'),
  ('11001','13001', 0.55, 0.30, 0.15, 155000, 222000, 'INVIAS 2024', '2024-01-01'),
  ('11001','66001', 0.35, 0.35, 0.30,  50000,  70000, 'INVIAS 2024', '2024-01-01'),
  ('11001','17001', 0.30, 0.35, 0.35,  55000,  78000, 'INVIAS 2024', '2024-01-01'),
  ('05001','76001', 0.35, 0.35, 0.30,  70000,  98000, 'INVIAS 2024', '2024-01-01'),
  ('05001','08001', 0.55, 0.30, 0.15, 130000, 185000, 'INVIAS 2024', '2024-01-01'),
  ('76001','76109', 0.25, 0.30, 0.45,  18000,  28000, 'INVIAS 2024', '2024-01-01')
ON CONFLICT ("origenDane", "destinoDane") DO NOTHING;

-- ─── 4. COMMERCIAL PARAMS — 20% margen ──────────────────────────────────────
INSERT INTO "commercial_params" (
  "vigenciaDesde", "margenOperadorPercent", "redondeoMilCop",
  "validezCotizacionHoras", "activo", "notas"
)
SELECT
  '2026-01-01', 20.00, 50000, 48, true,
  'Política comercial — 20% sobre piso SISETAC'
WHERE NOT EXISTS (
  SELECT 1 FROM "commercial_params" WHERE "activo" = true
);
