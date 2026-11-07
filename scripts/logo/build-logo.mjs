/**
 * ココロエ's logo, tab-icon source and OGP image (Kento 11/7). Every letter is an outline taken from Shippori Mincho
 * (SIL Open Font License 1.1, the typeface the app already uses), so the files depend on no installed font. No gradients,
 * glow or external images; 朱 is not used (it is kept for the master's marks).
 *
 * The font files are not in the repository. Fetch them once (from the Google Fonts repository) and point FONT_DIR at them:
 *   mkdir -p /tmp/shippori && for w in Regular SemiBold Bold; do
 *     curl -sfL -o /tmp/shippori/ShipporiMincho-$w.ttf https://github.com/google/fonts/raw/main/ofl/shipporimincho/ShipporiMincho-$w.ttf; done
 *   FONT_DIR=/tmp/shippori node scripts/logo/build-logo.mjs && npx tsx scripts/make-icons.ts
 *
 * Writes SVGs (docs/readme/logo-{light,dark}.svg, scripts/icon/kokoroe-icon.svg, scripts/logo/og.svg) and renders the PNGs
 * with Playwright (docs/readme/logo-{light,dark}.png, app/opengraph-image.png, app/twitter-image.png).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FONT_DIR = process.env.FONT_DIR;
if (!FONT_DIR) throw new Error("Set FONT_DIR to a folder with ShipporiMincho-{Regular,SemiBold,Bold}.ttf (see the header).");
const load = (w) => opentype.parse(readFileSync(path.join(FONT_DIR, `ShipporiMincho-${w}.ttf`)).buffer);
const F = { regular: load("Regular"), semibold: load("SemiBold"), bold: load("Bold") };

// The app's own tokens (app/globals.css).
const C = {
  light: { kami: "#f3f2ee", sumi: "#1f2328", nibi: "#565b62", ai: "#2b4a6f", keisen: "#cfccc4", onFill: "#f3f2ee" },
  dark: { kami: "#16191d", sumi: "#e6e4df", nibi: "#b3b6bb", ai: "#35567d", keisen: "#3b414a", onFill: "#ecebe7" },
};

const r = (n) => Math.round(n * 100) / 100;

/** Path commands → SVG path data (own serializer: opentype.js 2.0's toPathData "optimize" step produced NaN on some glyphs). */
function pathData(p) {
  const f = (n) => { if (!Number.isFinite(n)) throw new Error("bad coordinate"); return r(n); };
  return p.commands.map((c) => c.type === "M" || c.type === "L" ? `${c.type}${f(c.x)} ${f(c.y)}`
    : c.type === "Q" ? `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}`
    : c.type === "C" ? `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}` : "Z").join("");
}

/** Text as one path, laid out with extra tracking (em). Returns the path data and its ink box. */
function text(font, str, size, { x = 0, y = 0, tracking = 0 } = {}) {
  let cx = x;
  const parts = [];
  for (const ch of str) {
    const g = font.charToGlyph(ch);
    parts.push(g.getPath(cx, y, size));
    cx += (g.advanceWidth / font.unitsPerEm) * size + tracking * size;
  }
  const d = parts.map(pathData).join("");
  const boxes = parts.map((p) => p.getBoundingBox()).filter((b) => b.x2 > b.x1);
  const box = { x1: Math.min(...boxes.map((b) => b.x1)), y1: Math.min(...boxes.map((b) => b.y1)), x2: Math.max(...boxes.map((b) => b.x2)), y2: Math.max(...boxes.map((b) => b.y2)) };
  return { d, box };
}

/** Text placed so its ink box starts at (left, top). */
function placed(font, str, size, left, top, tracking = 0) {
  const probe = text(font, str, size, { tracking });
  return text(font, str, size, { x: left - probe.box.x1, y: top - probe.box.y1, tracking });
}

/** The seal: indigo square, slight corner, a fine inner frame like a carved stamp, 心 in paper white. */
function seal(x, y, s, t) {
  const g = text(F.bold, "心", s * 0.68);
  const gw = g.box.x2 - g.box.x1, gh = g.box.y2 - g.box.y1;
  const k = placed(F.bold, "心", s * 0.68, x + (s - gw) / 2, y + (s - gh) / 2 + s * 0.015);
  const inset = s * 0.07;
  return [
    `<rect x="${r(x)}" y="${r(y)}" width="${r(s)}" height="${r(s)}" rx="${r(s * 0.05)}" fill="${t.ai}"/>`,
    `<rect x="${r(x + inset)}" y="${r(y + inset)}" width="${r(s - 2 * inset)}" height="${r(s - 2 * inset)}" fill="none" stroke="${t.onFill}" stroke-opacity="0.55" stroke-width="${r(s * 0.012)}"/>`,
    `<path d="${k.d}" fill="${t.onFill}"/>`,
  ].join("\n  ");
}

/** Seal + ココロエ + Kokoroe, side by side. Returns svg body and size. */
function lockup(t, { x0 = 0, y0 = 0, s = 120 } = {}) {
  const gap = s * 0.28;
  const name = placed(F.semibold, "ココロエ", s * 0.62, x0 + s + gap, y0 + s * 0.06, -0.04);
  const nameH = name.box.y2 - name.box.y1;
  const latin = placed(F.regular, "Kokoroe", s * 0.2, x0 + s + gap + s * 0.02, y0 + s * 0.06 + nameH + s * 0.17, 0.1);
  const w = Math.max(name.box.x2, latin.box.x2) - x0;
  const body = [seal(x0, y0, s, t), `<path d="${name.d}" fill="${t.sumi}"/>`, `<path d="${latin.d}" fill="${t.nibi}"/>`].join("\n  ");
  return { body, w, h: s };
}

const out = (p, s) => (writeFileSync(path.join(ROOT, p), s), p);
const written = [];

for (const mode of ["light", "dark"]) {
  const t = C[mode];
  const pad = 4;
  const { body, w, h } = lockup(t, { x0: pad, y0: pad });
  const W = Math.ceil(w + 2 * pad), H = Math.ceil(h + 2 * pad);
  written.push(out(`docs/readme/logo-${mode}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="ココロエ（Kokoroe）">
  <!-- ココロエ logo (${mode}). Letters are outlines of Shippori Mincho (SIL OFL 1.1); generated by scripts/logo/build-logo.mjs. -->
  ${body}
</svg>
`));
}

// Tab icon source: the seal alone, 64 units, full square (make-icons.ts renders it to ICO/PNG).
{
  const t = C.light;
  const s = 64;
  const g = placed(F.bold, "心", s * 0.68, 0, 0);
  const gw = g.box.x2 - g.box.x1, gh = g.box.y2 - g.box.y1;
  const k = placed(F.bold, "心", s * 0.68, (s - gw) / 2, (s - gh) / 2 + s * 0.015);
  written.push(out("scripts/icon/kokoroe-icon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- ココロエ's tab icon: 「心」 in paper white on the app's indigo, the same seal as the logo (scripts/logo/build-logo.mjs).
       The glyph is an outline of Shippori Mincho Bold (SIL OFL 1.1), so no installed font is needed. At tab size the inner frame
       is left out (it would blur). -->
  <rect width="64" height="64" rx="3" fill="${t.ai}"/>
  <path d="${k.d}" fill="${t.onFill}"/>
</svg>
`));
}

// OGP image, 1200 × 630: paper, the logo, the one line, ledger rules.
{
  const t = C.light;
  const W = 1200, H = 630;
  const s = 150;
  const lk = lockup(t, { x0: 0, y0: 0, s });
  const lx = (W - lk.w) / 2, ly = 150;
  const shifted = lockup(t, { x0: lx, y0: ly, s });
  const lineTop = ly + s + 78;
  const probe = text(F.regular, "聞いても出てこない作法を、ダメ出しで受け継ぐ。", 40, { tracking: 0.04 });
  const lw = probe.box.x2 - probe.box.x1;
  const line = placed(F.regular, "聞いても出てこない作法を、ダメ出しで受け継ぐ。", 40, (W - lw) / 2, lineTop, 0.04);
  const sub = "An AI apprentice that inherits the unwritten etiquette of business";
  const sp = text(F.regular, sub, 22, { tracking: 0.02 });
  const sw = sp.box.x2 - sp.box.x1;
  const subP = placed(F.regular, sub, 22, (W - sw) / 2, line.box.y2 + 34, 0.02);
  const foot = "Built with Claude: Japan 2026　架空のデータによるデモ";
  const fp = text(F.regular, foot, 18, { tracking: 0.04 });
  const fw = fp.box.x2 - fp.box.x1;
  const footP = placed(F.regular, foot, 18, (W - fw) / 2, H - 70, 0.04);
  const rules = [60, H - 100].map((y) => `<line x1="80" x2="${W - 80}" y1="${y}" y2="${y}" stroke="${t.sumi}" stroke-opacity="0.8" stroke-width="2"/>`)
    .concat([66, H - 106].map((y) => `<line x1="80" x2="${W - 80}" y1="${y}" y2="${y}" stroke="${t.keisen}" stroke-width="1"/>`)).join("\n  ");
  written.push(out("scripts/logo/og.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- OGP image (scripts/logo/build-logo.mjs). Letters are outlines of Shippori Mincho (SIL OFL 1.1). -->
  <rect width="${W}" height="${H}" fill="${t.kami}"/>
  ${rules}
  ${shifted.body}
  <path d="${line.d}" fill="${t.sumi}"/>
  <path d="${subP.d}" fill="${t.nibi}"/>
  <path d="${footP.d}" fill="${t.nibi}"/>
</svg>
`));
}

// PNGs.
const browser = await chromium.launch();
async function png(svgFile, outFile, width, height, scale = 1) {
  const svg = readFileSync(path.join(ROOT, svgFile), "utf8");
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${width}" height="${height}"`)}</body></html>`);
  writeFileSync(path.join(ROOT, outFile), await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height } }));
  await page.close();
  written.push(outFile);
}
for (const mode of ["light", "dark"]) {
  const m = readFileSync(path.join(ROOT, `docs/readme/logo-${mode}.svg`), "utf8").match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const w = 400, h = Math.round((400 * +m[2]) / +m[1]);
  await png(`docs/readme/logo-${mode}.svg`, `docs/readme/logo-${mode}.png`, w, h, 2);
}
await png("scripts/logo/og.svg", "app/opengraph-image.png", 1200, 630);
await png("scripts/logo/og.svg", "app/twitter-image.png", 1200, 630);
await browser.close();
console.log(written.join("\n"));
