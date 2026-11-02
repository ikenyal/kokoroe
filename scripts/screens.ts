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
  },
});
const out = path.resolve(__dirname, "../docs/screens");
mkdirSync(out, { recursive: true });
const sizes = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };

(async () => {
  const browser = await chromium.launch();
  for (const scheme of ["light", "dark"] as const) {
    for (const [size, viewport] of Object.entries(sizes)) {
      const ctx = await browser.newContext({ viewport, colorScheme: scheme, locale: "ja-JP", deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.goto(values.base!);
      await page.locator(`form:has(input[value="${values.mode}"]) button`).click();
      await page.waitForURL("**/choba");
      for (const p of values.pages!.split(",")) {
        await page.goto(values.base + p);
        await page.waitForLoadState("networkidle");
        if (values.open) {
          for (const el of await page.locator(values.open).all()) await el.click().catch(() => {});
          await page.waitForTimeout(1500);
        }
        const name = p === "/" ? "home" : p.replace(/^\//, "").replace(/\//g, "-");
        await page.screenshot({ path: path.join(out, `${name}-${scheme}-${size}.png`), fullPage: true });
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`saved to ${out}`);
})();
