/**
 * The README's video thumbnail (Kento 11/7): one frame of the demo video (the 帳場's 「変化」, s05) beside the logo and the one line.
 * Needs the finished video (video/out/kokoroe-demo.mp4, made by video/) and Shippori Mincho in FONT_DIR (see build-logo.mjs).
 *   FONT_DIR=/tmp/shippori node scripts/logo/build-thumb.mjs   →  docs/readme/video-thumb.jpg
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FONT_DIR = process.env.FONT_DIR;
if (!FONT_DIR) throw new Error("Set FONT_DIR (see scripts/logo/build-logo.mjs).");
const tmp = mkdtempSync(path.join(tmpdir(), "kokoroe-thumb-"));
const frame = path.join(tmp, "frame.png");
// 1:33.0 of the final cut (11/7 last version; was 1:29.6 before the holds): the next draft for 丸新酒造 with its 「変化」 panel.
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "93.0", "-i", path.join(ROOT, "video/out/kokoroe-demo.mp4"), "-frames:v", "1", frame]);
const logo = readFileSync(path.join(ROOT, "docs/readme/logo-light.svg"), "utf8").replace(/width="[\d.]+" height="[\d.]+"/, 'width="440"');
const font = (w) => `url(data:font/ttf;base64,${readFileSync(path.join(FONT_DIR, `ShipporiMincho-${w}.ttf`)).toString("base64")})`;
const html = `<html><head><style>
@font-face { font-family: S; src: ${font("Regular")}; font-weight: 400; }
@font-face { font-family: S; src: ${font("SemiBold")}; font-weight: 600; }
body { margin: 0; width: 1280px; height: 720px; background: #f3f2ee; font-family: S; color: #1f2328; overflow: hidden; position: relative; }
.rule { position: absolute; left: 56px; right: 56px; height: 0; border-top: 2px solid rgb(31 35 40 / 0.8); }
.left { position: absolute; left: 72px; top: 150px; width: 480px; }
.line { font-size: 36px; white-space: nowrap; line-height: 1.55; margin-top: 44px; letter-spacing: 0.02em; }
.play { margin-top: 40px; display: inline-flex; align-items: center; gap: 14px; font-size: 24px; color: #f3f2ee; background: #2b4a6f; padding: 12px 22px 12px 18px; border-radius: 3px; }
.play i { width: 0; height: 0; border-left: 18px solid #f3f2ee; border-top: 11px solid transparent; border-bottom: 11px solid transparent; }
.shot { position: absolute; right: 56px; top: 110px; width: 620px; height: 490px; overflow: hidden; border: 1px solid #cfccc4; background: #f3f2ee; }
.shot img { position: absolute; width: 1280px; left: -186px; top: -132px; transform: scale(1.0); }
.foot { position: absolute; left: 72px; bottom: 34px; font-size: 18px; color: #565b62; letter-spacing: 0.04em; }
</style></head><body>
<div class="rule" style="top:48px"></div><div class="rule" style="bottom:76px"></div>
<div class="left">${logo}<div class="line">聞いても出てこない作法を、<br>ダメ出しで受け継ぐ。</div><div class="play"><i></i>デモ動画 2:58</div></div>
<div class="shot"><img src="data:image/png;base64,${readFileSync(frame).toString("base64")}"></div>
<div class="foot">Built with Claude: Japan 2026　登場する会社・人物・数字は架空です</div>
</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
const png = path.join(tmp, "thumb.png");
await page.screenshot({ path: png });
await browser.close();
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-q:v", "3", path.join(ROOT, "docs/readme/video-thumb.jpg")]);
console.log("docs/readme/video-thumb.jpg");
