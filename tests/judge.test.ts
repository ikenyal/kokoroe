import { describe, expect, it } from "vitest";
import { EVAL_SCENES, getClient } from "@/src/core/world";
import type { Proposal } from "@/src/core/types";
import { judge, PREDICATE_IDS, verdictOf } from "@/eval/simulator/judge";
import { HIDDEN_RULES, SCENE_KEYS } from "@/eval/simulator/hidden";
import { IDEAL } from "./fixtures/ideal-proposals";

const scene = (id: string) => {
  const s = EVAL_SCENES.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};
const run = (id: string, override: Partial<Proposal>) => {
  const s = scene(id);
  return judge(s, getClient(s.clientId), { ...IDEAL[id], ...override });
};

describe("ideal proposals", () => {
  it.each(EVAL_SCENES.map((s) => s.id))("%s is judged ○", (id) => {
    const r = run(id, {});
    expect(r.checks.filter((c) => c.outcome !== "ok")).toEqual([]);
    expect(r.verdict).toBe("○");
  });
});

describe("rule predicates", () => {
  const cases: [string, string, Partial<Proposal>, "△" | "×"][] = [
    ["R01 no follow-up after bad news", "E15", { followUp: false }, "△"],
    ["R02 phone for a spec change", "E11", { meeting: "phone_call" }, "×"],
    ["R03 full meeting in busy season", "E12", { timing: "now" }, "×"],
    ["R03 postpone without heads-up", "E12", { timing: "postpone" }, "△"],
    ["R04 formal message straight to the decider", "E13", { formalTo: "decider" }, "×"],
    ["R04 no quiet word to the decider", "E16", { backchannelTo: null }, "△"],
    ["R05 price sent as paper only", "E03", { meeting: "none" }, "×"],
    ["R06 own format for a stronger client", "E03", { format: "own" }, "×"],
    ["R06 fully client format for an equal client", "E17", { format: "client" }, "△"],
    ["R07 missing 'happy to explain'", "E09", { posture: ["prior_summary"] }, "△"],
    ["R09 too formal for a startup", "E07", { posture: [] }, "△"],
    ["R10 waiting until decided", "E01", { timing: "postpone" }, "×"],
    ["R10 external chat", "E01", { channel: "chat" }, "×"],
    ["R11 greeting by email", "E02", { channel: "mail" }, "×"],
    ["R11 letter to the contact", "E02", { formalTo: "contact" }, "△"],
    ["R12 own format for the coop", "E13", { format: "own" }, "×"],
    ["R13 Zoom for Kohoku", "E04", { meeting: "zoom" }, "×"],
    ["R13 technical talk without numbers", "E14", { posture: [] }, "△"],
    ["R14 daytime phone", "E05", { posture: ["reduce_burden"] }, "×"],
    ["R15 visiting the brewery in winter", "E06", { timing: "now" }, "×"],
    ["R15 online instead of visiting", "E16", { meeting: "zoom" }, "△"],
    ["R16 email to the startup", "E07", { channel: "mail" }, "×"],
    ["R17 no precedent", "E08", { posture: ["formal"] }, "△"],
    ["R18 no history summary for the new contact", "E09", { posture: ["offer_explanation"] }, "△"],
    ["R19 phone to the 2nd-gen president", "E10", { channel: "phone", meeting: "phone_call" }, "×"],
    ["HITL discount promised without the master", "E19", { escalateToMaster: false }, "×"],
  ];
  it.each(cases)("%s", (_label, id, override, expected) => {
    expect(run(id, override).verdict).toBe(expected);
  });

  // The apprentice learns from the master's one-liner, so a mismatched remark would teach a wrong rule.
  it.each(cases)("%s → remark key exists for the failure reason", (_label, id, override) => {
    for (const c of run(id, override).checks.filter((x) => x.outcome !== "ok")) {
      const lists = HIDDEN_RULES.find((r) => r.id === c.ruleId)!.remarks;
      expect(Object.keys(lists), `${c.ruleId}:${c.remarkKey}`).toContain(c.remarkKey ?? "default");
    }
  });
});

describe("verdict aggregation", () => {
  it("violation beats partial beats ok", () => {
    expect(verdictOf([{ ruleId: "a", outcome: "ok", why: "" }])).toBe("○");
    expect(verdictOf([{ ruleId: "a", outcome: "ok", why: "" }, { ruleId: "b", outcome: "partial", why: "" }])).toBe("△");
    expect(verdictOf([{ ruleId: "a", outcome: "partial", why: "" }, { ruleId: "b", outcome: "violation", why: "" }])).toBe("×");
  });
});

describe("hidden data consistency", () => {
  it("every rule has a predicate and vice versa", () => {
    expect(new Set(HIDDEN_RULES.map((r) => r.id))).toEqual(new Set(PREDICATE_IDS));
  });
  it("every eval scene has a key, and keys only reference known rules", () => {
    for (const s of EVAL_SCENES) {
      expect(SCENE_KEYS[s.id], s.id).toBeDefined();
      for (const r of SCENE_KEYS[s.id].rules) expect(PREDICATE_IDS).toContain(r);
    }
  });
  it("every rule except R08 is tested by at least one eval scene", () => {
    const used = new Set(EVAL_SCENES.flatMap((s) => SCENE_KEYS[s.id].rules));
    const unused = HIDDEN_RULES.map((r) => r.id).filter((id) => !used.has(id));
    expect(unused).toEqual(["R08"]); // seasonal greeting for clients who don't value it: covered by the train set (11/4)
  });
});
