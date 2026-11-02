/**
 * Compiler (編纂): apply an interpretation to the kokoroe-chō.
 * Every rule keeps its sources (the master's judgments) and its history (old → new, master's words, date) in the body.
 */
import type { Interpretation } from "./interpret";
import type { KokoroeStore } from "./store";
import type { JudgmentRecord, KokoroeRule, RuleSource } from "./types";

export interface AppliedChange {
  ruleId: string;
  action: "add" | "revise";
  before: string | null;
  after: string;
}

function sourceOf(j: JudgmentRecord): RuleSource {
  return { judgmentId: j.id, date: j.at.slice(0, 10), sceneId: j.sceneId, verdict: j.verdict, remark: j.remark };
}

export async function applyInterpretation(
  store: KokoroeStore,
  judgment: JudgmentRecord,
  interp: Interpretation,
): Promise<AppliedChange[]> {
  const changes: AppliedChange[] = [];
  const date = judgment.at.slice(0, 10);
  for (const u of interp.updates) {
    const target = u.action === "revise" && u.targetRuleId ? await store.getRule(u.targetRuleId) : undefined;
    if (target) {
      const before = target.text;
      target.text = u.text;
      target.scope = { clientId: u.scope.clientId, sceneTypes: u.scope.sceneTypes };
      target.confidence = interp.confidence;
      target.sources.push(sourceOf(judgment));
      target.history.push({ date, before, after: u.text, judgmentId: judgment.id, masterWords: judgment.remark, reason: interp.diagnosis });
      await store.saveRule(target);
      changes.push({ ruleId: target.id, action: "revise", before, after: u.text });
      continue;
    }
    // "add", or a "revise" pointing at a rule that doesn't exist → add.
    const rule: KokoroeRule = {
      id: await store.nextRuleId(),
      scope: { clientId: u.scope.clientId, sceneTypes: u.scope.sceneTypes },
      text: u.text,
      status: "active",
      confidence: interp.confidence,
      sources: [sourceOf(judgment)],
      history: [{ date, before: null, after: u.text, judgmentId: judgment.id, masterWords: judgment.remark, reason: interp.diagnosis }],
    };
    await store.saveRule(rule);
    changes.push({ ruleId: rule.id, action: "add", before: null, after: u.text });
  }
  return changes;
}

/** Render one client's (or the company-wide) rules as a kokoroe-chō page, with sources and history in the body. */
export function renderRules(title: string, rules: KokoroeRule[]): string {
  const body = rules
    .map((r) => {
      const src = r.sources.map((s) => `  - ${s.date} ${s.judgmentId}（${s.sceneId}）${s.verdict}「${s.remark || "一言なし"}」`).join("\n");
      const hist = r.history
        .map((h) => `  - ${h.date} ${h.before ? `「${h.before}」→「${h.after}」` : `作成「${h.after}」`}（師匠: ${h.masterWords || "一言なし"}）`)
        .join("\n");
      return `### ${r.id}${r.status === "retired" ? "（廃止）" : ""}\n${r.text}\n- 適用: ${r.scope.sceneTypes?.join("・") ?? "全場面"} / 確信度: ${r.confidence}\n- 出典:\n${src}\n- 沿革:\n${hist}`;
    })
    .join("\n\n");
  return `# ${title}\n\n${body || "（まだ心得はない）"}\n`;
}
