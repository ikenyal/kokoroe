# Security / セキュリティ

## Reporting a vulnerability / 脆弱性の知らせ方

Please use GitHub's **Private vulnerability reporting** (the "Security" tab → "Report a vulnerability"). Do not open a public issue
for a vulnerability. No e-mail address is published for this.

脆弱性は、GitHub の **Private vulnerability reporting**（「Security」タブ →「Report a vulnerability」）でお知らせください。
公開の Issue には書かないでください。メールでの受付はしていません。

This is a hackathon entry (Built with Claude: Japan 2026) maintained by one person; replies are best effort.
ハッカソンの作品で、作者一人が見ています。返事はできる範囲で行います。

## What the project guards / 守っていること

- **API key:** server-side only (`.env.local`, never committed; a pre-commit check and Gitleaks over the full history).
  API キーはサーバーの中だけ。コミットしない（コミット前の検査と、全履歴の Gitleaks）。
- **Public demo spend:** per session, per address per hour, and per day (visitors and judges separately), plus a monthly cap in
  the Anthropic Console. When a limit is hit, the demo falls back to recorded data.
  公開版の上限：セッションごと・アドレスごとの1時間・1日（来場者と審査員は別）、Console の月の上限。上限に達すると記録済みのデータで動きます。
- **Judge code:** never in the repository (set only on the deployment), compared in constant time, tries limited per address,
  kept as an httpOnly cookie that cannot be forged without the code. It changes only the limits live AI calls count against (a judges' daily limit, no per-session cap).
  審査用のコード：リポジトリに書かない。比べ方は一定時間、試せる回数に上限、httpOnly の cookie。変わるのは、AI がその場で動くときの上限だけ（審査員用の1日の上限、1回のお試しの回数の上限なし）。
- **The AI never sends or promises anything:** money, contract terms and first contact with key clients always go to the master.
  弟子は何も送らず、約束しない。値引き・契約・大事な取引先への最初の連絡は、必ず師匠へ。
- **Client text cannot rewrite the 心得帳:** only the master's own marks and words become 心得.
  取引先の文面で心得帳は書き換わらない。心得になるのは、師匠の印と言葉だけ。
- **Evaluation integrity:** `data/hidden/` (the simulator's ground truth) is frozen (hook + checksum test), and the product code
  never reads it (an import-boundary test).
  評価の公正さ：`data/hidden/` は凍結（フックとチェックサムのテスト）、製品のコードからは読まない（テストで検査）。
- **Own mode** (「自分の会社で始める」) opens only on 127.0.0.1 and never runs on the public deployment.
  「自分の会社で始める」は 127.0.0.1 だけで開き、公開版では動きません。

The last full scan (Claude Security, 2026-11-07): no verified findings — [docs/audits/claude-security-2026-11-07.md](docs/audits/claude-security-2026-11-07.md).
