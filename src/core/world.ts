import company from "@/data/world/company.json";
import clients from "@/data/world/clients.json";
import evalScenes from "@/data/scenes/eval.json";
import historyQuestions from "@/data/scenes/history-questions.json";
import type { Client, Company, HistoryQuestion, Scene } from "./types";

/** Public world data: everything here may be shown to the apprentice. (Hidden data lives in eval/simulator only.) */
export const COMPANY = company as Company;
export const CLIENTS = clients as Client[];
export const EVAL_SCENES = evalScenes as Scene[];
export const HISTORY_QUESTIONS = historyQuestions as HistoryQuestion[];

export function getClient(id: string): Client {
  const c = CLIENTS.find((x) => x.id === id);
  if (!c) throw new Error(`unknown client ${id}`);
  return c;
}
