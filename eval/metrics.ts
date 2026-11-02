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
