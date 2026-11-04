/**
 * D-060: the own-company comparison result is the only thing from own mode that enters the repository. Times and counts only.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { KokoroeRule } from "@/src/learning/types";
import { assertNoText, buildOwnResult, heldForProse, OWN_RESULT_NOTE, stringLeaves } from "@/src/server/own-result";
import { OWN_SID, type SessionMeta } from "@/src/server/session";

const scene = (id: string, situation: string) => ({ scene: { id, set: "train" as const, clientId: "C01", type: "T1" as const, month: 4, situation }, draft: {} as never, live: true });
const rule = (id: string, text: string, kind: "judgment" | "ledger", status: KokoroeRule["status"] = "active"): KokoroeRule => ({
  id, scope: { clientId: "C01", sceneTypes: null }, text, when: "SECRET-WHEN 条件", status, confidence: "medium",
  sources: [kind === "ledger" ? { kind: "ledger", date: "2026-11-05" } : { kind: "judgment", judgmentId: "J-0001", date: "2026-11-05", sceneId: "S-0001", verdict: "△", remark: "SECRET-REMARK 取引先A" }] as never,
  history: [{ date: "2026-11-05", before: null, after: text, trigger: "SECRET-WHY", judgmentId: "J-0001", masterWords: "SECRET-WORDS", reason: "x" }] as never,
});

const meta: SessionMeta = {
  mode: "own",
  createdAt: "2026-11-04T23:30:00.000Z", // 11/5 08:30 JST
  compare: { startedAt: "2026-11-04T23:40:00.000Z", fromIndex: 0 },
  queue: [scene("S-0001", "SECRET-SITUATION 取引先Aに納期の遅れ"), scene("S-0002", "SECRET-SITUATION 2"), scene("S-0003", "SECRET-SITUATION 3")],
  pos: 2,
  pending: [{ judgmentId: "J-0001", sceneId: "S-0001", status: "applied", note: "SECRET-NOTE" }],
  timings: [
    { kind: "scene", sceneId: "S-0001", ms: 60_000, chars: 20 },
    { kind: "scene", sceneId: "S-0002", ms: 40_000, chars: 10 },
    { kind: "write", sceneId: "S-0001", ms: 180_000, chars: 120 },
    { kind: "judge", sceneId: "S-0001", ms: 30_000, verdict: "△" },
    { kind: "judge", sceneId: "S-0002", ms: 50_000, verdict: "○" },
    { kind: "remark", sceneId: "S-0001", ms: 4_000, chars: 8 },
  ],
  writes: [
    { sceneId: "S-0001", text: "SECRET-PROSE 窓口の課長に先に電話で", ms: 180_000 },
    { sceneId: "S-0002", text: "SECRET-PROSE 2", ms: 120_000 },
  ],
  counts: { prose: { "S-0001": 3, "S-0002": 1 }, rules: { "K-011": true, "K-012": false } },
  answers: [{ at: "x", clientId: "C01", question: "SECRET-QUESTION", answer: "yes", explanation: "SECRET-ANSWER", citations: [], source: "live" }],
};
const rules = [rule("K-001", "SECRET-LEDGER-RULE", "ledger"), rule("K-011", "SECRET-RULE 先に電話", "judgment"), rule("K-012", "SECRET-RULE 2", "judgment"), rule("K-013", "SECRET-RETIRED", "judgment", "retired")];

describe("own-company comparison result (D-060)", () => {
  const r = buildOwnResult(meta, rules);

  it("carries no text from the own folder: no situation, prose, remark, rule, answer or client name", () => {
    const json = JSON.stringify(r);
    expect(json).not.toMatch(/SECRET|取引先A|窓口|課長|電話|納期/);
    expect(stringLeaves(r).every((x) => x === OWN_RESULT_NOTE || /^\d{4}-\d{2}-\d{2}$/.test(x))).toBe(true);
    expect(() => assertNoText(r)).not.toThrow();
  });

  it("refuses to save if a string or an unknown key ever gets in", () => {
    const leaked = { ...r, prose: { ...r.prose, sample: "SECRET-PROSE" } } as unknown as typeof r;
    expect(() => assertNoText(leaked)).toThrow(/refusing to save/);
    const keyed = { ...r, timings: { ...r.timings, "取引先A": { n: 1 } } } as unknown as typeof r;
    expect(() => assertNoText(keyed)).toThrow(/unexpected key/);
  });

  it("holds back (no draft, no judging) only situations added after the start that have no prose yet", () => {
    const m = { ...meta, compare: { startedAt: "x", fromIndex: 1 }, writes: [{ sceneId: "S-0002", text: "t", ms: 1 }] };
    expect(heldForProse(m, 0)).toBe(false); // added before the comparison started
    expect(heldForProse(m, 1)).toBe(false); // prose written
    expect(heldForProse(m, 2)).toBe(true); // no prose yet
    expect(heldForProse({ ...m, compare: undefined }, 2)).toBe(false); // not in a comparison
    expect(heldForProse({ ...m, mode: "field" }, 2)).toBe(false);
  });

  it("keeps writing a situation apart from judging, and counts by the master's own marks", () => {
    expect(r.date).toBe("2026-11-05"); // the JST day the comparison started
    expect(r.timings.scene).toEqual({ n: 2, medianMs: 50_000, totalMs: 100_000 });
    expect(r.timings.judge).toEqual({ n: 2, medianMs: 40_000, totalMs: 80_000 });
    expect(r.timings.write).toMatchObject({ n: 1, medianMs: 180_000 });
    expect(r.prose).toEqual({ n: 2, medianMs: 150_000, medianChars: (r.prose.medianChars as number) });
    expect(typeof r.prose.medianChars).toBe("number");
    expect(r).toMatchObject({ situations: 3, judged: 2, corrections: 1, rulesLearned: 2 }); // ledger and retired rules are not "learned"
    expect(r.counted).toEqual({ etiquetteInProse: 4, proseTextsCounted: 2, etiquetteFromJudging: 1, rulesCounted: 2 });
  });

  it("before counting, `counted` is null rather than zero", () => {
    expect(buildOwnResult({ ...meta, counts: undefined }, rules).counted).toBeNull();
  });

  it("own:save reads the one lasting own session", () => {
    const src = readFileSync(path.join(__dirname, "..", "scripts", "own-save.ts"), "utf8");
    expect(src).toContain(`own-${OWN_SID}`);
    expect(src).toContain("assertNoText(result)");
  });
});
