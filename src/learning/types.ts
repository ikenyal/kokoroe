import type { Client, Proposal, Scene, SceneType, Verdict } from "@/src/core/types";

/** Where a rule applies. Rules start narrow (one client) and are widened only on evidence. */
export interface RuleScope {
  clientId: string | null; // null = all clients
  sceneTypes: SceneType[] | null; // null = all scene types
}

/** The master's judgment a rule was learned from (出典). */
export interface RuleSource {
  judgmentId: string;
  date: string; // JST date
  sceneId: string;
  verdict: Verdict;
  remark: string;
}

/**
 * One change to a rule (沿革): old → new, trigger, date, source.
 * Written into the rule body so it survives outside any version history and is exported with the skill.
 */
export interface RuleChange {
  date: string; // JST date
  before: string | null; // null = rule was created
  after: string;
  trigger: string | null; // why it became so, in the master's words (asked once, optional)
  judgmentId: string; // source judgment
  masterWords: string; // the remark on that judgment
  reason: string; // the interpreter's reading of what was different
}

export interface KokoroeRule {
  id: string; // K-001 ...
  scope: RuleScope;
  text: string; // short rule, one sentence (what to do)
  when: string | null; // condition / exception, if any
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

/** A field change that a candidate reading implies for the proposal ("if the master meant this, the draft should have …"). */
export interface ProposalFix {
  field: "channel" | "meeting" | "formalTo" | "backchannelTo" | "timing" | "followUp" | "format" | "posture" | "escalateToMaster";
  value: string; // enum value; "true"/"false" for booleans; "null" for no backchannel; a posture tag to add
}

/** One possible reading of the master's △/× (shown to the master as a one-tap choice when ambiguous). */
export interface Candidate {
  action: "add" | "revise";
  targetRuleId: string | null;
  scope: RuleScope;
  text: string;
  when: string | null;
  fix: ProposalFix;
}

/**
 * The master, as the learning loop sees them. The real master taps in the UI; in evaluation the simulator answers
 * from the hidden kokoroe (the way a real master knows their own intent).
 */
export interface Master {
  judge(scene: Scene, client: Client, p: Proposal): Promise<{ verdict: Verdict; remark: string }>;
  /** Pick the reading the master meant. null = "none of these". */
  choose(args: { scene: Scene; client: Client; proposal: Proposal; candidates: Candidate[] }): Promise<number | null>;
  /** Optional: why is it so? One short line, or "" for no comment. Asked once, when a rule is created. */
  why(args: { scene: Scene; client: Client; rule: KokoroeRule; candidate: Candidate }): Promise<string>;
}
