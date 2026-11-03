import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MemoryStoreKokoroe } from "@/src/learning/memory-store";
import { LocalJsonStore, type KokoroeStore } from "@/src/learning/store";
import type { KokoroeRule } from "@/src/learning/types";

/** In-memory stand-in for client.beta.memoryStores.memories (create / update with sha precondition / list view=full). */
function fakeMemories() {
  const mem = new Map<string, { id: string; path: string; content: string }>();
  let n = 0;
  const sha = (s: string) => createHash("sha256").update(s).digest("hex");
  const conflict = () => Object.assign(new Error("conflict"), { status: 409 });
  const api = {
    writes: 0,
    async create(_store: string, p: { path: string; content: string }) {
      if ([...mem.values()].some((m) => m.path === p.path)) throw conflict();
      const m = { id: `mem_${++n}`, path: p.path, content: p.content };
      mem.set(m.id, m);
      api.writes++;
      return m;
    },
    async update(id: string, p: { content: string; precondition?: { content_sha256: string } }) {
      const m = mem.get(id)!;
      if (p.precondition && p.precondition.content_sha256 !== sha(m.content)) throw conflict();
      m.content = p.content;
      api.writes++;
      return m;
    },
    async *list(_store: string, p: { path_prefix: string }) {
      for (const m of mem.values())
        if (m.path.startsWith(p.path_prefix)) yield { type: "memory", id: m.id, path: m.path, content: m.content, content_sha256: sha(m.content) };
    },
    /** Simulate another writer changing a file between our read and our write. */
    tamper(path: string, f: (c: string) => string) {
      const m = [...mem.values()].find((x) => x.path === path)!;
      m.content = f(m.content);
    },
  };
  return api;
}

const rule = (id: string, clientId: string | null, text: string): KokoroeRule => ({
  id, scope: { clientId, sceneTypes: null }, text, when: null, status: "active", confidence: "low", sources: [],
  history: [{ date: "2026-11-03", before: null, after: text, trigger: null, judgmentId: "J-0001", masterWords: "", reason: "" }],
});

async function exercise(s: KokoroeStore) {
  await s.saveRule(rule(await s.nextRuleId(), "C06", "蔵元にも一言"));
  await s.saveRule(rule(await s.nextRuleId(), null, "値引きは師匠に"));
  const k1 = (await s.getRule("K-001"))!;
  k1.history.push({ date: "2026-11-03", before: k1.text, after: "蔵元にも一言（正式な話の前に）", trigger: "先代が", judgmentId: "J-0002", masterWords: "前に", reason: "" });
  k1.text = "蔵元にも一言（正式な話の前に）";
  await s.saveRule(k1);
  const j1 = await s.addJudgment({ at: "2026-11-03T01:00:00Z", sceneId: "T05", clientId: "C06", sceneType: "T4", proposal: {} as never, verdict: "△", remark: "" });
  const j2 = await s.addJudgment({ at: "2026-11-03T01:01:00Z", sceneId: "T13", clientId: "C06", sceneType: "T9", proposal: {} as never, verdict: "○", remark: "" });
  return {
    ids: [j1.id, j2.id],
    rules: (await s.listRules()).map((r) => ({ id: r.id, text: r.text, n: r.history.length, stamped: r.history.every((h) => !!h.at) })),
    forC06: (await s.rulesFor("C06", "T4")).map((r) => r.id),
    next: await s.nextRuleId(),
  };
}

describe("memory-store adapter (D-002 candidate) behaves like the local store", () => {
  it("same results for the same operations", async () => {
    const local = await exercise(new LocalJsonStore(null));
    const memory = await exercise(new MemoryStoreKokoroe("memstore_test", fakeMemories() as never));
    expect(memory).toEqual(local);
    expect(memory.rules[0]).toMatchObject({ id: "K-001", n: 2, stamped: true });
  });

  it("a write that loses a race (409 on the sha precondition) is retried once on fresh state — no error reaches the UI; the rule body is last-writer-wins, as in the local store", async () => {
    const api = fakeMemories();
    const s = new MemoryStoreKokoroe("memstore_test", api as never);
    await s.saveRule(rule("K-001", "C06", "a"));
    const r = (await s.getRule("K-001"))!;
    const realUpdate = api.update;
    let once = true;
    api.update = async (id, p) => {
      if (once) {
        once = false;
        api.tamper("/rules/K-001.json", (c) => JSON.stringify({ ...JSON.parse(c), confidence: "high" }));
      }
      return realUpdate(id, p);
    };
    r.text = "b";
    await s.saveRule(r);
    expect((await s.getRule("K-001"))!.text).toBe("b");
  });
});
