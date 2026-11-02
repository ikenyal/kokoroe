/**
 * Storage for the kokoroe-chō and the master's judgments.
 * The learning loop only talks to `KokoroeStore`, so the backing store can be swapped
 * (local JSON now; Managed Agents memory store once D-002 is settled; DynamoDB for the hosted demo).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SceneType } from "@/src/core/types";
import type { JudgmentRecord, KokoroeRule } from "./types";

export interface KokoroeStore {
  listRules(): Promise<KokoroeRule[]>;
  /** Active rules that apply to this client and scene type (client-specific and company-wide). */
  rulesFor(clientId: string, sceneType: SceneType): Promise<KokoroeRule[]>;
  getRule(id: string): Promise<KokoroeRule | undefined>;
  saveRule(rule: KokoroeRule): Promise<void>;
  nextRuleId(): Promise<string>;
  addJudgment(j: Omit<JudgmentRecord, "id">): Promise<JudgmentRecord>;
  listJudgments(): Promise<JudgmentRecord[]>;
}

export function applies(rule: KokoroeRule, clientId: string, sceneType: SceneType): boolean {
  if (rule.status !== "active") return false;
  if (rule.scope.clientId !== null && rule.scope.clientId !== clientId) return false;
  if (rule.scope.sceneTypes !== null && !rule.scope.sceneTypes.includes(sceneType)) return false;
  return true;
}

interface StoreFile {
  rules: KokoroeRule[];
  judgments: JudgmentRecord[];
}

/** JSON file store. Pass `null` as the path for an in-memory store (tests, throwaway runs). */
export class LocalJsonStore implements KokoroeStore {
  private data: StoreFile;

  constructor(private readonly file: string | null) {
    this.data =
      file && existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as StoreFile) : { rules: [], judgments: [] };
  }

  private persist(): void {
    if (!this.file) return;
    mkdirSync(path.dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(this.data, null, 2) + "\n");
  }

  async listRules() {
    return structuredClone(this.data.rules);
  }

  async rulesFor(clientId: string, sceneType: SceneType) {
    return structuredClone(this.data.rules.filter((r) => applies(r, clientId, sceneType)));
  }

  async getRule(id: string) {
    const r = this.data.rules.find((x) => x.id === id);
    return r && structuredClone(r);
  }

  async saveRule(rule: KokoroeRule) {
    const i = this.data.rules.findIndex((x) => x.id === rule.id);
    if (i >= 0) this.data.rules[i] = structuredClone(rule);
    else this.data.rules.push(structuredClone(rule));
    this.persist();
  }

  async nextRuleId() {
    return `K-${String(this.data.rules.length + 1).padStart(3, "0")}`;
  }

  async addJudgment(j: Omit<JudgmentRecord, "id">) {
    const rec: JudgmentRecord = { id: `J-${String(this.data.judgments.length + 1).padStart(4, "0")}`, ...structuredClone(j) };
    this.data.judgments.push(rec);
    this.persist();
    return structuredClone(rec);
  }

  async listJudgments() {
    return structuredClone(this.data.judgments);
  }
}
