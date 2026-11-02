import type { Client, Proposal } from "@/src/core/types";
import type { KokoroeRule } from "./types";

const CHANNEL: Record<Proposal["channel"], string> = { mail: "メール", chat: "チャット", phone: "電話", letter: "手紙", none: "連絡しない" };
const MEETING: Record<Proposal["meeting"], string> = { none: "なし", zoom: "Zoom", teams: "Teams", in_person: "対面（訪問）", phone_call: "電話で話す" };
const TIMING: Record<Proposal["timing"], string> = { now: "すぐ", postpone: "時期をずらす", heads_up_then_later: "頭出しだけ先に、本題は後で" };
const FORMAT: Record<Proposal["format"], string> = { client: "先方の書式", own: "自社の書式", negotiate: "双方で調整", not_applicable: "該当なし" };

/** Human-readable summary of a proposal (used in the interpreter prompt and the master's card). */
export function describeProposal(p: Proposal, client: Client): string {
  const who = (r: "contact" | "decider") => (r === "contact" ? `窓口（${client.contact}）` : `決裁者（${client.decider}）`);
  return [
    `連絡手段: ${CHANNEL[p.channel]}`,
    `話す場: ${MEETING[p.meeting]}`,
    `正式な宛先（表）: ${who(p.formalTo)}`,
    `裏の一言: ${p.backchannelTo ? who(p.backchannelTo) : "なし"}`,
    `時期: ${TIMING[p.timing]}`,
    `後日のあいさつ: ${p.followUp ? "あり" : "なし"}`,
    `書式: ${FORMAT[p.format]}`,
    `姿勢: ${p.posture.join(", ") || "なし"}`,
    `師匠の確認が必要: ${p.escalateToMaster ? "はい" : "いいえ"}`,
    `文面: ${p.message}`,
  ].join("\n");
}

export function describeScope(r: KokoroeRule, clientName?: string): string {
  const who = r.scope.clientId ? (clientName ?? r.scope.clientId) : "全取引先";
  const what = r.scope.sceneTypes ? r.scope.sceneTypes.join("・") : "全場面";
  return `${who} / ${what}`;
}

export function describeRules(rules: KokoroeRule[]): string {
  if (!rules.length) return "（該当する心得はまだない）";
  return rules.map((r) => `- [${r.id}] (${describeScope(r)}) ${r.text}`).join("\n");
}
