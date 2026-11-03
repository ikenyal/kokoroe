/**
 * Loader for the hidden ground truth. ONLY the simulator may import this file (D-005).
 */
import rulesFile from "@/data/hidden/rules.json";
import traitsFile from "@/data/hidden/client-traits.json";
import sceneKeysFile from "@/data/hidden/scene-keys.json";
import historyAnswersFile from "@/data/hidden/history-answers.json";
import type { HistoryEntry } from "@/src/core/types";
import { ownEnabled } from "@/src/core/own-world";

// The evaluation runs on the fictional world only: with KOKOROE_OWN=1 set in the shell it would quietly use your own ledger.
if (ownEnabled()) throw new Error("KOKOROE_OWN=1 is set: the evaluation runs on the fictional company only — unset it first");

export type RuleId = string;

export interface HiddenRule {
  id: RuleId;
  scope: string; // "all" or a client id
  text: string;
  remarks: Record<string, string[]>; // keyed by failure reason; "default" when a rule has one
  history?: (HistoryEntry & { short?: string })[]; // short = how the master says the trigger when asked why
}

/** Tacit traits only (D-009): explicit constraints live in the public client ledger. */
export interface ClientTraits {
  power: "above" | "equal" | "below";
  values: string;
  valuesSeasonalGreetings?: boolean;
}

export interface HistoryAnswer {
  ruleId: RuleId;
  expectedAnswer: "yes" | "no";
  keywordGroups: string[][];
}

export const HIDDEN_RULES = rulesFile.rules as unknown as HiddenRule[];

/** Drop the human-readable "_note" field that the data files carry. */
function withoutNote(o: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).filter(([k]) => k !== "_note"));
}

export const CLIENT_TRAITS = withoutNote(traitsFile) as Record<string, ClientTraits>;
export const SCENE_KEYS = withoutNote(sceneKeysFile) as Record<string, { rules: RuleId[] }>;
export const HISTORY_ANSWERS = withoutNote(historyAnswersFile) as unknown as Record<string, HistoryAnswer>;

export function getRule(id: RuleId): HiddenRule {
  const r = HIDDEN_RULES.find((x) => x.id === id);
  if (!r) throw new Error(`unknown rule ${id}`);
  return r;
}
