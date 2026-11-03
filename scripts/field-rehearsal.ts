/**
 * Rehearse the 11/6 field test end to end in a browser, live (Claude drafts and interprets), so the real run has no surprises.
 *   npx tsx scripts/field-rehearsal.ts --base http://127.0.0.1:3100 --shots docs/screens
 * The server must run with KOKOROE_FIELD=1 KOKOROE_LIVE=1 (see docs/field-test.md). Fictional data only.
 * Plays a quick master: ○ on most cards, △/× with a one-liner on three, taps the reading that matches, answers or skips "why?",
 * confirms the re-solved scene; then writes the 5 prose answers (short) and opens the report. Prints wall-clock per stage.
 */
import { parseArgs } from "node:util";
import { chromium, type Page } from "playwright";

const { values } = parseArgs({ options: { base: { type: "string", default: "http://127.0.0.1:3100" }, shots: { type: "string" } } });
const BASE = values.base!;
/** Which cards get a correction (by position in the field queue) — the rest get ○. */
const CORRECT: Record<number, { v: "△" | "×"; remark: string; prefer: string }> = {
  0: { v: "△", remark: "裏で蔵元に一言", prefer: "蔵元" },
  7: { v: "×", remark: "決まる前に配車課長へ", prefer: "配車" },
  12: { v: "△", remark: "見積りは会って説明", prefer: "会" },
};

/** Handle whatever the side panel asks for right now. Returns true if it clicked something. */
async function tendPanel(p: Page): Promise<boolean> {
  const aside = p.locator('aside[aria-labelledby="bg-h"]');
  const pick = aside.locator('button[name="pick"]');
  if (await pick.count()) {
    const texts = await pick.allInnerTexts();
    const want = Object.values(CORRECT).map((c) => c.prefer);
    const i = texts.findIndex((t) => want.some((w) => t.includes(w)));
    await pick.nth(i >= 0 ? i : 0).click();
    return true;
  }
  const why = aside.locator('textarea[name="why"], input[name="why"]');
  if (await why.count()) {
    await why.first().fill("先代のときに叱られたので");
    await aside.locator('button:has-text("わけを残す")').first().click();
    return true;
  }
  const ok = aside.locator('button[aria-label="○"]');
  if (await ok.count()) {
    await ok.first().click();
    return true;
  }
  return false;
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ja-JP" });
  const t0 = Date.now();
  const lap = (label: string) => console.log(`${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s  ${label}`);
  await p.goto(BASE + "/");
  await p.locator('form:has(input[value="field"]) button').click();
  await p.waitForURL("**/choba");
  lap("field session started");

  for (let i = 0; ; i++) {
    // The 帳場 drafts the card live while the page loads: wait for the card, or the end of the queue.
    await p.locator('#card-h, h1:has-text("今日の稽古はここまで")').first().waitFor({ timeout: 90000 });
    const heading = p.locator("#card-h");
    if (!(await heading.count())) break;
    const name = (await heading.innerText()).split("\n")[0];
    const c = CORRECT[i];
    await p.locator(`label:has(input[value="${c?.v ?? "○"}"])`).click();
    if (c) await p.locator('section[aria-labelledby="card-h"] input[name="remark"]').fill(c.remark);
    await p.locator('button:has-text("で記録する")').click();
    const prev = await heading.innerText();
    await p.waitForFunction((t) => { const h = document.querySelector("#card-h"); return h ? h.textContent !== t : !!document.body.textContent?.includes("今日の稽古はここまで"); }, prev, { timeout: 90000 });
    lap(`card ${i + 1}: ${name} ${c?.v ?? "○"}${c ? `「${c.remark}」` : ""}`);
    while (await tendPanel(p)) {
      lap("  side panel: answered");
      await p.waitForTimeout(800);
    }
  }
  // Let the background work finish: keep answering the panel until nothing is pending.
  for (let k = 0; k < 90; k++) {
    if (await tendPanel(p)) lap("  side panel: answered");
    const busy = await p.locator('aside[aria-labelledby="bg-h"]').innerText();
    if (!/順番待ち|読み取って|書いています|解き直して/.test(busy) && !(await p.locator('aside[aria-labelledby="bg-h"] button').count())) break;
    await p.waitForTimeout(2000);
    await p.reload();
  }
  lap("all cards judged; background done");
  if (values.shots) await p.screenshot({ path: `${values.shots}/field-rehearsal-choba.png`, fullPage: true });

  await p.goto(BASE + "/choba/write");
  for (let k = 0; k < 5; k++) {
    const box = p.locator('textarea[name="text"]');
    if (!(await box.count())) break;
    await box.fill("（リハーサル）先に決裁の方へ一言入れてから、窓口に正式に送る。");
    await p.locator('button:has-text("記録する")').click();
    await p.waitForTimeout(800);
    lap(`prose ${k + 1} written`);
  }
  await p.goto(BASE + "/choba/report");
  if (values.shots) await p.screenshot({ path: `${values.shots}/field-rehearsal-report.png`, fullPage: true });
  console.log((await p.locator("main").innerText()).slice(0, 1200));
  lap("report opened");
  await browser.close();
})();
