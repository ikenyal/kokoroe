/**
 * After the kokoroe-chō changes:
 *   1. 確かめ稽古 — re-solve the corrected scene with the new rule; the master confirms (1 tap). A ○ joins the regression set.
 *   2. 回帰テスト — re-solve up to N past ○ scenes of the same client. If the decision didn't change, it passes without asking.
 *      If it changed, the master judges it. A non-○ is a regression.
 *   3. On regression: the interpreter gets one chance to narrow the rule using the broken scene; re-check; otherwise 差し戻し
 *      (roll back: an added rule is retired, a revised rule is restored) — recorded in the rule's 沿革.
 */
import { enforceHitl } from "@/src/disciple/hitl";
import type { Client, Proposal, Scene } from "@/src/core/types";
import type { Disciple, Usage } from "@/src/disciple/v0";
import { applyCandidate, type AppliedChange } from "./compile";
import { jstDate } from "./fix";
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
}): Promise<void> {
  const now = (await args.store.getRule(args.change.ruleId))!;
  const note = {
    date: jstDate(args.at),
    before: now.when ? `${now.text}（${now.when}）` : now.text,
    after: args.change.action === "add" ? "（差し戻し: 廃止）" : `（差し戻し）${args.snapshot!.text}`,
    trigger: null,
    judgmentId: args.judgmentId,
    masterWords: args.remark,
    reason: `回帰テストで ${args.brokenSceneId}（以前は○）が ${args.verdict} になったため差し戻し`,
  };
  const restored: KokoroeRule =
    args.change.action === "add"
      ? { ...now, status: "retired", history: [...now.history, note] }
      : { ...args.snapshot!, sources: now.sources, history: [...now.history, note] };
  await args.store.saveRule(restored);
}

/** Latest ○ judgment per scene for this client (drafts, confirmations and earlier regression checks), newest first. */
export async function okScenes(store: KokoroeStore, clientId: string, excludeSceneId: string): Promise<JudgmentRecord[]> {
  const latest = new Map<string, JudgmentRecord>();
  for (const j of await store.listJudgments()) if (j.clientId === clientId) latest.set(j.sceneId, j);
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
  const v: Verification = { confirm: null, regressionChecked: 0, regressionAsked: 0, narrowed: false, rolledBack: false, brokenSceneId: null, taps: 0 };

  // 1. 確かめ稽古
  const again = await disciple.propose(scene, client);
  const cj = await master.judge(scene, client, again);
  v.taps++;
  v.confirm = await store.addJudgment({ at: at(), sceneId: scene.id, clientId: client.id, sceneType: scene.type, proposal: again, verdict: cj.verdict, remark: cj.remark, kind: "confirm" });

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
  return v;
}
