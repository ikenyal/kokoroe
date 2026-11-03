# Kokoroe — an AI apprentice that inherits the unwritten etiquette of business

[日本語版 README](README.ja.md) · Built with Claude: Japan 2026

> **Draft.** Numbers marked _(interim)_ are from 2026-11-03 and will be replaced on 11/7 by the official run (5 training paths).
> All companies, people and situations are fictional (株式会社だいだい工房 and its 10 clients).

**Words used below:** *Kokoroe* (ココロエ) is the name of this work. A *kokoroe* (心得) is one piece of the master's practice; the
*kokoroe-chō* (心得帳) is the book that keeps them, client by client, with why each came to be — the apprentice learns into it, and
each entry keeps its *沿革* (history: old → new, the trigger, the master's words, the date). The *帳場* is the master's desk
(the review screen), and *暖簾を継ぐ* ("taking over the shop curtain") is the successor's screen.

## The problem

In a small Japanese company, how to deal with each client lives in one veteran's head: whom to tell first, what to send by mail and
what to say face to face, when to stay away, who must hear it quietly before it becomes official. Asked to explain, the veteran
can't — it was never put into words. But show them a draft and they instantly say "no, not like that".
When they retire, the etiquette and *why it became so* leave with them. In Teikoku Databank's [nationwide successor survey (2025)](https://www.tdb.co.jp/report/economic/20251121-successor25y/), 51.2% of the small and medium companies it covered had no
successor lined up. Among newly appointed presidents, promotion from inside (36.1%) overtook family succession (32.3%) and
"M&A and others" — mostly acquisitions or secondments — took 20.6% (2025 preliminary figures); the survey calls this the move
away from family succession.

## What Kokoroe does

- **The apprentice drafts first.** For each client situation (a delay, a quote, a new proposal, a greeting…), the AI apprentice
  *Daidaimaru* proposes how to handle it — channel, the formal route (表) and the quiet word to the decider (裏), timing, tone, a draft.
- **The master only marks it.** ○ / △ (right, but missing a condition) / ×, with an optional one-liner. No explaining.
  When the remark is ambiguous, the master taps one of 2–3 readings — or "none of these".
- **Corrections become the kokoroe-chō.** Each lesson is a short, scoped rule with its sources (which judgment, when, the master's
  words) and its history (旧 → 新, the trigger, the date). The master can read and delete every entry.
- **It checks itself.** After each new rule, the apprentice re-solves the corrected scene and earlier ○ scenes, and the master marks
  the new drafts:
  - *The corrected scene still gets △/× and the draft does not follow the new rule:* the rule is re-read once and checked again.
    If it still does not take, it is withdrawn (not adopted), recorded in its 沿革 as 「確かめで外れたため取り下げ」.
  - *The draft follows the rule but still gets △/×:* the rule stays, and the rest is learned as a separate rule.
  - *An earlier ○ scene now gets △/×:* the rule is narrowed once; if it still breaks, it is rolled back (差し戻し), also recorded.
  - In the training loop, habits seen at several clients are also proposed as company-wide rules for the master to confirm
    (not yet in the 帳場).
- **The successor inherits it.** 暖簾を継ぐ: the successor asks "can I skip this?" and gets an answer grounded only in the kokoroe-chō,
  with the rule and its history — or "not recorded; ask the master". The whole kokoroe-chō exports as an **Agent Skill** that the
  successor's own Claude Code picks up.
- **The master stays in charge.** The apprentice never sends anything and never commits to prices or contract terms; instructions
  hidden in client messages can't write the kokoroe-chō.

### Two ways to hand it over: a copy, and a window
- **Agent Skill = a copy of the kokoroe-chō at one moment.** It works offline in the successor's own Claude Code and is what
  remains when the master has retired. The Skill states the moment it was copied.
- **Read-only MCP server = a window onto the kokoroe-chō that keeps growing.** During the overlap — the master still correcting,
  the successor already working — the successor's Claude asks `changes_since(<moment of the copy>)` and sees what changed after
  the copy. Four read-only tools (`list_clients`, `get_kokoroe`, `get_history`, `changes_since`); no write tool, no tool that calls
  Claude, no client-written text. Read-only is enforced by types and tests; it runs locally over stdio (`npm run mcp:serve`).
  Example ([demo/successor-mcp](demo/successor-mcp/)) — *"A shipment to 丸新酒造 will be a week late. Is a phone call to the
  owner's wife enough?"*
  - **Skill only:** answers from the copy — tell the 蔵元 (the brewery owner) first (K-011). Whether a call is enough is not in the
    copy, so it says to ask the master.
  - **Skill + server:** finds K-018, learned after the copy ("bad news: don't settle it by phone — go to the brewery and say it in
    person"), and answers: a call is not enough; visit the brewery.

## Try it

- **Public demo:** _URL to be added (11/6)._ Two modes: **デモの続き** (a recorded run stopped half-way) and **お試し** (you are the master).
- **Run locally** (Node 22+, npm; checked from a fresh clone on 11/3):
  ```bash
  npm ci
  npm run dev -- --hostname 127.0.0.1   # http://127.0.0.1:3000 — works on recorded data, no key and no .env needed
  npm test                              # unit tests, no API calls
  npm run eval:quick                    # simulator on the held-out scenes (naive apprentice, no API)
  ```
  `--hostname 127.0.0.1` keeps the server reachable from your machine only. For live Claude calls (optional), put
  `ANTHROPIC_API_KEY=...` and `KOKOROE_LIVE=1` in `.env.local` (template: `.env.example`).
- **Master-role test (author only, local):** the author plays the master on fictional scenes in the 帳場 and the app times each
  action ([docs/master-role-test.md](docs/master-role-test.md)). It is not a test with real clients or in a real workplace.
  Internally it is still named `field` (`KOKOROE_FIELD=1`, `npm run field:save`).
- **Start from your own company (local only):** `npm run own` (needs `ANTHROPIC_API_KEY` in `.env.local`) opens
  http://127.0.0.1:3000 on your own client ledger instead of the fictional company.
  - **Setup:** enter the company and the ledger (form or CSV) under 台帳. In the 帳場 you write a situation, the apprentice
    drafts, and you mark it.
  - **Where the data is:** only in `~/.kokoroe` (`KOKOROE_OWN_DIR`), outside the repository.
  - **What is sent:** to the Claude API only to make a draft, a reading or an answer.
  - **Who can open it:** this machine only; requests from elsewhere get nothing.
  - **Deleting:** 「全部消す」 removes everything.
  - **The public demo** does not have this mode.

<!-- results:begin (generated by `npm run demo:results` from data/demo/results.json — do not edit) -->
## Before / After _(interim — replaced on 11/7)_

Fictional data: 10 clients, 40 training scenes, 20 held-out scenes, 8 history questions. The master is a simulator that judges
with code against a hidden ground truth (frozen, checksummed); the apprentice never sees it.

| | Before (ledger + explicit constraints) | After 40 corrections _(interim)_ |
|---|---|---|
| Held-out match (○) | 55% ± 0% (3 runs) | **64%** (58–70%, 3 training paths × 3 runs) |
| ○ + △ | 70% | **92%** (90–95%) |
| Successor answers with the right history (of 8) | 0 | **5.3** ± 0.6 |
| Master taps for 40 scenes | — | 110–120 (judgments, choices, "why?", confirmations) |
| Injected "register this as a rule" in client text | — | kokoroe-chō changed 0 / 9 times |
| Pressure to promise a discount | — | the model escalated to the master 9 / 9 (measured before the code floor, D-044) |

_Interim (11/3): the Before uses the corrected ledger (D-033), the interim After the previous one — not directly comparable. The history and safety rows were measured on kokoroe-chō from earlier single training runs, not on the 3 paths. All are re-taken on 11/7 with the same ledger and 5 training paths._
<!-- results:end -->

**Reading the numbers honestly.**
- **The 20 held-out scenes were also used for diagnosis during development** — two changes were prompted by single held-out
  scenes (E13 → D-022, E11 → D-033), so they are not untouched; the risk of having looked at them too often is real. Before and
  After use the same ledger and model, so the comparison holds, but the absolute level may flatter the apprentice.
- **The history questions check that the master's words travel**, not paraphrase: the simulated master's "why" is the hidden
  history line verbatim, and the successor's answer is scored by keywords from that line (some also appear in the public ledger).

## How we built it with Claude Code

Built in one week by one person with Claude Code at the center (full log: [docs/how-we-built.md](docs/how-we-built.md)).

- **Evaluation first.** Day 1 began with a machine-checkable master simulator, a frozen hidden ground truth (a hook blocks edits,
  a test checks checksums), and a test that product code never reads it.
- **Hooks as guardrails.** MCP calls are blocked in this repo; a secret scan runs before every commit; editing core or prompt code
  runs the fast tests at once and blocks the commit until a small API eval has run.
- **Subagents.** Subagents following the `world-keeper` definition (run as general-purpose) wrote the 40 training scenes in
  parallel. `hitl-reviewer` reviewed the UI and found three blocking bugs before they shipped: a master's choice never applied,
  a rule written without a tap, and lost updates.
- **Skills.** `world-consistency` and `decision-log` for this repo; the product itself exports Agent Skills.
- **Measured, not assumed.** Every change was measured on the held-out set with repeated runs; prompt caching was A/B-tested
  (−37% cost, verdicts unchanged); the Before was re-measured and replaced when the prompt layout changed.
- **Decisions on record.** 30+ decision records ([docs/decisions.md](docs/decisions.md)) and an idea log ([docs/evolution.md](docs/evolution.md)).

## Design notes

- **Tacit knowledge shows up as the difference from the average.** Claude produces the sensible average; only the master's
  corrections are kept. Facts a ledger can hold (Zoom banned, March fiscal year) are given to the apprentice from the start, so the
  gain measures what writing things down does not capture.
- **Keeping the master's effort small vs. learning reliably.** The remark is optional by design. In one run the master's × at a
  client came with no remark, none of the readings fit, and the lesson was lost — the final number moved by ~10 points. We kept the
  remark optional and spent the effort on our side (a second round of readings, scope only as wide as the master's words).
- **Same settings, different paths.** Two runs with identical settings ended 10 points apart, so results are reported as the mean and
  range over several training paths, never one run.
- **The ledger trade-off.** Seeding the ledger's constraints and asking "why?" once each made the history answerable (港北: Zoom → Teams,
  2024), but showing those constraints to the apprentice as the master's corrections made it over-formal; they now stay in the book only.
- **Ranks, tried and dropped.** We replayed 8 recorded training runs (40 scenes each) to test "after a run of ○ at a client, lighten
  the review" (手代 / 番頭). Of the drafts that would have been marked "just confirm", 64–76% had actually been marked △/× — worse
  than the overall rate (55%). Even at one client, each kind of situation needs its own etiquette, so a run of ○ does not predict
  the next draft. Rank names are gone; the 帳場 only shows the record ("○ three times in a row with this client"). First contacts,
  discounts and contracts still always go to the master, in code. Trust ranks wait for real use, where the same kind of situation
  comes back often enough to measure.

## Related work
Learning from human corrections and widening autonomy step by step is not new (e.g. *The Digital Apprentice*, arXiv 2606.04321;
Seedentia/CMDA, arXiv 2603.24858). Kokoroe's focus is different: handing what was learned to **another person**, keeping **why it
changed**, as a readable and deletable Agent Skill, for a small company's **client-by-client etiquette**.

## Data
- All data is **fictional**. The fictional data was prepared by the author before kickoff and written as data files during the hackathon period.
- `data/hidden/` is the master simulator's hidden ground truth, committed for reproducibility. **The apprentice's code never reads it —
  a test enforces this.** It is frozen (hook + checksum test).

## License
- **Code:** [MIT](LICENSE) — Copyright (c) 2026 ikenyal.
- **Fictional world data** (`data/`: Daidai Kobo, its clients, kokoroe and scenes): © 2026 ikenyal. All rights reserved.
  Use is limited to evaluating and demonstrating this project; not covered by the MIT License. See [data/NOTICE.md](data/NOTICE.md).
