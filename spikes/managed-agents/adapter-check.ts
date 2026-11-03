/**
 * D-002 evidence: the memory-store adapter on the real API vs the local JSON store, same operations, wall-clock times.
 *   npx tsx --env-file-if-exists=.env.local spikes/managed-agents/adapter-check.ts
 * Seeds a new store from the デモの続き snapshot (16 rules, 27 judgments; fictional data) — the cost of starting a session with
 * KOKOROE_STORE=memory — then times the calls one 帳場 step makes. No model tokens. The store is kept (not deleted).
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getClaude } from "../../src/lib/claude";
import { createSeededStore, MemoryStoreKokoroe } from "../../src/learning/memory-store";
import { LocalJsonStore, type KokoroeStore } from "../../src/learning/store";

const snap = JSON.parse(readFileSync(path.resolve(__dirname, "../../data/demo/demo-snapshot.json"), "utf8"));

async function t<T>(rows: string[][], label: string, which: string, fn: () => Promise<T>) {
  const t0 = performance.now();
  const r = await fn();
  rows.push([label, which, `${(performance.now() - t0).toFixed(0)} ms`]);
  return r;
}

async function step(rows: string[][], which: string, s: KokoroeStore) {
  await t(rows, "listRules", which, () => s.listRules());
  await t(rows, "rulesFor(C06,T4)", which, () => s.rulesFor("C06", "T4"));
  const j = await t(rows, "addJudgment", which, () =>
    s.addJudgment({ at: new Date().toISOString(), sceneId: "T22", clientId: "C06", sceneType: "T1", proposal: snap.store.judgments[0].proposal, verdict: "△", remark: "顔出して話せ" }));
  const id = await t(rows, "nextRuleId", which, () => s.nextRuleId());
  const text = "悪い知らせは電話で済ませず、蔵へ顔を出して直接話す。";
  await t(rows, "saveRule (add)", which, () => s.saveRule({ id, scope: { clientId: "C06", sceneTypes: null }, text, when: null, status: "active", confidence: "medium",
    sources: [{ kind: "judgment", judgmentId: j.id, date: "2026-11-03", sceneId: "T22", verdict: "△", remark: "顔出して話せ" }],
    history: [{ date: "2026-11-03", before: null, after: text, trigger: null, judgmentId: j.id, masterWords: "顔出して話せ", reason: "" }] }));
  const r = (await s.getRule(id))!;
  r.history.push({ date: "2026-11-03", before: r.text, after: r.text + "（仕込みの冬も）", trigger: "冬こそ顔を見せろ", judgmentId: j.id, masterWords: "", reason: "" });
  r.text += "（仕込みの冬も）";
  await t(rows, "saveRule (revise)", which, () => s.saveRule(r));
  return id;
}

async function main() {
  const rows: string[][] = [];
  const dir = mkdtempSync(path.join(tmpdir(), "kokoroe-adapter-"));
  const file = path.join(dir, "store.json");
  await t(rows, "start session (seed 16 rules + 27 judgments)", "local", async () => writeFileSync(file, JSON.stringify(snap.store)));
  await step(rows, "local", new LocalJsonStore(file));
  const storeId = await t(rows, "start session (seed 16 rules + 27 judgments)", "memory", () => createSeededStore("kokoroe-adapter-check", snap.store));
  const mem = new MemoryStoreKokoroe(storeId);
  const ruleId = await step(rows, "memory", mem);
  // Versions: the automatic audit trail next to the 沿革 in the body.
  const claude = getClaude();
  const memo = [];
  for await (const m of claude.beta.memoryStores.memories.list(storeId, { path_prefix: "/rules/" })) if (m.type === "memory" && m.path === `/rules/${ruleId}.json`) memo.push(m);
  const versions = [];
  for await (const v of claude.beta.memoryStores.memoryVersions.list(storeId, { memory_id: memo[0].id })) versions.push(v);
  console.log(rows.map((r) => r.join(" | ")).join("\n"));
  console.log(`store ${storeId} (kept) · ${ruleId}: ${versions.length} memory versions (${versions.map((v) => v.operation).join(", ")}); 沿革 in body: ${(await mem.getRule(ruleId))!.history.length} entries`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
