/**
 * Compiler (編纂): apply the chosen reading to the kokoroe-chō.
 * Every rule keeps its sources (the master's judgments) and its history (old → new, trigger, date, source) in the body.
 */
import { jstDate } from "./fix";
import type { KokoroeStore } from "./store";
import type { Candidate, JudgmentRecord, KokoroeRule, RuleSource } from "./types";

export interface AppliedChange {
  ruleId: string;
  action: "add" | "revise";
  before: string | null;
  after: string;
}

function sourceOf(j: JudgmentRecord): RuleSource {
  return { judgmentId: j.id, date: jstDate(j.at), sceneId: j.sceneId, verdict: j.verdict, remark: j.remark };
}

const full = (text: string, when: string | null) => (when ? `${text}（${when}）` : text);

export async function applyCandidate(
  store: KokoroeStore,
  judgment: JudgmentRecord,
  c: Candidate,
  meta: { diagnosis: string; confidence: KokoroeRule["confidence"] },
): Promise<AppliedChange> {
  const date = jstDate(judgment.at);
  const target = c.action === "revise" && c.targetRuleId ? await store.getRule(c.targetRuleId) : undefined;
  if (target) {
    const before = full(target.text, target.when);
    target.text = c.text;
    target.when = c.when;
    target.scope = { ...c.scope };
    target.confidence = meta.confidence;
    target.sources.push(sourceOf(judgment));
    target.history.push({
      date,
      before,
      after: full(c.text, c.when),
      trigger: null,
      judgmentId: judgment.id,
      masterWords: judgment.remark,
      reason: meta.diagnosis,
    });
    await store.saveRule(target);
    return { ruleId: target.id, action: "revise", before, after: full(c.text, c.when) };
  }
  // "add", or a "revise" pointing at a rule that doesn't exist → add.
  const rule: KokoroeRule = {
    id: await store.nextRuleId(),
    scope: { ...c.scope },
    text: c.text,
    when: c.when,
    status: "active",
    confidence: meta.confidence,
    sources: [sourceOf(judgment)],
    history: [
      { date, before: null, after: full(c.text, c.when), trigger: null, judgmentId: judgment.id, masterWords: judgment.remark, reason: meta.diagnosis },
    ],
  };
  await store.saveRule(rule);
  return { ruleId: rule.id, action: "add", before: null, after: full(c.text, c.when) };
}

/** Record the master's "why" on the latest history entry of a rule. */
export async function recordTrigger(store: KokoroeStore, ruleId: string, trigger: string): Promise<void> {
  const r = await store.getRule(ruleId);
  if (!r || !trigger) return;
  r.history[r.history.length - 1].trigger = trigger;
  await store.saveRule(r);
}

/** One rule as a kokoroe-chō entry: short rule, condition, then 沿革 lines (旧 → 新・きっかけ・日付・出典). */
export function renderRule(r: KokoroeRule): string {
  const head = `### ${r.id}${r.status === "retired" ? "（廃止）" : ""} ${r.text}`;
  const when = r.when ? `\n- 条件: ${r.when}` : "";
  const scope = `\n- 適用: ${r.scope.sceneTypes?.join("・") ?? "全場面"} / 確信度: ${r.confidence}`;
  const hist = r.history
    .map((h) => {
      const src = r.sources.find((s) => s.judgmentId === h.judgmentId);
      const where = src ? `${h.judgmentId}（${src.sceneId} ${src.verdict}「${src.remark || "一言なし"}」）` : h.judgmentId;
      const change = h.before ? `旧「${h.before}」→ 新「${h.after}」` : `新「${h.after}」`;
      return `  - ${change}・きっかけ: ${h.trigger ?? "（未記入）"}・日付: ${h.date}・出典: ${where}`;
    })
    .join("\n");
  return `${head}${when}${scope}\n- 沿革:\n${hist}`;
}

export function renderRules(title: string, rules: KokoroeRule[]): string {
  return `# ${title}\n\n${rules.map(renderRule).join("\n\n") || "（まだ心得はない）"}\n`;
}
