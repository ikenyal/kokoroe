/**
 * The simulated master (篠原). Answers the learning loop's three questions from the hidden kokoroe:
 *   judge  — ○/△/× with a short remark (machine-checked, D-004)
 *   choose — which reading the master meant: apply each candidate's implied fix to the draft and keep the one that
 *            clears the most serious failed check (the way a real master knows their own intent). None → null.
 *   why    — if the hidden rule behind the reading has a history, say the trigger in one breath; otherwise nothing.
 */
import type { Client, Proposal, Scene } from "@/src/core/types";
import { applyFix } from "@/src/learning/fix";
import type { Candidate, Master, ProposalFix } from "@/src/learning/types";
import { getRule, HIDDEN_RULES } from "./hidden";
import { judge, type RuleCheck } from "./judge";
import { remarkFor, rng } from "./remark";

export interface SimulatedMaster extends Master {
  /** Log only (never shown to the apprentice): failed hidden rules of the latest judgment. */
  lastFailing(): string[];
  /** Log only: failed hidden rules of every judgment so far, in order. */
  failingLog(): string[][];
}

const norm = (s: string) => s.replace(/[\s、。・（）()「」:：,.]/g, "");

/** Does `a` share a substring of ≥ n characters with `b`? (mechanical topic match, no LLM) */
function shares(a: string, b: string, n = 3): boolean {
  const x = norm(a);
  const y = norm(b);
  for (let i = 0; i + n <= x.length; i++) if (y.includes(x.slice(i, i + n))) return true;
  return false;
}

/** The client's hidden rule whose recorded change (旧 → 新) is about this ledger constraint, if any. */
export function historyBehindConstraint(clientId: string, constraint: string): string | null {
  for (const r of HIDDEN_RULES) {
    const h = r.history?.[0];
    if (r.scope === clientId && h && shares(constraint, `${h.before}${h.after}`)) return r.id;
  }
  return null;
}

/** Which failed hidden rule (most serious first) would this fix have cleared on this draft? */
export function hiddenRuleFixedBy(scene: Scene, client: Client, proposal: Proposal, fix: ProposalFix): string | null {
  const before = judge(scene, client, proposal).checks.filter((c) => c.outcome !== "ok");
  const after = judge(scene, client, applyFix(proposal, fix)).checks;
  const order = [...before.filter((x) => x.outcome === "violation"), ...before.filter((x) => x.outcome === "partial")];
  return order.find((f) => after.find((a) => a.ruleId === f.ruleId)?.outcome === "ok")?.ruleId ?? null;
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

    async confirmGeneralization({ members }) {
      // Yes only if every member's correction was about the same hidden rule, and that rule holds for all clients.
      const ids = members.map((m) => hiddenRuleFixedBy(m.scene, m.client, m.proposal, m.fix));
      const first = ids[0];
      return !!first && ids.every((id) => id === first) && getRule(first).scope === "all";
    },

    async why({ candidate, client, rule }) {
      // Learned from a correction: the hidden rule this reading clears.
      // Seeded from the ledger: the client's hidden rule whose history (旧/新) is about this very constraint.
      const ruleId = candidate ? ruleClearedBy(candidate) : historyBehindConstraint(client.id, rule.text);
      const h = ruleId ? getRule(ruleId).history?.[0] : undefined;
      return h?.short ? `${h.year}年、${h.short}` : "";
    },
  };
}
