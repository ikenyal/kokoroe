/**
 * Spike (2026-11-03): can a Managed Agents memory store be the kokoroe-chō?
 *
 * Checks, with wall-clock timings:
 *   1. create a store
 *   2. create a memory at a path, read it back, update it with a sha256 precondition
 *   3. list memory versions (do we get created → modified, and who made them?)
 *   4. list memories under a prefix
 *
 * The store is NOT deleted afterwards (kept for the export spike). Its id is saved to out/state.json (gitignored).
 * Run: npm run spike:memory
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getClaude } from "../../src/lib/claude";

const OUT = path.join(__dirname, "out");

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  const result = await fn();
  console.log(`${label.padEnd(28)} ${(performance.now() - t0).toFixed(0).padStart(6)} ms`);
  return result;
}

// Fictional data only (Daidai Kobo's client "Hamakaze Unyu").
const V1 = `# 浜風運輸（C01）

## 作法
- 連絡はメールのみ（先方は社外チャット不可）。

## 沿革
（まだなし）
`;

const V2 = `# 浜風運輸（C01）

## 作法
- 連絡はメールのみ（先方は社外チャット不可）。
- 段取りの変更は**決まる前から**配車課長に共有する。

## 沿革
- 旧: 決まってから連絡 → 新: 決まる前に共有
  - きっかけ: 繁忙期の直前連絡で配車が組めなかった件（師匠の一言「浜風さんは決まる前に」）
`;

async function main() {
  const claude = getClaude();
  mkdirSync(OUT, { recursive: true });

  const store = await timed("memoryStores.create", () =>
    claude.beta.memoryStores.create({
      name: "kokoroe-spike",
      description:
        "Kokoroe-chō (spike): per-client etiquette rules of the fictional company Daidai Kobo, each with its history (old → new, trigger, master's words).",
    }),
  );
  console.log("  store:", store.id);

  const created = await timed("memories.create", () =>
    claude.beta.memoryStores.memories.create(store.id, {
      path: "/clients/hamakaze-unyu.md",
      content: V1,
    }),
  );

  const read = await timed("memories.retrieve", () =>
    claude.beta.memoryStores.memories.retrieve(created.id, { memory_store_id: store.id }),
  );
  console.log("  roundtrip equal:", read.content === V1);

  const updated = await timed("memories.update (precond)", () =>
    claude.beta.memoryStores.memories.update(created.id, {
      memory_store_id: store.id,
      content: V2,
      precondition: { type: "content_sha256", content_sha256: read.content_sha256 },
    }),
  );

  // Stale precondition must be rejected (409) — this is how concurrent edits stay safe.
  let staleRejected = false;
  try {
    await claude.beta.memoryStores.memories.update(created.id, {
      memory_store_id: store.id,
      content: V1,
      precondition: { type: "content_sha256", content_sha256: read.content_sha256 },
    });
  } catch (e) {
    staleRejected = e instanceof Error && "status" in e && (e as { status?: number }).status === 409;
  }
  console.log("  stale precondition rejected (409):", staleRejected);

  const versions: unknown[] = [];
  await timed("memoryVersions.list", async () => {
    for await (const v of claude.beta.memoryStores.memoryVersions.list(store.id, { memory_id: created.id })) {
      versions.push(v);
    }
  });
  for (const v of versions) {
    console.log("  version:", JSON.stringify(v));
  }

  const listed: { path: string }[] = [];
  await timed("memories.list(/clients/)", async () => {
    for await (const m of claude.beta.memoryStores.memories.list(store.id, { path_prefix: "/clients/" })) {
      listed.push(m);
    }
  });
  console.log("  listed:", listed.map((m) => m.path));

  writeFileSync(
    path.join(OUT, "state.json"),
    JSON.stringify({ storeId: store.id, memoryId: created.id, updatedSha: updated.content_sha256 }, null, 2),
  );
  console.log("saved", path.join(OUT, "state.json"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
