/**
 * 先読み (Kento 11/5, after 体験の目 measured a 5–9 s wait for the next draft): while the master reads a card, the next card's
 * draft is made in the background (live only). It is used only when it is the draft the master would have got anyway:
 *   - the master marked ○ (○ never changes the 心得帳). After △/×, the action discards it and the next draft is made as before,
 *     so 「直したら、次が変わる」 is never a card late;
 *   - and the 心得帳 is the same as when the prefetch started (its version — a hash of every rule with its history — is compared).
 *     A reading that finished meanwhile, a 確かめ, an undo… any change discards it.
 * In code that is a positive check, not only a discard: judge(○) approves the prefetch of the card it moves to, and only an
 * approved one is ever taken. △/× and 取り消し drop every prefetch of the session (hitl-reviewer 11/5).
 * When the 心得帳 changes before it is used (a reading written, a わけ added…), it is made again from the new 心得帳 (Kento 11/5,
 * after 体験の目 2): one at a time — the run that finds the book changed under it drafts again in the same slot, and a render that
 * finds a finished prefetch out of date replaces it. Never two drafting calls for one slot; at most MAX_REDOS redos per slot (a slot replaced after a later change is a new
 * slot, so the drafts per card are bounded by the 心得帳's changes and the live limits — "the latest one only").
 * Until it is used, a prefetched draft is in this process's memory only: not saved in the session, not shown, not learned from.
 * Its call is reserved against the limits like any live call and its cost recorded even when it is discarded.
 * A failed prefetch is the same as none: the page drafts as before. The evaluation never comes here (tests/prefetch.test.ts).
 */
import { createHash } from "node:crypto";
import type { Client, Proposal, Scene } from "@/src/core/types";
import type { KokoroeStore } from "@/src/learning/store";

export interface PrefetchCtx {
  mode: string;
  sid: string;
  store: Pick<KokoroeStore, "listRules">;
}

interface Entry {
  sceneId: string;
  startedAt: number;
  approved: boolean; // set only by judge(○) on the card before this one
  running: boolean; // a drafting call for this slot is in flight
  version?: string; // the 心得帳 the last finished draft started from
  result: Promise<{ version: string; draft: Proposal } | null>;
  settle: (v: { version: string; draft: Proposal } | null) => void;
}

const entries = new Map<string, Entry>();
const keyOf = (c: PrefetchCtx, index: number) => `${c.mode}-${c.sid}-${index}`;

/** The 心得帳's version: any change to any rule (text, scope, status, 沿革) changes it. */
export async function bookVersion(store: Pick<KokoroeStore, "listRules">): Promise<string> {
  return createHash("sha256").update(JSON.stringify(await store.listRules())).digest("hex");
}

/** Take the slot for card `index` (synchronously, so two renders cannot both start one). False if one exists already. */
export function claimPrefetch(c: PrefetchCtx, index: number, sceneId: string): boolean {
  const k = keyOf(c, index);
  if (entries.has(k)) return false;
  let settle!: Entry["settle"];
  const result = new Promise<{ version: string; draft: Proposal } | null>((r) => (settle = r));
  entries.set(k, { sceneId, startedAt: Date.now(), approved: false, running: false, result, settle });
  return true;
}

/** The slot just claimed, so the run fills that slot only (a slot dropped and claimed again is a different one). */
export function slotOf(c: Pick<PrefetchCtx, "mode" | "sid">, index: number): object | undefined {
  return entries.get(`${c.mode}-${c.sid}-${index}`);
}

/** Drop the prefetch for card `index` (when its call was refused). A call in flight still finishes and is counted. */
export function discardPrefetch(c: Pick<PrefetchCtx, "mode" | "sid">, index: number) {
  const k = `${c.mode}-${c.sid}-${index}`;
  entries.get(k)?.settle(null);
  entries.delete(k);
}

/** △/× or 取り消し: drop every prefetch of this session, whatever card it was for. */
export function discardAllPrefetch(c: Pick<PrefetchCtx, "mode" | "sid">) {
  const prefix = `${c.mode}-${c.sid}-`;
  for (const [k, e] of entries) if (k.startsWith(prefix)) {
    e.settle(null);
    entries.delete(k);
  }
}

/** judge(○): the card the master moves to may use its prefetch (still only with the same 心得帳). */
export function approvePrefetch(c: Pick<PrefetchCtx, "mode" | "sid">, index: number, sceneId: string) {
  const e = entries.get(`${c.mode}-${c.sid}-${index}`);
  if (e && e.sceneId === sceneId) e.approved = true;
}

export const MAX_REDOS = 3;

/**
 * Draft the claimed card. `propose` makes the draft and records its own cost; any failure leaves no prefetch. If the 心得帳
 * changed while drafting and the slot is still this one and not yet approved, draft again from the new book — only when
 * `again()` reserves another live call (limits), and at most MAX_REDOS times.
 */
export async function runPrefetch(
  c: PrefetchCtx,
  index: number,
  scene: Scene,
  client: Client,
  propose: (scene: Scene, client: Client) => Promise<Proposal>,
  slot?: object,
  again: () => boolean = () => false,
) {
  const k = keyOf(c, index);
  const e = entries.get(k);
  if (!e || e.sceneId !== scene.id || (slot && e !== slot) || e.running) return;
  e.running = true;
  try {
    for (let redo = 0; ; redo++) {
      const version = await bookVersion(c.store); // before drafting: the book the draft reads is this one or a later one
      e.startedAt = Date.now(); // the wait budget counts from the draft in flight
      const draft = await propose(scene, client);
      if (entries.get(k) !== e) {
        // Taken (draftLive is waiting on it) or discarded (△/×, undo — already settled to null, so this is a no-op): no redo.
        e.settle({ version, draft });
        return;
      }
      e.version = version;
      const changed = (await bookVersion(c.store)) !== version;
      if (!changed || e.approved || redo >= MAX_REDOS || entries.get(k) !== e || !again()) {
        e.settle({ version, draft }); // out of date if changed: takePrefetch will not use it
        return;
      }
    }
  } catch (err) {
    console.error("prefetch skipped", scene.id, err instanceof Error ? err.message : err);
    e.settle(null);
  } finally {
    e.running = false;
  }
}

/**
 * A render that finds a finished, unapproved prefetch made from an older 心得帳 drops it, so it can be made again from the new
 * one. One still drafting is left alone (it checks the book itself when it finishes).
 */
export async function dropIfStale(c: PrefetchCtx, index: number): Promise<boolean> {
  const e = entries.get(keyOf(c, index));
  if (!e || e.running || e.approved || e.version === undefined) return false;
  if (e.version === (await bookVersion(c.store))) return false;
  if (entries.get(keyOf(c, index)) !== e || e.running || e.approved) return false; // changed while reading the book
  discardPrefetch(c, index);
  return true;
}

/**
 * The prefetched draft for card `index`, if it can stand for a fresh one: same scene, and the 心得帳 unchanged since it started.
 * Waits for a prefetch still in flight (it started earlier than a fresh call would). Always removes the slot.
 */
export async function takePrefetch(c: PrefetchCtx, index: number, sceneId: string, budgetMs = 20_000): Promise<Proposal | null> {
  const k = keyOf(c, index);
  const e = entries.get(k);
  if (!e) return null;
  entries.delete(k);
  if (process.env.KOKOROE_PREFETCH_DEBUG) console.error("[prefetch] take", index, { approved: e.approved, sameScene: e.sceneId === sceneId, ageMs: Date.now() - e.startedAt });
  if (e.sceneId !== sceneId || !e.approved) return null;
  // Wait at most until `budgetMs` after the prefetch started (a fresh draft takes 5–9 s): a hung or never-run one costs little.
  const left = Math.max(0, e.startedAt + budgetMs - Date.now());
  const got = await Promise.race([e.result, new Promise<null>((r) => setTimeout(() => r(null), left).unref?.())]);
  const same = got?.version === (await bookVersion(c.store));
  if (process.env.KOKOROE_PREFETCH_DEBUG) console.error("[prefetch] result", index, { got: !!got, sameBook: same });
  return got && same ? got.draft : null;
}

/** For tests. */
export const _entries = entries;
