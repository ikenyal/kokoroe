/**
 * Screenshots of the UI for review: light/dark × desktop/mobile → docs/screens/<name>-<scheme>-<size>.png
 *   (dev server running)  npx tsx scripts/screens.ts --base http://localhost:3000 --pages /,/kokoroe --mode demo
 * Starts a session through the real start form (no API calls).
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3000" },
    pages: { type: "string", default: "/,/kokoroe" },
    mode: { type: "string", default: "demo" },
    open: { type: "string" }, // css selector to click before the shot (e.g. "details summary")
    out: { type: "string", default: "docs/screens" }, // e.g. docs/screens/ui-polish/before
    sizes: { type: "string", default: "desktop,mobile" },
    schemes: { type: "string", default: "light,dark" },
    judge: { type: "string" }, // e.g. "△": mark the first 帳場 card and also shoot choba-judged (recorded data, no API)
  },
});
const out = path.resolve(__dirname, "..", values.out!);
mkdirSync(out, { recursive: true });
const sizes = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };

(async () => {
  const browser = await chromium.launch();
  for (const scheme of values.schemes!.split(",") as ("light" | "dark")[]) {
    for (const [size, viewport] of Object.entries(sizes).filter(([k]) => values.sizes!.split(",").includes(k))) {
      const ctx = await browser.newContext({ viewport, colorScheme: scheme, locale: "ja-JP", deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.goto(values.base!);
      await page.waitForLoadState("networkidle");
      if (values.pages!.split(",").includes("/")) await page.screenshot({ path: path.join(out, `home-${scheme}-${size}.png`), fullPage: true });
      await page.locator(`form:has(input[value="${values.mode}"]) button`).click();
      await page.waitForURL("**/choba");
      for (const p of values.pages!.split(",").filter((x) => x !== "/")) {
        await page.goto(values.base + p);
        await page.waitForLoadState("networkidle");
        if (values.open) {
          for (const el of await page.locator(values.open).all()) await el.click().catch(() => {});
          await page.waitForTimeout(1500);
        }
        const name = p === "/" ? "home" : p.replace(/^\//, "").replace(/\//g, "-");
        await page.screenshot({ path: path.join(out, `${name}-${scheme}-${size}.png`), fullPage: true });
        if (p === "/choba" && values.judge) {
          await page.locator(`label:has(input[value="${values.judge}"])`).click();
          await page.waitForTimeout(400); // let the stamp settle
          await page.screenshot({ path: path.join(out, `choba-marked-${scheme}-${size}.png`), fullPage: false });
          await page.locator('button:has-text("で記録する")').click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(800);
          await page.screenshot({ path: path.join(out, `choba-judged-${scheme}-${size}.png`), fullPage: true });
        }
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`saved to ${out}`);
})();
