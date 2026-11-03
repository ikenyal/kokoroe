/**
 * 自分の会社で始める (Kento 11/4): run Kokoroe on your own client ledger instead of the fictional company — locally only.
 *   KOKOROE_OWN=1 (+ KOKOROE_LIVE=1 and an API key) — the whole server process switches to your own world; the fictional
 *   demo/trial/master-role modes are not offered in that process. Never set in the public version (a test checks the deploy files).
 *   KOKOROE_OWN_DIR — where everything is kept (default ~/.kokoroe). Must be outside the repository and not the home folder itself.
 * Files there: company.json, clients.json, sessions/ (the 心得帳 and judgments), and a marker file that "delete everything" checks
 * before removing the folder. Nothing of it is ever committed: it lives outside the repo.
 * No Next.js imports here (src/core is shared with the evaluation, which never sets KOKOROE_OWN).
 */
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { Client, Company } from "./types";

export const ownEnabled = () => process.env.KOKOROE_OWN === "1";

const MARKER = ".kokoroe-own";
const KNOWN = ["company.json", "clients.json", "sessions", MARKER];

/** The real path of the nearest existing ancestor (symlinks resolved), with the rest appended. */
function realish(p: string): string {
  let head = path.resolve(p);
  const tail: string[] = [];
  while (!existsSync(head) && path.dirname(head) !== head) {
    tail.unshift(path.basename(head));
    head = path.dirname(head);
  }
  return path.join(realpathSync(head), ...tail);
}
const norm = (p: string) => (process.platform === "darwin" || process.platform === "win32" ? p.toLowerCase() : p);
const within = (child: string, parent: string) => child === parent || child.startsWith(parent.endsWith(path.sep) ? parent : parent + path.sep);

/**
 * The data folder, checked (hitl-reviewer 11/4): real paths (symlinks resolved, case-insensitive on macOS), outside the repository,
 * not containing the repository or the home folder, not the home folder or a root. A folder of its own, in short.
 */
export function ownDir(): string {
  const dir = path.resolve(process.env.KOKOROE_OWN_DIR ?? path.join(homedir(), ".kokoroe"));
  const real = norm(realish(dir));
  const repo = norm(realish(process.cwd()));
  const home = norm(realish(homedir()));
  if (within(real, repo)) throw new Error(`KOKOROE_OWN_DIR must be outside the repository (${dir})`);
  if (within(repo, real) || within(home, real) || real === norm(path.parse(real).root)) throw new Error(`KOKOROE_OWN_DIR must be a folder of its own (${dir})`);
  return dir;
}

const file = (name: string) => path.join(ownDir(), name);

/**
 * Create the folder for this mode. The marker (which 「全部消す」 checks) is written only when this mode creates the folder or finds
 * it empty — never into a folder that already holds other things.
 */
export function ensureOwnDir() {
  const dir = ownDir();
  if (existsSync(dir) && lstatSync(dir).isSymbolicLink()) throw new Error(`KOKOROE_OWN_DIR must not be a symbolic link (${dir})`);
  const fresh = !existsSync(dir) || readdirSync(dir).length === 0;
  mkdirSync(dir, { recursive: true });
  if (fresh) writeFileSync(file(MARKER), "Kokoroe 自分の会社モードのデータ。ココロエの画面の「全部消す」は、この印があるフォルダの、このモードのファイルだけを消します。\n");
  if (!existsSync(file(MARKER))) throw new Error(`${dir} already holds other files; choose an empty folder for KOKOROE_OWN_DIR`);
}

export const DEFAULT_COMPANY: Company = {
  name: "自分の会社",
  description: "取引先ごとの付き合い方を大事にしてきた会社",
  master: { name: "師匠", role: "取引先との付き合いを担ってきた人" },
  successor: { name: "後任", role: "引き継ぐ人" },
  apprentice: { name: "橙丸（だいだいまる）" },
};

export function loadOwnWorld(): { company: Company; clients: Client[] } {
  const company = existsSync(file("company.json")) ? { ...DEFAULT_COMPANY, ...(JSON.parse(readFileSync(file("company.json"), "utf8")) as Partial<Company>) } : DEFAULT_COMPANY;
  const clients = existsSync(file("clients.json")) ? (JSON.parse(readFileSync(file("clients.json"), "utf8")) as Client[]) : [];
  return { company: company as Company, clients };
}

export function saveOwnCompany(c: Pick<Company, "name"> & { masterName: string; successorName: string }) {
  ensureOwnDir();
  const company = { ...DEFAULT_COMPANY, name: c.name, master: { ...DEFAULT_COMPANY.master, name: c.masterName }, successor: { ...DEFAULT_COMPANY.successor, name: c.successorName } };
  writeFileSync(file("company.json"), JSON.stringify(company, null, 2));
}

export function saveOwnClients(clients: Client[]) {
  ensureOwnDir();
  writeFileSync(file("clients.json"), JSON.stringify(clients, null, 2));
}

/**
 * Delete everything of the own mode: only in a folder that carries the marker, only the files this mode writes (company, ledger,
 * sessions, the marker), then the folder itself if that left it empty. Never a recursive delete of the folder.
 */
export function deleteOwnData(): "deleted" | "nothing" | "refused" {
  const dir = ownDir();
  if (!existsSync(dir)) return "nothing";
  if (lstatSync(dir).isSymbolicLink() || !existsSync(path.join(dir, MARKER))) return "refused";
  for (const name of KNOWN) rmSync(path.join(dir, name), { recursive: name === "sessions", force: true });
  if (readdirSync(dir).length === 0) rmdirSync(dir);
  return "deleted";
}

/** One client row from the form or a CSV line. */
export interface ClientRow {
  id?: string; // the form's hidden id (keeps a row's client id stable)
  name: string;
  industry: string;
  contact: string;
  decider: string;
  constraints: string;
  busyMonths: string; // "2,3" or "2・3月"
  years: string;
}

/**
 * Rows → clients with stable ids (hitl-reviewer 11/4): a row keeps its id (form: hidden input; CSV: matched by name), new rows get
 * max + 1, an id is never reused. Clients that the 心得帳 or a judgment refers to are never dropped, even if their row was cleared
 * (they are kept as they were), so a rule can never move to another client. Duplicate names are refused.
 */
export function toClients(rows: ClientRow[], existing: Client[] = [], referenced: ReadonlySet<string> = new Set()): { clients: Client[]; kept: string[] } {
  const named = rows.filter((r) => r.name.trim()).slice(0, 50);
  const names = named.map((r) => r.name.trim());
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) throw new Error(`取引先名が重複しています：${dup}`);
  let next = Math.max(0, ...existing.map((c) => Number(c.id.slice(1)) || 0));
  const out: Client[] = named.map((r) => {
    const prev = existing.find((c) => c.id === r.id) ?? existing.find((c) => c.name === r.name.trim());
    const id = prev?.id ?? `O${String(++next).padStart(2, "0")}`;
    const contact = r.contact.trim() || "窓口";
    const decider = r.decider.trim() || contact;
    return {
      id,
      name: r.name.trim().slice(0, 40),
      slug: `own-${id.slice(1)}`,
      industry: r.industry.trim().slice(0, 40) || "—",
      relationshipYears: Math.max(0, Math.min(100, Math.round(Number(r.years)) || 0)),
      contact: contact.slice(0, 40),
      decider: decider.slice(0, 40),
      contactIsDecider: contact === decider,
      constraints: r.constraints.trim().slice(0, 300),
      busyMonths: [...new Set((r.busyMonths.match(/\d{1,2}/g) ?? []).map(Number).filter((m) => m >= 1 && m <= 12))],
    };
  });
  const kept = existing.filter((c) => referenced.has(c.id) && !out.some((x) => x.id === c.id));
  return { clients: [...out, ...kept], kept: kept.map((c) => c.name) };
}

/**
 * CSV: a header line, then one client per line. Columns (by header name, any order):
 * 取引先名, 業界, 窓口, 決裁者, 制約, 繁忙月, 取引年数. Quoted fields with commas are allowed.
 */
export function parseClientsCsv(text: string): ClientRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const cells = (line: string) => {
    const out: string[] = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };
  const head = cells(lines[0]);
  const col = (names: string[]) => head.findIndex((h) => names.includes(h));
  const ix = {
    name: col(["取引先名", "取引先", "名前", "name"]), industry: col(["業界", "industry"]), contact: col(["窓口", "contact"]),
    decider: col(["決裁者", "決裁", "decider"]), constraints: col(["制約", "constraints"]), busyMonths: col(["繁忙月", "busy"]),
    years: col(["取引年数", "years"]),
  };
  return lines.slice(1).map((l) => {
    const c = cells(l);
    const get = (i: number) => (i >= 0 ? c[i] ?? "" : "");
    return { name: get(ix.name), industry: get(ix.industry), contact: get(ix.contact), decider: get(ix.decider), constraints: get(ix.constraints), busyMonths: get(ix.busyMonths), years: get(ix.years) };
  });
}
