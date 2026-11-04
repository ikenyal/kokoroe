/**
 * One live check of 「どこが違う？」 (D-057) in a browser, on 127.0.0.1. Fictional data; costs a few cents (one live draft, two readings).
 *   KOKOROE_LIVE=1 npx next dev --hostname 127.0.0.1 --port 3101     (with ANTHROPIC_API_KEY in .env.local)
 *   npx tsx scripts/check-diff-area.ts --base http://127.0.0.1:3101 --shots docs/screens
 * Marks the first card △ with no remark, waits for the readings, screenshots them (desktop and phone width, with the size of the
 * area buttons), then taps 「どれでもない（場所は選ばない）」 and checks that the second readings come up.
 */
import { parseArgs } from "node:util";
import { chromium, type Page } from "playwright";

const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3101" }, shots: { type: "string", default: "docs/screens" } } });
const BASE = values.base!;
const panel = (p: Page) => p.locator('aside[aria-labelledby="bg-h"]');

async function waitForPicks(p: Page, round: 1 | 2) {
  for (let k = 0; k < 60; k++) {
    const text = await panel(p).innerText();
    if (/どの意味でしたか/.test(text) && (round === 1 ? !text.includes("別の読み方") : text.includes("別の読み方"))) return;
    if (/今回は何も覚えていません|心得帳に書きました|解釈できませんでした/.test(text)) throw new Error(`no choice was asked: ${text.slice(0, 300)}`);
    await p.waitForTimeout(3000);
    await p.reload();
  }
  throw new Error("timed out waiting for the readings");
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ja-JP" });
  await p.goto(BASE + "/");
  await p.locator('form:has(input[value="demo"]) button').click();
  await p.waitForURL("**/choba");
  await p.locator("#card-h").waitFor({ timeout: 90000 });
  console.log("card:", (await p.locator("#card-h").innerText()).split("\n")[0]);
  await p.locator('label:has(input[value="△"])').click();
  await p.locator('button:has-text("で記録する")').click();
  await waitForPicks(p, 1);

  const areas = panel(p).locator('button[value^="none:"]');
  console.log("area buttons:", (await areas.allInnerTexts()).join(" / "));
  await panel(p).screenshot({ path: `${values.shots}/diff-area-desktop.png` });

  await p.setViewportSize({ width: 390, height: 844 });
  await p.reload();
  await panel(p).scrollIntoViewIfNeeded();
  const sizes = await panel(p).locator('button[name="pick"]').evaluateAll((bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return `${(b as HTMLElement).innerText.slice(0, 12)} ${Math.round(r.width)}×${Math.round(r.height)}`; }));
  console.log("phone (390px) button sizes:", sizes.join(" | "));
  await panel(p).screenshot({ path: `${values.shots}/diff-area-phone.png` });

  await panel(p).locator('button[name="pick"][value="none"]').click();
  await waitForPicks(p, 2);
  console.log("skipped the area → second readings shown; area buttons now:", await panel(p).locator('button[value^="none:"]').count());
  await panel(p).screenshot({ path: `${values.shots}/diff-area-phone-second.png` });
  await panel(p).locator('button[name="pick"][value="none"]').click(); // end it: nothing is learned from this check
  await browser.close();
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
