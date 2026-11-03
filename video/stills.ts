/**
 * Still frames of the animated scenes → docs/screens/video-<id>-<n>.png (for review, without the subtitle overlay).
 *   npx tsx video/stills.ts [--only s02-ledger,s03-head]
 * Every scene animates with CSS only, so each frame is taken by pausing all animations at the same time (reproducible).
 */
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const ROOT = path.resolve(__dirname, "..");
const FRAMES: Record<string, number[]> = {
  "s02-ledger": [2.2, 5.6, 8.6, 11.6],
  "s03-head": [3.2, 7.4, 11.2, 13.8],
  "s07-how": [3.6, 7.2, 10.2, 14.0],
  "s10-end": [1.4, 4.0, 9.0],
};
const { values } = parseArgs({ options: { only: { type: "string" } } });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, locale: "ja-JP" });
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
