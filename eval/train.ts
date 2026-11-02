/**
 * Walk the training scenes in order through the learning loop, with the simulated master.
 *   npm run train -- --limit 16
 *   npm run train -- --from 10 --limit 10 --store eval/runs/raw/store.json   (continue an existing kokoroe-chō)
 * All data fictional (Daidai Kobo, 10 clients).
 */
import path from "node:path";
import { parseArgs } from "node:util";
import { CLIENTS, EVAL_SCENES, TRAIN_SCENES } from "@/src/core/world";
import { makeDiscipleV1 } from "@/src/disciple/v1";
import { seedFromLedger } from "@/src/learning/ledger";
import { runOnce } from "./evaluate";
import { meanSd, pct } from "./metrics";
import { createSimulatedMaster } from "./simulator/master";
import { LocalJsonStore } from "@/src/learning/store";
import { estimateUsd } from "@/src/lib/cost";
import { trainScenes } from "./training";

async function main() {
  const { values } = parseArgs({
    options: {
      from: { type: "string", default: "0" },
      limit: { type: "string", default: "40" },
      store: { type: "string" },
      seed: { type: "string", default: "7" },
      generalize: { type: "boolean", default: false },
      "seed-ledger": { type: "boolean", default: false },
      "eval-repeat": { type: "string", default: "0" }, // evaluate the final kokoroe-chō on the held-out set N times
    },
  });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const storeFile = values.store ?? path.join(__dirname, "runs", "raw", `store-${stamp}.json`);
  const store = new LocalJsonStore(storeFile);
  const from = Number(values.from);
  const scenes = TRAIN_SCENES.slice(from, from + Number(values.limit));
  const master = createSimulatedMaster(Number(values.seed));
  let ledgerTaps = 0;
  if (values["seed-ledger"]) {
    const l = await seedFromLedger({ store, clients: CLIENTS, master });
    ledgerTaps = l.asked;
    console.log(`seeded ${l.seeded.length} 台帳 rules; "why?" asked ${l.asked}, answered ${l.answered}`);
  }
  const r = await trainScenes({ store, scenes, seed: Number(values.seed), log: console.log, generalize: values.generalize, master });
  r.taps += ledgerTaps;
  console.log(
    `\nmaster taps ${r.taps} over ${scenes.length} scenes | cost ≈ $${(estimateUsd(r.discipleUsage) + estimateUsd(r.interpUsage)).toFixed(3)}` +
      ` (apprentice ${r.discipleUsage.length} calls, interpreter ${r.interpUsage.length} calls)\nstore: ${storeFile}`,
  );
  const n = Number(values["eval-repeat"]);
  if (n > 0) {
    const d = makeDiscipleV1(store, "v1-kokoroe");
    const runs = [];
    for (let k = 0; k < n; k++) runs.push(await runOnce(d, EVAL_SCENES, Number(values.seed), 4));
    const m = meanSd(runs.map((x) => x.total.matchRate));
    const o = meanSd(runs.map((x) => x.total.okOrPartialRate));
    const rules = (await store.listRules()).filter((x) => x.status === "active");
    console.log(`held-out ×${n}: match ${pct(m.mean)} ± ${pct(m.sd)}  ○+△ ${pct(o.mean)} ± ${pct(o.sd)}  | rules ${rules.length} (全社 ${rules.filter((x) => x.scope.clientId === null).length})  | eval ≈ $${estimateUsd(d.usage).toFixed(3)}`);
    runs.forEach((x, i) => console.log(`  run ${i + 1}: ${x.rows.map((y) => y.verdict).join("")}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
