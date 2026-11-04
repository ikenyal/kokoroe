/**
 * One live run of the own-company comparison flow (D-060) on 127.0.0.1, with a throwaway own folder and ONE fictional stand-in
 * client — never real data. Costs a few cents (one draft, one reading).
 *   KOKOROE_OWN=1 KOKOROE_LIVE=1 KOKOROE_OWN_DIR=<empty folder outside the repo> npx next dev --hostname 127.0.0.1 --port 3101
 *   npx tsx scripts/check-own-compare.ts --base http://127.0.0.1:3101 --shots docs/screens
 * Checks: the card is held back (and not drafted) until prose is written; the situation, prose and judging are timed; the
 * summary page lists both sides for counting and shows a numbers-only preview. It takes screenshots into the repo, so it REFUSES
 * to run unless the own folder is empty (no ledger, no situations): never point it at a server using your real ~/.kokoroe.
 * Afterwards stop the server and delete the throwaway folder.
 */
import { parseArgs } from "node:util";
import { chromium, type Page } from "playwright";

const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3101" }, shots: { type: "string", default: "docs/screens" } } });
const BASE = values.base!;
const say = (s: string) => console.log(s);

async function settle(p: Page, ok: () => Promise<boolean>, what: string) {
  for (let k = 0; k < 60; k++) {
    if (await ok()) return;
    await p.waitForTimeout(3000);
    await p.reload();
  }
  throw new Error(`timed out: ${what}`);
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: "ja-JP" });

  // Refuse unless the own folder is empty: screenshots of real situations must never reach the repo.
  await p.goto(BASE + "/own");
  const existing = await p.locator('form:has(button:has-text("台帳を保存")) tbody input[name="name"]').evaluateAll((xs) => xs.filter((x) => (x as HTMLInputElement).value.trim()).length);
  if (existing > 0) throw new Error("the own folder already has a ledger: run this check only on an empty throwaway folder (KOKOROE_OWN_DIR)");
  // Ledger: one stand-in client, then start.
  const row = p.locator('form:has(button:has-text("台帳を保存")) tbody tr').first();
  await row.locator('input[name="name"]').fill("取引先A");
  await row.locator('input[name="industry"]').fill("物流");
  await row.locator('input[name="contact"]').fill("窓口の課長");
  await row.locator('input[name="decider"]').fill("先方の社長");
  await row.locator('input[name="years"]').fill("10");
  await p.locator('button:has-text("台帳を保存")').click();
  await p.waitForLoadState("networkidle");
  await p.locator('form button:has-text("始める"), form button:has-text("帳場")').last().click();
  await p.waitForURL("**/choba");
  say("own session started");

  // Start the comparison before writing any situation.
  await p.goto(BASE + "/choba/write");
  await p.locator('button:has-text("比較テストを始める")').click();
  await p.waitForURL("**/choba/write");
  say("comparison started");

  // Write one situation on the 帳場.
  await p.goto(BASE + "/choba");
  await p.locator('select[name="clientId"]').selectOption({ label: "取引先A" });
  await p.locator('input[name="month"]').fill("4");
  await p.waitForTimeout(1500); // the situation-writing timer is meant to see some time pass
  await p.locator('textarea[name="situation"]').fill("大口の取引先に、納品が2週間遅れると伝える。まだ確定ではない。");
  await p.locator('button:has-text("弟子に案を作らせる")').click();
  // The action redirects to the same URL: wait for the page to change, not for the URL.
  await p.locator('[role="status"]:has-text("比較テスト中"), #card-h').first().waitFor({ timeout: 90000 });
  const held = await p.locator('[role="status"]:has-text("比較テスト中")').count();
  const card = await p.locator("#card-h").count();
  say(`after writing the situation: held notice ${held ? "shown" : "MISSING"}; draft card ${card ? "SHOWN (wrong)" : "not shown"}`);
  await p.screenshot({ path: `${values.shots}/own-compare-held.png`, fullPage: true });

  // Prose first.
  await p.goto(BASE + "/choba/write");
  await p.waitForTimeout(1500);
  await p.locator('textarea[name="text"]').fill("決まる前に、窓口の課長へ電話で一報を入れる。正式な連絡は確定してから書面で。先方の社長には課長から伝えてもらう。");
  await p.locator('button:has-text("記録する")').click();
  await p.locator('text=書いていない場面はありません').waitFor({ timeout: 30000 });
  say("prose recorded");

  // Now the card is drafted; judge △ with a remark.
  await p.goto(BASE + "/choba");
  await p.locator("#card-h").waitFor({ timeout: 90000 });
  say("after the prose: the draft card is shown");
  await p.locator('label:has(input[value="△"])').click();
  await p.locator('section[aria-labelledby="card-h"] input[name="remark"]').fill("決まる前に課長へ電話");
  await p.locator('button:has-text("で記録する")').click();
  await p.locator('aside[aria-labelledby="bg-h"] li').first().waitFor({ timeout: 30000 });
  const panel = p.locator('aside[aria-labelledby="bg-h"]');
  await settle(p, async () => !/順番待ち|読み取って|書いています|解き直して/.test(await panel.innerText()) || (await panel.locator('button[name="pick"], input[name="why"]').count()) > 0, "reading");
  if (await panel.locator('button[name="pick"]').count()) await panel.locator('button[name="pick"]').first().click();
  await settle(p, async () => !/順番待ち|読み取って|書いています|解き直して/.test(await panel.innerText()) || (await panel.locator('input[name="why"]').count()) > 0, "after the choice");
  say(`side panel: ${(await panel.innerText()).replace(/\s+/g, " ").slice(0, 120)}`);

  // Summary: count, save, check the preview has numbers only.
  await p.goto(BASE + "/choba/report");
  await p.locator('input[name^="prose:"]').first().fill("3");
  const boxes = p.locator('input[type="checkbox"][name^="rule:"]');
  say(`counting list: ${await p.locator('input[name^="prose:"]').count()} prose text(s), ${await boxes.count()} learned 心得`);
  if (await boxes.count()) await boxes.first().check();
  await p.locator('button:has-text("数えた結果を残す")').click();
  await p.locator('details pre:has-text("etiquetteInProse")').waitFor({ timeout: 30000 });
  const preview = await p.locator("details pre").last().innerText();
  say(`preview has the situation/prose text: ${/大口|課長|電話|取引先A/.test(preview) ? "YES (wrong)" : "no"}`);
  say(`preview: ${preview.replace(/\s+/g, " ").slice(0, 400)}`);
  await p.screenshot({ path: `${values.shots}/own-compare-report.png`, fullPage: true });
  await browser.close();
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
