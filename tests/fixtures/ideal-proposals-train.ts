/**
 * Hand-written proposals that follow the hidden kokoroe for the 40 train scenes — the simulator must answer ○ for each.
 * Test-only. Doubles as documentation of what "right" looks like per train scene.
 */
import type { Proposal } from "@/src/core/types";
import { makeProposal as p } from "./ideal-proposals";

export const IDEAL_TRAIN: Record<string, Proposal> = {
  T01: p({ channel: "mail", timing: "now", followUp: true }),
  T02: p({ channel: "chat", followUp: true, posture: ["concise"] }),
  T03: p({ meeting: "zoom", posture: ["explain_carefully"] }),
  T04: p({ posture: ["offer_explanation"] }),
  T05: p({ meeting: "in_person", backchannelTo: "decider" }),
  T06: p({ meeting: "zoom", posture: ["with_numbers"] }),
  T07: p({ channel: "none" }),
  T08: p({ channel: "mail", followUp: true }),
  T09: p({ meeting: "zoom", timing: "heads_up_then_later", format: "negotiate" }),
  T10: p({ backchannelTo: "decider", posture: ["formal", "modest"] }),
  T11: p({ meeting: "teams", format: "negotiate" }),
  T12: p({ meeting: "zoom", posture: ["explain_carefully"] }),
  T13: p({ meeting: "in_person", backchannelTo: "decider" }),
  T14: p({ channel: "chat", escalateToMaster: true, posture: ["concise"] }),
  T15: p({ channel: "mail", timing: "now", followUp: true }),
  T16: p({ channel: "none" }),
  T17: p({ meeting: "zoom" }),
  T18: p({ channel: "mail", escalateToMaster: true }),
  T19: p({ channel: "letter", formalTo: "decider" }),
  T20: p({ followUp: true, posture: ["formal"] }),
  T21: p({ meeting: "zoom", format: "client", posture: ["ask_process"] }),
  T22: p({ meeting: "in_person", timing: "heads_up_then_later", followUp: true }),
  T23: p({ posture: ["prior_summary", "offer_explanation"] }),
  T24: p({ channel: "mail", followUp: true }),
  T25: p({ meeting: "teams" }),
  T26: p({ channel: "mail", timing: "now" }),
  T27: p({ meeting: "in_person", posture: ["explain_carefully"] }),
  T28: p({ channel: "none" }),
  T29: p({ escalateToMaster: true, format: "client", posture: ["formal", "cite_precedent"] }),
  T30: p({ posture: ["offer_explanation"] }),
  T31: p({ backchannelTo: "decider", format: "client", posture: ["ask_process", "modest"] }),
  T32: p({ backchannelTo: "decider", posture: ["with_numbers"] }),
  T33: p({ meeting: "in_person", timing: "heads_up_then_later", backchannelTo: "decider" }),
  T34: p({ meeting: "teams", followUp: true }),
  T35: p({ backchannelTo: "decider", posture: ["modest"] }),
  T36: p({ backchannelTo: "decider" }),
  T37: p({ meeting: "in_person", posture: ["explain_carefully"] }),
  T38: p({ channel: "chat", posture: ["concise"] }),
  T39: p({ backchannelTo: "decider", posture: ["formal", "cite_precedent", "modest"] }),
  T40: p({ channel: "phone", posture: ["call_evening"] }),
};
