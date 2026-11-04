/**
 * 「どこが違う？」 (Kento 11/4, D-057): when the master gave no remark and taps 「どれでもない」 for the first readings, they may also tap WHERE the
 * draft was off — 宛先 / 手段 / 時期 / 裏の一言 / 書式 / その他 — in the same tap. Optional: skipping it works as before.
 * The area is only a hint to the interpreter's second round. It does not write anything, does not filter readings, and does not
 * touch the floor (money / contract terms / first contact always go to the master), 確かめ稽古 or regression checks.
 */
import type { ProposalFix } from "./types";

export const DIFF_AREAS = ["to", "channel", "timing", "backchannel", "format", "other"] as const;
export type DiffArea = (typeof DIFF_AREAS)[number];

/** Labels as the 帳場 shows them (the same words as the draft's rows). */
export const DIFF_AREA_JA: Record<DiffArea, string> = {
  to: "宛先",
  channel: "手段",
  timing: "時期",
  backchannel: "裏の一言",
  format: "書式",
  other: "その他",
};

/** The draft fields each area covers. その他 = whatever the five named areas do not. */
export const DIFF_AREA_FIELDS: Record<DiffArea, ProposalFix["field"][]> = {
  to: ["formalTo"],
  channel: ["channel", "meeting"],
  timing: ["timing"],
  backchannel: ["backchannelTo"],
  format: ["format"],
  other: ["followUp", "posture", "escalateToMaster"],
};

/**
 * D-057 (narrowed, Kento 11/4): ask 「どこが違う？」 only when the master gave no remark. With a remark, the area hint competed with
 * the reading of the remark and lowered ○+△ (on/off × 3 pairs); with no remark it is the only clue there is.
 */
export function askWhere(remark: string): boolean {
  return remark.trim() === "";
}

export function isDiffArea(v: unknown): v is DiffArea {
  return typeof v === "string" && (DIFF_AREAS as readonly string[]).includes(v);
}

/** The area a draft field belongs to. */
export function areaOfField(field: ProposalFix["field"]): DiffArea {
  return DIFF_AREAS.find((a) => DIFF_AREA_FIELDS[a].includes(field)) ?? "other";
}

/**
 * The 帳場's choice button value: "0"–"2" (a reading), "none", or "none:<area>" (「どれでもない」 with 「どこが違う？」).
 * Returns null for anything else, so a crafted value is refused.
 */
export function parsePick(raw: string): { index: number | null; area: DiffArea | null } | null {
  const m = /^(none|[0-2])(?::([a-z]+))?$/.exec(raw);
  if (!m) return null;
  if (m[2] !== undefined && (m[1] !== "none" || !isDiffArea(m[2]))) return null;
  return { index: m[1] === "none" ? null : Number(m[1]), area: (m[2] as DiffArea | undefined) ?? null };
}
