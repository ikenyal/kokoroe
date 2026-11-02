/**
 * The simulated master (篠原). Answers the learning loop's three questions from the hidden kokoroe:
 *   judge  — ○/△/× with a short remark (machine-checked, D-004)
 *   choose — which reading the master meant: apply each candidate's implied fix to the draft and keep the one that
 *            clears the most serious failed check (the way a real master knows their own intent). None → null.
 *   why    — if the hidden rule behind the reading has a history, say the trigger in one breath; otherwise nothing.
 */
import type { Client, Proposal, Scene } from "@/src/core/types";
import { applyFix } from "@/src/learning/fix";
import type { Candidate, Master } from "@/src/learning/types";
import { getRule } from "./hidden";
import { judge, type RuleCheck } from "./judge";
import { remarkFor, rng } from "./remark";

export interface SimulatedMaster extends Master {
  /** Log only (never shown to the apprentice): failed hidden rules of the latest judgment. */
  lastFailing(): string[];
  /** Log only: failed hidden rules of every judgment so far, in order. */
  failingLog(): string[][];
}

export function createSimulatedMaster(seed = 7): SimulatedMaster {
  const rand = rng(seed);
  let last: { scene: Scene; client: Client; proposal: Proposal; failing: RuleCheck[] } | null = null;
  const log: string[][] = [];

  /** Which failed hidden rule (most serious first) would this reading have cleared? */
  function ruleClearedBy(c: Candidate): string | null {
    if (!last) return null;
    const { scene, client, proposal, failing } = last;
    const after = judge(scene, client, applyFix(proposal, c.fix)).checks;
    const order = [...failing.filter((x) => x.outcome === "violation"), ...failing.filter((x) => x.outcome === "partial")];
    const cleared = order.find((f) => after.find((a) => a.ruleId === f.ruleId)?.outcome === "ok");
    return cleared?.ruleId ?? null;
  }

  return {
    lastFailing: () => last?.failing.map((c) => c.ruleId) ?? [],
    failingLog: () => log,

    async judge(scene, client, proposal) {
      const r = judge(scene, client, proposal);
      last = { scene, client, proposal, failing: r.checks.filter((c) => c.outcome !== "ok") };
      log.push(last.failing.map((c) => c.ruleId));
      return { verdict: r.verdict, remark: remarkFor(r.verdict, r.checks, rand) };
    },

    async choose({ candidates }) {
      // The reading that clears the most serious problem wins; ties go to the interpreter's order.
      const severity = (ruleId: string | null) =>
        ruleId === null ? Infinity : last!.failing.findIndex((f) => f.ruleId === ruleId && f.outcome === "violation") >= 0 ? 0 : 1;
      let best: number | null = null;
      for (let i = 0; i < candidates.length; i++) {
        const r = ruleClearedBy(candidates[i]);
        if (r === null) continue;
        if (best === null || severity(r) < severity(ruleClearedBy(candidates[best]))) best = i;
      }
      return best; // null = none of these
    },

    async why({ candidate }) {
      const ruleId = ruleClearedBy(candidate);
      const h = ruleId ? getRule(ruleId).history?.[0] : undefined;
      return h?.short ? `${h.year}年、${h.short}` : "";
    },
  };
}
