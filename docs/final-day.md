# 11/7 の工程と `/goal` の完了条件（下書き）

11/7 は、正式な計測から動画の書き出しまでを、Claude Code の `/goal` で進める予定です。
流れ: `eval:final` → `results.json` → README・画面・動画の数字の差し替え → `video:shoot`。
ここには、そのときに書く完了条件の下書きと、`/goal` の前後に人がすることを書いておきます。
数字はすべて架空のデータ（取引先10社・学習40場面・評価用20場面）でのものです。

## `/goal` について、条件を書く前に押さえること

公式ドキュメント（https://code.claude.com/docs/en/goal ）で確かめた点です。

- **判定のしくみ:** 1ターン終わるたびに、小さく速いモデルが「条件を満たしたか」を判定します。満たしていなければ、Claude は次のターンに進みます。
- **判定の材料は会話に出たものだけ:** 判定役はコマンドを実行せず、ファイルも読みません。そのため、どの条件にも「何を実行して、どの出力で示すか」を書きます。「`npm test` が 0 で終わる」のように、出力で示せる形にします。
- **バックグラウンドの作業:** 作業が走っている間は判定が先送りされます。30分ごとに、様子の確認が入ります。`eval:final` は長いので、バックグラウンドで走らせることになります。
- **ゴールは1つずつ:** 1つのセッションで有効なゴールは1つです。新しく `/goal` を書くと置き換わります。
- **長さと止め方:** 条件は 4,000 字まで。上限は「または N ターンで止める」のように条件の中に書きます。止めるときは `/goal clear`。
- **権限:** `/goal` は権限モードを変えません。AWS・公開・削除の前に OK を取る決まりは、ゴールの中でも同じです。

## ゴールを2つに分ける理由

1. **ゴール A（計測と数字）:** 声の選択とは関係なく進められます。費用がかかるのは主にここです。
2. **ゴール B（動画）:** A の `results.json` を使います。声が決まり、ナレーションの音声ができてから始めます。

1つにまとめると、動画の失敗を直そうとして計測をやり直す、という最悪の道が開いてしまいます。分けておけば、A が済んだあとは計測に戻る理由がありません。

## ゴールの前に（人がすること）

- [ ] **費用の OK（Kento）:** 今の見積りは $9.75、多めに見て $12.23。`--max-usd` の既定は $15.90（多めの見積りの1.3倍）です。1日の上限 $35 の内に収まるかを確かめます。動画の `--live --mcp` の分は、ゴール B の前に見積りを出します。
- [ ] 11/6 の師匠役テストの結果が `docs/results/master-role-test-2026-11-06.json` にあります。
- [ ] 声が決まり、Polly のナレーション（`video/out/audio/`）ができています。AWS を使うので、コマンドを見せて OK を取ってから作ります。s01・s07 の長さもこのときに合わせます。
- [ ] 機能の凍結。計測するコミットの上で `git status --short` が空になっています。計測を始めたあとは `src/`・`app/`・プロンプト・`data/` を変えません。
- [ ] `/goal` は auto mode で使います（ターンごとに止まらないように）。ただし公開・AWS・削除は、auto mode でもゴールの外で OK を取ります。

## ゴール A: 正式な計測と数字の差し替え（条件の下書き）

```text
/goal 11/7 の正式な計測を終え、数字をすべて差し替えた状態にする。次をすべて、コマンドの出力で示すこと。
1. 計測は一度だけ: `npm run eval:final -- --yes` を、git status が空の状態から1回だけ実行した。中断したら `--resume <dir>` で続けるだけで、最初からはやり直さない。`--max-usd` は上げない。上限に当たったら止めて Kento に聞く。
2. 結果: `ls eval/runs/*-final.json` で今日の日付のファイルがあり、`npm run demo:results` を実行した。続けて `node -e 'const r=require("./data/demo/results.json");console.log(r.official,r.before.runs,r.paths.n)'` が `true 6 5` を出す。
3. README・画面の数字: `npm test` が 0 で終わる（README の表が results.json と一致するテストを含む）。`npm run typecheck` も 0 で終わる。
4. 応募フォームの下書き: `grep -nE "〔(before|paths|history|adversarial|正式|師匠役)" docs/submission-draft.md` が何も出さない。末尾の枠の表は「数字の出どころ」の表に書き換えてある。
5. 記録: `docs/how-we-built.md` と `docs/decisions.md` に正式な計測の項がある（数字には「架空の取引先10社・評価用20場面」と書き添える）。`git diff --stat` で、変えたのが docs/、README*、data/demo/、eval/runs/ だけだと示す。
6. 保存: コミットして push した。`git status --short` が空で、`git rev-parse HEAD origin/main` の2行が同じ。
守ること: data/hidden、src/、app/、プロンプトは変えない。公開環境の更新・AWS・MCP ツールは使わない。数字が想定と大きく違っても、計測をやり直さずに止めて報告する。30ターンで止める。
```

**補足**
- 1 の「一度だけ」は、費用を守るためのいちばん大事な条件です。ゴールは満たすまで回り続けるので、「結果が気に入らないからもう一度」を条件の文で先に塞いでおきます。
- 2 の `true 6 5` は、`eval/final.ts` の `FINAL`（Before 6回、学習5本）と同じ値です。設定を変えたら、ここも変えます。
- 3 の README と results.json の一致は、`tests/readme-results.test.ts` が見ています。数字を手で書き写さないための仕組みを、そのまま完了条件に使います。
- 画面（`/keiko`）は `results.json` を直接読むので、2 が済めば変わります。

## ゴール B: 動画の撮影と書き出し（条件の下書き）

```text
/goal 正式な数字で撮った動画を video/out/kokoroe-demo.mp4 に書き出す。次をすべて、コマンドの出力で示すこと。
1. 撮影: `npm run video:shoot -- --live --voice <声> --mcp` が 0 で終わった。サーバーは 127.0.0.1 だけで動かし、`lsof -nP -iTCP:3123 -sTCP:LISTEN` が何も出さない（止まっている）。
2. 長さと形式: `ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 video/out/kokoroe-demo.mp4` の duration が 180.0 以下で、width=1280、height=720。
3. 新しさ: `stat -f '%m %N' data/demo/results.json video/out/kokoroe-demo.mp4` で、mp4 の時刻のほうが新しい。
4. 数字の場面: `npx tsx video/stills.ts --only s09-numbers,s08b-mcp` で静止画を作り、Read で開いた。s09 に「途中経過」が出ておらず、数字が results.json と同じだと、値を並べて示した。
5. 因果の場面: s05 で、T05 への △ のあとに T13 の案が変わっている静止画（または録画の書き出し）を Read で開き、変わった一文を示した。
6. 保存: docs/screens の静止画と video/README.md のチェックをコミットして push した（mp4 は gitignore のまま）。`git status --short` が空。
守ること: 計測（eval:final）はやり直さない。data/、src/、app/ は変えない。動画のアップロードや公開はしない（Kento が見てから）。Polly を呼び直すときは --profile brightflow-sandbox-ikeda で、事前に Kento の OK を取る。20ターンで止める。
```

**補足**
- 4 と 5 は、Claude が画像を開いて「何が写っているか」を言葉にします。判定役は画像を見られないので、その言葉が材料になります。機械では確かめにくい部分なので、ゴールのあとで Kento が通しで見ます。
- 2 の 180 秒は応募の上限（3分）です。目標は 2:45 で、今の仮の版は 2:50（170.0 秒）です。

## ゴールのあと（人がすること）

- [ ] Kento が動画を通しで見る。直すところがあれば、ゴール B の 1〜6 をもう一度（計測には戻らない）
- [ ] 公開環境の更新: 変更点を見せて OK を取ってから
- [ ] `docs/publishing.md` の手順（リポジトリを作り直すかの判断、README の URL と上限〔監査 G〕、公開前の確認）
- [ ] 応募フォームに `docs/submission-draft.md` を写して提出（締切 11/8 20:00 JST）
