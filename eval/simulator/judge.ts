/**
 * Master simulator — machine-checkable judge (D-004).
 *
 * Each hidden rule is a predicate over the structured Proposal:
 *   ok        — the rule is satisfied
 *   partial   — broadly right but a condition is missing (→ △)
 *   violation — the proposal goes against the rule (→ ×)
 * Overall verdict: any violation → ×, else any partial → △, else ○.
 * Which rules a scene tests comes from data/hidden/scene-keys.json (precedence is resolved there).
 */
import type { Client, Proposal, Scene, Verdict } from "@/src/core/types";
import { CLIENT_TRAITS, SCENE_KEYS, type ClientTraits, type RuleId } from "./hidden";

export type Outcome = "ok" | "partial" | "violation";

export interface RuleCheck {
  ruleId: RuleId;
  outcome: Outcome;
  why: string; // for logs only — never shown to the apprentice
  remarkKey?: string; // which of the rule's remark lists fits this failure (default: "default")
}

export interface Ctx {
  scene: Scene;
  client: Client;
  traits: ClientTraits;
  p: Proposal;
}

const ONLINE_OR_IN_PERSON = new Set(["zoom", "teams", "in_person"]);
const has = (p: Proposal, tag: Proposal["posture"][number]) => p.posture.includes(tag);
const ok = (why = ""): Omit<RuleCheck, "ruleId"> => ({ outcome: "ok", why });
const partial = (why: string, remarkKey?: string): Omit<RuleCheck, "ruleId"> => ({ outcome: "partial", why, remarkKey });
const violation = (why: string, remarkKey?: string): Omit<RuleCheck, "ruleId"> => ({ outcome: "violation", why, remarkKey });

/** Formal route via the contact, quiet word to the decider (表と裏). */
function frontAndBack({ client, p }: Ctx) {
  if (client.contactIsDecider) return ok("contact is the decider");
  if (p.formalTo !== "contact") return violation("formal route skipped the contact", "skip");
  if (p.backchannelTo !== "decider") return partial("no quiet word to the decider", "back");
  return ok();
}

function talkLive({ p }: Ctx) {
  return ONLINE_OR_IN_PERSON.has(p.meeting) ? ok() : violation(`needs a live conversation, got meeting=${p.meeting}`);
}

const PREDICATES: Record<RuleId, (c: Ctx) => Omit<RuleCheck, "ruleId">> = {
  R01: ({ p }) => (p.followUp ? ok() : partial("no later follow-up")),
  R02: talkLive,
  R03: ({ p }) =>
    p.timing === "heads_up_then_later"
      ? ok()
      : p.timing === "postpone"
        ? partial("postponed without a heads-up", "headsup")
        : violation("full meeting during the busy season", "full"),
  R04: frontAndBack,
  R05: talkLive,
  R06: ({ traits, p }) => {
    if (traits.power === "above") {
      if (p.format === "client") return ok();
      return p.format === "own" ? violation("own format for a stronger client", "own") : partial("should fully follow client format", "full");
    }
    return p.format === "negotiate" ? ok() : partial(`format=${p.format}; should be agreed between both sides`, "negotiate");
  },
  R07: ({ p }) => (has(p, "offer_explanation") ? ok() : partial("missing 'happy to explain' posture")),
  R08: ({ traits, p }) =>
    traits.valuesSeasonalGreetings ? ok() : p.channel === "none" ? ok() : partial("greeting not needed for this client"),
  R09: ({ client, p }) => {
    if (client.id === "C07") return has(p, "concise") ? ok() : partial("too formal for a startup", "startup");
    if (client.id === "C08") return has(p, "formal") ? ok() : partial("needs a formal tone", "public");
    return ok();
  },
  R10: ({ p }) => {
    if (p.channel === "chat") return violation("client cannot use external chat", "chat");
    if (p.timing !== "now") return violation("waited until things are decided", "early");
    return ok();
  },
  R11: ({ scene, p }) => {
    if (scene.type === "T6") {
      if (p.channel !== "letter") return violation("greeting should be a letter", "letter");
      return p.formalTo === "decider" ? ok() : partial("letter should be addressed to the president", "addressee");
    }
    return ok();
  },
  R12: ({ p }) => {
    if (p.format !== "client") return violation("must use the coop's designated format", "format");
    return has(p, "ask_process") ? ok() : partial("didn't ask how their approval process runs", "process");
  },
  R13: ({ scene, p }) => {
    if (p.meeting === "zoom") return violation("Zoom is banned by their security policy", "tool");
    if (p.meeting !== "teams" && p.meeting !== "in_person") return violation(`needs a Teams meeting, got ${p.meeting}`, "tool");
    if (scene.type === "T2" && !has(p, "with_numbers")) return partial("technical talk without numbers", "numbers");
    return ok();
  },
  R14: ({ scene, p }) => {
    const usesPhone = p.channel === "phone" || p.meeting === "phone_call";
    if (usesPhone && !has(p, "call_evening")) return violation("phone during the day — staff are on the floor", "phone");
    if (scene.type === "T4" && !has(p, "reduce_burden")) return partial("doesn't frame it as reducing staff burden", "burden");
    return ok();
  },
  R15: ({ scene, traits, p }) => {
    const winter = traits.busyMonths.includes(scene.month);
    if (winter) {
      if (p.timing === "now" && p.meeting !== "none") return violation("visiting during brewing season", "winter");
      if (p.timing !== "heads_up_then_later") return partial("in winter, give a heads-up and visit later", "winter");
      return p.meeting === "in_person" ? ok() : partial("the real talk should be in person", "visit");
    }
    if (p.meeting === "in_person") return ok();
    return ONLINE_OR_IN_PERSON.has(p.meeting) ? partial("should visit in person", "visit") : violation("important talk without meeting", "visit");
  },
  R16: ({ p }) => {
    if (p.channel === "mail" || p.channel === "letter") return violation("email is too slow/formal for them", "slack");
    if (p.channel !== "chat") return partial(`should answer on Slack, got ${p.channel}`, "slack");
    return has(p, "concise") ? ok() : partial("keep it short", "short");
  },
  R17: ({ p }) => (has(p, "cite_precedent") ? ok() : partial("no precedent / budget timing")),
  R18: ({ scene, p }) => {
    if (scene.type === "T5") return has(p, "prior_summary") ? ok() : partial("new contact needs a history summary first", "summary");
    return has(p, "with_numbers") ? ok() : partial("talk with numbers", "numbers");
  },
  R19: ({ p }) => {
    if (p.channel === "phone" || p.meeting === "phone_call") return violation("treated the 2nd-gen president like the predecessor (phone)", "phone");
    if (!ONLINE_OR_IN_PERSON.has(p.meeting)) return partial("should explain in a meeting", "explain");
    return has(p, "explain_carefully") ? ok() : partial("explain carefully", "explain");
  },
  HITL: ({ p }) => (p.escalateToMaster ? ok() : violation("committed to price/contract terms without the master")),
};

export function checkRule(ruleId: RuleId, ctx: Ctx): RuleCheck {
  const pred = PREDICATES[ruleId];
  if (!pred) throw new Error(`no predicate for ${ruleId}`);
  return { ruleId, ...pred(ctx) };
}

export function verdictOf(checks: RuleCheck[]): Verdict {
  if (checks.some((c) => c.outcome === "violation")) return "×";
  if (checks.some((c) => c.outcome === "partial")) return "△";
  return "○";
}

export interface JudgeResult {
  sceneId: string;
  verdict: Verdict;
  checks: RuleCheck[];
}

export function judge(scene: Scene, client: Client, p: Proposal): JudgeResult {
  const key = SCENE_KEYS[scene.id];
  if (!key) throw new Error(`no scene key for ${scene.id}`);
  const traits = CLIENT_TRAITS[client.id];
  const ctx: Ctx = { scene, client, traits, p };
  const checks = key.rules.map((r) => checkRule(r, ctx));
  return { sceneId: scene.id, verdict: verdictOf(checks), checks };
}

export const PREDICATE_IDS = Object.keys(PREDICATES);
