/**
 * Voice trial 3 (Kento 11/7): the six words still to settle, spoken with the readings already chosen in trial 2, plus a check
 * clip of the video's last seconds and the 「作者」 wording options. Same tags as trial 2 (Polly docs: phoneme x-amazon-pron-kana /
 * x-amazon-yomigana, sub, break, prosody rate).
 *   npx tsx video/voice-trial-3.ts          # list clips and cost; no API call
 *   npx tsx video/voice-trial-3.ts --yes    # → video/out/audio/trial3/*.mp3 and index.html
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { ACCENTS, VOICE, ssmlBody } from "./narration";

const PROFILE = "brightflow-sandbox-ikeda";
const REGION = "ap-northeast-1";
const OUT = path.join(__dirname, "out", "audio", "trial3");
const USD_PER_M = 16;

/** Chosen by Kento in trial 2 (11/7) — every clip here uses them, so the words are heard as they will be. */
export const CHOSEN: [string, string][] = [
  ["三十年分の作法", "サンジューネンブンノサ'ホー"], // C
  ["シミュレータの師匠", "シミュレーターノシ'ショー"], // C
  ["丸新酒造", "マルシンシュ'ゾー"], // A
  ["心得帳", "ココロエチョー"], // B
  ["蔵元", "クラモト"], // A
  ["弟子", "デシ"], // B
  ["AI", "エーア'イ"], // A
  ["ずれ", "ズレ'"], // A
  ["台帳", "ダイチョー"], // A
  ["商人", "ショーニ'ン"], // C
];

type Way = { key: string; note: string; text?: string; acc?: [string, string][]; yomi?: [string, string][] };
type Item = { id: string; title: string; where: string; text: string; ways: Way[]; memo?: string };
const NOW: Way = { key: "今", note: "試し2で決めた読みだけ（この言葉は指定なし、または前回の指定）" };

const items: Item[] = [
  { id: "t1", title: "取引先ごとの", where: "s02（三十年分の作法の文）", text: "取引先ごとの伝え方、三十年分の作法を、部長が一人で担ってきました。", ways: [NOW,
    { key: "A", note: "取引先ごとの＝トリヒキサキゴトノ（ひとまとまり・平ら）", acc: [["取引先ごとの", "トリヒキサキゴトノ"]] },
    { key: "B", note: "取引先ごとの＝トリヒ'キサキゴトノ", acc: [["取引先ごとの", "トリヒ'キサキゴトノ"]] },
    { key: "C", note: "取引先＝よみがな「とりひきさき」（アクセントは Polly に任せる）", yomi: [["取引先", "とりひきさき"]] }],
    memo: "「今」は本番の指定（取引先＝トリヒキサキ）。" },
  { id: "t2", title: "メールで送る（平らに）", where: "s02", text: "後任が、悪い知らせを、決まってからメールで送る。", ways: [NOW,
    { key: "A", note: "メールで送る＝メールデオクル（ひとまとまり・印なし＝平ら）", acc: [["メールで送る", "メールデオクル"]] },
    { key: "B", note: "メールで＝メールデ（平ら）、送る＝オクル（平ら）を別々に", acc: [["メールで", "メールデ"], ["送る", "オクル"]] },
    { key: "C", note: "よみがな「めーるでおくる」（アクセントは Polly に任せる）", yomi: [["メールで送る", "めーるでおくる"]] }] },
  { id: "t3", title: "一つ一つが", where: "s04b", text: "その一つ一つが心得になり、経緯ごと、心得帳に綴られます。", ways: [NOW,
    { key: "A", note: "一つ一つが＝ヒト'ツヒト'ツガ（ひとまとまり）", acc: [["一つ一つが", "ヒト'ツヒト'ツガ"]] },
    { key: "B", note: "一つ一つが＝ヒト'ツヒトツガ", acc: [["一つ一つが", "ヒト'ツヒトツガ"]] },
    { key: "C", note: "一つ一つが＝ヒトツヒト'ツガ", acc: [["一つ一つが", "ヒトツヒト'ツガ"]] }] },
  { id: "t4", title: "Claude にも", where: "s07b", text: "心得帳は、手元のClaudeにも渡せます。", ways: [NOW,
    { key: "A", note: "Claudeにも＝クロ'ードニモ（ひとまとまり）", acc: [["Claudeにも", "クロ'ードニモ"]] },
    { key: "B", note: "Claude＝よみがな「くろーど」", yomi: [["Claude", "くろーど"]] },
    { key: "C", note: "Claudeにも＝クロード'ニモ", acc: [["Claudeにも", "クロード'ニモ"]] }],
    memo: "試し2の A（クロ'ード だけを指定）は「今」と同じ音でした。助詞まで含めてひとまとまりで指定すると効くかを試します。" },
  { id: "t5", title: "弟子が自分から（C の区切りのまま）", where: "s05", text: "次の根回しの場面では、弟子が自分から、それを添えるようになりました。", ways: [
    { key: "今", note: "試し2の C（デ'シガ ＋ ジブンカラ）", acc: [["弟子が", "デ'シガ"], ["自分から", "ジブンカラ"]] },
    { key: "A", note: "デシガ（平ら）＋ ジブンカラ（平ら）", acc: [["弟子が", "デシガ"], ["自分から", "ジブンカラ"]] },
    { key: "B", note: "デシ'ガ ＋ ジブンカラ", acc: [["弟子が", "デシ'ガ"], ["自分から", "ジブンカラ"]] },
    { key: "C", note: "デ'シガ ＋ ジブ'ンカラ", acc: [["弟子が", "デ'シガ"], ["自分から", "ジブ'ンカラ"]] }] },
  { id: "t6", title: "「理由と、どの直しから来たかまで」（試し2の C）", where: "s06", text: "覚えた作法は、理由と、どの直しから来たかまで、心得帳に残ります。", ways: [NOW,
    { key: "A", note: "どの直しから＝ドノナオシカラ（平ら）", acc: [["どの直しから", "ドノナオシカラ"]] },
    { key: "B", note: "どの直しから＝ド'ノナオシカラ", acc: [["どの直しから", "ド'ノナオシカラ"]] },
    { key: "C", note: "B ＋ 来たかまで＝キ'タカマデ", acc: [["どの直しから", "ド'ノナオシカラ"], ["来たかまで", "キ'タカマデ"]] }] },
  { id: "t7", title: "「弟子は」の直後の間を短く", where: "s05", text: "弟子は、窓口の奥様にだけ送る案を出しました。", ways: [NOW,
    { key: "A", note: "声だけ読点を外す（字幕は「弟子は、」のまま）", text: "弟子は窓口の奥様にだけ送る案を出しました。" },
    { key: "B", note: "読点の代わりに 0.12 秒", text: "弟子は｜120窓口の奥様にだけ送る案を出しました。" }] },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function ssml(text: string, acc: [string, string][] = [], yomi: [string, string][] = []): string {
  const accents = [...acc].sort((a, b) => b[0].length - a[0].length).concat(CHOSEN, ACCENTS);
  // yomigana words are swapped for a private-use placeholder first, so no accent or <sub> wraps them too
  let t = text;
  yomi.forEach(([w], i) => (t = t.replace(w, String.fromCharCode(0xe000 + i))));
  let body = ssmlBody(t, accents);
  yomi.forEach(([w, y], i) => (body = body.replace(String.fromCharCode(0xe000 + i), `<phoneme alphabet="x-amazon-yomigana" ph="${y}">${esc(w)}</phoneme>`)));
  body = body.replace(/｜(\d+)/g, '<break time="$1ms"/>').replace(/。(?!$)/g, '。<break time="300ms"/>');
  return `<speak><prosody rate="${VOICE.rate}%">${body}</prosody></speak>`;
}
const billed = (s: string) => s.replace(/<sub alias="([^"]*)">[^<]*<\/sub>/g, "$1").replace(/<[^>]+>/g, "").length;
const file = (it: Item, w: Way) => `${it.id}-${w.key === "今" ? "now" : w.key}.mp3`;

const AUTHOR = `<h2>画面に出る「作者」（言い換えの案。選んでいただいてから直します）</h2>
<table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px;background:#fff">
<tr><th>場所</th><th>今</th><th>案 A</th><th>案 B</th><th>案 C</th></tr>
<tr><td><b>動画 s02</b>（0:27〜0:41 の画面の下の一文。直すなら s02 だけ撮り直し、HTML の場面でライブではない）</td><td>作者が初見で ○ を付けた18件のうち、15件は、師匠なら直す案でした。<br><small>…経緯を知らない作者が師匠役をし…</small></td><td>つくった本人が初見で ○ を付けた18件のうち…<br><small>…経緯を知らない本人が師匠役をし…</small></td><td>経緯を知らない者が初見で ○ を付けた18件のうち…<br><small>…経緯を知らない者（つくった本人）が師匠役をし…</small></td><td>池田（ikenyal）が初見で ○ を付けた18件のうち…</td></tr>
<tr><td><b>README の引用の署名</b>（日・英）</td><td>— 作者 ／ — the author</td><td>— 池田 健人（ikenyal） ／ — Kento Ikeda (ikenyal)</td><td>— ikenyal</td><td>— つくった人 ／ — the maker</td></tr>
<tr><td><b>README の本文</b>（日 約 12 か所、英 約 12 か所。例:「作者自身が架空の場面で師匠役を」「作者が師匠役になり」「一部は作者が短くした」「ご相談は作者まで」）</td><td>作者 ／ the author</td><td>署名で名前を示し、本文は「作者」のまま</td><td>本文も「私」（一人称）に</td><td>本文は「つくった本人」に</td></tr>
<tr><td><b>アプリ</b>（師匠役テストのボタン「（作者用・所要時間を記録します）」と、そのまとめの一文。手元だけの機能で、公開版にも動画にも出ない）</td><td>作者用 ／ 作者が師匠役を務めた</td><td>そのまま</td><td>「開発者用」「開発者が師匠役を務めた」</td><td>「手元の試し用」「師匠役を務めた範囲の」</td></tr>
</table>
<p class="memo">名前を出す案（A・C）: 提出の下書きのチーム名・メンバー欄にはすでに「Kento Ikeda（GitHub: ikenyal）」があり、公開リポジトリに入ります。コミットの作者は ikenyal（noreply）。</p>`;

function main() {
  const { values } = parseArgs({ options: { yes: { type: "boolean", default: false } } });
  const clips = items.flatMap((it) => it.ways.map((w) => ({ it, w, f: file(it, w), ssml: ssml(w.text ?? it.text, w.acc, w.yomi) })));
  const chars = clips.reduce((n, c) => n + billed(c.ssml), 0);
  console.log(`${clips.length} clips, ${chars} billed characters ≈ $${((chars / 1e6) * USD_PER_M).toFixed(3)}`);
  if (!values.yes) { for (const c of clips) console.log(c.f, c.ssml); return console.log("Not called. Add --yes."); }
  mkdirSync(OUT, { recursive: true });
  for (const c of clips) {
    const out = path.join(OUT, c.f);
    if (!existsSync(out))
      execFileSync("aws", ["polly", "synthesize-speech", "--profile", PROFILE, "--region", REGION, "--engine", VOICE.engine, "--voice-id", VOICE.id,
        "--language-code", "ja-JP", "--text-type", "ssml", "--text", c.ssml, "--output-format", "mp3", "--sample-rate", "24000", out], { stdio: ["ignore", "ignore", "inherit"] });
  }
  // The video's last seconds as they are now (2:50–2:57), to hear the closing line from the file itself.
  const end = path.join(OUT, "end-check.mp4");
  if (!existsSync(end)) execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "170", "-i", path.join(__dirname, "out", "kokoroe-demo.mp4"), "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", end]);
  const hash = (f: string) => createHash("md5").update(readFileSync(path.join(OUT, f))).digest("hex");
  const dur = (f: string) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(OUT, f)]).toString()).toFixed(1);
  const same = (it: Item, w: Way) => { const t = it.ways.filter((o) => o.key !== w.key && hash(file(it, o)) === hash(file(it, w))).map((o) => o.key); return t.length ? `（${t.join("・")}と同じ音。指定が効いていない）` : ""; };
  const body = items.map((it) => `<div class="item"><h3>${esc(it.title)} <small>${esc(it.where)}</small></h3>${it.memo ? `<p class="memo">${esc(it.memo)}</p>` : ""}
${it.ways.map((w) => `<div class="way"><b>${w.key}</b><audio controls preload="none" src="${file(it, w)}"></audio><span class="t">${esc((w.text ?? it.text).replace(/｜(\d+)/g, (_, ms) => `〔間 ${Number(ms) / 1000}秒〕`))}</span><span class="n">${esc(w.note)}・${dur(file(it, w))}秒<b style="color:#8a4b00">${same(it, w)}</b></span></div>`).join("")}</div>`).join("");
  writeFileSync(path.join(OUT, "index.html"), `<!doctype html><html lang="ja"><meta charset="utf-8"><title>ナレーションの試し 3（11/7）</title>
<style>body{font:15px/1.6 "Hiragino Sans",sans-serif;max-width:1040px;margin:24px auto;padding:0 16px;color:#1f2328;background:#f3f2ee}
h2{border-bottom:2px solid #1f2328;margin-top:36px}.item{border-bottom:1px solid #cfccc4;padding:10px 0}h3{margin:0 0 6px;font-size:17px}h3 small{color:#565b62;font-weight:400;margin-left:8px}
.way{display:grid;grid-template-columns:28px 260px 1fr;gap:8px;align-items:center;margin:4px 0}.way b{color:#2b4a6f}.t{font-size:14px}.n{grid-column:3;font-size:12px;color:#565b62}
.memo{font-size:13px;color:#565b62;margin:2px 0 6px}audio{height:30px;width:260px}video{width:100%;max-width:640px}td{vertical-align:top}</style>
<h1>ナレーションの試し 3（Takumi・neural・105%）</h1>
<p>どの音声も、試し2で決まった読み（三十年分の作法 C、心得帳 B、丸新酒造 A、弟子 B、蔵元 A、AI A、ずれ A、台帳 A、商人 C、シミュレータの師匠 C）を当てています。選ぶときは「取引先ごとの B」のように。</p>
<h2>読み方（6つ）と「弟子は」の間</h2>${body}
<h2>締めの声の確かめ（今の MP4 の 2:50〜2:57 をそのまま切り出したもの）</h2>
<div class="item"><video controls preload="metadata" src="end-check.mp4"></video>
<p class="memo">調べた結果: 今の MP4 では、締めの「直すだけで、心得は次の代へ。」は 2:53.1〜2:56.0 に入っていて、音量もほかと同じ（平均 −23.8 dB。ほかの場面は −24〜−25 dB）。そのあと映像は 1 秒で終わる（2:57.0）。ファイルの中では切れていないので、聞こえなかったのは、終わる直前で再生が止まった・最後の 1 秒で閉じられた、などが考えられます（手元では確かめられません）。この切り出しで聞こえるか確かめてください。本番では、見本 1 のとおり声のあとに約 3.5 秒置き、最後の 1 秒でフェードアウトするので、声は終わりの 4 秒以上前に言い終わります。組み立てたあとに、最後の声の終わりと動画の終わりの間を測って表に書きます。</p></div>
${AUTHOR}`);
  console.log(`wrote ${path.join(OUT, "index.html")}`);
}
main();
