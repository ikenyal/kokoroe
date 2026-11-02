/**
 * The master's one-liner. Shinohara is terse and sometimes says nothing at all.
 * Deterministic given a seed, so evaluation runs are reproducible.
 */
import type { Verdict } from "@/src/core/types";
import { getRule } from "./hidden";
import type { RuleCheck } from "./judge";

/** mulberry32 — tiny seeded PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SILENCE_RATE = 0.2;

export function remarkFor(verdict: Verdict, checks: RuleCheck[], rand: () => number): string {
  if (verdict === "○") return "";
  if (rand() < SILENCE_RATE) return ""; // said nothing, just the mark
  // Speak about the most serious problem first.
  const worst =
    checks.find((c) => c.outcome === "violation") ?? checks.find((c) => c.outcome === "partial");
  if (!worst) return "";
  const lists = getRule(worst.ruleId).remarks;
  const options = lists[worst.remarkKey ?? "default"] ?? lists.default ?? Object.values(lists)[0] ?? [];
  return options[Math.floor(rand() * options.length)] ?? "";
}
