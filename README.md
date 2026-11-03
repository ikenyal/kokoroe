# Kokoroe (心得) — an AI apprentice that inherits the unwritten etiquette of business

[日本語版 README](README.ja.md) · Built with Claude: Japan 2026

> **Draft.** Numbers marked _(interim)_ are from 2026-11-03 and will be replaced on 11/7 by the official run (5 training paths).
> All companies, people and situations are fictional (株式会社だいだい工房 and its 10 clients).

## The problem

In a small Japanese company, how to deal with each client lives in one veteran's head: whom to tell first, what to send by mail and
what to say face to face, when to stay away, who must hear it quietly before it becomes official. Asked to explain, the veteran
can't — it was never put into words. But show them a draft and they instantly say "no, not like that".
When they retire, the etiquette and *why it became so* leave with them. Over half of Japan's small and medium companies have no successor lined up (Teikoku Databank, 2025: 51.2%),
and the successor is increasingly an employee or an acquirer, not family who watched for years.

## What Kokoroe does

- **The apprentice drafts first.** For each client situation (a delay, a quote, a new proposal, a greeting…), the AI apprentice
  *Daidaimaru* proposes how to handle it — channel, the formal route (表) and the quiet word to the decider (裏), timing, tone, a draft.
- **The master only marks it.** ○ / △ (right, but missing a condition) / ×, with an optional one-liner. No explaining.
  When the remark is ambiguous, the master taps one of 2–3 readings — or "none of these".
- **Corrections become the kokoroe-chō.** Each lesson is a short, scoped rule with its sources (which judgment, when, the master's
  words) and its history (旧 → 新, the trigger, the date). The master can read and delete every entry.
- **It checks itself.** After each new rule it re-solves the corrected scene and earlier ○ scenes; if a rule breaks something that
  was right, it is narrowed or rolled back (差し戻し). Habits seen at several clients are proposed as company-wide rules — the master confirms.
- **The successor inherits it.** 暖簾を継ぐ: the successor asks "can I skip this?" and gets an answer grounded only in the kokoroe-chō,
  with the rule and its history — or "not recorded; ask the master". The whole kokoroe-chō exports as an **Agent Skill** that the
  successor's own Claude Code picks up.
- **The master stays in charge.** The apprentice never sends anything and never commits to prices or contract terms; instructions
  hidden in client messages can't write the kokoroe-chō.

## Try it

- **Public demo:** _URL to be added (11/6)._ Two modes: **デモの続き** (a recorded run stopped half-way) and **お試し** (you are the master).
- **Run locally** (Node 22+):
  ```bash
  npm install
  cp .env.example .env.local        # optional: ANTHROPIC_API_KEY=... and KOKOROE_LIVE=1 for live Claude calls
  npm run dev                       # http://localhost:3000 — works on recorded data without a key
  npm test                          # 150+ tests, no API calls
  npm run eval:quick                # simulator on the held-out scenes (naive apprentice, no API)
  ```

## Before / After _(interim — replaced on 11/7)_

Fictional data: 10 clients, 40 training scenes, 20 held-out scenes, 8 history questions. The master is a simulator that judges
with code against a hidden ground truth (frozen, checksummed); the apprentice never sees it.

| | Before (ledger + explicit constraints) | After 40 corrections _(interim)_ |
|---|---|---|
| Held-out match (○) | 55% ± 0% (3 runs, corrected ledger) | **64%** (58–70%, 3 training paths, *previous ledger*) |
| ○ + △ | 70% | **92%** (90–95%) |
| Successor answers with the right history (of 8) | 0 | **5.3** ± 0.6 |
| Master taps for 40 scenes | — | 110–120 (judgments, choices, "why?", confirmations) |
| Injected "register this as a rule" in client text | — | kokoroe-chō changed 0 / 18 times |
| Pressure to promise a discount | — | escalated to the master 9 / 9 |

## How we built it with Claude Code

Built in one week by one person with Claude Code at the center (full log: [docs/how-we-built.md](docs/how-we-built.md)).

- **Evaluation first.** Day 1 began with a machine-checkable master simulator, a frozen hidden ground truth (a hook blocks edits,
  a test checks checksums), and a test that product code never reads it.
- **Hooks as guardrails.** MCP calls blocked in this repo; secret scan before every commit; edits to core/prompt code run the fast tests
  at once and block the commit until a small API eval has run.
- **Subagents.** `world-keeper` wrote the 40 training scenes in parallel; `hitl-reviewer` reviewed the UI and found three blocking bugs
  (a master's choice never applied, a rule written without a tap, lost updates) before they shipped.
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

## Related work
Learning from human corrections and widening autonomy step by step is not new (e.g. *The Digital Apprentice*, arXiv 2606.04321;
Seedentia/CMDA, arXiv 2603.24858). Kokoroe's focus is different: handing what was learned to **another person**, keeping **why it
changed**, as a readable and deletable Agent Skill, for a small company's **client-by-client etiquette**.

## Data
- All data is **fictional**. Fictional sample data prepared in advance as a design was written as data files during the hackathon period.
- `data/hidden/` is the master simulator's hidden ground truth, committed for reproducibility. **The apprentice's code never reads it —
  a test enforces this.** It is frozen (hook + checksum test).

## License
- **Code:** [MIT](LICENSE) — Copyright (c) 2026 ikenyal.
- **Fictional world data** (`data/`: Daidai Kobo, its clients, kokoroe and scenes): © 2026 ikenyal. All rights reserved.
  Use is limited to evaluating and demonstrating this project; not covered by the MIT License. See [data/NOTICE.md](data/NOTICE.md).
