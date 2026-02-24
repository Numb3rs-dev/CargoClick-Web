import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed del motor de cotización SISETAC...\n')

  // ─────────────────────────────────────────────
  // 1. MONTHLY PARAMS — Febrero 2026
  // ─────────────────────────────────────────────
  await prisma.monthlyParams.upsert({
    where: { periodoYyyyMm: 202602 },
    update: {},
    create: {
      periodoYyyyMm:    202602,
      acpmPriceCopGal:  10850.00,
      smlmv:            1423500.00,
      interesMensualBr: 0.008400,
      notas:            'Seed inicial — ACPM MinMinas ene-2026, SMLMV Decreto 2025, BR dic-2025',
    },
  })
  console.log('✅ monthly_params: 202602 creado')

  // ─────────────────────────────────────────────
  // 2. VEHICLE PARAMS — 6 configs año 2026
  // ─────────────────────────────────────────────
  const vehicleData = [
    {
      configId: 'C2', ano: 2026,
      valorVehiculoCop: 180000000, mesesRecuperacion: 120,
      soatAnualCop: 1800000, seguroTodoRiesgoAnualCop: 4500000,
      rtmAnualCop: 450000, comunicacionesMesCop: 120000, parqueaderoNocheCop: 20000,
      precioLlantaTraccionCop: 950000, qtyLlantasTraccion: 4, vidaUtilTraccionKm: 80000,
      precioLlantaDireccionalCop: 900000, qtyLlantasDireccional: 2, vidaUtilDireccionalKm: 100000,
      indicadorLubricantesCopKm: 28.50, indicadorFiltrosCopKm: 8.20,
      indicadorLavadoEngraseCopKm: 5.10, mantenimientoCopKm: 85.00,
    },
    {
      configId: 'C3', ano: 2026,
      valorVehiculoCop: 350000000, mesesRecuperacion: 192,
      soatAnualCop: 2400000, seguroTodoRiesgoAnualCop: 8750000,
      rtmAnualCop: 600000, comunicacionesMesCop: 120000, parqueaderoNocheCop: 25000,
      precioLlantaTraccionCop: 1200000, qtyLlantasTraccion: 4, vidaUtilTraccionKm: 80000,
      precioLlantaDireccionalCop: 1100000, qtyLlantasDireccional: 2, vidaUtilDireccionalKm: 100000,
      indicadorLubricantesCopKm: 42.00, indicadorFiltrosCopKm: 12.50,
      indicadorLavadoEngraseCopKm: 7.80, mantenimientoCopKm: 128.00,
    },
    {
      configId: 'C2S2', ano: 2026,
      valorVehiculoCop: 500000000, mesesRecuperacion: 192,
      soatAnualCop: 3200000, seguroTodoRiesgoAnualCop: 12500000,
      rtmAnualCop: 900000, comunicacionesMesCop: 140000, parqueaderoNocheCop: 35000,
      precioLlantaTraccionCop: 1250000, qtyLlantasTraccion: 8, vidaUtilTraccionKm: 80000,
      precioLlantaDireccionalCop: 1150000, qtyLlantasDireccional: 2, vidaUtilDireccionalKm: 100000,
      indicadorLubricantesCopKm: 55.00, indicadorFiltrosCopKm: 15.00,
      indicadorLavadoEngraseCopKm: 9.50, mantenimientoCopKm: 162.00,
    },
    {
      configId: 'C2S3', ano: 2026,
      valorVehiculoCop: 580000000, mesesRecuperacion: 192,
      soatAnualCop: 3500000, seguroTodoRiesgoAnualCop: 14500000,
      rtmAnualCop: 1000000, comunicacionesMesCop: 140000, parqueaderoNocheCop: 38000,
      precioLlantaTraccionCop: 1250000, qtyLlantasTraccion: 12, vidaUtilTraccionKm: 80000,
      precioLlantaDireccionalCop: 1150000, qtyLlantasDireccional: 2, vidaUtilDireccionalKm: 100000,
      indicadorLubricantesCopKm: 58.00, indicadorFiltrosCopKm: 16.00,
      indicadorLavadoEngraseCopKm: 10.00, mantenimientoCopKm: 172.00,
    },
    {
      configId: 'C3S2', ano: 2026,
      valorVehiculoCop: 620000000, mesesRecuperacion: 192,
      soatAnualCop: 3500000, seguroTodoRiesgoAnualCop: 15500000,
      rtmAnualCop: 1100000, comunicacionesMesCop: 140000, parqueaderoNocheCop: 38000,
      precioLlantaTraccionCop: 1280000, qtyLlantasTraccion: 10, vidaUtilTraccionKm: 80000,
      precioLlantaDireccionalCop: 1150000, qtyLlantasDireccional: 2, vidaUtilDireccionalKm: 100000,
      indicadorLubricantesCopKm: 62.00, indicadorFiltrosCopKm: 16.50,
      indicadorLavadoEngraseCopKm: 10.50, mantenimientoCopKm: 182.00,
    },
    {
      configId: 'C3S3', ano: 2026,
      valorVehiculoCop: 750000000, mesesRecuperacion: 192,
      soatAnualCop: 3800000, seguroTodoRiesgoAnualCop: 18750000,
      rtmAnualCop: 1200000, comunicacionesMesCop: 150000, parqueaderoNocheCop: 40000,
      precioLlantaTraccionCop: 1350000, qtyLlantasTraccion: 12, vidaUtilTraccionKm: 80000,
      precioLlantaDireccionalCop: 1200000, qtyLlantasDireccional: 4, vidaUtilDireccionalKm: 100000,
      indicadorLubricantesCopKm: 68.00, indicadorFiltrosCopKm: 18.00,
      indicadorLavadoEngraseCopKm: 12.00, mantenimientoCopKm: 195.00,
    },
  ]

  for (const v of vehicleData) {
    await prisma.vehicleParams.upsert({
      where: { configId_ano: { configId: v.configId, ano: v.ano } },
      update: {},
      create: v,
    })
    console.log(`✅ vehicle_params: ${v.configId} ${v.ano}`)
  }

  // ─────────────────────────────────────────────
  // 3. ROUTE TERRAIN — 10 corredores principales
  // ─────────────────────────────────────────────
  const terrainData = [
    { origen: '11001', destino: '05001', plano: 0.30, ondulado: 0.40, montanoso: 0.30, peajesC2: 75000,  peajesC3: 110000, fuente: 'INVIAS 2024' }, // Bogotá-Medellín
    { origen: '11001', destino: '76001', plano: 0.40, ondulado: 0.30, montanoso: 0.30, peajesC2: 80000,  peajesC3: 115000, fuente: 'INVIAS 2024' }, // Bogotá-Cali
    { origen: '11001', destino: '08001', plano: 0.55, ondulado: 0.30, montanoso: 0.15, peajesC2: 140000, peajesC3: 200000, fuente: 'INVIAS 2024' }, // Bogotá-Barranquilla
    { origen: '11001', destino: '68001', plano: 0.35, ondulado: 0.35, montanoso: 0.30, peajesC2: 65000,  peajesC3: 92000,  fuente: 'INVIAS 2024' }, // Bogotá-Bucaramanga
    { origen: '11001', destino: '13001', plano: 0.55, ondulado: 0.30, montanoso: 0.15, peajesC2: 155000, peajesC3: 222000, fuente: 'INVIAS 2024' }, // Bogotá-Cartagena
    { origen: '11001', destino: '66001', plano: 0.35, ondulado: 0.35, montanoso: 0.30, peajesC2: 50000,  peajesC3: 70000,  fuente: 'INVIAS 2024' }, // Bogotá-Pereira
    { origen: '11001', destino: '17001', plano: 0.30, ondulado: 0.35, montanoso: 0.35, peajesC2: 55000,  peajesC3: 78000,  fuente: 'INVIAS 2024' }, // Bogotá-Manizales
    { origen: '05001', destino: '76001', plano: 0.35, ondulado: 0.35, montanoso: 0.30, peajesC2: 70000,  peajesC3: 98000,  fuente: 'INVIAS 2024' }, // Medellín-Cali
    { origen: '05001', destino: '08001', plano: 0.55, ondulado: 0.30, montanoso: 0.15, peajesC2: 130000, peajesC3: 185000, fuente: 'INVIAS 2024' }, // Medellín-Barranquilla
    { origen: '76001', destino: '76109', plano: 0.25, ondulado: 0.30, montanoso: 0.45, peajesC2: 18000,  peajesC3: 28000,  fuente: 'INVIAS 2024' }, // Cali-Buenaventura
  ]

  for (const t of terrainData) {
    await prisma.routeTerrain.upsert({
      where: { origenDane_destinoDane: { origenDane: t.origen, destinoDane: t.destino } },
      update: {},
      create: {
        origenDane:         t.origen,
        destinoDane:        t.destino,
        kmPlanoPercent:     t.plano,
        kmOnduladoPercent:  t.ondulado,
        kmMontanosoPercent: t.montanoso,
        totalPeajesC2Cop:   t.peajesC2,
        totalPeajesC3Cop:   t.peajesC3,
        fuente:             t.fuente,
        vigenciaDesde:      new Date('2024-01-01'),
      },
    })
    console.log(`✅ route_terrain: ${t.origen} → ${t.destino}`)
  }

  // ─────────────────────────────────────────────
  // 4. COMMERCIAL PARAMS — 20% margen (configurable)
  // ─────────────────────────────────────────────
  const existingCommercial = await prisma.commercialParams.findFirst({ where: { activo: true } })
  if (!existingCommercial) {
    await prisma.commercialParams.create({
      data: {
        vigenciaDesde:         new Date('2026-01-01'),
        margenOperadorPercent: 20.00, // 20% — configurable desde admin
        redondeoMilCop:        50000,
        validezCotizacionHoras: 48,
        activo:                true,
        notas:                 'Política comercial — 20% sobre piso SISETAC',
      },
    })
    console.log('✅ commercial_params: margen 20% creado')
  } else {
    console.log('ℹ️  commercial_params: ya existe, no se sobreescribe')
  }

  console.log('\n✨ Seed completado exitosamente.')
  console.log('   Tablas populadas: monthly_params, vehicle_params (×6), route_terrain (×10), commercial_params')
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
