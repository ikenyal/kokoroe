/**
 * 帳場: take back the last judgment (Kento 11/4). One step only.
 * - Before interpretation has written anything, the judgment is simply taken back.
 * - After it has, the change written from it is undone the same way as a 差し戻し (an added rule is retired, a revised rule is
 *   restored to its snapshot), and the 沿革 says so — nothing is erased.
 * - It waits while any background work is running (interpretation, a check, a follow-up correction on the same scene): a change
 *   landing during the undo could otherwise be lost or come back.
 * - It refuses when the rule was changed again by another correction after this judgment: restoring the snapshot would erase
 *   that later change. The master can retire the rule on the 心得帳 page instead.
 * The judgment record stays, marked `undone` (with the 確かめ judgments made for it); learning and regression checks skip them.
 * Hardened after the hitl-reviewer's review (11/4): error-after-write, other pendings, idempotent retry.
 */
import { discardAllPrefetch } from "./prefetch";
import { rollbackChange } from "@/src/learning/verify";
import type { JudgmentRecord, KokoroeRule } from "@/src/learning/types";
import { readMeta, type Pending, type Session } from "./session";

const RUNNING: Pending["status"][] = ["queued", "interpreting", "choosing", "verifying"];
/** Settled statuses after which nothing from this judgment is in force (withdrawn / rolled back / never written). */
const UNWRITTEN: Pending["status"][] = ["rolled-back", "withdrawn", "nothing-learned", "offline"];

export type UndoBlock = "busy" | "changed-since" | "follow-up" | null;

export interface Undoable {
  judgment: JudgmentRecord;
  block: UndoBlock;
  writes: boolean; // undoing also undoes a kokoroe-chō change
}

/** The 確かめ judgment (same scene) and regression judgments (its fixed set of past ○ scenes) made for this judgment. */
function followUps(all: JudgmentRecord[], j: JudgmentRecord, p: Pending | undefined) {
  const regressionScenes = new Set(p?.verify?.fixedSet.map((x) => x.sceneId) ?? []);
  return all.filter(
    (x) =>
      x.id !== j.id && !x.undone && Date.parse(x.at) >= Date.parse(j.at) &&
      ((x.kind === "confirm" && x.sceneId === j.sceneId) || (x.kind === "regression" && regressionScenes.has(x.sceneId))),
  );
}

/** Is a change from this judgment still in force on the rule (it is still a source, and the undo has not been done yet)? */
function stillWritten(rule: KokoroeRule | undefined, j: JudgmentRecord): boolean {
  if (!rule) return false;
  const undoneAlready = rule.history.some((h) => h.judgmentId === j.id && h.after.startsWith("（取り消し"));
  return !undoneAlready && rule.sources.some((s) => s.judgmentId === j.id);
}

/** The judgment the 帳場 would take back now (the draft judgment of the previous card), or null. */
export async function lastUndoable(s: Session): Promise<Undoable | null> {
  const meta = readMeta(s.mode, s.sid);
  const prev = meta.queue[meta.pos - 1];
  if (!prev) return null;
  const all = await s.store.listJudgments();
  const j = [...all].reverse().find((x) => x.sceneId === prev.scene.id && (x.kind ?? "draft") === "draft" && !x.undone);
  if (!j) return null;
  const p = meta.pending.find((x) => x.judgmentId === j.id);
  const ruleId = p?.ruleId;
  const rule = ruleId ? await s.store.getRule(ruleId) : undefined;
  const writes = !!p?.verify && !!ruleId && !UNWRITTEN.includes(p.status) && stillWritten(rule, j);
  // Any background work running: wait.
  const busy = meta.pending.some((x) => RUNNING.includes(x.status));
  // A separate correction that grew out of this judgment's 確かめ (D-045 remainder: same scene, or kept away from this rule).
  // Whether undo should take that one back too is Kento's call (asked 11/4); until then, undo is not offered for it.
  const followUp = meta.pending.some((x) => x.judgmentId !== j.id && (x.sceneId === j.sceneId || (!!ruleId && x.exclude === ruleId)) && !UNWRITTEN.includes(x.status));
  // The rule's newest change must be from this judgment or its own 確かめ/regression; otherwise a later correction would be erased.
  const mine = new Set([j.id, ...followUps(all, j, p).map((x) => x.id)]);
  const lastEntry = rule?.history.at(-1);
  const changedSince = writes && !!lastEntry && !mine.has(lastEntry.judgmentId);
  return { judgment: j, writes, block: busy ? "busy" : followUp ? "follow-up" : changedSince ? "changed-since" : null };
}

export async function undoLast(s: Session, judgmentId: string): Promise<"done" | Exclude<UndoBlock, null> | "stale"> {
  const u = await lastUndoable(s);
  if (!u || u.judgment.id !== judgmentId) return "stale"; // double submit, or the page was old
  if (u.block) return u.block;
  const meta = readMeta(s.mode, s.sid);
  const p = meta.pending.find((x) => x.judgmentId === judgmentId);
  const at = new Date().toISOString();
  if (u.writes && p?.verify) {
    await rollbackChange({
      store: s.store, change: p.verify.change, snapshot: p.verify.snapshot, judgmentId, brokenSceneId: u.judgment.sceneId,
      verdict: u.judgment.verdict, remark: "", at, kind: "undo",
    });
  }
  // The judgment and the 確かめ/regression judgments made for it no longer count as the master's marks.
  for (const x of [u.judgment, ...followUps(await s.store.listJudgments(), u.judgment, p)]) await s.store.markUndone(x.id, at);
  discardAllPrefetch(s); // 先読み: the card order goes back; no prefetch made before the undo is used
  meta.pos = Math.max(0, meta.pos - 1);
  meta.paused = false;
  meta.pending = meta.pending.filter((x) => x.judgmentId !== judgmentId);
  s.saveMeta(meta);
  return "done";
}
