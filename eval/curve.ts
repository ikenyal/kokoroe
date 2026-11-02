/**
 * Learning curve: train on the 40 training scenes in steps of 10; at 0/10/20/30/40, measure the apprentice (v1 + current
 * kokoroe-chō) on the 20 held-out scenes `repeat` times, and the successor on the 8 history questions.
 *   npm run curve                 (≈ $4–5 at current prices)
 *   npm run curve -- --repeat 3 --step 10
 * x = master's confirmations so far (judgments, and also all taps incl. choices / "why" prompts); y = match rate (mean ± sd).
 * Fictional data: 10 clients / 40 training + 20 held-out scenes / 8 history questions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CLIENTS, EVAL_SCENES, TRAIN_SCENES } from "@/src/core/world";
import { seedFromLedger } from "@/src/learning/ledger";
import { createSimulatedMaster } from "./simulator/master";
import type { Usage } from "@/src/disciple/v0";
import { makeDiscipleV1 } from "@/src/disciple/v1";
import { renderRules } from "@/src/learning/compile";
import { LocalJsonStore } from "@/src/learning/store";
import { estimateUsd } from "@/src/lib/cost";
import { runHistoryQuestions, runOnce } from "./evaluate";
import { meanSd, pct } from "./metrics";
import { trainScenes } from "./training";

async function main() {
  const { values } = parseArgs({
    options: {
      repeat: { type: "string", default: "3" },
      step: { type: "string", default: "10" },
      seed: { type: "string", default: "7" },
      concurrency: { type: "string", default: "4" },
      "seed-ledger": { type: "boolean", default: false },
      generalize: { type: "boolean", default: false },
    },
  });
  const repeat = Number(values.repeat);
  const stepSize = Number(values.step);
  const seed = Number(values.seed);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const rawDir = path.join(__dirname, "runs", "raw");
  const storeFile = path.join(rawDir, `curve-store-${stamp}.json`);
  const store = new LocalJsonStore(storeFile);
  const disciple = makeDiscipleV1(store, "v1-kokoroe");
  const evalUsage: Usage[] = disciple.usage;
  const qaUsage: Usage[] = [];
  let trainUsd = 0;
  let judgments = 0;
  let taps = 0;
  const points = [];
  const trainLog: string[] = [];
  let ledger = null;
  if (values["seed-ledger"]) {
    // D-020: seed explicit constraints as 台帳 rules; ask "why?" once per item. These prompts count as master taps.
    ledger = await seedFromLedger({ store, clients: CLIENTS, master: createSimulatedMaster(seed) });
    taps += ledger.asked;
    console.log(`seeded ${ledger.seeded.length} ledger rules; "why?" asked ${ledger.asked}, answered ${ledger.answered}`);
  }

  for (let done = 0; ; done += stepSize) {
    // Measure at this checkpoint.
    const usdBefore = estimateUsd(evalUsage) + estimateUsd(qaUsage);
    const runs = [];
    for (let k = 0; k < repeat; k++) runs.push(await runOnce(disciple, EVAL_SCENES, seed, Number(values.concurrency)));
    const qa = await runHistoryQuestions(store, qaUsage);
    const match = meanSd(runs.map((r) => r.total.matchRate));
    const okp = meanSd(runs.map((r) => r.total.okOrPartialRate));
    const rules = (await store.listRules()).filter((r) => r.status === "active").length;
    const point = {
      trainedScenes: done,
      judgments,
      masterTaps: taps,
      rules,
      match,
      okOrPartial: okp,
      perRun: runs.map((r) => r.rows.map((x) => x.verdict).join("")),
      history: { correct: qa.correct, answerOk: qa.answerOk, n: qa.n, results: qa.results },
      measureUsd: Number((estimateUsd(evalUsage) + estimateUsd(qaUsage) - usdBefore).toFixed(4)),
    };
    points.push(point);
    console.log(
      `[${String(done).padStart(2)} scenes | ${judgments} judgments / ${taps} taps | ${rules} rules] ` +
        `match ${pct(match.mean)} ± ${pct(match.sd)}  ○+△ ${pct(okp.mean)} ± ${pct(okp.sd)}  history ${qa.correct}/${qa.n}` +
        `  (measure ≈ $${point.measureUsd})`,
    );
    writeFileSync(path.join(rawDir, `curve-${stamp}-kokoroe-at-${done}.md`), renderRules(`心得帳（学習 ${done} 場面後）`, await store.listRules()));
    if (done >= TRAIN_SCENES.length) break;

    // Train the next block.
    const block = TRAIN_SCENES.slice(done, done + stepSize);
    const t = await trainScenes({ store, scenes: block, seed: seed + done, log: (l) => trainLog.push(l), generalize: values.generalize });
    judgments += t.judgments;
    taps += t.taps;
    trainUsd += estimateUsd(t.discipleUsage) + estimateUsd(t.interpUsage);
  }

  const totalUsd = estimateUsd(evalUsage) + estimateUsd(qaUsage) + trainUsd;
  console.log(`total ≈ $${totalUsd.toFixed(3)} (training ≈ $${trainUsd.toFixed(3)})`);

  mkdirSync(rawDir, { recursive: true });
  const summary = {
    at: new Date().toISOString(),
    note: "fictional 10 clients / 40 training + 20 held-out scenes / 8 history questions; master = simulator",
    repeat,
    stepSize,
    seed,
    ledgerSeed: ledger,
    generalize: values.generalize,
    points: points.map((p) => ({ ...p, history: { correct: p.history.correct, answerOk: p.history.answerOk, n: p.history.n } })),
    totalUsd: Number(totalUsd.toFixed(4)),
  };
  writeFileSync(path.join(__dirname, "runs", `${stamp}-curve.json`), JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(path.join(rawDir, `curve-${stamp}-detail.json`), JSON.stringify({ points, trainLog }, null, 2) + "\n");
  writeFileSync(path.join(rawDir, `curve-${stamp}-train.log`), trainLog.join("\n") + "\n");
  console.log(`summary: eval/runs/${stamp}-curve.json  | train log: ${path.join(rawDir, `curve-${stamp}-train.log`)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
