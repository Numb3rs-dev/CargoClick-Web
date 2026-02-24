// Script de validación de distancias - ejecutar con: npx ts-node scripts/test-distancias.ts
import { calcularDistanciaKm, getInfoDistancia } from '../lib/utils/distancias';
// eslint-disable-next-line @typescript-eslint/no-require-imports
(globalThis as any).__alias = true; // evitar error de compilación en standalone

const rutas: [string, string, string][] = [
  ['11001', '05001', 'Bogotá → Medellín     (real ~414 km)'],
  ['11001', '76001', 'Bogotá → Cali         (real ~461 km)'],
  ['11001', '08001', 'Bogotá → Barranquilla (real ~1008 km)'],
  ['08001', '13001', 'Barranquilla→Cartagena(real ~120 km)'],
  ['05001', '76001', 'Medellín → Cali       (real ~419 km)'],
  ['11001', '54001', 'Bogotá → Cúcuta       (real ~565 km)'],
  ['76001', '52001', 'Cali → Pasto          (real ~422 km)'],
  ['11001', '50001', 'Bogotá → Villavicencio(real ~88 km)'],
  ['68001', '08001', 'Bucaramanga→Barranq.  (real ~543 km)'],
  ['76001', '08001', 'Cali → Barranquilla   (real ~1113 km)'],
  ['05001', '08001', 'Medellín → Barranquilla(real ~640 km)'],
  ['13001', '76001', 'Cartagena → Cali      (real ~997 km)'],
];

console.log('\n  RUTA                                        CALC     TRAMO');
console.log('  ' + '-'.repeat(62));
for (const [o, d, label] of rutas) {
  const info = getInfoDistancia(o, d);
  console.log(`  ${label.padEnd(44)} ${String(info.distanciaKm).padStart(5)} km  ${info.tramo}`);
}
console.log();
