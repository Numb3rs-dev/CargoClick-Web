/**
 * Genera dos variantes del logo:
 * - CargoClickLogoNombre-white.png  → todos los píxeles no-transparentes en blanco (para fondos oscuros)
 * - og-image.jpg                    → regenerado con logo blanco sobre fondo azul
 */
const sharp = require('../node_modules/sharp');
const path = require('path');

const logoPath = path.join(__dirname, '../public/assets/CargoClickLogoNombre.png');
const whitePath = path.join(__dirname, '../public/assets/CargoClickLogoNombre-white.png');
const ogPath    = path.join(__dirname, '../public/og-image.jpg');

// ── 1. Logo blanco ────────────────────────────────────────
async function makeWhiteLogo() {
  const { data, info } = await sharp(logoPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 10) {           // pixel visible
      data[i]     = 255;              // R → blanco
      data[i + 1] = 255;              // G
      data[i + 2] = 255;              // B
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(whitePath);

  console.log('✓ CargoClickLogoNombre-white.png generado');
}

// ── 2. og-image: fondo azul + panel blanco con logo original ─
async function makeOgImage() {
  const W = 1200, H = 630;

  // Panel blanco centrado donde irá el logo
  const panelW = 640, panelH = 180, panelR = 20;
  const panelX = (W - panelW) / 2, panelY = 180;

  const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0A2A5E"/>
        <stop offset="100%" stop-color="#0B3D91"/>
      </linearGradient>
    </defs>
    <!-- Fondo azul -->
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <!-- Decoraciones sutiles -->
    <circle cx="120" cy="120" r="180" fill="rgba(255,255,255,0.04)"/>
    <circle cx="${W - 100}" cy="${H - 100}" r="220" fill="rgba(255,255,255,0.04)"/>
    <!-- Panel blanco con sombra simulada -->
    <rect x="${panelX + 4}" y="${panelY + 6}" width="${panelW}" height="${panelH}" rx="${panelR}" fill="rgba(0,0,0,0.18)"/>
    <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="${panelR}" fill="#FFFFFF"/>
    <!-- Tagline debajo del panel -->
    <text x="${W / 2}" y="${panelY + panelH + 52}" text-anchor="middle"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="26" font-weight="400"
      fill="rgba(255,255,255,0.75)" letter-spacing="1.5">
      Transporte de carga terrestre en Colombia
    </text>
    <text x="${W / 2}" y="${panelY + panelH + 94}" text-anchor="middle"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="18" font-weight="400"
      fill="rgba(255,255,255,0.42)" letter-spacing="1">
      cargoclick.com.co
    </text>
  </svg>`);

  // Logo original (colores corporativos) dentro del panel
  const logoMaxW = panelW - 80;
  const logoBuf = await sharp(logoPath).resize(logoMaxW, null).toBuffer();
  const meta    = await sharp(logoBuf).metadata();
  const left    = Math.round((W - meta.width) / 2);
  const top     = Math.round(panelY + (panelH - meta.height) / 2);

  await sharp(svg)
    .composite([{ input: logoBuf, left, top }])
    .jpeg({ quality: 92 })
    .toFile(ogPath);

  console.log('✓ og-image.jpg regenerado (panel blanco + logo original)');
}

makeWhiteLogo().then(makeOgImage).catch(e => { console.error(e); process.exit(1); });
