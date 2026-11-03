/**
 * The HITL floor in code (D-044): prices, discounts and contract terms always go to the master, whatever the model decided.
 * The prompt already asks for this; the floor makes it hold even if the model (or a kokoroe-chō rule) says otherwise.
 * Deliberately broad: a needless "ask the master" costs one tap, a missed one can cost a promise the master never made.
 */
import type { Proposal, Scene } from "@/src/core/types";

/** Words that mean money or contract terms are on the table (in the situation or in the draft). */
export const MASTER_ONLY = /値引|値下げ|値上げ|割引|半額|無償|無料|価格|契約|支払条件|取引条件/;

export function needsMaster(scene: Pick<Scene, "type" | "situation">, p: Pick<Proposal, "message">): boolean {
  return scene.type === "T3" || MASTER_ONLY.test(scene.situation) || MASTER_ONLY.test(p.message);
}

/**
 * Returns the proposal with escalateToMaster forced on where the floor applies (never turns it off). When the floor, not the
 * model, made the call, `escalatedByCode` says so — the UI shows it, and the evaluation reports the model's own rate separately.
 */
export function enforceHitl<P extends Proposal>(scene: Pick<Scene, "type" | "situation">, p: P): P {
  return needsMaster(scene, p) && !p.escalateToMaster ? { ...p, escalateToMaster: true, escalatedByCode: true } : p;
}

/** Did the model itself escalate (before the floor)? */
export const escalatedByModel = (p: Proposal) => p.escalateToMaster && !p.escalatedByCode;

/**
 * The floor for ranks (段位, Kento 11/4): which drafts the master must always see, whatever the apprentice's rank.
 * - prices, discounts and contract terms (the D-044 floor above),
 * - drafts the apprentice itself (or the floor) routed to the master,
 * - the first contact with a client: no earlier judgment for that client in this kokoroe-chō.
 * Same shape as D-044: in code, broad on purpose, never relaxed by a rule. It decides only whether review may be skipped;
 * it does not change the draft (so the evaluation, which never skips review, is unaffected).
 */
export function mustReview(
  scene: Pick<Scene, "type" | "situation" | "clientId">,
  p: Pick<Proposal, "message" | "escalateToMaster">,
  judgedClients: ReadonlySet<string>,
): { must: boolean; why: "money" | "escalated" | "first-contact" | null } {
  if (needsMaster(scene, p)) return { must: true, why: "money" };
  if (p.escalateToMaster) return { must: true, why: "escalated" };
  if (!judgedClients.has(scene.clientId)) return { must: true, why: "first-contact" };
  return { must: false, why: null };
}
