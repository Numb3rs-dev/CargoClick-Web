// Script temporal para extraer contenido del Excel del Manifiesto
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const baseDir = path.join(__dirname, '..', 'definicion-FuncionalyTecnica', 'Ministerio de transporte');

const excelFiles = [
  'FORMATO MANIFIESTO DE CARGA Y ANEXO.xlsx',
  'PROPUESTA REMESA MERCANCIAS PELIGROSA.xlsx',
];

for (const file of excelFiles) {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) {
    console.log('MISSING:', file);
    continue;
  }
  try {
    const wb = XLSX.readFile(fullPath);
    let output = `=== ${file} ===\n`;
    output += `Sheets: ${wb.SheetNames.join(', ')}\n\n`;
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      output += `--- SHEET: ${sheetName} ---\n`;
      output += XLSX.utils.sheet_to_csv(ws) + '\n\n';
    }
    const outFile = fullPath.replace('.xlsx', '.txt');
    fs.writeFileSync(outFile, output, 'utf-8');
    console.log(`OK: ${file} (sheets: ${wb.SheetNames.length})`);
  } catch (e) {
    console.log(`ERR: ${file} - ${e.message}`);
  }
}
console.log('Done extracting Excel files.');
