/**
 * Start the read-only kokoroe MCP server over stdio (local process; no network).
 *   npm run -s mcp:serve -- --store <kokoroe-chō json>
 * Used by the successor's Claude Code (see demo/successor-mcp/run.sh). stdout carries the protocol; logs go to stderr.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ReadonlyJsonStore } from "./readonly-store";
import { createKokoroeServer } from "./server";

const { values } = parseArgs({ options: { store: { type: "string" } } });
const file = values.store && path.resolve(values.store);
if (!file || !existsSync(file)) {
  console.error("usage: mcp:serve -- --store <kokoroe-chō json>");
  process.exit(2);
}
// Serve only a kokoroe-chō: every rule id must be K-nnn. Anything else (e.g. the evaluation's ground truth) is refused.
const data = JSON.parse(readFileSync(file, "utf8")) as { rules?: { id?: unknown }[] };
if (!Array.isArray(data.rules) || !data.rules.every((r) => typeof r.id === "string" && /^K-\d{3,}$/.test(r.id))) {
  console.error("refusing: not a kokoroe-chō store (rules must have ids K-nnn)");
  process.exit(2);
}
createKokoroeServer(new ReadonlyJsonStore(file))
  .connect(new StdioServerTransport())
  .then(() => console.error(`kokoroe MCP server (read only) on stdio — ${path.basename(file)}`));
