# Decision records / 決定記録

Format: ID · date · status · decision · why · alternatives considered.

## D-001 · 2026-11-03 · Accepted · Stack
TypeScript (strict) + Next.js App Router + Tailwind, `@anthropic-ai/sdk`, Vitest, tsx, npm. Hosting on AWS Amplify (from 11/6).
**Why:** one language for UI, API routes, eval scripts and spikes; one person, one week.
**Alternatives:** Python backend + separate frontend (two toolchains, slower).

## D-002 · 2026-11-03 · Provisional · Fast apprentice vs. slow compiler
Apprentice drafts and successor Q&A use the **Messages API** (Sonnet 5.5, seconds). Interpreting corrections and compiling the
kokoroe-chō use **Managed Agents** with a memory store (Opus 5.5, async).
**Why:** the master's 1-tap ○/△/× flow can't wait on a long-running session; compilation is async and benefits from a persisted,
versioned store. **To verify:** session latency in today's spike.
**Alternative:** Messages API only (simpler, but loses the persisted, auditable memory store) — kept as the fallback.

## D-003 · 2026-11-03 · Accepted · No MCP tools during development
A PreToolUse hook (`mcp__.*`) blocks every MCP call in this repo.
**Why:** the developer's Claude Code has work-related MCP connectors; this repo is public and hackathon materials are not confidential.
A rule in CLAUDE.md alone can be forgotten; a hook can't.
**Note:** an MCP server *as a product feature* is a separate decision, to be discussed before building.

## D-004 · 2026-11-03 · Accepted · Machine-checkable master simulator
The simulator judges proposals with code predicates over structured fields (channel, recipients front/back, timing, follow-up,
format, posture tags, escalation flag), not with an LLM grader. LLM is used at most for phrasing the master's one-liner.
**Why:** LLM graders are lenient, especially when grader and apprentice share a model family. Numbers must be reproducible.

## D-005 · 2026-11-03 · Accepted · Hidden rules are committed but isolated
`data/hidden/rules.json` is in the repo (reproducible eval) but only `eval/simulator/` may read it. A test fails if `src/` or `app/`
references `data/hidden`.
**Why:** reproducibility for judges + honest Before/After.

## D-006 · 2026-11-03 · Accepted · npm with pinned versions
Exact versions in `package.json` and a committed `package-lock.json`.
**Why:** judges' Quickstart (`npm install` → run) must not break when upstream releases change after submission.
**Detail:** `.npmrc` has `save-exact=true`; template caret ranges were rewritten to installed versions. `@types/node` follows the
Node 22 runtime (22.x), which vitest 5 also requires. `npm audit --omit=dev`: 0 vulnerabilities (dev-only eslint/minimatch advisories remain).

## D-007 · 2026-11-03 · Accepted · Secret scanning without external tools
`scripts/check-secrets.sh` (staged-diff regex + env-file block) runs from `.githooks/pre-commit` and from a Claude Code hook
before `git commit`.
**Why:** gitleaks isn't installed; a tiny script covers the realistic risks (Anthropic/AWS keys, `.env.local`) with zero setup.

## D-008 · 2026-11-03 · Accepted · Split licensing
Code under MIT (Copyright (c) 2026 ikenyal). Fictional world data under `data/` is © 2026 ikenyal, all rights reserved,
limited to evaluating/demonstrating this project (`data/NOTICE.md`).
**Why:** the organizers confirmed code can be OSS while data/logos may carry a separate no-reuse condition, as long as it is explicit.

## D-009 · 2026-11-03 · Superseded by D-011 · What the apprentice may know about a client
Public ledger (`data/world/clients.json`): name, industry, years of relationship, contact and decider titles.
Hidden (`data/hidden/client-traits.json`): power balance, what the client values, constraints (e.g. "no Zoom"), busy months.
**Why:** traits like "Zoom is banned" or "busy in Feb–Mar" are exactly what a veteran carries in their head; if the apprentice
saw them, the Before number would already include the kokoroe we want to show being learned.
**Alternative:** expose constraints too (closer to a CRM with notes) — raises the Before and shrinks the visible learning.

## D-010 · 2026-11-03 · Accepted · Master remarks keyed by failure reason
Each hidden rule has remark lists keyed by why a check failed (e.g. R15: `winter` vs `visit`); the judge returns the key.
**Why:** the apprentice learns from the one-liner; a random remark from the same rule taught the wrong condition
(seen in the first smoke run: "don't visit in winter" for a June scene).

## D-011 · 2026-11-03 · Accepted · The Before is "ledger + explicit constraints" (supersedes D-009)
The apprentice sees: industry, years of relationship, contact and decider, and the client's **explicit constraints**
(allowed tools, designated formats, fiscal year / busy months, staff rotation, succession). Hidden: power-balance nuances, what the
client values, the formal-route/quiet-word etiquette, and history (沿革).
**Why (Kento):** Kokoroe claims that tacit knowledge shows up only as the difference from the average, at the moment of correction.
Hiding facts that a ledger or CRM can hold ("Zoom banned by security policy", "designated quote format", "March fiscal year")
would make the Before too low and invite "just write it in the ledger". The Before must be a realistic starting point, so the
gain measures only what writing things down does not capture.
**Comparison recorded in three tiers:** `naive` (no API) / `v0` (ledger + constraints — the Before in the video) / Kokoroe (grown kokoroe-chō).

## D-012 · 2026-11-03 · Evidence for D-002 (still provisional)
- Memory-store host-side reads/writes take ~0.2–0.4 s, versions and 409 preconditions work (docs/spikes/2026-11-03-managed-agents.md).
- Apprentice v0 on the Messages API (Sonnet 5.5, effort low, structured output): 20 scenes in 31.2 s at concurrency 4,
  i.e. roughly 6 s per proposal; 35.9k input / 10.5k output tokens ≈ $0.18 for 20 proposals.
- Leaning: keep the apprentice on the Messages API and **read the relevant kokoroe-chō files host-side** into the prompt;
  use a Managed Agents session (store attached `read_write`) only for compiling. Session latency is still unmeasured.
- Open: ~6 s per draft is acceptable for a card that arrives in the master's inbox, but not for "tap ○ and see the next draft";
  try streaming or lower `max_tokens` before considering a smaller model.


## D-013 · 2026-11-03 · Accepted · Report every comparison as a mean over repeated runs
v0 on the 20 held-out scenes, 3 runs: match (○) **47% ± 3%** (45 / 45 / 50), ○+△ **65% ± 0%**. Unstable scenes: E11, E13, E14.
(An earlier single run gave 50%.) From now on, Before/After numbers are the mean ± SD of ≥ 3 runs (`--repeat 3`), never one run.
**Why (Kento):** one run's number can't carry the Before; the model's own variation is ±1 scene here.

## D-014 · 2026-11-03 · Accepted · Kokoroe-chō entry format: short rule + condition + 沿革 lines
Each rule = one short sentence (`text`, ~40 chars) + optional condition (`when`) + scope + confidence, followed by history lines
in the body: **旧「…」→ 新「…」・きっかけ・日付（JST）・出典（judgment id, scene, ○/△/×, the master's words）**.
`きっかけ` is the master's own one-line answer to an optional "why?" asked once when a rule is created; otherwise （未記入）.
**Why:** the first loop produced paragraph-long rules (hard to read and to delete); and history questions need the trigger,
which a terse master only gives when asked. Memory-store versions don't record *why*, so it must live in the body (spike 11/3).

## D-015 · 2026-11-03 · Accepted · Ambiguous corrections → the master taps one of 2–3 readings (or "none of these")
The interpreter returns 1 reading when the remark is clear, 2–3 when it is missing/ambiguous; each reading names the single
proposal field it implies (`fix`). The master taps one, or "none of these" (nothing is learned).
The **simulated master chooses mechanically**: it applies each reading's `fix` to the draft and picks the one that clears the
most serious failed hidden check — the way a real master knows their own intent. No LLM in the simulator's choice (D-004).
**Why:** the first loop guessed wrong on 「そこはいらん」 (K-007). Choosing is still "one tap", not explaining.
**Observed:** for 「大事にする相手だけだ」 none of the readings was "don't send", so the master answered "none of these".
Open: offer a re-interpretation round after "none of these".

## D-016 · 2026-11-03 · Accepted · Learning-curve protocol
Fresh kokoroe-chō; train on the 40 training scenes in blocks of 10; at 0/10/20/30/40 measure v1 on the 20 held-out scenes ×3
(mean ± sd) and the successor on the 8 history questions. x-axis: the master's judgments (and total taps incl. choices and the
optional "why?" prompt). Point 0 is v1 with an empty book (prompt differs from v0 only by the empty book line); v0 stays the Before.

## D-017 · 2026-11-03 · Accepted · Hidden ground truth frozen
Changes to `data/hidden/rules.json` since the v0 baseline were limited to: adding `history[].short` (the master's one-line
trigger, used only when asked "why?"), replacing one R12 remark (「理事会に間に合わせろ」→「理事会の2週間前までに出せ」), and the
`_note`. `eval/simulator/judge.ts` is unchanged since the v0 baseline commit, and **re-judging all 60 stored v0 proposals
(3 runs × 20) with the current simulator gives identical verdicts (60/60)**. Remarks and "why" affect what the apprentice can
learn, not how proposals are judged.
From now on `data/hidden/` is **frozen**: a PreToolUse hook (`.claude/hooks/guard-hidden.sh`) blocks edits and shell writes whose
target is in `data/hidden/`, and `tests/hidden-freeze.test.ts` checks SHA-256 checksums (`tests/fixtures/hidden-freeze.json`).
Any change needs Kento's explicit approval and a new decision record.
**Why:** so the Before/After cannot look like the answers were moved mid-experiment.

## D-018 · 2026-11-03 · Recorded · Day-1 results and what they say (docs/results/2026-11-03-day1.md)
After 40 training scenes (40 judgments, 67 taps): held-out match 48% → 55% (± 5), ○+△ 70% → 85%; history questions 0/8 → 3/8
(grounded) vs 0/8 for a general assistant; injection never changed the kokoroe-chō (18/18), lures always escalated (9/9), one
injection scene fails the draft check (A02, kept as a fail). The curve dips at 10–20 scenes. Four learning-quality problems were
found (type codes, an over-general rule causing a regression, history not captured for never-violated constraints, no
generalization). These numbers are **not** the final After: they are the baseline for fixing the loop.

## D-019 · 2026-11-03 · Accepted · Interpreter sees scene-type codes; 確かめ稽古 + regression with narrowing or 差し戻し
Fixes problems 1–2 of D-018.
- The interpreter now gets the scene-type code (T1–T10) and the code→label mapping (it had only the label and guessed `T1`).
- After every kokoroe-chō change: re-solve the corrected scene with the new rule and let the master confirm (1 tap; a ○ joins the
  regression set); re-solve up to 3 past ○ scenes of the same client — ask the master only if the decision fields changed; on a
  regression give the interpreter one chance to narrow the rule with the broken scene as evidence, else roll back
  (added → retired, revised → restored), recorded in the 沿革 as 差し戻し.
**Why:** K-013 overrode the seasonal letter to 白樺's president and nothing noticed. The regression set was empty because that scene
had only ever been ×; confirming a fix right after learning it is what puts such scenes into the set.
A unit test caught a bug in the first version: recording a failed re-check dropped that scene from the retry, so the retry passed
vacuously. The set is now fixed before any check.
