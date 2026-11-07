# Claude Security の点検（2026-11-07）

> 本文のコミット番号は、公開の前の書き換え（11/7）より前のもの。`docs/commit-map-2026-11-07.txt` で今の番号に引ける。 / Commit numbers below are from before the 11/7 rewrite; `docs/commit-map-2026-11-07.txt` maps them to the current ones.

- **何をしたか:** Claude Security（Claude Code のプラグイン、0.12.0）の Scan codebase を、作業ツリー全体に対して1回走らせた。対象は main の `0121ea9`、強さ medium、攻撃面（外から届く本番のコード）に重点。コードは読んだだけで、実行も攻撃の試しもしていない。
- **結果: 検証を通った指摘は 0 件**（「走らせていない」ではなく、走らせて 0 件）。候補は4件あり、3人の検証役（届くか・害があるか・守りがあるか）が4件とも 3対0 で「誤検知」とした。
- **元の出力:** `CLAUDE-SECURITY-<日時>/`（結果の本文・JSONL・SARIF・版の記録）は手元だけに置き、公開リポジトリには入れない（`.gitignore`）。出力の中の秘密の値を伏せる工程も走らせ、伏せるものは 0 件だった。

## 退けられた候補（直す必要はないが、弱いところとして記録）

| 候補 | 場所 | 退けた理由 |
|---|---|---|
| 「自分の会社で始める」が、送られてきた `X-Forwarded-For`・`Host` を信じる | `src/server/own.ts` | この機能は `KOKOROE_OWN=1` で、`127.0.0.1` だけで開くサーバーにしかない。公開版では動かない |
| AWS のプロファイルを守るフックが、一部のコマンドの形を拾わない | `.claude/hooks/guard-aws.sh` | 入力は Claude Code が自分で書くコマンドだけ。自分にかけた決まりで、守りの境目ではない |
| コミット前の秘密の検査が、安全なメールの条件にも合う行を落とす | `scripts/check-secrets.sh` | 入力は自分のコミットの差分だけ。全履歴の Gitleaks が後ろの守り |
| コミット前の秘密の検査が、当たった行を80字まで表示する | `scripts/check-secrets.sh` | 表示先は同じ開発者の端末だけ。CI のログはない |

## どこまで見たか

- 13 のトップレベルのディレクトリはすべて「見た」か「わざと外した」かに分けられた（漏れなし）。
- 見た: `app/`・`public/`、`src/`（server・lib・successor・learning・disciple・core・mcp）、`scripts/`・`.githooks/`・`.claude/`・`spikes/`、`eval/` のコード、`demo/`・`video/`、`tests/`・`data/`。調べ役は 27 人で、27 人とも戻った。
- **わざと外した:** `docs/`（文書と画面写真、実行されない）、`eval/runs/`（計測の記録）。
- **読み切っていない:** 対象の 207 ファイルのうち、結論まで読んだのは 131。残りの 76 は、調べ役が「届いていない」と申告したもの（多くは `tests/`、`video/scenes/` の静的なページ、静的な画面の部品）。`app/dandori.ts` は 80 行目まで。
- メモリ安全の種類の不具合は、言語（TypeScript・シェル・HTML）から対象外とされた。

## 直したもの

なし（指摘 0 件のため。動画に映る画面や動きの変更もなし）。
