/**
 * Apprentice v1 — v0 plus the kokoroe-chō: the rules relevant to this client and scene type are put into the prompt.
 * Pure 台帳 rules (only a ledger source) are NOT shown: the constraint is already on the client card, and presenting it again
 * as "the master's corrections, which take precedence" over-weighted it (E13 dropped ○○○ → △×× in curve v3; D-022).
 * They stay in the kokoroe-chō for their history and for the successor. Once the master revised one, it is shown.
 */
import type { KokoroeStore } from "@/src/learning/store";
import { describeRules } from "@/src/learning/describe";
import type { KokoroeRule } from "@/src/learning/types";
import { makeClaudeDisciple } from "./v0";

export const isPureLedger = (r: KokoroeRule) => r.sources.length > 0 && r.sources.every((s) => s.kind === "ledger");

/** `opts.visit`: 訪問の段取り (D-061) — the app passes visitInApp(); the evaluation passes nothing (off by default). */
export function makeDiscipleV1(store: KokoroeStore, name = "v1-kokoroe", opts: { visit?: boolean } = {}) {
  return makeClaudeDisciple(
    name,
    async (scene, client) => describeRules((await store.rulesFor(client.id, scene.type)).filter((r) => !isPureLedger(r))),
    opts,
  );
}
