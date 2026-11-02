import type { Verdict } from "@/src/core/types";

export interface ScoredScene {
  sceneId: string;
  clientId: string;
  type: string;
  verdict: Verdict;
}

export interface Rates {
  n: number;
  ok: number; // ○
  partial: number; // △
  ng: number; // ×
  matchRate: number; // ○ / n
  okOrPartialRate: number; // (○ + △) / n
}

export function rates(items: { verdict: Verdict }[]): Rates {
  const n = items.length;
  const ok = items.filter((i) => i.verdict === "○").length;
  const partial = items.filter((i) => i.verdict === "△").length;
  const ng = n - ok - partial;
  return {
    n,
    ok,
    partial,
    ng,
    matchRate: n ? ok / n : 0,
    okOrPartialRate: n ? (ok + partial) / n : 0,
  };
}

export function breakdown(items: ScoredScene[], by: "clientId" | "type"): Record<string, Rates> {
  const groups: Record<string, ScoredScene[]> = {};
  for (const i of items) (groups[i[by]] ??= []).push(i);
  return Object.fromEntries(Object.entries(groups).sort().map(([k, v]) => [k, rates(v)]));
}

export const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

/** Mean and sample standard deviation (sd = 0 for a single run). */
export function meanSd(xs: number[]): { mean: number; sd: number; n: number; min: number; max: number } {
  const n = xs.length;
  const mean = n ? xs.reduce((a, b) => a + b, 0) / n : 0;
  const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  return { mean, sd, n, min: Math.min(...xs), max: Math.max(...xs) };
}
