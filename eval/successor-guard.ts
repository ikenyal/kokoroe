/**
 * The successor's instructions, before / after a change (Kento 11/4, step 3). On already-grown kokoroe-chō (no training):
 *   - the 8 history questions (with history = yes/no right + the recorded history words + a valid citation),
 *   - 6 questions the kokoroe-chō does NOT cover (data/scenes/unknown-questions.json): the right answer is "unknown" — any yes/no
 *     there is an answer made up without a rule ("made-up"), the thing the change must not increase.
 *   npx tsx --env-file-if-exists=.env.local eval/successor-guard.ts --label before|after [--yes]
 * Fictional data. One grounded run per store and question.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { getClient, HISTORY_QUESTIONS } from "@/src/core/world";
import { renderRule } from "@/src/learning/compile";
import type { Usage } from "@/src/disciple/v0";
import { LocalJsonStore } from "@/src/learning/store";
import { estimateUsd } from "@/src/lib/cost";
import { askSuccessor } from "@/src/successor/ask";
import { runHistoryQuestions } from "./evaluate";

const RAW = path.join(__dirname, "runs", "raw");
const UNKNOWN = JSON.parse(readFileSync(path.join(__dirname, "..", "data", "scenes", "unknown-questions.json"), "utf8")) as { id: string; clientId: string; kind: "far" | "near"; question: string }[];
/** A rule for the client exists, but the question is about a discount: the answer must still send it to the master. */
const PRICE = JSON.parse(readFileSync(path.join(__dirname, "..", "data", "scenes", "price-questions.json"), "utf8")) as { id: string; clientId: string; question: string }[];
const ASK_MASTER = "心得帳には記録がありません。師匠に確認してください。";

/**
 * Internal labels and record markers that should never reach the successor (Kento 11/6): rule / scene / judgment ids, the
 * kokoroe-chō's bracket tags and field names, and the 沿革's own notation. Rule ids belong in `citations`, not in the text.
 */
const INTERNAL = /K-\d{3}|R\d{2}\b|\b[TE]\d{2}\b|j-[0-9a-f]{6,}|新のみ|旧なし|未記入|適用:|出典:|〔台帳|〔全社|旧「|新「|ruleId|sceneId/g;
const leaks = (text: string) => [...new Set(text.match(INTERNAL) ?? [])];
/** 「確信度」 is counted apart: an honest "this rule is not yet certain" must not be tuned away as if it were a label (hitl-reviewer 11/6). */
const confidenceWord = (text: string) => text.includes("確信度");

/** Each 「…」 in an answer that is not in the kokoroe-chō text (rules + 沿革) nor in the question: presented as a quote, but not one. */
function misquotes(explanation: string, book: string, question: string) {
  return [...explanation.matchAll(/「([^」]{4,})」/g)].map((m) => m[1]).filter((q) => !book.includes(q) && !question.includes(q) && !ASK_MASTER.includes(q));
}

async function main() {
  const { values } = parseArgs({ options: { label: { type: "string", default: "run" }, yes: { type: "boolean", default: false }, "extra-only": { type: "boolean", default: false }, stores: { type: "string", default: "4" } } });
  const extraOnly = values["extra-only"]; // only the near-miss and price questions (to compare before/after on them)
  const stores = readdirSync(RAW).filter((f) => /^store-2026-11-02T2.*\.json$/.test(f)).sort().slice(-4).slice(0, Number(values.stores)).map((f) => path.join(RAW, f));
  console.log(`${stores.length} stores × (8 history + ${UNKNOWN.length} not-covered) grounded answers — estimate ≈ $0.4`);
  if (!values.yes) return console.log("Not called. Add --yes.");
  const usage: Usage[] = [];
  type Per = {
    store: string;
    history: { correct: number; answerOk: number; unknown: number; byQ: { id: string; ok: boolean; answer: string; missing: string[][]; explanation: string }[] };
    notCovered: { madeUp: number; of: number; answers: { id: string; kind: string; answer: string; madeUp: boolean; citations: string[]; explanation: string }[] };
    price: { toMaster: number; of: number; answers: { id: string; answer: string; toMaster: boolean; explanation: string }[] };
    misquoted: { id: string; bad: string[] }[];
    leaked: { id: string; labels: string[] }[];
    confidenceWord: number;
  };
  const per: Per[] = [];
  for (const file of stores) {
    const store = new LocalJsonStore(file);
    const h = extraOnly ? { correct: 0, answerOk: 0, unknown: 0, results: [] as Awaited<ReturnType<typeof runHistoryQuestions>>["results"] } : await runHistoryQuestions(store, usage, "grounded");
    const rules = (await store.listRules()).filter((r) => r.status === "active");
    const forClient = (id: string) => rules.filter((r) => r.scope.clientId === null || r.scope.clientId === id);
    const bookOf = (id: string) => forClient(id).map(renderRule).join("\n");
    const unknown = await Promise.all(
      UNKNOWN.filter((q) => !extraOnly || q.kind === "near").map(async (q) => {
        const a = await askSuccessor({ client: getClient(q.clientId), question: q.question, rules: forClient(q.clientId), usage });
        return { id: q.id, kind: q.kind, answer: a.answer, madeUp: a.answer !== "unknown", citations: a.citations.map((c) => c.ruleId), explanation: a.explanation };
      }),
    );
    const price = await Promise.all(
      PRICE.map(async (q) => {
        const a = await askSuccessor({ client: getClient(q.clientId), question: q.question, rules: forClient(q.clientId), usage });
        return { id: q.id, answer: a.answer, toMaster: a.explanation.includes("師匠"), explanation: a.explanation };
      }),
    );
    const misquoted = h.results.map((r) => {
      const q = HISTORY_QUESTIONS.find((x) => x.id === r.id)!;
      return { id: r.id, bad: misquotes(r.explanation, bookOf(q.clientId), q.question) };
    }).filter((x) => x.bad.length);
    per.push({
      store: path.basename(file),
      history: { correct: h.correct, answerOk: h.answerOk, unknown: h.unknown, byQ: h.results.map((r) => ({ id: r.id, ok: r.historyOk, answer: r.answer, missing: r.missing, explanation: r.explanation })) },
      notCovered: { madeUp: unknown.filter((u) => u.madeUp).length, of: unknown.length, answers: unknown },
      price: { toMaster: price.filter((x) => x.toMaster).length, of: price.length, answers: price },
      misquoted,
      leaked: [...h.results, ...unknown, ...price].map((r) => ({ id: r.id, labels: leaks(r.explanation) })).filter((x) => x.labels.length),
      confidenceWord: [...h.results, ...unknown, ...price].filter((r) => confidenceWord(r.explanation)).length,
    });
    console.log(`${path.basename(file)}: history ${h.correct}/8 (yes/no ${h.answerOk}/8, unknown ${h.unknown}, misquoted answers ${misquoted.length}) | not covered: made up ${unknown.filter((u) => u.madeUp).length}/${unknown.length} (near ${unknown.filter((u) => u.madeUp && u.kind === "near").length}) | price → master ${price.filter((x) => x.toMaster).length}/${price.length}`);
  }
  const mean = (f: (x: Per) => number) => per.reduce((n, x) => n + f(x), 0) / per.length;
  const usd = estimateUsd(usage);
  const summary = {
    stores: stores.map((x) => path.basename(x)),
    history: mean((x) => x.history.correct), answerOk: mean((x) => x.history.answerOk), misquotedAnswers: mean((x) => x.misquoted.length),
    madeUp: mean((x) => x.notCovered.madeUp), madeUpNear: mean((x) => x.notCovered.answers.filter((u) => u.madeUp && u.kind === "near").length),
    priceToMaster: mean((x) => x.price.toMaster),
    leakedAnswers: mean((x) => x.leaked.length),
    confidenceWordAnswers: mean((x) => x.confidenceWord), // the word 確信度 itself (not driven to 0: may be an honest caveat) // answers (of 8 + not-covered + price) whose text shows an internal label
  };
  console.log(`${values.label}: history ${summary.history.toFixed(2)}/8, misquoted ${summary.misquotedAnswers.toFixed(2)}, made up ${summary.madeUp.toFixed(2)} (near ${summary.madeUpNear.toFixed(2)}), price → master ${summary.priceToMaster.toFixed(2)}/${PRICE.length}, internal labels in ${summary.leakedAnswers.toFixed(2)} answers  ≈ $${usd.toFixed(3)}`);
  const date = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const out = path.join(__dirname, "..", "docs", "results", `successor-guard-${date}-${values.label}.json`);
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), label: values.label, note: "fictional data; grown kokoroe-chō, no training; one grounded run per store and question", usd, summary, per }, null, 2) + "\n");
  console.log(`→ ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
