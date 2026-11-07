/**
 * Join recorded clips into video/out/kokoroe-demo.mp4 (1280×720, 30 fps, H.264 + AAC). Replaces assemble.sh's loop (11/7, after
 * Kento's full watch): the same per-scene cut, plus
 *   - "after": extra seconds of the scene's last frame (silence) before the next scene — a longer breath at chosen scene changes;
 *   - "holds": [{ "sentence": k, "sec": s }] — a pause inside a scene, before sentence k: the frame just before it is held and the
 *     narration waits, so picture, subtitle and voice stay together (no re-recording);
 *   - "fadeOut": the last scene fades to the paper colour, picture and sound together;
 *   - "overlaySubtitles": [{ "sentence": k }] — a subtitle drawn onto a clip that cannot be re-recorded (a live take), in the same
 *     style as video/record.ts, from that sentence's start to the scene's end.
 * Each clip is cut to its planned length; narration video/out/audio/<id>.mp3 starts after "lead" (silence when missing).
 *   npx tsx video/assemble.ts
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cueWindows, sentenceSpans } from "./timing";

const DIR = __dirname;
const OUT = path.join(DIR, "out");
type Hold = { sentence: number; sec: number };
type Scene = { id: string; seconds: number; shift?: number; subtitlePatches?: { sentence: number; from: number; to: number }[]; wipe?: string; after?: number; holds?: Hold[]; fadeOut?: number; overlaySubtitles?: { sentence: number }[]; overlayTag?: { text: string; patch?: { x: number; y: number; w: number; h: number; fromY: number } }; narration: string };
const plan = JSON.parse(readFileSync(path.join(DIR, "scenes.json"), "utf8")) as { lead: number; gap: number; wipeHold: number; scenes: Scene[] };
const PAPER = "0xf3f2ee";

const marks = (id: string): { seconds: number; sentences: number[] } | undefined => {
  const f = path.join(OUT, "audio", "Takumi", `${id}.marks.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : undefined;
};
const r3 = (n: number) => n.toFixed(3);

export function sceneTimeline(s: Scene, i: number) {
  const pre = s.wipe ? plan.wipeHold : 0;
  const post = i < plan.scenes.length - 1 ? plan.gap + (s.after ?? 0) : 0;
  const m = marks(s.id);
  const holds = (s.holds ?? []).map((h) => {
    if (!m || m.sentences[h.sentence] === undefined) throw new Error(`${s.id}: no sentence mark ${h.sentence} for the hold`);
    // In the middle of the real break before the sentence (video/timing.ts measures it from the audio), never inside a word.
    const spans = sentenceSpans(s.id);
    if (!spans || !spans[h.sentence] || h.sentence < 1) throw new Error(`${s.id}: no measured break before sentence ${h.sentence}`);
    const gap = [spans[h.sentence - 1].end, spans[h.sentence].start];
    return { at: plan.lead + (gap[0] + gap[1]) / 2, sec: h.sec };
  }).sort((a, b) => a.at - b.at);
  const held = holds.reduce((n, h) => n + h.sec, 0);
  return { pre, post, holds, held, total: s.seconds + held + pre + post, m };
}

function buildScene(s: Scene, i: number): number {
  const clip = path.join(OUT, `${s.id}.webm`);
  if (!existsSync(clip)) throw new Error(`missing ${clip} (run video/record.ts)`);
  const { pre, post, holds, total, m } = sceneTimeline(s, i);
  const mp3 = path.join(OUT, "audio", `${s.id}.mp3`);
  const inputs = ["-i", clip];
  const f: string[] = [];
  // Picture: cut to the planned length (a short clip is extended with its last frame), split at the holds, then pre/post holds.
  // "shift" (video/subtitle-check.ts shifts): the recording started a little late or early, so its burned-in subtitles run early
  // or late; delaying (+) or advancing (−) the clip puts them back on the voice. The scene keeps its length.
  const sh = s.shift ?? 0;
  const shiftF = sh > 0 ? `tpad=start_mode=clone:start_duration=${r3(sh)},` : sh < 0 ? `trim=start=${r3(-sh)},setpts=PTS-STARTPTS,` : "";
  f.push(`[0:v]fps=30,scale=1280:720,format=yuv420p,${shiftF}tpad=stop_mode=clone:stop_duration=8,trim=0:${r3(s.seconds)},setpts=PTS-STARTPTS[v0]`);
  let v = "v0";
  if (holds.length) {
    const cuts = [0, ...holds.map((h) => h.at), s.seconds];
    f.push(`[v0]split=${cuts.length - 1}${cuts.slice(1).map((_, k) => `[vs${k}]`).join("")}`);
    const parts = cuts.slice(1).map((end, k) => {
      const hold = k < holds.length ? `,tpad=stop_mode=clone:stop_duration=${r3(holds[k].sec)}` : "";
      f.push(`[vs${k}]trim=${r3(cuts[k])}:${r3(end)},setpts=PTS-STARTPTS${hold}[vp${k}]`);
      return `[vp${k}]`;
    });
    f.push(`${parts.join("")}concat=n=${parts.length}:v=1:a=0[vh]`);
    v = "vh";
  }
  // Subtitles drawn onto a live take that cannot be re-recorded.
  let n = 1;
  for (const o of s.overlaySubtitles ?? []) {
    const png = path.join(OUT, `${s.id}-sub${o.sentence}.png`);
    if (!existsSync(png)) throw new Error(`missing ${png} (npx tsx video/subtitle-png.ts)`);
    if (!m) throw new Error(`${s.id}: no marks for the overlay`);
    const spans = sentenceSpans(s.id);
    if (!spans) throw new Error(`${s.id}: no narration to time the overlay`);
    const win = cueWindows(spans, plan.lead, s.seconds);
    const from = win.at[o.sentence], to = win.until[o.sentence];
    inputs.push("-i", png);
    f.push(`[${v}][${n}:v]overlay=0:0:enable='between(t,${r3(from)},${r3(to)})'[vo${n}]`);
    v = `vo${n}`;
    n++;
  }
  if (s.overlayTag) {
    const png = path.join(OUT, `${s.id}-tag.png`);
    if (!existsSync(png)) throw new Error(`missing ${png} (npx tsx video/subtitle-png.ts)`);
    inputs.push("-i", png);
    const pt = s.overlayTag.patch; // cover the old tag with empty paper from lower in the same frame (the texture matches)
    if (pt) {
      f.push(`[${v}]split[pa${n}][pb${n}]`, `[pb${n}]crop=${pt.w}:${pt.h}:${pt.x}:${pt.fromY}[pc${n}]`, `[pa${n}][pc${n}]overlay=${pt.x}:${pt.y}[pp${n}]`);
      v = `pp${n}`;
    }
    f.push(`[${v}][${n}:v]overlay=0:0[vt${n}]`);
    v = `vt${n}`;
    n++;
  }
  const fade = s.fadeOut ? `,fade=t=out:st=${r3(total - s.fadeOut)}:d=${r3(s.fadeOut)}:color=${PAPER}` : "";
  f.push(`[${v}]tpad=start_mode=clone:start_duration=${r3(pre)}:stop_mode=clone:stop_duration=${r3(post)},trim=0:${r3(total)}[vpad]`);
  v = "vpad";
  // "subtitlePatches" (video/subtitle-check.ts): a line drawn where the burned-in one is missing — before a late recording's
  // first frame, or past the scene's end over the held last frame. Times are scene seconds (the opening hold is added here).
  for (const sp of s.subtitlePatches ?? []) {
    const png = path.join(OUT, `${s.id}-sub${sp.sentence}.png`);
    if (!existsSync(png)) throw new Error(`missing ${png} (npx tsx video/subtitle-png.ts)`);
    inputs.push("-i", png);
    f.push(`[${v}][${n}:v]overlay=0:0:enable='between(t,${r3(pre + sp.from)},${r3(pre + sp.to)})'[vq${n}]`);
    v = `vq${n}`;
    n++;
  }
  f.push(`[${v}]null${fade},format=yuv420p[vout]`); // format: the fade filter switches to yuv444p otherwise, which QuickTime cannot play (11/7)
  // Sound: the narration in pieces, each piece later by the holds before it.
  if (existsSync(mp3)) {
    const a = n;
    const cutsA = [0, ...holds.map((h) => h.at - plan.lead), 1e6];
    let cum = 0;
    // one input per piece (asplit stalls when one branch ends early)
    cutsA.slice(1).forEach(() => inputs.push("-i", mp3));
    const pieces = cutsA.slice(1).map((end, k) => {
      const start = cutsA[k];
      const delay = (plan.lead + pre + start + cum) * 1000;
      if (k < holds.length) cum += holds[k].sec;
      const trim = end >= 1e6 ? `atrim=start=${r3(Math.max(0, start))}` : `atrim=start=${r3(Math.max(0, start))}:end=${r3(end)}`;
      f.push(`[${a + k}:a]${trim},asetpts=PTS-STARTPTS,adelay=${Math.round(delay)}:all=1[ap${k}]`);
      return `[ap${k}]`;
    });
    f.push(`${pieces.join("")}amix=inputs=${pieces.length}:normalize=0,apad,atrim=0:${r3(total)}${s.fadeOut ? `,afade=t=out:st=${r3(total - s.fadeOut)}:d=${r3(s.fadeOut)}` : ""}[aout]`);
  } else {
    f.push(`anullsrc=r=48000:cl=stereo,atrim=0:${r3(total)}[aout]`);
  }
  if (process.env.ASSEMBLE_DEBUG) console.log(f.join(";\n"));
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...inputs, "-filter_complex", f.join(";"), "-map", "[vout]", "-map", "[aout]",
    "-t", r3(total), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", path.join(OUT, `${s.id}.mp4`)]);
  if (m && m.seconds + plan.lead > s.seconds + 0.01) console.warn(`warning: ${s.id} narration ${m.seconds.toFixed(2)}s (+${plan.lead}s lead) > ${s.seconds}s — it will be cut`);
  return total;
}

if (require.main === module) {
  const list: string[] = [];
  let sum = 0;
  plan.scenes.forEach((s, i) => {
    sum += buildScene(s, i);
    list.push(`file '${s.id}.mp4'`);
  });
  writeFileSync(path.join(OUT, "concat.txt"), list.join("\n") + "\n");
  // Join, then encode the whole video once (Kento 11/7: one stream with no joins for players and YouTube — H.264 High,
  // yuv420p, constant 30 fps, AAC, moov atom at the front).
  const joined = path.join(OUT, "kokoroe-demo-joined.mp4");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(OUT, "concat.txt"), "-c", "copy", joined]);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", joined, "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p", "-r", "30", "-fps_mode", "cfr", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", path.join(OUT, "kokoroe-demo.mp4")]);
  console.log(`planned ${sum.toFixed(2)} s`);
  console.log(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1", path.join(OUT, "kokoroe-demo.mp4")]).toString().trim());
}
