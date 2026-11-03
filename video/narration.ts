/**
 * Narration with Amazon Polly — voice decided 11/4 (Kento, after docs/voice-trial-2026-11-04.md):
 * Takumi (ja-JP, neural), rate 105%, accents fixed with pron-kana, 0.5 s between sentences (0.3 s only where a scene is short).
 *   npx tsx video/narration.ts                 # show SSML, billed characters and the cost estimate; no API call
 *   npx tsx video/narration.ts --yes           # synthesize → video/out/audio/Takumi/<id>.mp3 + <id>.marks.json (sentence times)
 *   npx tsx video/narration.ts --yes --only s05-choba
 * Polly is called through the AWS CLI with the sandbox profile only (CLAUDE.md). Words that are easy to misread are
 * replaced with <sub alias> or <phoneme> (both checked to take effect on neural, docs/voice-trial-2026-11-04.md), so the text
 * on screen and in subtitles stays as written. Numbers in the narration ({before} etc.) come from data/demo/results.json.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const PROFILE = "brightflow-sandbox-ikeda";
const REGION = "ap-northeast-1";
const OUT = path.join(__dirname, "out", "audio");
export const VOICE = { id: "Takumi", engine: "neural", rate: 105, pauseMs: 500 };
/** Neural voices: USD per 1M billed characters (SSML tags are not billed). Check the Polly pricing page before large runs. */
const USD_PER_M = 16;

/** Readings forced with <sub>. Longest first so 心得帳 wins over 心得, ○△× over △. */
export const READINGS: [string, string][] = [
  ["○△×", "まる、さんかく、ばつ"],
  ["丸新酒造", "まるしんしゅぞう"],
  ["心得帳", "こころえちょう"],
  ["暖簾", "のれん"],
  ["橙丸", "だいだいまる"],
  ["帳場", "ちょうば"],
  ["沿革", "えんかく"],
  ["後継ぎ", "あとつぎ"],
  ["解釈役", "かいしゃくやく"],
  ["一言", "ひとこと"],
  ["商人", "しょうにん"],
  ["商い", "あきない"],
  ["心得", "こころえ"],
  ["次の代", "つぎのだい"],
  ["経緯", "けいい"],
  ["蔵元", "くらもと"],
  ["Claude", "クロード"],
  ["Zoom", "ズーム"],
  ["AI", "エーアイ"],
  ["△", "さんかく"],
];

/**
 * Accents (pron-kana; ' follows the mora where the pitch falls, no mark = flat). Tokyo-style dictionary accents, chosen in the
 * voice trial and kept by Kento on 11/4. These win over READINGS. Add a word here when it still sounds wrong.
 */
export const ACCENTS: [string, string][] = [
  ["営業部長", "エーギョーブ'チョー"],
  ["取引先", "トリヒキサキ"],
  ["ダメ出し", "ダメダシ"],
  ["解釈役", "カイシャクヤク"],
  ["ココロエ", "ココロ'エ"],
  ["一言", "ヒト'コト"],
  ["師匠", "シ'ショー"],
  ["弟子", "デシ'"],
  ["後任", "コーニン"],
  ["作法", "サ'ホー"],
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Text → SSML body: accents (pron-kana) first, then the <sub> readings, then escaped characters. */
export function ssmlBody(text: string, accents: [string, string][] = ACCENTS): string {
  let out = "";
  for (let i = 0; i < text.length; ) {
    const acc = accents.find(([w]) => text.startsWith(w, i));
    const sub = READINGS.find(([w]) => text.startsWith(w, i));
    if (acc) {
      out += `<phoneme alphabet="x-amazon-pron-kana" ph="${esc(acc[1])}">${esc(acc[0])}</phoneme>`;
      i += acc[0].length;
    } else if (sub) {
      out += `<sub alias="${esc(sub[1])}">${esc(sub[0])}</sub>`;
      i += sub[0].length;
    } else {
      out += esc(text[i]);
      i++;
    }
  }
  return out;
}

/** The decided voice settings: one <prosody> around whole sentences, a pause between sentences (none after the last). */
export function toSsml(text: string, pauseMs = VOICE.pauseMs, rate = VOICE.rate): string {
  return `<speak><prosody rate="${rate}%">${ssmlBody(text).replace(/。(?!$)/g, `。<break time="${pauseMs}ms"/>`)}</prosody></speak>`;
}

/** Billed characters ≈ the text Polly reads (tags excluded; <sub> aliases are what it reads). */
export const billedChars = (ssml: string) => ssml.replace(/<sub alias="([^"]*)">[^<]*<\/sub>/g, "$1").replace(/<[^>]+>/g, "").length;

type Results = { official: boolean; before: { match: number }; paths?: { mean: number; taps: { mean: number } } };
/** Numbers in the narration come from results.json, never typed by hand; interim numbers are said to be interim. */
export function fillNumbers(text: string, r: Results): string {
  const pct = (x: number) => String(Math.round(x * 100));
  return text
    .replace("{interim}", r.official ? "" : "途中経過では、")
    .replace("{before}", pct(r.before.match))
    .replace("{after}", r.paths ? pct(r.paths.mean) : "–")
    .replace("{taps}", r.paths ? String(Math.round(r.paths.taps.mean)) : "–");
}

export type Scene = { id: string; kind: "screen" | "anim"; seconds: number; page: string; narration: string; pauseMs?: number; subtitle?: false };
export function loadPlan(): { scenes: Scene[] } {
  const plan = JSON.parse(readFileSync(path.join(__dirname, "scenes.json"), "utf8")) as { scenes: Scene[] };
  const results = JSON.parse(readFileSync(path.join(__dirname, "..", "data/demo/results.json"), "utf8")) as Results;
  for (const s of plan.scenes) s.narration = fillNumbers(s.narration, results);
  return plan;
}

function main() {
  const { values } = parseArgs({ options: { yes: { type: "boolean", default: false }, only: { type: "string" } } });
  const ids = values.only?.split(",");
  const scenes = loadPlan().scenes.filter((s) => s.narration && (!ids || ids.includes(s.id)));
  let chars = 0;
  for (const s of scenes) {
    const ssml = toSsml(s.narration, s.pauseMs);
    chars += billedChars(ssml);
    console.log(`${s.id} (${s.seconds}s, ${billedChars(ssml)} chars)\n  ${ssml}`);
  }
  // Two requests per scene: the audio, and the sentence speech marks (for subtitle timing) — both billed.
  const total = chars * 2;
  console.log(`\n${scenes.length} scenes × 2 requests (mp3 + speech marks), ${VOICE.id} ${VOICE.engine} ${VOICE.rate}%: ${total} billed characters ≈ $${((total / 1e6) * USD_PER_M).toFixed(4)}`);
  if (!values.yes) return console.log("Not called. Add --yes to synthesize.");

  const dir = path.join(OUT, VOICE.id);
  mkdirSync(dir, { recursive: true });
  const polly = (ssml: string, file: string, extra: string[]) =>
    execFileSync("aws", [
      "polly", "synthesize-speech", "--profile", PROFILE, "--region", REGION, "--engine", VOICE.engine, "--voice-id", VOICE.id,
      "--language-code", "ja-JP", "--text-type", "ssml", "--text", ssml, ...extra, file,
    ], { stdio: ["ignore", "ignore", "inherit"] });
  for (const s of scenes) {
    const ssml = toSsml(s.narration, s.pauseMs);
    const mp3 = path.join(dir, `${s.id}.mp3`), marks = path.join(dir, `${s.id}.marks.json`);
    polly(ssml, mp3, ["--output-format", "mp3", "--sample-rate", "24000"]);
    polly(ssml, marks, ["--speech-mark-types", "sentence", "--output-format", "json"]); // the list option must not be last: it would swallow the outfile
    // Speech marks come as JSON lines; keep the start time (ms) of each sentence.
    const times = readFileSync(marks, "utf8").trim().split("\n").filter(Boolean).map((l) => (JSON.parse(l) as { time: number }).time);
    const sec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString());
    writeFileSync(marks, JSON.stringify({ seconds: sec, sentences: times }));
    console.log(`${s.id.padEnd(13)} ${sec.toFixed(2)}s (scene ${s.seconds}s)  sentences at ${times.map((t) => (t / 1000).toFixed(2)).join(", ")}`);
  }
}

if (require.main === module) main();
