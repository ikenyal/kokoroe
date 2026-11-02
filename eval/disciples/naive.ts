/**
 * Deterministic "textbook" apprentice — no API calls. Used for smoke runs of the harness and as a floor.
 * Polite email to the contact, right away, our own format; meetings only when scheduling one.
 */
import type { Disciple } from "@/src/disciple/v0";

export const naiveDisciple: Disciple = {
  name: "naive-textbook",
  async propose(scene) {
    return {
      channel: "mail",
      meeting: scene.type === "T8" ? "zoom" : "none",
      formalTo: "contact",
      backchannelTo: null,
      timing: "now",
      followUp: false,
      format: scene.type === "T3" ? "own" : "not_applicable",
      posture: ["formal"],
      escalateToMaster: false,
      message: "（定型文）",
      basedOnRules: [],
    };
  },
};
