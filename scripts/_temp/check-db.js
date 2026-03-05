const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.distancia.count();
  console.log('Total registros:', count.toLocaleString());

  const r = await prisma.distancia.findUnique({
    where: { origen_destino: { origen: '05001', destino: '11001' } },
  });
  console.log('Par 05001→11001:', r);

  const r2 = await prisma.distancia.findFirst({ take: 3 });
  console.log('Primer registro:', r2);
}

main().finally(() => prisma.$disconnect());
