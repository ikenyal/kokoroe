/**
 * After the master-role test (11/6; internally "field"): save its result into the repo — docs/results/master-role-test-<date>.json. No API calls.
 *   npm run -s field:save                      # newest field session under .data (or KOKOROE_DATA_DIR)
 *   npm run -s field:save -- --no-text         # leave out the prose you wrote (timings and counts only)
 * Contents: medians per action, counts (cards, corrections, rules learned from the master), the rules' text, and — unless
 * --no-text — the 5 prose answers, so the "how many distinct pieces of etiquette" comparison (D-041) can be tallied by hand
 * (`proseEtiquetteCount` is left for Kento to fill in). Fictional data only.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { "no-text": { type: "boolean", default: false } } });
const ROOT = path.resolve(__dirname, "..");
const dir = path.join(process.env.KOKOROE_DATA_DIR ?? path.join(ROOT, ".data"), "sessions");
const metas = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith("field-") && f.endsWith(".meta.json")) : [];
if (!metas.length) throw new Error(`no field session in ${dir}`);
const newest = metas.map((f) => path.join(dir, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
const meta = JSON.parse(readFileSync(newest, "utf8"));
const store = JSON.parse(readFileSync(newest.replace(".meta.json", ".store.json"), "utf8"));

type T = { kind: string; ms: number; chars?: number };
const timings: T[] = meta.timings ?? [];
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
const kinds = [...new Set(timings.map((t) => t.kind))];
const learned = store.rules.filter((r: { origin?: string }) => r.origin !== "ledger");
const date = meta.createdAt.slice(0, 10);
const out = {
  note: "師匠役テスト / master-role test (D-031, D-041, D-046): one person (the author) as the master, fictional data. Timings in ms; medians per action.",
  date,
  cards: meta.queue.length,
  judged: meta.pos,
  corrections: (meta.pending ?? []).length,
  timings: Object.fromEntries(kinds.map((k) => [k, { n: timings.filter((t) => t.kind === k).length, medianMs: median(timings.filter((t) => t.kind === k).map((t) => t.ms)) }])),
  rulesLearned: learned.filter((r: { status: string }) => r.status === "active").map((r: { id: string; text: string; when: string | null }) => ({ id: r.id, text: r.text, when: r.when })),
  prose: (meta.writes ?? []).map((w: { sceneId: string; ms: number; text: string }) => ({ sceneId: w.sceneId, ms: w.ms, chars: w.text.length, ...(values["no-text"] ? {} : { text: w.text }) })),
  proseEtiquetteCount: null,
};
mkdirSync(path.join(ROOT, "docs/results"), { recursive: true });
const file = path.join(ROOT, "docs/results", `master-role-test-${date}.json`);
writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
console.log(`saved ${path.relative(ROOT, file)} — ${out.judged}/${out.cards} cards, ${out.corrections} corrections, ${out.rulesLearned.length} rules learned, ${out.prose.length} prose answers`);
