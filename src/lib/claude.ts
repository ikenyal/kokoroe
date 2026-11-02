import Anthropic from "@anthropic-ai/sdk";

/**
 * Model roles (see docs/decisions.md D-002):
 * - disciple: drafts and successor Q&A must come back in seconds
 * - editor: interpreting corrections / compiling the kokoroe-chō (judgment-heavy, async)
 * - simulator: cheap bulk runs for evaluation
 */
export const MODELS = {
  disciple: process.env.KOKOROE_MODEL_DISCIPLE ?? "claude-sonnet-5-5",
  editor: process.env.KOKOROE_MODEL_EDITOR ?? "claude-opus-5-5",
  simulator: process.env.KOKOROE_MODEL_SIMULATOR ?? "claude-haiku-5-5",
} as const;

let client: Anthropic | undefined;

/** Server-side only. Reads ANTHROPIC_API_KEY from the environment (.env.local in dev). */
export function getClaude(): Anthropic {
  if (typeof window !== "undefined") {
    throw new Error("getClaude() must not run in the browser");
  }
  client ??= new Anthropic();
  return client;
}

/**
 * Prompt caching (D-027). The fixed parts — system prompt (+ output schema before it) and, per client, the client card and
 * kokoroe-chō — are marked with cache_control so repeated calls read them from cache. KOKOROE_CACHE=0 turns it off (for A/B).
 */
export const cacheEnabled = () => process.env.KOKOROE_CACHE !== "0";

export function textBlock(text: string, cache: boolean): Anthropic.TextBlockParam {
  return cache && cacheEnabled() ? { type: "text", text, cache_control: { type: "ephemeral" } } : { type: "text", text };
}

/** System prompt as a cached block. */
export const cachedSystem = (text: string): Anthropic.TextBlockParam[] => [textBlock(text, true)];

export interface Usage {
  model: string;
  input_tokens: number; // uncached input
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  ms?: number; // wall-clock latency of the call
}

export function usageOf(res: { model: string; usage: Anthropic.Usage }, ms: number): Usage {
  return {
    model: res.model,
    input_tokens: res.usage.input_tokens,
    output_tokens: res.usage.output_tokens,
    cache_creation_input_tokens: res.usage.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: res.usage.cache_read_input_tokens ?? 0,
    ms,
  };
}
