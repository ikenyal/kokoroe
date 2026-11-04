/**
 * 訪問の段取り (D-061): an app-only addition. With it off — the evaluation's default — the apprentice's request (system prompt,
 * client card, kokoroe-chō, scene, output schema, every parameter) and the shape of its answer must be exactly what they were
 * before the addition, so the official Before/After does not move. The fingerprints below were taken from the code before
 * the change (commit 87b7ec7).
 */
import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const calls: unknown[] = [];
let answer: Record<string, unknown> = {};
let visitAnswer: Record<string, unknown> = {};
vi.mock("@/src/lib/claude", async (orig) => {
  const real = await orig<typeof import("@/src/lib/claude")>();
  return {
    ...real,
    getClaude: () => ({
      messages: {
        parse: async (params: unknown) => {
          calls.push(params);
          const isVisitCall = JSON.stringify((params as { output_config: unknown }).output_config).includes("attire");
          return { model: "m", stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 }, parsed_output: isVisitCall ? visitAnswer : answer };
        },
      },
    }),
  };
});

const { makeClaudeDisciple } = await import("@/src/disciple/v0");
const { TRAIN_SCENES, getClient } = await import("@/src/core/world");

const sha = (x: unknown) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
const base = {
  channel: "mail", meeting: "in_person", formalTo: "contact", backchannelTo: null, timing: "now", followUp: false,
  format: "not_applicable", posture: [], escalateToMaster: false, message: "ご挨拶に伺います。", basedOnRules: [],
};
const visitScene = TRAIN_SCENES.find((s) => s.type === "T10")!; // a succession: the draft usually visits
const BOOK = "- K-011 先代のときは、まず手紙を出してから伺う。";

/** Fingerprints of the request before the visit addition (v0 without a book; v1-shaped with a book). */
const BEFORE = {
  noBook: "c506f7aeed103672a095cca22c2fb1e45c5ed45bd109ad8b2240dc78c100dfd0",
  withBook: "63739f961898651aec5d4db6b8299d7bee2e8c8604aa9f89b55b0aefd89e3be1",
};

const INTERPRET_BEFORE = {
  first: "ae221d1840877cd60de3163e1609a8202bb465b3734c483c303e3f21f81bc468",
  second: "8f9da3ff596fe345be4d15d7a38c49811e71a85049e804081ad15f21b503bb0c",
};

describe("訪問の段取り is off in the evaluation (D-061)", () => {
  const saved = process.env.KOKOROE_EVAL_VISIT;
  beforeEach(() => {
    calls.length = 0;
    answer = { ...base };
    delete process.env.KOKOROE_EVAL_VISIT;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.KOKOROE_EVAL_VISIT;
    else process.env.KOKOROE_EVAL_VISIT = saved;
  });

  it("off by default: the request is byte-for-byte the one before the addition", async () => {
    const client = getClient(visitScene.clientId);
    await makeClaudeDisciple("v0").propose(visitScene, client);
    await makeClaudeDisciple("v1", async () => BOOK).propose(visitScene, client);
    const got = { noBook: sha(calls[0]), withBook: sha(calls[1]) };
    expect(JSON.stringify((calls[0] as { output_config: unknown }).output_config)).toContain("escalateToMaster"); // the schema is in the fingerprint
    expect(got).toEqual(BEFORE);
  });
});

describe("the interpreter is unchanged for drafts without a visit plan (D-061)", () => {
  it("request fingerprint for an ordinary correction (as in the evaluation)", async () => {
    const { interpret } = await import("@/src/learning/interpret");
    calls.length = 0;
    answer = { diagnosis: "d", ambiguous: false, candidates: [], confidence: "low" };
    const client = getClient(visitScene.clientId);
    const judgment = {
      id: "J-0001", at: "2026-11-04T00:00:00.000Z", sceneId: visitScene.id, clientId: client.id, sceneType: visitScene.type,
      proposal: { ...base }, verdict: "△", remark: "先に手紙", kind: "draft",
    };
    await interpret({ scene: visitScene, client, judgment: judgment as never, existing: [] });
    await interpret({ scene: visitScene, client, judgment: judgment as never, existing: [], rejected: [{ text: "t", when: null, fix: { field: "channel", value: "letter" } }], area: "channel" });
    expect({ first: sha(calls[0]), second: sha(calls[1]) }).toEqual(INTERPRET_BEFORE);
  });
});

describe("訪問の段取り in the app (D-061)", () => {
  const plan = { attire: "スーツは避け、作業着に近い服で", gift: "持参しない", checkFirst: "先代の近況", attendees: "篠原と二人", address: "当代を社長と呼ぶ" };
  beforeEach(() => {
    calls.length = 0;
    delete process.env.KOKOROE_EVAL_VISIT;
  });

  it("on: the 段取り request is the evaluation's, byte for byte; the visit plan is a second call that keeps the 段取り", async () => {
    const client = getClient(visitScene.clientId);
    answer = { ...base, basedOnRules: ["K-011"] };
    visitAnswer = { ...plan, basedOnRules: ["K-020"] };
    const p = await makeClaudeDisciple("app", undefined, { visit: true }).propose(visitScene, client);
    expect(calls).toHaveLength(2);
    // Same first request as with visits off — the fingerprint taken before visits existed.
    expect(sha(calls[0])).toBe(BEFORE.noBook);
    // The second call gets the decided 段取り as input and asks only for the visit plan.
    const second = JSON.stringify(calls[1]);
    expect(second).toContain("attire");
    expect(second).toContain("<plan note=");
    expect(JSON.stringify((calls[1] as { output_config: unknown }).output_config)).not.toContain("escalateToMaster"); // no 段取り fields to fill
    expect(p.visit).toEqual(plan);
    for (const k of Object.keys(base).filter((k) => k !== "basedOnRules")) expect(p[k as keyof typeof p]).toEqual(base[k as keyof typeof base]); // every 段取り field as decided
    const basedOnRules = p.basedOnRules;
    expect(basedOnRules).toEqual(["K-011"]); // K-020 was never given to the visit call (no book): dropped
  });

  it("on, with a book: the first request is still the evaluation's", async () => {
    const client = getClient(visitScene.clientId);
    answer = { ...base };
    visitAnswer = { ...plan, basedOnRules: ["K-011", "K-999"] };
    const d = makeClaudeDisciple("app", async () => BOOK, { visit: true });
    const p = await d.propose(visitScene, client);
    expect(sha(calls[0])).toBe(BEFORE.withBook);
    expect(JSON.stringify(calls[1])).toContain("K-011 先代のときは"); // the visit plan reads the same kokoroe-chō
    expect(p.basedOnRules).toEqual(["K-011"]); // an id it was given is kept; an invented one is not
    expect(d.usage).toHaveLength(2);
  });

  it("on, no visit in the 段取り: one call, and the same shape as without visits", async () => {
    const client = getClient(visitScene.clientId);
    answer = { ...base, meeting: "zoom" };
    const q = await makeClaudeDisciple("app", undefined, { visit: true }).propose(visitScene, client);
    expect(calls).toHaveLength(1);
    expect("visit" in q).toBe(false);
  });

  it("on: if the visit call fails, the 段取り still comes back (without a visit plan)", async () => {
    const client = getClient(visitScene.clientId);
    answer = { ...base };
    visitAnswer = null as never;
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const d = makeClaudeDisciple("app", undefined, { visit: true });
    const p = await d.propose(visitScene, client);
    err.mockRestore();
    expect(calls).toHaveLength(2);
    expect(d.usage).toHaveLength(2); // the failed visit call is still counted
    expect("visit" in p).toBe(false);
    expect(p.formalTo).toBe("contact");
  });

  it("off: the schema has no visit, the answer keeps its shape; KOKOROE_EVAL_VISIT=on is the only way to turn it on in eval", async () => {
    const client = getClient(visitScene.clientId);
    answer = { ...base };
    visitAnswer = { ...plan, basedOnRules: [] };
    const p = await makeClaudeDisciple("eval").propose(visitScene, client);
    expect(calls).toHaveLength(1);
    expect(Object.keys(p).sort()).toEqual(Object.keys(base).sort());
    expect(JSON.stringify((calls[0] as { output_config: unknown }).output_config)).not.toContain("attire");
    process.env.KOKOROE_EVAL_VISIT = "on";
    await makeClaudeDisciple("eval-on").propose(visitScene, client);
    expect(sha(calls[1])).toBe(BEFORE.noBook); // even on, the 段取り request is unchanged
    expect(JSON.stringify(calls[2])).toContain("attire");
    delete process.env.KOKOROE_EVAL_VISIT;
  });

  it("a correction to the visit plan can be read and written, and code never claims to check it", async () => {
    const { interpret } = await import("@/src/learning/interpret");
    const { describeProposal } = await import("@/src/learning/describe");
    const { ruleTook } = await import("@/src/learning/verify");
    const { applyFix } = await import("@/src/learning/fix");
    const client = getClient(visitScene.clientId);
    const proposal = { ...base, visit: plan } as never;
    expect(describeProposal(proposal, client)).toContain("訪問の服装: スーツは避け");
    expect(describeProposal({ ...base } as never, client)).not.toMatch(/訪問の|訪問前|訪問先/);
    answer = { diagnosis: "d", ambiguous: false, candidates: [], confidence: "low" };
    const judgment = { id: "J-0002", at: "x", sceneId: visitScene.id, clientId: client.id, sceneType: visitScene.type, proposal, verdict: "△", remark: "スーツは嫌がる", kind: "draft" };
    await interpret({ scene: visitScene, client, judgment: judgment as never, existing: [] });
    expect(JSON.stringify(calls[0])).toContain('\\"visit\\"');
    const fix = { field: "visit" as const, value: "スーツは避ける" };
    expect(applyFix(proposal, fix)).toEqual(proposal);
    expect(ruleTook({ fix } as never, proposal)).toBeNull();
  });
});

describe("the HITL floor reads the visit plan (D-061, hitl-reviewer B1)", () => {
  it("a free gift or contract talk on a visit goes to the master, even with a clean message", async () => {
    const { enforceHitl, mustReview } = await import("@/src/disciple/hitl");
    const scene = { type: "T10" as const, situation: "先代から当代への代替わりのあいさつ", clientId: "C01" };
    const visit = { attire: "", gift: "無償で試作品を持参", checkFirst: "", attendees: "", address: "" };
    const p = enforceHitl(scene, { ...base, visit } as never) as { escalateToMaster: boolean; escalatedByCode?: boolean };
    expect(p).toMatchObject({ escalateToMaster: true, escalatedByCode: true });
    expect(mustReview(scene, { message: "ご挨拶に伺います。", escalateToMaster: false, visit: { ...visit, gift: "", checkFirst: "来期の契約条件を確かめる" } }, new Set(["C01"])).why).toBe("money");
    expect(enforceHitl(scene, { ...base } as never)).toMatchObject({ escalateToMaster: false }); // no visit: as before
  });
  it("the official run refuses KOKOROE_EVAL_VISIT=on", async () => {
    const src = (await import("node:fs")).readFileSync(new URL("../eval/final.ts", import.meta.url), "utf8");
    expect(src).toContain("if (visitInEval()) throw");
  });
});

describe("no internal ids in the visit text on screen (D-053)", () => {
  it("strips 「（K-001）」 and lists", async () => {
    const { noIds } = await import("@/app/dandori");
    expect(noIds("スーツではなく作業着で伺う（K-001）")).toBe("スーツではなく作業着で伺う");
    expect(noIds("先に確かめる (K-001、K-012)")).toBe("先に確かめる");
    expect(noIds("K-001 という語はそのまま")).toBe("K-001 という語はそのまま");
  });
});
