'use strict';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Test 1: counts
  const [c, cl, s] = await Promise.all([p.conductor.count(), p.cliente.count(), p.sucursalCliente.count()]);
  console.log('Conductores:', c, '| Clientes:', cl, '| Sucursales:', s);

  // Test 2: try inserting one cliente to see the real error
  try {
    const r = await p.cliente.upsert({
      where: { tipoId_numeroId: { tipoId: 'N', numeroId: 'TEST_CHECK_001' } },
      create: { tipoId: 'N', numeroId: 'TEST_CHECK_001', razonSocial: 'TEST SOLO CHECK', regimenSimple: false, activo: true },
      update: { razonSocial: 'TEST SOLO CHECK' },
    });
    console.log('INSERT testCliente OK → id:', r.id);
    // Clean up
    await p.cliente.delete({ where: { id: r.id } });
    console.log('DELETE testCliente OK');
  } catch (e) {
    console.error('INSERT testCliente ERROR:', e.message);
  }
}

main().catch(e => console.error('FATAL:', e.message)).finally(() => p.$disconnect());
