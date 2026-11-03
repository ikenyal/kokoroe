/** Rough USD estimate from token usage (list prices per 1M tokens, Anthropic API, as of 2026-11). */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};
// Prompt caching (5-minute TTL): writes cost 1.25× input, reads 0.1× input.
const CACHE_WRITE = 1.25;
const CACHE_READ = 0.1;

/** The highest per-token price in the table — what an unknown model is charged at when we must not under-count. */
const MAX_PRICE = {
  input: Math.max(...Object.values(PRICES).map((p) => p.input)),
  output: Math.max(...Object.values(PRICES).map((p) => p.output)),
};

/**
 * What to do with a model name that is not in the table:
 *   "throw" (default) — evaluation: stop and say so, so a run never reports a cost that silently left calls out;
 *   "max" — the public demo's daily spend guard: count it at the highest price (the safe side; a guard must not see $0).
 */
export type UnknownModel = "throw" | "max";

export function priceOf(model: string, onUnknown: UnknownModel = "throw"): { input: number; output: number } {
  const p = PRICES[model] ?? PRICES[Object.keys(PRICES).find((k) => model.startsWith(k)) ?? ""];
  if (p) return p;
  if (onUnknown === "max") return MAX_PRICE;
  throw new Error(`unknown model "${model}" in the cost estimate — add its price to src/lib/cost.ts`);
}

export function estimateUsd(
  usage: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }[],
  onUnknown: UnknownModel = "throw",
): number {
  return usage.reduce((sum, u) => {
    const p = priceOf(u.model, onUnknown);
    const input =
      u.input_tokens + (u.cache_creation_input_tokens ?? 0) * CACHE_WRITE + (u.cache_read_input_tokens ?? 0) * CACHE_READ;
    return sum + (input * p.input + u.output_tokens * p.output) / 1_000_000;
  }, 0);
}
