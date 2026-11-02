/**
 * 一般化 (widening a habit to all clients) — never silent (HITL):
 *   1. Detect: a client rule and rules for OTHER clients came from readings with the same implied fix (same field + value),
 *      e.g. "quiet word to the decider" learned at 丸新酒造 and at まちなか生協.
 *   2. Word it: Opus writes one company-wide rule covering them.
 *   3. Ask: the master confirms with one tap ("make this a rule for every client?"). No → never proposed again for this set.
 *   4. Check: re-solve recent past ○ scenes across all clients; ask the master only where the decision changed.
 *      Any regression → 差し戻し (the company-wide rule is retired, the client rules come back), recorded in the 沿革.
 */
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { SCENE_TYPE_LABELS, type Client, type Scene } from "@/src/core/types";
import type { Disciple, Usage } from "@/src/disciple/v0";
import { getClaude, MODELS, usageOf } from "@/src/lib/claude";
import { jstDate } from "./fix";
import type { KokoroeStore } from "./store";
import type { GeneralizationMember, JudgmentRecord, KokoroeRule, Master } from "./types";
import { sameDecision } from "./verify";

const SCENE_TYPES = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10"] as const;
const GeneralSchema = z.object({
  text: z.string().describe("ONE short company-wide rule in Japanese (~40 chars). Do not name any client."),
  when: z.string().nullable().describe("Short condition, or null"),
  sceneTypes: z.array(z.enum(SCENE_TYPES)).nullable().describe("Scene types it applies to, or null for all"),
});

export interface GeneralizeResult {
  proposedRuleId: string | null; // the company-wide rule (null if declined)
  members: string[];
  accepted: boolean;
  regressionChecked: number;
  regressionAsked: number;
  rolledBack: boolean;
  brokenSceneId: string | null;
  taps: number;
}

const MAX_REGRESSION = 5;
const sameFix = (a: KokoroeRule, b: KokoroeRule) => !!a.fix && !!b.fix && a.fix.field === b.fix.field && a.fix.value === b.fix.value;

async function wordIt(members: GeneralizationMember[], usage?: Usage[]) {
  const list = members
    .map((m) => `- ${m.client.name}（${m.client.industry}）: ${m.rule.text}${m.rule.when ? `（${m.rule.when}）` : ""} ／場面: ${m.scene.type} ${SCENE_TYPE_LABELS[m.scene.type]}`)
    .join("\n");
  const res = await getClaude().messages.parse({
    model: MODELS.editor,
    max_tokens: 2000,
    system:
      "You maintain the kokoroe-chō of a Japanese company. Several client-specific rules turned out to express the same habit. " +
      "Write one company-wide rule that covers them: short, concrete, without client names. Keep conditions that all members share.",
    messages: [{ role: "user", content: `同じ傾向の心得:\n${list}` }],
    output_config: { effort: "low", format: zodOutputFormat(GeneralSchema) },
  });
  usage?.push(usageOf(res, 0)); // rare call; not cached (prompt is below the cache minimum)
  if (!res.parsed_output) throw new Error("unparseable generalization");
  return res.parsed_output;
}

export async function maybeGeneralize(args: {
  store: KokoroeStore;
  disciple: Disciple;
  master: Master;
  ruleId: string;
  sceneById: (id: string) => Scene | undefined;
  clientById: (id: string) => Client;
  usage?: Usage[];
  now?: () => Date;
  wordFn?: typeof wordIt; // injectable for tests
}): Promise<GeneralizeResult | null> {
  const { store, master } = args;
  const rule = await store.getRule(args.ruleId);
  if (!rule || rule.status !== "active" || rule.origin === "ledger" || !rule.fix || rule.scope.clientId === null) return null;

  const all = await store.listRules();
  const peers = all.filter(
    (r) => r.status === "active" && r.origin !== "ledger" && r.scope.clientId !== null && r.scope.clientId !== rule.scope.clientId && sameFix(r, rule),
  );
  const declined = new Set(rule.declinedMerge ?? []);
  const fresh = peers.filter((p) => !declined.has(p.id));
  if (!fresh.length) return null;

  // Gather the correction behind each rule (its first judgment source).
  const judgments = await store.listJudgments();
  const memberOf = (r: KokoroeRule): GeneralizationMember | null => {
    const src = r.sources.find((s) => s.kind !== "ledger");
    const j = src && judgments.find((x) => x.id === src.judgmentId);
    const scene = j && args.sceneById(j.sceneId);
    return j && scene && r.fix ? { rule: r, scene, client: args.clientById(j.clientId), proposal: j.proposal, fix: r.fix } : null;
  };
  const members = [rule, ...fresh].map(memberOf).filter((m): m is GeneralizationMember => !!m);
  if (members.length < 2) return null;

  const res: GeneralizeResult = {
    proposedRuleId: null, members: members.map((m) => m.rule.id), accepted: false,
    regressionChecked: 0, regressionAsked: 0, rolledBack: false, brokenSceneId: null, taps: 0,
  };
  const proposed = await (args.wordFn ?? wordIt)(members, args.usage);
  res.taps++;
  res.accepted = await master.confirmGeneralization({ proposed, members });
  const at = () => (args.now?.() ?? new Date()).toISOString();
  const date = jstDate(at());
  if (!res.accepted) {
    for (const m of members) {
      const r = (await store.getRule(m.rule.id))!;
      r.declinedMerge = [...new Set([...(r.declinedMerge ?? []), ...res.members.filter((id) => id !== r.id)])];
      await store.saveRule(r);
    }
    return res;
  }

  // Apply: one company-wide rule; the client rules are folded into it.
  const snapshots = members.map((m) => structuredClone(m.rule));
  const g: KokoroeRule = {
    id: await store.nextRuleId(),
    scope: { clientId: null, sceneTypes: proposed.sceneTypes },
    text: proposed.text,
    when: proposed.when,
    status: "active",
    confidence: "medium",
    fix: rule.fix,
    sources: members.flatMap((m) => m.rule.sources),
    history: [{
      date, before: null, after: proposed.when ? `${proposed.text}（${proposed.when}）` : proposed.text, trigger: null,
      judgmentId: members[0].rule.sources[0].judgmentId, masterWords: "（全社の心得にすることを師匠が確認）",
      reason: `一般化: ${members.map((m) => `${m.rule.id}（${m.client.name}）`).join("・")} を全社の心得にまとめた`,
    }],
  };
  await store.saveRule(g);
  res.proposedRuleId = g.id;
  for (const m of members) {
    const r = (await store.getRule(m.rule.id))!;
    r.status = "retired";
    r.mergedInto = g.id;
    r.history.push({ date, before: r.text, after: `（${g.id} に統合）`, trigger: null, judgmentId: g.history[0].judgmentId, masterWords: "", reason: "全社の心得にまとめた" });
    await store.saveRule(r);
  }

  // Check: recent past ○ scenes across all clients.
  const latest = new Map<string, JudgmentRecord>();
  for (const j of judgments) latest.set(j.sceneId, j);
  const okSet = [...latest.values()].filter((j) => j.verdict === "○").reverse().slice(0, MAX_REGRESSION);
  for (const past of okSet) {
    const s = args.sceneById(past.sceneId);
    if (!s) continue;
    res.regressionChecked++;
    const client = args.clientById(past.clientId);
    const p = await args.disciple.propose(s, client);
    if (sameDecision(past.proposal, p)) continue;
    res.regressionAsked++;
    res.taps++;
    const v = await master.judge(s, client, p);
    await store.addJudgment({ at: at(), sceneId: s.id, clientId: client.id, sceneType: s.type, proposal: p, verdict: v.verdict, remark: v.remark, kind: "regression" });
    if (v.verdict !== "○") {
      res.rolledBack = true;
      res.brokenSceneId = s.id;
      break;
    }
  }
  if (res.rolledBack) {
    const now = (await store.getRule(g.id))!;
    now.status = "retired";
    now.history.push({ date, before: now.text, after: "（差し戻し: 廃止）", trigger: null, judgmentId: now.history[0].judgmentId, masterWords: "", reason: `回帰テストで ${res.brokenSceneId}（以前は○）が崩れたため差し戻し` });
    await store.saveRule(now);
    for (const snap of snapshots) {
      const cur = (await store.getRule(snap.id))!;
      await store.saveRule({
        ...snap,
        declinedMerge: [...new Set([...(snap.declinedMerge ?? []), ...res.members.filter((id) => id !== snap.id)])],
        history: [...cur.history, { date, before: `（${g.id} に統合）`, after: snap.text, trigger: null, judgmentId: g.history[0].judgmentId, masterWords: "", reason: "一般化を差し戻したため元に戻す" }],
      });
    }
  }
  return res;
}
