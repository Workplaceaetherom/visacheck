import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const fullSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="g" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
  </defs>
  <path d="M32 3 L57 12 V31 C57 47 46.5 56.5 32 61 C17.5 56.5 7 47 7 31 V12 Z" fill="url(#g)"/>
  <path d="M32 8 L52 15 V31 C52 44 43.5 52 32 56 C20.5 52 12 44 12 31 V15 Z" fill="#0f766e" opacity="0.45"/>
  <path d="M23 32.5 L29.5 39 L42 25.5" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const maskableSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none">
  <defs>
    <linearGradient id="bg" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
    <linearGradient id="sh" x1="50" y1="20" x2="50" y2="85" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.32"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg)"/>
  <g transform="translate(50 50) scale(0.78) translate(-32 -32)">
    <path d="M32 3 L57 12 V31 C57 47 46.5 56.5 32 61 C17.5 56.5 7 47 7 31 V12 Z" fill="url(#sh)" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.6"/>
    <path d="M23 32.5 L29.5 39 L42 25.5" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;

async function main() {
  await sharp(Buffer.from(fullSvg(192))).png({ compressionLevel: 9 }).toFile(join(PUBLIC_DIR, 'icon-192.png'));
  console.log('OK icon-192.png');
  await sharp(Buffer.from(fullSvg(512))).png({ compressionLevel: 9 }).toFile(join(PUBLIC_DIR, 'icon-512.png'));
  console.log('OK icon-512.png');
  await sharp(Buffer.from(maskableSvg(512))).png({ compressionLevel: 9 }).toFile(join(PUBLIC_DIR, 'icon-maskable-512.png'));
  console.log('OK icon-maskable-512.png');
  await sharp(Buffer.from(fullSvg(180))).png({ compressionLevel: 9 }).toFile(join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('OK apple-touch-icon.png');
  await sharp(Buffer.from(fullSvg(32))).png({ compressionLevel: 9 }).toFile(join(PUBLIC_DIR, 'favicon-32.png'));
  console.log('OK favicon-32.png');
}

main().catch((err) => { console.error(err); process.exit(1); });
