/**
 * Domain types shared by the product and the evaluation harness.
 * A Proposal is deliberately made of enums so the master simulator can judge it with code, not an LLM (D-004).
 */

export type SceneType =
  | "T1" // bad news (delay etc.)
  | "T2" // spec change
  | "T3" // quote / price
  | "T4" // new proposal
  | "T5" // client's contact person changed
  | "T6" // seasonal greeting
  | "T7" // incident first response
  | "T8" // scheduling a meeting
  | "T9" // groundwork for a big decision (nemawashi)
  | "T10"; // client's leadership succession

export const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  T1: "悪い知らせ",
  T2: "仕様変更の相談",
  T3: "見積り・金額の提示",
  T4: "新しい提案",
  T5: "担当者の交代",
  T6: "季節・節目のあいさつ",
  T7: "トラブルの初動",
  T8: "打ち合わせの日程調整",
  T9: "根回しが要る案件",
  T10: "先方の代替わり",
};

/** What the apprentice is allowed to know about a client: ledger/CRM-level facts incl. explicit constraints (D-009). */
export interface Client {
  id: string; // C01..C10
  name: string; // fictional
  slug: string; // for file names / skill paths
  industry: string;
  relationshipYears: number;
  contact: string; // formal point of contact (title)
  decider: string; // decision maker (title); same as contact when contactIsDecider
  contactIsDecider: boolean;
  constraints: string; // explicit facts a ledger/CRM would hold: allowed tools, formats, fiscal/busy months (D-009)
  busyMonths: number[];
}

export interface Company {
  name: string;
  description: string;
  master: { name: string; role: string };
  successor: { name: string; role: string };
  apprentice: { name: string };
}

export interface Scene {
  id: string;
  set: "train" | "eval";
  clientId: string;
  type: SceneType;
  month: number; // 1-12
  situation: string;
}

export interface HistoryQuestion {
  id: string;
  clientId: string;
  question: string;
}

/** How the message is sent. */
export type Channel = "mail" | "chat" | "phone" | "letter" | "none";
/** If a conversation/meeting is held, with what. */
export type Meeting = "none" | "zoom" | "teams" | "in_person" | "phone_call";
export type Recipient = "contact" | "decider";
export type Timing = "now" | "postpone" | "heads_up_then_later";
export type DocFormat = "client" | "own" | "negotiate" | "not_applicable";

export const POSTURE_TAGS = [
  "offer_explanation", // "tell us if anything is unclear — happy to explain"
  "modest", // quiet, behind-the-scenes word
  "concise",
  "formal",
  "cite_precedent",
  "with_numbers",
  "prior_summary", // hand over a summary of past history first
  "call_evening",
  "reduce_burden",
  "explain_carefully",
  "ask_process", // ask the contact how their approval process runs
] as const;
export type PostureTag = (typeof POSTURE_TAGS)[number];

export interface Proposal {
  channel: Channel;
  meeting: Meeting;
  formalTo: Recipient; // the official route (表)
  backchannelTo: Recipient | null; // the quiet word on the side (裏)
  timing: Timing;
  followUp: boolean; // a later courtesy follow-up (後日のあいさつ)
  format: DocFormat;
  posture: PostureTag[];
  escalateToMaster: boolean; // needs the master's decision before anything is sent
  message: string; // draft text (not judged by the simulator)
  basedOnRules: string[]; // kokoroe-chō rule ids the apprentice relied on
}

export type Verdict = "○" | "△" | "×";

export interface Judgment {
  sceneId: string;
  verdict: Verdict;
  remark: string; // the master's short one-liner ("" = said nothing)
}

/** One entry of a rule's history (沿革). */
export interface HistoryEntry {
  year: number;
  before: string;
  after: string;
  trigger: string;
}
