/**
 * One live check of 「どこが違う？」 (D-057, narrowed: only when the remark is empty) in a browser, on 127.0.0.1.
 * Fictional data; costs a few cents (two live drafts, two to three readings).
 *   KOKOROE_LIVE=1 npx next dev --hostname 127.0.0.1 --port 3101     (with ANTHROPIC_API_KEY in .env.local)
 *   npx tsx scripts/check-diff-area.ts --base http://127.0.0.1:3101 --shots docs/screens
 * Card 1: △ with no remark → the readings come with the six area buttons (desktop and phone width; button sizes).
 * Card 2: △ with the remark 「違う」 → the readings come with a plain 「どれでもない」 only.
 * Then 「どれでもない（場所は選ばない）」 on card 1 must lead to the second readings, with no area buttons.
 */
import { parseArgs } from "node:util";
import { chromium, type Locator, type Page } from "playwright";

const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3101" }, shots: { type: "string", default: "docs/screens" } } });
const BASE = values.base!;
const panel = (p: Page) => p.locator('aside[aria-labelledby="bg-h"]');
/** The pending cards in the side panel, newest first (the 帳場 adds new ones at the top). */
const items = (p: Page) => panel(p).locator("li");

async function until(p: Page, what: string, ok: () => Promise<boolean>) {
  for (let k = 0; k < 60; k++) {
    if (await ok()) return;
    await p.waitForTimeout(3000);
    await p.reload();
  }
  throw new Error(`timed out: ${what}`);
}

async function judge(p: Page, remark: string) {
  await p.locator("#card-h").waitFor({ timeout: 90000 });
  const name = (await p.locator("#card-h").innerText()).split("\n")[0];
  await p.locator('label:has(input[value="△"])').click();
  if (remark) await p.locator('section[aria-labelledby="card-h"] input[name="remark"]').fill(remark);
  await p.locator('button:has-text("で記録する")').click();
  console.log(`△ ${remark ? `「${remark}」` : "（一言なし）"}: ${name}`);
}

const picks = (li: Locator) => li.locator('button[name="pick"]');

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ja-JP" });
  await p.goto(BASE + "/");
  await p.locator('form:has(input[value="demo"]) button').click();
  await p.waitForURL("**/choba");

  // Card 1, no remark.
  await judge(p, "");
  await until(p, "card 1 readings", async () => (await picks(items(p).first()).count()) > 0 || /今回は何も覚えていません|心得帳に書きました|解釈できませんでした/.test(await items(p).first().innerText().catch(() => "")));
  const first = items(p).first();
  console.log("card 1 area buttons:", (await first.locator('button[value^="none:"]').allInnerTexts()).join(" / ") || "none");
  await panel(p).screenshot({ path: `${values.shots}/diff-area-noremark-desktop.png` });

  // Card 2, remark 「違う」. It is added above card 1.
  await judge(p, "違う");
  let card2 = "";
  await until(p, "card 2 readings", async () => {
    if ((await items(p).count()) < 2) return false;
    const t = await items(p).first().innerText();
    if (/心得帳に書きました|今回は何も覚えていません|解釈できませんでした/.test(t)) return ((card2 = "no choice asked (the remark was read as clear)"), true);
    return (await picks(items(p).first()).count()) > 0;
  });
  const second = items(p).first();
  if (!card2) {
    const areaCount = await second.locator('button[value^="none:"]').count();
    const plain = await second.locator('button[name="pick"][value="none"]').innerText();
    card2 = `area buttons ${areaCount}; 「${plain.trim()}」`;
  }
  console.log("card 2 (remark 「違う」):", card2);
  await panel(p).screenshot({ path: `${values.shots}/diff-area-remark-desktop.png` });

  // Phone width: sizes of card 1's buttons.
  await p.setViewportSize({ width: 390, height: 844 });
  await p.reload();
  const c1 = items(p).nth(1);
  await c1.scrollIntoViewIfNeeded();
  const sizes = await picks(c1).evaluateAll((bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return `${(b as HTMLElement).innerText.slice(0, 10)} ${Math.round(r.width)}×${Math.round(r.height)}`; }));
  console.log("phone (390px), card 1 buttons:", sizes.join(" | "));
  await panel(p).screenshot({ path: `${values.shots}/diff-area-phone.png` });

  // Skip the area on card 1 → the second readings, which have no area buttons.
  await picks(c1).and(p.locator('[value="none"]')).click();
  await until(p, "card 1 second readings", async () => (await panel(p).innerText()).includes("別の読み方"));
  const again = panel(p).locator('li:has-text("別の読み方")');
  console.log("card 1 after skipping: second readings shown; area buttons:", await again.locator('button[value^="none:"]').count());
  await panel(p).screenshot({ path: `${values.shots}/diff-area-phone-second.png` });
  await browser.close();
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
