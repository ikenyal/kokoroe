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
