import type { Client, Proposal, Scene, SceneType, Verdict } from "@/src/core/types";

/** Where a rule applies. Rules start narrow (one client) and are widened only on evidence. */
export interface RuleScope {
  clientId: string | null; // null = all clients
  sceneTypes: SceneType[] | null; // null = all scene types
}

/** Where a rule came from (出典): a master's judgment, or the client ledger's explicit constraints (台帳). */
export interface RuleSource {
  kind?: "judgment" | "ledger"; // undefined = judgment (older stores)
  judgmentId: string; // "LEDGER-<clientId>" for ledger sources
  date: string; // JST date
  sceneId: string; // "" for ledger sources
  verdict: Verdict | null; // null for ledger sources
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
  origin?: "master" | "ledger"; // undefined = master (learned from a judgment). Shown distinctly in the kokoroe-chō.
  fix?: ProposalFix; // the proposal field this rule is about (from the chosen reading) — used to spot the same habit elsewhere
  mergedInto?: string; // set when this client rule was folded into a company-wide rule
  declinedMerge?: string[]; // rule ids the master declined (or a regression rejected) merging with — don't ask again
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
  kind?: "draft" | "confirm" | "regression"; // draft = first proposal for the scene (default)
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
  /**
   * Optional: why is it so? One short line, or "" to skip. Asked once per rule — when a rule is learned from a correction
   * (scene + candidate given), or once per ledger-seeded rule (no scene/candidate).
   */
  why(args: { scene?: Scene; client: Client; rule: KokoroeRule; candidate?: Candidate }): Promise<string>;
  /**
   * One tap: "the same correction showed up for several clients — make it a company-wide rule?" (HITL: never widened silently).
   * `members` are the corrections behind the client rules being merged.
   */
  confirmGeneralization(args: { proposed: { text: string; when: string | null }; members: GeneralizationMember[] }): Promise<boolean>;
}

export interface GeneralizationMember {
  rule: KokoroeRule;
  scene: Scene;
  client: Client;
  proposal: Proposal; // the draft the master corrected
  fix: ProposalFix;
}
