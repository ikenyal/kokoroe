/**
 * 段位 (ranks): how much of the master's review the apprentice has earned, per client × situation type (Kento 11/4).
 *   見習い — every draft goes to the master (the start, and after any △/×)
 *   手代   — TEDAI ○ in a row there. Review is NOT skipped: the draft is marked 「確認だけ」 and such drafts can be approved
 *            together with one tap; a wrong one is still seen by the master (Kento 11/4)
 *   番頭   — BANTO ○ in a row there, and at least one passed 確かめ稽古 (a ○ on a re-solved scene) in that area: only here may
 *            the master let drafts pass without review; each one is kept on a list to look at later
 * Evidence is the master's own marks, newest first; one △/× resets the area to 見習い. Undone judgments do not count.
 * The floor (src/disciple/hitl.ts `mustReview`) still sends money, escalations and first contacts to the master at any rank.
 */
import type { SceneType, Verdict } from "./types";

export type Rank = "見習い" | "手代" | "番頭";
export const TEDAI = 2;
export const BANTO = 5;

export interface Mark {
  clientId: string;
  sceneType: SceneType;
  verdict: Verdict;
  kind?: "draft" | "confirm" | "regression";
  undone?: string;
  at: string;
}

/** What one rank covers. "client": all of one client's situations; "type": one kind of situation across clients; "both". */
export type AreaBy = "client" | "type" | "both";
export const AREA_BY: AreaBy = "client";
export const areaKey = (clientId: string, sceneType: SceneType, by: AreaBy = AREA_BY) =>
  by === "client" ? clientId : by === "type" ? sceneType : `${clientId}|${sceneType}`;

export interface Standing {
  rank: Rank;
  streak: number; // ○ in a row, newest first
  verified: boolean; // the area has a passed 確かめ稽古 (a ○ on a re-solved scene), at any time
  last: string | null; // time of the newest mark in the area
}

/** Rank of one area from its marks (any order). */
/**
 * STREAK_FROM: which marks make the ○ streak. "drafts" (default): only the master's marks on the apprentice's own first drafts —
 * a ○ on a re-solved scene or a regression check is about a correction, not about the drafts the master would stop reading.
 * "all": every mark (measured 11/4 for comparison). A passed 確かめ稽古 counts for 番頭 either way.
 */
export const STREAK_FROM: "drafts" | "all" = (process.env.KOKOROE_RANK_STREAK as "drafts" | "all" | undefined) ?? "drafts";

export function standing(marks: Mark[], tedai = TEDAI, banto = BANTO): Standing {
  const ms = marks.filter((m) => !m.undone).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  let streak = 0;
  for (const m of ms.filter((x) => STREAK_FROM === "all" || (x.kind ?? "draft") === "draft")) {
    if (m.verdict !== "○") break;
    streak++;
  }
  const verified = ms.some((m) => m.kind === "confirm" && m.verdict === "○");
  const rank: Rank = streak >= banto && verified ? "番頭" : streak >= tedai ? "手代" : "見習い";
  return { rank, streak, verified, last: ms[0]?.at ?? null };
}

/** Every area that has marks, with its standing. */
export function standings(marks: Mark[], tedai = TEDAI, banto = BANTO, area: AreaBy = AREA_BY): Map<string, Standing> {
  const by = new Map<string, Mark[]>();
  for (const m of marks) by.set(areaKey(m.clientId, m.sceneType, area), [...(by.get(areaKey(m.clientId, m.sceneType, area)) ?? []), m]);
  return new Map([...by].map(([k, ms]) => [k, standing(ms, tedai, banto)]));
}
