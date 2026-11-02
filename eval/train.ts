/**
 * Walk the training scenes in order through the learning loop, with the master simulator as the judge.
 *   npm run train -- --limit 16            # first 16 train scenes, fresh in-memory kokoroe-chō
 *   npm run train -- --store eval/runs/raw/store.json
 *
 * Prints each step and, for every correction, what happened at the next scene of the same client.
 * All data fictional (Daidai Kobo, 10 clients).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import type { Usage } from "@/src/disciple/v0";
import { makeDiscipleV1 } from "@/src/disciple/v1";
import { renderRules } from "@/src/learning/compile";
import { describeProposal } from "@/src/learning/describe";
import { learnStep, type StepResult } from "@/src/learning/loop";
import { LocalJsonStore } from "@/src/learning/store";
import { estimateUsd } from "@/src/lib/cost";
import { judge } from "./simulator/judge";
import { remarkFor, rng } from "./simulator/remark";

async function main() {
  const { values } = parseArgs({
    options: {
      limit: { type: "string", default: "40" },
      store: { type: "string" },
      seed: { type: "string", default: "7" },
    },
  });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const storeFile = values.store ?? path.join(__dirname, "runs", "raw", `store-${stamp}.json`);
  const store = new LocalJsonStore(storeFile);
  const disciple = makeDiscipleV1(store);
  const interpUsage: Usage[] = [];
  const rand = rng(Number(values.seed));
  const simulator = async (...[scene, client, p]: Parameters<typeof judge>) => {
    const r = judge(scene, client, p);
    return { verdict: r.verdict, remark: remarkFor(r.verdict, r.checks, rand), checks: r.checks };
  };

  const scenes = TRAIN_SCENES.slice(0, Number(values.limit));
  const steps: (StepResult & { sceneId: string; clientId: string; failing: string[]; ms: number })[] = [];
  for (const scene of scenes) {
    const client = getClient(scene.clientId);
    let failing: string[] = [];
    const t0 = performance.now();
    const r = await learnStep({
      store,
      disciple,
      scene,
      client,
      usage: interpUsage,
      judge: async (s, c, p) => {
        const j = await simulator(s, c, p);
        failing = j.checks.filter((x) => x.outcome !== "ok").map((x) => x.ruleId); // log only; never given to the apprentice
        return { verdict: j.verdict, remark: j.remark };
      },
    });
    const ms = performance.now() - t0;
    steps.push({ ...r, sceneId: scene.id, clientId: scene.clientId, failing, ms });
    const used = r.proposal.basedOnRules.length ? ` uses[${r.proposal.basedOnRules.join(",")}]` : "";
    console.log(
      `${scene.id} ${scene.clientId} ${scene.type.padEnd(3)} ${r.judgment.verdict} ${r.judgment.remark ? `「${r.judgment.remark}」` : "      "}` +
        ` shown[${r.rulesShown.join(",")}]${used}  (${(ms / 1000).toFixed(1)}s)  hidden-fail:${failing.join(",") || "-"}`,
    );
    for (const c of r.changes) console.log(`    ${c.action} ${c.ruleId}: ${c.after}`);
  }

  // "Corrected once → next similar scene changes": for each △/×, look at the next scene of the same client.
  console.log("\n--- correction → next scene of the same client ---");
  const pairs = [];
  for (let i = 0; i < steps.length; i++) {
    const a = steps[i];
    if (a.judgment.verdict === "○" || !a.changes.length) continue;
    const b = steps.slice(i + 1).find((s) => s.clientId === a.clientId);
    if (!b) continue;
    const learned = a.changes.map((c) => c.ruleId);
    const shown = learned.filter((id) => b.rulesShown.includes(id));
    const fixed = a.failing.filter((rule) => !b.failing.includes(rule));
    pairs.push({ from: a.sceneId, to: b.sceneId, learned, shown, before: a.judgment.verdict, after: b.judgment.verdict, fixedHiddenRules: fixed });
    console.log(
      `${a.sceneId}(${a.judgment.verdict}) → ${b.sceneId}(${b.judgment.verdict})  learned[${learned.join(",")}] shown-next[${shown.join(",") || "-"}]` +
        `  hidden rules failed before and not after: ${fixed.join(",") || "-"}`,
    );
  }

  const dUsd = estimateUsd(disciple.usage);
  const iUsd = estimateUsd(interpUsage);
  console.log(`\ncost ≈ $${(dUsd + iUsd).toFixed(3)} (apprentice $${dUsd.toFixed(3)} / ${disciple.usage.length} calls, interpreter $${iUsd.toFixed(3)} / ${interpUsage.length} calls)`);
  console.log(`store: ${storeFile}`);

  const rules = await store.listRules();
  const dir = path.join(__dirname, "runs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, `${stamp}-train-${scenes.length}.json`),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        note: "fictional data; simulator as master",
        scenes: steps.map((s) => ({ sceneId: s.sceneId, verdict: s.judgment.verdict, remark: s.judgment.remark, shown: s.rulesShown, changes: s.changes })),
        pairs,
        rules: rules.length,
        costUsd: Number((dUsd + iUsd).toFixed(4)),
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(path.join(dir, "raw", `${stamp}-kokoroe.md`), renderRules("心得帳（学習の途中経過）", rules));
  // Keep a readable sample of what changed for the report.
  const sample = pairs.find((p) => p.shown.length && p.fixedHiddenRules.length);
  if (sample) {
    const a = steps.find((s) => s.sceneId === sample.from)!;
    const b = steps.find((s) => s.sceneId === sample.to)!;
    console.log(`\n=== example: ${sample.from} → ${sample.to} ===\n[before]\n${describeProposal(a.proposal, getClient(a.clientId))}\n[after]\n${describeProposal(b.proposal, getClient(b.clientId))}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
