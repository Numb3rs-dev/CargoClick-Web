// Script temporal para extraer texto de los PDFs del Ministerio de Transporte
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const baseDir = path.join(__dirname, '..', '..', 'data', 'ministerio');

const files = [
  path.join('guias', 'GUIA Uso del Web Service en el RNDC_LC V4.pdf'),
  path.join('guias', 'Guía Registro Remesa Revisión 01_12_25_GAADS V4.pdf'),
  path.join('manuales', 'MANUAL SISTEMA RNDC 2022.pdf'),
  path.join('guias', 'GUIA USUARIOS RNDC 2024 _v2.pdf'),
  path.join('guias', 'Guia de monitoreo de flota_v8.pdf'),
  path.join('guias', 'GUIA XML_FacturaElectronica V11.pdf'),
  path.join('manuales', 'CERTIFICADO DE CUMPLIMIENTO DE CONDICIONES TECNICAS –EMPRESAS DE TRANSPORTE V1.pdf'),
  path.join('guias', 'GUIA CONSULTA SICETAC- WEB SERVICE.pdf'),
  path.join('guias', 'Consulta de SiceTac desde webservice y portal web.pdf'),
  path.join('guias', 'GUIA PROCESO DE TRANSBORDO -  SISTEMA RNDC-V1.pdf'),
  path.join('guias', 'GUIA TRANSPORTE MUNICIPAL V5 FINAL_06032023.pdf'),
  path.join('guias', 'Guia asignación gremio RNDC_29 nov.pdf'),
  path.join('guias', 'Codificacion Sistema Armonizado.pdf'),
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
