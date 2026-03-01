// Script temporal para extraer texto de los PDFs del Ministerio de Transporte
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const baseDir = path.join(__dirname, '..', 'definicion-FuncionalyTecnica', 'Ministerio de transporte');

const files = [
  'GUIA Uso del Web Service en el RNDC_LC V4.pdf',
  'Guía Registro Remesa Revisión 01_12_25_GAADS V4.pdf',
  'MANUAL SISTEMA RNDC 2022.pdf',
  'GUIA USUARIOS RNDC 2024 _v2.pdf',
  'Guia de monitoreo de flota_v8.pdf',
  'GUIA XML_FacturaElectronica V11.pdf',
  'CERTIFICADO DE CUMPLIMIENTO DE CONDICIONES TECNICAS –EMPRESAS DE TRANSPORTE V1.pdf',
  'GUIA CONSULTA SICETAC- WEB SERVICE.pdf',
  'Consulta de SiceTac desde webservice y portal web.pdf',
  'GUIA PROCESO DE TRANSBORDO -  SISTEMA RNDC-V1.pdf',
  'GUIA TRANSPORTE MUNICIPAL V5 FINAL_06032023.pdf',
  'Guia asignación gremio RNDC_29 nov.pdf',
  'Codificacion Sistema Armonizado.pdf',
];

async function extractAll() {
  for (const file of files) {
    const fullPath = path.join(baseDir, file);
    if (!fs.existsSync(fullPath)) {
      console.log('MISSING:', file);
      continue;
    }
    try {
      const buf = fs.readFileSync(fullPath);
      const parser = new PDFParse({ data: buf, verbosity: 0 });
      const result = await parser.getText({});
      const outFile = fullPath.replace('.pdf', '.txt');
      fs.writeFileSync(outFile, result.text, 'utf-8');
      console.log(`OK: ${file} (${result.total} pgs, ${result.text.length} chars)`);
    } catch (e) {
      console.log(`ERR: ${file} - ${e.message}`);
    }
  }
  console.log('Done extracting all PDFs.');
}

extractAll();
