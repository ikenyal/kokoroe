import { describe, expect, it } from "vitest";
import { breakdown, rates } from "@/eval/metrics";
import { remarkFor, rng } from "@/eval/simulator/remark";
import { CLIENTS, EVAL_SCENES, HISTORY_QUESTIONS } from "@/src/core/world";
import { HISTORY_ANSWERS } from "@/eval/simulator/hidden";

describe("metrics", () => {
  it("computes ○ rate and ○+△ rate", () => {
    const r = rates([{ verdict: "○" }, { verdict: "△" }, { verdict: "×" }, { verdict: "○" }]);
    expect(r).toMatchObject({ n: 4, ok: 2, partial: 1, ng: 1, matchRate: 0.5, okOrPartialRate: 0.75 });
  });
  it("breaks down by key", () => {
    const b = breakdown(
      [
        { sceneId: "a", clientId: "C01", type: "T1", verdict: "○" },
        { sceneId: "b", clientId: "C01", type: "T2", verdict: "×" },
      ],
      "clientId",
    );
    expect(b.C01.matchRate).toBe(0.5);
  });
});

describe("master remarks", () => {
  const checks = [{ ruleId: "R13", outcome: "violation" as const, why: "" }];
  it("are deterministic for a seed", () => {
    const a = Array.from({ length: 10 }, ((r) => () => remarkFor("×", checks, r))(rng(1)));
    const b = Array.from({ length: 10 }, ((r) => () => remarkFor("×", checks, r))(rng(1)));
    expect(a).toEqual(b);
  });
  it("say nothing on ○ and sometimes stay silent on ×", () => {
    const r = rng(3);
    expect(remarkFor("○", [], r)).toBe("");
    const said = Array.from({ length: 200 }, () => remarkFor("×", checks, r));
    expect(said.some((s) => s === "")).toBe(true);
    expect(said.some((s) => s.length > 0)).toBe(true);
  });
});

describe("eval set design", () => {
  it("has 20 scenes covering all 10 clients and all 10 scene types", () => {
    expect(EVAL_SCENES).toHaveLength(20);
    expect(new Set(EVAL_SCENES.map((s) => s.clientId)).size).toBe(10);
    expect(new Set(EVAL_SCENES.map((s) => s.type)).size).toBe(10);
    for (const s of EVAL_SCENES) expect(CLIENTS.map((c) => c.id)).toContain(s.clientId);
  });
  it("has 8 history questions, each with a hidden answer", () => {
    expect(HISTORY_QUESTIONS).toHaveLength(8);
    for (const q of HISTORY_QUESTIONS) expect(HISTORY_ANSWERS[q.id], q.id).toBeDefined();
  });
});
