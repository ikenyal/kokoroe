/**
 * Build the two demo snapshots from a real training run's store (fictional data only).
 *   npm run demo:snapshots -- --demo-store <store.json> --demo-from 21 --trial-drafts <store.json>
 * demo  : the kokoroe-chō of a run, with the queue continuing at training scene T<demo-from> (drafts as recorded in that run).
 * trial : ledger constraints only (no "why" yet — the visitor is the master), queue = all 40 training scenes with recorded drafts.
 * Drafts are recorded proposals from real runs, so the UI works without calling the API; with KOKOROE_LIVE=1 they are regenerated.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CLIENTS, TRAIN_SCENES } from "@/src/core/world";
import { jstDate } from "@/src/learning/fix";
import { FIELD_SCENES } from "@/src/server/field";
import type { JudgmentRecord, KokoroeRule } from "@/src/learning/types";

interface StoreFile {
  rules: KokoroeRule[];
  judgments: JudgmentRecord[];
}

function firstDrafts(store: StoreFile) {
  const m = new Map<string, JudgmentRecord>();
  for (const j of store.judgments) if (!j.kind || j.kind === "draft") if (!m.has(j.sceneId)) m.set(j.sceneId, j);
  return m;
}

function main() {
  const { values } = parseArgs({
    options: { "demo-store": { type: "string" }, "demo-from": { type: "string", default: "21" }, "trial-drafts": { type: "string" } },
  });
  const demoStore = JSON.parse(readFileSync(values["demo-store"]!, "utf8")) as StoreFile;
  const draftsStore = JSON.parse(readFileSync(values["trial-drafts"] ?? values["demo-store"]!, "utf8")) as StoreFile;
  const from = Number(values["demo-from"]);
  const drafts = firstDrafts(draftsStore);
  const queueOf = (ids: string[]) =>
    ids.flatMap((id) => {
      const scene = TRAIN_SCENES.find((s) => s.id === id)!;
      const d = drafts.get(id);
      return d ? [{ scene, draft: d.proposal }] : [];
    });

  const date = jstDate(new Date().toISOString());
  const ledgerOnly: KokoroeRule[] = CLIENTS.filter((c) => c.constraints && c.constraints !== "なし").map((c, i) => ({
    id: `K-${String(i + 1).padStart(3, "0")}`,
    scope: { clientId: c.id, sceneTypes: null },
    text: c.constraints,
    when: null,
    status: "active",
    confidence: "high",
    origin: "ledger",
    sources: [{ kind: "ledger", judgmentId: `LEDGER-${c.id}`, date, sceneId: "", verdict: null, remark: "" }],
    history: [{ date, before: null, after: c.constraints, trigger: null, judgmentId: `LEDGER-${c.id}`, masterWords: "", reason: "取引先台帳の明示的な制約から登録" }],
  }));

  const outDir = path.resolve(__dirname, "../data/demo");
  mkdirSync(outDir, { recursive: true });
  // 〔台帳〕-only rules mirror the current ledger (maintained data, not something the master taught) — refresh their text.
  // Rules learned from the master's judgments stay exactly as recorded.
  const syncLedger = (store: StoreFile): StoreFile => ({
    ...store,
    rules: store.rules.map((r) => {
      const pure = r.sources.length > 0 && r.sources.every((x) => x.kind === "ledger");
      const c = CLIENTS.find((x) => x.id === r.scope.clientId);
      if (!pure || !c || r.text === c.constraints) return r;
      return { ...r, text: c.constraints, history: r.history.map((h, i) => (i === 0 ? { ...h, after: c.constraints } : h)) };
    }),
  });
  const demo = {
    note: `デモの続き: ${path.basename(values["demo-store"]!)} の心得帳から、学習用 T${String(from).padStart(2, "0")} 以降を続ける（架空データ）`,
    store: syncLedger(demoStore),
    queue: queueOf(TRAIN_SCENES.slice(from - 1).map((s) => s.id)),
  };
  const trial = {
    note: "お試し: 台帳の制約だけから始める（架空データ）。案は記録済みのもの",
    store: { rules: ledgerOnly, judgments: [] },
    queue: queueOf(TRAIN_SCENES.map((s) => s.id)),
  };
  const field = {
    note: "師匠役テスト: 台帳の制約だけから、学習用の固定20場面（各社2つ）を判定する（架空データ）。案は記録済みのもの",
    store: { rules: ledgerOnly, judgments: [] },
    queue: queueOf(FIELD_SCENES),
  };
  writeFileSync(path.join(outDir, "field-snapshot.json"), JSON.stringify(field, null, 2) + "\n");
  writeFileSync(path.join(outDir, "demo-snapshot.json"), JSON.stringify(demo, null, 2) + "\n");
  writeFileSync(path.join(outDir, "trial-snapshot.json"), JSON.stringify(trial, null, 2) + "\n");
  console.log(`demo: ${demo.store.rules.length} rules, ${demo.queue.length} queued | trial: ${trial.store.rules.length} rules, ${trial.queue.length} queued`);
}

main();
