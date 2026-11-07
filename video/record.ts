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
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Locator, type Page } from "playwright";
import { VOICE, loadPlan } from "./narration";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");
const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3000" }, only: { type: "string" }, live: { type: "boolean", default: false }, "recut-s05": { type: "string" } } });
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
    el.textContent = window.OFFICIAL_BANNER ?? "途中経過（11/3）の数字。11/7 の計測で差し替えます。架空の10社・評価用20場面、師匠はシミュレータ（コードで判定）。";
    el.style.cssText = "position:fixed;left:0;right:0;top:0;padding:10px 24px;background:#2b4a6f;color:#f3f2ee;" +
      "font:600 22px/1.5 'Hiragino Sans','Yu Gothic',sans-serif;text-align:center;z-index:2147483647;pointer-events:none";
    document.body.appendChild(el);
  });`;

/** s07 (運営 11/5: make clear what is Kokoroe's own): a quiet tag in the top-left corner — this is Kokoroe's own screen, and the
 *  answer's words are written by Claude through the API from the 心得帳. s07b then shows the off-the-shelf Claude Code. */
const OWN_SCREEN = (text: string) => `
  window.addEventListener("DOMContentLoaded", () => {
    const el = document.createElement("div");
    el.textContent = ${JSON.stringify(text)};
    el.style.cssText = "position:fixed;right:18px;top:150px;width:max-content;white-space:pre-line;padding:8px 12px;border:2px solid #2b4a6f;background:rgba(243,242,238,.94);" +
      "color:#2b4a6f;font:600 17px/1.55 'Hiragino Sans','Yu Gothic',sans-serif;z-index:2147483646;pointer-events:none";
    document.body.appendChild(el);
  });`;
const TAGS: Record<string, string> = {
  // The second part (judge-critic 11/6): the recorded answer's 浜風運輸 wording differs from the 心得帳 shown just before in s06.
  "s07-noren": "ココロエの画面（自作）\n答えの文面は、\nClaude の API が\n心得帳から書きます\n\n記録した答えなので、\n心得の言い回しは\n前の画面と違います",
};

/** Scroll the page slowly (ease in and out, `ms` long) so that the element sits in the lower middle of the screen. Playwright's
 *  own scrolling before a click is instant, which reads as a jump in the video. */
async function glideTo(p: Page, l: Locator, ms: number) {
  const box = await l.first().boundingBox(); // in viewport coordinates
  if (!box) return;
  // Sent as a string: tsx wraps named functions in a __name() helper that does not exist in the page.
  await p.evaluate(`new Promise((done) => {
    const from = window.scrollY, ms = ${ms};
    const to = Math.max(0, Math.min(from + ${box.y} - window.innerHeight * 0.35, document.documentElement.scrollHeight - window.innerHeight));
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      window.scrollTo(0, from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2));
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  })`);
}

const shown = (l: Locator, timeout: number) => l.first().waitFor({ timeout }).then(() => true, () => false);

/** Scripted steps for real-screen scenes. Finalized with the narration after the feature freeze; timing is logged per scene. */
const STEPS: Record<string, (p: Page, base: string, live: boolean) => Promise<void>> = {
  // お試し with KOKOROE_VIDEO_QUEUE=T05,T13 (video/shoot.ts): △ + one line on T05, then the next similar scene (T13).
  "s05-choba": async (p, _base, live) => {
    const card = p.locator('section[aria-labelledby="card-h"]');
    // Read the T05 draft (表: 奥様, 裏: none) while the narration describes it; △ on 「師匠は、△。」 at about 8 s, as before.
    // The card is long since visit plans were added, so the camera first glides down to 判定 (Kento 11/5: no jump on the click,
    // so the viewer sees where the master presses). The time comes out of the reading pause; the scene length is unchanged.
    // On the way, the camera rests on the visit plan for a moment (Kento 11/5: the range of etiquette beyond mail is worth seeing),
    // then goes on to 判定; the △ is pressed when its subtitle appears.
    await p.waitForTimeout(3600);
    await glideTo(p, card.locator('section[aria-label="訪問"]'), 1000);
    await p.waitForTimeout(1200);
    await glideTo(p, card.locator('section[aria-label="判定"]'), 1000);
    // △ on the subtitle 「師匠は、△。」 itself: the page's load time varies from run to run, the subtitle's clock does not.
    await p.getByText("師匠は、△。", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await p.waitForTimeout(150);
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
    // Hold on the right column (the reading and 「心得帳に書きました」) while 「弟子はその一言を読み取り、心得帳に書きました。」 plays,
    // and move to T13 only when 「次の根回しの場面では…」 starts (judge-critic 11/7, item 24's extra seconds go to this hold).
    await p.getByText("次の根回しの場面では", { exact: false }).first().waitFor({ state: "visible", timeout: 30000 }).catch(() => p.waitForTimeout(2000));
    // T13's draft: the quiet word to the 蔵元. The card is long since visit plans were added (11/5), so scroll to the
    // 段取り's 「裏で誰に」 row itself rather than by a fixed amount (dry run 11/5: a fixed scroll ended below the 段取り).
    const back = card.locator('section[aria-label="段取り"] dt', { hasText: "裏で誰に" }).first();
    await back.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
  },
  "s06-kokoroe": async (p) => {
    await p.waitForTimeout(1600);
    // Open a rule whose 沿革 has more than one entry; otherwise the first rule the master gave a reason for.
    const multi = p.locator("summary", { hasText: /出典と沿革（[2-9]/ });
    const s = (await multi.count()) ? multi.first() : p.locator('p:has-text("わけ")').first().locator("xpath=following::summary[1]");
    await s.scrollIntoViewIfNeeded();
    await s.click();
    // Stay on this rule and its わけ (judge-critic 11/6: scrolling on ended on 丸新's rule 「（一言なし）」, seconds after the viewer
    // watched the master type a remark in s05; s07 then quotes this わけ).
  },
  "s07-noren": async (p) => {
    await p.waitForTimeout(2000);
    await p.locator('button[value="Q03"]').click(); // 浜風運輸: answered from the master's × (Kento 11/5)
    await p.waitForTimeout(4000);
    await p.mouse.wheel(0, 320);
  },
  // Before → After stays on screen while the numbers are said; the curve is not needed in v2.
  "s08b-keiko": async (p) => {
    await p.waitForTimeout(500);
  },
};

/**
 * s05 live, in two passes (Kento 11/7: the live steps take ~90 s, the scene is 26 s — jump cuts, not a longer scene).
 * Pass 1 records the real live session without subtitles and notes when each step happened. The clip is then cut into three
 * parts with ffmpeg — the 判定 and the remark, the right column when the reading is written, T13's 変化 — and pass 2 plays the
 * cut clip full frame in a page with the same subtitles and noren as every other scene, so nothing is staged: every frame is
 * from the live run, only the waiting is cut out.
 */
async function s05TwoPass(
  browser: import("playwright").Browser, s: { id: string; page: string; seconds: number }, base: string,
  storageState: Awaited<ReturnType<import("playwright").BrowserContext["storageState"]>> | undefined,
  viewport: { width: number; height: number }, cues: string[], at: number[], end: number, recut?: Record<string, number>,
) {
  // --recut-s05 (11/7, after Kento's full watch): skip pass 1 and cut the live take already recorded (s05-raw.webm) with its
  // logged step times — the narration changed, the live footage does not.
  const rawPath = path.join(OUT, "s05-raw.webm");
  let marks: Record<string, number>;
  if (recut) {
    if (!existsSync(rawPath)) throw new Error("--recut-s05 needs video/out/s05-raw.webm from the live take");
    marks = recut;
  } else {
  const rawCtx = await browser.newContext({ viewport, locale: "ja-JP", colorScheme: "light", storageState, recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } });
  await rawCtx.addInitScript(`window.RESULTS = ${results}; window.MCP = ${mcpAnswers};`);
  const p = await rawCtx.newPage();
  const tStart = Date.now();
  const since = () => (Date.now() - tStart) / 1000;
  const until = async (sec: number) => { const w = sec * 1000 - (Date.now() - tStart); if (w > 0) await p.waitForTimeout(w); };
  await p.goto(base + s.page);
  const card = p.locator('section[aria-labelledby="card-h"]');
  await p.waitForTimeout(3600);
  await glideTo(p, card.locator('section[aria-label="訪問"]'), 1000);
  await p.waitForTimeout(1200);
  await glideTo(p, card.locator('section[aria-label="判定"]'), 1000);
  await until(at[2]); // 「師匠は、△。」
  await card.locator('label:has(input[value="△"])').click();
  await p.waitForTimeout(700);
  await card.locator('input[name="remark"]').pressSequentially("裏で蔵元に一言", { delay: 110 });
  await p.waitForTimeout(500);
  await card.locator('button:has-text("で記録する")').click();
  marks = { recorded: since() };
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" })); // the right column: the apprentice's reading
  const picks = p.locator('aside button[name="pick"]');
  if (await shown(picks, 60000)) {
    marks.readings = since();
    await p.waitForTimeout(1800);
    const kura = picks.filter({ hasText: "蔵元" });
    await ((await kura.count()) ? kura.first() : picks.first()).click();
  }
  if (await shown(p.locator("aside").getByText("心得帳に書きました"), 45000)) marks.written = since();
  await p.waitForTimeout(2500);
  if (await shown(p.locator('aside button[name="skip"]'), 8000)) await p.locator('aside button[name="skip"]').first().click();
  if (await shown(p.locator('aside button[name="verdict"][value="○"]'), 15000)) await p.locator('aside button[name="verdict"][value="○"]').first().click();
  // The middle card (T02) was drafted before the rule existed; give the prefetched T13 time to be rebuilt with it, then ○.
  await glideTo(p, card.locator('section[aria-label="判定"]'), 800);
  marks.middle = since();
  await p.waitForTimeout(9000);
  await card.locator('label:has(input[value="○"])').click();
  await card.locator('button:has-text("で記録する")').click();
  const change = card.locator('section[aria-label="変化"]');
  if (await shown(change, 60000)) {
    await glideTo(p, change, 1200);
    await p.waitForTimeout(400);
    marks.t13 = since();
  }
  await p.waitForTimeout(7000);
  const rawVideo = p.video();
  await rawCtx.close();
  if (rawVideo) renameSync(await rawVideo.path(), rawPath);
  console.log("  s05 live marks (s):", JSON.stringify(Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, +v.toFixed(2)]))));
  }
  if (marks.written === undefined || marks.t13 === undefined) throw new Error("s05: the reading or T13's 変化 did not appear — not cutting a clip that would not show them");
  // Cut: [0, at[4]) the 判定 and the remark; then the reading written, for 「弟子はその一言を読み取り…」; then T13 from 「次の根回し…」.
  // Cut points by sentence, not by position (the narration gained a sentence on 11/7).
  const iRead = cues.findIndex((c) => c.startsWith("弟子はその一言")), iNext = cues.findIndex((c) => c.startsWith("次の根回し"));
  if (iRead < 0 || iNext < 0) throw new Error("s05: the cut sentences were not found in the narration");
  const s0 = at[iRead], s1 = at[iNext], total = s.seconds;
  const seg2 = Math.max(marks.readings ?? marks.recorded, marks.written - 3.0);
  const seg3 = marks.t13 - 0.3;
  const edit = path.join(OUT, "s05-edit.mp4");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", rawPath, "-filter_complex",
    `[0:v]trim=0:${s0.toFixed(2)},setpts=PTS-STARTPTS[a];` +
    `[0:v]trim=start=${seg2.toFixed(2)}:duration=${(s1 - s0).toFixed(2)},setpts=PTS-STARTPTS[b];` +
    `[0:v]trim=start=${seg3.toFixed(2)}:duration=${(total - s1 + 0.3).toFixed(2)},setpts=PTS-STARTPTS[c];` +
    `[a][b][c]concat=n=3:v=1:a=0,fps=25[o]`, "-map", "[o]", "-c:v", "libx264", "-pix_fmt", "yuv420p", edit]);
  console.log(`  s05 cut: 0–${s0.toFixed(1)} | ${seg2.toFixed(1)}–${(seg2 + s1 - s0).toFixed(1)} | ${seg3.toFixed(1)}–${(seg3 + total - s1).toFixed(1)}`);
  // Pass 2: play the cut clip with the scene's subtitles and noren, like any other scene.
  const html = path.join(OUT, "s05-play.html");
  writeFileSync(html, `<!doctype html><html><body style="margin:0;background:#f3f2ee"><video src="s05-edit.mp4" autoplay muted playsinline style="display:block;width:1280px;height:720px"></video></body></html>`);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: "ja-JP", recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } });
  const t0 = Date.now();
  await ctx.addInitScript(SUBTITLE(cues, at, end, t0, 26));
  await ctx.addInitScript(WIPE(t0));
  // Kento 11/7: say on screen that the clip is joined (the waiting and the middle card are cut out).
  await ctx.addInitScript(`window.addEventListener("DOMContentLoaded", () => { const d = document.createElement("div"); d.textContent = "（待ち時間と、間の1件を詰めています）";
    d.style.cssText = "position:fixed;top:14px;right:18px;padding:4px 10px;background:rgba(243,242,238,.92);border:1px solid #c9c6bd;border-radius:3px;font:500 15px/1.5 'Hiragino Sans',sans-serif;color:#555b63;z-index:2147483645";
    document.body.appendChild(d); });`);
  const pp = await ctx.newPage();
  await pp.goto("file://" + html);
  await pp.waitForTimeout(Math.max(0, total * 1000 - (Date.now() - t0)));
  const v = pp.video();
  await ctx.close();
  if (v) renameSync(await v.path(), path.join(OUT, `${s.id}.webm`));
}

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
    if (s.id === "s05-choba" && (values.live || values["recut-s05"])) {
      const recut = values["recut-s05"] ? (JSON.parse(values["recut-s05"]) as Record<string, number>) : undefined;
      await s05TwoPass(browser, s, values.base!, storageState, viewport, cues, at, end, recut);
      console.log(`${s.id}: ${s.seconds}s recorded (live, cut)`);
      continue;
    }
    const ctx = await browser.newContext({
      viewport, locale: "ja-JP", colorScheme: "light", storageState,
      recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
    });
    await ctx.addInitScript(`window.RESULTS = ${results}; window.MCP = ${mcpAnswers};`);
    const t0 = Date.now();
    // Screen scenes are recorded at 1536 px and scaled to 1280, so their subtitles are drawn larger to look the same.
    await ctx.addInitScript(SUBTITLE(cues, at, end, t0, s.kind === "screen" ? 31 : 26));
    // s08b always says the numbers are fictional and the master is the simulator (judge-critic 11/6: "114 taps" otherwise reads as a
    // person); while the numbers are interim it says that too.
    if (s.id === "s08b-keiko") {
      if (official) await ctx.addInitScript(`window.OFFICIAL_BANNER = "架空の取引先10社・評価用20場面。師匠はシミュレータ（隠しの正解に照らして、コードで判定）。";`);
      await ctx.addInitScript(INTERIM);
    }
    if (TAGS[s.id]) await ctx.addInitScript(OWN_SCREEN(TAGS[s.id]));
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
