import { describe, expect, it } from "vitest";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import type { Proposal, Scene } from "@/src/core/types";
import type { Disciple } from "@/src/disciple/v0";
import { learnStep } from "@/src/learning/loop";
import { renderRule } from "@/src/learning/compile";
import { applyFix, jstDate } from "@/src/learning/fix";
import { applies, LocalJsonStore } from "@/src/learning/store";
import type { Interpretation } from "@/src/learning/interpret";
import type { Candidate, KokoroeRule, Master } from "@/src/learning/types";
import { createSimulatedMaster } from "@/eval/simulator/master";
import { IDEAL_TRAIN } from "./fixtures/ideal-proposals-train";

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
const fixedNow = () => new Date("2026-11-03T01:00:00Z"); // 10:00 JST
const cand = (o: Partial<Candidate>): Candidate => ({
  action: "add",
  targetRuleId: null,
  scope: { clientId: "C10", sceneTypes: null },
  text: "社長には電話で済まさず、打ち合わせで説明する",
  when: null,
  fix: { field: "meeting", value: "zoom" },
  ...o,
});
const fakeMaster = (o: Partial<Master> & Pick<Master, "judge">): Master => ({
  choose: async () => 0,
  why: async () => "",
  ...o,
});

describe("learning loop (no API: fake master and interpreter)", () => {
  it("○ records the judgment and learns nothing", async () => {
    const store = new LocalJsonStore(null);
    const r = await learnStep({
      store,
      disciple: fixedDisciple,
      master: fakeMaster({ judge: async () => ({ verdict: "○", remark: "" }) }),
      scene: scene("X1", "C10", "T1"),
      client: getClient("C10"),
      interpretFn: async () => {
        throw new Error("must not be called on ○");
      },
    });
    expect(r.changes).toEqual([]);
    expect(r.masterTaps).toBe(1);
    expect(await store.listJudgments()).toHaveLength(1);
  });

  it("clear remark → one reading applied without asking; history gets the master's why; later revise keeps 旧→新", async () => {
    const store = new LocalJsonStore(null);
    const one: Interpretation = { diagnosis: "電話で済ませた", ambiguous: false, candidates: [cand({})], confidence: "medium" };
    const r1 = await learnStep({
      store,
      disciple: fixedDisciple,
      master: fakeMaster({
        judge: async () => ({ verdict: "×", remark: "電話で済ますな" }),
        choose: async () => {
          throw new Error("must not ask when the reading is clear");
        },
        why: async () => "2025年、二代目に「先代と同じ扱いは困る」と言われた",
      }),
      scene: scene("X1", "C10", "T1"),
      client: getClient("C10"),
      interpretFn: async () => one,
      now: fixedNow,
    });
    expect(r1.asked).toBe(false);
    expect(r1.masterTaps).toBe(2); // judgment + optional why prompt
    const rule = (await store.getRule("K-001"))!;
    expect(rule.sources[0]).toMatchObject({ judgmentId: "J-0001", sceneId: "X1", verdict: "×", remark: "電話で済ますな", date: "2026-11-03" });
    expect(rule.history[0]).toMatchObject({ before: null, trigger: "2025年、二代目に「先代と同じ扱いは困る」と言われた" });

    const revise: Interpretation = {
      diagnosis: "説明の丁寧さ",
      ambiguous: false,
      candidates: [cand({ action: "revise", targetRuleId: "K-001", text: "社長には打ち合わせで丁寧に説明する", when: "金額が絡むとき", fix: { field: "posture", value: "explain_carefully" } })],
      confidence: "high",
    };
    const r2 = await learnStep({
      store,
      disciple: fixedDisciple,
      master: fakeMaster({ judge: async () => ({ verdict: "△", remark: "二代目には説明しろ" }) }),
      scene: scene("X2", "C10", "T3"),
      client: getClient("C10"),
      interpretFn: async () => revise,
      now: fixedNow,
    });
    expect(r2.rulesShown).toEqual(["K-001"]);
    const revised = (await store.getRule("K-001"))!;
    expect(revised.history[1]).toMatchObject({ before: "社長には電話で済まさず、打ち合わせで説明する", after: "社長には打ち合わせで丁寧に説明する（金額が絡むとき）" });
    const page = renderRule(revised);
    expect(page).toContain("旧「社長には電話で済まさず、打ち合わせで説明する」→ 新「社長には打ち合わせで丁寧に説明する（金額が絡むとき）」");
    expect(page).toContain("きっかけ: 2025年、二代目に「先代と同じ扱いは困る」と言われた");
    expect(page).toContain("出典: J-0001（X1 ×「電話で済ますな」）");
  });

  it("ambiguous → master taps a reading; 'none of these' learns nothing", async () => {
    const store = new LocalJsonStore(null);
    const amb: Interpretation = {
      diagnosis: "一言なし",
      ambiguous: true,
      candidates: [cand({ text: "A" }), cand({ text: "B", fix: { field: "followUp", value: "true" } })],
      confidence: "low",
    };
    const none = await learnStep({
      store,
      disciple: fixedDisciple,
      master: fakeMaster({ judge: async () => ({ verdict: "△", remark: "" }), choose: async () => null }),
      scene: scene("X1", "C10", "T1"),
      client: getClient("C10"),
      interpretFn: async () => amb,
    });
    expect(none).toMatchObject({ asked: true, chosen: null, changes: [], masterTaps: 2 });
    const picked = await learnStep({
      store,
      disciple: fixedDisciple,
      master: fakeMaster({ judge: async () => ({ verdict: "△", remark: "" }), choose: async () => 1 }),
      scene: scene("X2", "C10", "T1"),
      client: getClient("C10"),
      interpretFn: async () => amb,
    });
    expect(picked.chosen).toBe(1);
    expect((await store.getRule("K-001"))!.text).toBe("B");
  });

  it("scopes are respected: a C10 rule is not shown for C01", () => {
    const rule: KokoroeRule = {
      id: "K-001",
      scope: { clientId: "C10", sceneTypes: ["T3"] },
      text: "",
      when: null,
      status: "active",
      confidence: "low",
      sources: [],
      history: [],
    };
    expect(applies(rule, "C10", "T3")).toBe(true);
    expect(applies(rule, "C10", "T1")).toBe(false);
    expect(applies(rule, "C01", "T3")).toBe(false);
  });

  it("dates are JST", () => {
    expect(jstDate("2026-11-02T20:10:00Z")).toBe("2026-11-03");
  });
});

describe("simulated master", () => {
  const t05 = TRAIN_SCENES.find((s) => s.id === "T05")!; // 丸新酒造: formal via the wife, quiet word to the brewer
  const client = getClient(t05.clientId);
  const noBack = { ...IDEAL_TRAIN.T05, backchannelTo: null };

  it("picks the reading that would have fixed the draft, and says 'none' when no reading does", async () => {
    const m = createSimulatedMaster(1);
    const j = await m.judge(t05, client, noBack);
    expect(j.verdict).toBe("△");
    const wrong = cand({ scope: { clientId: "C06", sceneTypes: null }, fix: { field: "posture", value: "concise" } });
    const right = cand({ scope: { clientId: "C06", sceneTypes: null }, fix: { field: "backchannelTo", value: "decider" } });
    expect(await m.choose({ scene: t05, client, proposal: noBack, candidates: [wrong, right] })).toBe(1);
    expect(await m.choose({ scene: t05, client, proposal: noBack, candidates: [wrong] })).toBeNull();
  });

  it("answers 'why' with the hidden history trigger only for rules that have one", async () => {
    const kohoku = TRAIN_SCENES.find((s) => s.clientId === "C04" && IDEAL_TRAIN[s.id].meeting === "teams")!;
    const m = createSimulatedMaster(1);
    const zoom = { ...IDEAL_TRAIN[kohoku.id], meeting: "zoom" as const };
    await m.judge(kohoku, getClient("C04"), zoom);
    const teams = cand({ scope: { clientId: "C04", sceneTypes: null }, fix: { field: "meeting", value: "teams" } });
    const rule = {} as KokoroeRule;
    expect(await m.why({ scene: kohoku, client: getClient("C04"), rule, candidate: teams })).toMatch(/^2024年、.*Zoom/);

    await m.judge(t05, client, noBack);
    const back = cand({ fix: { field: "backchannelTo", value: "decider" } });
    expect(await m.why({ scene: t05, client, rule, candidate: back })).toBe(""); // R04 has no recorded history
  });

  it("applyFix ignores invalid values", () => {
    expect(applyFix(proposal, { field: "channel", value: "fax" }).channel).toBe("phone");
    expect(applyFix(proposal, { field: "posture", value: "with_numbers" }).posture).toEqual(["with_numbers"]);
    expect(applyFix(proposal, { field: "followUp", value: "true" }).followUp).toBe(true);
  });
});

describe("確かめ稽古 and regression (no API)", () => {
  const sc = (id: string) => scene(id, "C02", "T6");
  const ok: Proposal = { ...proposal, channel: "letter", meeting: "none", formalTo: "decider" };
  const broken: Proposal = { ...ok, formalTo: "contact" };
  const addRule: Interpretation = {
    diagnosis: "窓口を飛ばした",
    ambiguous: false,
    candidates: [cand({ scope: { clientId: "C02", sceneTypes: null }, text: "正式な連絡は窓口宛て", fix: { field: "formalTo", value: "contact" } })],
    confidence: "high",
  };

  async function seedOk(store: LocalJsonStore) {
    await store.addJudgment({ at: new Date().toISOString(), sceneId: "P1", clientId: "C02", sceneType: "T6", proposal: ok, verdict: "○", remark: "" });
  }

  it("past ○ with an unchanged decision passes without asking the master", async () => {
    const store = new LocalJsonStore(null);
    await seedOk(store);
    let judged = 0;
    const r = await learnStep({
      store,
      disciple: { name: "same", propose: async (s) => (s.id === "P1" ? ok : proposal) },
      master: fakeMaster({ judge: async () => (judged++ === 0 ? { verdict: "×", remark: "窓口を飛ばすな" } : { verdict: "○", remark: "" }) }),
      scene: sc("X1"),
      client: getClient("C02"),
      interpretFn: async () => addRule,
      sceneById: (id) => sc(id),
    });
    expect(r.verification).toMatchObject({ regressionChecked: 1, regressionAsked: 0, rolledBack: false });
    expect(r.verification!.confirm!.verdict).toBe("○");
    expect((await store.getRule("K-001"))!.status).toBe("active");
  });

  it("a rule that breaks a past ○ is narrowed once, then rolled back if it still breaks it (recorded in 沿革)", async () => {
    const store = new LocalJsonStore(null);
    await seedOk(store);
    let interpCalls = 0;
    const r = await learnStep({
      store,
      disciple: { name: "breaks", propose: async (s) => (s.id === "P1" ? broken : proposal) },
      master: fakeMaster({
        judge: async (s) => (s.id === "P1" ? { verdict: "×", remark: "白樺さんは手紙を社長宛に" } : { verdict: "×", remark: "窓口を飛ばすな" }),
      }),
      scene: sc("X1"),
      client: getClient("C02"),
      interpretFn: async (a) => {
        interpCalls++;
        if (a.conflict) {
          expect(a.conflict.ruleId).toBe("K-001");
          return { ...addRule, candidates: [{ ...addRule.candidates[0], text: "正式な連絡は窓口宛て", when: "あいさつ状以外" }] };
        }
        return addRule;
      },
      sceneById: (id) => sc(id),
    });
    expect(interpCalls).toBe(2);
    expect(r.verification).toMatchObject({ narrowed: true, rolledBack: true, brokenSceneId: "P1" });
    const k = (await store.getRule("K-001"))!;
    expect(k.status).toBe("retired");
    expect(k.history.at(-1)!.after).toBe("（差し戻し: 廃止）");
    expect(k.history.at(-1)!.reason).toContain("P1");
    expect(await store.rulesFor("C02", "T6")).toEqual([]);
  });
});
