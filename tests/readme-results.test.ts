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

describe("official results path (from the eval:final smoke summary)", () => {
  it("maps a final summary to results and renders both README blocks without interim labels", async () => {
    const { fromFinal } = await import("@/eval/build-results");
    const smoke = (await import("./fixtures/final-smoke.json")).default;
    const r = { ...fromFinal(smoke as never, "x-final.json"), curves: [] } as Results;
    expect(r.official).toBe(true);
    expect(r.before.runs).toBe(smoke.before.runs.length);
    expect(r.paths.n).toBe(smoke.after.paths.length);
    expect(r.history.at(-1)!.mean).toBe(smoke.history.grown.mean);
    for (const lang of ["en", "ja"] as const) {
      const block = renderReadmeBlock(r, lang);
      expect(block).not.toMatch(/interim|途中経過|NaN|undefined/);
    }
  });
});

/**
 * The 稽古の記録 note is generated (eval/build-results.ts) and worded for the Japanese screen. Recomputing from the recorded runs
 * reproduces data/demo/results.json exactly — so the numbers come only from the runs, and a wording change cannot move them.
 * This stays true after the official run: `npm run eval:final` regenerates the file from its summary.
 */
describe("稽古の記録: the note's wording, and numbers that only come from the runs", () => {
  it("recomputing from eval/runs gives the committed results.json, numbers included", async () => {
    const { computeResults } = await import("@/eval/build-results");
    expect(JSON.parse(JSON.stringify(computeResults()))).toEqual(results);
  });
  it("the note reads as the screen does: はじめ／40場面のあと, no English labels, no decision ids, no promised date", async () => {
    const { INTERIM_NOTE, officialNote, fromFinal } = await import("@/eval/build-results");
    const smoke = (await import("./fixtures/final-smoke.json")).default;
    const official = fromFinal(smoke as never, "x-final.json");
    expect(official.note).toBe(officialNote(smoke.at.slice(0, 10), smoke.after.paths.length));
    expect((results as { note: string }).note).toBe(results.official ? officialNote((results.note.match(/\d{4}-\d{2}-\d{2}/) ?? [""])[0], results.paths.n) : INTERIM_NOTE);
    for (const n of [INTERIM_NOTE, official.note]) {
      expect(n).toContain("はじめ");
      expect(n).toContain("40場面のあと");
      expect(n).toContain("架空");
      expect(n).not.toMatch(/Before|After|D-\d{3}|11\/7/);
    }
  });
});
