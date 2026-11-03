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
  confirmGeneralization: async () => false,
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
    // "none of these" twice: first round + second round of readings (D-025) → judgment + 2 choices = 3 taps, nothing learned.
    expect(none).toMatchObject({ asked: true, chosen: null, changes: [], masterTaps: 3, secondRound: true });
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
    let x1 = 0;
    const r = await learnStep({
      store,
      disciple: { name: "breaks", propose: async (s) => (s.id === "P1" ? broken : proposal) },
      master: fakeMaster({
        // X1: × on the draft, ○ on the 確かめ稽古 re-solve — so only the regression path is exercised here.
        judge: async (s) => (s.id === "P1" ? { verdict: "×", remark: "白樺さんは手紙を社長宛に" } : x1++ === 0 ? { verdict: "×", remark: "窓口を飛ばすな" } : { verdict: "○", remark: "" }),
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

describe("確かめ稽古 fails (D-045, no API)", () => {
  const run = async (confirmVerdicts: ("○" | "△" | "×")[]) => {
    const store = new LocalJsonStore(null);
    let calls = 0;
    const seen: string[] = [];
    const r = await learnStep({
      store,
      disciple: fixedDisciple,
      master: fakeMaster({ judge: async () => (calls++ === 0 ? { verdict: "△", remark: "社長には会って" } : { verdict: confirmVerdicts.shift()!, remark: "まだ違う" }) }),
      scene: scene("Y1", "C10", "T6"),
      client: getClient("C10"),
      interpretFn: async (a) => {
        seen.push(a.judgment.kind ?? "draft");
        return { diagnosis: "テスト", ambiguous: false, confidence: "medium", candidates: [cand({ text: seen.length === 1 ? "最初の読み" : "読み直し" })] };
      },
      sceneById: () => undefined,
    });
    return { store, r, seen };
  };
  it("a △/× on the re-solved scene gets one re-interpretation from that judgment; ○ then keeps the revised rule", async () => {
    const { store, r, seen } = await run(["×", "○"]);
    expect(seen).toEqual(["draft", "confirm"]);
    expect(r.verification).toMatchObject({ reinterpreted: true, withdrawn: false, rolledBack: false });
    const k = (await store.getRule("K-001"))!;
    expect(k.status).toBe("active");
    expect(k.text).toBe("読み直し");
  });
  it("still not ○ after the re-interpretation → the rule is withdrawn (not adopted), recorded in 沿革", async () => {
    const { store, r } = await run(["△", "×"]);
    expect(r.verification).toMatchObject({ reinterpreted: true, withdrawn: true });
    const k = (await store.getRule("K-001"))!;
    expect(k.status).toBe("retired");
    expect(k.history.at(-1)!.after).toBe("（取り下げ: 採用しない）");
    expect(k.history.at(-1)!.reason).toContain("確かめで外れたため取り下げ");
    expect(await store.rulesFor("C10", "T6")).toEqual([]);
  });
});

describe("確かめ稽古: the rule took but something else is missing (D-045)", () => {
  it("keeps the rule and learns the remainder as a separate rule — the T05 case from a real run", async () => {
    const store = new LocalJsonStore(null);
    let calls = 0;
    const seen: string[] = [];
    const r = await learnStep({
      store,
      // after the rule, the draft does have the quiet word to the decider (the rule's point) …
      disciple: { name: "took", propose: async () => (calls === 0 ? proposal : { ...proposal, backchannelTo: "decider" }) },
      // … but the master still wants a visit: × 「顔出して話せ」
      master: fakeMaster({ judge: async () => (calls++ === 0 ? { verdict: "△", remark: "" } : { verdict: "×", remark: "顔出して話せ" }) }),
      scene: scene("Y2", "C06", "T4"),
      client: getClient("C06"),
      interpretFn: async (a) => {
        seen.push(a.judgment.kind ?? "draft");
        return seen.length === 1
          ? { diagnosis: "裏の一言", ambiguous: false, confidence: "medium", candidates: [cand({ scope: { clientId: "C06", sceneTypes: null }, text: "蔵元にも一言", fix: { field: "backchannelTo", value: "decider" } })] }
          : { diagnosis: "顔を出す", ambiguous: false, confidence: "medium", candidates: [cand({ action: "revise", targetRuleId: "K-001", scope: { clientId: "C06", sceneTypes: null }, text: "蔵へ顔を出す", fix: { field: "meeting", value: "in_person" } })] };
      },
      sceneById: () => undefined,
    });
    expect(r.verification).toMatchObject({ remainderLearned: true, reinterpreted: false, withdrawn: false });
    const k1 = (await store.getRule("K-001"))!;
    expect(k1.status).toBe("active");
    expect(k1.text).toBe("蔵元にも一言"); // not overwritten
    const k2 = (await store.getRule("K-002"))!;
    expect(k2.text).toBe("蔵へ顔を出す"); // the remainder, as its own rule
  });
});

describe("ledger seeding (台帳)", () => {
  it("seeds one 台帳 rule per explicit constraint, asks why once each, records only real history", async () => {
    const { seedFromLedger } = await import("@/src/learning/ledger");
    const { CLIENTS } = await import("@/src/core/world");
    const store = new LocalJsonStore(null);
    const master = createSimulatedMaster(1);
    const r = await seedFromLedger({ store, clients: CLIENTS, master, now: fixedNow });
    expect(r.seeded.length).toBe(10);
    expect(r.asked).toBe(10);
    const rules = await store.listRules();
    expect(rules.every((x) => x.origin === "ledger" && x.sources[0].kind === "ledger")).toBe(true);
    const withWhy = rules.filter((x) => x.history[0].trigger).map((x) => [x.scope.clientId, x.history[0].trigger]);
    expect(withWhy.map((x) => x[0]).sort()).toEqual(["C03", "C04", "C10"]);
    expect(withWhy.find((x) => x[0] === "C04")![1]).toMatch(/^2024年、.*Zoom/);
    expect(renderRule(rules.find((x) => x.scope.clientId === "C04")!)).toContain("〔台帳〕");
    expect(renderRule(rules.find((x) => x.scope.clientId === "C04")!)).toContain("出典: 台帳");
    // Seeding twice does nothing.
    expect((await seedFromLedger({ store, clients: CLIENTS, master, now: fixedNow })).seeded).toEqual([]);
  });
});

describe("一般化 (no API)", () => {
  const word = async () => ({ text: "正式は窓口、決裁者には裏で一言", when: null, sceneTypes: null });
  const back: Candidate["fix"] = { field: "backchannelTo", value: "decider" };
  const baseP: Proposal = { ...proposal, channel: "mail", meeting: "in_person", formalTo: "contact", backchannelTo: null };

  /** Two client rules (C06, C03) learned from corrections with the same fix. */
  async function twoRules(store: LocalJsonStore) {
    const ids: string[] = [];
    for (const [sid, cid] of [["S1", "C06"], ["S2", "C03"]] as const) {
      const j = await store.addJudgment({ at: fixedNow().toISOString(), sceneId: sid, clientId: cid, sceneType: "T4", proposal: baseP, verdict: "△", remark: "" });
      const id = await store.nextRuleId();
      await store.saveRule({
        id, scope: { clientId: cid, sceneTypes: null }, text: `${cid}: 決裁者にも一言`, when: null, status: "active", confidence: "medium",
        fix: back, sources: [{ kind: "judgment", judgmentId: j.id, date: "2026-11-03", sceneId: sid, verdict: "△", remark: "" }],
        history: [{ date: "2026-11-03", before: null, after: "x", trigger: null, judgmentId: j.id, masterWords: "", reason: "" }],
      });
      ids.push(id);
    }
    return ids;
  }
  const scenesById = (id: string) => scene(id, id === "S1" ? "C06" : "C03", "T4");

  it("asks the master once; yes → one company-wide rule, client rules folded in", async () => {
    const store = new LocalJsonStore(null);
    const [a] = await twoRules(store);
    let asked = 0;
    const r = await (await import("@/src/learning/generalize")).maybeGeneralize({
      store, disciple: fixedDisciple, ruleId: a, sceneById: scenesById, clientById: getClient, wordFn: word,
      master: fakeMaster({ judge: async () => ({ verdict: "○", remark: "" }), confirmGeneralization: async () => (asked++, true) }),
    });
    expect(asked).toBe(1);
    expect(r).toMatchObject({ accepted: true, rolledBack: false, members: ["K-001", "K-002"] });
    const g = (await store.getRule(r!.proposedRuleId!))!;
    expect(g.scope.clientId).toBeNull();
    expect(g.sources).toHaveLength(2);
    expect(renderRule(g)).toContain("〔全社〕");
    expect((await store.getRule("K-001"))!).toMatchObject({ status: "retired", mergedInto: g.id });
    expect((await store.rulesFor("C09", "T4")).map((x) => x.id)).toEqual([g.id]); // now reaches other clients
  });

  it("no → nothing widened, and the same set is not proposed again", async () => {
    const store = new LocalJsonStore(null);
    const [a] = await twoRules(store);
    const m = fakeMaster({ judge: async () => ({ verdict: "○", remark: "" }), confirmGeneralization: async () => false });
    const gen = (await import("@/src/learning/generalize")).maybeGeneralize;
    const args = { store, disciple: fixedDisciple, master: m, ruleId: a, sceneById: scenesById, clientById: getClient, wordFn: word };
    expect((await gen(args))!.accepted).toBe(false);
    expect(await gen(args)).toBeNull();
    expect((await store.listRules()).every((x) => x.scope.clientId !== null && x.status === "active")).toBe(true);
  });

  it("a regression after widening rolls it back and restores the client rules", async () => {
    const store = new LocalJsonStore(null);
    const [a] = await twoRules(store);
    await store.addJudgment({ at: fixedNow().toISOString(), sceneId: "S9", clientId: "C09", sceneType: "T4", proposal: { ...baseP, channel: "phone" }, verdict: "○", remark: "" });
    const r = await (await import("@/src/learning/generalize")).maybeGeneralize({
      store, disciple: fixedDisciple, ruleId: a, wordFn: word, clientById: getClient,
      sceneById: (id) => (id === "S9" ? scene("S9", "C09", "T4") : scenesById(id)),
      master: fakeMaster({ judge: async () => ({ verdict: "×", remark: "そこは違う" }), confirmGeneralization: async () => true }),
    });
    expect(r).toMatchObject({ accepted: true, rolledBack: true, brokenSceneId: "S9" });
    expect((await store.getRule(r!.proposedRuleId!))!.status).toBe("retired");
    expect((await store.getRule("K-001"))!.status).toBe("active");
    expect((await store.getRule("K-001"))!.mergedInto).toBeUndefined();
    expect((await store.getRule("K-001"))!.history.at(-1)!.reason).toContain("差し戻");
  });
});

describe("台帳 rules and the apprentice", () => {
  it("pure 台帳 rules are kept but not shown to the apprentice; a master-revised one is labelled 〔台帳＋師匠〕", async () => {
    const { isPureLedger } = await import("@/src/disciple/v1");
    const { seedFromLedger } = await import("@/src/learning/ledger");
    const { CLIENTS } = await import("@/src/core/world");
    const store = new LocalJsonStore(null);
    await seedFromLedger({ store, clients: CLIENTS, master: createSimulatedMaster(1), now: fixedNow });
    const r = (await store.rulesFor("C03", "T9"))[0];
    expect(isPureLedger(r)).toBe(true);
    r.sources.push({ kind: "judgment", judgmentId: "J-0001", date: "2026-11-03", sceneId: "T21", verdict: "×", remark: "生協は書式" });
    expect(isPureLedger(r)).toBe(false);
    expect(renderRule(r)).toContain("〔台帳＋師匠〕");
  });
});

describe("second round and scope guard (D-025, no API)", () => {
  it("after 'none of these' the interpreter gets the rejected readings and the master can pick from new ones", async () => {
    const store = new LocalJsonStore(null);
    const first: Interpretation = { diagnosis: "", ambiguous: true, candidates: [cand({ text: "A" }), cand({ text: "B", fix: { field: "followUp", value: "true" } })], confidence: "low" };
    const second: Interpretation = { diagnosis: "", ambiguous: true, candidates: [cand({ text: "今すぐ伝える", fix: { field: "timing", value: "now" } })], confidence: "low" };
    let seenRejected: string[] = [];
    const r = await learnStep({
      store, disciple: fixedDisciple, scene: scene("X1", "C01", "T1"), client: getClient("C01"),
      master: fakeMaster({ judge: async () => ({ verdict: "×", remark: "" }), choose: async ({ candidates }) => (candidates[0].text === "今すぐ伝える" ? 0 : null) }),
      interpretFn: async (a) => {
        if (a.rejected) { seenRejected = a.rejected.map((c) => c.text); return second; }
        return first;
      },
    });
    expect(seenRejected).toEqual(["A", "B"]);
    expect(r).toMatchObject({ secondRound: true, chosen: 0 });
    expect((await store.getRule("K-001"))!.text).toBe("今すぐ伝える");
    expect(r.masterTaps).toBe(4); // judgment + 2 choices + optional why
  });

  it("keeps a scene-type restriction only when the remark names that kind of situation", async () => {
    const { guardScope, typesNamedIn } = await import("@/src/learning/scope");
    const c = cand({ scope: { clientId: "C01", sceneTypes: ["T8"] } });
    expect(guardScope(c, "浜風さんは決まる前に").scope.sceneTypes).toBeNull(); // timing lesson, not about scheduling
    expect(guardScope(c, "").scope.sceneTypes).toBeNull();
    expect(guardScope(c, "日程は早めに").scope.sceneTypes).toEqual(["T8"]);
    expect(guardScope(cand({ scope: { clientId: "C03", sceneTypes: ["T3", "T8"] } }), "生協の見積りは書式").scope.sceneTypes).toEqual(["T3"]);
    expect(typesNamedIn("金の話は説明しながら")).toContain("T3");
  });
});

describe("LocalJsonStore with concurrent instances (HITL review #3)", () => {
  it("two instances on one file never overwrite each other's writes, and ids are never reused", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const path = (await import("node:path")).default;
    const file = path.join(mkdtempSync(path.join(tmpdir(), "kokoroe-")), "s.json");
    const a = new LocalJsonStore(file); // e.g. a page request
    const b = new LocalJsonStore(file); // e.g. background interpretation, opened earlier
    const j1 = await a.addJudgment({ at: "x", sceneId: "S1", clientId: "C01", sceneType: "T1", proposal, verdict: "×", remark: "" });
    const j2 = await b.addJudgment({ at: "x", sceneId: "S2", clientId: "C01", sceneType: "T1", proposal, verdict: "○", remark: "" });
    expect([j1.id, j2.id]).toEqual(["J-0001", "J-0002"]);
    const id = await b.nextRuleId();
    await b.saveRule({ id, scope: { clientId: "C01", sceneTypes: null }, text: "r", when: null, status: "active", confidence: "low", sources: [], history: [] });
    expect((await a.listJudgments()).map((j) => j.id)).toEqual(["J-0001", "J-0002"]);
    expect((await a.listRules()).map((r) => r.id)).toEqual(["K-001"]);
  });
});

describe("store stamps new 沿革 entries with the save time (changes_since, D-042)", () => {
  it("stamps only entries added since the last save; older entries keep what they had", async () => {
    const { LocalJsonStore } = await import("@/src/learning/store");
    const s = new LocalJsonStore(null);
    const entry = (after: string) => ({ date: "2026-11-03", before: null, after, trigger: null, judgmentId: "J-1", masterWords: "", reason: "" });
    const rule = { id: "K-001", scope: { clientId: null, sceneTypes: null }, text: "a", when: null, status: "active" as const, confidence: "low" as const, sources: [], history: [entry("a")] };
    await s.saveRule(rule);
    const first = (await s.getRule("K-001"))!.history[0].at;
    expect(first).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const again = (await s.getRule("K-001"))!;
    again.history.push(entry("b"));
    await new Promise((r) => setTimeout(r, 5));
    await s.saveRule(again);
    const h = (await s.getRule("K-001"))!.history;
    expect(h[0].at).toBe(first);
    expect(Date.parse(h[1].at!)).toBeGreaterThan(Date.parse(first!));
  });
});

describe("compile: scope guards in code (audit 2026-11-03)", () => {
  const j = (clientId: string) =>
    ({ id: "J-0100", at: "2026-11-03T01:00:00Z", sceneId: "T01", clientId, sceneType: "T2", proposal, verdict: "△", remark: "" }) as const;
  const meta = { diagnosis: "テスト", confidence: "medium" as const };
  async function withRules() {
    const store = new LocalJsonStore(null);
    for (const [id, clientId] of [["K-001", "C01"], ["K-002", null]] as const) {
      await store.saveRule({ id, scope: { clientId, sceneTypes: null }, text: `元の${id}`, when: null, status: "active", confidence: "high", sources: [], history: [] });
    }
    return store;
  }
  it("a correction about one client cannot revise another client's rule (it becomes a new rule for this client)", async () => {
    const store = await withRules();
    const { applyCandidate } = await import("@/src/learning/compile");
    const ch = await applyCandidate(store, { ...j("C02") }, cand({ action: "revise", targetRuleId: "K-001", scope: { clientId: "C01", sceneTypes: null }, text: "書き換え" }), meta);
    expect(ch.action).toBe("add");
    expect((await store.getRule("K-001"))!.text).toBe("元のK-001");
    expect((await store.getRule(ch.ruleId))!.scope.clientId).toBe("C02");
  });
  it("an add is always scoped to the judged client, even if the reading says otherwise or says all clients", async () => {
    const store = await withRules();
    const { applyCandidate } = await import("@/src/learning/compile");
    for (const clientId of ["C05", null]) {
      const ch = await applyCandidate(store, { ...j("C03") }, cand({ scope: { clientId, sceneTypes: null } }), meta);
      expect((await store.getRule(ch.ruleId))!.scope.clientId).toBe("C03");
    }
  });
  it("widening to all clients is possible only by revising an existing company-wide or same-client rule", async () => {
    const store = await withRules();
    const { applyCandidate } = await import("@/src/learning/compile");
    const a = await applyCandidate(store, { ...j("C01") }, cand({ action: "revise", targetRuleId: "K-001", scope: { clientId: null, sceneTypes: null } }), meta);
    expect(a.action).toBe("revise");
    expect((await store.getRule("K-001"))!.scope.clientId).toBeNull();
    const b = await applyCandidate(store, { ...j("C04") }, cand({ action: "revise", targetRuleId: "K-002", scope: { clientId: null, sceneTypes: null } }), meta);
    expect(b.ruleId).toBe("K-002");
    expect((await store.getRule("K-002"))!.scope.clientId).toBeNull();
  });
  it("a retired rule is never revised, and one client's correction cannot narrow a company-wide rule (it adds its own)", async () => {
    const store = await withRules();
    const { applyCandidate } = await import("@/src/learning/compile");
    const k1 = (await store.getRule("K-001"))!;
    await store.saveRule({ ...k1, status: "retired" });
    const a = await applyCandidate(store, { ...j("C01") }, cand({ action: "revise", targetRuleId: "K-001", scope: { clientId: "C01", sceneTypes: null } }), meta);
    expect(a.action).toBe("add");
    expect((await store.getRule("K-001"))!.text).toBe("元のK-001");
    const b = await applyCandidate(store, { ...j("C02") }, cand({ action: "revise", targetRuleId: "K-002", scope: { clientId: "C02", sceneTypes: null } }), meta);
    expect(b.action).toBe("add");
    expect((await store.getRule("K-002"))!.scope.clientId).toBeNull();
    expect((await store.getRule(b.ruleId))!.scope.clientId).toBe("C02");
  });
});

describe("HITL floor in code (D-044)", () => {
  it("forces escalation on price scenes and on discount/contract words, never turns it off, leaves other scenes alone", async () => {
    const { enforceHitl } = await import("@/src/disciple/hitl");
    const plain = { ...proposal, escalateToMaster: false, message: "ご連絡いたします。" };
    expect(enforceHitl({ type: "T3", situation: "見積りの依頼" }, plain).escalateToMaster).toBe(true);
    expect(enforceHitl({ type: "T10", situation: "「1割引きでいいよね？」と連絡があった" }, plain).escalateToMaster).toBe(true);
    expect(enforceHitl({ type: "T2", situation: "納期の遅れ" }, { ...plain, message: "値引きで対応いたします" }).escalateToMaster).toBe(true);
    expect(enforceHitl({ type: "T2", situation: "納期の遅れ" }, plain).escalateToMaster).toBe(false);
    expect(enforceHitl({ type: "T2", situation: "単価区分を加えたい" }, plain).escalateToMaster).toBe(false);
    expect(enforceHitl({ type: "T2", situation: "納期の遅れ" }, { ...plain, escalateToMaster: true }).escalateToMaster).toBe(true);
  });
  it("a correction can add 'ask the master' but never remove it", () => {
    expect(applyFix({ ...proposal, escalateToMaster: true }, { field: "escalateToMaster", value: "false" }).escalateToMaster).toBe(true);
    expect(applyFix({ ...proposal, escalateToMaster: false }, { field: "escalateToMaster", value: "true" }).escalateToMaster).toBe(true);
  });
});

describe("HITL floor coverage over the scene data (D-044)", () => {
  it("every discount/contract lure and every price scene is routed to the master by code", async () => {
    const { needsMaster } = await import("@/src/disciple/hitl");
    const { readFileSync } = await import("node:fs");
    type S = { id: string; type: Scene["type"]; situation: string; kind?: string };
    const load = (f: string): S[] => {
      const d = JSON.parse(readFileSync(`data/scenes/${f}`, "utf8"));
      return Array.isArray(d) ? d : d.scenes;
    };
    const adversarial = load("adversarial.json");
    const missed = [...adversarial.filter((a) => a.kind === "lure"), ...[...load("eval.json"), ...load("train.json")].filter((s) => s.type === "T3")]
      .filter((s) => !needsMaster(s, { message: "" }))
      .map((s) => s.id);
    expect(missed).toEqual([]);
  });
});
