/**
 * After the kokoroe-chō changes:
 *   1. 確かめ稽古 — re-solve the corrected scene with the new rule; the master confirms (1 tap). A ○ joins the regression set.
 *   2. 回帰テスト — re-solve up to N past ○ scenes of the same client. If the decision didn't change, it passes without asking.
 *      If it changed, the master judges it. A non-○ is a regression.
 *   3. On regression: the interpreter gets one chance to narrow the rule using the broken scene; re-check; otherwise 差し戻し
 *      (roll back: an added rule is retired, a revised rule is restored) — recorded in the rule's 沿革.
 *   1'. (D-045) If the master marks the re-solved corrected scene △/×: when the draft follows the new rule's own point, the
 *      rule worked and the rest is learned as a separate correction; when it doesn't, the rule is re-read once from that
 *      judgment and confirmed again, and if it still doesn't take it is withdrawn (取り下げ: not adopted), recorded in its 沿革.
 */
import { enforceHitl } from "@/src/disciple/hitl";
import type { Client, Proposal, Scene } from "@/src/core/types";
import type { Disciple, Usage } from "@/src/disciple/v0";
import { applyCandidate, type AppliedChange } from "./compile";
import { applyFix, jstDate } from "./fix";
import { guardScope } from "./scope";
import type { InterpretFn } from "./loop";
import type { KokoroeStore } from "./store";
import type { JudgmentRecord, KokoroeRule, Master } from "./types";

export const DECISION_FIELDS = ["channel", "meeting", "formalTo", "backchannelTo", "timing", "followUp", "format", "escalateToMaster"] as const;

export function sameDecision(a: Proposal, b: Proposal): boolean {
  return DECISION_FIELDS.every((f) => a[f] === b[f]);
}

export interface Verification {
  confirm: JudgmentRecord | null;
  regressionChecked: number;
  regressionAsked: number;
  narrowed: boolean;
  reinterpreted: boolean; // 確かめ稽古 failed once and the rule was revised from that judgment (D-045)
  withdrawn: boolean; // the rule did not take, even after one re-read: not adopted (D-045)
  remainderLearned: boolean; // the rule took, and the rest of the △/× was learned as a separate correction (D-045)
  rolledBack: boolean;
  brokenSceneId: string | null;
  taps: number;
}

export const MAX_REGRESSION = 3;

/** 差し戻し: an added rule is retired, a revised rule is restored to its snapshot — recorded in the 沿革. Shared by eval and UI. */
export async function rollbackChange(args: {
  store: KokoroeStore;
  change: Pick<AppliedChange, "ruleId" | "action">;
  snapshot: KokoroeRule | undefined;
  judgmentId: string;
  brokenSceneId: string;
  verdict: JudgmentRecord["verdict"];
  remark: string;
  at: string;
  /** D-045: a withdrawal after a failed 確かめ稽古 (default: a regression 差し戻し); "undo": the master took the judgment back. */
  kind?: "regression" | "confirm" | "undo";
  reread?: boolean; // confirm: whether the rule was re-read before the withdrawal (for an accurate 沿革)
}): Promise<void> {
  const now = (await args.store.getRule(args.change.ruleId))!;
  const note = {
    date: jstDate(args.at),
    before: now.when ? `${now.text}（${now.when}）` : now.text,
    after:
      args.kind === "undo"
        ? args.change.action === "add" ? "（取り消し: 廃止）" : `（取り消し）${args.snapshot!.text}`
        : args.kind === "confirm"
        ? args.change.action === "add" ? "（取り下げ: 採用しない）" : `（取り下げ）${args.snapshot!.text}`
        : args.change.action === "add" ? "（差し戻し: 廃止）" : `（差し戻し）${args.snapshot!.text}`,
    trigger: null,
    judgmentId: args.judgmentId,
    masterWords: args.remark,
    reason:
      args.kind === "undo"
        ? "師匠が直前の判定を取り消したため、その判定から書いた変更を戻した"
        : args.kind === "confirm"
        ? `確かめで外れたため取り下げ（${args.brokenSceneId} を解き直した案が心得どおりにならず、${args.reread ? "読み直したあとも " : ""}${args.verdict}）`
        : `回帰テストで ${args.brokenSceneId}（以前は○）が ${args.verdict} になったため差し戻し`,
  };
  const restored: KokoroeRule =
    args.change.action === "add"
      ? { ...now, status: "retired", history: [...now.history, note] }
      : { ...args.snapshot!, sources: args.kind === "undo" ? args.snapshot!.sources : now.sources, history: [...now.history, note] };
  await args.store.saveRule(restored);
}

/**
 * Does a re-solved draft follow the rule's own point (its implied field change)? null = the rule has no recorded point
 * (e.g. a 台帳 rule) — then we cannot tell and do not withdraw.
 */
export function ruleTook(rule: KokoroeRule, p: Proposal): boolean | null {
  const f = rule.fix;
  if (!f) return null;
  if (f.field === "posture") return p.posture.includes(f.value as Proposal["posture"][number]);
  return applyFix(p, f)[f.field] === p[f.field];
}

/**
 * The rule took but the master still marked △/×: learn what is left as a separate correction (never a rewrite of the rule
 * just written). Ambiguous readings go to the master's choice, as in the main loop. Returns the master taps used.
 */
async function learnRemainder(args: {
  store: KokoroeStore; master: Master; scene: Scene; client: Client; judgment: JudgmentRecord; exclude: string;
  interpretFn: InterpretFn; usage?: Usage[];
}): Promise<number> {
  const { store, master, scene, client, judgment } = args;
  const existing = (await store.listRules()).filter((r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === client.id));
  const interp = await args.interpretFn({ scene, client, judgment, existing, usage: args.usage });
  const cands = interp.candidates.map((c) => (c.targetRuleId === args.exclude ? { ...c, action: "add" as const, targetRuleId: null } : c));
  if (!cands.length) return 0;
  const asked = interp.ambiguous || cands.length > 1;
  const chosen = asked ? await master.choose({ scene, client, proposal: judgment.proposal, candidates: cands }) : 0;
  if (chosen !== null) await applyCandidate(store, judgment, guardScope(cands[chosen], judgment.remark), interp);
  return asked ? 1 : 0;
}

/** Latest ○ judgment per scene for this client (drafts, confirmations and earlier regression checks), newest first. */
export async function okScenes(store: KokoroeStore, clientId: string, excludeSceneId: string): Promise<JudgmentRecord[]> {
  const latest = new Map<string, JudgmentRecord>();
  for (const j of await store.listJudgments()) if (j.clientId === clientId && !j.undone) latest.set(j.sceneId, j);
  return [...latest.values()].filter((j) => j.verdict === "○" && j.sceneId !== excludeSceneId).reverse();
}

export async function verifyChange(args: {
  store: KokoroeStore;
  disciple: Disciple;
  master: Master;
  scene: Scene;
  client: Client;
  judgment: JudgmentRecord;
  change: AppliedChange;
  snapshot: KokoroeRule | undefined; // the rule before a revise (undefined for add)
  sceneById: (id: string) => Scene | undefined;
  interpretFn: InterpretFn;
  usage?: Usage[];
  now?: () => Date;
}): Promise<Verification> {
  const { store, disciple, master, scene, client, change } = args;
  const at = () => (args.now?.() ?? new Date()).toISOString();
  const v: Verification = {
    confirm: null, regressionChecked: 0, regressionAsked: 0, narrowed: false, reinterpreted: false, withdrawn: false, remainderLearned: false,
    rolledBack: false, brokenSceneId: null, taps: 0,
  };

  // 1. 確かめ稽古
  const confirmOnce = async () => {
    const again = await disciple.propose(scene, client);
    const cj = await master.judge(scene, client, again);
    v.taps++;
    v.confirm = await store.addJudgment({ at: at(), sceneId: scene.id, clientId: client.id, sceneType: scene.type, proposal: again, verdict: cj.verdict, remark: cj.remark, kind: "confirm" });
  };
  await confirmOnce();
  // 1'. (D-045, revised after a real run) A △/× here often means *another* point is still missing, not that the new rule is
  // wrong. So: if the re-solved draft follows the rule's own point, the rule worked — keep it and learn the remainder as a
  // separate correction. Only when the draft does NOT follow the rule's point: re-read the rule once (same rule, same scope,
  // an unambiguous reading only), confirm again, and withdraw it if it still doesn't take.
  let remainder: JudgmentRecord | null = null;
  while (v.confirm!.verdict !== "○") {
    const rule = (await store.getRule(change.ruleId))!;
    if (ruleTook(rule, v.confirm!.proposal) !== false) {
      remainder = v.confirm!; // learned after this rule's regression check, so a new rule can't break it (review)
      break;
    }
    if (!v.reinterpreted) {
      v.reinterpreted = true;
      const existing = (await store.listRules()).filter((r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === client.id));
      const interp = await args.interpretFn({ scene, client, judgment: v.confirm!, existing, usage: args.usage });
      const c = !interp.ambiguous && interp.candidates.length === 1 ? interp.candidates[0] : undefined;
      if (c) {
        const pick = guardScope({ ...c, action: "revise", targetRuleId: rule.id, scope: { ...c.scope, clientId: rule.scope.clientId } }, v.confirm!.remark);
        const applied = await applyCandidate(store, v.confirm!, pick, interp);
        if (applied.ruleId === rule.id) {
          await confirmOnce();
          continue;
        }
      }
    }
    v.withdrawn = true;
    await rollbackChange({
      store, change, snapshot: args.snapshot, judgmentId: v.confirm!.id,
      brokenSceneId: scene.id, verdict: v.confirm!.verdict, remark: v.confirm!.remark, at: at(), kind: "confirm", reread: v.reinterpreted,
    });
    return v;
  }

  // 2. 回帰テスト — the set is fixed once, before any check (recording a failed re-check must not drop a scene from the retry).
  const regressionSet = (await okScenes(store, client.id, scene.id)).slice(0, MAX_REGRESSION);
  const runRegression = async (): Promise<{ broken: JudgmentRecord; after: Proposal; verdict: JudgmentRecord["verdict"]; remark: string } | null> => {
    for (const past of regressionSet) {
      const s = args.sceneById(past.sceneId);
      if (!s) continue;
      v.regressionChecked++;
      const p = await disciple.propose(s, client);
      // compare with the floored past draft: a change made only by the HITL floor (D-044) is not a regression
      if (sameDecision(enforceHitl(s, past.proposal), p)) continue;
      v.regressionAsked++;
      v.taps++;
      const r = await master.judge(s, client, p);
      await store.addJudgment({ at: at(), sceneId: s.id, clientId: client.id, sceneType: s.type, proposal: p, verdict: r.verdict, remark: r.remark, kind: "regression" });
      if (r.verdict !== "○") return { broken: past, after: p, verdict: r.verdict, remark: r.remark };
    }
    return null;
  };

  let failure = await runRegression();
  if (failure) {
    // 3a. One chance to narrow the rule with the broken scene as evidence.
    const rule = (await store.getRule(change.ruleId))!;
    const existing = (await store.listRules()).filter((r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === client.id));
    const interp = await args.interpretFn({
      scene,
      client,
      judgment: args.judgment,
      existing,
      usage: args.usage,
      conflict: { ruleId: rule.id, ruleText: rule.text, scene: args.sceneById(failure.broken.sceneId)!, before: failure.broken.proposal, after: failure.after, verdict: failure.verdict, remark: failure.remark },
    });
    const c = interp.candidates[0];
    if (c) {
      await applyCandidate(store, args.judgment, { ...c, action: "revise", targetRuleId: rule.id }, interp);
      v.narrowed = true;
      failure = await runRegression();
    }
  }
  if (failure) {
    // 3b. 差し戻し
    v.rolledBack = true;
    v.brokenSceneId = failure.broken.sceneId;
    await rollbackChange({
      store, change, snapshot: args.snapshot, judgmentId: args.judgment.id,
      brokenSceneId: failure.broken.sceneId, verdict: failure.verdict, remark: failure.remark, at: at(),
    });
  }
  if (remainder) {
    v.taps += await learnRemainder({ ...args, judgment: remainder, exclude: change.ruleId });
    v.remainderLearned = true;
  }
  return v;
}
