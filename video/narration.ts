/**
 * Narration with Amazon Polly (ja-JP, neural) for the scenes whose text does not depend on evaluation numbers.
 *   npx tsx video/narration.ts                          # show SSML, billed characters and the cost estimate; no API call
 *   npx tsx video/narration.ts --yes                    # synthesize → video/out/audio/<voice>/<id>.mp3 + compare.html
 *   npx tsx video/narration.ts --yes --voices Takumi --only s02-ledger
 * Polly is called through the AWS CLI with the sandbox profile only (CLAUDE.md). Words that are easy to misread are
 * replaced with <sub alias="…"> (supported by neural voices), so the text on screen and in subtitles stays as written.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const PROFILE = "brightflow-sandbox-ikeda";
const REGION = "ap-northeast-1";
const OUT = path.join(__dirname, "out", "audio");
/** Scenes whose narration does not depend on numbers (s05/s06/s08/s09 are finalized on 11/7). */
export const SCENES = ["s01-hook", "s02-ledger", "s03-head", "s04-title", "s07-how", "s10-end"];
export const VOICES = ["Kazuha", "Tomoko", "Takumi"]; // ja-JP neural voices in ap-northeast-1 (describe-voices, 11/3)
/** Neural voices: USD per 1M billed characters (SSML tags are not billed). Check the Polly pricing page before large runs. */
const USD_PER_M = 16;

/** Readings forced with <sub>. Longest first so 心得帳 wins over 心得. */
export const READINGS: [string, string][] = [
  ["○△×", "まる、さんかく、ばつ"],
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
  ["AI", "エーアイ"],
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function toSsml(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; ) {
    const hit = READINGS.find(([w]) => text.startsWith(w, i));
    if (hit) {
      out += `<sub alias="${esc(hit[1])}">${esc(hit[0])}</sub>`;
      i += hit[0].length;
    } else {
      out += esc(text[i]);
      i++;
    }
  }
  // A short pause after each sentence keeps the pace readable.
  return `<speak>${out.replace(/。/g, '。<break time="300ms"/>')}</speak>`;
}

/** Billed characters ≈ the text Polly reads (tags excluded; <sub> aliases are what it reads). */
export const billedChars = (ssml: string) => ssml.replace(/<sub alias="([^"]*)">[^<]*<\/sub>/g, "$1").replace(/<[^>]+>/g, "").length;

function main() {
  const { values } = parseArgs({ options: { yes: { type: "boolean", default: false }, voices: { type: "string" }, only: { type: "string" } } });
  const plan = JSON.parse(readFileSync(path.join(__dirname, "scenes.json"), "utf8")) as { scenes: { id: string; seconds: number; narration: string }[] };
  const ids = values.only ? values.only.split(",") : SCENES;
  const voices = values.voices ? values.voices.split(",") : VOICES;
  const scenes = plan.scenes.filter((s) => ids.includes(s.id));
  let chars = 0;
  for (const s of scenes) {
    const ssml = toSsml(s.narration);
    chars += billedChars(ssml);
    console.log(`${s.id} (${s.seconds}s, ${billedChars(ssml)} chars)\n  ${ssml}`);
  }
  const total = chars * voices.length;
  console.log(`\n${scenes.length} scenes × ${voices.length} voices (${voices.join(", ")}) = ${total} billed characters ≈ $${((total / 1e6) * USD_PER_M).toFixed(4)} (neural $${USD_PER_M}/1M)`);
  if (!values.yes) return console.log("Not called. Add --yes to synthesize.");

  const rows: string[] = [];
  for (const v of voices) {
    mkdirSync(path.join(OUT, v), { recursive: true });
    for (const s of scenes) {
      const file = path.join(OUT, v, `${s.id}.mp3`);
      execFileSync("aws", [
        "polly", "synthesize-speech", "--profile", PROFILE, "--region", REGION,
        "--engine", "neural", "--voice-id", v, "--language-code", "ja-JP",
        "--text-type", "ssml", "--text", toSsml(s.narration), "--output-format", "mp3", "--sample-rate", "24000", file,
      ], { stdio: ["ignore", "ignore", "inherit"] });
      const sec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
      console.log(`${v.padEnd(7)} ${s.id.padEnd(11)} ${sec.toFixed(1)}s / ${s.seconds}s${sec > s.seconds ? "  ← too long" : ""}`);
      rows.push(`<tr><td>${v}</td><td>${s.id}</td><td>${sec.toFixed(1)} / ${s.seconds} s</td><td><audio controls preload="none" src="${v}/${s.id}.mp3"></audio></td></tr>`);
    }
  }
  writeFileSync(
    path.join(OUT, "compare.html"),
    `<!doctype html><meta charset="utf-8"><title>ナレーション聞き比べ</title><style>body{font-family:sans-serif;padding:24px}td{padding:4px 12px}</style>` +
      `<h1>ナレーション聞き比べ（Amazon Polly ja-JP neural）</h1><table>${rows.join("")}</table>`,
  );
  console.log(`\n→ ${path.relative(process.cwd(), path.join(OUT, "compare.html"))}`);
}

if (require.main === module) main();
