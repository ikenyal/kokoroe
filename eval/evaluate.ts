/**
 * Shared evaluation helpers: run a disciple over the held-out scenes, and the successor over the history questions.
 * All numbers are on fictional data (10 clients / 20 held-out scenes / 8 history questions).
 */
import { getClient, HISTORY_QUESTIONS } from "@/src/core/world";
import type { Proposal, Scene } from "@/src/core/types";
import type { Disciple, Usage } from "@/src/disciple/v0";
import type { KokoroeStore } from "@/src/learning/store";
import { askSuccessor, type SuccessorMode } from "@/src/successor/ask";
import { estimateUsd } from "@/src/lib/cost";
import { HISTORY_ANSWERS } from "./simulator/hidden";
import { judge } from "./simulator/judge";
import { remarkFor, rng } from "./simulator/remark";
import { rates, type ScoredScene } from "./metrics";

export async function proposeAll(disciple: Disciple, scenes: Scene[], concurrency: number): Promise<Proposal[]> {
  const out = new Array<Proposal>(scenes.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < scenes.length) {
        const i = next++;
        out[i] = await disciple.propose(scenes[i], getClient(scenes[i].clientId));
      }
    }),
  );
  return out;
}

export async function runOnce(disciple: Disciple, scenes: Scene[], seed: number, concurrency: number) {
  const usageStart = disciple.usage?.length ?? 0;
  const t0 = performance.now();
  const proposals = await proposeAll(disciple, scenes, concurrency);
  const elapsedSec = Number(((performance.now() - t0) / 1000).toFixed(1));
  const rand = rng(seed);
  const rows = scenes.map((s, i) => {
    const r = judge(s, getClient(s.clientId), proposals[i]);
    return { ...r, clientId: s.clientId, type: s.type, remark: remarkFor(r.verdict, r.checks, rand) };
  });
  const scored: ScoredScene[] = rows.map(({ sceneId, clientId, type, verdict }) => ({ sceneId, clientId, type, verdict }));
  const usage = (disciple.usage ?? []).slice(usageStart);
  const tokens = {
    calls: usage.length,
    input: usage.reduce((a, u) => a + u.input_tokens, 0),
    output: usage.reduce((a, u) => a + u.output_tokens, 0),
    estUsd: Number(estimateUsd(usage).toFixed(4)),
  };
  return { rows, scored, total: rates(scored), elapsedSec, tokens, proposals };
}

/**
 * History questions (沿革の正答率): correct = expected yes/no AND the explanation mentions the trigger
 * (at least one keyword from every keyword group) AND, in grounded mode, valid citations of kokoroe-chō rules.
 */
export async function runHistoryQuestions(store: KokoroeStore | null, usage: Usage[], mode: SuccessorMode = "grounded") {
  const results = await Promise.all(
    HISTORY_QUESTIONS.map(async (q) => {
      const client = getClient(q.clientId);
      const rules = store
        ? (await store.listRules()).filter((r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === q.clientId))
        : [];
      const a = await askSuccessor({ client, question: q.question, rules, mode, usage });
      const key = HISTORY_ANSWERS[q.id];
      const answerOk = a.answer === key.expectedAnswer;
      const missing = key.keywordGroups.filter((g) => !g.some((kw) => a.explanation.includes(kw)));
      const historyOk = answerOk && missing.length === 0 && a.citationsValid;
      return { id: q.id, answer: a.answer, answerOk, historyOk, citationsValid: a.citationsValid, missing, explanation: a.explanation, citations: a.citations };
    }),
  );
  return {
    n: results.length,
    answerOk: results.filter((r) => r.answerOk).length,
    correct: results.filter((r) => r.historyOk).length,
    unknown: results.filter((r) => r.answer === "unknown").length,
    results,
  };
}
