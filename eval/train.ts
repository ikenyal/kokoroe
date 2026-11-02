/**
 * Walk the training scenes in order through the learning loop, with the simulated master.
 *   npm run train -- --limit 16
 *   npm run train -- --from 10 --limit 10 --store eval/runs/raw/store.json   (continue an existing kokoroe-chō)
 * All data fictional (Daidai Kobo, 10 clients).
 */
import path from "node:path";
import { parseArgs } from "node:util";
import { TRAIN_SCENES } from "@/src/core/world";
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
    },
  });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const storeFile = values.store ?? path.join(__dirname, "runs", "raw", `store-${stamp}.json`);
  const store = new LocalJsonStore(storeFile);
  const from = Number(values.from);
  const scenes = TRAIN_SCENES.slice(from, from + Number(values.limit));
  const r = await trainScenes({ store, scenes, seed: Number(values.seed), log: console.log });
  console.log(
    `\nmaster taps ${r.taps} over ${scenes.length} scenes | cost ≈ $${(estimateUsd(r.discipleUsage) + estimateUsd(r.interpUsage)).toFixed(3)}` +
      ` (apprentice ${r.discipleUsage.length} calls, interpreter ${r.interpUsage.length} calls)\nstore: ${storeFile}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
