# HANDOFF — how to pick this up in a new Claude Code session

A new session (even on another account) starts here. It remembers nothing; this file, `CLAUDE.md` and the logs are the memory.
Updated at the end of every round.

## Where things stand (updated 2026-11-06 19:15 JST)

- Branches: work on `ui-polish`; after each round merge to `main` (`--no-ff`) and push both (normal push, never force).
- Commit author must stay the repository setting: `ikenyal` / the GitHub noreply address (`git config user.email` shows it).
  Check it on a new account before the first commit; do not use the account's own email.
- Freeze moved (Kento 11/6 18:00): improvements continue until **2026-11-07 07:00 JST**.
- Kento's items 23–26 (all "yes", 11/6 evening) are done:
  - 23: s04b's Claude chip says 「案・一言の読み取り・心得の文は Claude の API（既製）」.
  - 24: s01 lost the AI sentence and panel, s02 merged its first two sentences; +6.7 s went to s05 (hold on the right
    column). Narration and the re-shoot are on 11/7 (`video/README.md`).
  - 25: successor prompt plain words (ledger wording, no copy dates for ledger 沿革 lines). hitl-reviewer and the successor
    guard checked it (D-054 second addendum).
  - 26: Kento's first two sentences under the README titles (en/ja).
- Public site: still the old build. First rebuild tonight after Kento OKs the interim freeze report
  (`docs/freeze-report.md`); a second rebuild after 11/7's final version. See "Rebuild" below.
- Console: workspace `kokoroe-public` has a $100/month cap (alert at $50); Kento set it.
- Last round: C 15 (19:08) — live △ → reading → why → check, no fixes needed ($0.099).
  Next eye: D, then A, B, C (after 20:08).
- API spent today on rounds since 18:00: about $0.40 (successor guard 2 × $0.13, C 14 $0.03, C 15 $0.10).

## The 15-minute rotation

- Session cron at :07 / :22 / :37 / :52. **Crons are tied to the session**: after a restart or an account switch, create it again
  (CronCreate, recurring, `7,22,37,52 * * * *`) with the prompt below, and delete any old one (CronList / CronDelete).
- Rules (the full text is the prompt):
  - One eye per round, A → B → C → D (the log's last section says which ran last). Never overlap two rounds.
  - Skip an eye for one cycle after two empty rounds in a row. C (live, costs API) at most once an hour, ≤ $0.5 a run, ≤ $5 a day.
  - A: screenshots (recorded data) → `ui-critic`. B: `judge-critic` on README/submission/video. C: live timed run on the
    production build (`scripts/experience-run.ts`). D: walk-through for contradictions.
  - Free to improve: screens, wording, README, submission draft, video script. Big restructures: write a proposal under
    「池田さんに判断してほしいこと」 in `docs/ui-polish-log.md` instead.
  - Touching the apprentice, learning, evaluation or successor prompts: **only until 11/7 05:00**, and each time run
    `hitl-reviewer` plus `eval:quick` (note: `eval:quick` runs the fixed textbook baseline; for the successor use
    `eval/successor-guard.ts --stores 1 --yes`, ≈ $0.13).
  - Changing the layout of a filmed screen: re-shoot that scene only (`video/shoot.ts --only <id>`) and look at the stills.
  - Each round ends with a log entry in `docs/ui-polish-log.md` and an update of this file.
  - If usage runs low: recreate the cron at :07 / :37 and say so in the log.
- **At 07:00:** start nothing new; write the final freeze report (`docs/freeze-report.md`) and wait for Kento.

## Hard rules to remember (CLAUDE.md has all)

- No MCP tools in this repo. No secrets anywhere. **The judge code value is never written** to the repo, logs or records.
- Local servers bind 127.0.0.1 and are stopped after use, **by PID** (`lsof -tiTCP:<port> -sTCP:LISTEN`); Next renames itself
  to `next-server`, so `pkill` by name misses it.
- AWS only with `--profile brightflow-sandbox-ikeda`, ap-northeast-1, and only after Kento's OK for any change.
- No public redeploy without Kento's OK. `data/hidden/` is frozen.

## Rebuild (only with Kento's OK)

- From `main` at that moment, per `docs/deploy.md`: `KOKOROE_DAILY_USD=10`, `KOKOROE_JUDGE_DAILY_USD=10`, and
  `KOKOROE_JUDGE_CODE` made at that time with `openssl rand` (16+ characters), shown to Kento **once** in the chat, written nowhere.

## Waiting on Kento

- OK on the interim freeze report → first rebuild.
- Submission items 10 and 11 (his own text).
- Item 27: extend the README title quote to his third sentence?

## Next

1. Interim freeze report → Kento's OK → rebuild (above).
2. Continue the rotation until 07:00 (next eye: see the log's last section).
3. 11/7 after the freeze: `eval:final`, narration for s01/s02/s05/s07c/s08b, re-shoot, README numbers, second rebuild.

## The cron prompt (paste as-is when re-creating)

```
15分ごとの改良（Kento 11/6 の指示。11/6 18:00 に凍結を 11/7 07:00 へ変更。決まりの正本は docs/HANDOFF.md と docs/ui-polish-log.md の「毎時の改良の回し方」）。
- 11/7 07:00 を過ぎていたら新しい改良は始めず、「最終の凍結の報告」（docs/freeze-report.md）を書いて Kento を待つ（書き終えていたら何もしない）。
- 前の回がまだ終わっていなければ（作業中・サブエージェントの返事待ち・サーバー起動中など）、この回は何もしない（2つの回を重ねない）。
- そうでなければ、4つの目を1回に1つ、A→B→C→D の順で回す（前回はログの最後の節を見る）。直近2回続けて「直す価値のある指摘なし」の目は次の1巡を飛ばす。C（ライブ）は1時間に1回まで。
A. 画面の目: 公開版と同じ画面のスクリーンショット（記録済みデータ）を撮り、ui-critic に講評させる。
B. 審査員の目: judge-critic に README（日英）・docs/submission-draft.md・動画の静止画と台本・画面のスクリーンショットを読ませ、基準ごとに「点が伸びない理由」を最大5つ、根拠つきで。記録で裏付けられる改良だけ。測っていない効果を足さない（D-062）。
C. 体験の目: 本番ビルドを 127.0.0.1 で動かし、「師匠になって試す」を数件ライブで操作し、秒数・待つ間の表示・つまずく点を測る（1回 $0.5、1日 $5 まで）。秒数はログに。
D. 通しの目: 最初の画面 → デモの続き → 心得帳 → 暖簾を継ぐ → 稽古の記録 → README を記録済みデータでたどり、迷う点・食い違い（画面・README・台本）を直す。
改良の決まり: 画面・文言・README・提出の下書き・動画の台本は自由に改良してよい。構成を大きく変えるものは作らず、案をログの「池田さんに判断してほしいこと」へ。弟子・学習・評価・後任のプロンプトに触れる改良は 11/7 05:00 まで、触れたら毎回 hitl-reviewer と eval:quick。動画に映る画面の配置を変えたら、その場面だけ video/shoot.ts --only で録り直して静止画を確かめる。テスト・tsc・lint が通り記録を更新したら ui-polish から main にマージし、両方を通常の push（force なし）。push できなければログに書き次の回で再試行。
毎回の終わりに、ログに「今回の目・見つけたこと・直したこと・直さなかった理由」を書き、docs/HANDOFF.md の「いまの状態」「次にやること」を更新する。利用の上限が近いと分かったら、この予約を30分ごと（:07・:37）に作り直し、その判断をログに。
守ること: CLAUDE.md の規則（MCP ツールを呼ばない、秘密を出さない、審査用のコードの値をどこにも書かない、サーバーは 127.0.0.1 で使い終わったら止める〔番号で止める〕、公開版の再デプロイは Kento の OK のときだけ）。API の費用は1日 $5 まで。
```
