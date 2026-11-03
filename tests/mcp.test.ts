import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeAll, describe, expect, it } from "vitest";
import { TRAIN_SCENES } from "@/src/core/world";
import { ReadonlyJsonStore, type ReadonlyKokoroeStore } from "@/src/mcp/readonly-store";
import { createKokoroeServer, TOOL_NAMES } from "@/src/mcp/server";

/** The read-only MCP server (D-042): fixed tool list, no write path, nothing beyond what the exported Skill shows. */
const scene = TRAIN_SCENES.find((s) => s.clientId === "C02")!;
const h = (date: string, before: string | null, after: string, trigger: string | null = null) =>
  ({ date, before, after, trigger, judgmentId: "J-0001", masterWords: "後で顔出しとけ", reason: "INTERPRETER-REASON-NOT-EXPOSED" });
const src = (date: string) => ({ kind: "judgment", judgmentId: "J-0001", date, sceneId: scene.id, verdict: "△", remark: "後で顔出しとけ" });
const rules = [
  { id: "K-001", scope: { clientId: "C02", sceneTypes: null }, text: "詫びは顔を見て", when: null, status: "active", confidence: "medium",
    sources: [src("2026-11-01")], history: [h("2026-11-01", null, "詫びは顔を見て"), h("2026-11-05", "詫びはメールで", "詫びは顔を見て", "先代が嫌った")] },
  { id: "K-002", scope: { clientId: null, sceneTypes: null }, text: "値引きは師匠に", when: null, status: "active", confidence: "high",
    sources: [src("2026-11-02")], history: [h("2026-11-02", null, "値引きは師匠に")] },
  { id: "K-003", scope: { clientId: "C02", sceneTypes: ["T4"] }, text: "差し戻された心得", when: null, status: "retired", confidence: "low",
    sources: [src("2026-11-04")], history: [h("2026-11-04", null, "差し戻された心得")] },
];

let client: Client;
let file: string;
let before: { bytes: string; mtime: number };

beforeAll(async () => {
  file = path.join(mkdtempSync(path.join(tmpdir(), "kokoroe-mcp-")), "store.json");
  // A full store file, judgments included: the server must never surface them (they hold drafts written about client text).
  writeFileSync(file, JSON.stringify({ rules, judgments: [{ id: "J-0001", sceneId: scene.id, proposal: { message: "DRAFT-NOT-EXPOSED" } }] }));
  before = { bytes: readFileSync(file, "utf8"), mtime: statSync(file).mtimeMs };
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createKokoroeServer(new ReadonlyJsonStore(file)).connect(a);
  client = new Client({ name: "test", version: "0" });
  await client.connect(b);
});

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return { isError: r.isError === true, body: (r.content as { text: string }[])[0].text };
};

describe("kokoroe MCP server (read only)", () => {
  it("offers exactly the four reviewed tools, all marked read only", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    for (const t of tools) expect(t.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
  });

  it("get_kokoroe returns the client's and company-wide active rules with their 沿革, not retired ones", async () => {
    const { body } = await call("get_kokoroe", { client_id: "C02" });
    expect(body).toContain("K-001 詫びは顔を見て");
    expect(body).toContain("K-002 値引きは師匠に");
    expect(body).toContain("きっかけ: 先代が嫌った");
    expect(body).not.toContain("K-003");
    expect(body).toContain("心得帳の時点: 2026-11-05");
  });

  it("get_history reads retired rules too", async () => {
    const r = await call("get_history", { rule_id: "K-003" });
    expect(JSON.parse(r.body)).toMatchObject({ id: "K-003", status: "retired" });
    expect((await call("get_history", { rule_id: "K-999" })).isError).toBe(true);
  });

  it("changes_since shows what changed after a copy was made", async () => {
    const r = JSON.parse((await call("changes_since", { since: "2026-11-04" })).body);
    expect(r.changes.map((c: { ruleId: string; kind: string }) => `${c.ruleId}:${c.kind}`)).toEqual(["K-003:追加", "K-001:改訂"]);
    expect(r.changes[0].statusNow).toBe("廃止・差し戻し");
  });

  it("changes_since with the copy's exact moment returns only what was saved after it", async () => {
    const at = (h0: object, iso: string) => ({ ...h0, at: iso });
    const f2 = path.join(path.dirname(file), "timed.json");
    const r1 = { ...rules[0], history: [at(h("2026-11-03", null, "詫びは顔を見て"), "2026-11-03T01:00:00.000Z"), at(h("2026-11-03", "詫びは顔を見て", "詫びは顔を見て、翌日に電話も", "先代の教え"), "2026-11-03T06:00:00.000Z")] };
    writeFileSync(f2, JSON.stringify({ rules: [r1] }));
    const [a, b] = InMemoryTransport.createLinkedPair();
    await createKokoroeServer(new ReadonlyJsonStore(f2)).connect(a);
    const c2 = new Client({ name: "t2", version: "0" });
    await c2.connect(b);
    const res = await c2.callTool({ name: "changes_since", arguments: { since: "2026-11-03T03:00:00.000Z" } });
    const body = JSON.parse((res.content as { text: string }[])[0].text);
    expect(body.changes.map((x: { after: string }) => x.after)).toEqual(["詫びは顔を見て、翌日に電話も"]);
    expect(body.asOf).toBe("2026-11-03T06:00:00.000Z");
  });

  it("serves kokoroe://clients/{id} as Markdown", async () => {
    const r = await client.readResource({ uri: "kokoroe://clients/C02" });
    expect((r.contents[0] as { text: string }).text).toContain("K-001");
  });

  it("never exposes drafts, client-written scene text or the interpreter's internal reading", async () => {
    const out = [
      (await call("list_clients")).body,
      (await call("get_kokoroe", { client_id: "C02" })).body,
      (await call("get_history", { rule_id: "K-001" })).body,
      (await call("changes_since", { since: "2026-01-01" })).body,
    ].join("\n");
    expect(out).not.toContain("DRAFT-NOT-EXPOSED");
    expect(out).not.toContain(scene.situation.slice(0, 20));
    expect(out).not.toContain("INTERPRETER-REASON-NOT-EXPOSED");
  });

  it("leaves the store file untouched", () => {
    expect(readFileSync(file, "utf8")).toBe(before.bytes);
    expect(statSync(file).mtimeMs).toBe(before.mtime);
  });

  it("has no write path: the store type has no writers, and server code imports nothing that writes or calls Claude", () => {
    const s = new ReadonlyJsonStore(file) as ReadonlyKokoroeStore;
    // @ts-expect-error — the read-only store has no saveRule
    expect(s.saveRule).toBeUndefined();
    // @ts-expect-error — nor addJudgment
    expect(s.addJudgment).toBeUndefined();
    const dir = path.resolve(__dirname, "../src/mcp");
    for (const f of readdirSync(dir)) {
      const code = readFileSync(path.join(dir, f), "utf8");
      expect(code, f).not.toMatch(/learning\/store|LocalJsonStore|writeFile|renameSync|appendFile|unlink|rmSync|@anthropic-ai\/sdk|src\/lib\/claude|data\/hidden|registerPrompt/);
    }
  });
});

describe("kokoroe MCP entry point", () => {
  it("refuses anything that is not a kokoroe-chō (e.g. the evaluation's ground truth)", async () => {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("npx", ["tsx", "src/mcp/main.ts", "--store", path.join("data", "hidden", "rules.json")], { cwd: path.resolve(__dirname, ".."), encoding: "utf8" });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("not a kokoroe-chō");
  });
});
