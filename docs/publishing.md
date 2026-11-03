# 公開の直前に行うこと（メモ）

リポジトリは今は非公開です。公開するかどうかと、いつ公開するかは Kento が決めます。ここには、そのときの手順を書いておきます。

## 1. 旧いコミットを GitHub から消すかどうか（任意。Kento が公開の直前に決める）

2026-11-03 に、作者・コミッターのメールを書き換えて force push しました（監査 A）。

- 書き換える前の旧いコミットは、ハッシュを知っていれば GitHub 上でしばらく見られる場合があります。
- これを確実に消すには、GitHub のリポジトリをいったん削除し、同じ名前で作り直して、書き換え後の履歴を push します。
- 課題（issue）やプルリクエストはないので、失うものはありません。ただし、Star、Watch、リポジトリの設定（説明文・トピックなど）は消えます。
- 今の `gh` のトークンには削除の権限がないので、削除は Kento が Web 画面で行います。

**手順**

1. 手元が最新で、書き換え後の履歴になっていることを確かめます。
   ```bash
   cd path/to/kokoroe   # 手元の clone
   git status --short && git fetch origin && git rev-parse HEAD origin/main   # 2つが同じ
   git log --format='%ae|%ce' | sort | uniq -c                                  # noreply の1行だけ
   ```
2. 念のため、もう一度 bundle を取ります（リポジトリの外）。
   ```bash
   git bundle create ~/kokoroe-backup/kokoroe-before-recreate-$(date +%Y%m%d).bundle --all
   git bundle verify ~/kokoroe-backup/kokoroe-before-recreate-$(date +%Y%m%d).bundle
   ```
3. **Kento が Web 画面で削除します:** GitHub → ikenyal/kokoroe → Settings → General → Danger Zone → Delete this repository。
4. 同じ名前 `ikenyal/kokoroe` で、空のリポジトリを作ります（README・.gitignore・ライセンスは付けない）。Web 画面でも、`gh repo create ikenyal/kokoroe --private` でもかまいません。公開は手順 6 で行います。
5. 手元から push します。
   ```bash
   git push -u origin main
   git ls-remote origin                                   # main だけで、ハッシュは手元の HEAD と同じ
   ```
6. 公開の設定（2 を済ませてから）: Settings → General → Danger Zone → Change visibility → Public。
7. 認証なしで見られることを確かめます。
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://github.com/ikenyal/kokoroe   # 200
   ```

旧いハッシュとの対応表は `~/kokoroe-backup/commit-map-20261103.txt` にあります（リポジトリの外）。

## 2. 公開と同時に README に載せるもの（監査 G）

- 公開デモの URL（README の「動かし方」の「_URL は 11/6 に追記_」を置き換える。英・日とも）
- 公開デモの上限: 1日の費用の上限（`KOKOROE_DAILY_USD`。そのときの値）、1セッション・1 IP あたりの回数。上限に当たると記録済みのデータに切り替わること
- 公開版の設定を変えている（例: 上限を $10 にする）なら、その値。変えるときは事前に Kento の OK を取る

## 3. 公開前の確認

- `bash scripts/check-secrets.sh` が通ること。リポジトリ全体に、勤務先のメールアドレス・アカウント番号・`/Users/` のパスがないこと（監査 #5 の検査の形）
- `docs/screens/*.png` に、URL バーや手元のパスが写っていないこと（監査で未確認の項目）
- README の Quickstart を、認証なしの新しい clone で試せること（今は非公開なので、公開してから一度だけ確かめる）
