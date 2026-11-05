/**
 * The master-role test's 20 cards (11/4, the author as the master, D-059), scored again by the code judge — the simulator's
 * hidden ground truth (Kento 11/5). No API calls. The question: of the drafts the author marked ○, how many would the hidden
 * ground truth have marked △ or ×? The result is recorded as it comes out, whichever way.
 *
 * Conditions:
 *   - the drafts are the ones the author saw and marked, as stored with each judgment (after the money/contract floor);
 *     they were drafted live during the test with that session's 心得帳 (the ledger's constraints, plus the two 心得 the
 *     author's △ added on the way);
 *   - the judge is eval/simulator/judge.ts over data/hidden (frozen since 11/3, D-017; checksums in tests/hidden-freeze.test.ts);
 *   - the contact plan only: visit plans are not in the hidden ground truth (D-061).
 *   npx tsx eval/master-role-vs-simulator.ts [--session .data/sessions/field-<id>]   (default: the newest field session)
 * → docs/results/master-role-vs-simulator-<date>.json
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import type { Proposal } from "@/src/core/types";
import { judge } from "./simulator/judge";

const { values } = parseArgs({ options: { session: { type: "string" } } });
const ROOT = path.resolve(__dirname, "..");
const dir = path.join(process.env.KOKOROE_DATA_DIR ?? path.join(ROOT, ".data"), "sessions");
const base =
  values.session ??
  readdirSync(dir)
    .filter((f) => f.startsWith("field-") && f.endsWith(".store.json"))
    .map((f) => path.join(dir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
    ?.replace(".store.json", "");
if (!base || !existsSync(`${base}.store.json`)) throw new Error("no field session found");
const store = JSON.parse(readFileSync(`${base}.store.json`, "utf8")) as {
  judgments: { sceneId: string; verdict: string; proposal: Proposal; kind?: string; undone?: string; at: string }[];
};
const meta = JSON.parse(readFileSync(`${base}.meta.json`, "utf8")) as { createdAt: string };

const cards = store.judgments.filter((j) => (j.kind ?? "draft") === "draft" && !j.undone);
const rows = cards.map((j) => {
  const scene = TRAIN_SCENES.find((s) => s.id === j.sceneId)!;
  const r = judge(scene, getClient(scene.clientId), j.proposal);
  return {
    sceneId: j.sceneId,
    clientId: scene.clientId,
    sceneType: scene.type,
    author: j.verdict,
    simulator: r.verdict,
    // Rule ids and outcomes only (the hidden rules' text stays in data/hidden).
    notOk: r.checks.filter((c) => c.outcome !== "ok").map((c) => `${c.ruleId}:${c.outcome}`),
  };
});
const count = (f: (r: (typeof rows)[number]) => boolean) => rows.filter(f).length;
const authorOk = rows.filter((r) => r.author === "○");
const summary = {
  cards: rows.length,
  authorOk: authorOk.length,
  ofAuthorOk: { simulatorOk: count((r) => r.author === "○" && r.simulator === "○"), simulatorPartial: count((r) => r.author === "○" && r.simulator === "△"), simulatorWrong: count((r) => r.author === "○" && r.simulator === "×") },
  authorCorrected: rows.filter((r) => r.author !== "○").map((r) => ({ sceneId: r.sceneId, author: r.author, simulator: r.simulator })),
  sameVerdict: count((r) => r.author === r.simulator),
};
const out = {
  note:
    "師匠役テスト（11/4、作者1人、架空データ、D-059）の20枚を、コードの判定（シミュレータ、隠しの正解）でも採点したもの。API なし。案は作者が見て印を付けたもの（判定とともに保存された案。値引き・契約の床のあと）で、テストの最中にその回の心得帳（台帳の制約＋途中で作者の △ から加わった2つの心得）でライブに作られた。判定は eval/simulator/judge.ts と data/hidden（11/3 から凍結、D-017）。連絡の段取りだけ（訪問の段取りは隠しの正解にない、D-061）。",
  session: { createdAt: meta.createdAt },
  summary,
  rows,
};
const file = path.join(ROOT, "docs/results", `master-role-vs-simulator-${new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10)}.json`);
writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`${r.sceneId} ${r.clientId} ${r.sceneType}  author ${r.author}  simulator ${r.simulator}  ${r.notOk.join(" ")}`);
console.log(path.relative(ROOT, file));
