/**
 * 師匠役テスト (master-role test, 11/6; internally "field"): the author plays the master on a fixed set of 20 training scenes (2 per client, training order),
 * then writes the same etiquette as prose for 5 of them. Designed to fit in 30 minutes: ~20 × 45 s judging + 5 × ~2–3 min writing.
 * Measures t_judge (time to mark), remark / choice / "why?" time, and t_write (time to write the same thing).
 */
export const FIELD_SCENES = ["T05", "T06", "T07", "T09", "T10", "T13", "T14", "T15", "T16", "T18", "T19", "T21", "T25", "T26", "T27", "T28", "T30", "T31", "T37", "T39"];

/** Scenes whose etiquette the master writes out in prose afterwards (one per kind of tacit habit). */
export const FIELD_WRITES = [
  { sceneId: "T05", prompt: "丸新酒造に新しい提案をするとき、誰にどう話を通すか" },
  { sceneId: "T15", prompt: "浜風運輸に納期の遅れを伝えるとき、いつ・誰に・どう伝えるか" },
  { sceneId: "T21", prompt: "まちなか生協に見積りを出すとき、気をつけること" },
  { sceneId: "T27", prompt: "大河原建材の社長に新しい提案をするとき、どう進めるか" },
  { sceneId: "T09", prompt: "白樺製菓の2〜3月に見積りの依頼が来たとき、どう対応するか" },
];

export const fieldEnabled = () => process.env.KOKOROE_FIELD === "1";
