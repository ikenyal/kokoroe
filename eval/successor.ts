/**
 * 暖簾を継ぐ — history questions (8) answered by the successor assistant, repeated runs.
 *   npm run eval:successor -- --store eval/runs/raw/curve-store-<stamp>.json --repeat 3
 * Compares: general (no kokoroe-chō, sensible assistant) / grounded with an empty book / grounded with the grown kokoroe-chō.
 * Fictional data; 8 history questions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import type { Usage } from "@/src/disciple/v0";
import { LocalJsonStore } from "@/src/learning/store";
import { estimateUsd } from "@/src/lib/cost";
import { runHistoryQuestions } from "./evaluate";
import { meanSd } from "./metrics";

async function main() {
  const { values } = parseArgs({ options: { store: { type: "string" }, repeat: { type: "string", default: "3" } } });
  if (!values.store) throw new Error("--store <grown kokoroe-chō json> is required");
  const grown = new LocalJsonStore(values.store);
  const empty = new LocalJsonStore(null);
  const repeat = Number(values.repeat);
  const arms = [
    { name: "v0-general (no kokoroe-chō)", store: null, mode: "general" as const },
    { name: "grounded, empty kokoroe-chō", store: empty, mode: "grounded" as const },
    { name: "Kokoroe (grown kokoroe-chō)", store: grown, mode: "grounded" as const },
  ];
  const out = [];
  for (const arm of arms) {
    const usage: Usage[] = [];
    const runs = [];
    for (let k = 0; k < repeat; k++) runs.push(await runHistoryQuestions(arm.store, usage, arm.mode));
    const correct = meanSd(runs.map((r) => r.correct));
    const answerOk = meanSd(runs.map((r) => r.answerOk));
    const unknown = meanSd(runs.map((r) => r.unknown));
    const usd = estimateUsd(usage);
    console.log(
      `${arm.name.padEnd(30)} correct(with history) ${correct.mean.toFixed(1)}/8 ± ${correct.sd.toFixed(1)}  yes/no right ${answerOk.mean.toFixed(1)}/8  unknown ${unknown.mean.toFixed(1)}  ≈ $${usd.toFixed(3)}`,
    );
    for (const r of runs.at(-1)!.results) {
      console.log(`    ${r.id} ${r.answer.padEnd(7)} ${r.historyOk ? "✓" : "✗"}${r.missing.length ? ` missing:${r.missing.map((g) => g[0]).join(",")}` : ""}${r.citationsValid ? "" : " bad-citation"}  cites:${r.citations.map((c) => c.ruleId).join(",") || "-"}`);
    }
    out.push({ arm: arm.name, mode: arm.mode, correct, answerOk, unknown, usd: Number(usd.toFixed(4)), lastRun: runs.at(-1)!.results });
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(path.join(__dirname, "runs"), { recursive: true });
  writeFileSync(
    path.join(__dirname, "runs", `${stamp}-successor-x${repeat}.json`),
    JSON.stringify({ at: new Date().toISOString(), note: "fictional data; 8 history questions", store: path.basename(values.store), repeat, arms: out }, null, 2) + "\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
