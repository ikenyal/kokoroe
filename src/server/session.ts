/**
 * Demo sessions (server-only). Two modes:
 *   demo  — デモの続き: starts from a fixed snapshot (a real training run stopped part-way), for recording. Reset any time.
 *   trial — お試し: starts from the ledger only; the kokoroe-chō grows as you judge. Per-session, initialized on start.
 * Each session is a copy in its own JSON file (the KokoroeStore adapter), so visitors never touch each other's data.
 * Only fictional data (だいだい工房). Nothing about a session is logged.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import type { Proposal, Scene } from "@/src/core/types";
import { LocalJsonStore } from "@/src/learning/store";
import type { Candidate, JudgmentRecord, KokoroeRule } from "@/src/learning/types";

export type Mode = "demo" | "trial" | "field"; // field = 実地テスト (the author as the master, timings recorded)
export const MODES: Mode[] = ["demo", "trial", "field"];

export interface QueueItem {
  scene: Scene;
  draft: Proposal; // recorded draft (fixed data) — regenerated live only when KOKOROE_LIVE=1
  live?: boolean; // the draft was made live with the session's current kokoroe-chō
}

/** Background work after a △/× (interpretation → maybe a choice → kokoroe-chō update). */
export interface Pending {
  judgmentId: string;
  sceneId: string;
  status: "queued" | "interpreting" | "needs-choice" | "choosing" | "needs-why" | "applied" | "nothing-learned" | "offline" | "error";
  pick?: number | null; // the master's tap while status is "choosing" (null = none of these)
  candidates?: Candidate[];
  round?: 1 | 2;
  ruleId?: string;
  note?: string;
}

export interface SuccessorTurn {
  at: string;
  clientId: string;
  question: string;
  answer: "yes" | "no" | "unknown";
  explanation: string;
  citations: { ruleId: string; history: string }[];
  source: "live" | "recorded";
}

/** 実地テスト: how long each master action took (ms). Content stays in the store; this is timing only. */
export interface Timing {
  kind: "judge" | "remark" | "choose" | "why" | "write";
  sceneId: string;
  ms: number;
  chars?: number; // remark / why / write length
  verdict?: string;
}

export interface FieldWrite {
  sceneId: string;
  text: string;
  ms: number;
}

export interface SessionMeta {
  mode: Mode;
  timings?: Timing[];
  writes?: FieldWrite[];
  answers?: SuccessorTurn[]; // 暖簾を継ぐ — newest first
  createdAt: string;
  queue: QueueItem[];
  pos: number; // next queue index
  pending: Pending[];
}

export interface Snapshot {
  note: string;
  store: { rules: KokoroeRule[]; judgments: JudgmentRecord[] };
  queue: QueueItem[];
}

const DATA_DIR = process.env.KOKOROE_DATA_DIR ?? path.join(process.cwd(), ".data");
const SNAPSHOTS: Record<Mode, string> = {
  demo: path.join(process.cwd(), "data", "demo", "demo-snapshot.json"),
  trial: path.join(process.cwd(), "data", "demo", "trial-snapshot.json"),
  field: path.join(process.cwd(), "data", "demo", "field-snapshot.json"),
};
const SID = /^[0-9a-f-]{36}$/;

export const liveEnabled = () => process.env.KOKOROE_LIVE === "1" && !!process.env.ANTHROPIC_API_KEY;

const files = (mode: Mode, sid: string) => {
  const base = path.join(DATA_DIR, "sessions", `${mode}-${sid}`);
  return { store: `${base}.store.json`, meta: `${base}.meta.json` };
};

const RETAIN_MS = 24 * 3600_000;

/** Delete session files older than 24 h, and (if given) this visitor's previous session. */
function sweep(previousSid?: string) {
  const dir = path.join(DATA_DIR, "sessions");
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const full = path.join(dir, f);
    const stale = Date.now() - statSync(full).mtimeMs > RETAIN_MS;
    if (stale || (previousSid && f.includes(previousSid))) rmSync(full, { force: true });
  }
}

/** Create (or reset) a session from its snapshot. Called from a Server Action, which may set cookies. */
export async function startSession(mode: Mode): Promise<void> {
  const jar = await cookies();
  const prev = jar.get("kokoroe_sid")?.value;
  sweep(prev && SID.test(prev) ? prev : undefined);
  const sid = randomUUID();
  const snap = JSON.parse(readFileSync(SNAPSHOTS[mode], "utf8")) as Snapshot;
  const f = files(mode, sid);
  mkdirSync(path.dirname(f.store), { recursive: true });
  writeFileSync(f.store, JSON.stringify(snap.store, null, 2));
  const meta: SessionMeta = { mode, createdAt: new Date().toISOString(), queue: snap.queue, pos: 0, pending: [] };
  writeFileSync(f.meta, JSON.stringify(meta, null, 2));
  const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 };
  jar.set("kokoroe_sid", sid, opts);
  jar.set("kokoroe_mode", mode, opts);
}

export interface Session {
  sid: string;
  mode: Mode;
  store: LocalJsonStore;
  meta: SessionMeta;
  saveMeta(m: SessionMeta): void;
}

/** The current visitor's session, or null if they haven't started one (or it expired). */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const sid = jar.get("kokoroe_sid")?.value;
  const mode = jar.get("kokoroe_mode")?.value as Mode | undefined;
  if (!sid || !SID.test(sid) || !MODES.includes(mode as Mode)) return null;
  return openSession(mode as Mode, sid);
}

export function openSession(mode: Mode, sid: string): Session | null {
  const f = files(mode, sid);
  if (!existsSync(f.meta) || !existsSync(f.store)) return null;
  const meta = JSON.parse(readFileSync(f.meta, "utf8")) as SessionMeta;
  return {
    sid,
    mode,
    store: new LocalJsonStore(f.store),
    meta,
    saveMeta: (m) => writeFileSync(f.meta, JSON.stringify(m, null, 2)),
  };
}

/** Re-read meta from disk (background work may have changed it). */
export function readMeta(mode: Mode, sid: string): SessionMeta {
  return JSON.parse(readFileSync(files(mode, sid).meta, "utf8")) as SessionMeta;
}
