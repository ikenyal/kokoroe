/**
 * Storage for the kokoroe-chō and the master's judgments.
 * The learning loop only talks to `KokoroeStore`, so the backing store can be swapped
 * (local JSON now; Managed Agents memory store once D-002 is settled; DynamoDB for the hosted demo).
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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

const nextId = (ids: string[], prefix: string, width: number) =>
  `${prefix}${String(Math.max(0, ...ids.map((id) => Number(id.slice(prefix.length)) || 0)) + 1).padStart(width, "0")}`;

/**
 * JSON file store. Pass `null` as the path for an in-memory store (tests, throwaway runs).
 * Every operation re-reads the file and every mutation is a synchronous read-modify-write with an atomic replace
 * (tmp + rename), so the 帳場's background work and page requests can't overwrite each other's updates in one process.
 * Ids are max + 1, so a lost write can never cause an id to be reused (HITL review, 2026-11-03).
 */
export class LocalJsonStore implements KokoroeStore {
  private mem: StoreFile = { rules: [], judgments: [] };

  constructor(private readonly file: string | null) {}

  private load(): StoreFile {
    if (!this.file) return this.mem;
    return existsSync(this.file) ? (JSON.parse(readFileSync(this.file, "utf8")) as StoreFile) : { rules: [], judgments: [] };
  }

  private mutate<T>(fn: (d: StoreFile) => T): T {
    const d = this.load();
    const out = fn(d);
    if (this.file) {
      mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
      writeFileSync(tmp, JSON.stringify(d, null, 2) + "\n");
      renameSync(tmp, this.file);
    } else this.mem = d;
    return out;
  }

  async listRules() {
    return structuredClone(this.load().rules);
  }

  async rulesFor(clientId: string, sceneType: SceneType) {
    return structuredClone(this.load().rules.filter((r) => applies(r, clientId, sceneType)));
  }

  async getRule(id: string) {
    const r = this.load().rules.find((x) => x.id === id);
    return r && structuredClone(r);
  }

  async saveRule(rule: KokoroeRule) {
    this.mutate((d) => {
      const i = d.rules.findIndex((x) => x.id === rule.id);
      const next = structuredClone(rule);
      // New 沿革 entries (not already stored) get the save time (changes_since, D-042). Matched by content, not position, so a
      // stale save can't leave a new entry unstamped. A "why" recorded later edits the last entry in place and keeps its time.
      const key = (h: KokoroeRule["history"][number]) => `${h.date}|${h.judgmentId}|${h.before}|${h.after}`;
      const stored = new Set(i >= 0 ? d.rules[i].history.map(key) : []);
      const at = new Date().toISOString();
      next.history = next.history.map((h) => (!h.at && !stored.has(key(h)) ? { ...h, at } : h));
      if (i >= 0) d.rules[i] = next;
      else d.rules.push(next);
    });
  }

  async nextRuleId() {
    return nextId(this.load().rules.map((r) => r.id), "K-", 3);
  }

  async addJudgment(j: Omit<JudgmentRecord, "id">) {
    return this.mutate((d) => {
      const rec: JudgmentRecord = { id: nextId(d.judgments.map((x) => x.id), "J-", 4), ...structuredClone(j) };
      d.judgments.push(rec);
      return structuredClone(rec);
    });
  }

  async listJudgments() {
    return structuredClone(this.load().judgments);
  }
}
