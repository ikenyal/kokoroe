/**
 * 体験の目 (Kento 11/5): what a judge feels on the public build. Starts the production image (.image, built by
 * scripts/prepare-image.sh) on 127.0.0.1 only, live, with a hard spend cap for this run (KOKOROE_DAILY_USD, default $0.5, in a
 * throwaway data dir), presses 「師匠になって試す」 and marks a few cards from the start. It times, for each step, how long
 * until the next card's draft is on screen, samples what the screen shows while waiting, and follows the side panel after a △.
 * The key comes from .env.local and goes to the server process only; it is never printed. The server is always stopped.
 *   npx tsx scripts/experience-run.ts [--cards 4] [--cap 0.5] [--read 10]
 * --choose: after the △, pick the first reading, leave a わけ, and time each step until 確かめ asks the master (11/5).
 * --read: seconds the master spends reading each card before marking it (11/5 before 先読み: 0; the 師匠役テスト median was 53.5 s).
 * → prints a timing table and writes docs/results/experience-<date>.json (numbers and on-screen words only; fictional data).
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Page } from "playwright";

const { values } = parseArgs({ options: { cards: { type: "string", default: "4" }, read: { type: "string", default: "0" }, choose: { type: "boolean", default: false }, cap: { type: "string", default: "0.5" }, port: { type: "string", default: "3124" } } });
const ROOT = path.resolve(__dirname, "..");
const BASE = `http://127.0.0.1:${values.port}`;

function keyFromEnvLocal(): string {
  const line = readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n").find((l) => l.startsWith("ANTHROPIC_API_KEY="));
  const key = line?.slice("ANTHROPIC_API_KEY=".length).trim();
  if (!key) throw new Error("needs ANTHROPIC_API_KEY in .env.local");
  return key;
}

/** What the screen says while we wait: the first words of the main area, sampled every 250 ms (changes only). */
async function waitFor(page: Page, done: () => Promise<boolean>, limitMs: number) {
  const t0 = Date.now();
  const seen: { at: number; text: string }[] = [];
  while (Date.now() - t0 < limitMs) {
    const text = ((await page.locator("main").first().innerText().catch(() => "")) || (await page.locator("body").innerText().catch(() => ""))).replace(/\s+/g, " ").slice(0, 70);
    if (seen.at(-1)?.text !== text) seen.push({ at: Date.now() - t0, text });
    if (await done().catch(() => false)) return { ms: Date.now() - t0, seen };
    await page.waitForTimeout(250);
  }
  return { ms: -1, seen };
}

const cardShown = (page: Page) => async () => (await page.locator('section[aria-label="段取り"]').count()) > 0 && (await page.locator('label:has(input[value="○"])').count()) > 0;

(async () => {
  mkdirSync(path.join(ROOT, "docs/screens/ui-polish/27-experience"), { recursive: true });
  const dataDir = mkdtempSync(path.join(tmpdir(), "kokoroe-exp-"));
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: values.port,
    KOKOROE_DATA_DIR: dataDir, KOKOROE_LIVE: "1", KOKOROE_DAILY_USD: values.cap, ...(process.env.KOKOROE_PREFETCH_DEBUG ? { KOKOROE_PREFETCH_DEBUG: "1" } : {}), ANTHROPIC_API_KEY: keyFromEnvLocal(),
  };
  const server = spawn("node", ["server.js"], { cwd: path.join(ROOT, ".image"), env, stdio: ["ignore", "ignore", "inherit"] });
  const steps: { step: string; ms: number; seen: { at: number; text: string }[] }[] = [];
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + "/")).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }
    const browser = await chromium.launch();
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "ja-JP" })).newPage();
    await page.goto(BASE);
    await page.locator('form:has(input[value="trial"]) button').click();
    steps.push({ step: "師匠になって試す → 最初の案", ...(await waitFor(page, cardShown(page), 90000)) });
    const marks = ["△", "○", "○", "○", "○", "○"].slice(0, Number(values.cards));
    for (const [n, m] of marks.entries()) {
      const client = (await page.locator("#card-h").innerText().catch(() => "?")).replace(/\s+/g, "");
      await page.waitForTimeout(Number(values.read) * 1000);
      await page.locator(`label:has(input[value="${m}"])`).first().click();
      if (m !== "○") await page.locator('textarea, input[name="remark"]').first().fill("先に電話で一言");
      await page.locator('button:has-text("で記録する")').first().click();
      if (n === marks.length - 1) page.waitForTimeout(1500).then(() => page.screenshot({ path: path.join(ROOT, "docs/screens/ui-polish/27-experience/waiting.png") })).catch(() => {});
      // The next card: same layout, different scene. Wait until the status line names what was recorded and a card is shown.
      steps.push({ step: `${n + 1}枚目（${client}）に ${m} → 次の案`, ...(await waitFor(page, async () => (await cardShown(page)()) && (await page.locator("#card-h").innerText().catch(() => "")).replace(/\s+/g, "") !== client, 90000)) });
      if (m !== "○") {
        // The side panel after a △: how long until the apprentice's reading asks the master something (or finishes).
        steps.push({ step: "△ のあと、右の欄に弟子の読み取りが出るまで", ...(await waitFor(page, async () => /どの意味でしたか|心得帳に書きました|何も覚えていません|解釈できませんでした|上限/.test(await page.locator("aside, [aria-label='弟子の読み取り']").first().innerText().catch(() => "")), 120000)) });
        if (values.choose) {
          const aside = () => page.locator("aside").first().innerText().catch(() => "");
          if (await page.locator('aside button[name="pick"][value="0"]').count()) {
            await page.waitForTimeout(Number(values.read) * 1000); // reading the candidates
            await page.locator('aside button[name="pick"][value="0"]').click();
            steps.push({ step: "読み方を選ぶ → 心得帳に書くまで", ...(await waitFor(page, async () => /わけを一言|確かめ|解き直して|心得帳に書きました/.test(await aside()), 120000)) });
          }
          if (await page.locator('aside input[name="why"]').count()) {
            await page.locator('aside input[name="why"]').fill("以前、先方と行き違いがあった");
            await page.locator('aside button:has-text("わけを残す")').click();
            steps.push({ step: "わけを残す → 確かめ（直した場面を新しい心得で解き直す）が出るまで", ...(await waitFor(page, async () => /確かめ：|回帰の確認|取り下げ|差し戻し|確かめました/.test(await aside()), 120000)) });
          }
        }
      }
    }
    await browser.close();
  } finally {
    server.kill("SIGTERM");
    let usd = NaN;
    try { usd = JSON.parse(readFileSync(path.join(dataDir, "limits.json"), "utf8")).usd; } catch {}
    rmSync(dataDir, { recursive: true, force: true });
    for (const s of steps) {
      console.log(`${(s.ms / 1000).toFixed(1).padStart(6)} s  ${s.step}`);
      for (const x of s.seen) console.log(`         ${(x.at / 1000).toFixed(1)} s: ${x.text}`);
    }
    console.log(`spend (server's estimate) ≈ $${usd.toFixed(3)} | server stopped`);
    const out = path.join(ROOT, "docs/results", `experience-${new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 16).replace(":", "")}.json`);
    writeFileSync(out, JSON.stringify({ note: "体験の目: production build on 127.0.0.1, live, fictional data. ms = time until the next state is on screen (-1 = not within the limit).", readSeconds: Number(values.read), usd, steps }, null, 2) + "\n");
    console.log(path.relative(ROOT, out));
  }
})();
