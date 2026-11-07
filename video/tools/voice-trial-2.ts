/**
 * Voice trial 2 (Kento 11/7, after watching the whole video): short Polly clips of the words that sound wrong, with two or three
 * ways of saying each, plus the reworded lines (B) and the fixes for the silent stretch and the ending (C), on one local page.
 *   npx tsx video/tools/voice-trial-2.ts          # list the clips, billed characters and the cost; no API call
 *   npx tsx video/tools/voice-trial-2.ts --yes    # synthesize → video/out/audio/trial2/*.mp3 and index.html (Kento picks by ear)
 * Only what the Polly docs list for Japanese is used (checked 11/7): <phoneme alphabet="x-amazon-pron-kana"> (katakana; ' after
 * the mora where the pitch falls, no mark = flat), <sub alias>, <break time>, and <prosody rate> around the whole text.
 * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html · …/phoneme-tag.html · …/ph-table-japanese.html
 * Lexicons are not used (the docs give no Japanese alphabet for them, and uploading one creates an AWS resource).
 * Same voice as the narration (video/narration.ts: Takumi, neural, 105%, 0.3 s between sentences).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { ACCENTS, VOICE, fillNumbers, ssmlBody } from "../narration";

const PROFILE = "brightflow-sandbox-ikeda";
const REGION = "ap-northeast-1";
const OUT = path.join(__dirname, "..", "out", "audio", "trial2");
const USD_PER_M = 16;
const results = JSON.parse(readFileSync(path.join(__dirname, "..", "..", "data/demo/results.json"), "utf8"));
const num = (t: string) => fillNumbers(t, results);

/** One way of saying it: accents (pron-kana) that win over the narration's, and ｜<ms> for an extra pause. */
type Way = { key: string; note: string; text?: string; acc?: [string, string][] };
type Item = { id: string; group: "D" | "B" | "C"; title: string; where: string; text: string; ways: Way[]; memo?: string };

const NOW: Way = { key: "今", note: "いまの本番と同じ指定" };
const items: Item[] = [
  // D. Accents and phrasing (the sentence as it is in the video, so it is heard in place)
  { id: "d01", group: "D", title: "三十年分の作法", where: "s02", text: "取引先ごとの伝え方、三十年分の作法を、部長が一人で担ってきました。", ways: [NOW,
    { key: "A", note: "三十年分＝サンジューネ'ンブン", acc: [["三十年分", "サンジューネ'ンブン"]] },
    { key: "B", note: "三十年分＝サンジュ'ーネンブン", acc: [["三十年分", "サンジュ'ーネンブン"]] },
    { key: "C", note: "三十年分の作法＝サンジューネンブンノサ'ホー（ひと続き）", acc: [["三十年分の作法", "サンジューネンブンノサ'ホー"]] }] },
  { id: "d02", group: "D", title: "メールで送る", where: "s02", text: "後任が、悪い知らせを、決まってからメールで送る。", ways: [NOW,
    { key: "A", note: "メール＝メ'ール、送る＝オクル（平ら）", acc: [["メール", "メ'ール"], ["送る", "オクル"]] },
    { key: "B", note: "メール＝メ'ール、送る＝オク'ル", acc: [["メール", "メ'ール"], ["送る", "オク'ル"]] },
    { key: "C", note: "A ＋「メールで」と「送る」の間に 0.12 秒", text: "後任が、悪い知らせを、決まってからメールで｜120送る。", acc: [["メール", "メ'ール"], ["送る", "オクル"]] }] },
  { id: "d03", group: "D", title: "一つ一つ", where: "s04b", text: "その一つ一つが心得になり、経緯ごと、心得帳に綴られます。", ways: [NOW,
    { key: "A", note: "ヒト'ツヒト'ツ", acc: [["一つ一つ", "ヒト'ツヒト'ツ"]] },
    { key: "B", note: "ヒトツヒト'ツ", acc: [["一つ一つ", "ヒトツヒト'ツ"]] },
    { key: "C", note: "ヒトツヒトツ（平ら）", acc: [["一つ一つ", "ヒトツヒトツ"]] }] },
  { id: "d04", group: "D", title: "心得帳", where: "s04b・s06・s07 ほか", text: "後任が、遅延の連絡のことを聞くと、心得帳が、理由ごと答えます。", ways: [NOW,
    { key: "A", note: "ココロエ'チョー", acc: [["心得帳", "ココロエ'チョー"]] },
    { key: "B", note: "ココロエチョー（平ら）", acc: [["心得帳", "ココロエチョー"]] },
    { key: "C", note: "ココロ'エチョー", acc: [["心得帳", "ココロ'エチョー"]] }] },
  { id: "d05", group: "D", title: "丸新酒造（まるしん しゅぞう）", where: "s05", text: "丸新酒造への、新しい提案です。", ways: [NOW,
    { key: "A", note: "丸新＝マルシン、酒造＝シュ'ゾー（2語に）", acc: [["丸新酒造", "マルシンシュ'ゾー"]] },
    { key: "B", note: "丸新＝マルシン｜0.08秒｜酒造＝シュゾー", text: "丸新｜80酒造への、新しい提案です。", acc: [["丸新", "マルシン"], ["酒造", "シュゾー"]] },
    { key: "C", note: "丸新＝マ'ルシン、酒造＝シュゾー", acc: [["丸新酒造", "マ'ルシンシュゾー"]] }] },
  { id: "d06", group: "D", title: "弟子は", where: "s05 ほか", text: "弟子は、窓口の奥様にだけ送る案を出しました。", ways: [NOW,
    { key: "A", note: "弟子＝デ'シ", acc: [["弟子", "デ'シ"]] },
    { key: "B", note: "弟子＝デシ（平ら）", acc: [["弟子", "デシ"]] }] },
  { id: "d07", group: "D", title: "蔵元へ", where: "s05", text: "裏で蔵元へ、そっと一言。", ways: [NOW,
    { key: "A", note: "クラモト（平ら）", acc: [["蔵元", "クラモト"]] },
    { key: "B", note: "クラ'モト", acc: [["蔵元", "クラ'モト"]] },
    { key: "C", note: "クラモ'ト", acc: [["蔵元", "クラモ'ト"]] }] },
  { id: "d08", group: "D", title: "Claude にも", where: "s07b", text: "心得帳は、手元のClaudeにも渡せます。", ways: [NOW,
    { key: "A", note: "クロ'ード", acc: [["Claude", "クロ'ード"]] },
    { key: "B", note: "ク'ロード", acc: [["Claude", "ク'ロード"]] },
    { key: "C", note: "クロード（平ら）", acc: [["Claude", "クロード"]] }] },
  { id: "d09", group: "D", title: "AI が出すのは", where: "s08", text: "AIが出すのは、平均的な答えです。", ways: [NOW,
    { key: "A", note: "エーア'イ", acc: [["AI", "エーア'イ"]] },
    { key: "B", note: "エ'ーアイ", acc: [["AI", "エ'ーアイ"]] },
    { key: "C", note: "エーアイ（平ら）", acc: [["AI", "エーアイ"]] }] },
  { id: "d10", group: "D", title: "ずれだけを", where: "s08", text: "だから、ずれだけを集めればいい。", ways: [NOW,
    { key: "A", note: "ずれ＝ズレ'", acc: [["ずれ", "ズレ'"]] },
    { key: "B", note: "ずれ＝ズ'レ", acc: [["ずれ", "ズ'レ"]] },
    { key: "C", note: "ずれ＝ズレ（平ら）", acc: [["ずれ", "ズレ"]] }] },
  { id: "d11", group: "D", title: "台帳と", where: "s08b", text: num("架空の10社で、台帳と制約だけの弟子は、{before}%。"), ways: [NOW,
    { key: "A", note: "ダイチョー（平ら）", acc: [["台帳", "ダイチョー"]] },
    { key: "B", note: "ダ'イチョー", acc: [["台帳", "ダ'イチョー"]] },
    { key: "C", note: "ダイチョ'ー", acc: [["台帳", "ダイチョ'ー"]] }] },
  { id: "d12", group: "D", title: "商人は", where: "s09", text: "江戸の商人は、火事のとき、品物より先に、帳面を守ったと伝えられています。", ways: [NOW,
    { key: "A", note: "ショ'ーニン", acc: [["商人", "ショ'ーニン"]] },
    { key: "B", note: "ショーニン（平ら）", acc: [["商人", "ショーニン"]] },
    { key: "C", note: "ショーニ'ン", acc: [["商人", "ショーニ'ン"]] }] },
  { id: "d13", group: "D", title: "弟子が自分から（区切り）", where: "s05", text: "次の根回しの場面では、弟子が自分から、それを添えるようになりました。", ways: [NOW,
    { key: "A", note: "「弟子が」のあとに 0.15 秒", text: "次の根回しの場面では、弟子が｜150自分から、それを添えるようになりました。" },
    { key: "B", note: "「弟子が、自分から」（読点）", text: "次の根回しの場面では、弟子が、自分から、それを添えるようになりました。" },
    { key: "C", note: "弟子が＝デ'シガ、自分から＝ジブンカラ（平ら）", acc: [["弟子が", "デ'シガ"], ["自分から", "ジブンカラ"]] }] },
  { id: "d14", group: "D", title: "シミュレータの師匠（区切り）", where: "s08b", text: num("シミュレータの師匠の、約{taps}回のタップで、平均{after}%に。"), ways: [NOW,
    { key: "A", note: "「シミュレータの」のあとに 0.12 秒", text: num("シミュレータの｜120師匠の、約{taps}回のタップで、平均{after}%に。") },
    { key: "B", note: "シミュレータ＝シミュ'レータ", acc: [["シミュレータ", "シミュ'レータ"]] },
    { key: "C", note: "シミュレータの師匠＝シミュレーターノシ'ショー（ひと続き）", acc: [["シミュレータの師匠", "シミュレーターノシ'ショー"]] }],
    memo: "この文は B の「タップ」の言い換えでも変わります（下の B3）。区切りの直しは、選んだ文に当てます。" },

  // B. Rewording (the sentence that replaces it; spoken with the narration's current settings)
  { id: "b1", group: "B", title: "「冒頭の1行のもとは」", where: "s05（4文目）", text: "冒頭の1行のもとは、裏で蔵元へ、そっと一言。", ways: [NOW,
    { key: "A", note: "最初の手紙の、あの1行とつなげる", text: "冒頭の手紙の、あの1行は、この直しから。裏で蔵元へ、そっと一言。" },
    { key: "B", note: "師匠の一言を先に", text: "師匠の一言は、裏で蔵元へ、そっと一言。冒頭の手紙の、最後の1行です。" },
    { key: "C", note: "短く", text: "冒頭の、あの1行です。裏で蔵元へ、そっと一言。" }],
    memo: "冒頭（s00）の2通の違いの1行は「蔵元様にも、ひとことご挨拶に伺います。」。s05 の画面の師匠の一言は「裏で蔵元に一言」。" },
  { id: "b2", group: "B", title: "「わけと出どころ」", where: "s06", text: "覚えた作法は、わけと出どころごと、心得帳に残ります。", ways: [NOW,
    { key: "A", note: "理由と経緯", text: "覚えた作法は、理由と経緯ごと、心得帳に残ります。" },
    { key: "B", note: "なぜそうなったか", text: "覚えた作法は、なぜそうなったかと一緒に、心得帳に残ります。" },
    { key: "C", note: "どの直しから来たか", text: "覚えた作法は、理由と、どの直しから来たかまで、心得帳に残ります。" }] },
  { id: "b3", group: "B", title: "「タップで」", where: "s08b（2文目）", text: num("シミュレータの師匠の、約{taps}回のタップで、平均{after}%に。"), ways: [NOW,
    { key: "A", note: "印を押したり選んだり", text: num("シミュレータの師匠が、約{taps}回、印を押したり選んだりするだけで、平均{after}%に。") },
    { key: "B", note: "印や選択肢を押した回数", text: num("シミュレータの師匠が、印や選択肢を約{taps}回押すだけで、平均{after}%に。") },
    { key: "C", note: "○△×や選択肢", text: num("シミュレータの師匠が、約{taps}回、○△×や選択肢を押すと、平均{after}%に。") }],
    memo: "数字は正式な計測のまま（平均のタップ数を丸めたもの）。A〜C はいまより長いので、s08b を 1〜2 秒延ばします。" },
  { id: "b4", group: "B", title: "「要れば」（居れば と聞こえる）", where: "s04b（1文目）", text: "師匠は、○△×、要れば一言だけ。", ways: [NOW,
    { key: "A", note: "必要なら", text: "師匠は、○△×、必要なら一言だけ。" },
    { key: "B", note: "あれば（README と同じ言い方）", text: "師匠は、○△×と、あれば一言だけ。" },
    { key: "C", note: "要るときだけ", text: "師匠は、○△×を付けて、要るときだけ一言。" }] },

  // C. The silent stretch at 1:55–2:00 and the ending
  { id: "c1", group: "C", title: "1:55〜2:00 の無音（s07 暖簾を継ぐ）", where: "s07", text: "後任が、遅延の連絡のことを聞くと、心得帳が、理由ごと答えます。", ways: [NOW,
    { key: "A", note: "画面の答えを読む一文を足す（心得帳なし／ありの比べ）", text: "後任が、遅延の連絡のことを聞くと、心得帳が、理由ごと答えます。心得帳がなければ、判断できない。あれば、2019年のいきさつを添えて、いいえ。" },
    { key: "B", note: "短い一文を足す", text: "後任が、遅延の連絡のことを聞くと、心得帳が、理由ごと答えます。いつ、なぜそうなったかまで。" }],
    memo: "いまは声が 5.5 秒で終わり、答えが出たあと約 4.8 秒が無音。案 C（音声なし）: 一文は足さず、場面を 10.5 秒 → 8.5 秒に詰める（答えが見えるのは約 2.5 秒）。画面の答え: 心得帳なし「判断できない」、あり「いいえ」と 2019 年の経緯（README の3枚目と同じ）。" },
  { id: "c2", group: "C", title: "終わり（2:47〜）", where: "s09b", text: "守るべき帳面は、いま、人の頭の中に。ココロエ。直すだけで、心得は次の代へ。", ways: [NOW,
    { key: "A", note: "締めの一言を足す", text: "守るべき帳面は、いま、人の頭の中に。ココロエ。直すだけで、心得は次の代へ。デモとコードは、画面のアドレスから。" },
    { key: "B", note: "最後の一文の前に間を置き、ゆっくり言い切る（0.8 秒）", text: "守るべき帳面は、いま、人の頭の中に。ココロエ。｜800直すだけで、心得は、次の代へ。" }],
    memo: "調べたこと: s09b は 10 秒。声は 9.0 秒で終わり、デモと GitHub のアドレスは 7.0〜7.5 秒に出るので、見えてから 2.5 秒で映像が切れる。フェードアウトも無い。直し方の案は下の「終わりの見本」の動画で見比べられます。" },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function ssml(text: string, acc: [string, string][] = []): string {
  // custom accents first so they win; longest first among them
  const accents = [...acc].sort((a, b) => b[0].length - a[0].length).concat(ACCENTS);
  const body = ssmlBody(text, accents).replace(/｜(\d+)/g, '<break time="$1ms"/>').replace(/。(?!$)/g, '。<break time="300ms"/>');
  return `<speak><prosody rate="${VOICE.rate}%">${body}</prosody></speak>`;
}
const billed = (s: string) => s.replace(/<sub alias="([^"]*)">[^<]*<\/sub>/g, "$1").replace(/<[^>]+>/g, "").length;

function main() {
  const { values } = parseArgs({ options: { yes: { type: "boolean", default: false } } });
  const clips = items.flatMap((it) => it.ways.map((w) => ({ it, w, file: `${it.id}-${w.key === "今" ? "now" : w.key}.mp3`, ssml: ssml(w.text ?? it.text, w.acc) })));
  const chars = clips.reduce((n, c) => n + billed(c.ssml), 0);
  console.log(`${clips.length} clips, ${chars} billed characters ≈ $${((chars / 1e6) * USD_PER_M).toFixed(3)} (${VOICE.id} ${VOICE.engine})`);
  if (!values.yes) { for (const c of clips) console.log(c.file, c.ssml); return console.log("Not called. Add --yes."); }
  mkdirSync(OUT, { recursive: true });
  for (const c of clips) {
    const out = path.join(OUT, c.file);
    if (!existsSync(out))
      execFileSync("aws", ["polly", "synthesize-speech", "--profile", PROFILE, "--region", REGION, "--engine", VOICE.engine, "--voice-id", VOICE.id,
        "--language-code", "ja-JP", "--text-type", "ssml", "--text", c.ssml, "--output-format", "mp3", "--sample-rate", "24000", out], { stdio: ["ignore", "ignore", "inherit"] });
  }
  // Polly sometimes ignores a mark and returns the same audio: say so, so nobody compares two identical clips by ear.
  const hash = (f: string) => createHash("md5").update(readFileSync(path.join(OUT, f))).digest("hex");
  const same = (it: Item, w: Way) => {
    const f = (k: string) => `${it.id}-${k === "今" ? "now" : k}.mp3`;
    const twins = it.ways.filter((o) => o.key !== w.key && hash(f(o.key)) === hash(f(w.key))).map((o) => o.key);
    return twins.length ? `（${twins.join("・")}と同じ音。指定が効いていない）` : "";
  };
  const dur = (f: string) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(OUT, f)]).toString()).toFixed(1);
  const section = (g: Item["group"], h: string) => `<h2>${h}</h2>` + items.filter((i) => i.group === g).map((it) => `
<div class="item"><h3>${esc(it.title)} <small>${esc(it.where)}</small></h3>${it.memo ? `<p class="memo">${esc(it.memo)}</p>` : ""}
${it.ways.map((w) => { const f = `${it.id}-${w.key === "今" ? "now" : w.key}.mp3`; return `<div class="way"><b>${w.key}</b><audio controls preload="none" src="${f}"></audio><span class="t">${esc((w.text ?? it.text).replace(/｜(\d+)/g, (_, ms) => `〔間 ${Number(ms) / 1000}秒〕`))}</span><span class="n">${esc(w.note)}・${dur(f)}秒<b style="color:#8a4b00">${same(it, w)}</b></span></div>`; }).join("")}</div>`).join("");
  const extra = existsSync(path.join(OUT, "endings.html")) ? readFileSync(path.join(OUT, "endings.html"), "utf8") : "";
  writeFileSync(path.join(OUT, "index.html"), `<!doctype html><html lang="ja"><meta charset="utf-8"><title>ナレーションの試し 2（11/7）</title>
<style>body{font:15px/1.6 "Hiragino Sans",sans-serif;max-width:980px;margin:24px auto;padding:0 16px;color:#1f2328;background:#f3f2ee}
h2{border-bottom:2px solid #1f2328;margin-top:36px}.item{border-bottom:1px solid #cfccc4;padding:10px 0}h3{margin:0 0 6px;font-size:17px}h3 small{color:#565b62;font-weight:400;margin-left:8px}
.way{display:grid;grid-template-columns:28px 260px 1fr;gap:8px;align-items:center;margin:4px 0}.way b{color:#2b4a6f}.t{font-size:14px}.n{grid-column:3;font-size:12px;color:#565b62}
.memo{font-size:13px;color:#565b62;margin:2px 0 6px}audio{height:30px;width:260px}video{width:100%;max-width:640px}</style>
<h1>ナレーションの試し 2（Takumi・neural・105%）</h1>
<p>「今」はいまの本番と同じ指定。選ぶときは「丸新酒造 B」のように。D は単語の読み、B は言い換え、C は無音と終わり。指定は Polly の公式ドキュメントにある <code>phoneme（x-amazon-pron-kana）</code>・<code>sub</code>・<code>break</code> だけ（' は音が下がる位置、印なし＝平ら）。</p>
${section("D", "D. 読み方・区切り")}${section("B", "B. 言い換え")}${section("C", "C. 無音の間と終わり")}${extra}
<h2>A. 場面の変わり目の間（音声は作っていません。選んだ D・B・C と一緒に組み立てます）</h2>
<p>次の言葉の前に 0.7 秒の間を足す案: 「でも、この1行が」（s00 の文の間 0.3→1.0 秒）、「中小企業の」（s00→s01）、「取引先ごとの」（s01→s02）、「後任が」（s02 の文の間 0.3→1.0 秒）、「書いて残して」（s02→s03）、「では、部長がいなくなったあと」（s06→s06b）。場面の変わり目は前の場面の最後のコマを延ばし、文の間はナレーションの間を延ばします。合計 約 +4.2 秒。</p>`);
  console.log(`wrote ${path.join(OUT, "index.html")}`);
}
main();
