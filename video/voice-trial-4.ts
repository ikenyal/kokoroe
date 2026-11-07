/**
 * Voice trial 4 (Kento 11/7): two small things heard in the rebuilt video — 「心得帳に」's に too strong, and 弟子は's intonation.
 * Spoken with the narration's current settings (video/narration.ts, all of Kento's picks applied).
 *   npx tsx video/voice-trial-4.ts [--yes]   → video/out/audio/trial4/index.html
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { ACCENTS, SPEAK_AS, VOICE, ssmlBody } from "./narration";

const OUT = path.join(__dirname, "out", "audio", "trial4");
type Way = { key: string; note: string; acc?: [string, string][] };
const items: { id: string; title: string; where: string; text: string; ways: Way[] }[] = [
  { id: "u1", title: "「心得帳に」の「に」", where: "s06", text: "覚えた作法は、理由と、どの直しから来たかまで、心得帳に残ります。", ways: [
    { key: "今", note: "心得帳＝ココロエチョー（平ら）、に は Polly のまま" },
    { key: "A", note: "心得帳に＝ココロエチョーニ（ひとまとまり・平ら）", acc: [["心得帳に", "ココロエチョーニ"]] },
    { key: "B", note: "心得帳に＝ココロエチョ'ーニ（「ちょう」のあとで下がる）", acc: [["心得帳に", "ココロエチョ'ーニ"]] },
    { key: "C", note: "心得帳に＝ココロエ'チョーニ", acc: [["心得帳に", "ココロエ'チョーニ"]] }] },
  { id: "u2", title: "「弟子は」のイントネーション", where: "s05", text: "弟子は、窓口の奥様にだけ送る案を出しました。", ways: [
    { key: "今", note: "弟子＝デシ（平ら）、読点なしで読む" },
    { key: "A", note: "弟子は＝デ'シワ", acc: [["弟子は", "デ'シワ"]] },
    { key: "B", note: "弟子は＝デシ'ワ（「し」のあとで下がる）", acc: [["弟子は", "デシ'ワ"]] },
    { key: "C", note: "弟子は＝デシワ（ひとまとまり・平ら）", acc: [["弟子は", "デシワ"]] }] },
];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ssml = (text: string, acc: [string, string][] = []) => {
  for (const [shown, said] of SPEAK_AS) text = text.replace(shown, said);
  return `<speak><prosody rate="${VOICE.rate}%">${ssmlBody(text, [...acc, ...ACCENTS])}</prosody></speak>`;
};
const file = (id: string, w: Way) => `${id}-${w.key === "今" ? "now" : w.key}.mp3`;
const { values } = parseArgs({ options: { yes: { type: "boolean", default: false } } });
const clips = items.flatMap((it) => it.ways.map((w) => ({ f: file(it.id, w), s: ssml(it.text, w.acc) })));
const chars = clips.reduce((n, c) => n + c.s.replace(/<sub alias="([^"]*)">[^<]*<\/sub>/g, "$1").replace(/<[^>]+>/g, "").length, 0);
console.log(`${clips.length} clips, ${chars} chars ≈ $${((chars / 1e6) * 16).toFixed(4)}`);
if (values.yes) {
  mkdirSync(OUT, { recursive: true });
  for (const c of clips) if (!existsSync(path.join(OUT, c.f)))
    execFileSync("aws", ["polly", "synthesize-speech", "--profile", "brightflow-sandbox-ikeda", "--region", "ap-northeast-1", "--engine", VOICE.engine, "--voice-id", VOICE.id,
      "--language-code", "ja-JP", "--text-type", "ssml", "--text", c.s, "--output-format", "mp3", "--sample-rate", "24000", path.join(OUT, c.f)], { stdio: ["ignore", "ignore", "inherit"] });
  const hash = (f: string) => createHash("md5").update(readFileSync(path.join(OUT, f))).digest("hex");
  const body = items.map((it) => `<div class="item"><h3>${esc(it.title)} <small>${it.where}</small></h3>${it.ways.map((w) => {
    const twins = it.ways.filter((o) => o.key !== w.key && hash(file(it.id, o)) === hash(file(it.id, w))).map((o) => o.key);
    return `<div class="way"><b>${w.key}</b><audio controls preload="none" src="${file(it.id, w)}"></audio><span class="t">${esc(it.text)}</span><span class="n">${esc(w.note)}${twins.length ? `<b style="color:#8a4b00">（${twins.join("・")}と同じ音）</b>` : ""}</span></div>`; }).join("")}</div>`).join("");
  writeFileSync(path.join(OUT, "index.html"), `<!doctype html><html lang="ja"><meta charset="utf-8"><title>ナレーションの試し 4（11/7）</title>
<style>body{font:15px/1.6 "Hiragino Sans",sans-serif;max-width:980px;margin:24px auto;padding:0 16px;color:#1f2328;background:#f3f2ee}.item{border-bottom:1px solid #cfccc4;padding:10px 0}h3{margin:0 0 6px}h3 small{color:#565b62;font-weight:400}
.way{display:grid;grid-template-columns:28px 260px 1fr;gap:8px;align-items:center;margin:4px 0}.way b{color:#2b4a6f}.t{font-size:14px}.n{grid-column:3;font-size:12px;color:#565b62}audio{height:30px;width:260px}</style>
<h1>ナレーションの試し 4</h1><p>「今」は組み立て直した動画と同じ音。選ぶときは「心得帳に B」のように。今のままでよければ、組み立てた MP4 をそのまま使います。</p>${body}`);
  console.log(path.join(OUT, "index.html"));
}
