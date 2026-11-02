/**
 * Apprentice v0 — the "average" apprentice: knows the client ledger incl. explicit constraints (D-009), no kokoroe-chō yet.
 * This is the Before of the Before/After. It must never see the simulator's hidden ground truth (D-005).
 */
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { COMPANY } from "@/src/core/world";
import { SCENE_TYPE_LABELS, type Client, type Proposal, type Scene } from "@/src/core/types";
import { getClaude, MODELS } from "@/src/lib/claude";
import { ProposalSchema } from "./schema";

export interface Usage {
  model: string;
  input_tokens: number;
  output_tokens: number;
}

export interface Disciple {
  name: string;
  propose(scene: Scene, client: Client): Promise<Proposal>;
  /** Token usage of every API call made so far (absent for no-API disciples). */
  usage?: Usage[];
}

const SYSTEM = `You are ${COMPANY.apprentice.name}, an apprentice salesperson at ${COMPANY.name} (${COMPANY.description})
Your master is ${COMPANY.master.name} (${COMPANY.master.role}).

For each situation, propose how to handle the client: channel, whether to hold a live conversation, who receives the
official message, whether to also have a quiet word with someone else, timing, follow-up, document format, tone, and a
draft message in Japanese. Fill every field of the output schema.

You never send anything yourself; the master reviews every proposal. If the situation involves deciding prices,
discounts or contract terms, set escalateToMaster to true.
Use only the information given. Act as a sensible, well-mannered Japanese business person would.`;

function clientCard(c: Client): string {
  return [
    `取引先: ${c.name}（${c.id}）`,
    `業界: ${c.industry}`,
    `取引年数: ${c.relationshipYears}年`,
    `窓口: ${c.contact}`,
    `決裁者: ${c.decider}${c.contactIsDecider ? "（窓口と同じ）" : ""}`,
    `先方の制約: ${c.constraints}`,
  ].join("\n");
}

export function buildUserPrompt(scene: Scene, client: Client): string {
  return `${clientCard(client)}

場面の種類: ${SCENE_TYPE_LABELS[scene.type]}
時期: ${scene.month}月
状況: ${scene.situation}`;
}

const v0Usage: Usage[] = [];

export const discipleV0: Disciple = {
  name: "v0-ledger",
  usage: v0Usage,
  async propose(scene, client) {
    const res = await getClaude().messages.parse({
      model: MODELS.disciple,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: buildUserPrompt(scene, client) }],
      output_config: { effort: "low", format: zodOutputFormat(ProposalSchema) },
    });
    v0Usage.push({ model: res.model, input_tokens: res.usage.input_tokens, output_tokens: res.usage.output_tokens });
    if (res.stop_reason === "refusal") throw new Error(`refusal on ${scene.id}`);
    if (!res.parsed_output) throw new Error(`unparseable proposal on ${scene.id} (stop_reason=${res.stop_reason})`);
    return res.parsed_output;
  },
};
