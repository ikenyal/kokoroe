/**
 * A subtitle as a transparent 1280×720 PNG, for scenes.json "overlaySubtitles" (video/assemble.ts): a sentence added to a scene
 * that is a live take and is not re-recorded (11/7: s07's second sentence). Same box as video/record.ts SUBTITLE for screen
 * scenes (31 px at 1536×864, scaled to 1280×720 like the recording).
 *   npx tsx video/subtitle-png.ts
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fillNumbers } from "./narration";
import { chromium } from "playwright";

const DIR = __dirname;
const plan = JSON.parse(readFileSync(path.join(DIR, "scenes.json"), "utf8")) as { scenes: { id: string; kind: string; narration: string; overlaySubtitles?: { sentence: number }[]; subtitlePatches?: { sentence: number }[]; overlayTag?: { text: string } }[] };
// numbers in the narration ({before}, {taps} …) are filled from results.json, as in the recording
for (const sc of plan.scenes) sc.narration = fillNumbers(sc.narration, JSON.parse(readFileSync(path.join(__dirname, "..", "data/demo/results.json"), "utf8")));

(async () => {
  const browser = await chromium.launch();
  for (const s of plan.scenes.filter((x) => x.overlaySubtitles?.length || x.subtitlePatches?.length)) {
    const cues = s.narration.split(/(?<=。)/).map((x) => x.trim()).filter(Boolean);
    const px = s.kind === "screen" ? 31 : 26;
    const vp = s.kind === "screen" ? { width: 1536, height: 864 } : { width: 1280, height: 720 };
    const patchSet = new Set((s.subtitlePatches ?? []).map((o) => o.sentence));
    for (const o of [...(s.overlaySubtitles ?? []), ...(s.subtitlePatches ?? [])]) {
      // A patch overlaps the burned-in line, so its box is opaque in the colour that line has over the paper
      // (rgba(31,35,40,.82) on #f3f2ee): where both are drawn, nothing changes; the seam does not flicker.
      const boxBg = patchSet.has(o.sentence) ? "rgb(69,72,76)" : "rgba(31,35,40,.82)";
      const page = await browser.newPage({ viewport: vp });
      await page.setContent(`<html><body style="margin:0;background:transparent"><div style="position:fixed;left:0;right:0;margin:0 auto;width:fit-content;bottom:${Math.round(px * 1.08)}px;max-width:${Math.round(px * 42)}px;padding:${Math.round(px * 0.3)}px ${Math.round(px * 0.85)}px;background:${boxBg};color:#f3f2ee;font:500 ${px}px/1.6 'Hiragino Sans','Yu Gothic',sans-serif;border-radius:4px;text-align:center">${cues[o.sentence]}</div></body></html>`);
      const raw = path.join(DIR, "out", `${s.id}-sub${o.sentence}-raw.png`);
      await page.screenshot({ path: raw, omitBackground: true });
      await page.close();
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-vf", "scale=1280:720:flags=lanczos", path.join(DIR, "out", `${s.id}-sub${o.sentence}.png`)]);
      console.log(`${s.id} sentence ${o.sentence}: ${cues[o.sentence]}`);
    }
  }
  // A corner tag redrawn over a live take (scenes.json "overlayTag"; video/assemble.ts first covers the old tag), in the
  // style of video/record.ts OWN_SCREEN (screen scenes: 1536×864, scaled to 1280×720 like the recording).
  for (const s of plan.scenes.filter((x) => x.overlayTag)) {
    const { text } = s.overlayTag!;
    const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
    await page.setContent(`<html><body style="margin:0;background:transparent">
      <div style="position:fixed;right:18px;top:150px;width:max-content;white-space:pre-line;padding:8px 12px;border:2px solid #2b4a6f;background:rgba(243,242,238,.94);color:#2b4a6f;font:600 17px/1.55 'Hiragino Sans','Yu Gothic',sans-serif">${text}</div></body></html>`);
    const raw = path.join(DIR, "out", `${s.id}-tag-raw.png`);
    await page.screenshot({ path: raw, omitBackground: true });
    await page.close();
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-vf", "scale=1280:720:flags=lanczos", path.join(DIR, "out", `${s.id}-tag.png`)]);
    console.log(`${s.id} tag: ${text.replace(/\n/g, " ")}`);
  }
  await browser.close();
})();
