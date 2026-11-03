/**
 * Work that runs after the master's tap, without making them wait (scheduled with next/server `after()`):
 * interpret the △/× → if ambiguous, ask the master to pick a reading (shown on the 帳場 as a one-tap card) → update the kokoroe-chō.
 * Only runs when KOKOROE_LIVE=1 (it calls the Claude API). With recorded data, the 帳場 says so instead.
 */
import { getClient } from "@/src/core/world";
import { makeDiscipleV1 } from "@/src/disciple/v1";
import { applyCandidate } from "@/src/learning/compile";
import { interpret } from "@/src/learning/interpret";
import { guardScope } from "@/src/learning/scope";
import type { Usage } from "@/src/lib/claude";
import { allowLive, recordSpend } from "./limits";
import { openSession, readMeta, type Mode, type Pending, type Session } from "./session";
import { newVerification, startVerification } from "./verify-ui";

function update(s: Session, judgmentId: string, patch: Partial<Pending>) {
  const meta = readMeta(s.mode, s.sid);
  meta.pending = meta.pending.map((p) => (p.judgmentId === judgmentId ? { ...p, ...patch } : p));
  s.saveMeta(meta);
}

async function context(s: Session, judgmentId: string) {
  const judgment = (await s.store.listJudgments()).find((j) => j.id === judgmentId);
  if (!judgment) throw new Error("judgment not found");
  const meta = readMeta(s.mode, s.sid);
  const scene = meta.queue.find((q) => q.scene.id === judgment.sceneId)?.scene;
  if (!scene) throw new Error("scene not found");
  const client = getClient(judgment.clientId);
  const existing = (await s.store.listRules()).filter((r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === client.id));
  return { judgment, scene, client, existing };
}

/** Round 1 (or 2, with the rejected readings) of interpretation. */
export async function interpretInBackground(mode: Mode, sid: string, judgmentId: string, round: 1 | 2 = 1) {
  const s = openSession(mode, sid);
  if (!s) return;
  try {
    update(s, judgmentId, { status: "interpreting", round });
    const { judgment, scene, client, existing } = await context(s, judgmentId);
    const rejected = round === 2 ? readMeta(mode, sid).pending.find((p) => p.judgmentId === judgmentId)?.candidates : undefined;
    const usage: Usage[] = [];
    const interp = await interpret({ scene, client, judgment, existing, rejected, usage }).finally(() => recordSpend(usage));
    const ex = readMeta(mode, sid).pending.find((p) => p.judgmentId === judgmentId)?.exclude;
    const cands = interp.candidates.map((c) => (ex && c.targetRuleId === ex ? { ...c, action: "add" as const, targetRuleId: null } : c));
    if (!cands.length) return update(s, judgmentId, { status: "nothing-learned", note: "読み取れる違いがありませんでした" });
    // Round 2 always asks (D-025): after "none of these", nothing is written without the master's tap.
    if (round === 2 || interp.ambiguous || cands.length > 1)
      return update(s, judgmentId, { status: "needs-choice", candidates: cands, note: interp.diagnosis });
    const pick = guardScope(cands[0], judgment.remark);
    const snapshot = pick.action === "revise" && pick.targetRuleId ? await s.store.getRule(pick.targetRuleId) : undefined;
    const change = await applyCandidate(s.store, judgment, pick, interp);
    const verify = newVerification({ ruleId: change.ruleId, action: change.action }, snapshot);
    // A new rule: ask "why?" once (optional), then verify. A revision: verify now.
    update(s, judgmentId, { status: change.action === "add" ? "needs-why" : "verifying", ruleId: change.ruleId, candidates: cands, note: interp.diagnosis, verify });
    if (change.action === "revise") await startVerification(mode, sid, judgmentId);
  } catch (e) {
    update(s, judgmentId, { status: "error", note: e instanceof Error ? e.message.slice(0, 120) : "解釈に失敗しました" });
  }
}

/** The master tapped a reading (index) or "none of these" (null). The action has set status "choosing". */
export async function applyChoice(mode: Mode, sid: string, judgmentId: string, index: number | null) {
  const s = openSession(mode, sid);
  if (!s) return;
  try {
    const p = readMeta(mode, sid).pending.find((x) => x.judgmentId === judgmentId);
    if (!p || p.status !== "choosing" || !p.candidates) return;
    if (index === null) {
      if ((p.round ?? 1) === 1) return await interpretInBackground(mode, sid, judgmentId, 2); // second round of readings
      return update(s, judgmentId, { status: "nothing-learned", note: "どの読み方でもなかったため、何も覚えていません" });
    }
    const c = p.candidates[index];
    if (!c) return update(s, judgmentId, { status: "error", note: "選ばれた読み方が見つかりません" });
    const { judgment } = await context(s, judgmentId);
    const pick = guardScope(c, judgment.remark);
    const snapshot = pick.action === "revise" && pick.targetRuleId ? await s.store.getRule(pick.targetRuleId) : undefined;
    const change = await applyCandidate(s.store, judgment, pick, { diagnosis: p.note ?? "", confidence: "medium" });
    const verify = newVerification({ ruleId: change.ruleId, action: change.action }, snapshot);
    update(s, judgmentId, { status: change.action === "add" ? "needs-why" : "verifying", ruleId: change.ruleId, verify });
    if (change.action === "revise") await startVerification(mode, sid, judgmentId);
  } catch (e) {
    update(s, judgmentId, { status: "error", note: e instanceof Error ? e.message.slice(0, 120) : "心得帳に書けませんでした" });
  }
}

const drafting = new Set<string>(); // in-process guard: AutoRefresh renders must not draft (and pay) twice

/** Live mode: draft the next card with the current kokoroe-chō (instead of the recorded draft). */
export async function draftLive(s: Session, index: number) {
  const key = `${s.mode}-${s.sid}-${index}`;
  const item = readMeta(s.mode, s.sid).queue[index];
  if (!item || item.live || drafting.has(key)) return;
  const refused = await allowLive(s.sid);
  if (refused) {
    const meta = readMeta(s.mode, s.sid);
    meta.limit = refused;
    s.saveMeta(meta);
    return; // keep the recorded draft
  }
  drafting.add(key);
  const d = makeDiscipleV1(s.store, "v1-live");
  try {
    const draft = await d.propose(item.scene, getClient(item.scene.clientId)).finally(() => recordSpend(d.usage));
    // Re-read after the await and patch only this card, so background updates made meanwhile are kept.
    const meta = readMeta(s.mode, s.sid);
    meta.queue[index] = { ...meta.queue[index], draft, live: true };
    s.saveMeta(meta);
  } finally {
    drafting.delete(key);
  }
}
