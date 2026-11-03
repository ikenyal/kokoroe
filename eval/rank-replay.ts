/**
 * 段位 replay (no API; Kento 11/4): walk the master's marks of saved 40-scene training runs in order, grouped by client.
 *   手代: 2 ○ in a row — review is not skipped (the draft only gets a 「確認だけ」 mark; the master still sees a wrong one)
 *   番頭: 5 ○ in a row and ≥1 passed 確かめ稽古 in that client — only here a draft may pass without review
 * Reported: how often each rank was reached, drafts that passed at 番頭 (taps saved) and how many of them the master had
 * actually marked △/× (with their content), and drafts shown as 「確認だけ」 at 手代 (and how many of those were △/×).
 * Drafts passed at 番頭 add no evidence (the master would not have seen them). Approximation, said plainly: later drafts are
 * taken as recorded, although a correction never made would have changed what the apprentice learned afterwards.
 *   npx tsx eval/rank-replay.ts            # → docs/results/rank-replay-<date>.json + a table (fictional data)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { mustReview } from "@/src/disciple/hitl";
import { BANTO, standing, STREAK_FROM, TEDAI, type Mark, type Rank } from "@/src/core/rank";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import { SCENE_TYPE_LABELS } from "@/src/core/types";
import type { JudgmentRecord } from "@/src/learning/types";

const RAW = path.join(__dirname, "runs", "raw");

function replay(judgments: JudgmentRecord[]) {
  const marks: Mark[] = [];
  const judged = new Set<string>();
  const rankNow = new Map<string, Rank>();
  let drafts = 0, toTedai = 0, toBanto = 0, passed = 0, passedWrong = 0, floorHeld = 0, confirmOnly = 0, confirmOnlyWrong = 0, firstContact = 0;
  const wrong: { client: string; scene: string; verdict: string; remark: string }[] = [];
  for (const j of [...judgments].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id))) {
    const kind = j.kind ?? "draft";
    const prevRank = rankNow.get(j.clientId) ?? "見習い";
    if (kind === "draft") {
      drafts++;
      const scene = TRAIN_SCENES.find((t) => t.id === j.sceneId)!;
      const s = standing(marks.filter((m) => m.clientId === j.clientId));
      const floor = mustReview(scene, j.proposal, judged);
      if (floor.why === "first-contact") firstContact++;
      judged.add(j.clientId);
      if (s.rank === "番頭" && floor.must) floorHeld++;
      if (s.rank === "番頭" && !floor.must) {
        passed++;
        if (j.verdict !== "○") {
          passedWrong++;
          wrong.push({ client: getClient(j.clientId).name, scene: `${SCENE_TYPE_LABELS[scene.type]}（${j.sceneId}）`, verdict: j.verdict, remark: j.remark });
        }
        continue; // passed without review: the master never saw it, so it is no evidence
      }
      if (s.rank === "手代") {
        confirmOnly++;
        if (j.verdict !== "○") confirmOnlyWrong++;
      }
    }
    marks.push({ clientId: j.clientId, sceneType: j.sceneType, verdict: j.verdict, kind, at: j.at });
    const now = standing(marks.filter((m) => m.clientId === j.clientId)).rank;
    if (now !== prevRank && now === "手代") toTedai++;
    if (now !== prevRank && now === "番頭") toBanto++;
    rankNow.set(j.clientId, now);
  }
  return { drafts, toTedai, toBanto, passed, passedWrong, tapsSaved: passed, floorHeld, confirmOnly, confirmOnlyWrong, firstContact, wrong };
}

const runs = readdirSync(RAW)
  .filter((f) => /store.*\.json$/.test(f))
  .map((f) => ({ f, s: JSON.parse(readFileSync(path.join(RAW, f), "utf8")) as { judgments: JudgmentRecord[] } }))
  .filter(({ s }) => s.judgments.filter((j) => (j.kind ?? "draft") === "draft").length === 40);
const per = runs.map(({ f, s }) => ({ run: f, ...replay(s.judgments) }));
type K = "drafts" | "toTedai" | "toBanto" | "passed" | "passedWrong" | "tapsSaved" | "floorHeld" | "confirmOnly" | "confirmOnlyWrong" | "firstContact";
const sum = (k: K) => per.reduce((n, r) => n + r[k], 0);
const total = Object.fromEntries((["drafts", "toTedai", "toBanto", "passed", "passedWrong", "tapsSaved", "floorHeld", "confirmOnly", "confirmOnlyWrong", "firstContact"] as K[]).map((k) => [k, sum(k)]));
const date = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const file = path.join(__dirname, "..", "docs", "results", `rank-replay-${date}-${STREAK_FROM}.json`);
writeFileSync(
  file,
  JSON.stringify({ at: new Date().toISOString(), note: "fictional data; replay of saved 40-scene training runs (no API); grouped by client", rule: { tedai: TEDAI, banto: BANTO, bantoNeedsPassedConfirm: true, streakFrom: STREAK_FROM }, runs: per.length, total, per }, null, 2) + "\n",
);
console.log(`${per.length} training runs × 40 drafts (fictional data); by client; 手代 ${TEDAI} ○ / 番頭 ${BANTO} ○ + a passed 確かめ; streak from ${STREAK_FROM}`);
console.log(`  reached 手代: ${total.toTedai} times, 番頭: ${total.toBanto} times`);
console.log(`  手代 「確認だけ」 drafts: ${total.confirmOnly} (of which the master marked △/×: ${total.confirmOnlyWrong}) — still reviewed`);
console.log(`  番頭: passed without review ${total.passed}/${total.drafts} drafts, of which △/× ${total.passedWrong}; taps saved ${total.tapsSaved}; floor held back ${total.floorHeld}`);
console.log(`  first contacts held by the floor: ${total.firstContact}`);
for (const r of per) for (const w of r.wrong) console.log(`  番頭 miss: ${r.run} ${JSON.stringify(w)}`);
console.log(`→ ${path.relative(process.cwd(), file)}`);
