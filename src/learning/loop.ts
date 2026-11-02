/**
 * One step of the learning loop:
 *   apprentice proposes → master judges (○/△/× + remark) → interpreter infers what differed → compiler updates the kokoroe-chō.
 * The judge is injected: the real master in the product, the simulator in evaluation.
 */
import type { Client, Proposal, Scene, Verdict } from "@/src/core/types";
import type { Disciple, Usage } from "@/src/disciple/v0";
import { applyInterpretation, type AppliedChange } from "./compile";
import { interpret, type Interpretation } from "./interpret";
import type { KokoroeStore } from "./store";
import type { JudgmentRecord } from "./types";

export type JudgeFn = (scene: Scene, client: Client, p: Proposal) => Promise<{ verdict: Verdict; remark: string }>;
export type InterpretFn = typeof interpret;

export interface StepResult {
  proposal: Proposal;
  judgment: JudgmentRecord;
  interpretation: Interpretation | null;
  changes: AppliedChange[];
  rulesShown: string[]; // ids of kokoroe-chō rules that were relevant when the proposal was made
}

export async function learnStep(args: {
  store: KokoroeStore;
  disciple: Disciple;
  judge: JudgeFn;
  scene: Scene;
  client: Client;
  interpretFn?: InterpretFn;
  usage?: Usage[];
  now?: () => Date;
}): Promise<StepResult> {
  const { store, disciple, judge, scene, client } = args;
  const rulesShown = (await store.rulesFor(client.id, scene.type)).map((r) => r.id);
  const proposal = await disciple.propose(scene, client);
  const { verdict, remark } = await judge(scene, client, proposal);
  const judgment = await store.addJudgment({
    at: (args.now?.() ?? new Date()).toISOString(),
    sceneId: scene.id,
    clientId: client.id,
    sceneType: scene.type,
    proposal,
    verdict,
    remark,
  });
  if (verdict === "○") return { proposal, judgment, interpretation: null, changes: [], rulesShown };

  // Give the interpreter every rule for this client plus company-wide rules, so it can revise instead of duplicating.
  const existing = (await store.listRules()).filter(
    (r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === client.id),
  );
  const interpretation = await (args.interpretFn ?? interpret)({ scene, client, judgment, existing, usage: args.usage });
  const changes = await applyInterpretation(store, judgment, interpretation);
  return { proposal, judgment, interpretation, changes, rulesShown };
}
