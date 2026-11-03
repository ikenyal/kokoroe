/**
 * Still frames of the animated scenes → docs/screens/video-<id>-<n>.png (for review, without the subtitle overlay).
 *   npx tsx video/stills.ts [--only s02-ledger,s03-head]
 * Every scene animates with CSS only, so each frame is taken by pausing all animations at the same time (reproducible).
 */
import path from "node:path";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const ROOT = path.resolve(__dirname, "..");
const FRAMES: Record<string, number[]> = {
  "s00-open": [0.6, 2.0, 4.3, 5.6, 6.9, 7.8, 10.4, 12.6],
  "s01-why": [1.4, 3.2, 6.6, 8.4, 12.9, 14.6, 17.2, 21.8],
  "s02-problem": [2.6, 7.6, 12.6, 17.4, 21.8],
  "s03-head": [1.6, 2.6, 4.2],
  "s04-title": [2.0, 3.4, 4.5, 6.4, 10.2],
  "s04b-flow": [2.2, 5.2, 8.2, 10.8],
  "s06b-ask": [5.0],
  "s07b-mcp": [2.6, 6.8, 10.2],
  "s07c-ask": [4.0],
  "s08-pile": [2.4, 5.2, 7.0, 9.0, 11.6],
  "s09-edo": [2.0, 4.2, 5.6, 7.2],
  "s09b-end": [3.2, 5.6, 9.8],
};
const PAGES = Object.fromEntries(
  (JSON.parse(readFileSync(path.join(ROOT, "video/scenes.json"), "utf8")) as { scenes: { id: string; page: string }[] }).scenes.map((s) => [s.id, s.page]),
);
const { values } = parseArgs({ options: { only: { type: "string" } } });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, locale: "ja-JP" });
  // Same data the recorder injects (video/record.ts): recorded successor answers and the generated results.
  const MCP = JSON.parse(readFileSync(path.join(ROOT, "demo/successor-mcp/answers.json"), "utf8"));
  const RESULTS = JSON.parse(readFileSync(path.join(ROOT, "data/demo/results.json"), "utf8"));
  await page.addInitScript(([m, r]) => Object.assign(window, { MCP: m, RESULTS: r }), [MCP, RESULTS] as const);
  for (const [id, times] of Object.entries(FRAMES)) {
    if (values.only && !values.only.split(",").includes(id)) continue;
    await page.goto("about:blank"); // ask.html#noren → ask.html#why would otherwise be a same-page hash change (no reload)
    await page.goto("file://" + path.join(ROOT, PAGES[id] ?? `video/scenes/${id}.html`)); // ask.html#… pages share one file
    await page.evaluate(() => document.fonts.ready);
    for (const [i, t] of times.entries()) {
      await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), t * 1000);
      const file = path.join(ROOT, "docs/screens", `video-${id}-${i + 1}.png`);
      await page.screenshot({ path: file });
      console.log(`${path.relative(ROOT, file)}  t=${t}s`);
    }
  }
  await browser.close();
})();
