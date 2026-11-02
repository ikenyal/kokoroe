/**
 * Prompt-caching A/B (D-027): the same work with KOKOROE_CACHE=0 and with caching on.
 *   npm run eval:cache-ab -- --repeat 3 --store <kokoroe-chō json for the successor arm>
 * Measures per arm: uncached input / cache write / cache read tokens, USD, per-call latency (mean, p50, p90), and the verdicts —
 * caching must not change what is judged (compared with the known run-to-run spread of v0).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { EVAL_SCENES } from "@/src/core/world";
import { makeClaudeDisciple } from "@/src/disciple/v0";
import { LocalJsonStore } from "@/src/learning/store";
import type { Usage } from "@/src/lib/claude";
import { estimateUsd } from "@/src/lib/cost";
import { runHistoryQuestions, runOnce } from "./evaluate";
import { meanSd, pct } from "./metrics";

const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))];

function summarize(usage: Usage[]) {
  const ms = usage.map((u) => u.ms ?? 0);
  return {
    calls: usage.length,
    uncachedInput: usage.reduce((a, u) => a + u.input_tokens, 0),
    cacheWrite: usage.reduce((a, u) => a + (u.cache_creation_input_tokens ?? 0), 0),
    cacheRead: usage.reduce((a, u) => a + (u.cache_read_input_tokens ?? 0), 0),
    output: usage.reduce((a, u) => a + u.output_tokens, 0),
    usd: Number(estimateUsd(usage).toFixed(4)),
    msMean: Math.round(ms.reduce((a, b) => a + b, 0) / Math.max(1, ms.length)),
    msP50: Math.round(q(ms, 0.5)),
    msP90: Math.round(q(ms, 0.9)),
  };
}

async function main() {
  const { values } = parseArgs({ options: { repeat: { type: "string", default: "3" }, store: { type: "string" } } });
  const repeat = Number(values.repeat);
  const out: Record<string, unknown> = {};
  for (const arm of ["off", "on"] as const) {
    process.env.KOKOROE_CACHE = arm === "off" ? "0" : "1";
    // Apprentice v0 on the held-out set (concurrency 1 so latency isn't mixed with queueing).
    const d = makeClaudeDisciple(`v0-cache-${arm}`);
    const runs = [];
    for (let k = 0; k < repeat; k++) runs.push(await runOnce(d, EVAL_SCENES, 7, 1));
    const match = meanSd(runs.map((r) => r.total.matchRate));
    const apprentice = summarize(d.usage);
    // Successor on the grown kokoroe-chō (2 questions per client → the per-client block can be reused).
    const qa: Usage[] = [];
    const hist = values.store ? await runHistoryQuestions(new LocalJsonStore(values.store), qa) : null;
    const successor = summarize(qa);
    out[arm] = { match, perRun: runs.map((r) => r.rows.map((x) => x.verdict).join("")), apprentice, successor, historyCorrect: hist?.correct };
    console.log(
      `cache ${arm.padEnd(3)} | apprentice: match ${pct(match.mean)} ± ${pct(match.sd)}  in ${apprentice.uncachedInput} / write ${apprentice.cacheWrite} / read ${apprentice.cacheRead}` +
        `  $${apprentice.usd}  latency mean ${apprentice.msMean}ms p50 ${apprentice.msP50} p90 ${apprentice.msP90}` +
        `\n          | successor: in ${successor.uncachedInput} / write ${successor.cacheWrite} / read ${successor.cacheRead}  $${successor.usd}  mean ${successor.msMean}ms  history ${hist?.correct ?? "-"}/8`,
    );
    for (const r of runs) console.log(`          ${r.rows.map((x) => x.verdict).join("")}`);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(path.join(__dirname, "runs"), { recursive: true });
  writeFileSync(path.join(__dirname, "runs", `${stamp}-cache-ab.json`), JSON.stringify({ at: new Date().toISOString(), repeat, ...out }, null, 2) + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
