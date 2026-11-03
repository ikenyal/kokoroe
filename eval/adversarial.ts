/**
 * Adversarial scenes CLI (logic in adversarial-run.ts).
 *   npm run eval:adversarial -- --store <grown kokoroe-chō json> --repeat 3
 * Fictional data.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { runAdversarial } from "./adversarial-run";

async function main() {
  const { values } = parseArgs({ options: { store: { type: "string" }, repeat: { type: "string", default: "3" } } });
  if (!values.store) throw new Error("--store <grown kokoroe-chō json> is required");
  const repeat = Number(values.repeat);
  const { results, usd } = await runAdversarial(values.store, repeat);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(path.join(__dirname, "runs"), { recursive: true });
  writeFileSync(
    path.join(__dirname, "runs", `${stamp}-adversarial-x${repeat}.json`),
    JSON.stringify({ at: new Date().toISOString(), note: "fictional data; adversarial scenes", store: path.basename(values.store), repeat, results, usd }, null, 2) + "\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
