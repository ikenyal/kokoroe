/**
 * Evaluation runner.
 *   npm run eval:quick                                  # held-out 20 scenes, naive (no API)
 *   npm run eval:quick -- --disciple v0 --repeat 3      # Claude apprentice v0, 3 runs → mean ± sd
 *
 * Writes eval/runs/<timestamp>-<disciple>.json (summary, committed) and eval/runs/raw/... (full proposals, gitignored).
 * All numbers are on fictional data: 10 clients / 20 held-out scenes. Compare disciples on the mean of several runs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { EVAL_SCENES, getClient } from "@/src/core/world";
import type { Proposal, Scene } from "@/src/core/types";
import { discipleV0, type Disciple } from "@/src/disciple/v0";
import { estimateUsd } from "@/src/lib/cost";
import { naiveDisciple } from "./disciples/naive";
import { judge } from "./simulator/judge";
import { remarkFor, rng } from "./simulator/remark";
import { breakdown, meanSd, pct, rates, type ScoredScene } from "./metrics";

const DISCIPLES: Record<string, Disciple> = { naive: naiveDisciple, v0: discipleV0 };

async function proposeAll(disciple: Disciple, scenes: Scene[], concurrency: number): Promise<Proposal[]> {
  const out = new Array<Proposal>(scenes.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < scenes.length) {
        const i = next++;
        out[i] = await disciple.propose(scenes[i], getClient(scenes[i].clientId));
      }
    }),
  );
  return out;
}

async function runOnce(disciple: Disciple, scenes: Scene[], seed: number, concurrency: number) {
  const usageStart = disciple.usage?.length ?? 0;
  const t0 = performance.now();
  const proposals = await proposeAll(disciple, scenes, concurrency);
  const elapsedSec = Number(((performance.now() - t0) / 1000).toFixed(1));
  const rand = rng(seed);
  const rows = scenes.map((s, i) => {
    const r = judge(s, getClient(s.clientId), proposals[i]);
    return { ...r, clientId: s.clientId, type: s.type, remark: remarkFor(r.verdict, r.checks, rand) };
  });
  const scored: ScoredScene[] = rows.map(({ sceneId, clientId, type, verdict }) => ({ sceneId, clientId, type, verdict }));
  const usage = (disciple.usage ?? []).slice(usageStart);
  const tokens = {
    calls: usage.length,
    input: usage.reduce((a, u) => a + u.input_tokens, 0),
    output: usage.reduce((a, u) => a + u.output_tokens, 0),
    estUsd: Number(estimateUsd(usage).toFixed(4)),
  };
  return { rows, scored, total: rates(scored), elapsedSec, tokens, proposals };
}

async function main() {
  const { values } = parseArgs({
    options: {
      set: { type: "string", default: "eval" },
      disciple: { type: "string", default: "naive" },
      seed: { type: "string", default: "7" },
      concurrency: { type: "string", default: "4" },
      repeat: { type: "string", default: "1" },
    },
  });
  if (values.set !== "eval") throw new Error("only --set eval exists so far");
  const disciple = DISCIPLES[values.disciple!];
  if (!disciple) throw new Error(`unknown disciple ${values.disciple}; use ${Object.keys(DISCIPLES).join("|")}`);
  const repeat = Number(values.repeat);
  const seed = Number(values.seed);

  console.log(`disciple=${disciple.name} set=${values.set} repeat=${repeat}  (fictional 10 clients / 20 held-out scenes)`);
  const runs: Awaited<ReturnType<typeof runOnce>>[] = [];
  for (let k = 0; k < repeat; k++) {
    const r = await runOnce(disciple, EVAL_SCENES, seed, Number(values.concurrency));
    runs.push(r);
    if (repeat === 1) {
      for (const row of r.rows) {
        const why = row.checks.filter((c) => c.outcome !== "ok").map((c) => `${c.ruleId}:${c.why}`).join("; ");
        console.log(`  ${row.sceneId} ${row.clientId} ${row.type.padEnd(3)} ${row.verdict}  ${row.remark ? `「${row.remark}」` : ""}  ${why}`);
      }
    } else {
      console.log(`  run ${k + 1}: ${r.rows.map((x) => x.verdict).join("")}`);
    }
    console.log(
      `  ○ ${r.total.ok}  △ ${r.total.partial}  × ${r.total.ng} | match ${pct(r.total.matchRate)}  ○+△ ${pct(r.total.okOrPartialRate)} | ${r.elapsedSec}s` +
        (r.tokens.calls ? ` | ≈ $${r.tokens.estUsd}` : ""),
    );
  }

  const match = meanSd(runs.map((r) => r.total.matchRate));
  const okp = meanSd(runs.map((r) => r.total.okOrPartialRate));
  const usd = runs.reduce((a, r) => a + r.tokens.estUsd, 0);
  // Per-scene stability: how often each scene got each verdict across runs.
  const perScene = EVAL_SCENES.map((s, i) => ({
    sceneId: s.id,
    verdicts: runs.map((r) => r.rows[i].verdict).join(""),
  }));
  const unstable = perScene.filter((x) => new Set(x.verdicts).size > 1);
  console.log(
    `mean over ${repeat}: match ${pct(match.mean)} ± ${pct(match.sd)}  ○+△ ${pct(okp.mean)} ± ${pct(okp.sd)}` +
      (usd ? `  | total ≈ $${usd.toFixed(3)}` : ""),
  );
  if (repeat > 1) console.log(`unstable scenes: ${unstable.map((x) => `${x.sceneId}(${x.verdicts})`).join(" ") || "none"}`);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(__dirname, "runs");
  mkdirSync(path.join(dir, "raw"), { recursive: true });
  const summary = {
    at: new Date().toISOString(),
    disciple: disciple.name,
    set: values.set,
    seed,
    repeat,
    note: "fictional 10 clients / 20 held-out scenes",
    mean: { matchRate: match, okOrPartialRate: okp },
    totalUsd: Number(usd.toFixed(4)),
    perScene,
    runs: runs.map((r) => ({
      total: r.total,
      elapsedSec: r.elapsedSec,
      tokens: r.tokens,
      byType: breakdown(r.scored, "type"),
      byClient: breakdown(r.scored, "clientId"),
      scenes: r.rows.map(({ sceneId, verdict, remark }) => ({ sceneId, verdict, remark })),
    })),
  };
  writeFileSync(path.join(dir, `${stamp}-${disciple.name}-x${repeat}.json`), JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(
    path.join(dir, "raw", `${stamp}-${disciple.name}-x${repeat}.json`),
    JSON.stringify(runs.map((r) => r.rows.map((row, i) => ({ ...row, proposal: r.proposals[i] }))), null, 2) + "\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
