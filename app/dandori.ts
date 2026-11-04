/**
 * How a 段取り is said on screen: 誰に・何で・いつ・裏で誰に. Display only — the proposal fields and their labels in src/core are
 * unchanged (the simulator and the evaluation read those, not these words).
 */
import { MEETING_JA, who } from "@/src/core/labels";
import { SCENE_TYPE_LABELS, type Client, type Proposal, type SceneType } from "@/src/core/types";
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
  const score = (p: Proposal) => (p.channel !== "mail" ? 2 : 0) + (p.meeting !== "none" ? 2 : 0) + (p.backchannelTo ? 1 : 0);
  return (Object.keys(SCENE_TYPE_LABELS) as SceneType[]).map((t) => {
    const best = q.filter((x) => x.scene.type === t).sort((a, b) => score(b.draft) - score(a.draft))[0];
    if (!best) return { type: t, label: SCENE_TYPE_LABELS[t], example: null, quiet: null };
    const c = getClient(best.scene.clientId);
    const quiet = quietWord(best.draft, c);
    const to = toWhom(best.draft, c);
    return { type: t, label: SCENE_TYPE_LABELS[t], client: c.name, example: `${to === "—" ? "" : `${to}へ、`}${means(best.draft)}`, quiet };
  });
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
