/**
 * A subtitle as a transparent 1280×720 PNG, for scenes.json "overlaySubtitles" (video/assemble.ts): a sentence added to a scene
 * that is a live take and is not re-recorded (11/7: s07's second sentence). Same box as video/record.ts SUBTITLE for screen
 * scenes (31 px at 1536×864, scaled to 1280×720 like the recording).
 *   npx tsx video/subtitle-png.ts
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const DIR = __dirname;
const plan = JSON.parse(readFileSync(path.join(DIR, "scenes.json"), "utf8")) as { scenes: { id: string; kind: string; narration: string; overlaySubtitles?: { sentence: number }[] }[] };

(async () => {
  const browser = await chromium.launch();
  for (const s of plan.scenes.filter((x) => x.overlaySubtitles?.length)) {
    const cues = s.narration.split(/(?<=。)/).map((x) => x.trim()).filter(Boolean);
    const px = s.kind === "screen" ? 31 : 26;
    const vp = s.kind === "screen" ? { width: 1536, height: 864 } : { width: 1280, height: 720 };
    for (const o of s.overlaySubtitles!) {
      const page = await browser.newPage({ viewport: vp });
      await page.setContent(`<html><body style="margin:0;background:transparent"><div style="position:fixed;left:0;right:0;margin:0 auto;width:fit-content;bottom:${Math.round(px * 1.08)}px;max-width:${Math.round(px * 42)}px;padding:${Math.round(px * 0.3)}px ${Math.round(px * 0.85)}px;background:rgba(31,35,40,.82);color:#f3f2ee;font:500 ${px}px/1.6 'Hiragino Sans','Yu Gothic',sans-serif;border-radius:4px;text-align:center">${cues[o.sentence]}</div></body></html>`);
      const raw = path.join(DIR, "out", `${s.id}-sub${o.sentence}-raw.png`);
      await page.screenshot({ path: raw, omitBackground: true });
      await page.close();
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-vf", "scale=1280:720:flags=lanczos", path.join(DIR, "out", `${s.id}-sub${o.sentence}.png`)]);
      console.log(`${s.id} sentence ${o.sentence}: ${cues[o.sentence]}`);
    }
  }
  await browser.close();
})();
