/**
 * One live run of 訪問の段取り (D-061) in own mode on 127.0.0.1, with a throwaway own folder and ONE fictional stand-in company
 * and client — never real data. Two visit scenes; the master corrects the visit plan (dress, then what to check first) and the
 * corrections become 心得. Costs well under a dollar (drafts, readings, 確かめ re-solves).
 *   KOKOROE_OWN=1 KOKOROE_LIVE=1 KOKOROE_OWN_DIR=<empty folder outside the repo> npx next dev --hostname 127.0.0.1 --port 3102
 *   npx tsx scripts/check-own-visit.ts --base http://127.0.0.1:3102 --shots docs/screens/ui-polish/14-visit
 * Refuses unless the own folder is empty. Afterwards stop the server and delete the throwaway folder.
 */
import { mkdirSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium, type Page } from "playwright";

const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3102" }, shots: { type: "string", default: "docs/screens/ui-polish/14-visit" } } });
const BASE = values.base!;
const SHOTS = values.shots!;
mkdirSync(SHOTS, { recursive: true });
const say = (s: string) => console.log(s);
const BUSY = /順番待ち|読み取っています|書いています|解き直して/;

async function scene(p: Page, type: string, month: string, situation: string) {
  await p.goto(BASE + "/choba");
  await p.locator('select[name="type"]').selectOption(type);
  await p.locator('input[name="month"]').fill(month);
  await p.locator('textarea[name="situation"]').fill(situation);
  await p.locator('button:has-text("弟子に案を作らせる")').click();
  await p.locator("#card-h").waitFor({ timeout: 120000 });
}

/** Judge the card, then answer the side panel until the 心得 is written (choice → why → 確かめ ○ → regression ○). */
async function correct(p: Page, n: number, remark: string, keyword: RegExp, why: string) {
  await p.locator('label:has(input[value="△"])').click();
  await p.locator('section[aria-labelledby="card-h"] input[name="remark"]').fill(remark);
  await p.locator('button:has-text("で記録する")').click();
  await p.waitForLoadState("networkidle");
  const panel = p.locator('aside[aria-labelledby="bg-h"]');
  const item = panel.locator("li").first();
  for (let k = 0; k < 80; k++) {
    await p.waitForTimeout(3000);
    await p.reload();
    const text = (await item.innerText().catch(() => "")).replace(/\s+/g, " ");
    if (BUSY.test(text.slice(0, 60))) continue;
    const picks = item.locator('button[name="pick"]');
    if (await picks.count()) {
      await p.screenshot({ path: `${SHOTS}/${n}-readings.png`, fullPage: true });
      const all = await picks.allInnerTexts();
      const i = all.findIndex((t) => keyword.test(t));
      say(`  readings: ${all.slice(0, 3).map((t) => t.slice(0, 40)).join(" | ")} → ${i >= 0 ? i : 0}`);
      await picks.nth(i >= 0 ? i : 0).click();
      continue;
    }
    if (await item.locator('input[name="why"]').count()) {
      await item.locator('input[name="why"]').fill(why);
      await item.locator('button:has-text("わけを残す")').click();
      continue;
    }
    if (await item.locator('button[name="verdict"]').count()) {
      await p.screenshot({ path: `${SHOTS}/${n}-check.png`, fullPage: true });
      say(`  check: ${text.slice(0, 160)}`);
      await item.locator('button[name="verdict"][value="○"]').click();
      continue;
    }
    if (/心得帳に書きました|何も覚えていません|取り下げ|差し戻し|解釈できません/.test(text)) {
      say(`  side panel: ${text.slice(0, 200)}`);
      return;
    }
  }
  throw new Error("timed out in the side panel");
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: "ja-JP", deviceScaleFactor: 2 });

  await p.goto(BASE + "/own");
  const existing = await p.locator('form:has(button:has-text("台帳を保存")) tbody input[name="name"]').evaluateAll((xs) => xs.filter((x) => (x as HTMLInputElement).value.trim()).length);
  if (existing > 0) throw new Error("the own folder already has a ledger: run this only on an empty throwaway folder (KOKOROE_OWN_DIR)");
  await p.locator('input[name="company"]').fill("試しの製作所（架空）");
  await p.locator('input[name="master"]').fill("師匠役");
  await p.locator('input[name="successor"]').fill("後任役");
  await p.locator('button:has-text("会社を保存")').click();
  await p.waitForLoadState("networkidle");
  const row = p.locator('form:has(button:has-text("台帳を保存")) tbody tr').first();
  await row.locator('input[name="name"]').fill("取引先A（架空）");
  await row.locator('input[name="industry"]').fill("金属加工");
  await row.locator('input[name="contact"]').fill("工場長");
  await row.locator('input[name="decider"]').fill("社長");
  await row.locator('input[name="years"]').fill("15");
  await p.locator('button:has-text("台帳を保存")').click();
  await p.waitForLoadState("networkidle");
  await p.locator('form button:has-text("始める"), form button:has-text("帳場")').last().click();
  await p.waitForURL("**/choba");
  say("own session started (fictional stand-in company and client)");

  await scene(p, "T5", "4", "取引先Aの工場長が交代し、新しい工場長が着任した。前任の紹介で、工場へあいさつに伺いたい。");
  await p.screenshot({ path: `${SHOTS}/1-card.png`, fullPage: true });
  say(`scene 1 drafted; 訪問 section ${(await p.locator('section[aria-label="訪問"]').count()) ? "shown" : "NOT shown (no visit in the plan)"}`);
  await correct(p, 1, "この先方はスーツを嫌う。作業着で行け", /スーツ|作業着|服/, "昔、スーツで工場に行って浮いた");

  await scene(p, "T4", "6", "取引先Aに、検査工程を省力化する装置の提案を持って、工場へ伺いたい。");
  await p.screenshot({ path: `${SHOTS}/2-card.png`, fullPage: true });
  say(`scene 2 drafted; 訪問 section ${(await p.locator('section[aria-label="訪問"]').count()) ? "shown" : "NOT shown"}; attire: ${(await p.locator('section[aria-label="訪問"] dd').first().innerText().catch(() => "-")).slice(0, 60)}`);
  await correct(p, 2, "行く前に、新ラインの立ち上げがどうなったか確かめておけ", /新ライン|立ち上げ|確かめ/, "工場長はまずその話をしたがる");

  await p.goto(BASE + "/kokoroe");
  await p.waitForLoadState("networkidle");
  await p.screenshot({ path: `${SHOTS}/3-kokoroe.png`, fullPage: true });
  say(`心得帳: ${(await p.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 400)}`);
  await browser.close();
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
