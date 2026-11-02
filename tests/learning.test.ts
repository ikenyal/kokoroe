import { describe, expect, it } from "vitest";
import { getClient } from "@/src/core/world";
import type { Proposal, Scene } from "@/src/core/types";
import type { Disciple } from "@/src/disciple/v0";
import { learnStep } from "@/src/learning/loop";
import { renderRules } from "@/src/learning/compile";
import { applies, LocalJsonStore } from "@/src/learning/store";
import type { Interpretation } from "@/src/learning/interpret";

const scene = (id: string, clientId: string, type: Scene["type"]): Scene => ({
  id,
  set: "train",
  clientId,
  type,
  month: 6,
  situation: "（テスト用の場面）",
});

const proposal: Proposal = {
  channel: "phone",
  meeting: "phone_call",
  formalTo: "decider",
  backchannelTo: null,
  timing: "now",
  followUp: false,
  format: "not_applicable",
  posture: [],
  escalateToMaster: false,
  message: "",
  basedOnRules: [],
};
const fixedDisciple: Disciple = { name: "fixed", propose: async () => proposal };
const fixedNow = () => new Date("2026-11-03T10:00:00Z");

describe("learning loop (no API: fake judge and interpreter)", () => {
  it("○ records the judgment and learns nothing", async () => {
    const store = new LocalJsonStore(null);
    const r = await learnStep({
      store,
      disciple: fixedDisciple,
      judge: async () => ({ verdict: "○", remark: "" }),
      scene: scene("X1", "C10", "T1"),
      client: getClient("C10"),
      interpretFn: async () => {
        throw new Error("must not be called on ○");
      },
    });
    expect(r.changes).toEqual([]);
    expect(await store.listJudgments()).toHaveLength(1);
  });

  it("× adds a narrow rule with its source and history, then a later × revises it", async () => {
    const store = new LocalJsonStore(null);
    const add: Interpretation = {
      diagnosis: "二代目社長に電話で済ませた",
      updates: [{ action: "add", targetRuleId: null, scope: { clientId: "C10", sceneTypes: null }, text: "大河原建材の社長には電話で済まさず、打ち合わせで説明する。" }],
      confidence: "medium",
    };
    const r1 = await learnStep({
      store,
      disciple: fixedDisciple,
      judge: async () => ({ verdict: "×", remark: "電話で済ますな" }),
      scene: scene("X1", "C10", "T1"),
      client: getClient("C10"),
      interpretFn: async () => add,
      now: fixedNow,
    });
    expect(r1.changes).toEqual([{ ruleId: "K-001", action: "add", before: null, after: add.updates[0].text }]);
    const rule = (await store.getRule("K-001"))!;
    expect(rule.scope).toEqual({ clientId: "C10", sceneTypes: null });
    expect(rule.sources[0]).toMatchObject({ judgmentId: "J-0001", sceneId: "X1", verdict: "×", remark: "電話で済ますな", date: "2026-11-03" });
    expect(rule.history[0]).toMatchObject({ before: null, masterWords: "電話で済ますな" });

    // The next similar scene for the same client now gets the rule shown to the apprentice.
    const revise: Interpretation = {
      diagnosis: "説明の丁寧さが足りない",
      updates: [{ action: "revise", targetRuleId: "K-001", scope: { clientId: "C10", sceneTypes: null }, text: "大河原建材の社長には電話で済まさず、打ち合わせで丁寧に説明する。" }],
      confidence: "high",
    };
    const r2 = await learnStep({
      store,
      disciple: fixedDisciple,
      judge: async () => ({ verdict: "△", remark: "二代目には説明しろ" }),
      scene: scene("X2", "C10", "T3"),
      client: getClient("C10"),
      interpretFn: async () => revise,
      now: fixedNow,
    });
    expect(r2.rulesShown).toEqual(["K-001"]);
    const revised = (await store.getRule("K-001"))!;
    expect(revised.history).toHaveLength(2);
    expect(revised.history[1]).toMatchObject({ before: add.updates[0].text, after: revise.updates[0].text, masterWords: "二代目には説明しろ" });
    expect(revised.sources.map((s) => s.judgmentId)).toEqual(["J-0001", "J-0002"]);
    expect(renderRules("大河原建材", [revised])).toContain("「大河原建材の社長には電話で済まさず、打ち合わせで説明する。」→");
  });

  it("scopes are respected: a C10 rule is not shown for C01", () => {
    const rule = {
      id: "K-001",
      scope: { clientId: "C10", sceneTypes: ["T3" as const] },
      text: "",
      status: "active" as const,
      confidence: "low" as const,
      sources: [],
      history: [],
    };
    expect(applies(rule, "C10", "T3")).toBe(true);
    expect(applies(rule, "C10", "T1")).toBe(false);
    expect(applies(rule, "C01", "T3")).toBe(false);
  });
});
