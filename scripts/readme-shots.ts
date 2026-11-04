/**
 * The three pictures near the top of the README (Kento 11/5: a judge who only opens the repository should see the value):
 *   1. 帳場 「変化」 — the next draft changed by what the master corrected,
 *   2. 心得帳 — one 心得 with its 沿革 (when, the master's mark and words, why),
 *   3. 暖簾を継ぐ — the same question answered 心得帳なし／あり.
 * Recorded demo data only (no API calls). Server on 127.0.0.1 (started and stopped by the caller), with the video's お試し queue
 * so the 帳場 picture is the same 丸新酒造 story (T05 △ → T13):
 *   KOKOROE_LIVE=0 KOKOROE_VIDEO_QUEUE=T05,T13 npx next dev --hostname 127.0.0.1 --port 3101
 *   npx tsx scripts/readme-shots.ts --base http://127.0.0.1:3101
 * → docs/readme/<name>.png (then converted to .webp by the caller to keep the repository light).
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Locator, type Page } from "playwright";

const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3101" } } });
const OUT = path.resolve(__dirname, "..", "docs/readme");
mkdirSync(OUT, { recursive: true });

async function shot(page: Page, l: Locator, name: string, bottom = 20) {
  await l.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  // A margin of paper around the part, so it does not look cut out.
  const b = (await l.first().boundingBox())!;
  const m = 20;
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true,
    clip: { x: Math.max(0, b.x - m), y: Math.max(0, b.y + (await page.evaluate(() => window.scrollY)) - m), width: b.width + 2 * m, height: b.height + m + bottom } });
  console.log(`docs/readme/${name}.png`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, colorScheme: "light", locale: "ja-JP", deviceScaleFactor: 2 });
  // The demo guide is a signpost for visitors; it is not part of these pictures.
  await ctx.addInitScript(() => localStorage.setItem("kokoroe-demo-guide-closed", "1"));
  const page = await ctx.newPage();
  await page.goto(values.base!);
  await page.locator('form:has(input[value="trial"]) button').click();
  await page.waitForURL("**/choba");
  await page.waitForLoadState("networkidle");
  // T05 (丸新酒造): △ with no remark, as in the recorded run; T13's draft then shows 「変化」.
  await page.locator('label:has(input[value="△"])').first().click();
  await page.locator('button:has-text("で記録する")').first().click();
  await page.waitForLoadState("networkidle");
  // 「変化」 is shown on the draft where a learned 心得 first takes effect.
  const change = page.locator('section[aria-label="変化"]');
  // 丸新酒造: the story of the README and the video (the quiet word to the 蔵元).
  await change.filter({ hasText: "蔵元" }).first().waitFor({ timeout: 15000 }).catch(() => page.screenshot({ path: path.join(OUT, "debug.png"), fullPage: true }));
  if (!(await change.filter({ hasText: "蔵元" }).count())) throw new Error("no 丸新酒造 「変化」 in the demo queue");
  await shot(page, change, "1-choba-change", 2); // the next part of the card starts right below

  // The 心得帳 and 暖簾を継ぐ pictures come from デモの続き (the recorded 20 judgments): start it in the same browser.
  await page.goto(values.base!);
  await page.locator('form:has(input[value="demo"]) button').click();
  await page.waitForURL("**/choba");
  await page.goto(values.base + "/kokoroe");
  await page.waitForLoadState("networkidle");
  // A 心得 the master gave by correcting, whose 沿革 keeps the master's words and why (わけ).
  // Its client's whole section, so the picture starts at the client's name.
  await shot(page, page.locator('section[id]:has(li:has(ol[aria-label="沿革"] .text-shu svg))').filter({ hasText: "わけ" }), "2-kokoroe-history");

  await page.goto(values.base + "/noren");
  await page.waitForLoadState("networkidle");
  // The answer appears once a question is asked: the first example (the page lists the clearest differences first).
  await page.locator('button[name="preset"]').first().click();
  await page.waitForLoadState("networkidle");
  await shot(page, page.locator('article:has(section[aria-label="心得帳なしの答え"])'), "3-noren-with-without");
  await browser.close();
})();
