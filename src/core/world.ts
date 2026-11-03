import company from "@/data/world/company.json";
import clients from "@/data/world/clients.json";
import evalScenes from "@/data/scenes/eval.json";
import historyQuestions from "@/data/scenes/history-questions.json";
import trainScenes from "@/data/scenes/train.json";
import type { Client, Company, HistoryQuestion, Scene } from "./types";

import { loadOwnWorld, ownEnabled } from "./own-world";

/**
 * Public world data: everything here may be shown to the apprentice. (Hidden data is read only by the evaluation simulator, never here.)
 * With KOKOROE_OWN=1 (local only, src/core/own-world.ts) the process uses your own company and client ledger instead; without it
 * — the evaluation, the public version — these are the fictional だいだい工房 and its 10 clients, exactly as before.
 */
export const COMPANY: Company = ownEnabled() ? { ...loadOwnWorld().company } : (company as Company);
export const CLIENTS: Client[] = ownEnabled() ? [...loadOwnWorld().clients] : (clients as Client[]);

/** Own mode: after the ledger or company was saved, refresh in place (prompts and pages read these objects at call time). */
export function reloadOwnWorld() {
  if (!ownEnabled()) return;
  const w = loadOwnWorld();
  Object.assign(COMPANY, w.company);
  CLIENTS.splice(0, CLIENTS.length, ...w.clients);
}
export const EVAL_SCENES = evalScenes as Scene[];
export const TRAIN_SCENES = trainScenes as Scene[];
export const HISTORY_QUESTIONS = historyQuestions as HistoryQuestion[];

export function getClient(id: string): Client {
  const c = CLIENTS.find((x) => x.id === id);
  if (!c) throw new Error(`unknown client ${id}`);
  return c;
}

