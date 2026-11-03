/**
 * Record each scene of video/scenes.json as a 1280×720 clip (Playwright) → video/out/<id>.webm
 *   npx tsx video/record.ts --base http://127.0.0.1:3123 [--only s04-title,s05-choba] [--live]   (normally via video/shoot.ts)
 * screen scenes: the real app — the session (デモの続き, or お試し for s05) is started in a separate, unrecorded context, so each
 * clip opens on its own page; then the scene's steps. anim scenes: video/scenes/*.html.
 * Subtitles (the narration, one sentence at a time) are drawn as an overlay while recording — no subtitle filter in ffmpeg.
 * Cue times are the sentence times Polly reported (video/out/audio/Takumi/<id>.marks.json) plus the lead the narration starts
 * after (scenes.json "lead"); without marks they fall back to a share of the scene proportional to sentence length.
 * Numbers come from data/demo/results.json (window.RESULTS; the narration's {before} etc. are filled the same way).
 */
import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Locator, type Page } from "playwright";
import { VOICE, loadPlan } from "./narration";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");
const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3000" }, only: { type: "string" }, live: { type: "boolean", default: false } } });
const plan = loadPlan();
const LEAD = (JSON.parse(readFileSync(path.join(__dirname, "scenes.json"), "utf8")) as { lead?: number }).lead ?? 0;
const results = readFileSync(path.join(ROOT, "data/demo/results.json"), "utf8");
const official = (JSON.parse(results) as { official: boolean }).official;
const mcpAnswers = readFileSync(path.join(ROOT, "demo/successor-mcp/answers.json"), "utf8");
/** Screen scenes start a デモの続き session, except s05 (お試し, the T05 → T13 queue). */
const START: Record<string, "demo" | "trial"> = { "s05-choba": "trial" };

/** Cue start times (s, from the clip's start): Polly's sentence marks + lead, or a share proportional to sentence length. */
function cueTimes(id: string, cues: string[], seconds: number): { at: number[]; end: number } {
  if (!cues.length) return { at: [], end: seconds }; // no subtitle (text-led cards: the words are on screen)
  const marks = path.join(__dirname, "out", "audio", VOICE.id, `${id}.marks.json`);
  if (existsSync(marks)) {
    const m = JSON.parse(readFileSync(marks, "utf8")) as { seconds: number; sentences: number[] };
    if (m.sentences.length === cues.length) return { at: m.sentences.map((t) => LEAD + t / 1000), end: Math.min(seconds - 0.05, LEAD + m.seconds + 0.3) };
    console.warn(`  ${id}: ${m.sentences.length} sentence marks for ${cues.length} subtitle lines — timing by length instead`);
  }
  const total = cues.reduce((n, c) => n + c.length, 0);
  let at = 0;
  return { at: cues.map((c) => { const t = at; at += (seconds * c.length) / total; return t; }), end: seconds };
}

/** Subtitle overlay: one sentence at a time. Times are relative to the clip's start (t0, ms since epoch), so a page load
 *  in the middle of a scene picks up the current line instead of starting over. */
const SUBTITLE = (cues: string[], at: number[], end: number, t0: number, px: number) => `
  window.addEventListener("DOMContentLoaded", () => {
    const cues = ${JSON.stringify(cues)}, at = ${JSON.stringify(at)};
    if (!cues.length) return;
    const el = document.createElement("div");
    // Centered with margin:auto (not left:50% + translate, which caps the box at half the width and wraps short lines).
    el.style.cssText = "position:fixed;left:0;right:0;margin:0 auto;width:fit-content;bottom:${Math.round(px * 1.08)}px;max-width:${Math.round(px * 42)}px;" +
      "padding:${Math.round(px * 0.3)}px ${Math.round(px * 0.85)}px;" +
      "background:rgba(31,35,40,.82);color:#f3f2ee;font:500 ${px}px/1.6 'Hiragino Sans','Yu Gothic',sans-serif;border-radius:4px;" +
      "text-align:center;z-index:2147483647;pointer-events:none";
    document.body.appendChild(el);
    const now = () => Date.now() - ${t0};
    const show = (t) => { el.textContent = t; el.style.visibility = t ? "visible" : "hidden"; };
    show("");
    cues.forEach((c, i) => setTimeout(() => show(c), Math.max(0, at[i] * 1000 - now())));
    setTimeout(() => show(""), Math.max(0, ${end} * 1000 - now()));
  });`;

/** Chapter break (scenes.json "wipe": "noren", used three times only): the scene opens behind a noren — four 藍 flaps on a bar,
 *  a 心 crest across the middle (a mark, not the product name) — that parts to the left and right, as if the viewer walks through it. Drawn over the page
 *  (works the same on anim and screen scenes); only on the first load of the clip, never after a navigation inside it. */
const WIPE = (t0: number) => `
  window.addEventListener("DOMContentLoaded", () => {
    if (Date.now() - ${t0} > 1500) return;
    const st = document.createElement("style");
    st.textContent = \`
      #noren { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; }
      #noren .bar { position: absolute; left: 0; right: 0; top: 0; height: 2.2vh; background: #1f2328; animation: nbar .35s .75s ease forwards; }
      #noren .f { position: absolute; top: 2.2vh; bottom: -2vh; width: calc(25% - .4vw); background: #2b4a6f;
        animation: var(--k) .8s var(--d) cubic-bezier(.55,0,.35,1) forwards; transform-origin: top center; }
      #noren .mon { position: absolute; left: 50%; top: 42%; width: 18vh; height: 18vh; margin: -9vh 0 0 -9vh; border-radius: 50%;
        border: .5vh solid #f3f2ee; color: #f3f2ee; display: grid; place-items: center; font: 600 8vh/1 "Hiragino Mincho ProN", serif;
        animation: nmon .25s .12s ease forwards; }
      @keyframes nL { to { transform: translateX(-60vw) skewX(8deg); } }
      @keyframes nR { to { transform: translateX(60vw) skewX(-8deg); } }
      @keyframes nmon { to { opacity: 0; } }
      @keyframes nbar { to { transform: translateY(-3vh); } }\`;
    document.head.appendChild(st);
    const n = document.createElement("div");
    n.id = "noren";
    n.innerHTML = '<div class="bar"></div>' +
      [0, 1, 2, 3].map((i) => \`<div class="f" style="left:calc(\${i * 25}% + .2vw);--k:\${i < 2 ? "nL" : "nR"};--d:\${[0.22, 0.16, 0.16, 0.22][i]}s"></div>\`).join("") +
      '<div class="mon">心</div>';
    document.body.appendChild(n);
  });`;

/** While the numbers are interim, s08b says so at the top of the screen (not only in the page's small print). */
const INTERIM = `
  window.addEventListener("DOMContentLoaded", () => {
    const el = document.createElement("div");
    el.textContent = "途中経過（11/3）の数字です。正式な数字は 11/7 の計測で差し替えます。架空の取引先10社・評価用20場面。";
    el.style.cssText = "position:fixed;left:0;right:0;top:0;padding:10px 24px;background:#2b4a6f;color:#f3f2ee;" +
      "font:600 22px/1.5 'Hiragino Sans','Yu Gothic',sans-serif;text-align:center;z-index:2147483647;pointer-events:none";
    document.body.appendChild(el);
  });`;

const shown = (l: Locator, timeout: number) => l.first().waitFor({ timeout }).then(() => true, () => false);

/** Scripted steps for real-screen scenes. Finalized with the narration after the feature freeze; timing is logged per scene. */
const STEPS: Record<string, (p: Page, base: string, live: boolean) => Promise<void>> = {
  // お試し with KOKOROE_VIDEO_QUEUE=T05,T13 (video/shoot.ts): △ + one line on T05, then the next similar scene (T13).
  "s05-choba": async (p, _base, live) => {
    const card = p.locator('section[aria-labelledby="card-h"]');
    await p.waitForTimeout(8000); // read the T05 draft (表: 奥様, 裏: none) while the narration describes it; △ on 「師匠は、△。」
    await card.locator('label:has(input[value="△"])').click();
    await p.waitForTimeout(1200); // the remark is typed while the narration answers the cold open (「答えは、蔵元への、裏の一言でした。」)
    await card.locator('input[name="remark"]').pressSequentially("裏で蔵元に一言", { delay: 150 });
    await p.waitForTimeout(3700);
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
    await p.waitForTimeout(1600);
    // Open a rule whose 沿革 has more than one entry; otherwise the first rule the master gave a reason for.
    const multi = p.locator("summary", { hasText: /出典と沿革（[2-9]/ });
    const s = (await multi.count()) ? multi.first() : p.locator('p:has-text("わけ")').first().locator("xpath=following::summary[1]");
    await s.scrollIntoViewIfNeeded();
    await s.click();
    await p.waitForTimeout(1200);
    await p.mouse.wheel(0, 220);
  },
  "s07-noren": async (p) => {
    await p.waitForTimeout(2000);
    await p.locator('button[value="Q01"]').click();
    await p.waitForTimeout(4000);
    await p.mouse.wheel(0, 320);
  },
  // Before → After stays on screen while the numbers are said; the curve is not needed in v2.
  "s08b-keiko": async (p) => {
    await p.waitForTimeout(500);
  },
};

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const only = values.only?.split(",");
  for (const s of plan.scenes.filter((x) => !only || only.includes(x.id))) {
    const subtitle = s.subtitle === false || s.narration.startsWith("（") ? "" : s.narration; // （…） = placeholder; text-led cards have none
    const cues = subtitle.split(/(?<=。)/).map((x) => x.trim()).filter(Boolean);
    const { at, end } = cueTimes(s.id, cues, s.seconds);
    // Screen scenes: a slightly larger viewport scaled down to 1280×720, so a whole 帳場 card fits.
    const viewport = s.kind === "screen" ? { width: 1536, height: 864 } : { width: 1280, height: 720 };
    // Screen scenes: start the session off camera and carry its cookie into the recorded context.
    let storageState: Awaited<ReturnType<import("playwright").BrowserContext["storageState"]>> | undefined;
    if (s.kind === "screen") {
      const setup = await browser.newContext({ viewport, locale: "ja-JP" });
      const sp = await setup.newPage();
      await sp.goto(values.base + "/");
      await sp.locator(`form:has(input[value="${START[s.id] ?? "demo"}"]) button`).click();
      await sp.waitForURL("**/choba");
      storageState = await setup.storageState();
      await setup.close();
    }
    const ctx = await browser.newContext({
      viewport, locale: "ja-JP", colorScheme: "light", storageState,
      recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
    });
    await ctx.addInitScript(`window.RESULTS = ${results}; window.MCP = ${mcpAnswers};`);
    const t0 = Date.now();
    // Screen scenes are recorded at 1536 px and scaled to 1280, so their subtitles are drawn larger to look the same.
    await ctx.addInitScript(SUBTITLE(cues, at, end, t0, s.kind === "screen" ? 31 : 26));
    if (s.id === "s08b-keiko" && !official) await ctx.addInitScript(INTERIM);
    if (s.wipe === "noren") await ctx.addInitScript(WIPE(t0));
    const p = await ctx.newPage();
    if (s.kind === "anim") {
      await p.goto("file://" + path.join(ROOT, s.page));
    } else {
      await p.goto(values.base + s.page);
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
