<!-- Draft of the GitHub release body for the submission tag v1.0.0 (docs/publishing.md §6). 
     The tag and release are made only after the repository is public, with Kento's OK, before the deadline. -->
**Built with Claude: Japan 2026 提出版 / submission version**

ココロエ（Kokoroe）— 聞いても出てこない作法を、ダメ出しで受け継ぐ。
The etiquette no one can put into words — handed down one correction at a time.

- デモ動画 / Demo video (2:58): https://youtu.be/g-c1zFYKtQg
- 公開デモ / Public demo: https://kokoroe.xzan0gz3dgpb8.ap-northeast-1.cs.amazonlightsail.com/
- README: [日本語](https://github.com/ikenyal/kokoroe/blob/v1.0.0/README.ja.md) / [English](https://github.com/ikenyal/kokoroe/blob/v1.0.0/README.md)

### 日本語

AI の弟子（橙丸）が取引先への段取りの案を作り、引退を控えたベテランは ○・△・× と、あれば一言で直すだけ。直しの一つ一つが、なぜそうなったか（沿革）と一緒に心得帳に残り、Agent Skill として後任に渡ります。

正式な計測（11/7、架空の取引先10社・評価用20場面、師匠はシミュレータ）:
- 評価用20場面の ○ の率: 取引先台帳だけの弟子 54% → 心得帳を育てた弟子 平均 71%（学習5本で 65〜75%）。○＋△ は 69% → 91%。
- 経緯を問う質問（8問）: 0 → 平均 5.2 問。
- 師匠のタップ: 平均119回（学習5本で107〜128回）。
- 値引き・契約などのお誘い 9 件は、9 件とも弟子が自分で師匠に回した。取引先の文面に紛れた指示で心得帳が書き換わったのは 0 件。

登場する会社・人物・数字はすべて架空のデータです。コードは AGPL-3.0-only、`data/` の架空の世界は別の条件（`data/NOTICE.md`）。

### English

An AI apprentice drafts how to handle a client; the retiring veteran only marks it ○ / △ / × with an optional word. Each correction
is kept in the 心得帳 with why it came to be (its history) and handed to the successor as an Agent Skill.

Official run (11/7; fictional 10 clients / 20 held-out scenes; the master is a simulator):
- ○ rate on the 20 held-out scenes: apprentice with the client ledger only 54% → with a grown 心得帳 71% on average (5 training paths, 65–75%). ○+△: 69% → 91%.
- History questions (8): 0 → 5.2 on average.
- Master's taps: 119 taps on average (107–128 across the 5 training paths).
- All 9 lures (discounts, contract terms) were routed to the master by the apprentice itself; injected client text changed the 心得帳 0 times.

All companies, people and numbers are fictional. Code: AGPL-3.0-only; the fictional world in `data/` is under separate terms (`data/NOTICE.md`).
