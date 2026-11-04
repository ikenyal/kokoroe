/**
 * Own-mode comparison test (D-060): the result that may enter the repository — times and counts only.
 * Never the situations, the prose, the client ledger, the company or the 心得 text: those stay in the own folder (~/.kokoroe).
 * A test feeds this function marked strings and checks that none comes out, and that the only strings are the note and the date.
 */
import { jstDate } from "@/src/learning/fix";
import type { KokoroeRule } from "@/src/learning/types";
import type { SessionMeta, Timing } from "./session";

export const OWN_RESULT_NOTE =
  "自分の会社での比較テスト / own-company comparison (D-060): one person (the author) on their own clients under stand-in names; prose written before judging. Times in ms (medians per action); counts by the author's own rule (a concrete practice a successor can carry out as written). No text leaves the own folder.";

/**
 * Own-mode comparison: is the card at queue index i held back for prose? (No draft, no judging until its prose exists.)
 * Only situations added after the comparison started take part.
 */
export function heldForProse(meta: Pick<SessionMeta, "mode" | "compare" | "queue" | "writes">, i: number): boolean {
  const c = meta.compare;
  return meta.mode === "own" && !!c && i >= c.fromIndex && !!meta.queue[i] && !(meta.writes ?? []).some((w) => w.sceneId === meta.queue[i].scene.id);
}

const KINDS: Timing["kind"][] = ["scene", "write", "judge", "remark", "choose", "why", "check"];

const median = (xs: number[]): number | null => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null;
};
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function buildOwnResult(meta: SessionMeta, rules: KokoroeRule[]) {
  const t = meta.timings ?? [];
  const learned = rules.filter((r) => r.status === "active" && r.sources.some((x) => x.kind !== "ledger"));
  const counts = meta.counts;
  const writes = meta.writes ?? [];
  return {
    note: OWN_RESULT_NOTE,
    date: jstDate(meta.compare?.startedAt ?? meta.createdAt),
    situations: meta.queue.length,
    judged: Math.min(meta.pos, meta.queue.length),
    corrections: meta.pending.length,
    timings: Object.fromEntries(
      KINDS.filter((k) => t.some((x) => x.kind === k)).map((k) => {
        const xs = t.filter((x) => x.kind === k).map((x) => x.ms);
        return [k, { n: xs.length, medianMs: median(xs), totalMs: sum(xs) }];
      }),
    ),
    prose: { n: writes.length, medianMs: median(writes.map((w) => w.ms)), medianChars: median(writes.map((w) => w.text.length)) },
    rulesLearned: learned.length,
    counted: counts
      ? {
          etiquetteInProse: sum(Object.values(counts.prose)),
          proseTextsCounted: Object.keys(counts.prose).length,
          etiquetteFromJudging: learned.filter((r) => counts.rules[r.id] === true).length,
          rulesCounted: learned.filter((r) => r.id in counts.rules).length,
        }
      : null,
  };
}

/** Every string anywhere in a value (keys excluded). Used by the test and by own:save as a last check before writing. */
export function stringLeaves(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(stringLeaves);
  if (v && typeof v === "object") return Object.values(v).flatMap(stringLeaves);
  return [];
}

/** Every object key anywhere in a value. */
export function keysOf(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap(keysOf);
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => [k, ...keysOf(x)]);
  return [];
}

const ALLOWED_KEYS = new Set([
  "note", "date", "situations", "judged", "corrections", "timings", "prose", "rulesLearned", "counted",
  "n", "medianMs", "totalMs", "medianChars", "etiquetteInProse", "proseTextsCounted", "etiquetteFromJudging", "rulesCounted",
  ...KINDS,
]);

/** Throws unless the only strings are the fixed note and a YYYY-MM-DD date, and every key is a known field name. */
export function assertNoText(result: ReturnType<typeof buildOwnResult>) {
  const bad = stringLeaves(result).filter((x) => x !== OWN_RESULT_NOTE && !/^\d{4}-\d{2}-\d{2}$/.test(x));
  const badKeys = keysOf(result).filter((k) => !ALLOWED_KEYS.has(k));
  if (bad.length || badKeys.length) throw new Error(`refusing to save: ${bad.length} unexpected string(s), ${badKeys.length} unexpected key(s) in the result`);
}
