/**
 * 暖簾を継ぐ: the same 8 history questions answered WITHOUT a kokoroe-chō (the "v0-general" arm), from the same recorded
 * evaluation run as data/demo/recorded-answers.json (the grown kokoroe-chō arm). No API call; fictional data.
 *   npx tsx eval/build-general-answers.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const RUN = "eval/runs/2026-11-02T21-25-03-586Z-successor-x3.json";
const root = path.join(__dirname, "..");
const run = JSON.parse(readFileSync(path.join(root, RUN), "utf8")) as {
  arms: { arm: string; mode: string; lastRun: { id: string; answer: string; explanation: string }[] }[];
};
const arm = run.arms.find((a) => a.mode === "general");
if (!arm) throw new Error("no general arm");
const out = {
  note: `心得帳なしの答え（一般論）: ${RUN} の「${arm.arm}」の最後の回（学習40場面の心得帳ありの答え data/demo/recorded-answers.json と同じ評価、架空データ）。`,
  answers: Object.fromEntries(arm.lastRun.map((x) => [x.id, { answer: x.answer, explanation: x.explanation }])),
};
writeFileSync(path.join(root, "data/demo/recorded-answers-general.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${arm.lastRun.length} answers`);
