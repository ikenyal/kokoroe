/**
 * Read-only MCP server for the living kokoroe-chō (docs/proposals/mcp-readonly.md, D-042).
 * The Agent Skill is a copy of the kokoroe-chō at one moment; this server is the window onto the book that keeps growing while
 * the master still corrects — `changes_since` tells the successor what changed after their copy was made.
 *
 * Four tools, all read only: list_clients, get_kokoroe, get_history, changes_since; one resource template kokoroe://clients/{id}.
 * Not here, on purpose: any write tool, any tool that calls Claude, and any client-written text (draft proposals and scene
 * situations are never exposed — only what the exported Skill already shows). The server only receives a ReadonlyKokoroeStore.
 */
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CLIENTS, getClient } from "@/src/core/world";
import { SCENE_TYPE_LABELS, type SceneType } from "@/src/core/types";
import { ruleBlock } from "@/src/learning/export";
import type { KokoroeRule } from "@/src/learning/types";
import type { ReadonlyKokoroeStore } from "./readonly-store";

export const TOOL_NAMES = ["list_clients", "get_kokoroe", "get_history", "changes_since"] as const;
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const CLIENT_IDS = CLIENTS.map((c) => c.id) as [string, ...string[]];
const SCENE_TYPES = Object.keys(SCENE_TYPE_LABELS) as [SceneType, ...SceneType[]];

/** When a 沿革 entry happened: its saved time, or (older entries) the start of its JST date. */
export const entryAt = (h: { date: string; at?: string }) => h.at ?? `${h.date}T00:00:00+09:00`;
const lastDate = (rules: readonly Readonly<KokoroeRule>[]) =>
  rules.flatMap((r) => r.history.map(entryAt)).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? null;
const text = (value: unknown) => ({ content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });
const clientName = (id: string | null) => (id ? getClient(id).name : "全社");

function inScope(r: Readonly<KokoroeRule>, clientId: string, sceneType?: SceneType) {
  if (r.status !== "active") return false;
  if (r.scope.clientId !== null && r.scope.clientId !== clientId) return false;
  return !sceneType || r.scope.sceneTypes === null || r.scope.sceneTypes.includes(sceneType);
}

/** Same rendering as the exported Skill's clients/<slug>.md, plus the company-wide rules and the as-of date. */
async function clientMarkdown(store: ReadonlyKokoroeStore, clientId: string, sceneType?: SceneType) {
  const all = await store.listRules();
  const c = getClient(clientId);
  const rules = all.filter((r) => inScope(r, clientId, sceneType));
  const own = rules.filter((r) => r.scope.clientId === clientId);
  const common = rules.filter((r) => r.scope.clientId === null);
  return [
    `# ${c.name}の心得${sceneType ? `（場面: ${SCENE_TYPE_LABELS[sceneType]}）` : ""}`,
    `心得帳の時点: ${lastDate(all) ?? "記録なし"}（読み取り専用。書き換えは師匠の○△×からだけ）`,
    `業界: ${c.industry}　窓口: ${c.contact}　決裁: ${c.decider}　取引${c.relationshipYears}年`,
    "",
    "## この取引先の作法",
    own.length ? own.map((r) => ruleBlock(r as KokoroeRule)).join("\n\n") : "（記録なし。推測せず師匠に確認してください）",
    "",
    "## 全社の作法",
    common.length ? common.map((r) => ruleBlock(r as KokoroeRule)).join("\n\n") : "（記録なし。推測せず師匠に確認してください）",
  ].join("\n");
}

export function createKokoroeServer(store: ReadonlyKokoroeStore) {
  const server = new McpServer({ name: "kokoroe", version: "0.1.0" });

  server.registerTool(
    "list_clients",
    {
      title: "取引先の一覧（読み取り専用）",
      description: "株式会社だいだい工房（架空）の取引先と、それぞれの心得の数・最後に変わった日。心得帳の時点（asOf）も返す。",
      annotations: READ_ONLY,
    },
    async () => {
      const rules = await store.listRules();
      return text({
        asOf: lastDate(rules),
        companyWide: rules.filter((r) => r.status === "active" && r.scope.clientId === null).length,
        clients: CLIENTS.map((c) => {
          const own = rules.filter((r) => r.scope.clientId === c.id);
          return { id: c.id, name: c.name, industry: c.industry, activeRules: own.filter((r) => r.status === "active").length, lastChange: lastDate(own) };
        }),
      });
    },
  );

  server.registerTool(
    "get_kokoroe",
    {
      title: "取引先の心得（読み取り専用）",
      description: "取引先に連絡・相談・あいさつなどをする前に、その取引先と全社の作法を沿革つきで読む。scene_type で場面を絞れる。",
      inputSchema: { client_id: z.enum(CLIENT_IDS), scene_type: z.enum(SCENE_TYPES).optional() },
      annotations: READ_ONLY,
    },
    async ({ client_id, scene_type }) => text(await clientMarkdown(store, client_id, scene_type)),
  );

  server.registerTool(
    "get_history",
    {
      title: "心得の沿革（読み取り専用）",
      description: "一つの心得がなぜそうなったか: 旧 → 新、きっかけ、師匠の一言、日付、出典。廃止・差し戻しになった心得も読める。",
      inputSchema: { rule_id: z.string().regex(/^K-\d{3,}$/) },
      annotations: READ_ONLY,
    },
    async ({ rule_id }) => {
      const r = await store.getRule(rule_id);
      if (!r) return { ...text(`${rule_id} は心得帳にありません。`), isError: true };
      return text({
        id: r.id,
        client: clientName(r.scope.clientId),
        sceneTypes: r.scope.sceneTypes?.map((t) => SCENE_TYPE_LABELS[t]) ?? null,
        text: r.text,
        when: r.when,
        status: r.status,
        mergedInto: r.mergedInto ?? null,
        ...(r.status === "retired" ? { note: "廃止（差し戻し・統合・師匠が削除）。従わない。沿革として読むだけ" } : {}),
        origin: r.sources.some((s) => s.kind === "ledger") ? (r.sources.some((s) => s.kind !== "ledger") ? "台帳＋師匠" : "台帳") : "師匠",
        history: r.history.map((h) => ({ date: h.date, before: h.before, after: h.after, trigger: h.trigger, masterWords: h.masterWords })),
        sources: r.sources.map((s) => ({ date: s.date, from: s.kind === "ledger" ? "取引先台帳" : "師匠の判定", verdict: s.verdict, remark: s.remark, sceneId: s.sceneId || null })),
      });
    },
  );

  server.registerTool(
    "changes_since",
    {
      title: "写しの後の変化（読み取り専用）",
      description:
        "心得帳の写し（Skill の「この写しの時点」）の後に起きた変化: 追加・改訂・統合・廃止や差し戻し。since には写しの時点（ISO 日時、その時点より後）か日付（YYYY-MM-DD、その日を含む）を渡す。",
      inputSchema: { since: z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/) },
      annotations: READ_ONLY,
    },
    async ({ since }) => {
      const rules = await store.listRules();
      const dateOnly = since.length === 10;
      const from = Date.parse(dateOnly ? `${since}T00:00:00+09:00` : since);
      const changes = rules
        .flatMap((r) =>
          r.history
            .filter((h) => (dateOnly ? Date.parse(entryAt(h)) >= from : Date.parse(entryAt(h)) > from))
            .map((h) => ({
              at: entryAt(h),
              ruleId: r.id,
              client: clientName(r.scope.clientId),
              kind: h.before === null ? "追加" : h.after.startsWith("（") || h.before.startsWith("（") ? "統合・廃止・差し戻し" : "改訂",
              before: h.before,
              after: h.after,
              trigger: h.trigger,
              masterWords: h.masterWords,
              statusNow: r.status === "retired" ? (r.mergedInto ? `全社の ${r.mergedInto} に統合` : "廃止・差し戻し") : "有効",
            })),
        )
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.ruleId.localeCompare(b.ruleId));
      return text({ since, asOf: lastDate(rules), count: changes.length, changes });
    },
  );

  server.registerResource(
    "client-kokoroe",
    new ResourceTemplate("kokoroe://clients/{id}", {
      list: async () => ({ resources: CLIENTS.map((c) => ({ uri: `kokoroe://clients/${c.id}`, name: `${c.name}の心得`, mimeType: "text/markdown" })) }),
    }),
    { title: "取引先の心得（読み取り専用）", mimeType: "text/markdown" },
    async (uri, { id }) => {
      const clientId = String(id);
      if (!CLIENT_IDS.includes(clientId)) throw new Error(`unknown client ${clientId}`);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: await clientMarkdown(store, clientId) }] };
    },
  );

  return server;
}
