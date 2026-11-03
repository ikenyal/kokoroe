/**
 * Diagnosis of the history questions (Kento 11/4, step 3): on already-grown kokoroe-chō (no training), which of the 8 questions
 * fail, and why. One grounded run per store (Sonnet), then each miss is classified:
 *   wrong-answer — yes/no wrong or "unknown"
 *   bad-citation — the answer cited no valid rule
 *   not-in-book  — the words the history needs are nowhere in that client's (or company) rules: the 心得帳 never learned the why
 *   not-said     — the words are in the book, but the answer did not use them
 * Reads the hidden answer keys only to classify (as the evaluation itself does); nothing here changes a prompt.
 *   npx tsx --env-file-if-exists=.env.local eval/history-diagnose.ts [--stores a.json,b.json] [--yes]
 */
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { HISTORY_QUESTIONS } from "@/src/core/world";
import type { Usage } from "@/src/disciple/v0";
import { LocalJsonStore } from "@/src/learning/store";
import { estimateUsd } from "@/src/lib/cost";
import { runHistoryQuestions } from "./evaluate";
import { HISTORY_ANSWERS } from "./simulator/hidden";

const RAW = path.join(__dirname, "runs", "raw");

async function main() {
  const { values } = parseArgs({ options: { stores: { type: "string" }, yes: { type: "boolean", default: false } } });
  const latest = readdirSync(RAW)
    .filter((f) => /^store-2026-11-02T2.*\.json$/.test(f))
    .sort()
    .slice(-4)
    .map((f) => path.join(RAW, f));
  const stores = values.stores ? values.stores.split(",") : latest;
  console.log(`stores (${stores.length}): ${stores.map((s) => path.basename(s)).join(", ")}`);
  console.log(`calls: ${stores.length} × ${HISTORY_QUESTIONS.length} grounded answers (Sonnet) — estimate under $0.3`);
  if (!values.yes) return console.log("Not called. Add --yes.");

  const usage: Usage[] = [];
  const rows: { store: string; id: string; historyOk: boolean; cause: string; answer: string; expected: string; missing: { need: string[]; inBook: boolean }[]; citedHaveWhy: boolean[] }[] = [];
  for (const file of stores) {
    const store = new LocalJsonStore(file);
    const rules = (await store.listRules()).filter((r) => r.status === "active");
    const r = await runHistoryQuestions(store, usage, "grounded");
    for (const q of r.results) {
      const key = HISTORY_ANSWERS[q.id];
      const clientId = HISTORY_QUESTIONS.find((x) => x.id === q.id)!.clientId;
      const book = rules
        .filter((x) => x.scope.clientId === null || x.scope.clientId === clientId)
        .map((x) => [x.text, x.when, ...x.history.flatMap((h) => [h.after, h.trigger, h.masterWords])].filter(Boolean).join(" "))
        .join(" ");
      const groups = q.missing.map((g) => ({ need: g, inBook: g.some((kw) => book.includes(kw)) }));
      const cause = q.historyOk
        ? "ok"
        : !q.answerOk
          ? "wrong-answer"
          : !q.citationsValid
            ? "bad-citation"
            : groups.some((g) => !g.inBook)
              ? "not-in-book"
              : "not-said";
      const cited = rules.filter((x) => q.citations.some((c) => c.ruleId === x.id));
      rows.push({
        store: path.basename(file), id: q.id, expected: key.expectedAnswer, answer: q.answer, historyOk: q.historyOk, cause,
        missing: groups, citedHaveWhy: cited.map((x) => x.history.some((h) => !!h.trigger)),
      });
    }
    console.log(`${path.basename(file)}: ${r.correct}/8 with history, yes/no right ${r.answerOk}/8`);
  }
  const usd = estimateUsd(usage);
  const byQuestion = HISTORY_QUESTIONS.map((q) => {
    const rs = rows.filter((x) => x.id === q.id);
    const causes = rs.reduce<Record<string, number>>((a, x) => ((a[x.cause] = (a[x.cause] ?? 0) + 1), a), {});
    return { id: q.id, question: q.question, ok: rs.filter((x) => x.historyOk).length, of: rs.length, causes };
  });
  for (const b of byQuestion) console.log(`${b.id} ${b.ok}/${b.of}  ${JSON.stringify(b.causes)}  ${b.question}`);
  console.log(`≈ $${usd.toFixed(3)}`);
  const date = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const out = path.join(__dirname, "..", "docs", "results", `history-diagnosis-${date}.json`);
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), note: "fictional data; 8 history questions on already-grown kokoroe-chō (no training); one grounded run per store", usd, byQuestion, rows }, null, 2) + "\n");
  console.log(`→ ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
