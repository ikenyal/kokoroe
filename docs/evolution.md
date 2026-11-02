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
- First smoke run (naive textbook apprentice, no API): ○ 0 / △ 9 / × 11 on the 20 held-out scenes. It exposed a simulator flaw —
  the master's one-liner could name the wrong condition — so remarks are now tied to the reason a check failed.

