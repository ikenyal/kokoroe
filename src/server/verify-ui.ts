/**
 * 確かめ稽古 + 回帰テスト in the 帳場 (D-028 → D-037). Same logic as the evaluation loop (src/learning/verify.ts), but the master's
 * answers arrive as separate taps, so each step stores its state in the pending item and the next step runs in the background:
 *
 *   rule written ─▶ startVerification: re-solve the corrected scene ─▶ [needs-confirm] master ○△×
 *     △/× (D-045): the draft follows the rule's point ─▶ keep the rule; after its regression check, the △/× becomes its own
 *                  correction item (normal flow; it may not rewrite this rule)
 *                  it does not ─▶ (once) re-read the same rule, re-solve ─▶ [needs-confirm] again; still not ─▶ 取り下げ
 *     ─▶ fix the regression set (past ○ of this client, ≤ 3) ─▶ runRegression: re-solve each;
 *        same decision → passes silently;  changed → [needs-regression] master ○△×
 *          ○ → continue;  △/× → (first time) narrow the rule with that scene as evidence, re-check the whole set
 *                               (second time) 差し戻し — recorded in the 沿革
 *     ─▶ all passed → applied (verified)
 * Background steps call Claude; the actions that trigger them reserve a live call first (limits.ts).
 */
import { enforceHitl } from "@/src/disciple/hitl";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import type { Proposal, Scene, Verdict } from "@/src/core/types";
import { makeDiscipleV1 } from "@/src/disciple/v1";
import { visitInApp } from "@/src/disciple/v0";
import { applyCandidate } from "@/src/learning/compile";
import { interpret } from "@/src/learning/interpret";
import { MAX_REGRESSION, okScenes, rollbackChange, ruleTook, sameDecision } from "@/src/learning/verify";
import { guardScope } from "@/src/learning/scope";
import { interpretInBackground } from "./background";
import type { Usage } from "@/src/lib/claude";
import { recordSpend } from "./limits";
import { openSession, readMeta, type Mode, type Pending, type Session, type UiVerification } from "./session";

function patch(s: Session, judgmentId: string, p: Partial<Pending>) {
  const meta = readMeta(s.mode, s.sid);
  meta.pending = meta.pending.map((x) => (x.judgmentId === judgmentId ? { ...x, ...p } : x));
  s.saveMeta(meta);
}
const pendingOf = (s: Session, judgmentId: string) => readMeta(s.mode, s.sid).pending.find((x) => x.judgmentId === judgmentId);

function sceneById(s: Session, id: string): Scene | undefined {
  return readMeta(s.mode, s.sid).queue.find((q) => q.scene.id === id)?.scene ?? TRAIN_SCENES.find((t) => t.id === id);
}

async function draft(s: Session, scene: Scene): Promise<Proposal> {
  const d = makeDiscipleV1(s.store, "v1-verify", { visit: visitInApp() }); // the re-solved draft shows the visit plan too (D-061)
  try {
    return await d.propose(scene, getClient(scene.clientId));
  } finally {
    recordSpend(d.usage, s.sid);
  }
}

async function guarded(s: Session, judgmentId: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    patch(s, judgmentId, { status: "error", note: e instanceof Error ? e.message.slice(0, 120) : "確かめに失敗しました" });
  }
}

/** Called after a rule was written (and after "why?" for a new rule). */
export async function startVerification(mode: Mode, sid: string, judgmentId: string) {
  const s = openSession(mode, sid);
  if (!s) return;
  await guarded(s, judgmentId, async () => {
    const p = pendingOf(s, judgmentId);
    const scene = p && sceneById(s, p.sceneId);
    if (!p?.verify || !scene) return patch(s, judgmentId, { status: "applied" });
    patch(s, judgmentId, { status: "verifying" });
    const proposal = await draft(s, scene);
    const v = pendingOf(s, judgmentId)!.verify!;
    patch(s, judgmentId, { status: "needs-confirm", verify: { ...v, confirm: { proposal } } });
  });
}

/** The master judged the re-solved corrected scene. Record it, fix the regression set, and run it. */
export async function afterConfirm(mode: Mode, sid: string, judgmentId: string, verdict: Verdict, remark: string) {
  const s = openSession(mode, sid);
  if (!s) return;
  await guarded(s, judgmentId, async () => {
    const p = pendingOf(s, judgmentId);
    const scene = p && sceneById(s, p.sceneId);
    if (!p?.verify?.confirm || !scene) return;
    const cj = await s.store.addJudgment({
      at: new Date().toISOString(), sceneId: scene.id, clientId: scene.clientId, sceneType: scene.type,
      proposal: p.verify.confirm.proposal, verdict, remark, kind: "confirm",
    });
    if (verdict !== "○") {
      // D-045: did the re-solved draft follow the new rule's own point?
      const rule = (await s.store.getRule(p.verify.change.ruleId))!;
      if (ruleTook(rule, p.verify.confirm.proposal) === false) {
        // It didn't take. Once: re-read the same rule from this judgment (an unambiguous reading only) and ask again.
        if (!p.verify.retried) {
          patch(s, judgmentId, { status: "verifying", verify: { ...p.verify, confirm: undefined, retried: true } });
          const client = getClient(scene.clientId);
          const existing = (await s.store.listRules()).filter((r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === client.id));
          const usage: Usage[] = [];
          // On a failed call, withdraw rather than leave a rule that did not take active (review of D-045).
          const interp = await interpret({ scene, client, judgment: cj, existing, usage })
            .catch(() => null)
            .finally(() => recordSpend(usage, s.sid));
          if (!interp) return withdraw(s, judgmentId, p.verify, cj.id, scene.id, verdict, remark, false);
          const c = !interp.ambiguous && interp.candidates.length === 1 ? interp.candidates[0] : undefined;
          if (c) {
            const pick = guardScope({ ...c, action: "revise", targetRuleId: rule.id, scope: { ...c.scope, clientId: rule.scope.clientId } }, remark);
            const applied = await applyCandidate(s.store, cj, pick, interp);
            if (applied.ruleId === rule.id) {
              const proposal = await draft(s, scene);
              const v = pendingOf(s, judgmentId)!.verify!;
              return patch(s, judgmentId, { status: "needs-confirm", note: "心得どおりの案にならなかったので、読み直して解き直しました", verify: { ...v, confirm: { proposal } } });
            }
          }
        }
        return withdraw(s, judgmentId, p.verify, cj.id, scene.id, verdict, remark, !!p.verify.retried); // reread = a re-read happened before this check
      }
      // It took: the rule did its job. What is still missing is a separate lesson — the normal correction flow handles it
      // (readings, the master's choice, its own verification), and it may not rewrite the rule just written.
      // Queued only after this rule's regression check ends (queueRemainder), so the new rule can't break it.
      p.verify.remainder = cj.id;
    }
    const fixedSet = (await okScenes(s.store, scene.clientId, scene.id)).slice(0, MAX_REGRESSION).map((j) => ({ sceneId: j.sceneId, pastJudgmentId: j.id }));
    patch(s, judgmentId, { status: "verifying", verify: { ...p.verify, confirm: undefined, fixedSet, remaining: fixedSet } });
    await runRegression(s, judgmentId);
  });
}

/**
 * D-045: the rule took but the master's △/× on 確かめ稽古 pointed at something else — after this rule's checks are done, that
 * judgment goes through the normal correction flow as its own item, and may not rewrite the rule just written.
 */
async function queueRemainder(s: Session, judgmentId: string) {
  const v = pendingOf(s, judgmentId)?.verify;
  const cj = v?.remainder;
  if (!v || !cj) return;
  const meta = readMeta(s.mode, s.sid);
  meta.pending = meta.pending.map((x) => (x.judgmentId === judgmentId ? { ...x, verify: { ...v, remainder: undefined } } : x));
  const scene = (await s.store.listJudgments()).find((j) => j.id === cj);
  if (scene) meta.pending.unshift({ judgmentId: cj, sceneId: scene.sceneId, status: "queued", exclude: v.change.ruleId });
  s.saveMeta(meta);
  if (scene) await interpretInBackground(s.mode, s.sid, cj);
}

/** D-045 取り下げ: the rule is not adopted (retired, or restored if it was a revision); recorded in its 沿革. No Claude call. */
async function withdraw(s: Session, judgmentId: string, v: UiVerification, confirmId: string, sceneId: string, verdict: Verdict, remark: string, reread: boolean) {
  await rollbackChange({ store: s.store, change: v.change, snapshot: v.snapshot, judgmentId: confirmId, brokenSceneId: sceneId, verdict, remark, at: new Date().toISOString(), kind: "confirm", reread });
  patch(s, judgmentId, { status: "withdrawn", note: "解き直した案が心得どおりにならなかったため、この心得は採用せず取り下げました（沿革に記録）" });
}

/**
 * The live-call limit was hit when the master tapped a check (no Claude call allowed). △/× on 確かめ稽古 is still recorded,
 * and a rule that did not take is withdrawn — nothing is adopted without a ○ (review of D-045).
 */
export async function confirmWithoutLive(mode: Mode, sid: string, judgmentId: string, verdict: Verdict, remark: string): Promise<void> {
  const s = openSession(mode, sid);
  if (!s) return;
  const p = pendingOf(s, judgmentId);
  const scene = p && sceneById(s, p.sceneId);
  if (!p?.verify?.confirm || !scene) return;
  const cj = await s.store.addJudgment({
    at: new Date().toISOString(), sceneId: scene.id, clientId: scene.clientId, sceneType: scene.type,
    proposal: p.verify.confirm.proposal, verdict, remark, kind: "confirm",
  });
  const rule = await s.store.getRule(p.verify.change.ruleId);
  if (verdict !== "○" && rule && ruleTook(rule, p.verify.confirm.proposal) === false) return withdraw(s, judgmentId, p.verify, cj.id, scene.id, verdict, remark, !!p.verify.retried);
  patch(s, judgmentId, { status: "applied", note: verdict === "○" ? "お試し上限のため、確かめはここまでにしました" : "お試し上限のため、確かめの △・× は記録だけして、残りの直しはまだ覚えていません" });
}

/** Re-solve the remaining past ○ scenes until one changes (ask the master) or all pass (verified). */
async function runRegression(s: Session, judgmentId: string) {
  for (;;) {
    const v = pendingOf(s, judgmentId)!.verify!;
    const [next, ...rest] = v.remaining;
    if (!next) {
      patch(s, judgmentId, { status: "applied", note: `確かめ済み（回帰 ${v.checked} 件、師匠に確認 ${v.asked} 件${v.narrowed ? "、範囲を絞った" : ""}）` });
      return queueRemainder(s, judgmentId);
    }
    const scene = sceneById(s, next.sceneId);
    const past = (await s.store.listJudgments()).find((j) => j.id === next.pastJudgmentId);
    if (!scene || !past) {
      patch(s, judgmentId, { verify: { ...v, remaining: rest } });
      continue;
    }
    const proposal = await draft(s, scene);
    const v2 = pendingOf(s, judgmentId)!.verify!;
    // compare with the floored past draft: a change made only by the HITL floor (D-044) is not a regression
    if (sameDecision(enforceHitl(scene, past.proposal), proposal)) {
      patch(s, judgmentId, { verify: { ...v2, remaining: rest, checked: v2.checked + 1 } });
      continue;
    }
    return patch(s, judgmentId, {
      status: "needs-regression",
      verify: { ...v2, remaining: rest, checked: v2.checked + 1, asked: v2.asked + 1, current: { ...next, proposal } },
    });
  }
}

/** The master judged a past ○ scene whose decision changed. ○ → continue; otherwise narrow once, then roll back. */
export async function afterRegression(mode: Mode, sid: string, judgmentId: string, verdict: Verdict, remark: string) {
  const s = openSession(mode, sid);
  if (!s) return;
  await guarded(s, judgmentId, async () => {
    const p = pendingOf(s, judgmentId);
    const v = p?.verify;
    const cur = v?.current;
    const scene = cur && sceneById(s, cur.sceneId);
    if (!p || !v || !cur || !scene) return;
    await s.store.addJudgment({
      at: new Date().toISOString(), sceneId: scene.id, clientId: scene.clientId, sceneType: scene.type,
      proposal: cur.proposal, verdict, remark, kind: "regression",
    });
    patch(s, judgmentId, { status: "verifying", verify: { ...v, current: undefined } });
    if (verdict === "○") return runRegression(s, judgmentId);

    const judgment = (await s.store.listJudgments()).find((j) => j.id === judgmentId)!;
    const past = (await s.store.listJudgments()).find((j) => j.id === cur.pastJudgmentId)!;
    if (!v.narrowed) {
      // One chance to narrow the rule with the broken scene as evidence; then re-check the whole fixed set.
      const rule = (await s.store.getRule(v.change.ruleId))!;
      const own = sceneById(s, p.sceneId)!;
      const client = getClient(own.clientId);
      const existing = (await s.store.listRules()).filter((r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === client.id));
      const usage: Usage[] = [];
      const interp = await interpret({
        scene: own, client, judgment, existing, usage,
        conflict: { ruleId: rule.id, ruleText: rule.text, scene, before: past.proposal, after: cur.proposal, verdict, remark },
      }).finally(() => recordSpend(usage, s.sid));
      const c = interp.candidates[0];
      if (c) {
        await applyCandidate(s.store, judgment, { ...c, action: "revise", targetRuleId: rule.id }, interp);
        patch(s, judgmentId, { verify: { ...v, current: undefined, narrowed: true, remaining: v.fixedSet } });
        return runRegression(s, judgmentId);
      }
    }
    await rollbackChange({
      store: s.store, change: v.change, snapshot: v.snapshot, judgmentId,
      brokenSceneId: scene.id, verdict, remark, at: new Date().toISOString(),
    });
    patch(s, judgmentId, { status: "rolled-back", note: `${scene.id}（以前は○）が崩れたため、この心得を差し戻しました` });
    await queueRemainder(s, judgmentId);
  });
}

/** Initial verification state for a just-written rule. */
export function newVerification(change: UiVerification["change"], snapshot: UiVerification["snapshot"]): UiVerification {
  return { change, snapshot, fixedSet: [], remaining: [], narrowed: false, checked: 0, asked: 0 };
}
