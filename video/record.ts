/**
 * Record each scene of video/scenes.json as a 1280×720 clip (Playwright) → video/out/<id>.webm
 *   npx tsx video/record.ts --base http://localhost:3000 [--only s04-title,s09-numbers]
 * screen scenes: the real app (start a デモの続き session, then the scene's steps); anim scenes: video/scenes/*.html.
 * Subtitles (the narration draft) are drawn as an overlay while recording — no subtitle filter needed in ffmpeg.
 * Numbers in s09 come from data/demo/results.json (injected as window.RESULTS).
 */
import { mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Page } from "playwright";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");
const { values } = parseArgs({ options: { base: { type: "string", default: "http://localhost:3000" }, only: { type: "string" } } });
const plan = JSON.parse(readFileSync(path.join(__dirname, "scenes.json"), "utf8")) as {
  scenes: { id: string; kind: "screen" | "anim"; seconds: number; page: string; narration: string; subtitle?: false }[];
};
const results = readFileSync(path.join(ROOT, "data/demo/results.json"), "utf8");

/** Subtitle overlay: one sentence at a time, each shown for a share of the scene proportional to its length
 *  (an approximation until the narration audio exists; then cue times come from the audio). */
const SUBTITLE = (text: string, seconds: number) => `
  window.addEventListener("DOMContentLoaded", () => {
    const cues = ${JSON.stringify(text)}.split(/(?<=。)/).map((x) => x.trim()).filter(Boolean);
    if (!cues.length) return;
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:1100px;padding:8px 22px;" +
      "background:rgba(31,35,40,.82);color:#f3f2ee;font:500 26px/1.6 'Hiragino Sans','Yu Gothic',sans-serif;border-radius:4px;" +
      "text-align:center;z-index:2147483647;pointer-events:none";
    document.body.appendChild(el);
    const total = cues.reduce((n, c) => n + c.length, 0);
    let at = 0;
    for (const c of cues) {
      setTimeout(() => { el.textContent = c; }, at);
      at += (${seconds} * 1000 * c.length) / total;
    }
  });`;

/** Scripted steps for real-screen scenes (kept short; finalized with the narration after the feature freeze). */
const STEPS: Record<string, (p: Page, base: string) => Promise<void>> = {
  "s01-hook": async (p, base) => {
    await p.waitForTimeout(2500);
    await p.goto(base + "/kokoroe"); await p.waitForTimeout(3500);
    await p.goto(base + "/noren"); await p.waitForTimeout(3000);
  },
  "s05-choba": async (p) => { await p.waitForTimeout(3000); await p.mouse.wheel(0, 500); },
  "s06-kokoroe": async (p) => { await p.locator("details summary").first().click(); },
  "s08-noren": async (p) => { await p.locator('button[value="Q01"]').click(); },
};

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const only = values.only?.split(",");
  for (const s of plan.scenes.filter((x) => !only || only.includes(x.id))) {
    const subtitle = s.subtitle === false || s.narration.startsWith("（") ? "" : s.narration; // （…） = placeholder; text-led cards have none
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 720 }, locale: "ja-JP", colorScheme: "light",
      recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
    });
    await ctx.addInitScript(`window.RESULTS = ${results};`);
    await ctx.addInitScript(SUBTITLE(subtitle, s.seconds));
    const p = await ctx.newPage();
    const t0 = Date.now();
    if (s.kind === "anim") {
      await p.goto("file://" + path.join(ROOT, s.page));
    } else {
      await p.goto(values.base + "/");
      await p.locator('form:has(input[value="demo"]) button').click();
      await p.waitForURL("**/choba");
      if (s.page !== "/choba") await p.goto(values.base + s.page);
      await STEPS[s.id]?.(p, values.base!);
    }
    await p.waitForTimeout(Math.max(0, s.seconds * 1000 - (Date.now() - t0)));
    const video = p.video();
    await ctx.close();
    if (video) renameSync(await video.path(), path.join(OUT, `${s.id}.webm`));
    console.log(`${s.id}: ${s.seconds}s recorded`);
  }
  await browser.close();
})();
