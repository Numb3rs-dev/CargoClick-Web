'use strict';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const r = await p.cliente.create({
      data: {
        tipoId: 'N',
        numeroId: '9001629952',
        razonSocial: 'CASA DEL OZONO TEST',
        activo: true,
        regimenSimple: false,
      }
    });
    console.log('OK:', r.id);
    await p.cliente.delete({ where: { id: r.id } });
    console.log('Deleted OK');
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
}
main();
