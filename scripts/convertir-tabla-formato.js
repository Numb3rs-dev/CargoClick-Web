/**
 * Convierte distancias-tabla.ts del formato antiguo { 'k': km } 
 * al nuevo formato { 'k': [km, 0] }  donde  0=N (no validado), 1=Y (validado OSRM /route)
 *
 * Uso: node scripts/convertir-tabla-formato.js
 */
const fs   = require('fs');
const path = require('path');

const tablaPath = path.join(__dirname, '..', 'lib', 'utils', 'distancias-tabla.ts');
const raw = fs.readFileSync(tablaPath, 'utf8');

// Verificar si ya tiene el nuevo formato
if (raw.includes(': [')) {
  console.log('✓ La tabla ya está en el nuevo formato [km, validado]');
  process.exit(0);
}

// Extraer pares 'clave': número,
const lines = raw.split('\n');
const newLines = lines.map(line => {
  // Matchear entradas como:  '05001:11001': 404,
  const m = line.match(/^(\s+'[^']+': )(\d+)(,\s*)$/);
  if (m) {
    return `${m[1]}[${m[2]}, 0]${m[3]}`;
  }
  return line;
});

// Actualizar el tipo del export
const result = newLines.join('\n')
  .replace(
    'export const DISTANCIAS_REALES: Record<string, number> = {',
    '/** [distanciaKm, validado]  validado: 0=No validado con OSRM /route  1=Validado ✓ */\nexport const DISTANCIAS_REALES: Record<string, [number, 0 | 1]> = {'
  );

fs.writeFileSync(tablaPath, result, 'utf8');

const count = (result.match(/\[[\d]+, 0\]/g) || []).length;
console.log(`✓ Tabla convertida: ${count} entradas con validado=0 (N)`);
console.log(`  Archivo: ${tablaPath}`);
