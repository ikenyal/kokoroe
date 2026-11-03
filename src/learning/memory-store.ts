/**
 * The kokoroe-chō in a Managed Agents memory store (D-002 candidate; opt-in with KOKOROE_STORE=memory — the default stays local JSON).
 * Same interface as LocalJsonStore, so the apprentice, the learning loop and the UI don't change.
 *
 * Layout in the store (one small file per item; memory files are ≤ 100 KB):
 *   /rules/K-001.json       one rule with its 沿革 in the body (survives outside any version history and exports to the Skill)
 *   /judgments/J-0001.json  one judgment
 * Every save is a memory version (`created` / `modified`, who and when) — a second, automatic audit trail next to the 沿革.
 * Writes use the content_sha256 precondition; a conflicting writer gets 409 and we re-read and retry once.
 * Fictional data only. Memory stores are workspace-scoped: a store made with one workspace's key is invisible to another's.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { SceneType } from "@/src/core/types";
import { getClaude } from "@/src/lib/claude";
import { applies, stampNewEntries, type KokoroeStore } from "./store";
import type { JudgmentRecord, KokoroeRule } from "./types";

type Memories = Anthropic["beta"]["memoryStores"]["memories"];
interface Item { id: string; path: string; content: string; sha: string }

const RULES = "/rules/";
const JUDGMENTS = "/judgments/";
const num = (id: string) => Number(id.replace(/\D/g, "")) || 0;
const isConflict = (e: unknown) => typeof e === "object" && e !== null && (e as { status?: number }).status === 409;

export class MemoryStoreKokoroe implements KokoroeStore {
  constructor(
    readonly storeId: string,
    private readonly api: Memories = getClaude().beta.memoryStores.memories,
  ) {}

  private async items(prefix: string): Promise<Item[]> {
    const out: Item[] = [];
    for await (const m of this.api.list(this.storeId, { path_prefix: prefix, view: "full" })) {
      if (m.type === "memory") out.push({ id: m.id, path: m.path, content: m.content ?? "", sha: m.content_sha256 });
    }
    return out;
  }

  async listRules(): Promise<KokoroeRule[]> {
    return (await this.items(RULES)).map((m) => JSON.parse(m.content) as KokoroeRule).sort((a, b) => num(a.id) - num(b.id));
  }

  async rulesFor(clientId: string, sceneType: SceneType) {
    return (await this.listRules()).filter((r) => applies(r, clientId, sceneType));
  }

  async getRule(id: string) {
    return (await this.listRules()).find((r) => r.id === id);
  }

  async saveRule(rule: KokoroeRule, retry = true): Promise<void> {
    const path = `${RULES}${rule.id}.json`;
    const existing = (await this.items(RULES)).find((m) => m.path === path);
    const stored = existing ? (JSON.parse(existing.content) as KokoroeRule).history : [];
    const content = JSON.stringify({ ...rule, history: stampNewEntries(stored, rule.history) }, null, 2);
    try {
      if (existing)
        await this.api.update(existing.id, { memory_store_id: this.storeId, content, precondition: { type: "content_sha256", content_sha256: existing.sha } });
      else await this.api.create(this.storeId, { path, content });
    } catch (e) {
      if (retry && isConflict(e)) return this.saveRule(rule, false); // someone wrote in between: re-read, re-stamp, write once more
      throw e;
    }
  }

  async nextRuleId() {
    const max = Math.max(0, ...(await this.listRules()).map((r) => num(r.id)));
    return `K-${String(max + 1).padStart(3, "0")}`;
  }

  async addJudgment(j: Omit<JudgmentRecord, "id">, tries = 3): Promise<JudgmentRecord> {
    const max = Math.max(0, ...(await this.items(JUDGMENTS)).map((m) => num(m.path)));
    const rec = { id: `J-${String(max + 1).padStart(4, "0")}`, ...j } as JudgmentRecord;
    try {
      await this.api.create(this.storeId, { path: `${JUDGMENTS}${rec.id}.json`, content: JSON.stringify(rec, null, 2) });
      return rec;
    } catch (e) {
      if (tries > 1 && isConflict(e)) return this.addJudgment(j, tries - 1); // the id was taken concurrently: take the next one
      throw e;
    }
  }

  async listJudgments(): Promise<JudgmentRecord[]> {
    return (await this.items(JUDGMENTS)).map((m) => JSON.parse(m.content) as JudgmentRecord).sort((a, b) => num(a.id) - num(b.id));
  }
}

/** Create a store for one session and seed it with a snapshot (parallel writes). Returns the store id. */
export async function createSeededStore(name: string, seed: { rules: KokoroeRule[]; judgments: JudgmentRecord[] }) {
  const claude = getClaude();
  const store = await claude.beta.memoryStores.create({
    name,
    description: "Kokoroe-chō of the fictional company 株式会社だいだい工房: one JSON file per etiquette rule (/rules/, with its history) and per master judgment (/judgments/).",
  });
  const files = [
    ...seed.rules.map((r) => ({ path: `${RULES}${r.id}.json`, content: JSON.stringify(r, null, 2) })),
    ...seed.judgments.map((j) => ({ path: `${JUDGMENTS}${j.id}.json`, content: JSON.stringify(j, null, 2) })),
  ];
  let next = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (next < files.length) await claude.beta.memoryStores.memories.create(store.id, files[next++]);
    }),
  );
  return store.id;
}
