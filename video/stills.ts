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
  "s01-problem": [2.6, 6.8, 11.2, 15.8],
  "s02-failure": [3.4, 5.0, 8.0, 12.6],
  "s03-head": [2.6, 3.9, 7.8, 11.0, 13.6, 15.0],
  "s04-title": [1.8, 3.0, 4.1, 6.8],
  "s04b-flow": [2.2, 5.2, 8.2, 11.2],
  "s07b-mcp": [2.6, 6.8, 11.2],
  "s08-pile": [2.6, 5.0, 8.9, 10.6, 12.4, 15.6],
  "s09-edo": [2.2, 4.6, 6.8, 9.0],
  "s09b-end": [3.2, 6.2, 11.8],
};
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
    await page.goto("file://" + path.join(ROOT, "video/scenes", `${id}.html`));
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
