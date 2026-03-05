const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  console.log('Limpiando tablas...');
  // Orden inverso de dependencias
  await p.remesa.deleteMany();
  console.log('  Remesas: borradas');
  await p.manifiestoOperativo.deleteMany();
  console.log('  Manifiestos: borrados');
  await p.conductor.deleteMany();
  console.log('  Conductores: borrados');
  await p.vehiculo.deleteMany();
  console.log('  Vehiculos: borrados');
  console.log('Tablas limpias.');
  await p.$disconnect();
})();
