/**
 * Seed the kokoroe-chō from the client ledger's explicit constraints (D-020).
 * These are facts the apprentice already follows, so it is never corrected on them — and the master is never asked why.
 * Each becomes a rule with origin "ledger" (出典: 台帳), and the master is asked "why?" once per item (optional, can skip).
 */
import type { Client } from "@/src/core/types";
import { recordTrigger } from "./compile";
import { jstDate } from "./fix";
import type { KokoroeStore } from "./store";
import type { KokoroeRule, Master } from "./types";

export const LEDGER_SOURCE_PREFIX = "LEDGER-";

export interface LedgerSeedResult {
  seeded: string[]; // rule ids
  asked: number; // "why?" prompts shown (= master taps; skipping still costs the glance)
  answered: number;
}

export async function seedFromLedger(args: {
  store: KokoroeStore;
  clients: Client[];
  master: Master;
  now?: () => Date;
}): Promise<LedgerSeedResult> {
  const { store, clients, master } = args;
  const date = jstDate((args.now?.() ?? new Date()).toISOString());
  const res: LedgerSeedResult = { seeded: [], asked: 0, answered: 0 };
  const existing = await store.listRules();
  for (const client of clients) {
    if (!client.constraints || client.constraints === "なし") continue;
    const sourceId = `${LEDGER_SOURCE_PREFIX}${client.id}`;
    if (existing.some((r) => r.sources.some((s) => s.judgmentId === sourceId))) continue; // seed once
    const rule: KokoroeRule = {
      id: await store.nextRuleId(),
      scope: { clientId: client.id, sceneTypes: null },
      text: client.constraints,
      when: null,
      status: "active",
      confidence: "high",
      origin: "ledger",
      sources: [{ kind: "ledger", judgmentId: sourceId, date, sceneId: "", verdict: null, remark: "" }],
      history: [{ date, before: null, after: client.constraints, trigger: null, judgmentId: sourceId, masterWords: "", reason: "取引先台帳の明示的な制約から登録" }],
    };
    await store.saveRule(rule);
    res.seeded.push(rule.id);
    res.asked++;
    const why = await master.why({ client, rule });
    if (why) {
      res.answered++;
      await recordTrigger(store, rule.id, why);
    }
  }
  return res;
}
