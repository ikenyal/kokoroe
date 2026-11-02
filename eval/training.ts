/**
 * Run a sequence of training scenes through the learning loop with the simulated master (used by train.ts and curve.ts).
 */
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import type { Scene } from "@/src/core/types";
import type { Usage } from "@/src/disciple/v0";
import { makeDiscipleV1 } from "@/src/disciple/v1";
import { learnStep, type StepResult } from "@/src/learning/loop";
import type { KokoroeStore } from "@/src/learning/store";
import { createSimulatedMaster } from "./simulator/master";

export interface TrainedStep extends StepResult {
  sceneId: string;
  clientId: string;
  hiddenFailing: string[]; // log only
  sec: number;
}

export async function trainScenes(args: {
  store: KokoroeStore;
  scenes: Scene[];
  seed: number;
  log?: (line: string) => void;
}) {
  const { store, scenes } = args;
  const log = args.log ?? (() => {});
  const disciple = makeDiscipleV1(store);
  const master = createSimulatedMaster(args.seed);
  const interpUsage: Usage[] = [];
  const steps: TrainedStep[] = [];
  const sceneById = (id: string) => TRAIN_SCENES.find((s) => s.id === id);
  for (const scene of scenes) {
    const client = getClient(scene.clientId);
    const t0 = performance.now();
    const mark = master.failingLog().length; // the step's first judgment is the draft
    const r = await learnStep({ store, disciple, master, scene, client, usage: interpUsage, sceneById });
    const step = { ...r, sceneId: scene.id, clientId: scene.clientId, hiddenFailing: master.failingLog()[mark] ?? [], sec: (performance.now() - t0) / 1000 };
    steps.push(step);
    const used = r.proposal.basedOnRules.length ? ` uses[${r.proposal.basedOnRules.join(",")}]` : "";
    log(
      `${scene.id} ${scene.clientId} ${scene.type.padEnd(3)} ${r.judgment.verdict} ${r.judgment.remark ? `「${r.judgment.remark}」` : "（一言なし）"}` +
        ` shown[${r.rulesShown.join(",")}]${used} (${step.sec.toFixed(1)}s) hidden-fail:${step.hiddenFailing.join(",") || "-"}`,
    );
    if (r.interpretation && r.asked) {
      r.interpretation.candidates.forEach((c, i) =>
        log(`    ${i === r.chosen ? "▶" : " "} 候補${i + 1}: ${c.text}${c.when ? `（${c.when}）` : ""}  [${c.fix.field}=${c.fix.value}]`),
      );
      if (r.chosen === null) log("    ▶ どれでもない");
    }
    for (const c of r.changes) log(`    ${c.action} ${c.ruleId}: ${c.after}`);
    if (r.trigger) log(`    経緯: ${r.trigger}`);
    const v = r.verification;
    if (v)
      log(
        `    確かめ ${v.confirm?.verdict ?? "-"} | 回帰 ${v.regressionChecked}件（師匠に確認 ${v.regressionAsked}）` +
          `${v.narrowed ? " | 範囲を絞った" : ""}${v.rolledBack ? ` | 差し戻し（${v.brokenSceneId} が崩れた）` : ""}`,
      );
  }
  return {
    steps,
    taps: steps.reduce((a, s) => a + s.masterTaps, 0),
    judgments: steps.length,
    discipleUsage: disciple.usage,
    interpUsage,
  };
}
