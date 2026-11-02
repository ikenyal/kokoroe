/**
 * Scope guard (D-025): a lesson is restricted to scene types only when the master's remark itself names that kind of situation.
 * Otherwise sceneTypes → null (all situations for that client). The widened rule still goes through 確かめ稽古 and regression.
 * Mechanical keyword match on the remark — no LLM.
 */
import type { SceneType } from "@/src/core/types";
import type { Candidate } from "./types";

/** Words in a remark that name a kind of situation. */
export const SCENE_WORDS: Record<SceneType, string[]> = {
  T1: ["遅れ", "遅延", "悪い知らせ", "詫び", "お詫び"],
  T2: ["仕様", "変更"],
  T3: ["見積", "金額", "値段", "価格", "保守費", "金の話", "値引"],
  T4: ["提案", "新しい話"],
  T5: ["担当", "交代", "新任", "異動", "引き継"],
  T6: ["あいさつ", "挨拶", "年賀", "暑中", "季節", "手紙"],
  T7: ["障害", "トラブル", "止ま", "復旧"],
  T8: ["日程", "打ち合わせ", "定例", "候補日"],
  T9: ["根回し", "稟議", "予算化"],
  T10: ["代替わり", "二代目", "先代", "社長交代"],
};

export function typesNamedIn(remark: string): SceneType[] {
  return (Object.keys(SCENE_WORDS) as SceneType[]).filter((t) => SCENE_WORDS[t].some((w) => remark.includes(w)));
}

/** Keep only the scene types the remark names; if none of the candidate's types is named, apply to all situations. */
export function guardScope(c: Candidate, remark: string): Candidate {
  if (!c.scope.sceneTypes) return c;
  const named = new Set(typesNamedIn(remark));
  const kept = c.scope.sceneTypes.filter((t) => named.has(t));
  return { ...c, scope: { ...c.scope, sceneTypes: kept.length ? kept : null } };
}
