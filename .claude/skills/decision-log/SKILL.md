---
name: decision-log
description: How to record work in Kokoroe's three logs (docs/decisions.md, docs/evolution.md, docs/how-we-built.md). Use at the end of a work session, after a design decision, or when the idea changes.
---

# Recording work

## docs/decisions.md — one entry per design decision
`## D-NNN · YYYY-MM-DD · Accepted|Provisional|Superseded · Title`, then the decision, **Why:**, and alternatives.
Never rewrite an old decision; add a new one that supersedes it and mark the old one `Superseded by D-NNN`.

## docs/evolution.md — how the idea changed
Only add under **During the hackathon**, dated (`### 2026-11-DD`). The pre-kickoff **Background** section is closed:
never move pre-kickoff thinking into the in-period section, and never present it as in-period work.
Write what changed and what triggered it (a number from eval, a failed spike, a user test).

## docs/how-we-built.md — Claude Code usage
Under today's date, bullets of the form **Feature** — what it was used for, and what it made possible.
Features: plan mode, subagents (which one), skills (which one), hooks (which one fired and why), headless runs, tests Claude wrote.
Keep each bullet to 1–2 lines. Facts only; no claims that weren't observed.
