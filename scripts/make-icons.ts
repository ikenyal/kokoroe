/**
 * Tab and home-screen icons from scripts/icon/kokoroe-icon.svg (Kento 11/6: replace the Next.js default favicon; built from SVG,
 * no external images; the glyph is an outline of Shippori Mincho, OFL — scripts/logo/build-logo.mjs). Renders the SVG with Playwright and writes:
 *   app/favicon.ico   (32 and 48 px PNGs inside an ICO)
 *   app/icon.png      (64 px, <link rel="icon">)
 *   app/apple-icon.png (180 px, apple-touch-icon)
 *   npx tsx scripts/make-icons.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(__dirname, "..");
const svg = readFileSync(path.join(ROOT, "scripts/icon/kokoroe-icon.svg"), "utf8");

/** An ICO file whose images are PNGs (supported by every current browser). */
function ico(pngs: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach((p, i) => {
    const o = i * 16;
    dir.writeUInt8(p.size >= 256 ? 0 : p.size, o); dir.writeUInt8(p.size >= 256 ? 0 : p.size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3); dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(p.data.length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += p.data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}

(async () => {
  const browser = await chromium.launch();
  // iOS rounds the home-screen icon itself and fills transparent corners with black, so the 180 px one is full-bleed.
  const render = async (size: number) => {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="64" height="64"', `width="${size}" height="${size}"`).replace(size === 180 ? 'rx="3"' : "\u0000", 'rx="0"')}</body></html>`);
    const data = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
    return data;
  };
  const [p32, p48, p64, p180] = await Promise.all([32, 48, 64, 180].map(render));
  writeFileSync(path.join(ROOT, "app/favicon.ico"), ico([{ size: 32, data: p32 }, { size: 48, data: p48 }]));
  writeFileSync(path.join(ROOT, "app/icon.png"), p64);
  writeFileSync(path.join(ROOT, "app/apple-icon.png"), p180);
  await browser.close();
  console.log("app/favicon.ico, app/icon.png, app/apple-icon.png");
})();
