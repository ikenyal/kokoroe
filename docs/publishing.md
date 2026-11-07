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
| ライセンス | `LICENSE`（AGPL-3.0-only。11/7 に MIT から変更、D-069）、`data/NOTICE.md`（架空の世界データの扱い） | ある |
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
- LICENSE（11/5 の時点は MIT。11/7 に AGPL-3.0-only へ変更、D-069）と `data/NOTICE.md`: あり。
- **未了:** README の公開デモの URL と上限（英・日とも「11/6 に追記」のまま）。画面写真の目視の確認。公開後の新しい clone での確認。

**公開前の確かめ（11/7、Claude。読み取りと検査だけ。チェックリストに合わせて、どこまで確かめたかを分けて書く）**

| 項目 | 確かめた方法 | 結果 | 確かめていない範囲 |
|---|---|---|---|
| 秘密（全履歴、Gitleaks） | `gitleaks git . --log-opts="--all" --redact`（8.30.1、Homebrew で入れた） | 270 コミットを走査、当たり1件。`tests/fixtures/hidden-freeze.json` の `data/hidden/` のファイルの sha256（ファイル名がキーの JSON）を、汎用の鍵の規則が拾ったもの。誤検知 | 差分のないコミット（マージ）は Gitleaks の走査の外。全参照の非マージ 272 のうち 270（残り2つは差分なし） |
| 秘密（全履歴、既存の検査） | 上の表の `git log --all -p \| grep …`、`bash scripts/check-secrets.sh` | 本物のキー・トークンなし。当たりは検査パターン自身。`check-secrets` は通る | 画像の中の文字（検索できない）。下の「画面と動画」で目で確かめた |
| アカウント番号つきの ARN（全履歴） | 上の表のコマンド | 0 件 | — |
| 勤務先のドメイン（全履歴・作者情報） | 上の表のコマンド（`WORK_DOMAIN` は環境変数で渡し、ファイルに書かない） | 0 件・0 件 | — |
| 作者・コミッター（全履歴） | `git log --all --format='%ae\|%ce' \| sort \| uniq -c` | 全 438 コミットが noreply の1行だけ | — |
| セッションの記述（全履歴） | 上の表のコマンド | 当たり1件。この表のコマンドの文字列そのもの | — |
| ローカルの設定 | `git check-ignore -v .claude/settings.local.json`、`git ls-files` | `.claude/settings.local.json` は `.gitignore` で除外、追跡なし。Claude Security の出力 `CLAUDE-SECURITY-*/` も除外（11/7 に足した。要約だけ `docs/audits/`） | — |
| `.env` | `.env.example` の中身、`git check-ignore -v .env .env.local .env.production` | `.env.example` はあり、`ANTHROPIC_API_KEY=` は空、ほかは既定値の注（モデル名・数の上限）だけ。`.env`・`.env.*` は除外、追跡なし（`.env.example` だけ追跡） | — |
| 除外すべきファイル | 上の表のコマンド | 追跡なし | — |
| 公開したくない作業の残り（11/7 に追加） | `git ls-files \| grep -E 'CLAUDE-SECURITY\|(^\|/)\.DS_Store$\|\.(log\|tmp\|swp\|bak\|orig)$\|~$\|(^\|/)(\.next\|\.image\|\.data\|tmp\|scratchpad)/\|\.bundle$\|\.webm$\|\.mp4$\|\.mp3$'`、`git status --porcelain`、`git ls-files eval/runs` | 当たりなし（11/7）。Claude Security の出力・録画と音声・ビルドの出力・一時ファイルは追跡なし。`eval/runs/` の追跡は、記録として残す計測の要約 31 件だけ（古い未追跡の計測は 11/7 にリポジトリの外へ移した）。作業ツリーに未追跡のファイルなし | 公開の直前（手順1）にもう一度 |
| 画面と動画 | 静止画（`docs/screens/video-final/`・公開版の `docs/screens/public-v5-*`・エラー画面）と MP4 の各場面を目で確かめた（ui-critic の点検を含む） | API キー・審査用のコード・アカウント番号・内部の値は写っていない。審査用のコードの欄は `type="password"`（点で隠れる）。エラー画面に出るのは Next.js の「問い合わせ用の番号」（中身のない識別子）だけ | `docs/screens/` の 1,207 件の画面写真のうち、目で見たのは今回の点検に使ったもの。ほかは撮影の仕組み（Playwright でページだけ）に頼る |
| コードの脆弱性 | Claude Security の Scan codebase（全体、medium、攻撃面に重点）→ 要約は `docs/audits/claude-security-2026-11-07.md` | 要約を参照 | 要約の Coverage を参照 |
| LICENSE・NOTICE | `LICENSE`（AGPL-3.0-only、D-069）、`data/NOTICE.md` | ある | — |

## 4. 公開したあとに GitHub で設定すること（実行は公開のとき。Kento の OK のあと）

新しい公開リポジトリ `ikenyal/kokoroe` で、Settings から:

1. **Code security → Secret scanning を有効に**（公開リポジトリは既定で有効のことが多い。有効になっているかを確かめる）。
2. **Push protection を有効に**（秘密を含む push を止める）。
3. **Collaborators and teams:** Kento だけ（ほかの人・チームを足さない）。
4. **Branches → main のルール（ブランチ保護）:** force push を禁止、削除を禁止。直接の push は Kento だけなので、レビュー必須にはしない。
5. **Actions → General:** このリポジトリはワークフローを持たない。Actions を使わないなら「Disable actions」、使うなら「Allow ikenyal, and select non-ikenyal, actions」で最小に。Workflow permissions は「Read repository contents permission」（読み取りだけ）。
6. **Code security → Private vulnerability reporting を有効に**（`SECURITY.md` が案内している窓口。「Enable」を押す）。gh でもできる:
   ```bash
   gh api -X PUT repos/ikenyal/kokoroe/private-vulnerability-reporting
   gh api repos/ikenyal/kokoroe/private-vulnerability-reporting   # {"enabled":true}
   ```
7. 確かめ: 認証なしで clone し、README の Quickstart（`npm ci`・`npm test`・`npm run dev -- --hostname 127.0.0.1`）が通ること。

## 5. リポジトリの見え方（公開のあと、Kento の OK で gh から設定）

- **About の説明文（英語の一行）:** The etiquette no one can put into words — handed down one correction at a time. An AI apprentice that inherits the unwritten etiquette of business.
- **Website:** https://kokoroe.xzan0gz3dgpb8.ap-northeast-1.cs.amazonlightsail.com/
- **Topics:** claude, claude-code, anthropic, built-with-claude, tacit-knowledge, human-in-the-loop, nextjs, mcp, agent-skills

```bash
gh repo edit ikenyal/kokoroe \
  --description "The etiquette no one can put into words — handed down one correction at a time. An AI apprentice that inherits the unwritten etiquette of business." \
  --homepage "https://kokoroe.xzan0gz3dgpb8.ap-northeast-1.cs.amazonlightsail.com/" \
  --add-topic claude,claude-code,anthropic,built-with-claude,tacit-knowledge,human-in-the-loop,nextjs,mcp,agent-skills
gh repo view ikenyal/kokoroe --json description,homepageUrl,repositoryTopics   # 確かめ
```

- **Social preview（API では設定できないので Kento が画面で）:** リポジトリの Settings → General →「Social preview」の「Edit」→「Upload an image…」で `app/opengraph-image.png`（1200×630、40KB 足らず）を選ぶ。保存後、リポジトリの URL を Slack や Discord に貼ってプレビューに出ることを確かめる。

## 6. 提出版のタグとリリース（案。付けるのは手順6〔公開〕のあと、Kento の OK で）

提出した版が後から分かるように、提出する main のコミットに注釈つきのタグを付け、リリースを作る。締切（11/8 20:00）より前に行う（締切の後はコミットもタグもしない）。

```bash
git switch main && git pull --ff-only
git tag -a v1.0.0 -m "Built with Claude: Japan 2026 提出版 / submission version"
git push origin v1.0.0
gh release create v1.0.0 --title "v1.0.0 — Built with Claude: Japan 2026 提出版" --notes-file docs/release-v1.0.0.md --verify-tag
```

リリースの本文は `docs/release-v1.0.0.md`（日英。動画の URL は `YOUTUBE_URL` を置き換えてから）。


## 7. 公開の直前の履歴の書き換え（作業の途中の画面写真を全履歴から除く。手順6の中。実行は Kento の OK のあと）

**決めたこと（Kento 11/7）:** 公開リポジトリには、`scripts/publish/keep-screens.txt` の画面写真（126 件: README や記録から名指しでリンクしているもの、動画の最終の静止画、審査用のコードの画面、README の冒頭、公開版 v5）だけを残す。それ以外の `docs/screens/` は全履歴から除く（講評の繰り返し・試し撮り・ドライランなど約 1,100 件、約 1.1 GB）。試しの clone で、pack は 780 MB → 約 37 MB（11/7）。

**いつ:** 手順5（公開版の2回目の作り直し）と README の `YOUTUBE_URL` の差し替えが済み、main に足すものがなくなったあと、公開の手前。書き換えたあとは、非公開の今のリポジトリに force push しない（書き換えは公開用の新しい clone の中だけで行い、新しい公開リポジトリに push する。今の非公開のリポジトリは §1 のとおり名前を変えて保管）。

**手順（公開の手前で Kento に見せて OK を取ってから）**

1. 手元の main が最新で、未コミットの変更がないことを確かめる（§1 の手順1〜3。bundle の控えも取る）。
2. 書き換えの前に、普通のコミットで次を main に入れて push する（書き換えたあとの履歴にそのまま残る）:
   - README（日英）の「Git の履歴について」に一文: 「公開の前（11/7）に、作業の途中の画面写真（講評の繰り返しの撮影など約 1,100 枚、約 1.1 GB）を全履歴から除きました。残した画面写真は、README や記録からリンクしているものだけです。」（英語も同じ内容）
   - `docs/ui-polish-log.md` の冒頭に一行: 「このログが指す途中の画面写真は、公開リポジトリの全履歴から除いた（11/7）。非公開の保管リポジトリ kokoroe-archive に残っている。」
   - 本文にコミット番号のあるファイル（`docs/decisions.md`・`docs/freeze-report.md`・`docs/ui-polish-log.md`・`docs/audits/2026-11-03.md`・`docs/audits/claude-security-2026-11-07.md`・`docs/deploy.md`・`docs/HANDOFF.md`）の冒頭に一行: 「本文のコミット番号は、公開の前の書き換え（11/7）より前のもの。`docs/commit-map-2026-11-07.txt` で今の番号に引ける。」
3. 除く一覧を作る（そのときにリンクされている画面写真も自動で残す）:
   ```bash
   python3 scripts/publish/screens-plan.py > ~/kokoroe-backup/remove-screens-20261107.txt   # 件数は標準エラーに出る
   ```
4. 公開用の新しい clone の中で書き換える（今の作業ディレクトリは触らない）:
   ```bash
   git clone --no-local --single-branch --branch main ~/git/ikenyal/kokoroe ~/kokoroe-publish
   cd ~/kokoroe-publish
   git config user.name ikenyal && git config user.email 974175+ikenyal@users.noreply.github.com   # 新しい clone は手元の設定を引き継がない（11/7 の試しで、map のコミットが PC 全体の設定の勤務先のアドレスになった）
   git filter-repo --invert-paths --paths-from-file ~/kokoroe-backup/remove-screens-20261107.txt
   git filter-repo --replace-text ~/kokoroe-backup/replace-emails.txt   # Kento のメールアドレス（noreply 以外）を全履歴で <email> に置き換える（Kento 11/8）。ファイルはリポジトリの外、権限 600。中身（アドレス==><email> の行）は画面にもログにも出さない
   cp .git/filter-repo/commit-map docs/commit-map-2026-11-07.txt   # 旧→新（old new の2列。0000… は空になって除かれたコミット）
   git add docs/commit-map-2026-11-07.txt && git commit -m "Commit map of the 11/7 rewrite (in-progress screenshots removed from history)"
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   ```
   （filter-repo は origin を外す。push 先は §1 の新しい公開リポジトリを `git remote add origin …` で足す。）
5. 書き換えたあとに確かめて、結果を下の表に書く:

   | 項目 | コマンド | 結果 |
   |---|---|---|
   | テスト | `npm ci && npm test` | （全件通る） |
   | リンク切れ | README・SECURITY・docs（`docs/ui-polish-log.md` の画面写真へのリンクは除く）の相対リンク・画像の確かめ（11/7 に使ったリンクの検査と同じもの） | （0 件） |
   | 秘密（全履歴） | `gitleaks git . --log-opts="--all" --redact` | （当たりは既知の誤検知だけ） |
   | 作者・コミッター | `git log --all --format='%ae\|%ce' \| sort \| uniq -c` | （noreply の1行だけ） |
   | 勤務先の名前 | 全履歴の差分とメッセージで、勤務先のドメインを数える（`git log --all -p --format=%B \| grep -ci <ドメイン>`。ドメインはここに書かない） | （0 件） |
   | 作者のメールアドレス（どのドメインも。noreply を除く） | 全履歴の差分とメッセージで、`replace-emails.txt` のアドレスと、noreply 以外のメールアドレスの形の文字列を数える（値は出さず件数だけ） | （0 件） |
   | 大きさ | `git count-objects -vH`（size-pack） | （約 40 MB 以下の見込み） |
   | コミット数 | `git rev-list --count main`（書き換え前との差は、空になって除かれたコミット） | （書き換え前 −2 の見込み） |

6. 結果を Kento に見せて OK を取ってから、§1 の手順で新しい公開リポジトリに push する。
