import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import results from "@/data/demo/results.json";
import { BEGIN, END, renderReadmeBlock, type Results } from "@/eval/readme-results";
import { estimate, preflight } from "@/eval/final";

/** Numbers in the READMEs are generated from data/demo/results.json — never copied by hand. */
describe("README results block", () => {
  it.each([
    ["README.md", "en"],
    ["README.ja.md", "ja"],
  ] as const)("%s matches data/demo/results.json (run `npm run demo:results`)", (file, lang) => {
    const readme = readFileSync(path.resolve(__dirname, "..", file), "utf8");
    const block = readme.slice(readme.indexOf(BEGIN) + BEGIN.length, readme.indexOf(END)).trim();
    expect(block).toBe(renderReadmeBlock(results as unknown as Results, lang));
  });
});

describe("eval:final preflight and estimate (no API)", () => {
  it("passes on the frozen hidden data and the corrected ledger", () => {
    const f = preflight({ allowDirty: true, needKey: false });
    expect(f.hiddenFrozen).toBe(true);
    expect(f.commit).toMatch(/^[0-9a-f]{40}$/);
  });
  it("estimates every part from measured unit costs", () => {
    const e = estimate();
    expect(e.lines).toHaveLength(4);
    expect(e.usd).toBeGreaterThan(0);
    expect(e.high).toBeGreaterThanOrEqual(e.usd);
  });
});
