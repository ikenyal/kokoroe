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
