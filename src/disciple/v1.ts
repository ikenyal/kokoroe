/**
 * Apprentice v1 — v0 plus the kokoroe-chō: the rules relevant to this client and scene type are put into the prompt.
 */
import type { KokoroeStore } from "@/src/learning/store";
import { describeRules } from "@/src/learning/describe";
import { makeClaudeDisciple } from "./v0";

export function makeDiscipleV1(store: KokoroeStore, name = "v1-kokoroe") {
  return makeClaudeDisciple(name, async (scene, client) => describeRules(await store.rulesFor(client.id, scene.type)));
}
