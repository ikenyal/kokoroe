/**
 * The only view of the kokoroe-chō the MCP server gets: rules, read only.
 * It has no write methods and does not expose judgments (draft proposals) at all. The file is re-read on every call so the
 * server always answers with the living kokoroe-chō, and it is only ever opened for reading.
 */
import { readFileSync } from "node:fs";
import type { KokoroeRule } from "@/src/learning/types";

export interface ReadonlyKokoroeStore {
  listRules(): Promise<readonly Readonly<KokoroeRule>[]>;
  getRule(id: string): Promise<Readonly<KokoroeRule> | undefined>;
}

export class ReadonlyJsonStore implements ReadonlyKokoroeStore {
  constructor(private readonly file: string) {}

  private rules(): KokoroeRule[] {
    const data = JSON.parse(readFileSync(this.file, { encoding: "utf8", flag: "r" })) as { rules?: KokoroeRule[] };
    return Object.freeze(data.rules ?? []) as KokoroeRule[];
  }

  async listRules() {
    return this.rules();
  }

  async getRule(id: string) {
    return this.rules().find((r) => r.id === id);
  }
}
