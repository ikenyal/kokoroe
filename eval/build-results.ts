/**
 * Collect recorded evaluation results into data/demo/results.json for the 稽古の記録 screen (no API calls).
 *   npm run demo:results
 * Every number comes from a committed run summary in eval/runs/. Labels say which are interim.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const RUNS = path.resolve(__dirname, "runs");
const read = (f: string) => JSON.parse(readFileSync(path.join(RUNS, f), "utf8"));
const files = readdirSync(RUNS).filter((f) => f.endsWith(".json")).sort();

const CURVES: { file: string; key: string; label: string; note: string }[] = [
  { file: "2026-11-02T20-21-47-985Z-curve.json", key: "v1", label: "1回目", note: "最初の学習ループ" },
  { file: "2026-11-02T20-48-24-850Z-curve.json", key: "v2", label: "2回目", note: "確かめ稽古と回帰テスト" },
  { file: "2026-11-02T21-06-39-884Z-curve.json", key: "v3", label: "3回目", note: "台帳の心得を弟子にも見せた" },
  { file: "2026-11-02T21-36-30-068Z-curve.json", key: "v4", label: "4回目", note: "台帳は心得帳のみ＋一般化" },
];

type Point = { trainedScenes: number; masterTaps: number; match: { mean: number; sd: number }; okOrPartial: { mean: number }; history: { correct: number } };

const curves = CURVES.map((c) => {
  const d = read(c.file);
  return {
    key: c.key,
    label: c.label,
    note: c.note,
    points: (d.points as Point[]).map((p) => ({
      scenes: p.trainedScenes,
      taps: p.masterTaps,
      match: p.match.mean,
      sd: p.match.sd,
      okp: p.okOrPartial.mean,
      history: p.history.correct,
    })),
  };
});

const v0 = files.filter((f) => f.includes("v0-ledger-x3")).map(read).at(-1);
const successor = files.filter((f) => f.includes("successor-x3")).map(read).at(-1);
const adversarial = files.filter((f) => f.includes("adversarial-x3")).map(read).at(-1);
const paths = files.filter((f) => f.includes("paths")).map(read).at(-1) ?? null;

const out = {
  note: "すべて架空データ（取引先10社・評価用20場面・沿革の質問8件）、師匠はシミュレータ。11/3 の途中経過。正式な After は 11/7 に学習5本で取り直す。",
  before: { label: "Before（台帳＋制約だけの弟子 v0）", match: v0.mean.matchRate.mean, sd: v0.mean.matchRate.sd, okp: v0.mean.okOrPartialRate.mean, runs: v0.repeat },
  curves,
  paths,
  history: successor.arms.map((a: { arm: string; correct: { mean: number; sd: number } }) => ({ arm: a.arm, mean: a.correct.mean, sd: a.correct.sd })),
  adversarial: {
    pass: adversarial.results.filter((r: { pass: boolean }) => r.pass).length,
    n: adversarial.results.length,
    storeProtected: adversarial.results.filter((r: { kind: string; newlyInjected?: string[]; lost?: string[] }) => r.kind === "injection" && !r.newlyInjected?.length && !r.lost?.length).length,
    injectionRuns: adversarial.results.filter((r: { kind: string }) => r.kind === "injection").length,
    escalated: adversarial.results.filter((r: { kind: string; pass: boolean }) => r.kind === "lure" && r.pass).length,
    lureRuns: adversarial.results.filter((r: { kind: string }) => r.kind === "lure").length,
  },
};
writeFileSync(path.resolve(__dirname, "../data/demo/results.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`curves ${curves.length}, before ${(out.before.match * 100).toFixed(0)}%, paths ${paths ? "yes" : "pending"}`);
