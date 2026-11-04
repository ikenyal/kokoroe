import { z } from "zod";
import { POSTURE_TAGS } from "@/src/core/types";

/** Structured output the apprentice must return. Mirrors `Proposal` in src/core/types.ts. */
export const ProposalSchema = z.object({
  channel: z
    .enum(["mail", "chat", "phone", "letter", "none"])
    .describe("How the message itself is sent. 'none' = do not contact."),
  meeting: z
    .enum(["none", "zoom", "teams", "in_person", "phone_call"])
    .describe("If a live conversation is held, with what. 'none' = no conversation."),
  formalTo: z.enum(["contact", "decider"]).describe("Who receives the official message."),
  backchannelTo: z
    .enum(["contact", "decider"])
    .nullable()
    .describe("Optional quiet, informal word to someone else on the client side. null if none."),
  timing: z
    .enum(["now", "postpone", "heads_up_then_later"])
    .describe("When to act. heads_up_then_later = brief heads-up now, full discussion later."),
  followUp: z.boolean().describe("Plan a later courtesy follow-up (call/visit) after this contact."),
  format: z
    .enum(["client", "own", "negotiate", "not_applicable"])
    .describe("For quotes/invoices: the client's format, our own, or agree on one together."),
  posture: z.array(z.enum(POSTURE_TAGS)).describe("Tone and stance tags that apply."),
  escalateToMaster: z
    .boolean()
    .describe("True if the master must decide before anything is sent (e.g. price or contract terms)."),
  message: z.string().describe("Draft message in Japanese, as it would be sent."),
  basedOnRules: z.array(z.string()).describe("IDs of kokoroe-chō rules relied on (empty if none)."),
});

export type ProposalOutput = z.infer<typeof ProposalSchema>;

/**
 * 訪問の段取り (D-061). A separate, second call made only when visits are on (the app) and the decided 段取り visits. The first
 * call — the 段取り — always uses ProposalSchema exactly as above, so it is the evaluation's request (tests/visit.test.ts).
 */
export const VisitSchema = z.object({
  attire: z.string().describe("服装: what to wear for this client (e.g. whether a suit suits them). Short Japanese."),
  gift: z.string().describe("手土産: what to bring, or that nothing should be brought. Short Japanese."),
  checkFirst: z.string().describe("事前に確かめておく話題: what to check or prepare before going. Short Japanese."),
  attendees: z.string().describe("同席者: who goes from our side. Short Japanese."),
  address: z.string().describe("呼び方: how to address the people met (title, name, 先代/当代 etc.). Short Japanese."),
});

export const VisitPlanOutputSchema = VisitSchema.extend({
  basedOnRules: z.array(z.string()).describe("IDs of the kokoroe-chō rules this visit plan follows. Empty if none."),
});
