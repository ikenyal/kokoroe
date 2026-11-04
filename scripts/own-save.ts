/**
 * After the own-company comparison test (D-060): save its result into the repository — times and counts ONLY.
 *   npm run -s own:save          # reads the own folder (~/.kokoroe or KOKOROE_OWN_DIR); writes docs/results/own-company-test-<date>.json
 * The situations, the prose, the client ledger and the 心得 text never leave the own folder: the result is built by
 * buildOwnResult (numbers only) and checked by assertNoText before anything is written. No API calls.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ownDir, ownEnabled } from "@/src/core/own-world";
import { assertNoText, buildOwnResult } from "@/src/server/own-result";

if (!ownEnabled()) throw new Error("run it as `npm run own:save` (KOKOROE_OWN=1)");
const ROOT = path.resolve(__dirname, "..");
const base = path.join(ownDir(), "sessions", "own-00000000-0000-4000-8000-000000000000");
if (!existsSync(`${base}.meta.json`)) throw new Error("no own-mode session found in the own folder");
const meta = JSON.parse(readFileSync(`${base}.meta.json`, "utf8"));
const store = existsSync(`${base}.store.json`) ? JSON.parse(readFileSync(`${base}.store.json`, "utf8")) : { rules: [] };
const result = buildOwnResult(meta, store.rules ?? []);
assertNoText(result); // last check: only the fixed note and the date may be strings
mkdirSync(path.join(ROOT, "docs/results"), { recursive: true });
const file = path.join(ROOT, "docs/results", `own-company-test-${result.date}.json`);
writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
console.log(`saved ${path.relative(ROOT, file)} — ${result.judged}/${result.situations} judged, ${result.prose.n} prose, ${result.rulesLearned} 心得 learned${result.counted ? "" : " (not counted yet: use the summary page)"}`);
