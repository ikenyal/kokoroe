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
vi.mock("@/src/lib/claude", async (orig) => {
  const real = await orig<typeof import("@/src/lib/claude")>();
  return {
    ...real,
    getClaude: () => ({
      messages: {
        parse: async (params: unknown) => {
          calls.push(params);
          return { model: "m", stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 }, parsed_output: answer };
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
