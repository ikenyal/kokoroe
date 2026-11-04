/**
 * The official measurement (11/7, after the feature freeze) in one command.
 *   npm run eval:final                 # checks + cost estimate, then stops (no API calls)
 *   npm run eval:final -- --yes        # run it
 *   npm run eval:final -- --yes --resume eval/runs/raw/final-<stamp>   # continue after an interruption
 *
 * What runs (all on fictional data: 10 clients / 40 training + 20 held-out scenes / 8 history questions / 6 adversarial scenes):
 *   Before      apprentice v0 (ledger + explicit constraints, no kokoroe-chō) on the 20 held-out scenes × 6
 *   After       5 training paths (seeds below). Each path: fresh kokoroe-chō → 〔台帳〕 seeding with one "why?" each → 40 training
 *               scenes through the full v1 loop (D-029) with the simulated master → apprentice v1 on the held-out scenes × 3
 *   History     each path's grown kokoroe-chō answers the 8 history questions × 3; baseline without a kokoroe-chō × 3
 *   Adversarial the adversarial set × 3 against the first path's grown kokoroe-chō (copies; the file is never modified)
 * Preconditions checked before anything runs: data/hidden matches its frozen checksums (D-017), the public ledger has the
 * corrected 浜風 wording (D-033), the git tree is clean (the commit is recorded in the result), and the API key is set (--yes only).
 * Output: eval/runs/<stamp>-final.json (committed) → data/demo/results.json and the README tables are regenerated from it
 * (npm run demo:results). Raw parts and the grown kokoroe-chō files stay in eval/runs/raw/final-<stamp>/ (gitignored).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CLIENTS, EVAL_SCENES, TRAIN_SCENES } from "@/src/core/world";
import { discipleV0, visitInEval, type Usage } from "@/src/disciple/v0";
import { makeDiscipleV1 } from "@/src/disciple/v1";
import { seedFromLedger } from "@/src/learning/ledger";
import { LocalJsonStore } from "@/src/learning/store";
import { MODELS } from "@/src/lib/claude";
import { estimateUsd } from "@/src/lib/cost";
import { runAdversarial, summarizeAdversarial } from "./adversarial-run";
import { buildResults } from "./build-results";
import { runHistoryQuestions, runOnce } from "./evaluate";
import { meanSd, pct } from "./metrics";
import { createSimulatedMaster, diffAreaInEval, WHERE_SKIP_DEFAULT } from "./simulator/master";
import { trainScenes } from "./training";

export const FINAL = {
  beforeRuns: 6,
  pathSeeds: [101, 202, 303, 404, 505],
  evalRepeat: 3,
  historyRepeat: 3,
  adversarialRepeat: 3,
  evalSeed: 7, // remark sampling only; verdicts are code
  concurrency: 4,
  trainScenes: 40,
  evalScenes: 20,
};
type Config = typeof FINAL;
/** --smoke: the same code path at toy size (≈ $0.4) to check the pipeline before the real run; writes nothing to eval/runs. */
const SMOKE: Config = { ...FINAL, beforeRuns: 1, pathSeeds: [101], evalRepeat: 1, historyRepeat: 1, adversarialRepeat: 1, trainScenes: 3, evalScenes: 3 };

const ROOT = path.resolve(__dirname, "..");
const RUNS = path.join(__dirname, "runs");
const sha = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const verdicts = (r: { rows: { verdict: string }[] }) => r.rows.map((x) => x.verdict).join("");

/** Preconditions. Returns the facts recorded in the result; throws with a reason if one fails. */
export function preflight(opts: { allowDirty: boolean; needKey: boolean }) {
  const freeze = readJson(path.join(ROOT, "tests/fixtures/hidden-freeze.json")) as { files: Record<string, string> };
  const hiddenDir = path.join(ROOT, "data/hidden");
  const files = readdirSync(hiddenDir).sort();
  if (files.join() !== Object.keys(freeze.files).sort().join()) throw new Error("data/hidden file set differs from the freeze (D-017)");
  for (const f of files) if (sha(path.join(hiddenDir, f)) !== freeze.files[f]) throw new Error(`data/hidden/${f} changed since the freeze (D-017)`);
  const c01 = CLIENTS.find((c) => c.id === "C01");
  if (!c01?.constraints.includes("打ち合わせは可")) throw new Error("public ledger is not the corrected one (D-033: C01 「…打ち合わせは可」)");
  // D-061: the official run never includes the visit plan (the hidden ground truth has no visit etiquette).
  if (visitInEval()) throw new Error("KOKOROE_EVAL_VISIT=on: the official run covers the contact plan only (D-061) — unset it");
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim();
  const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT }).toString().trim();
  if (dirty && !opts.allowDirty) throw new Error(`git tree is not clean — commit first so the result names its code:\n${dirty}`);
  if (opts.needKey && !process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set (.env.local)");
  return {
    commit,
    dirty: Boolean(dirty),
    hiddenFrozen: true,
    ledgerSha256: sha(path.join(ROOT, "data/world/clients.json")),
    companySha256: sha(path.join(ROOT, "data/world/company.json")),
    models: { apprentice: MODELS.disciple, interpreter: MODELS.editor },
  };
}

/** Unit costs from the latest committed runs of the same kind (measured, with prompt caching), with fallbacks. */
export function unitCosts() {
  const files = existsSync(RUNS) ? readdirSync(RUNS).filter((f) => f.endsWith(".json")).sort() : [];
  const latest = (pred: (f: string) => boolean) => {
    const f = files.filter(pred).at(-1);
    return f ? { file: f, data: readJson(path.join(RUNS, f)) } : null;
  };
  const v0 = latest((f) => f.includes("v0-ledger-x3"));
  const paths = latest((f) => f.includes("-paths-"));
  const succ = latest((f) => f.includes("successor-x3"));
  const adv = latest((f) => f.includes("adversarial-x3"));
  const pathUsd: number[] = paths?.data.paths.map((p: { usd: number }) => p.usd) ?? [2.1];
  const arm = (name: string) => succ?.data.arms.find((a: { arm: string }) => a.arm.startsWith(name));
  return {
    sources: [v0, paths, succ, adv].filter(Boolean).map((x) => x!.file),
    beforeRun: v0 ? v0.data.totalUsd / v0.data.repeat : 0.12,
    path: { mean: pathUsd.reduce((a, b) => a + b, 0) / pathUsd.length, max: Math.max(...pathUsd) }, // train 40 + held-out × 3
    historyGrounded: arm("Kokoroe") ? arm("Kokoroe").usd / succ!.data.repeat : 0.06,
    historyGeneral: arm("v0-general") ? arm("v0-general").usd / succ!.data.repeat : 0.03,
    adversarialRun: adv ? adv.data.usd / adv.data.repeat : 0.15,
  };
}

export function estimate(u = unitCosts(), F: Config = FINAL) {
  const n = F.pathSeeds.length;
  const k = F.evalScenes / 20; // unit costs were measured at full size
  const t = (F.trainScenes / 40) * 0.8 + k * (F.evalRepeat / 3) * 0.2; // a path is ~80% training, ~20% held-out × 3 (rough)
  const lines = [
    { part: `Before: v0 × ${F.beforeRuns}`, usd: u.beforeRun * F.beforeRuns * k, high: 0 },
    { part: `After: ${n} paths (train ${F.trainScenes} + held-out × ${F.evalRepeat})`, usd: u.path.mean * n * t, high: u.path.max * n * t },
    { part: `History: ${n} paths × ${F.historyRepeat} + baseline × ${F.historyRepeat}`, usd: u.historyGrounded * n * F.historyRepeat + u.historyGeneral * F.historyRepeat, high: 0 },
    { part: `Adversarial × ${F.adversarialRepeat}`, usd: u.adversarialRun * F.adversarialRepeat, high: 0 },
  ];
  for (const l of lines) l.high ||= l.usd;
  return { lines, usd: lines.reduce((a, l) => a + l.usd, 0), high: lines.reduce((a, l) => a + l.high, 0), sources: u.sources };
}

async function main() {
  const { values } = parseArgs({
    options: {
      yes: { type: "boolean", default: false },
      resume: { type: "string" },
      "allow-dirty": { type: "boolean", default: false },
      parallel: { type: "string", default: "2" }, // training paths at once
      "max-usd": { type: "string" },
      smoke: { type: "boolean", default: false },
    },
  });
  const cfg = values.smoke ? SMOKE : FINAL;
  const evalScenes = EVAL_SCENES.slice(0, cfg.evalScenes);
  const trainSet = TRAIN_SCENES.slice(0, cfg.trainScenes);
  const facts = preflight({ allowDirty: values["allow-dirty"] || !values.yes, needKey: values.yes });
  const est = estimate(unitCosts(), cfg);
  console.log("Official measurement — fictional data (10 clients / 40 training + 20 held-out scenes / 8 history questions / 6 adversarial)");
  console.log(`checks: data/hidden frozen ✓  corrected ledger ✓  commit ${facts.commit.slice(0, 7)}${facts.dirty ? " (dirty)" : ""}`);
  console.log(`models: apprentice ${facts.models.apprentice}, interpreter ${facts.models.interpreter}\n`);
  console.log("estimated cost (unit costs from the latest measured runs):");
  for (const l of est.lines) console.log(`  ${l.part.padEnd(52)} $${l.usd.toFixed(2)}${l.high > l.usd + 0.005 ? `  (up to $${l.high.toFixed(2)})` : ""}`);
  console.log(`  ${"total".padEnd(52)} $${est.usd.toFixed(2)}  (up to $${est.high.toFixed(2)})`);
  console.log(`  based on: ${est.sources.join(", ")}`);
  const maxUsd = Number(values["max-usd"] ?? (est.high * 1.3).toFixed(2));
  console.log(`  stop if the running total would pass $${maxUsd.toFixed(2)} (--max-usd)\n`);
  if (!values.yes) {
    console.log("Not run. Add --yes to run.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = values.resume ? path.resolve(values.resume) : path.join(RUNS, "raw", `final-${stamp}${values.smoke ? "-smoke" : ""}`);
  mkdirSync(dir, { recursive: true });
  const part = (name: string) => path.join(dir, `${name}.json`);
  const done = (name: string) => existsSync(part(name));
  const save = (name: string, data: unknown) => writeFileSync(part(name), JSON.stringify(data, null, 2) + "\n");
  const log = (line: string) => {
    console.log(line);
    writeFileSync(path.join(dir, "log.txt"), line + "\n", { flag: "a" });
  };
  const spent = () =>
    readdirSync(dir).filter((f) => f.endsWith(".json") && !f.includes("store")).reduce((a, f) => a + (readJson(path.join(dir, f)).usd ?? 0), 0);
  let inflight = 0; // estimates of training paths still running (parallel)
  const guard = (next: number, what: string) => {
    if (spent() + inflight + next > maxUsd) throw new Error(`stopping before ${what}: $${spent().toFixed(2)} spent + ~$${next.toFixed(2)} would pass $${maxUsd}. Resume with --resume ${dir} --max-usd <higher>`);
  };
  const u = unitCosts();
  log(`run dir: ${dir}  (commit ${facts.commit.slice(0, 7)})`);

  // Before
  if (!done("before")) {
    guard(u.beforeRun * cfg.beforeRuns, "Before");
    const runs = [];
    for (let k = 0; k < cfg.beforeRuns; k++) {
      const r = await runOnce(discipleV0, evalScenes, cfg.evalSeed, cfg.concurrency);
      runs.push(r);
      log(`Before run ${k + 1}: ${verdicts(r)}  ${pct(r.total.matchRate)}`);
    }
    save("before", {
      runs: runs.map(verdicts),
      match: meanSd(runs.map((r) => r.total.matchRate)),
      okp: meanSd(runs.map((r) => r.total.okOrPartialRate)),
      usd: Number(runs.reduce((a, r) => a + r.tokens.estUsd, 0).toFixed(4)),
    });
  }

  // After: training paths (a path whose part file is missing is redone from an empty kokoroe-chō)
  const runPath = async (seed: number) => {
    const name = `path-${seed}`;
    if (done(name)) return;
    const pathEst = est.lines[1].high / cfg.pathSeeds.length + u.historyGrounded * cfg.historyRepeat;
    guard(pathEst, name);
    inflight += pathEst;
    try {
      await trainPath(seed, name);
    } finally {
      inflight -= pathEst;
    }
  };
  const trainPath = async (seed: number, name: string) => {
    const storeFile = path.join(dir, `${name}.store.json`);
    rmSync(storeFile, { force: true });
    const store = new LocalJsonStore(storeFile);
    const master = createSimulatedMaster(seed);
    const ledger = await seedFromLedger({ store, clients: CLIENTS, master });
    const trainLog: string[] = [];
    const t = await trainScenes({ store, scenes: trainSet, seed, master, generalize: true, log: (l) => trainLog.push(l) });
    writeFileSync(path.join(dir, `${name}.train.log`), trainLog.join("\n") + "\n");
    const d = makeDiscipleV1(store, "v1-kokoroe");
    const runs = [];
    for (let k = 0; k < cfg.evalRepeat; k++) runs.push(await runOnce(d, evalScenes, cfg.evalSeed, cfg.concurrency));
    const qaUsage: Usage[] = [];
    const qa = [];
    for (let k = 0; k < cfg.historyRepeat; k++) qa.push(await runHistoryQuestions(store, qaUsage));
    const rules = (await store.listRules()).filter((r) => r.status === "active");
    const usd = estimateUsd(t.discipleUsage) + estimateUsd(t.interpUsage) + estimateUsd(d.usage) + estimateUsd(qaUsage);
    const result = {
      seed,
      taps: t.taps + ledger.asked,
      judgments: t.judgments,
      ledger: { seeded: ledger.seeded.length, asked: ledger.asked, answered: ledger.answered },
      rules: { active: rules.length, companyWide: rules.filter((r) => r.scope.clientId === null).length },
      runs: runs.map(verdicts),
      match: meanSd(runs.map((r) => r.total.matchRate)),
      okp: meanSd(runs.map((r) => r.total.okOrPartialRate)),
      history: { correct: meanSd(qa.map((q) => q.correct)), answerOk: meanSd(qa.map((q) => q.answerOk)), n: qa[0].n },
      usd: Number(usd.toFixed(4)),
    };
    save(name, result);
    log(`path ${seed}: match ${pct(result.match.mean)} ±${pct(result.match.sd)}  ○+△ ${pct(result.okp.mean)}  taps ${result.taps}  rules ${rules.length}  history ${result.history.correct.mean.toFixed(1)}/8  $${result.usd.toFixed(2)}`);
  };
  const queue = [...cfg.pathSeeds];
  await Promise.all(
    Array.from({ length: Math.max(1, Number(values.parallel)) }, async () => {
      for (let s = queue.shift(); s !== undefined; s = queue.shift()) await runPath(s);
    }),
  );

  // History baseline (no kokoroe-chō)
  if (!done("history-baseline")) {
    guard(u.historyGeneral * cfg.historyRepeat, "history baseline");
    const usage: Usage[] = [];
    const qa = [];
    for (let k = 0; k < cfg.historyRepeat; k++) qa.push(await runHistoryQuestions(null, usage, "general"));
    save("history-baseline", { correct: meanSd(qa.map((q) => q.correct)), answerOk: meanSd(qa.map((q) => q.answerOk)), usd: Number(estimateUsd(usage).toFixed(4)) });
    log(`history baseline (no kokoroe-chō): ${meanSd(qa.map((q) => q.correct)).mean.toFixed(1)}/8`);
  }

  // Adversarial, against the first path's grown kokoroe-chō
  if (!done("adversarial")) {
    guard(u.adversarialRun * cfg.adversarialRepeat, "adversarial");
    const store = path.join(dir, `path-${cfg.pathSeeds[0]}.store.json`);
    const r = await runAdversarial(store, cfg.adversarialRepeat, log);
    save("adversarial", { store: path.basename(store), ...summarizeAdversarial(r.results), results: r.results, usd: r.usd });
  }

  // Assemble
  const before = readJson(part("before"));
  const paths = cfg.pathSeeds.map((s) => readJson(part(`path-${s}`)));
  const histBase = readJson(part("history-baseline"));
  const adv = readJson(part("adversarial"));
  const means = (xs: number[]) => ({ ...meanSd(xs) });
  const summary = {
    kind: "final",
    at: new Date().toISOString(),
    note: "fictional data: 10 clients / 40 training + 20 held-out scenes / 8 history questions / 6 adversarial scenes; master = simulator (code against a frozen hidden ground truth)",
    diffArea: diffAreaInEval() ? `on, asked only when the remark is empty (the simulated master leaves it out ${WHERE_SKIP_DEFAULT * 100}% of the time, an assumption; D-057)` : "off (KOKOROE_EVAL_DIFF_AREA=off)",
    config: FINAL,
    facts,
    runDir: path.relative(ROOT, dir),
    before,
    after: {
      match: means(paths.map((p) => p.match.mean)), // over path means
      okp: means(paths.map((p) => p.okp.mean)),
      taps: means(paths.map((p) => p.taps)),
      paths,
    },
    history: { baseline: histBase, grown: means(paths.map((p) => p.history.correct.mean)) },
    adversarial: { store: adv.store, ...summarizeAdversarial(adv.results) },
    usd: Number((before.usd + paths.reduce((a: number, p: { usd: number }) => a + p.usd, 0) + histBase.usd + adv.usd).toFixed(4)),
    estimateUsd: Number(est.usd.toFixed(2)),
  };
  const out = values.smoke ? path.join(dir, "summary.json") : path.join(RUNS, `${stamp}-final.json`);
  writeFileSync(out, JSON.stringify({ ...summary, smoke: values.smoke }, null, 2) + "\n");
  log(`\nBefore ${pct(before.match.mean)} ±${pct(before.match.sd)} → After ${pct(summary.after.match.mean)} (${pct(summary.after.match.min)}–${pct(summary.after.match.max)}, ${paths.length} paths)`);
  log(`○+△ ${pct(before.okp.mean)} → ${pct(summary.after.okp.mean)} | history ${histBase.correct.mean.toFixed(1)} → ${summary.history.grown.mean.toFixed(1)} / 8 | adversarial ${summary.adversarial.pass}/${summary.adversarial.n}`);
  log(`cost $${summary.usd.toFixed(2)} (estimate $${summary.estimateUsd})  →  ${path.relative(ROOT, out)}`);
  if (values.smoke) return;
  buildResults();
  rmSync(path.join(ROOT, ".claude", ".eval-stale"), { force: true });
}

if (require.main === module)
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
