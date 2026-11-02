/** Japanese labels for showing a proposal to the master and the successor. */
import type { Client, PostureTag, Proposal } from "./types";

export const CHANNEL_JA: Record<Proposal["channel"], string> = { mail: "メール", chat: "チャット", phone: "電話", letter: "手紙", none: "連絡しない" };
export const MEETING_JA: Record<Proposal["meeting"], string> = { none: "", zoom: "Zoom で話す", teams: "Teams で話す", in_person: "訪問して話す", phone_call: "電話で話す" };
export const TIMING_JA: Record<Proposal["timing"], string> = { now: "すぐ", postpone: "時期をずらす", heads_up_then_later: "頭出しだけ先に、本題は後で" };
export const FORMAT_JA: Record<Proposal["format"], string> = { client: "先方の書式", own: "自社の書式", negotiate: "双方で相談", not_applicable: "" };
export const POSTURE_JA: Record<PostureTag, string> = {
  offer_explanation: "不足があれば説明すると添える",
  modest: "控えめに",
  concise: "簡潔に",
  formal: "改まった言い回し",
  cite_precedent: "前例を添える",
  with_numbers: "数字と根拠を添える",
  prior_summary: "これまでの経緯を先に渡す",
  call_evening: "電話は夕方以降",
  reduce_burden: "先方の負担が減る形で",
  explain_carefully: "丁寧に説明する",
  ask_process: "先方の段取りを先に聞く",
};

export const who = (c: Client, r: "contact" | "decider") => (r === "contact" ? `${c.contact}（窓口）` : `${c.decider}（決裁）`);
