const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.manifiestoRndc.count();
  console.log('Total manifiestos:', total.toLocaleString());

  if (total === 0) {
    console.log('\n❌ Tabla VACÍA — no hay datos RNDC cargados');
    return;
  }

  // Muestra de orígenes únicos
  const origenes = await prisma.manifiestoRndc.findMany({
    distinct: ['origen'],
    select: { origen: true },
    take: 20,
    orderBy: { origen: 'asc' },
  });
  console.log('\nOrígenes (muestra):', origenes.map(o => o.origen));

  // Rango de fechas
  const [primero, ultimo] = await Promise.all([
    prisma.manifiestoRndc.findFirst({ orderBy: { fechaExpedicion: 'asc' }, select: { fechaExpedicion: true } }),
    prisma.manifiestoRndc.findFirst({ orderBy: { fechaExpedicion: 'desc' }, select: { fechaExpedicion: true } }),
  ]);
  console.log('\nFechas:', primero?.fechaExpedicion?.toISOString().split('T')[0], '→', ultimo?.fechaExpedicion?.toISOString().split('T')[0]);

  // Rango de pesos
  const stats = await prisma.manifiestoRndc.aggregate({
    _min: { pesoKg: true },
    _max: { pesoKg: true },
    _avg: { pesoKg: true },
  });
  console.log('\nPesos (kg) — min:', stats._min.pesoKg, '| max:', stats._max.pesoKg, '| avg:', Math.round(stats._avg.pesoKg));
}

main().catch(console.error).finally(() => prisma.$disconnect());
