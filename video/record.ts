/**
 * Record each scene of video/scenes.json as a 1280×720 clip (Playwright) → video/out/<id>.webm
 *   npx tsx video/record.ts --base http://127.0.0.1:3123 [--only s04-title,s05-choba] [--live]   (normally via video/shoot.ts)
 * screen scenes: the real app (start a デモの続き session, then the scene's steps); anim scenes: video/scenes/*.html.
 * Subtitles (the narration draft) are drawn as an overlay while recording — no subtitle filter needed in ffmpeg.
 * Numbers in s09 come from data/demo/results.json (injected as window.RESULTS).
 */
import { mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Locator, type Page } from "playwright";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");
const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3000" }, only: { type: "string" }, live: { type: "boolean", default: false } } });
const plan = JSON.parse(readFileSync(path.join(__dirname, "scenes.json"), "utf8")) as {
  scenes: { id: string; kind: "screen" | "anim"; seconds: number; page: string; narration: string; subtitle?: false }[];
};
const results = readFileSync(path.join(ROOT, "data/demo/results.json"), "utf8");
const mcpAnswers = readFileSync(path.join(ROOT, "demo/successor-mcp/answers.json"), "utf8");
/** Screen scenes start a デモの続き session, except s05 (お試し, the T05 → T13 queue). */
const START: Record<string, "demo" | "trial"> = { "s05-choba": "trial" };

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

const shown = (l: Locator, timeout: number) => l.first().waitFor({ timeout }).then(() => true, () => false);

/** Scripted steps for real-screen scenes. Finalized with the narration after the feature freeze; timing is logged per scene. */
const STEPS: Record<string, (p: Page, base: string, live: boolean) => Promise<void>> = {
  "s01-hook": async (p, base) => {
    await p.waitForTimeout(2500);
    await p.goto(base + "/kokoroe"); await p.waitForTimeout(3500);
    await p.goto(base + "/noren"); await p.waitForTimeout(3000);
  },
  // お試し with KOKOROE_VIDEO_QUEUE=T05,T13 (video/shoot.ts): △ + one line on T05, then the next similar scene (T13).
  "s05-choba": async (p, _base, live) => {
    const card = p.locator('section[aria-labelledby="card-h"]');
    await p.waitForTimeout(3000); // read the T05 draft (表: 奥様, 裏: none)
    await card.locator('label:has(input[value="△"])').click();
    await card.locator('input[name="remark"]').pressSequentially("裏で蔵元に一言", { delay: 110 });
    await p.waitForTimeout(400);
    await card.locator('button:has-text("で記録する")').click();
    if (live) {
      // The interpreter's readings arrive in the side panel; the master taps the one about the 蔵元, skips "why?", confirms ○.
      const picks = p.locator('aside button[name="pick"]');
      if (await shown(picks, 45000)) {
        const kura = picks.filter({ hasText: "蔵元" });
        await ((await kura.count()) ? kura.first() : picks.first()).click();
        if (await shown(p.locator('aside button[name="skip"]'), 20000)) await p.locator('aside button[name="skip"]').first().click();
        if (await shown(p.locator('aside button[name="verdict"][value="○"]'), 45000)) await p.locator('aside button[name="verdict"][value="○"]').first().click();
      }
    }
    await p.waitForTimeout(2000);
    await card.scrollIntoViewIfNeeded(); // T13's draft: the quiet word to the 蔵元
    await p.mouse.wheel(0, 260);
  },
  "s06-kokoroe": async (p) => {
    await p.waitForTimeout(2500);
    // Open a rule whose 沿革 has more than one entry; otherwise the first rule the master gave a reason for.
    const multi = p.locator("summary", { hasText: /出典と沿革（[2-9]/ });
    const s = (await multi.count()) ? multi.first() : p.locator('p:has-text("わけ")').first().locator("xpath=following::summary[1]");
    await s.scrollIntoViewIfNeeded();
    await s.click();
    await p.waitForTimeout(1200);
    await p.mouse.wheel(0, 220);
  },
  "s08-noren": async (p) => {
    await p.waitForTimeout(2000);
    await p.locator('button[value="Q01"]').click();
    await p.waitForTimeout(4000);
    await p.mouse.wheel(0, 320);
  },
  "s09-keiko": async (p) => {
    await p.waitForTimeout(6000);
    await p.locator("#curve-h").scrollIntoViewIfNeeded();
    await p.mouse.wheel(0, 120);
  },
};

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const only = values.only?.split(",");
  for (const s of plan.scenes.filter((x) => !only || only.includes(x.id))) {
    const subtitle = s.subtitle === false || s.narration.startsWith("（") ? "" : s.narration; // （…） = placeholder; text-led cards have none
    // Screen scenes: a slightly larger viewport scaled down to 1280×720, so a whole 帳場 card fits.
    const viewport = s.kind === "screen" ? { width: 1536, height: 864 } : { width: 1280, height: 720 };
    const ctx = await browser.newContext({
      viewport, locale: "ja-JP", colorScheme: "light",
      recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
    });
    await ctx.addInitScript(`window.RESULTS = ${results}; window.MCP = ${mcpAnswers};`);
    await ctx.addInitScript(SUBTITLE(subtitle, s.seconds));
    const p = await ctx.newPage();
    const t0 = Date.now();
    if (s.kind === "anim") {
      await p.goto("file://" + path.join(ROOT, s.page));
    } else {
      await p.goto(values.base + "/");
      await p.locator(`form:has(input[value="${START[s.id] ?? "demo"}"]) button`).click();
      await p.waitForURL("**/choba");
      if (s.page !== "/choba") await p.goto(values.base + s.page);
      await STEPS[s.id]?.(p, values.base!, values.live);
    }
    const used = (Date.now() - t0) / 1000;
    if (used > s.seconds) console.warn(`  ${s.id}: steps took ${used.toFixed(1)}s > ${s.seconds}s planned — the clip will be cut; adjust scenes.json`);
    await p.waitForTimeout(Math.max(0, s.seconds * 1000 - (Date.now() - t0)));
    const video = p.video();
    await ctx.close();
    if (video) renameSync(await video.path(), path.join(OUT, `${s.id}.webm`));
    console.log(`${s.id}: ${s.seconds}s recorded`);
  }
  await browser.close();
})();
