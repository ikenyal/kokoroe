/**
 * Spike (2026-11-03): export a memory store as an Agent Skill folder.
 *
 *   out/kokoroe-daidai-kobo/SKILL.md          index + how to use (small, always-loaded metadata)
 *   out/kokoroe-daidai-kobo/clients/<slug>.md  one file per client, loaded only when needed
 *
 * Skill name rules: lowercase letters, digits, hyphens; <= 64 chars; must not contain "anthropic" or "claude".
 * Run after spike:memory. Reads the store id from out/state.json (or KOKOROE_STORE_ID).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getClaude } from "../../src/lib/claude";

const OUT = path.join(__dirname, "out");
const SKILL_NAME = "kokoroe-daidai-kobo";

export function assertSkillName(name: string): void {
  if (!/^[a-z0-9-]{1,64}$/.test(name) || /anthropic|claude/.test(name)) {
    throw new Error(`invalid skill name: ${name}`);
  }
}

async function main() {
  assertSkillName(SKILL_NAME);
  const storeId =
    process.env.KOKOROE_STORE_ID ?? JSON.parse(readFileSync(path.join(OUT, "state.json"), "utf8")).storeId;
  const claude = getClaude();
  const dir = path.join(OUT, SKILL_NAME);
  const files: string[] = [];

  const t0 = performance.now();
  for await (const m of claude.beta.memoryStores.memories.list(storeId, { path_prefix: "/", view: "full" })) {
    if (m.type !== "memory") continue;
    const rel = m.path.replace(/^\//, "");
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), m.content ?? "");
    files.push(rel);
  }

  const skill = `---
name: ${SKILL_NAME}
description: Client-by-client etiquette and its history at Daidai Kobo (fictional). Use when deciding how to contact or respond to one of Daidai Kobo's clients — channel, who to address formally and informally, timing, and tone.
---

# Kokoroe-chō — Daidai Kobo

Each client file holds that client's etiquette rules and the history of why each rule changed.
Read only the file for the client you are dealing with. If a rule's history explains why it exists, respect it
before deciding to skip it. Discounts and contract terms always go to a human.

## Clients
${files.map((f) => `- [${f}](${f})`).join("\n")}
`;
  writeFileSync(path.join(dir, "SKILL.md"), skill);
  console.log(`exported ${files.length} file(s) + SKILL.md to ${dir} in ${(performance.now() - t0).toFixed(0)} ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
