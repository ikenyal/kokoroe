/**
 * 「どこが違う？」 on / off with the textbook master (Kento 11/4): compares the four paths (on/off × seeds 202, 303) run by
 * eval/personas.ts with KOKOROE_EVAL_DIFF_AREA, and shows for each seed where the on and off training first part ways —
 * before or after the first 「どこが違う？」. No API calls. Fictional data.
 *   npx tsx eval/chooser-ab.ts
 * Output: docs/results/chooser-ab-2026-11-04.json and a table on stdout.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..");
const DATE = "2026-11-04";
const SEEDS = [202, 303];

type Row = { match: number; okp: number; taps: number; rulesActive: number; noneOfThese: number; asked: number; secondRounds?: number; whereAnswered?: number; usd: number };

function load(sw: "on" | "off", seed: number) {
  const j = JSON.parse(readFileSync(path.join(ROOT, "docs", "results", `chooser-ab-${DATE}-${sw}-${seed}.json`), "utf8"));
  const r: Row = j.masters.find((m: { id: string }) => m.id === "textbook").result;
  const log = readFileSync(path.join(__dirname, "runs", "raw", `chooser-ab-${sw}-${seed}`, "textbook.train.log"), "utf8").split("\n");
  return { r, log, diffArea: j.diffArea as string };
}

/** Training log lines without timings, which differ between any two runs. */
const clean = (l: string) => l.replace(/\(\d+(\.\d+)?s\)/g, "").trimEnd();

/** The scene a log line belongs to (the latest line that starts with a training scene id). */
function sceneAt(log: string[], i: number): string {
  for (let k = i; k >= 0; k--) {
    const m = /^(T\d{2}) /.exec(log[k]);
    if (m) return m[1];
  }
  return "?";
}

/** Second readings that the master picked, split by whether an area was given. */
function secondRounds(log: string[]) {
  const out = { withArea: [0, 0], without: [0, 0] };
  for (let i = 0; i < log.length; i++) {
    if (!log[i].includes("2巡目の候補")) continue;
    const key = log[i].includes("どこが違う") ? "withArea" : "without";
    const pick = log.slice(i + 1).find((l) => l.includes("▶"));
    out[key][1]++;
    if (pick?.includes("▶ 候補")) out[key][0]++;
  }
  return out;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const result = [];
for (const seed of SEEDS) {
  const on = load("on", seed);
  const off = load("off", seed);
  const a = on.log.map(clean);
  const b = off.log.map(clean);
  const firstDiff = a.findIndex((l, i) => l !== b[i]);
  const firstArea = on.log.findIndex((l) => l.includes("どこが違う？→") || /「どれでもない」 →/.test(l));
  const firstAreaTapped = on.log.findIndex((l) => l.includes("どこが違う？→"));
  const parted =
    firstDiff < 0 ? "never"
    : firstAreaTapped >= 0 && firstDiff >= firstAreaTapped ? "at or after the first area tapped (where on and off can first differ)"
    : "before any 「どこが違う？」 (the interpreter's own variation)";
  result.push({
    seed,
    on: { ...on.r, secondRounds: secondRounds(on.log) },
    off: { ...off.r, secondRounds: secondRounds(off.log) },
    partedAt: firstDiff < 0 ? null : { line: firstDiff + 1, scene: sceneAt(on.log, firstDiff), on: on.log[firstDiff]?.trim(), off: off.log[firstDiff]?.trim() },
    firstChooser: firstArea < 0 ? null : { line: firstArea + 1, scene: sceneAt(on.log, firstArea), tapped: firstAreaTapped < 0 ? null : sceneAt(on.log, firstAreaTapped) },
    parted,
  });
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const summary = {
  on: { match: mean(result.map((x) => x.on.match)), okp: mean(result.map((x) => x.on.okp)), rules: mean(result.map((x) => x.on.rulesActive)), none: mean(result.map((x) => x.on.noneOfThese / x.on.asked)) },
  off: { match: mean(result.map((x) => x.off.match)), okp: mean(result.map((x) => x.off.okp)), rules: mean(result.map((x) => x.off.rulesActive)), none: mean(result.map((x) => x.off.noneOfThese / x.off.asked)) },
};
const usd = result.reduce((s, x) => s + x.on.usd + x.off.usd, 0);

console.log("「どこが違う？」 on/off, textbook master, fictional 10 clients / 20 held-out scenes (one training path each, held-out ×1)");
for (const x of result) {
  for (const sw of ["on", "off"] as const) {
    const r = x[sw];
    console.log(`seed ${x.seed} ${sw.padEnd(3)} match ${pct(r.match)} ○+△ ${pct(r.okp)} rules ${r.rulesActive} 「どれでもない」 ${r.noneOfThese}/${r.asked} taps ${r.taps}  second readings hit: with area ${r.secondRounds.withArea.join("/")}, without ${r.secondRounds.without.join("/")}  $${r.usd}`);
  }
  console.log(`  parted: line ${x.partedAt?.line} (${x.partedAt?.scene}) — ${x.parted}; first area tapped on the on path: ${x.firstChooser?.tapped ?? "none"}`);
}
console.log(`mean on : match ${pct(summary.on.match)} ○+△ ${pct(summary.on.okp)} rules ${summary.on.rules}`);
console.log(`mean off: match ${pct(summary.off.match)} ○+△ ${pct(summary.off.okp)} rules ${summary.off.rules}`);
console.log(`○+△ on − off: ${Math.round((summary.on.okp - summary.off.okp) * 100)} points (Kento's line: off for the official run if on is 5+ points below)`);
console.log(`spend ≈ $${usd.toFixed(2)}`);
writeFileSync(
  path.join(ROOT, "docs", "results", `chooser-ab-${DATE}.json`),
  JSON.stringify({ at: new Date().toISOString(), note: "fictional data; textbook master; 「どこが違う？」 on/off (KOKOROE_EVAL_DIFF_AREA) × seeds 202, 303; one training path each, held-out ×1; skip rate when on: 20% (assumption, D-057)", usd: Number(usd.toFixed(3)), summary, runs: result }, null, 2) + "\n",
);
