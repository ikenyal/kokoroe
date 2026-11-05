/**
 * The submission form's overview (item 5) must be at most 500 characters (Kento 11/6, the form's instruction). The draft keeps
 * number slots 〔…〕 until the official run on 11/7; this fills them with the current values from data/demo/results.json, then
 * counts the characters as the form would see them (line breaks not counted). It also checks the first sentence's shape.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.join(__dirname, "..");
const draft = readFileSync(path.join(ROOT, "docs/submission-draft.md"), "utf8");
const results = JSON.parse(readFileSync(path.join(ROOT, "data/demo/results.json"), "utf8"));
const pct = (x: number) => `${Math.round(x * 100)}%`;
const SLOTS: Record<string, string> = {
  "〔paths.taps.mean〕": String(Math.round(results.paths.taps.mean)),
  "〔before.match〕": pct(results.before.match),
  "〔paths.mean〕": pct(results.paths.mean),
  "〔history[0].mean〕": String(+results.history[0].mean.toFixed(1)),
  "〔history[1].mean〕": String(+results.history[1].mean.toFixed(1)),
};

function overviewText(md: string) {
  const m = md.match(/<!-- overview:start -->\n([\s\S]*?)\n<!-- overview:end -->/);
  if (!m) throw new Error("overview markers not found");
  let text = m[1];
  for (const [slot, value] of Object.entries(SLOTS)) text = text.split(slot).join(value);
  return text.replace(/\n+/g, "");
}

describe("submission draft: overview (form item 5)", () => {
  const text = overviewText(draft);

  it("fills every number slot from results.json", () => {
    expect(text).not.toMatch(/〔[^〕]*〕/);
  });

  it("is at most 500 characters (line breaks not counted)", () => {
    expect([...text].length).toBeLessThanOrEqual(500);
  });

  it("opens with 「このプロジェクトは、…です。」 in one sentence, and labels its numbers as fictional", () => {
    expect(text).toMatch(/^このプロジェクトは、[^。]+です。/);
    expect(text).toContain("架空のデータ");
  });
});
