/**
 * Evaluation runner.
 *   npm run eval:quick                    # held-out 20 scenes, naive (no API)
 *   npm run eval:quick -- --disciple v0   # held-out 20 scenes, Claude apprentice v0 (needs ANTHROPIC_API_KEY)
 *
 * Writes eval/runs/<timestamp>-<disciple>.json (summary, committed) and eval/runs/raw/... (full proposals, gitignored).
 * All numbers are on fictional data: 10 clients / 20 held-out scenes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { EVAL_SCENES, getClient } from "@/src/core/world";
import { discipleV0, type Disciple } from "@/src/disciple/v0";
import { naiveDisciple } from "./disciples/naive";
import { judge } from "./simulator/judge";
import { remarkFor, rng } from "./simulator/remark";
import { breakdown, pct, rates, type ScoredScene } from "./metrics";

const DISCIPLES: Record<string, Disciple> = { naive: naiveDisciple, v0: discipleV0 };

async function main() {
  const { values } = parseArgs({
    options: {
      set: { type: "string", default: "eval" },
      disciple: { type: "string", default: "naive" },
      seed: { type: "string", default: "7" },
      concurrency: { type: "string", default: "4" },
    },
  });
  if (values.set !== "eval") throw new Error("only --set eval exists so far");
  const disciple = DISCIPLES[values.disciple!];
  if (!disciple) throw new Error(`unknown disciple ${values.disciple}; use ${Object.keys(DISCIPLES).join("|")}`);
  const rand = rng(Number(values.seed));

  const scenes = EVAL_SCENES;
  const proposals = new Array(scenes.length);
  const t0 = performance.now();
  const limit = Number(values.concurrency);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < scenes.length) {
        const i = next++;
        proposals[i] = await disciple.propose(scenes[i], getClient(scenes[i].clientId));
      }
    }),
  );
  const elapsedMs = performance.now() - t0;

  const rows = scenes.map((s, i) => {
    const r = judge(s, getClient(s.clientId), proposals[i]);
    return { ...r, clientId: s.clientId, type: s.type, remark: remarkFor(r.verdict, r.checks, rand) };
  });
  const scored: ScoredScene[] = rows.map(({ sceneId, clientId, type, verdict }) => ({ sceneId, clientId, type, verdict }));
  const total = rates(scored);

  console.log(`disciple=${disciple.name} set=${values.set} n=${total.n}  (fictional 10 clients / 20 held-out scenes)`);
  for (const r of rows) {
    const why = r.checks.filter((c) => c.outcome !== "ok").map((c) => `${c.ruleId}:${c.why}`).join("; ");
    console.log(`  ${r.sceneId} ${r.clientId} ${r.type.padEnd(3)} ${r.verdict}  ${r.remark ? `「${r.remark}」` : ""}  ${why}`);
  }
  console.log(`○ ${total.ok}  △ ${total.partial}  × ${total.ng}  | match(○) ${pct(total.matchRate)}  ○+△ ${pct(total.okOrPartialRate)}  | ${(elapsedMs / 1000).toFixed(1)}s`);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(__dirname, "runs");
  mkdirSync(path.join(dir, "raw"), { recursive: true });
  const summary = {
    at: new Date().toISOString(),
    disciple: disciple.name,
    set: values.set,
    seed: Number(values.seed),
    note: "fictional 10 clients / 20 held-out scenes",
    total,
    byType: breakdown(scored, "type"),
    byClient: breakdown(scored, "clientId"),
    scenes: rows.map(({ sceneId, verdict, remark }) => ({ sceneId, verdict, remark })),
  };
  writeFileSync(path.join(dir, `${stamp}-${disciple.name}.json`), JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(
    path.join(dir, "raw", `${stamp}-${disciple.name}.json`),
    JSON.stringify(rows.map((r, i) => ({ ...r, proposal: proposals[i] })), null, 2) + "\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
