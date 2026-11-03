/**
 * Collect recorded evaluation results into data/demo/results.json and regenerate the README result tables (no API calls).
 *   npm run demo:results
 * One source for every number shown: the 稽古の記録 screen, the video's numbers scene (s09) and both READMEs read this file
 * (the READMEs through the generated block between the results markers — never edit numbers there by hand; a test checks it).
 * If an official run exists (eval/runs/*-final.json, `npm run eval:final`), it is used; otherwise the interim 11/3 runs.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderReadmeBlock, replaceBlock, type Results } from "./readme-results";

const ROOT = path.resolve(__dirname, "..");
const RUNS = path.resolve(__dirname, "runs");
const read = (f: string) => JSON.parse(readFileSync(path.join(RUNS, f), "utf8"));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => (xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mean(xs)) ** 2, 0) / (xs.length - 1)) : 0);
const range = (xs: number[]) => ({ mean: mean(xs), min: Math.min(...xs), max: Math.max(...xs) });

/** Development history (interim versions of the loop), shown as grey curves on the 稽古の記録 screen. */
const CURVES: { file: string; key: string; label: string; note: string }[] = [
  { file: "2026-11-02T20-21-47-985Z-curve.json", key: "v1", label: "1回目", note: "最初の学習ループ" },
  { file: "2026-11-02T20-48-24-850Z-curve.json", key: "v2", label: "2回目", note: "確かめ稽古と回帰テスト" },
  { file: "2026-11-02T21-06-39-884Z-curve.json", key: "v3", label: "3回目", note: "台帳の心得を弟子にも見せた" },
  { file: "2026-11-02T21-36-30-068Z-curve.json", key: "v4", label: "4回目", note: "台帳は心得帳のみ＋一般化" },
];
type Point = { trainedScenes: number; masterTaps: number; match: { mean: number; sd: number }; okOrPartial: { mean: number }; history: { correct: number } };

function curves() {
  return CURVES.map((c) => ({
    key: c.key,
    label: c.label,
    note: c.note,
    points: (read(c.file).points as Point[]).map((p) => ({
      scenes: p.trainedScenes,
      taps: p.masterTaps,
      match: p.match.mean,
      sd: p.match.sd,
      okp: p.okOrPartial.mean,
      history: p.history.correct,
    })),
  }));
}

type PathIn = { seed: number; match: number; okp: number; taps: number; runs: string[] };
function pathsBlock(paths: PathIn[]) {
  return {
    n: paths.length,
    ...range(paths.map((p) => p.match)),
    okp: range(paths.map((p) => p.okp)),
    taps: range(paths.map((p) => p.taps)),
    paths,
  };
}

function fromFinal(file: string): Omit<Results, "curves"> {
  const f = read(file);
  const paths: PathIn[] = f.after.paths.map((p: { seed: number; match: { mean: number }; okp: { mean: number }; taps: number; runs: string[] }) => ({
    seed: p.seed, match: p.match.mean, okp: p.okp.mean, taps: p.taps, runs: p.runs,
  }));
  return {
    official: true,
    source: file,
    note: `すべて架空データ（取引先10社・学習40場面・評価用20場面・沿革の質問8件）、師匠はシミュレータ。正式な計測（${f.at.slice(0, 10)}）: Before と After は同じ台帳・同じ評価用場面、After は学習${paths.length}本の平均と幅。`,
    caveat: null,
    before: { label: "Before（台帳＋制約だけの弟子 v0）", match: f.before.match.mean, sd: f.before.match.sd, okp: f.before.okp.mean, runs: f.before.runs.length },
    paths: pathsBlock(paths),
    history: [
      { arm: "心得帳なし", mean: f.history.baseline.correct.mean, sd: f.history.baseline.correct.sd },
      { arm: "育った心得帳", mean: f.history.grown.mean, sd: f.history.grown.sd },
    ],
    adversarial: f.adversarial,
  };
}

function fromInterim(files: string[]): Omit<Results, "curves"> {
  // Before = v0 with the corrected ledger (D-033): the latest v0 ×3 run.
  const v0 = files.filter((f) => f.includes("v0-ledger-x3")).map(read).at(-1);
  const runs: string[] = (v0.perScene[0].verdicts as string).split("").map((_: string, k: number) =>
    (v0.perScene as { verdicts: string }[]).map((x) => x.verdicts[k]).join(""),
  );
  const rate = (r: string, ok: (c: string) => boolean) => [...r].filter(ok).length / r.length;
  const matches = runs.map((r) => rate(r, (c) => c === "○"));
  const successor = files.filter((f) => f.includes("successor-x3")).map(read).at(-1);
  const adversarial = files.filter((f) => f.includes("adversarial-x3")).map(read).at(-1);
  const p = files.filter((f) => f.includes("-paths-")).map(read).at(-1);
  const arms = successor.arms as { arm: string; correct: { mean: number; sd: number } }[];
  const results = adversarial.results as { kind: string; pass: boolean; newlyInjected?: string[]; lost?: string[] }[];
  return {
    official: false,
    source: null,
    note: "すべて架空データ（取引先10社・評価用20場面・沿革の質問8件）、師匠はシミュレータ。11/3 の途中経過。Before は修正後の台帳（D-033）、途中経過の After は修正前の台帳で測ったもの。正式な Before／After は 11/7 に同じ台帳・学習5本で取り直す。",
    caveat: {
      en: "Interim (11/3): the Before uses the corrected ledger (D-033), the interim After the previous one — not directly comparable. Both are re-taken on 11/7 with the same ledger and 5 training paths.",
      ja: "途中経過（11/3）: Before は修正後の台帳（D-033）、After は修正前の台帳で測ったもので、そのままは比べられません。11/7 に同じ台帳・学習5本で取り直します。",
    },
    before: { label: "Before（台帳＋制約だけの弟子 v0）", match: mean(matches), sd: sd(matches), okp: mean(runs.map((r) => rate(r, (c) => c !== "×"))), runs: runs.length },
    paths: pathsBlock(p.paths),
    history: [arms[0], arms.at(-1)!].map((a, i) => ({ arm: i ? "育った心得帳" : "心得帳なし", mean: a.correct.mean, sd: a.correct.sd })),
    adversarial: {
      pass: results.filter((r) => r.pass).length,
      n: results.length,
      storeProtected: results.filter((r) => r.kind === "injection" && !r.newlyInjected?.length && !r.lost?.length).length,
      injectionRuns: results.filter((r) => r.kind === "injection").length,
      escalated: results.filter((r) => r.kind === "lure" && r.pass).length,
      lureRuns: results.filter((r) => r.kind === "lure").length,
    },
  };
}

export function buildResults() {
  const files = readdirSync(RUNS).filter((f) => f.endsWith(".json")).sort();
  const final = files.filter((f) => f.endsWith("-final.json")).at(-1);
  const out: Results = { ...(final ? fromFinal(final) : fromInterim(files)), curves: curves() };
  writeFileSync(path.join(ROOT, "data/demo/results.json"), JSON.stringify(out, null, 2) + "\n");
  for (const [file, lang] of [["README.md", "en"], ["README.ja.md", "ja"]] as const) {
    const p = path.join(ROOT, file);
    writeFileSync(p, replaceBlock(readFileSync(p, "utf8"), renderReadmeBlock(out, lang)));
  }
  console.log(
    `${out.official ? `official (${out.source})` : "interim"}: before ${(out.before.match * 100).toFixed(0)}%, after ${(out.paths.mean * 100).toFixed(0)}% ` +
      `(${out.paths.n} paths) → data/demo/results.json, README.md, README.ja.md`,
  );
}

if (require.main === module) buildResults();
