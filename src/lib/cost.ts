/** Rough USD estimate from token usage (list prices per 1M tokens, Anthropic API, as of 2026-11). */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};
// Prompt caching (5-minute TTL): writes cost 1.25× input, reads 0.1× input.
const CACHE_WRITE = 1.25;
const CACHE_READ = 0.1;

export function estimateUsd(
  usage: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }[],
): number {
  return usage.reduce((sum, u) => {
    const p = PRICES[u.model] ?? PRICES[Object.keys(PRICES).find((k) => u.model.startsWith(k)) ?? ""];
    if (!p) return sum;
    const input =
      u.input_tokens + (u.cache_creation_input_tokens ?? 0) * CACHE_WRITE + (u.cache_read_input_tokens ?? 0) * CACHE_READ;
    return sum + (input * p.input + u.output_tokens * p.output) / 1_000_000;
  }, 0);
}
