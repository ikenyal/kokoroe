/**
 * One step of the learning loop:
 *   apprentice proposes → master judges (○/△/× + remark)
 *   → interpreter proposes 1–3 readings → (if ambiguous) master taps the one they meant, or "none of these"
 *   → compiler updates the kokoroe-chō → (new rule) master may say why in one line.
 * The master is injected: the real master in the product, the simulator in evaluation.
 */
import type { Client, Proposal, Scene } from "@/src/core/types";
import type { Disciple, Usage } from "@/src/disciple/v0";
import { applyCandidate, recordTrigger, type AppliedChange } from "./compile";
import { interpret, type Interpretation } from "./interpret";
import type { KokoroeStore } from "./store";
import type { Candidate, JudgmentRecord, Master } from "./types";
import { verifyChange, type Verification } from "./verify";
import { maybeGeneralize, type GeneralizeResult } from "./generalize";
import { guardScope } from "./scope";

export type InterpretFn = typeof interpret;

export interface StepResult {
  proposal: Proposal;
  judgment: JudgmentRecord;
  interpretation: Interpretation | null;
  asked: boolean; // were candidates shown to the master?
  chosen: number | null; // index of the chosen candidate (null = none of these / nothing to choose)
  changes: AppliedChange[];
  trigger: string; // the master's "why", "" if none
  rulesShown: string[]; // kokoroe-chō rules relevant when the proposal was made
  masterTaps: number; // judgment + choice + why + confirmations — how much the master had to do
  verification: Verification | null;
  generalization?: GeneralizeResult | null;
  secondRound?: boolean; // the master said "none of these" and was shown a second set of readings
}

export async function learnStep(args: {
  store: KokoroeStore;
  disciple: Disciple;
  master: Master;
  scene: Scene;
  client: Client;
  interpretFn?: InterpretFn;
  usage?: Usage[];
  now?: () => Date;
  /** Look up earlier scenes for 確かめ稽古 / regression checks. Omit to skip verification. */
  sceneById?: (id: string) => Scene | undefined;
  /** Enable 一般化 (needs sceneById). The master is asked before any rule is widened. */
  generalize?: { clientById: (id: string) => Client };
}): Promise<StepResult> {
  const { store, disciple, master, scene, client } = args;
  const rulesShown = (await store.rulesFor(client.id, scene.type)).map((r) => r.id);
  const proposal = await disciple.propose(scene, client);
  const { verdict, remark } = await master.judge(scene, client, proposal);
  const judgment = await store.addJudgment({
    at: (args.now?.() ?? new Date()).toISOString(),
    sceneId: scene.id,
    clientId: client.id,
    sceneType: scene.type,
    proposal,
    verdict,
    remark,
  });
  const base = { proposal, judgment, rulesShown, trigger: "", verification: null };
  if (verdict === "○") return { ...base, interpretation: null, asked: false, chosen: null, changes: [], masterTaps: 1 };

  // Every rule for this client plus company-wide ones, so the interpreter can revise instead of duplicating.
  const existing = (await store.listRules()).filter(
    (r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === client.id),
  );
  const interpretFn = args.interpretFn ?? interpret;
  let interpretation = await interpretFn({ scene, client, judgment, existing, usage: args.usage });
  let secondRound = false;
  const cands = interpretation.candidates;
  if (!cands.length) return { ...base, interpretation, asked: false, chosen: null, changes: [], masterTaps: 1 };

  const asked = interpretation.ambiguous || cands.length > 1;
  let chosen = asked ? await master.choose({ scene, client, proposal, candidates: cands }) : 0;
  let taps = asked ? 2 : 1;
  let shown = cands;
  if (asked && chosen === null) {
    // Second round (D-025): "none of these" → new readings that differ from the rejected ones; one more tap.
    interpretation = await interpretFn({ scene, client, judgment, existing, usage: args.usage, rejected: cands });
    shown = interpretation.candidates;
    secondRound = true;
    if (shown.length) {
      taps += 1;
      chosen = await master.choose({ scene, client, proposal, candidates: shown });
    }
  }
  if (chosen === null || !shown[chosen]) {
    return { ...base, interpretation, asked, chosen: null, changes: [], masterTaps: taps, secondRound };
  }
  const pick: Candidate = guardScope(shown[chosen], judgment.remark);
  const snapshot = pick.action === "revise" && pick.targetRuleId ? await store.getRule(pick.targetRuleId) : undefined;
  const change = await applyCandidate(store, judgment, pick, interpretation);

  let trigger = "";
  if (change.action === "add") {
    const rule = (await store.getRule(change.ruleId))!;
    trigger = await master.why({ scene, client, rule, candidate: pick });
    taps += 1; // shown the optional "why?" prompt (answering is optional)
    if (trigger) await recordTrigger(store, change.ruleId, trigger);
  }
  let verification: Verification | null = null;
  if (args.sceneById) {
    verification = await verifyChange({
      store, disciple, master, scene, client, judgment, change, snapshot,
      sceneById: args.sceneById,
      interpretFn: args.interpretFn ?? interpret,
      usage: args.usage,
      now: args.now,
    });
    taps += verification.taps;
  }
  let generalization: GeneralizeResult | null = null;
  if (args.generalize && args.sceneById && !verification?.rolledBack && !verification?.withdrawn) {
    generalization = await maybeGeneralize({
      store, disciple, master, ruleId: change.ruleId,
      sceneById: args.sceneById, clientById: args.generalize.clientById,
      usage: args.usage, now: args.now,
    });
    taps += generalization?.taps ?? 0;
  }
  return { ...base, interpretation, asked, chosen, changes: [change], trigger, masterTaps: taps, verification, generalization, secondRound };
}
