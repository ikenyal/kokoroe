# 公開の直前に行うこと（メモ）

リポジトリは今は非公開です。公開するかどうかと、いつ公開するかは Kento が決めます。ここには、そのときの手順を書いておきます。

## 1. 公開の方法（Kento の方針、11/5）: 名前を変えて保管し、同じ名前で作り直す

**削除はしません。** 今の非公開リポジトリは名前を変えて非公開のまま保管し、同じ名前 `kokoroe` で新しいリポジトリを作って、書き換え済みの履歴だけを push して公開します。

- 公開側には、書き換える前のコミット（勤務先のメール、消したセッションの記述）が一切ありません。新しいリポジトリには、手元の書き換え済みの履歴しか入らないためです。
- 取り返しがつきます。保管したリポジトリは消さないので、何かあれば元に戻せます。
- **実行は、Kento の OK の後です**（公開は 11/7 の正式計測と動画の後、提出前の予定）。下の 1〜8 の順に行います。

**権限:** 今の `gh` のトークン（スコープ `repo`）で、名前の変更・作成・公開の切り替えまでできます。削除は使いません（`delete_repo` は持っていません）。うまくいかない操作があれば、その操作だけ Kento が Web 画面で行います。

**名前を変えるときの注意:** GitHub は、名前を変えたリポジトリへ、古い名前からの転送（リダイレクト）を残します。同じ名前で新しいリポジトリを作ると、転送は消え、古い名前は新しいリポジトリを指します。手元の `origin`（`https://github.com/ikenyal/kokoroe.git`）は、そのまま新しいリポジトリを指します。

**手順**（作業ディレクトリは手元の clone）

1. 手元が最新で、書き換え済みの履歴になっていることを確かめます。
   ```bash
   git switch main && git status --short            # 未コミットの変更がない（eval/runs の未追跡ファイルは除く）
   git fetch origin && git rev-parse HEAD origin/main  # 2つが同じ
   ```
2. 公開前の確認（下の「3. 公開前の確認」）をすべて通します。結果をこのファイルに書きます。
3. bundle を取ります（リポジトリの外。保管とは別の、手元の控え）。
   ```bash
   mkdir -p ~/kokoroe-backup
   git bundle create ~/kokoroe-backup/kokoroe-before-publish-$(date +%Y%m%d).bundle --all
   git bundle verify ~/kokoroe-backup/kokoroe-before-publish-$(date +%Y%m%d).bundle
   ```
4. **（Kento の OK の後）** 今のリポジトリの名前を変えます。非公開のままです。
   ```bash
   gh repo rename kokoroe-archive-2026-11 --repo ikenyal/kokoroe --yes
   gh repo view ikenyal/kokoroe-archive-2026-11 --json name,isPrivate   # name が変わり、isPrivate が true
   ```
5. **（OK の後）** 同じ名前で、空の非公開リポジトリを作ります（README・.gitignore・ライセンスは付けない）。
   ```bash
   gh repo create ikenyal/kokoroe --private --description "Kokoroe — an AI apprentice that inherits the unwritten etiquette of doing business (Built with Claude: Japan 2026)"
   ```
6. **（OK の後）** 書き換え済みの `main` だけを push します（作業用のブランチ `night-2026-11-03`・`ui-polish` は push しません）。
   ```bash
   git push -u origin main
   git ls-remote origin                     # refs/heads/main だけで、ハッシュは手元の HEAD と同じ
   ```
7. **（OK の後）** 公開に切り替えます（2 の確認と、README の URL・上限の記載を済ませてから）。
   ```bash
   gh repo edit ikenyal/kokoroe --visibility public --accept-visibility-change-consequences
   ```
8. 認証なしで見られること、旧いコミットが公開側にないことを確かめます。
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://github.com/ikenyal/kokoroe          # 200
   gh api repos/ikenyal/kokoroe/commits?per_page=100 --paginate -q '.[].commit.author.email' | sort -u   # noreply の1行だけ
   ```
   そのあと、新しい clone（認証なし）で README の Quickstart を一度試します。

**戻し方（何かあったとき）:** 新しい `kokoroe` を非公開に戻し（`gh repo edit ikenyal/kokoroe --visibility private --accept-visibility-change-consequences`）、保管した `kokoroe-archive-2026-11` から状況を確かめます。保管側は消さないでください。

旧いハッシュとの対応表は `~/kokoroe-backup/commit-map-20261103.txt` にあります（リポジトリの外）。

## 2. 公開と同時に README に載せるもの（監査 G）

- 公開デモの URL（README の「動かし方」の「_URL は 11/6 に追記_」を置き換える。英・日とも）
- 公開デモの上限: 1日の費用の上限（`KOKOROE_DAILY_USD`。そのときの値）、1セッション・1 IP あたりの回数。上限に当たると記録済みのデータに切り替わること
- 公開版の設定を変えている（例: 上限を $10 にする）なら、その値。変えるときは事前に Kento の OK を取る

## 3. 公開前の確認

**項目と、使うコマンド**（勤務先のドメインはファイルに書かず、環境変数 `WORK_DOMAIN` で渡します）

| 項目 | コマンド | 期待する結果 |
|---|---|---|
| 秘密情報（全履歴） | `git log --all -p \| grep -E -c "sk-ant-[A-Za-z0-9_-]{10,}\|ghp_[A-Za-z0-9]{20,}\|github_pat_\|AKIA[0-9A-Z]{16}\|xox[baprs]-[0-9A-Za-z-]{10,}\|BEGIN [A-Z ]*PRIVATE KEY"` | 1（`scripts/check-secrets.sh` の検査パターン自身）だけ |
| アカウント番号つきの ARN（全履歴） | `git log --all -p \| grep -E -c "arn:aws:[a-z0-9-]*:[a-z0-9-]*:[0-9]{12}"` | 0 |
| 勤務先のメール（全履歴・作者情報） | `git log --all -p \| grep -c -i "$WORK_DOMAIN"` と `git log --all --format='%an %ae %cn %ce %B' \| grep -c -i "$WORK_DOMAIN"` | 0 と 0 |
| 作者・コミッター（全履歴） | `git log --all --format='%ae\|%ce' \| sort \| uniq -c` | noreply の1行だけ |
| セッションの記述（全履歴） | `git log --all -p \| grep -c -i -e "ワークショップ" -e "登壇" -e "講演"`、ほかに当たった行は目で確認 | 0。当たった行は D-047 の説明・`/goal` の公開ドキュメントなど、セッションの内容ではないもの |
| 除外すべきファイル | `git ls-files \| grep -E "(^\|/)\.env($\|\.)\|^\.data/\|node_modules/\|eval/runs/raw/\|\.pem$\|\.key$\|\.bundle$\|video/out/"`（`.env.example` は除く） | なし |
| ライセンス | `LICENSE`（MIT）、`data/NOTICE.md`（架空の世界データの扱い） | ある |
| README の公開 URL・上限 | 「2. 公開と同時に README に載せるもの」 | 公開デモの URL と上限が英・日ともに入っている |
| 秘密情報の検査（今のファイル） | `bash scripts/check-secrets.sh` | 通る |
| 画面写真 | `docs/screens/**/*.png` に URL バーや手元のパスが写っていない | 写っていない（Playwright の撮影はページだけ） |
| 新しい clone | 公開後、認証なしの clone で Quickstart | 動く |

**事前の確認の結果（11/5、Claude。読み取りだけ、何も変更していません）**

- 秘密情報: 全履歴で当たりは1件、`scripts/check-secrets.sh` の GitHub トークンの検査パターン自身。本物のキーやトークンはなし。
- アカウント番号つきの ARN: 0 件。
- 勤務先のドメイン: 全履歴の差分にも、作者・コミッター・コミットメッセージにも 0 件。
- 作者・コミッター: 全 120 コミットが `974175+ikenyal@users.noreply.github.com` だけ（全ブランチ）。
- セッションの記述: 0 件。「speaker」「presented」などで当たった行は、D-047 の説明そのもの、`/goal` の公開ドキュメントの説明、コードのコメント。
- 除外すべきファイル: 追跡されているものはなし。
- LICENSE（MIT）と `data/NOTICE.md`: あり。
- **未了:** README の公開デモの URL と上限（英・日とも「11/6 に追記」のまま）。画面写真の目視の確認。公開後の新しい clone での確認。
