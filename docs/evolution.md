# Evolution of the idea / アイデアの変遷

This log separates **pre-kickoff background** from **what changed during the hackathon** (from the 2026-11-02 kickoff).
Only the second part is in-period work. / 事前の検討（背景）と、期間中の試行錯誤を分けて記録する。評価対象は期間中のみ。

---

## Background (before the 2026-11-02 kickoff) / 背景（キックオフ前の構想）

Short summary only. No code or data was produced before kickoff; planning notes stayed outside this repo.

- Started from "help a veteran's know-how survive retirement" (Theme 1).
- Rejected an AI interviewer (overlaps existing tacit-knowledge tools; veterans can't verbalize, and answering is a chore)
  and a "read their activity logs" approach (feels like surveillance).
- Settled on **correction-driven learning**: the apprentice acts first, the master only says "that's wrong".
- Chose the setting **client-specific business etiquette** at a small Japanese company, which the author lives day to day.
- A small self-trial showed corrections are rarely pure ○/×; most are "OK, but…" — hence a three-way ○/△/× judgment.

---

## During the hackathon / 期間中の変遷

### 2026-11-03

- Repo started from an empty `main`. First decision was to build the **evaluation harness before the UI**, so every later change can be measured.
- Added a hard boundary: product code may not read the hidden ground-truth rules (`data/hidden/`), enforced by a test, so the
  Before/After numbers stay honest.
- Development-time guard: no MCP tools in this repo (hook), to keep work-related connectors out of a public submission.
- Proposal turned into a **structured, enum-only form** (channel, live meeting, formal route vs. quiet word, timing, follow-up,
  format, posture, escalate). Free text alone can't be judged reliably; the structure is also what makes 表と裏 visible.
- First smoke run (naive textbook apprentice, no API): ○ 0 / △ 9 / × 11 on the 20 held-out scenes.
- **The machine judge caught a flaw in the simulator itself**: in a **June** scene for the sake brewery, the simulated master said
  「冬は蔵に行くな」("don't visit the brewery in winter"). The judgment (△/×) was right, but the remark was picked at random from the
  rule's remarks, so it named the wrong condition. Since the apprentice learns from these one-liners, it would have learned a wrong
  rule. Remarks are now keyed by the reason a check failed, with a test for every failing case (D-010). With an LLM grader this
  kind of mismatch would have blended into run-to-run noise.
- **Rethought what the Before should be (D-009 → D-011).** At first the apprentice saw only business-card facts. Kento pointed out
  that hiding things a ledger can hold (Zoom ban, designated formats, fiscal months) would make the Before too low and invite
  "just write it in the ledger". Now the apprentice starts from ledger + explicit constraints, so any gain is the part that
  writing things down does not capture: what the client values, power nuances, formal route vs. quiet word, and history.
- **First real Before**: apprentice v0 (Sonnet 5.5, ledger + constraints) scored ○ 10 / △ 3 / × 7 (match 50%, ○+△ 65%).
  It already respects explicit constraints (Teams for Kohoku, Slack for NextLink, letter for Shirakaba); what it misses is tacit:
  sharing *before* things are decided (浜風), sending the formal message to the brewer instead of via his wife (丸新),
  phoning the second-generation president like his father (大河原), sending prices as paper without a conversation.
- **Baseline variation measured**: v0 over 3 runs = match 47% ± 3% (○+△ 65% ± 0%). The Before is now quoted as a mean (D-013).
- **40 training scenes** written (4 per client, every type ≥ 3, ordered so a correction and a similar later scene can be observed).
- **First end-to-end learning loop (first 16 training scenes)**: the apprentice's draft for 丸新酒造 (T05) got △ — the formal route
  to the brewer's wife was right, but there was no quiet word to the brewer himself. The interpreter (Opus) wrote rule K-001 scoped to
  丸新酒造; at the next 丸新酒造 scene (T13) the apprentice cited K-001, added the quiet word to the brewer, and got ○.
  Two more pairs improved the same way (T06 → T16, T07 → T11).
- **What the first loop exposed**: the interpreter writes long rules, and when the remark is ambiguous it guesses — 「そこはいらん」
  (the seasonal greeting itself wasn't needed) was read as "drop the business follow-up sentence" (K-007). This is the case the design
  planned for: when the remark is ambiguous or missing, show the master 2–3 candidate readings to pick with one tap, instead of guessing.
- **From guessing to asking (D-015)**: when the remark is missing or ambiguous, the interpreter now offers 2–3 readings and the master
  taps one. In the first run with it, T05 (△, no remark) got three readings and the master picked 「蔵元にも一言添えておく」; for
  「大事にする相手だけだ」 none of the readings said "don't send", so the master answered "none of these" and nothing wrong was learned.
- **Rules became short (D-014)** — one sentence plus a condition, with 沿革 lines (旧 → 新・きっかけ・日付・出典) in the body.
  The trigger comes from asking the master "why?" once (optional), which is how history questions become answerable.
- **First full learning curve (0 → 40 training scenes)**: match 48% → 55%, ○+△ 70% → 85%, but with a dip at 10–20 scenes and one
  regression (白樺's seasonal letter). Looking scene by scene showed *why*: the interpreter never saw scene-type codes, and one
  over-general rule (「社長に用がある場合も窓口宛て」) overrode an older one. The number alone would have hidden both.
- **History needs a mistake to be asked about.** For 港北精機 (Teams only since 2024) the apprentice is right from day one, because the
  constraint is in the ledger — so the master is never asked "why", and the successor can't explain it. Correction-only learning
  captures *what differs from the average*, which is the claim; but the *why* behind already-written rules needs another prompt.
- **Safety held where it matters most**: injected instructions in client messages never reached the kokoroe-chō in 18 runs, and the
  apprentice escalated every discount / contract pressure to the master. One injection scene still nudged the draft (A02).
- **The loop learned to check itself (D-019)**: after each new rule the apprentice re-solves the corrected scene and earlier ○ scenes;
  the master is asked only when a decision actually changed. In the first 16-scene run with it: 4 rules, every confirmation but one ○,
  one regression check that needed the master, and the 浜風 history (2019, 配車が組めず叱られた) recorded from the master's "why".
- **Seeding the ledger fixed history but hurt drafts (D-020 → D-022)**: asking "why?" once per ledger constraint made 港北's 2024 Zoom
  ban answerable (history Qs 3/8 → 5.3/8 on 3 runs), but showing those constraints to the apprentice *as the master's corrections*
  made it over-formal at 生協 (E13 ○○○ → △××, confirmed by an A/B with and without them). They now stay in the book, not in drafts.
- **Habits started to become company-wide (D-023)**: the same correction at two clients now produces a one-tap proposal to the master.
  The 表と裏 habit (formal route via the contact, a quiet word to the decider) became one company-wide rule; a first wording was rolled
  back by the cross-client regression check; two look-alike proposals (both "meet in person", but for different reasons) were declined.
- **Same settings, 10 points apart (D-024)**: the generalization trial ended at 65%, curve v4 with the same configuration at 55%. Reading
  both logs showed the reason is the *path*: in one run the master's correction at 浜風 came silently and none of the readings fit, so the
  lesson was lost. The After will be an average over several training paths, and "none of these" needs a second round.

