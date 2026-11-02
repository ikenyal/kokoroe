import type { Proposal, SceneType, Verdict } from "@/src/core/types";

/** Where a rule applies. Rules start narrow (one client) and are widened only on evidence. */
export interface RuleScope {
  clientId: string | null; // null = all clients
  sceneTypes: SceneType[] | null; // null = all scene types
}

/** The master's judgment a rule was learned from (出典). */
export interface RuleSource {
  judgmentId: string;
  date: string; // ISO date
  sceneId: string;
  verdict: Verdict;
  remark: string;
}

/** One change to a rule (沿革). Written into the rule body so it survives outside any version history. */
export interface RuleChange {
  date: string;
  before: string | null; // null = rule was created
  after: string;
  judgmentId: string;
  masterWords: string;
  reason: string; // the interpreter's reading of what was different
}

export interface KokoroeRule {
  id: string; // K-001 ...
  scope: RuleScope;
  text: string; // the rule, in Japanese, with its conditions
  status: "active" | "retired";
  confidence: "low" | "medium" | "high";
  sources: RuleSource[];
  history: RuleChange[];
}

/** One judgment by the master (or the simulator standing in for the master). */
export interface JudgmentRecord {
  id: string; // J-0001 ...
  at: string;
  sceneId: string;
  clientId: string;
  sceneType: SceneType;
  proposal: Proposal;
  verdict: Verdict;
  remark: string;
}
