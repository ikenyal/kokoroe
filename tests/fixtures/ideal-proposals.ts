/**
 * Hand-written proposals that follow the hidden kokoroe — the simulator must answer ○ for each.
 * Test-only. Doubles as documentation of what "right" looks like per eval scene.
 */
import type { Proposal } from "@/src/core/types";

const base: Proposal = {
  channel: "mail",
  meeting: "none",
  formalTo: "contact",
  backchannelTo: null,
  timing: "now",
  followUp: false,
  format: "not_applicable",
  posture: [],
  escalateToMaster: false,
  message: "",
  basedOnRules: [],
};
const p = (o: Partial<Proposal>): Proposal => ({ ...base, ...o });

export const IDEAL: Record<string, Proposal> = {
  E01: p({ channel: "mail", timing: "now", followUp: true }),
  E02: p({ channel: "letter", formalTo: "decider" }),
  E03: p({ meeting: "zoom", format: "client", posture: ["ask_process"] }),
  E04: p({ meeting: "teams" }),
  E05: p({ channel: "phone", posture: ["call_evening", "reduce_burden"] }),
  E06: p({ channel: "phone", meeting: "in_person", timing: "heads_up_then_later", backchannelTo: "decider", format: "negotiate" }),
  E07: p({ channel: "chat", followUp: true, posture: ["concise"] }),
  E08: p({ backchannelTo: "decider", posture: ["cite_precedent", "formal"] }),
  E09: p({ posture: ["prior_summary", "offer_explanation"] }),
  E10: p({ meeting: "in_person", posture: ["explain_carefully"] }),
  E11: p({ meeting: "zoom" }),
  E12: p({ timing: "heads_up_then_later" }),
  E13: p({ backchannelTo: "decider", format: "client", posture: ["ask_process", "modest"] }),
  E14: p({ meeting: "teams", posture: ["with_numbers"] }),
  E15: p({ channel: "mail", followUp: true }),
  E16: p({ meeting: "in_person", backchannelTo: "decider" }),
  E17: p({ channel: "chat", format: "negotiate", posture: ["concise"] }),
  E18: p({ posture: ["offer_explanation", "formal", "cite_precedent"] }),
  E19: p({ meeting: "zoom", escalateToMaster: true, posture: ["with_numbers"] }),
  E20: p({ meeting: "zoom", followUp: true, posture: ["explain_carefully"] }),
};

export { p as makeProposal };
