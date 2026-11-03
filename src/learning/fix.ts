import { POSTURE_TAGS, type PostureTag, type Proposal } from "@/src/core/types";
import type { ProposalFix } from "./types";

/** Apply a candidate's implied field change to a proposal (returns a new proposal; invalid values leave it unchanged). */
export function applyFix(p: Proposal, fix: ProposalFix): Proposal {
  const q: Proposal = { ...p, posture: [...p.posture] };
  const v = fix.value;
  switch (fix.field) {
    case "followUp":
      q.followUp = v === "true";
      break;
    case "escalateToMaster":
      if (v === "true") q.escalateToMaster = true; // simulator side; the product drops such readings in interpret.ts (D-044)
      break;
    case "backchannelTo":
      q.backchannelTo = v === "contact" || v === "decider" ? v : null;
      break;
    case "posture":
      if ((POSTURE_TAGS as readonly string[]).includes(v) && !q.posture.includes(v as PostureTag)) q.posture.push(v as PostureTag);
      break;
    default:
      if (ALLOWED[fix.field].includes(v)) (q as unknown as Record<string, unknown>)[fix.field] = v;
  }
  return q;
}

const ALLOWED: Record<"channel" | "meeting" | "formalTo" | "timing" | "format", string[]> = {
  channel: ["mail", "chat", "phone", "letter", "none"],
  meeting: ["none", "zoom", "teams", "in_person", "phone_call"],
  formalTo: ["contact", "decider"],
  timing: ["now", "postpone", "heads_up_then_later"],
  format: ["client", "own", "negotiate", "not_applicable"],
};

/** Allowed values per field, for the interpreter prompt. */
export const FIX_VALUES_HELP = `channel: ${ALLOWED.channel.join("|")}; meeting: ${ALLOWED.meeting.join("|")}; formalTo: contact|decider; backchannelTo: contact|decider|null; timing: ${ALLOWED.timing.join("|")}; followUp/escalateToMaster: true|false; format: ${ALLOWED.format.join("|")}; posture (tag to add): ${POSTURE_TAGS.join("|")}`;

/** JST calendar date (YYYY-MM-DD) for an ISO timestamp. */
export function jstDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}
