/**
 * Boundary and failure cases for small helpers the learning loop, the 帳場 and the public demo rely on.
 * Tests only: no behavior is changed here. Where a test pins down a surprising current behavior, its name says so.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Proposal, Scene } from "@/src/core/types";
import { enforceHitl, escalatedByModel, needsMaster } from "@/src/disciple/hitl";
import { applyFix, jstDate } from "@/src/learning/fix";
import { stampNewEntries } from "@/src/learning/store";
import type { KokoroeRule, ProposalFix } from "@/src/learning/types";
import { ruleTook } from "@/src/learning/verify";
import { estimateUsd } from "@/src/lib/cost";

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
const rule = (fix?: ProposalFix): KokoroeRule =>
  ({
    id: "K-101",
    scope: { clientId: "C06", sceneTypes: null },
    text: "（テスト用の心得）",
    when: null,
    status: "active",
    confidence: "medium",
    sources: [],
    history: [],
    ...(fix ? { fix } : {}),
  }) as KokoroeRule;

describe("ruleTook — did the re-solved draft follow the new rule? (D-045)", () => {
  it("returns null when the rule has no field to check", () => {
    expect(ruleTook(rule(), proposal)).toBeNull();
  });
  it("true when the draft already has the rule's value, false when it doesn't", () => {
    expect(ruleTook(rule({ field: "meeting", value: "phone_call" }), proposal)).toBe(true);
    expect(ruleTook(rule({ field: "meeting", value: "in_person" }), proposal)).toBe(false);
    expect(ruleTook(rule({ field: "backchannelTo", value: "decider" }), proposal)).toBe(false);
    expect(ruleTook(rule({ field: "backchannelTo", value: "null" }), proposal)).toBe(true);
  });
  it("posture: took only if the tag is present", () => {
    expect(ruleTook(rule({ field: "posture", value: "modest" }), proposal)).toBe(false);
    expect(ruleTook(rule({ field: "posture", value: "modest" }), { ...proposal, posture: ["modest"] })).toBe(true);
  });
  it("booleans: escalation and follow-up", () => {
    expect(ruleTook(rule({ field: "escalateToMaster", value: "true" }), proposal)).toBe(false);
    expect(ruleTook(rule({ field: "escalateToMaster", value: "true" }), { ...proposal, escalateToMaster: true })).toBe(true);
    expect(ruleTook(rule({ field: "followUp", value: "true" }), proposal)).toBe(false);
  });
  it("current behavior: a value it cannot apply counts as 'took' (the rule is kept, never withdrawn on an unreadable fix)", () => {
    expect(ruleTook(rule({ field: "meeting", value: "fax" }), proposal)).toBe(true);
    expect(ruleTook(rule({ field: "escalateToMaster", value: "false" }), { ...proposal, escalateToMaster: true })).toBe(true);
  });
});

describe("applyFix — returns a new proposal, never edits the one it was given", () => {
  it("does not mutate the input, including its posture array", () => {
    const p = { ...proposal, posture: ["concise"] as Proposal["posture"] };
    const q = applyFix(p, { field: "posture", value: "modest" });
    expect(p.posture).toEqual(["concise"]);
    expect(q.posture).toEqual(["concise", "modest"]);
  });
  it("adds a posture tag once, and ignores tags that don't exist", () => {
    const p = { ...proposal, posture: ["modest"] as Proposal["posture"] };
    expect(applyFix(p, { field: "posture", value: "modest" }).posture).toEqual(["modest"]);
    expect(applyFix(p, { field: "posture", value: "shout" }).posture).toEqual(["modest"]);
  });
  it("an escalation can only be switched on by a fix, never off (D-044)", () => {
    expect(applyFix({ ...proposal, escalateToMaster: true }, { field: "escalateToMaster", value: "false" }).escalateToMaster).toBe(true);
  });
  it("unknown enum values leave the field as it was", () => {
    expect(applyFix(proposal, { field: "channel", value: "fax" }).channel).toBe("phone");
    expect(applyFix(proposal, { field: "timing", value: "" }).timing).toBe("now");
  });
});

describe("jstDate — the 沿革 date is the Japanese calendar day", () => {
  it("rolls over at 15:00 UTC (midnight JST), not at midnight UTC", () => {
    expect(jstDate("2026-11-03T14:59:59Z")).toBe("2026-11-03");
    expect(jstDate("2026-11-03T15:00:00Z")).toBe("2026-11-04");
    expect(jstDate("2026-12-31T15:00:00Z")).toBe("2027-01-01");
  });
});

describe("stampNewEntries — only new 沿革 lines get the save time (changes_since, D-042)", () => {
  const h = (after: string, extra: Partial<KokoroeRule["history"][number]> = {}) =>
    ({ date: "2026-11-03", before: null, after, trigger: null, judgmentId: "J-0001", masterWords: "", reason: "", ...extra }) as KokoroeRule["history"][number];
  it("stamps a new line, leaves known lines alone, and matches by content rather than position", () => {
    const stored = [h("A"), h("B")];
    const next = [h("B"), h("A"), h("C")];
    const out = stampNewEntries(stored, next, "2026-11-04T00:00:00Z");
    expect(out.map((x) => x.at)).toEqual([undefined, undefined, "2026-11-04T00:00:00Z"]);
  });
  it("never overwrites a time a line already has", () => {
    const out = stampNewEntries([], [h("A", { at: "2026-11-01T00:00:00Z" })], "2026-11-04T00:00:00Z");
    expect(out[0].at).toBe("2026-11-01T00:00:00Z");
  });
  it("an empty history stays empty", () => {
    expect(stampNewEntries([], [])).toEqual([]);
  });
});

describe("HITL floor edge cases (D-044)", () => {
  const sc = (type: Scene["type"], situation: string) => ({ type, situation });
  it("a plain scene and a plain draft are left exactly as they were", () => {
    const p = { ...proposal, message: "納期のご連絡です。" };
    expect(needsMaster(sc("T1", "納期が1日遅れる"), p)).toBe(false);
    expect(enforceHitl(sc("T1", "納期が1日遅れる"), p)).toBe(p);
  });
  it("a price word in the apprentice's own draft is enough, even if the scene doesn't mention it", () => {
    const p = { ...proposal, message: "今回は特別に割引いたします。" };
    const q = enforceHitl(sc("T1", "納期が1日遅れる"), p);
    expect(q.escalateToMaster).toBe(true);
    expect(q.escalatedByCode).toBe(true);
    expect(p.escalateToMaster).toBe(false); // input untouched
  });
  it("when the model already escalated, the code does not take the credit", () => {
    const p = { ...proposal, escalateToMaster: true };
    const q = enforceHitl(sc("T3", "値引きを求められた"), p);
    expect(q.escalatedByCode).toBeUndefined();
    expect(escalatedByModel(q)).toBe(true);
  });
  it("a floored draft is not counted as the model's own escalation", () => {
    expect(escalatedByModel(enforceHitl(sc("T3", "（場面）"), proposal))).toBe(false);
  });
});

describe("estimateUsd — the daily spend guard's arithmetic", () => {
  it("prices input, output and cache writes/reads per 1M tokens", () => {
    expect(estimateUsd([{ model: "claude-sonnet-5-5", input_tokens: 1_000_000, output_tokens: 0 }])).toBeCloseTo(2);
    expect(estimateUsd([{ model: "claude-opus-5-5", input_tokens: 0, output_tokens: 1_000_000 }])).toBeCloseTo(20);
    expect(estimateUsd([{ model: "claude-sonnet-5-5", input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000 }])).toBeCloseTo(2.5);
    expect(estimateUsd([{ model: "claude-sonnet-5-5", input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000 }])).toBeCloseTo(0.2);
  });
  it("a dated model id is priced by its family; nothing in → nothing out", () => {
    expect(estimateUsd([{ model: "claude-sonnet-5-5-20261101", input_tokens: 1_000_000, output_tokens: 0 }])).toBeCloseTo(2);
    expect(estimateUsd([])).toBe(0);
  });
  it("an unknown model stops an evaluation's estimate with an error that names it (never a silent $0)", () => {
    expect(() => estimateUsd([{ model: "some-other-model", input_tokens: 1, output_tokens: 1 }])).toThrow(/unknown model "some-other-model"/);
    expect(() => estimateUsd([{ model: "some-other-model", input_tokens: 1, output_tokens: 1 }], "throw")).toThrow();
  });
  it("the public guard counts an unknown model at the highest price in the table (the safe side)", () => {
    const usd = estimateUsd([{ model: "some-other-model", input_tokens: 1_000_000, output_tokens: 1_000_000 }], "max");
    expect(usd).toBeCloseTo(4 + 20); // Opus 5.5's input and output prices are the highest
    expect(usd).toBeGreaterThanOrEqual(
      estimateUsd([{ model: "claude-opus-5-5", input_tokens: 1_000_000, output_tokens: 1_000_000 }]),
    );
    // a known model is priced the same either way
    expect(estimateUsd([{ model: "claude-sonnet-5-5", input_tokens: 1_000_000, output_tokens: 0 }], "max")).toBeCloseTo(2);
  });
});

describe("public-demo limits across time boundaries (D-032)", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });
  const fresh = async (env: Record<string, string>) => {
    vi.stubEnv("KOKOROE_DATA_DIR", mkdtempSync(path.join(tmpdir(), "kokoroe-bound-")));
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    vi.resetModules();
    return import("@/src/server/limits");
  };
  it("the per-IP count starts again in the next hour", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-03T01:59:00Z"));
    const { reserve } = await fresh({ KOKOROE_IP_CALLS_PER_HOUR: "1", KOKOROE_SESSION_CALLS: "100" });
    expect(reserve("s1", "1.1.1.1")).toBeNull();
    expect(reserve("s2", "1.1.1.1")).toBe("ip");
    vi.setSystemTime(new Date("2026-11-03T02:00:00Z"));
    expect(reserve("s3", "1.1.1.1")).toBeNull();
  });
  it("the daily spend resets at midnight JST (15:00 UTC), not at midnight UTC", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-03T14:00:00Z")); // 23:00 JST
    const { reserve, recordSpend, dailyExhausted } = await fresh({ KOKOROE_DAILY_USD: "0.01" });
    recordSpend([{ model: "claude-sonnet-5-5", input_tokens: 0, output_tokens: 2000 }]); // $0.02
    expect(dailyExhausted()).toBe(true);
    vi.setSystemTime(new Date("2026-11-03T14:59:59Z"));
    expect(reserve("s1", "1.1.1.1")).toBe("daily");
    vi.setSystemTime(new Date("2026-11-03T15:00:00Z")); // 00:00 JST
    expect(dailyExhausted()).toBe(false);
    expect(reserve("s1", "1.1.1.1")).toBeNull();
  });
  it("a refused call is not counted against the day's total", async () => {
    const { reserve } = await fresh({ KOKOROE_SESSION_CALLS: "2", KOKOROE_GLOBAL_CALLS_PER_DAY: "3", KOKOROE_IP_CALLS_PER_HOUR: "100" });
    expect(reserve("s1", "1.1.1.1")).toBeNull();
    expect(reserve("s1", "1.1.1.1")).toBeNull();
    expect(reserve("s1", "1.1.1.1")).toBe("session"); // refused: must not use up the global budget
    expect(reserve("s2", "1.1.1.1")).toBeNull(); // the 3rd counted call
    expect(reserve("s3", "1.1.1.1")).toBe("daily");
  });
  it("spend from an unknown model is counted at the highest price, so the daily guard still trips", async () => {
    const { recordSpend, dailyExhausted } = await fresh({ KOKOROE_DAILY_USD: "0.01" });
    recordSpend([{ model: "some-future-model", input_tokens: 0, output_tokens: 1000 }]); // $0.02 at the highest output price
    expect(dailyExhausted()).toBe(true);
  });
  it("recording an empty usage list changes nothing", async () => {
    const { recordSpend, dailyExhausted } = await fresh({ KOKOROE_DAILY_USD: "0.000001" });
    recordSpend([]);
    expect(dailyExhausted()).toBe(false);
  });
  it("session starts per IP also start again in the next hour", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-03T01:30:00Z"));
    const { reserveStart } = await fresh({ KOKOROE_IP_STARTS_PER_HOUR: "1" });
    expect(reserveStart("9.9.9.9")).toBe(true);
    expect(reserveStart("9.9.9.9")).toBe(false);
    vi.setSystemTime(new Date("2026-11-03T02:00:00Z"));
    expect(reserveStart("9.9.9.9")).toBe(true);
  });
  it("odd X-Forwarded-For values: too many hops, zero hops, an oversized entry", async () => {
    const { trustedClientIp, LIMIT_MESSAGE } = await fresh({});
    expect(trustedClientIp("203.0.113.7", 3)).toBe("203.0.113.7"); // more hops than entries → the first one
    expect(trustedClientIp("203.0.113.7", 0)).toBe("direct");
    expect(trustedClientIp(", ,")).toBe("direct");
    expect(trustedClientIp("x".repeat(500))).toHaveLength(64); // a huge header can't become a huge counter key
    expect(Object.keys(LIMIT_MESSAGE).sort()).toEqual(["daily", "ip", "session"]);
  });
});
