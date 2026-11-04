/**
 * How a 段取り is said on screen: 誰に・何で・いつ・裏で誰に. Display only — the proposal fields and their labels in src/core are
 * unchanged (the simulator and the evaluation read those, not these words).
 */
import { MEETING_JA, TIMING_JA, who } from "@/src/core/labels";
import { SCENE_TYPE_LABELS, type Client, type Proposal, type Scene, type SceneType } from "@/src/core/types";
import type { JudgmentRecord, KokoroeRule } from "@/src/learning/types";
import { ruleTook } from "@/src/learning/verify";
import { getClient } from "@/src/core/world";
import trial from "@/data/demo/trial-snapshot.json";

const SEND: Record<Proposal["channel"], string> = { mail: "メールを送る", chat: "チャットで送る", phone: "電話する", letter: "手紙を出す", none: "あえて連絡しない" };

/** 何で: the means, as actions. A live conversation comes after the message ("そのうえで"). */
export function means(p: Pick<Proposal, "channel" | "meeting">): string {
  if (p.channel === "none") return p.meeting === "none" ? SEND.none : `文書は出さず、${MEETING_JA[p.meeting]}`;
  const m = p.meeting === "none" || (p.channel === "phone" && p.meeting === "phone_call") ? "" : `。そのうえで${MEETING_JA[p.meeting]}`;
  return `${SEND[p.channel]}${m}`;
}

export const toWhom = (p: Proposal, c: Client) => (p.channel === "none" && p.meeting === "none" ? "—" : who(c, p.formalTo));
export const quietWord = (p: Proposal, c: Client) => (p.backchannelTo ? `${who(c, p.backchannelTo)}にも、そっと一言` : null);

/**
 * The breadth of the work, for the home page: the 10 kinds of scene, each with one recorded 段取り from the fictional training
 * scenes (the apprentice's first drafts, before any correction). Prefers a draft that is not just an email.
 */
export function sceneRange() {
  const q = trial.queue as unknown as { scene: { type: SceneType; clientId: string }; draft: Proposal }[];
  // Prefer drafts that are not just an email: a call or a letter first, then chat; a live conversation; a quiet word on the side.
  const score = (p: Proposal) =>
    (p.channel === "phone" || p.channel === "letter" ? 3 : p.channel !== "mail" ? 2 : 0) + (p.meeting !== "none" ? 2 : 0) + (p.backchannelTo ? 2 : 0);
  return (Object.keys(SCENE_TYPE_LABELS) as SceneType[]).map((t) => {
    const best = q.filter((x) => x.scene.type === t).sort((a, b) => score(b.draft) - score(a.draft))[0];
    if (!best) return { type: t, label: SCENE_TYPE_LABELS[t], example: null, quiet: null };
    const c = getClient(best.scene.clientId);
    const quiet = quietWord(best.draft, c);
    const to = toWhom(best.draft, c);
    return { type: t, label: SCENE_TYPE_LABELS[t], client: c.name, example: `${to === "—" ? "" : `${to}へ、`}${means(best.draft)}`, quiet, channel: best.draft.channel, score: score(best.draft) };
  });
}

/**
 * The home page shows three of the ten at once: the ones that show the range of means at a glance — one by letter, one by phone,
 * one by chat (the richest of each: a live conversation and a quiet word count), never an email. The rest open on request.
 */
export function sceneRangeSplit() {
  const all = sceneRange();
  const shown: typeof all = [];
  // Phone first (only one kind of scene has a call), then letter and chat; a client already shown is passed over when possible.
  for (const ch of ["phone", "letter", "chat"] as const) {
    const cands = all
      .filter((x) => "channel" in x && x.channel === ch && !shown.includes(x))
      .sort((a, b) => (("score" in b && b.score) || 0) - (("score" in a && a.score) || 0));
    const r = cands.find((x) => !shown.some((y) => "client" in y && "client" in x && y.client === x.client)) ?? cands[0];
    if (r) shown.push(r);
  }
  shown.sort((a, b) => all.indexOf(a) - all.indexOf(b));
  return { shown, rest: all.filter((x) => !shown.includes(x)) };
}

/**
 * 「どこが違う？」 buttons in the same words as the 段取り rows. UI only: src/learning's DIFF_AREA_JA is also part of the
 * interpreter's prompt, so it stays as it is (宛先 = 誰に, 手段 = 何で, 時期 = いつ, 裏の一言 = 裏で誰に).
 */
export const AREA_ON_SCREEN = { to: "誰に", channel: "何で", timing: "いつ", backchannel: "裏で誰に", format: "書式", other: "その他" } as const;

/** 訪問の段取り (D-061), in the order a visit is prepared. */
export const VISIT_ROWS = [
  ["attire", "服装"],
  ["gift", "手土産"],
  ["checkFirst", "先に確かめる話題"],
  ["attendees", "同席者"],
  ["address", "呼び方"],
] as const;

/** No internal ids on screen (D-053): the model sometimes cites 「（K-001）」 inside free text; the 根拠 row links the rule instead. */
export const noIds = (t: string) => t.replace(/\s*[（(]\s*K-\d+(?:\s*[、,・]\s*K-\d+)*\s*[）)]/g, "").trim();

/** The 段取り rows, in the order the card shows them (for 「前の案 → 今の案」). */
export const DANDORI_ROWS: [string, (p: Proposal, c: Client) => string, (keyof Proposal)[]][] = [
  ["誰に", (p, c) => toWhom(p, c), ["formalTo"]],
  ["何で", (p) => means(p), ["channel", "meeting"]],
  ["いつ", (p) => TIMING_JA[p.timing], ["timing"]],
  ["裏で誰に", (p, c) => quietWord(p, c) ?? "なし", ["backchannelTo"]],
  ["後日", (p) => (p.followUp ? "あらためて、あいさつを入れる" : "なし"), ["followUp"]],
];

export interface RuleEffect {
  rule: KokoroeRule;
  before: JudgmentRecord; // the draft the master corrected, from which the 心得 was learned
}

/**
 * 「直したら、次が変わる」: the first time a learned 心得 shows in a draft. Decided by code, the same check 確かめ稽古 uses
 * (`ruleTook`): this draft follows the 心得's point, the corrected draft did not, and no draft judged after the correction
 * followed it yet. Only 心得 learned from a judgment (not the 台帳), active, in scope for this client and kind of scene.
 * Display only: nothing here changes what is learned.
 */
export function ruleEffect(rules: KokoroeRule[], judgments: JudgmentRecord[], scene: Pick<Scene, "id" | "clientId" | "type">, draft: Proposal): RuleEffect | null {
  const inScope = (r: KokoroeRule, clientId: string, type: SceneType) =>
    (r.scope.clientId === null || r.scope.clientId === clientId) && (r.scope.sceneTypes === null || r.scope.sceneTypes.includes(type));
  const drafts = judgments.filter((j) => (j.kind ?? "draft") === "draft" && !j.undone);
  for (const rule of rules) {
    if (rule.status !== "active" || rule.origin === "ledger" || !rule.fix || !inScope(rule, scene.clientId, scene.type)) continue;
    const src = rule.sources.find((s) => s.kind !== "ledger");
    const before = src && judgments.find((j) => j.id === src.judgmentId);
    if (!before || before.sceneId === scene.id || ruleTook(rule, before.proposal) !== false || ruleTook(rule, draft) !== true) continue;
    // First time: no draft judged after the correction (and before this scene, if it was judged) already followed it.
    const from = drafts.findIndex((j) => j.id === before.id);
    const self = drafts.findIndex((j) => j.sceneId === scene.id);
    if (self !== -1 && self < from) continue; // this scene was judged before the correction: not a change it caused
    const between = drafts.slice(from + 1, self === -1 ? undefined : self);
    if (between.some((j) => inScope(rule, j.clientId, j.sceneType) && ruleTook(rule, j.proposal) === true)) continue;
    return { rule, before };
  }
  return null;
}

/**
 * 心得帳: the drafts judged after a 心得 was learned that followed it — by the same check (ruleTook), or because the draft named it
 * as a basis. Only 心得 learned from a judgment; the corrected scene itself is left out. Oldest first.
 */
export function draftsThatUsed(rule: KokoroeRule, judgments: JudgmentRecord[]): { judgment: JudgmentRecord; cited: boolean }[] {
  const src = rule.sources.find((s) => s.kind !== "ledger");
  if (!src || rule.origin === "ledger") return [];
  const drafts = judgments.filter((j) => (j.kind ?? "draft") === "draft" && !j.undone);
  const from = drafts.findIndex((j) => j.id === src.judgmentId);
  if (from === -1) return [];
  const inScope = (j: JudgmentRecord) =>
    (rule.scope.clientId === null || rule.scope.clientId === j.clientId) && (rule.scope.sceneTypes === null || rule.scope.sceneTypes.includes(j.sceneType));
  return drafts
    .slice(from + 1)
    .filter((j) => j.sceneId !== src.sceneId && inScope(j))
    .map((j) => ({ judgment: j, cited: j.proposal.basedOnRules.includes(rule.id), took: ruleTook(rule, j.proposal) === true }))
    .filter((x) => x.cited || x.took)
    .map(({ judgment, cited }) => ({ judgment, cited }));
}

/**
 * The recorded training run behind the demo, for 「直したら、次が変わる」 without live learning: its 心得帳 and judgments up to
 * T20 (demo snapshot), followed by its first drafts for T21–T40 in order (the お試し snapshot's drafts are that run's first
 * drafts, D-029), so "the first time" is checked against the whole run.
 */
export function recordedRun(demo: { store: { rules: unknown[]; judgments: unknown[] } }): { rules: KokoroeRule[]; judgments: JudgmentRecord[] } {
  const judgments = demo.store.judgments as JudgmentRecord[];
  const seen = new Set(judgments.map((j) => j.sceneId));
  const q = trial.queue as unknown as { scene: { id: string; clientId: string; type: SceneType }; draft: Proposal }[];
  const rest: JudgmentRecord[] = q
    .filter((x) => !seen.has(x.scene.id))
    .map((x) => ({ id: `RUN-${x.scene.id}`, at: "", sceneId: x.scene.id, clientId: x.scene.clientId, sceneType: x.scene.type, proposal: x.draft, verdict: "○", remark: "", kind: "draft" }));
  return { rules: demo.store.rules as KokoroeRule[], judgments: [...judgments, ...rest] };
}

/**
 * The home page's one example, end to end, from recorded data only (fictional 丸新酒造): the apprentice's first draft (T05),
 * the master's mark on it, the 心得 written from it (K-011), the next 丸新酒造 draft that follows it (T13), and the successor's
 * recorded answer (Claude Code with the exported 心得帳 Skill, demo/successor-mcp). Null if any piece is missing.
 */
export function marushinStory(demo: { store: { rules: unknown[]; judgments: unknown[] } }, mcp: { question: string; answers: Record<string, { result: string }> }) {
  const q = trial.queue as unknown as { scene: { id: string; clientId: string; type: SceneType }; draft: Proposal }[];
  const t05 = q.find((x) => x.scene.id === "T05");
  const t13 = q.find((x) => x.scene.id === "T13");
  const rule = (demo.store.rules as KokoroeRule[]).find((r) => r.id === "K-011");
  const src = rule?.sources.find((s) => s.kind !== "ledger");
  const judged = (demo.store.judgments as JudgmentRecord[]).find((j) => j.id === src?.judgmentId);
  const answer = mcp.answers["skill-only"]?.result.split("\n").find((l) => l.trim());
  if (!t05 || !t13 || !rule || !judged || !answer) return null;
  const c = getClient(t05.scene.clientId);
  return {
    client: c.name,
    first: { type: SCENE_TYPE_LABELS[t05.scene.type], to: toWhom(t05.draft, c), means: means(t05.draft), quiet: quietWord(t05.draft, c) },
    mark: { verdict: judged.verdict, remark: judged.remark },
    rule: rule.text,
    next: { type: SCENE_TYPE_LABELS[t13.scene.type], quiet: quietWord(t13.draft, c) },
    question: mcp.question,
    answer: answer.replace(/\*\*/g, "").trim(),
  };
}
