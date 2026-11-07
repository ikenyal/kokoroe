/**
 * Measures when subtitles are really on screen, frame by frame (Kento 11/7, final pass), and compares them with the voice.
 *   npx tsx video/subtitle-check.ts clips     # each recorded clip: offset of its first subtitle from the plan (recording jitter)
 *   npx tsx video/subtitle-check.ts final     # the assembled video: every sentence's subtitle on/off vs its voice, as a table
 * A subtitle is the dark box at the bottom (rgba(31,35,40,.82)); a new line is a change of the box's width or text. Voice times
 * come from video/timing.ts (measured from the narration's audio), placed with the scene's lead, holds and position.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cueWindows, sentenceSpans } from "./timing";

const OUT = path.join(__dirname, "out");
const plan = JSON.parse(readFileSync(path.join(__dirname, "scenes.json"), "utf8")) as {
  lead: number; gap: number; wipeHold: number;
  scenes: { id: string; seconds: number; wipe?: string; after?: number; holds?: { sentence: number; sec: number }[]; narration: string; subtitle?: false; shift?: number }[];
};
const W = 320, H = 14, FPS = 30;

/** Subtitle runs in a file: [on, off, signature] with times in seconds of that file. */
export function runs(file: string, from = 0, dur?: number): { on: number; off: number; left: number; right: number }[] {
  const args = ["-v", "error", "-ss", String(from), ...(dur ? ["-t", String(dur)] : []), "-i", file,
    "-vf", `fps=${FPS},crop=1280:56:0:636,scale=${W}:${H}:flags=area,format=rgb24`, "-f", "rawvideo", "-"];
  const raw = execFileSync("ffmpeg", args, { maxBuffer: 1 << 30 });
  const n = Math.floor(raw.length / (W * H * 3));
  const out: { on: number; off: number; left: number; right: number }[] = [];
  let cur: { on: number; off: number; left: number; right: number } | undefined;
  for (let f = 0; f < n; f++) {
    // a column is "box" when most of its pixels are the subtitle's neutral dark grey (the noren is indigo, not grey)
    const cols: boolean[] = [];
    for (let x = 0; x < W; x++) {
      let dark = 0;
      for (let y = 2; y < H - 2; y++) {
        const i = ((f * H + y) * W + x) * 3, r = raw[i], g = raw[i + 1], bl = raw[i + 2];
        if ((Math.max(r, g, bl) < 120 && bl - r < 22) || (r > 200 && g > 200 && bl > 190)) dark += Math.max(r, g, bl) < 120 ? 1 : 0;
      }
      cols.push(dark >= (H - 4) * 0.5);
    }
    const left = cols.indexOf(true), right = cols.lastIndexOf(true);
    const on = left >= 0 && right - left > 12 && cols.slice(left, right + 1).filter(Boolean).length > (right - left) * 0.6;
    const t = from + f / FPS;
    if (on) {
      if (cur && Math.abs(cur.left - left) <= 2 && Math.abs(cur.right - right) <= 2) cur.off = t + 1 / FPS;
      else { if (cur) out.push(cur); cur = { on: t, off: t + 1 / FPS, left, right }; }
    } else if (cur) { out.push(cur); cur = undefined; }
  }
  if (cur) out.push(cur);
  // a full-width dark band is the noren, not a subtitle; a patch drawn right after the burned-in line (same text, a box a few
  // pixels wider) is the same line
  const kept = out.filter((r) => r.right - r.left < W - 24);
  const merged: typeof kept = [];
  for (const r of kept) {
    const p = merged.at(-1);
    if (p && r.on - p.off <= 0.05 && Math.abs((r.right - r.left) - (p.right - p.left)) <= 6) p.off = r.off;
    else merged.push({ ...r });
  }
  return merged.filter((r) => r.off - r.on > 0.1);
}

function sceneStarts() {
  let t = 0;
  return plan.scenes.map((s, i) => {
    const pre = s.wipe ? plan.wipeHold : 0;
    const held = (s.holds ?? []).reduce((n, h) => n + h.sec, 0);
    const start = t + pre;
    t += s.seconds + pre + held + (i < plan.scenes.length - 1 ? plan.gap + (s.after ?? 0) : 0);
    return { s, start };
  });
}
const cuesOf = (s: { narration: string; subtitle?: false }) => (s.subtitle === false ? [] : s.narration.split(/(?<=。)/).map((x) => x.trim()).filter(Boolean));

const mode = process.argv[2] ?? "final";
if (mode === "clips" || mode === "shifts") {
  // Offset of each recorded clip: median over every sentence of (on screen − planned), using the on and off edges that are
  // not cut by the clip's start. A negative offset means the clip shows its subtitles early (recording started late).
  const shifts: Record<string, number> = {};
  for (const s of plan.scenes) {
    const spans = sentenceSpans(s.id);
    if (!spans || !cuesOf(s).length) continue;
    const win = cueWindows(spans, plan.lead, s.seconds);
    const rs = runs(path.join(OUT, `${s.id}.webm`), 0, s.seconds + 1);
    const d: number[] = [];
    win.at.forEach((on, k) => {
      const r = rs.filter((x) => x.off > on - 1.2 && x.on < win.until[k]).sort((a, b) => Math.abs(a.on - on) - Math.abs(b.on - on))[0];
      if (!r) return;
      if (r.on > 0.05 && !(k === 0 && s.wipe)) d.push(r.on - on); // the noren covers the first line in wipe scenes
      if (Math.abs(r.off - win.until[k]) < 1.2) d.push(r.off - win.until[k]);
    });
    d.sort((a, b) => a - b);
    const med = d.length ? d[Math.floor(d.length / 2)] : 0;
    shifts[s.id] = Math.round(-med * 100) / 100;
    console.log(`${s.id.padEnd(13)} ${d.length} edges, median offset ${med.toFixed(2)} s → shift the clip ${shifts[s.id].toFixed(2)} s`);
  }
  if (mode === "shifts") {
    const p = path.join(__dirname, "scenes.json");
    const j = JSON.parse(readFileSync(p, "utf8"));
    for (const sc of j.scenes) if (shifts[sc.id] !== undefined) sc.shift = shifts[sc.id];
    writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
    console.log("written to scenes.json (\"shift\")");
  }
} else {
  const file = path.join(OUT, "kokoroe-demo.mp4");
  const all = runs(file);
  const rows: string[] = ["| 場面 | 文 | 声 | 字幕 | 出のずれ | 消えるまで |", "|---|---|---|---|---|---|"];
  let worst = 0;
  for (const { s, start } of sceneStarts()) {
    const spans = sentenceSpans(s.id);
    const cues = cuesOf(s);
    if (!spans || !cues.length) continue;
    const holds = (s.holds ?? []).map((h) => ({ k: h.sentence, sec: h.sec }));
    spans.forEach((sp, k) => {
      const shift = holds.filter((h) => h.k <= k).reduce((n, h) => n + h.sec, 0);
      const vOn = start + plan.lead + sp.start + shift, vOff = start + plan.lead + sp.end + shift;
      const r = all.filter((x) => x.off > vOn - 0.6 && x.on < vOff).sort((a, b) => Math.abs(a.on - vOn) - Math.abs(b.on - vOn))[0];
      const dOn = r ? r.on - vOn : NaN, dOff = r ? r.off - vOff : NaN;
      // Kento 11/7: on from 0.1 s before the voice to the voice; off 0.2–0.4 s after it. Flag a miss of 0.3 s or more.
      const missOn = !r ? 9 : dOn > 0 ? dOn : dOn < -0.1 ? -0.1 - dOn : 0;
      const missOff = !r ? 9 : dOff < 0.2 ? 0.2 - dOff : dOff > 0.4 ? dOff - 0.4 : 0;
      const bad = Math.max(missOn, missOff) >= 0.3;
      worst = Math.max(worst, missOn, missOff);
      const mmss = (x: number) => `${Math.floor(x / 60)}:${(x % 60).toFixed(2).padStart(5, "0")}`;
      rows.push(`| ${s.id} | ${k + 1}「${cues[k].slice(0, 14)}${cues[k].length > 14 ? "…" : ""}」 | ${mmss(vOn)}–${mmss(vOff)} | ${r ? `${mmss(r.on)}–${mmss(r.off)}` : "なし"} | ${r ? (dOn >= 0 ? "+" : "") + dOn.toFixed(2) : "—"} | ${r ? (dOff >= 0 ? "+" : "") + dOff.toFixed(2) : "—"}${bad ? " ⚠" : ""} |`);
    });
  }
  console.log(rows.join("\n"));
  console.log(`\nlargest miss outside the target window: ${worst.toFixed(2)} s`);
}
