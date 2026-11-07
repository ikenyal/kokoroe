/**
 * Where each sentence of the narration really sounds (Kento 11/7, final pass): measured from the audio, not from Polly's sentence
 * marks alone — a mark can fall before the previous sentence has finished sounding (s00: mark 4.70 s, sound until 4.87 s).
 *   - the narration's silences (quieter than −45 dB for ≥ 0.12 s) split it into speech;
 *   - the break before sentence k is the longest silence near Polly's mark for k (marks only choose which silence);
 *   - sentence k sounds from the end of that break to the start of the next one.
 * Subtitles follow these spans (video/record.ts): shown 0.05 s before the voice starts, hidden 0.3 s after it ends, never over
 * the next one. Times are in the narration file's own seconds (before the scene's lead).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type Span = { start: number; end: number };
const AUDIO = path.join(__dirname, "out", "audio");

export function silences(mp3: string, db = -45, min = 0.12): [number, number][] {
  const log = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", mp3, "-af", `silencedetect=n=${db}dB:d=${min}`, "-f", "null", "-"]).stderr.toString();
  const s = [...log.matchAll(/silence_start: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const e = [...log.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  return s.map((x, i) => [Math.max(0, x), e[i] ?? Infinity] as [number, number]);
}

/** Per-sentence spans of a scene's narration, or undefined when there is no narration file. */
export function sentenceSpans(id: string, voice = "Takumi"): Span[] | undefined {
  const mp3 = path.join(AUDIO, voice, `${id}.mp3`), marksFile = path.join(AUDIO, voice, `${id}.marks.json`);
  if (!existsSync(mp3) || !existsSync(marksFile)) return undefined;
  const marks = JSON.parse(readFileSync(marksFile, "utf8")) as { seconds: number; sentences: number[] };
  const total = marks.seconds;
  const sil = silences(mp3);
  const lead = sil.find(([a]) => a <= 0.01); // silence at the very start
  const tail = [...sil].reverse().find(([, b]) => b >= total - 0.02 || !Number.isFinite(b));
  const first = lead ? lead[1] : 0;
  const last = tail ? tail[0] : total;
  const inner = sil.filter(([a, b]) => a > first && b < last);
  // One break per sentence boundary, in order, each near its mark (from 0.8 s before to 1.5 s after it); among the orderings
  // that fit, the one with the longest breaks overall (a sentence break is longer than a comma).
  const ms = marks.sentences.slice(1).map((x) => x / 1000);
  const cands = ms.map((m) => inner.map((g, i) => ({ g, i })).filter(({ g: [a, b] }) => b > m - 0.8 && a < m + 1.5 && b - a >= 0.2));
  let best: { len: number; pick: [number, number][] } | undefined;
  const walk = (k: number, after: number, len: number, pick: [number, number][]) => {
    if (k === ms.length) { if (!best || len > best.len) best = { len, pick }; return; }
    for (const { g, i } of cands[k]) if (i > after) walk(k + 1, i, len + (g[1] - g[0]), [...pick, g]);
  };
  walk(0, -1, 0, []);
  if (!best) throw new Error(`${id}: the sentence breaks could not be placed`);
  const breaks = best.pick;
  const starts = [first, ...breaks.map(([, b]) => b)];
  const ends = [...breaks.map(([a]) => a), last];
  return starts.map((s, i) => ({ start: s, end: ends[i] }));
}

/** Subtitle on/off times (scene seconds) from the spans: 0.05 s before the voice, until 0.3 s after it, never overlapping. */
export function cueWindows(spans: Span[], lead: number, seconds: number): { at: number[]; until: number[] } {
  const at = spans.map((s) => Math.max(0, lead + s.start - 0.05));
  const until = spans.map((s, i) => Math.min(lead + s.end + 0.3, i + 1 < spans.length ? at[i + 1] - 0.02 : seconds - 0.05));
  return { at, until };
}
