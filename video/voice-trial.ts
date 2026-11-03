/**
 * Voice trial (11/4): can Polly sound less synthetic with better text and SSML? Two passages of the planned v2 structure
 * (1 = the problem, 4 = the solution and title; 15 s each, Kento's draft narration), four steps:
 *   a  the draft as written (video/narration.ts SSML)
 *   b  rewritten for speech (short sentences, commas where you breathe, fewer written-language turns)
 *   c  b + <prosody rate="90%"> + a longer <break> between sentences
 *   d  c + accents fixed with <phoneme alphabet="x-amazon-pron-kana"> (only where the engine allows it)
 * Plus a probe that checks whether each tag actually changes the audio for each voice/engine (item 3 of the request).
 *
 *   npx tsx video/voice-trial.ts --voices Tomoko:neural,Takumi:neural          # dry run: SSML, characters, cost; no call
 *   npx tsx video/voice-trial.ts --voices … --yes                               # synthesize → video/out/audio/trial/
 * Accents and readings are shared with video/narration.ts (the decided voice uses the same lists). Polly is called through the AWS CLI with the sandbox profile only (CLAUDE.md). Output is gitignored.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { ACCENTS, billedChars, ssmlBody as body } from "./narration";
export { ACCENTS };

const PROFILE = "brightflow-sandbox-ikeda";
const REGION = "ap-northeast-1";
const OUT = path.join(__dirname, "out", "audio", "trial");
/** USD per 1M billed characters (Polly pricing page; SSML tags are not billed). */
export const USD_PER_M: Record<string, number> = { standard: 4, neural: 16, generative: 30, "long-form": 100 };

/** v2 passages: a = Kento's draft (11/4), b = the same content rewritten to be spoken. seconds = the slot in the v2 plan. */
export const PASSAGES: { id: string; seconds: number; a: string; b: string }[] = [
  {
    id: "v2-1-problem",
    seconds: 15,
    a: "来年の春、三十年、取引先を担ってきた営業部長が退職します。どの取引先に、何を、どう伝えるか。その作法は、本人の頭の中にしかありません。",
    b: "来年の春、営業部長が退職します。三十年、取引先とのやりとりを見てきた人です。どの取引先に、何を、どう伝えるか。その作法は、部長の頭の中にしかありません。",
  },
  {
    id: "v2-4-solution",
    seconds: 15,
    a: "ココロエは、その「違う」を集めるAIの弟子です。弟子が先に案を出し、師匠は、まる・さんかく・ばつと一言だけ。直された作法は、経緯と一緒に心得帳に残り、そのまま後任へ渡せます。",
    b: "ココロエは、その「違う」を集める、AIの弟子です。まず弟子が、案を出します。師匠は、まる、さんかく、ばつと、一言だけ。直された作法は、いきさつと一緒に、心得帳に残ります。そして、そのまま後任に渡せます。",
  },
];

type Step = "a" | "b" | "c" | "d";
/** Round 2: accents on, a given rate (%) and a pause (ms) between sentences. */
export function tunedSsml(text: string, rate: number, breakMs: number, accents = ACCENTS): string {
  return `<speak><prosody rate="${rate}%">${body(text, accents).replace(/。(?!$)/g, `。<break time="${breakMs}ms"/>`)}</prosody></speak>`;
}

export function trialSsml(text: string, step: Step): string {
  if (step === "a" || step === "b") return `<speak>${body(text, []).replace(/。/g, '。<break time="300ms"/>')}</speak>`; // as narration.ts
  // c, d: slower, and a longer pause between sentences (the prosody wraps whole sentences, as generative requires)
  return tunedSsml(text, 90, 500, step === "d" ? ACCENTS : []);
}

/** Round 2 (11/4, Kento chose Takumi + accents, a little faster): rate × pause, on the spoken text (b). */
export const ROUND2 = { voice: "Takumi", rates: [100, 105, 110], breaks: [500, 300] };

/** Accent position from a pron-kana string: the mora after which the pitch falls (0 = flat). */
export function accentOf(ph: string): { reading: string; morae: number; position: number } {
  const mora = (s: string) => s.replace(/[ャュョァィゥェォ]/g, "").length;
  const at = ph.indexOf("'");
  const reading = ph.replace("'", "");
  return { reading, morae: mora(reading), position: at < 0 ? 0 : mora(ph.slice(0, at)) };
}

/** Probe: each pair differs only in one tag. Same audio ⇒ the tag had no effect. */
const BASE = "心得帳を、後任に渡します。";
export const PROBES: { id: string; what: string; ssml: string; vs: string; expect: string }[] = [
  { id: "repeat", what: "同じ入力を2回（再現性）", ssml: `<speak>${BASE}</speak>`, vs: "base", expect: "same" },
  { id: "break", what: "<break time=\"1s\">", ssml: `<speak>心得帳を、<break time="1s"/>後任に渡します。</speak>`, vs: "base", expect: "+1 s" },
  { id: "rate90", what: "<prosody rate=\"90%\">", ssml: `<speak><prosody rate="90%">${BASE}</prosody></speak>`, vs: "base", expect: "×1.1" },
  { id: "sub", what: "<sub alias=\"こころえちょう\">", ssml: `<speak><sub alias="こころえちょう">心得帳</sub>を、後任に渡します。</speak>`, vs: "kana", expect: "= kana" },
  { id: "yomigana", what: "<phoneme x-amazon-yomigana>", ssml: `<speak><phoneme alphabet="x-amazon-yomigana" ph="こころえちょう">心得帳</phoneme>を、後任に渡します。</speak>`, vs: "kana", expect: "= kana" },
  { id: "pron-flat", what: "<phoneme x-amazon-pron-kana> 印なし", ssml: `<speak><phoneme alphabet="x-amazon-pron-kana" ph="ココロエチョー">心得帳</phoneme>を、後任に渡します。</speak>`, vs: "base", expect: "differs" },
  { id: "pron-accent", what: "<phoneme x-amazon-pron-kana> ' あり", ssml: `<speak><phoneme alphabet="x-amazon-pron-kana" ph="コ'コロエチョー">心得帳</phoneme>を、後任に渡します。</speak>`, vs: "pron-flat", expect: "differs" },
];
const PROBE_BASES = { base: `<speak>${BASE}</speak>`, kana: "<speak>こころえちょうを、後任に渡します。</speak>" };

const STEPS: Step[] = ["a", "b", "c", "d"];

function polly(voice: string, engine: string, ssml: string, file: string, format: "mp3" | "pcm") {
  execFileSync("aws", [
    "polly", "synthesize-speech", "--profile", PROFILE, "--region", REGION,
    "--engine", engine, "--voice-id", voice, "--language-code", "ja-JP", "--text-type", "ssml", "--text", ssml,
    "--output-format", format, "--sample-rate", format === "pcm" ? "16000" : "24000", file,
  ], { stdio: ["ignore", "ignore", "pipe"] });
}

function main() {
  const { values } = parseArgs({ options: { yes: { type: "boolean", default: false }, round2: { type: "boolean", default: false }, voices: { type: "string", default: "Tomoko:neural,Takumi:neural" } } });
  const voices = values.voices!.split(",").map((v) => { const [id, engine] = v.split(":"); return { id, engine }; });
  if (values.round2) return round2(values.yes!);
  const scenes = PASSAGES;
  const textOf = (id: string, step: Step) => { const p = PASSAGES.find((x) => x.id === id)!; return step === "a" ? p.a : p.b; };

  let usd = 0, total = 0;
  for (const v of voices) {
    let chars = 0;
    for (const s of scenes) for (const step of STEPS) chars += billedChars(trialSsml(textOf(s.id, step), step));
    for (const p of [...PROBES.map((p) => p.ssml), ...Object.values(PROBE_BASES)]) chars += billedChars(p);
    total += chars;
    usd += (chars / 1e6) * USD_PER_M[v.engine];
    console.log(`${v.id}:${v.engine}  ${chars} chars`);
  }
  for (const s of scenes) for (const step of STEPS) console.log(`\n${s.id} ${step} (${billedChars(trialSsml(textOf(s.id, step), step))} chars)\n  ${trialSsml(textOf(s.id, step), step)}`);
  console.log(`\n${voices.length} voices: ${total} billed characters ≈ $${usd.toFixed(4)}`);
  if (!values.yes) return console.log("Not called. Add --yes to synthesize.");

  const results: Record<string, unknown> = {};
  for (const v of voices) {
    const key = `${v.id}-${v.engine}`, dir = path.join(OUT, key);
    mkdirSync(dir, { recursive: true });
    // scenes
    const durs: Record<string, number | string> = {};
    for (const s of scenes) for (const step of STEPS) {
      const file = path.join(dir, `${s.id}-${step}.mp3`);
      try {
        polly(v.id, v.engine, trialSsml(textOf(s.id, step), step), file, "mp3");
        durs[`${s.id}-${step}`] = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
      } catch (e) {
        durs[`${s.id}-${step}`] = `error: ${String((e as { stderr?: Buffer }).stderr ?? e).trim().split("\n").pop()}`;
      }
      console.log(`${key} ${s.id}-${step} ${durs[`${s.id}-${step}`]}`);
    }
    // probes (pcm 16 kHz s16le: duration = bytes / 32000)
    const pcm: Record<string, { sec: number; hash: string } | { error: string }> = {};
    const run = (id: string, ssml: string) => {
      const file = path.join(dir, `probe-${id}.pcm`);
      try {
        polly(v.id, v.engine, ssml, file, "pcm");
        const buf = readFileSync(file);
        pcm[id] = { sec: buf.length / 32000, hash: createHash("sha256").update(buf).digest("hex").slice(0, 12) };
      } catch (e) {
        pcm[id] = { error: String((e as { stderr?: Buffer }).stderr ?? e).trim().split("\n").pop()! };
      }
    };
    for (const [id, ssml] of Object.entries(PROBE_BASES)) run(id, ssml);
    for (const p of PROBES) run(p.id, p.ssml);
    results[key] = { durations: durs, probes: pcm };
  }
  writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ scenes: Object.fromEntries(scenes.map((s) => [s.id, s.seconds])), results }, null, 2));
  console.log(`→ ${path.relative(process.cwd(), path.join(OUT, "results.json"))}`);
}

function round2(yes: boolean) {
  const runs = PASSAGES.flatMap((p) => ROUND2.rates.flatMap((rate) => ROUND2.breaks.map((ms) => ({ p, rate, ms, ssml: tunedSsml(p.b, rate, ms) }))));
  const chars = runs.reduce((n, r) => n + billedChars(r.ssml), 0);
  for (const r of runs.slice(0, 1)) console.log(r.ssml);
  console.log(`${runs.length} files (${ROUND2.voice}, neural): ${chars} billed characters ≈ $${((chars / 1e6) * USD_PER_M.neural).toFixed(4)}`);
  if (!yes) return console.log("Not called. Add --yes to synthesize.");
  const dir = path.join(OUT, "round2");
  mkdirSync(dir, { recursive: true });
  const durations: Record<string, number> = {};
  for (const r of runs) {
    const name = `${r.p.id}-r${r.rate}-b${r.ms}`, file = path.join(dir, `${name}.mp3`);
    polly(ROUND2.voice, "neural", r.ssml, file, "mp3");
    durations[name] = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
    console.log(`${name} ${durations[name].toFixed(2)} s / ${r.p.seconds} s`);
  }
  writeFileSync(path.join(dir, "results.json"), JSON.stringify({ voice: ROUND2.voice, durations }, null, 2));
}

if (require.main === module) main();
