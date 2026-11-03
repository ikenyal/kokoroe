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
import { LocalJsonStore, type KokoroeStore } from "@/src/learning/store";
import { createSeededStore, MemoryStoreKokoroe } from "@/src/learning/memory-store";
import { getClaude } from "@/src/lib/claude";
import type { Candidate, JudgmentRecord, KokoroeRule } from "@/src/learning/types";

export type Mode = "demo" | "trial" | "field"; // field = 師匠役テスト (the author as the master, timings recorded)
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
  status:
    | "queued"
    | "interpreting"
    | "needs-choice"
    | "choosing"
    | "needs-why"
    | "verifying" // 確かめ稽古 / regression running in the background
    | "needs-confirm" // the master checks the re-solved corrected scene (確かめ稽古)
    | "needs-regression" // the master checks a past ○ scene whose decision changed
    | "applied" // written (and verified, when verification ran)
    | "rolled-back" // 差し戻し
    | "withdrawn" // 取り下げ: the rule did not take in 確かめ稽古 (D-045)
    | "nothing-learned"
    | "offline"
    | "error";
  verify?: UiVerification;
  pick?: number | null; // the master's tap while status is "choosing" (null = none of these)
  candidates?: Candidate[];
  round?: 1 | 2;
  ruleId?: string;
  note?: string;
  exclude?: string; // D-045: a follow-up correction from 確かめ稽古 may not rewrite this rule (the one just written)
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

/** 師匠役テスト: how long each master action took (ms). Content stays in the store; this is timing only. */
export interface Timing {
  kind: "judge" | "check" | "remark" | "choose" | "why" | "write"; // check = 確かめ稽古 / regression tap
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

/** 確かめ稽古 + regression in the UI (D-028 → D-037): the same steps as the evaluation loop, one master tap at a time. */
export interface UiVerification {
  change: { ruleId: string; action: "add" | "revise" };
  snapshot?: KokoroeRule; // the rule before a revise
  confirm?: { proposal: Proposal }; // re-solved corrected scene, waiting for the master
  fixedSet: { sceneId: string; pastJudgmentId: string }[]; // past ○ scenes, fixed before any check
  remaining: { sceneId: string; pastJudgmentId: string }[];
  current?: { sceneId: string; pastJudgmentId: string; proposal: Proposal }; // waiting for the master
  narrowed: boolean;
  retried?: boolean; // D-045: the rule did not take in 確かめ稽古 and was re-read once
  remainder?: string; // D-045: a confirm judgment to learn as its own correction once this rule's checks are done
  checked: number;
  asked: number;
}

export interface SessionMeta {
  paused?: boolean; // 帳場 「ここで区切る」: the queue stops here; the kokoroe-chō so far stays usable; 「続きから」 resumes
  mode: Mode;
  limit?: "session" | "ip" | "daily"; // set when a live call was refused; the UI says so and falls back to recorded data
  timings?: Timing[];
  writes?: FieldWrite[];
  answers?: SuccessorTurn[]; // 暖簾を継ぐ — newest first
  createdAt: string;
  queue: QueueItem[];
  pos: number; // next queue index
  pending: Pending[];
  memoryStoreId?: string; // KOKOROE_STORE=memory: this session's kokoroe-chō lives in a Managed Agents memory store (D-002)
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

/** D-002 candidate: KOKOROE_STORE=memory keeps each session's kokoroe-chō in a memory store (needs a key). Default: local JSON. */
export const memoryStoreEnabled = () => process.env.KOKOROE_STORE === "memory" && !!process.env.ANTHROPIC_API_KEY;

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
    if (!(stale || (previousSid && f.includes(previousSid)))) continue;
    if (f.endsWith(".meta.json")) deleteMemoryStore(full);
    rmSync(full, { force: true });
  }
}

/** Best effort: a swept session's memory store goes with it (KOKOROE_STORE=memory). Failures only log. */
function deleteMemoryStore(metaFile: string) {
  try {
    const id = (JSON.parse(readFileSync(metaFile, "utf8")) as SessionMeta).memoryStoreId;
    if (id) getClaude().beta.memoryStores.delete(id).catch((e) => console.error("memory store cleanup failed", id, e?.status));
  } catch {}
}

/**
 * Demo-video recording only (video/shoot.ts, local): KOKOROE_VIDEO_QUEUE="T05,T13" makes お試し start with just those scenes, in
 * that order, so the video can show △ on T05 and the changed draft on the next similar scene (T13). Never set in public.
 */
function videoQueue(mode: Mode, queue: Snapshot["queue"]): Snapshot["queue"] {
  const ids = process.env.KOKOROE_VIDEO_QUEUE?.split(",").map((x) => x.trim()).filter(Boolean);
  if (mode !== "trial" || !ids?.length) return queue;
  return ids.map((id) => queue.find((q) => q.scene.id === id)).filter((q): q is Snapshot["queue"][number] => !!q);
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
  const meta: SessionMeta = { mode, createdAt: new Date().toISOString(), queue: videoQueue(mode, snap.queue), pos: 0, pending: [] };
  if (memoryStoreEnabled()) meta.memoryStoreId = await createSeededStore(`kokoroe-${mode}-${sid.slice(0, 8)}`, snap.store);
  writeFileSync(f.meta, JSON.stringify(meta, null, 2));
  const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 };
  jar.set("kokoroe_sid", sid, opts);
  jar.set("kokoroe_mode", mode, opts);
}

export interface Session {
  sid: string;
  mode: Mode;
  store: KokoroeStore;
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
    store: meta.memoryStoreId ? new MemoryStoreKokoroe(meta.memoryStoreId) : new LocalJsonStore(f.store),
    meta,
    saveMeta: (m) => writeFileSync(f.meta, JSON.stringify(m, null, 2)),
  };
}

/** Re-read meta from disk (background work may have changed it). */
export function readMeta(mode: Mode, sid: string): SessionMeta {
  return JSON.parse(readFileSync(files(mode, sid).meta, "utf8")) as SessionMeta;
}
