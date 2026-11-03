/**
 * Write a kokoroe-chō (store JSON) as an Agent Skill folder.
 *   npm run export:skill -- --store <store.json> --out <dir>      → <dir>/kokoroe-daidai-kobo/{SKILL.md, clients/*.md}
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CLIENTS, COMPANY } from "@/src/core/world";
import { exportSkill } from "@/src/learning/export";

const { values } = parseArgs({ options: { store: { type: "string" }, out: { type: "string" } } });
const store = JSON.parse(readFileSync(values.store!, "utf8"));
const skill = exportSkill(store.rules, CLIENTS, COMPANY);
for (const [rel, text] of Object.entries(skill.files)) {
  const f = path.join(values.out!, skill.name, rel);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, text);
}
console.log(`wrote ${Object.keys(skill.files).length} files to ${path.join(values.out!, skill.name)}`);
