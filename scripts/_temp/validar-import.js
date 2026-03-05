const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Sample vehicles
  const v = await p.vehiculo.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
  console.log('=== VEHICULOS (3 muestra) ===');
  v.forEach(x => console.log(JSON.stringify({placa:x.placa, marca:x.marcaVehiculo, config:x.configuracionUnidad, soat:x.soatVigencia, capacidad:x.capacidadTon, rtm:x.rtmVigencia}, null, 0)));
  
  // Sample conductors
  const c = await p.conductor.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
  console.log('\n=== CONDUCTORES (3 muestra) ===');
  c.forEach(x => console.log(JSON.stringify({cedula:x.cedula, nombres:x.nombres, apellidos:x.apellidos, cat:x.categoriaLicencia})));
  
  // Sample manifiestos
  const m = await p.manifiestoOperativo.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
  console.log('\n=== MANIFIESTOS (3 muestra) ===');
  m.forEach(x => console.log(JSON.stringify({cod:x.codigoInterno, num:x.numeroManifiesto, placa:x.vehiculoPlaca, conductor:x.conductorCedula, orDane:x.origenDane, deDane:x.destinoDane, km:x.kilometros, flete:x.fletePactado?.toString(), estado:x.estadoManifiesto})));
  
  // Sample remesas  
  const r = await p.remesa.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
  console.log('\n=== REMESAS (3 muestra) ===');
  r.forEach(x => console.log(JSON.stringify({num:x.numeroRemesa, manId:x.manifiestoOperativoId ? 'linked' : null, peso:x.pesoKg, orMun:x.origenMunicipio, orDane:x.origenDane, deDane:x.destinoDane, remitente:x.nitRemitente, estadoRndc:x.estadoRndc})));

  // Check DANE quality
  const daneOk = await p.remesa.count({ where: { NOT: { origenDane: '00000000' } } });
  const daneZero = await p.remesa.count({ where: { origenDane: '00000000' } });
  console.log('\n=== DANE QUALITY ===');
  console.log('Con DANE:', daneOk, '| Sin DANE:', daneZero);

  // Check manifiestos linked
  const total = await p.remesa.count();
  const manLinked = await p.remesa.count({ where: { NOT: { manifiestoOperativoId: null } } });
  console.log('Remesas con manifiesto:', manLinked, '| Sin manifiesto:', total - manLinked);

  // Check vehiculo: minimal vs full
  const vFull = await p.vehiculo.count({ where: { NOT: { marcaVehiculo: null } } });
  const vMin = await p.vehiculo.count({ where: { marcaVehiculo: null } });
  console.log('\nVehiculos completos:', vFull, '| Mínimos (solo placa):', vMin);

  await p.$disconnect();
})();
