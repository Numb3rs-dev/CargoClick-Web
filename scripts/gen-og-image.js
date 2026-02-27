const sharp = require('../node_modules/sharp');
const path = require('path');

const W = 1200, H = 630;

const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A2A5E"/>
      <stop offset="100%" stop-color="#0B3D91"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="60" y="60" width="4" height="510" rx="2" fill="rgba(255,255,255,0.10)"/>
  <rect x="${W - 64}" y="60" width="4" height="510" rx="2" fill="rgba(255,255,255,0.10)"/>
  <text x="${W / 2}" y="490" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="28" font-weight="400"
    fill="rgba(255,255,255,0.65)" letter-spacing="2">
    Transporte de carga terrestre en Colombia
  </text>
  <text x="${W / 2}" y="540" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="20" font-weight="400"
    fill="rgba(255,255,255,0.38)" letter-spacing="1">
    cargoclick.com.co
  </text>
</svg>`);

const logoPath = path.join(__dirname, '../public/assets/CargoClickLogoNombre.png');
const outPath  = path.join(__dirname, '../public/og-image.jpg');

sharp(logoPath)
  .resize(560, null)
  .toBuffer()
  .then(logoBuf => sharp(logoBuf).metadata().then(meta => {
    const left = Math.round((W - meta.width) / 2);
    const top  = Math.round((H - meta.height) / 2) - 30;
    return sharp(svg)
      .composite([{ input: logoBuf, left, top }])
      .jpeg({ quality: 92 })
      .toFile(outPath);
  }))
  .then(() => console.log('✓ public/og-image.jpg generado OK'))
  .catch(e => { console.error(e); process.exit(1); });
