/**
 * 「どこが違う？」 (D-057): an optional hint tapped with the first 「どれでもない」. It reaches the second interpretation and nothing else.
 */
import { describe, expect, it } from "vitest";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import type { Proposal, Scene } from "@/src/core/types";
import type { Disciple } from "@/src/disciple/v0";
import { areaOfField, DIFF_AREA_FIELDS, DIFF_AREAS, isDiffArea, parsePick } from "@/src/learning/area";
import type { Interpretation, interpret } from "@/src/learning/interpret";
import { learnStep } from "@/src/learning/loop";
import { LocalJsonStore } from "@/src/learning/store";
import type { Candidate, Master, ProposalFix } from "@/src/learning/types";
import { areaToFix, createSimulatedMaster, diffAreaInEval } from "@/eval/simulator/master";
import { IDEAL_TRAIN } from "./fixtures/ideal-proposals-train";

const scene: Scene = { id: "X1", set: "train", clientId: "C10", type: "T1", month: 6, situation: "（テスト用の場面）" };
const proposal: Proposal = {
  channel: "phone", meeting: "phone_call", formalTo: "decider", backchannelTo: null, timing: "now", followUp: false,
  format: "not_applicable", posture: [], escalateToMaster: false, message: "", basedOnRules: [],
};
const disciple: Disciple = { name: "fixed", propose: async () => proposal };
const cand = (text: string, fix: ProposalFix): Candidate => ({ action: "add", targetRuleId: null, scope: { clientId: "C10", sceneTypes: null }, text, when: null, fix });
const amb = (cs: Candidate[]): Interpretation => ({ diagnosis: "一言なし", ambiguous: true, candidates: cs, confidence: "low" });

type InterpretArgs = Parameters<typeof interpret>[0];

function run(master: Partial<Master>) {
  const calls: InterpretArgs[] = [];
  const interpretFn = async (a: InterpretArgs) => {
    calls.push(a);
    return a.rejected ? amb([cand("C", { field: "timing", value: "postpone" }), cand("D", { field: "format", value: "client" })]) : amb([cand("A", { field: "meeting", value: "zoom" }), cand("B", { field: "followUp", value: "true" })]);
  };
  const m: Master = { judge: async () => ({ verdict: "△", remark: "" }), choose: async () => null, why: async () => "", confirmGeneralization: async () => false, ...master };
  return { calls, result: learnStep({ store: new LocalJsonStore(null), disciple, master: m, scene, client: getClient("C10"), interpretFn }) };
}

describe("「どこが違う？」 in the learning loop", () => {
  it("passes the tapped area to the second interpretation only, and costs no extra tap", async () => {
    const asked: number[] = [];
    const { calls, result } = run({
      where: async ({ candidates }) => (asked.push(candidates.length), "timing"),
      choose: async ({ candidates }) => (candidates[0].text === "C" ? 0 : null),
    });
    const r = await result;
    expect(asked).toEqual([2]); // asked once, with the first readings
    expect(calls).toHaveLength(2);
    expect(calls[0].area).toBeUndefined();
    expect(calls[1]).toMatchObject({ area: "timing" });
    expect(calls[1].rejected?.map((c) => c.text)).toEqual(["A", "B"]);
    // judgment + first choice + second choice + the optional "why" — the same as without the chooser
    expect(r).toMatchObject({ chosen: 0, secondRound: true, area: "timing", masterTaps: 4 });
  });

  it("skipping it (or a master without it) works as before", async () => {
    const skipped = run({ where: async () => null });
    expect((await skipped.result).area).toBeNull();
    expect(skipped.calls[1].area).toBeNull();
    const old = run({});
    const r = await old.result;
    expect(r).toMatchObject({ secondRound: true, chosen: null, masterTaps: 3, area: null });
  });

  it("is not asked when the master picks a first reading", async () => {
    let asked = 0;
    const { calls, result } = run({ where: async () => (asked++, "to"), choose: async () => 1 });
    await result;
    expect(asked).toBe(0);
    expect(calls).toHaveLength(1);
  });
});

describe("areas", () => {
  it("cover every field a reading can name, each exactly once", () => {
    const fields = DIFF_AREAS.flatMap((a) => DIFF_AREA_FIELDS[a]);
    expect(new Set(fields).size).toBe(fields.length);
    expect([...fields].sort()).toEqual(["backchannelTo", "channel", "escalateToMaster", "followUp", "formalTo", "format", "meeting", "posture", "timing"]);
    expect(areaOfField("meeting")).toBe("channel");
    expect(isDiffArea("to")).toBe(true);
    expect(isDiffArea("anything")).toBe(false);
  });
});

describe("the 帳場's choice value", () => {
  it("accepts a reading, 「どれでもない」, or 「どれでもない」 with an area — nothing else", () => {
    expect(parsePick("1")).toEqual({ index: 1, area: null });
    expect(parsePick("none")).toEqual({ index: null, area: null });
    expect(parsePick("none:channel")).toEqual({ index: null, area: "channel" });
    for (const bad of ["1:to", "none:", "none:foo", "none:to:xyz", "3", "none:constructor", "", "NONE"]) expect(parsePick(bad)).toBeNull();
  });
});

describe("simulated master's 「どこが違う？」", () => {
  const t05 = TRAIN_SCENES.find((s) => s.id === "T05")!; // 丸新酒造: a quiet word to the brewer is missing
  const client = getClient(t05.clientId);
  const noBack = { ...IDEAL_TRAIN.T05, backchannelTo: null };

  it("points at the area of the failed check (as a real master knows their own objection)", async () => {
    expect(areaToFix(t05, client, noBack)).toBe("backchannel");
    expect(areaToFix(t05, client, IDEAL_TRAIN.T05)).toBeNull(); // nothing failed
    const m = createSimulatedMaster(1, { whereSkip: 0 });
    await m.judge(t05, client, noBack);
    expect(await m.where!({ scene: t05, client, proposal: noBack, candidates: [] })).toBe("backchannel");
  });

  it("leaves it unanswered at its skip rate, without shifting the remarks", async () => {
    const never = createSimulatedMaster(1, { whereSkip: 1 });
    await never.judge(t05, client, noBack);
    expect(await never.where!({ scene: t05, client, proposal: noBack, candidates: [] })).toBeNull();
    // The same seed gives the same remarks whether or not 「どこが違う？」 is asked in between.
    const a = createSimulatedMaster(3);
    const b = createSimulatedMaster(3);
    const ra: string[] = [];
    const rb: string[] = [];
    for (let i = 0; i < 5; i++) {
      ra.push((await a.judge(t05, client, noBack)).remark);
      rb.push((await b.judge(t05, client, noBack)).remark);
      await b.where!({ scene: t05, client, proposal: noBack, candidates: [] });
    }
    expect(rb).toEqual(ra);
  });
});

describe("evaluation switch (KOKOROE_EVAL_DIFF_AREA)", () => {
  it("off: the simulated master has no 「どこが違う？」, so the loop runs as before D-057", () => {
    const prev = process.env.KOKOROE_EVAL_DIFF_AREA;
    try {
      delete process.env.KOKOROE_EVAL_DIFF_AREA;
      expect(diffAreaInEval()).toBe(true);
      expect(createSimulatedMaster(1).where).toBeTypeOf("function");
      process.env.KOKOROE_EVAL_DIFF_AREA = "off";
      expect(createSimulatedMaster(1).where).toBeUndefined();
      expect(createSimulatedMaster(1, { diffArea: true }).where).toBeTypeOf("function");
      process.env.KOKOROE_EVAL_DIFF_AREA = "maybe";
      expect(() => diffAreaInEval()).toThrow();
    } finally {
      if (prev === undefined) delete process.env.KOKOROE_EVAL_DIFF_AREA;
      else process.env.KOKOROE_EVAL_DIFF_AREA = prev;
    }
  });
});
