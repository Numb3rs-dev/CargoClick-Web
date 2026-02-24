const fs   = require('fs');
const path = require('path');

// ── Cargar la tabla OSRM generada ─────────────────────────────────────────
const tablaRaw = fs.readFileSync(
  path.join(__dirname, '..', 'lib', 'utils', 'distancias-tabla.ts'),
  'utf8'
);
// Extraer el objeto (quitar export / tipo TypeScript, dejar solo el JS)
const match = tablaRaw.match(/const DISTANCIAS_REALES[^=]*=\s*(\{[\s\S]*?\});/);
if (!match) { console.error('No se pudo parsear distancias-tabla.ts'); process.exit(1); }
// eslint-disable-next-line no-eval
const DISTANCIAS_REALES = eval('(' + match[1] + ')');
console.log(`✓ Tabla cargada: ${Object.keys(DISTANCIAS_REALES).length} pares\n`);

function lookup(cod1, cod2) {
  const key = [cod1, cod2].sort().join(':');
  const val = DISTANCIAS_REALES[key];
  if (val === undefined) return null;
  // Soporta formato nuevo [km, validado] y antiguo number
  return Array.isArray(val) ? val[0] : val;
}

// ── Rutas de referencia ───────────────────────────────────────────────────
const rutas = [
  ['11001', '05001', 'Bogotá → Medellín',          414],
  ['11001', '76001', 'Bogotá → Cali',               461],
  ['11001', '08001', 'Bogotá → Barranquilla',      1008],
  ['08001', '13001', 'Barranquilla → Cartagena',    120],
  ['05001', '76001', 'Medellín → Cali',             419],
  ['11001', '54001', 'Bogotá → Cúcuta',             565],
  ['76001', '52001', 'Cali → Pasto',                422],
  ['11001', '50001', 'Bogotá → Villavicencio',       88],
  ['68001', '08001', 'Bucaramanga → Barranquilla',  543],
  ['76001', '08001', 'Cali → Barranquilla',        1113],
  ['05748', '13001', 'Turbo → Cartagena',           387],
  ['44001', '47001', 'Riohacha → Santa Marta',      225],
  ['17001', '66001', 'Manizales → Pereira',          57],
  ['63001', '66001', 'Armenia → Pereira',            45],
  ['05001', '68001', 'Medellín → Bucaramanga ⚠prev',313],
  ['11001', '15001', 'Bogotá → Tunja',              190],
  ['11001', '73001', 'Bogotá → Ibagué',             204],
  ['11001', '41001', 'Bogotá → Neiva',              360],
  ['19001', '52001', 'Popayán → Pasto',             301],
  ['54001', '68001', 'Cúcuta → Bucaramanga',        197],
];

console.log('RUTA                                 OSRM   REAL   ERROR');
console.log('─'.repeat(57));
let totalErr = 0;
let sinDatos = 0;
rutas.forEach(([o, d, nombre, real]) => {
  const km = lookup(o, d);
  if (km === null) {
    sinDatos++;
    console.log(nombre.padEnd(37) + ' N/A    ~' + String(real).padStart(4) + ' km  (sin ruta)');
    return;
  }
  const err = Math.round((km - real) / real * 100);
  totalErr += Math.abs(err);
  const marker = Math.abs(err) > 15 ? ' ⚠' : '';
  console.log(
    nombre.padEnd(37) +
    String(km).padStart(4) + ' km  ~' +
    String(real).padStart(4) + ' km  ' +
    (err >= 0 ? '+' : '') + err + '%' + marker
  );
});
const conDatos = rutas.length - sinDatos;
console.log('─'.repeat(57));
console.log(`Error promedio absoluto (OSRM): ${Math.round(totalErr / conDatos)}%`);
console.log(`Sin ruta vial (esperado p.ej. islas): ${sinDatos}`);

