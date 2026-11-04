/**
 * 「直したら、次が変わる」 on the 帳場 (display only): the first draft where a learned 心得 takes effect, decided with the same
 * check as 確かめ稽古 (ruleTook), on the recorded data (fictional).
 */
import { describe, expect, it } from "vitest";
import demo from "@/data/demo/demo-snapshot.json";
import trial from "@/data/demo/trial-snapshot.json";
import { draftsThatUsed, recordedRun, ruleEffect } from "@/app/dandori";
import type { Proposal } from "@/src/core/types";
import type { JudgmentRecord, KokoroeRule } from "@/src/learning/types";

const rules = demo.store.rules as unknown as KokoroeRule[];
const judgments = demo.store.judgments as unknown as JudgmentRecord[];
const card = (id: string) => (trial.queue as unknown as { scene: { id: string; clientId: string; type: never }; draft: Proposal }[]).find((q) => q.scene.id === id)!;

describe("ruleEffect", () => {
  it("丸新酒造 T13: the quiet word to the 蔵元, learned from the △ on T05", () => {
    const t13 = card("T13");
    const e = ruleEffect(rules, judgments, t13.scene, t13.draft)!;
    expect(e.rule.id).toBe("K-011");
    expect(e.before.sceneId).toBe("T05");
    expect(e.before.verdict).toBe("△");
    expect(e.before.proposal.backchannelTo).toBeNull();
    expect(t13.draft.backchannelTo).toBe("decider");
  });
  it("not on the corrected scene itself, nor when the draft does not follow the 心得", () => {
    const t05 = card("T05");
    expect(ruleEffect(rules, judgments, t05.scene, t05.draft)).toBeNull();
    const t13 = card("T13");
    expect(ruleEffect(rules, judgments, t13.scene, { ...t13.draft, backchannelTo: null })).toBeNull();
  });
  it("only the first time: a later 丸新酒造 draft that follows it is not shown as a change", () => {
    const t13 = card("T13");
    const later = { ...t13.scene, id: "T99" };
    expect(ruleEffect(rules, judgments, later, t13.draft)).toBeNull(); // T13 (judged in the run) already followed it
  });
  it("never from the 台帳, and never from a taken-back judgment", () => {
    const t13 = card("T13");
    const undone = judgments.map((j) => (j.sceneId === "T05" ? { ...j, undone: "x" } : j));
    const noFive = undone.filter((j) => !(j.sceneId === "T05"));
    expect(ruleEffect(rules.filter((r) => r.origin === "ledger" || r.sources.every((s) => s.kind === "ledger")), judgments, t13.scene, t13.draft)).toBeNull();
    expect(ruleEffect(rules, noFive, t13.scene, t13.draft)).toBeNull();
  });
  it("心得帳: the drafts that used K-011 include 丸新酒造 T13, never T05 itself; 台帳 rules list none", () => {
    const k011 = rules.find((r) => r.id === "K-011")!;
    const used = draftsThatUsed(k011, judgments).map((x) => x.judgment.sceneId);
    expect(used).toContain("T13");
    expect(used).not.toContain("T05");
    expect(draftsThatUsed(rules.find((r) => r.id === "K-001")!, judgments)).toEqual([]);
  });
  it("a scene judged before the correction is never shown as its effect (お試し T01 vs a 心得 learned at T15)", () => {
    const run = recordedRun(demo);
    const t01 = card("T01");
    expect(ruleEffect(run.rules, run.judgments, t01.scene, t01.draft)).toBeNull();
    const t13 = card("T13");
    expect(ruleEffect(run.rules, run.judgments, t13.scene, t13.draft)?.rule.id).toBe("K-011");
  });
});
