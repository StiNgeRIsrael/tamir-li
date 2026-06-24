/**
 * Generate favicon + PWA PNG/ICO assets from public/favicon.svg
 * Run: node scripts/generate-favicons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svg = readFileSync(join(publicDir, "favicon.svg"));

const sizes = [
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-96x96.png", size: 96 },
  { name: "apple-touch-icon-180x180.png", size: 180 },
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
];

for (const { name, size } of sizes) {
  const buf = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(join(publicDir, name), buf);
  console.log(`Wrote ${name}`);
}

const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(
  icoSizes.map((s) => sharp(svg).resize(s, s).png().toBuffer()),
);
const ico = await pngToIco(icoPngs);
writeFileSync(join(publicDir, "favicon.ico"), ico);
console.log("Wrote favicon.ico");
