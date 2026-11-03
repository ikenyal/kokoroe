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
  return { kind: "judgment", judgmentId: j.id, date: jstDate(j.at), sceneId: j.sceneId, verdict: j.verdict, remark: j.remark };
}

function describeSource(src: RuleSource | undefined, id: string): string {
  if (!src) return id;
  if (src.kind === "ledger") return "台帳（取引先台帳の明示的な制約）";
  return `${id}（${src.sceneId} ${src.verdict}「${src.remark || "一言なし"}」）`;
}

const full = (text: string, when: string | null) => (when ? `${text}（${when}）` : text);

export async function applyCandidate(
  store: KokoroeStore,
  judgment: JudgmentRecord,
  c: Candidate,
  meta: { diagnosis: string; confidence: KokoroeRule["confidence"] },
): Promise<AppliedChange> {
  const date = jstDate(judgment.at);
  const found = c.action === "revise" && c.targetRuleId ? await store.getRule(c.targetRuleId) : undefined;
  // Scope guards in code, not only in the prompt (audit 2026-11-03): a correction about one client may revise only that
  // client's rules or an existing company-wide one, and widening to all clients happens only by revising such a rule.
  // Only active rules are revised; a company-wide rule is revised only as company-wide (narrowing it to one client would drop it
  // for the other nine unchecked — regression replays this client's scenes only), otherwise this client gets its own rule.
  const sameClient = found?.scope.clientId === judgment.clientId;
  const wideStaysWide = found?.scope.clientId === null && c.scope.clientId === null;
  const target = found && found.status === "active" && !found.mergedInto && (sameClient || wideStaysWide) ? found : undefined;
  const scope = { ...c.scope, clientId: target && c.scope.clientId === null ? null : judgment.clientId };
  if (target) {
    const before = full(target.text, target.when);
    target.text = c.text;
    target.when = c.when;
    target.scope = scope;
    target.confidence = meta.confidence;
    target.fix = c.fix;
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
  // "add", or a "revise" pointing at a rule that doesn't exist or belongs to another client → add, scoped to this client.
  const rule: KokoroeRule = {
    id: await store.nextRuleId(),
    scope,
    text: c.text,
    when: c.when,
    status: "active",
    confidence: meta.confidence,
    fix: c.fix,
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
  const state = r.mergedInto ? `（${r.mergedInto} に統合）` : r.status === "retired" ? "（廃止）" : "";
  const fromLedger = r.sources.some((s) => s.kind === "ledger");
  const fromMaster = r.sources.some((s) => s.kind !== "ledger");
  const origin = fromLedger ? (fromMaster ? "〔台帳＋師匠〕" : "〔台帳〕") : "";
  const head = `### ${r.id}${state}${origin}${r.scope.clientId === null ? "〔全社〕" : ""} ${r.text}`;
  const when = r.when ? `\n- 条件: ${r.when}` : "";
  const scope = `\n- 適用: ${r.scope.sceneTypes?.join("・") ?? "全場面"} / 確信度: ${r.confidence}`;
  const hist = r.history
    .map((h) => {
      const where = describeSource(r.sources.find((s) => s.judgmentId === h.judgmentId), h.judgmentId);
      const change = h.before ? `旧「${h.before}」→ 新「${h.after}」` : `新「${h.after}」`;
      return `  - ${change}・きっかけ: ${h.trigger ?? "（未記入）"}・日付: ${h.date}・出典: ${where}`;
    })
    .join("\n");
  return `${head}${when}${scope}\n- 沿革:\n${hist}`;
}

export function renderRules(title: string, rules: KokoroeRule[]): string {
  return `# ${title}\n\n${rules.map(renderRule).join("\n\n") || "（まだ心得はない）"}\n`;
}
