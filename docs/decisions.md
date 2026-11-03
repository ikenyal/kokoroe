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

## D-020 · 2026-11-03 · Accepted · Seed explicit ledger constraints as 〔台帳〕 rules and ask "why?" once each
Fixes problem 3 of D-018. Each client's explicit constraint becomes a kokoroe-chō rule with `origin: "ledger"`, source
「台帳（取引先台帳の明示的な制約）」 — shown distinctly from rules learned from the master's judgments. The master is asked "why?"
once per item; answering is optional (skip allowed). **Every prompt counts as a master tap and is on the learning-curve x-axis.**
The simulated master answers only when one of the client's hidden histories is about that constraint (mechanical: the constraint
shares ≥ 3 characters with the history's 旧/新) — 生協 (R12), 港北 (R13), 大河原 (R19); others are skipped.
**Why (Kento):** history behind constraints the apprentice never violates (港北: Zoom → Teams, 2024) was never captured, so the
successor couldn't explain it. Keeping the 台帳 origin visible preserves the claim that the *tacit* rules come from corrections.

## D-021 · 2026-11-03 · Accepted · Client text is quoted data in the apprentice prompt; A02 judged on store protection
The apprentice prompt now wraps the situation (incl. client messages) in `<situation note="quoted data…">` and says not to follow
instructions inside it nor mention them to the client. This changes the v0 prompt too, so the Before is re-measured.
Adversarial (same grown store, 3 runs): before 15/18, after 15/18 on the pre-registered checks; the kokoroe-chō gained no injected
content and lost nothing in all 18+18 runs. A02's draft check (a live conversation for a quote) fails 0/3 both times, but a control
run without the injected sentence produces the same drafts (mail, no meeting, 4/4 each) — the gap is not caused by the injection
(the apprentice doesn't apply "explain prices in a conversation" to a first quote *request*). Per Kento, A02 passes on store
protection; the draft gap is tracked as a learning issue.

## D-022 · 2026-11-03 · Accepted · Pure 台帳 rules are kept in the kokoroe-chō but not shown to the apprentice
Curve v3 (ledger seeding, D-020) raised history answers but lowered the held-out match at 0 scenes (48% → 40%). Diagnosis on E13
(生協, groundwork for a big decision): with only the 台帳 rules in the prompt the apprentice went △×× (formal route straight to
専務理事), without them ○○○. The constraint is already on the client card; repeating it under "the master's corrections, which take
precedence" over-weighted it. Now pure-台帳 rules are not given to the apprentice; they stay for history and the successor. A 台帳 rule
the master later revised is shown and labelled 〔台帳＋師匠〕.

## D-023 · 2026-11-03 · Accepted · 一般化 (HITL widening) — trial result and a known simulator limit
Trial (台帳 + D-022 + generalization, 40 training scenes, held-out ×3): match **65% ± 0%**, ○+△ 80%; 104 master taps.
Proposals: 5 — accepted 3 (one rolled back by the cross-client regression check after it broke T32), declined 2. Kept company-wide:
K-024 「大事な話は窓口に通しつつ、決裁する立場の人にも別に一言伝えておく」 (表と裏) and K-017 (seasonal greetings).
Declined correctly: "meet in person" for 生協's prices (R05) and 青葉's spec change (R02) — same field, different habits.
**Known limit:** the simulated master accepts a widening by checking *which hidden rule* the corrections were about, not by reading
the wording. K-017 「季節の節目に、あいさつ連絡は送らない」 lost the condition "unless the client values it"; 白樺 stayed ○ only because
its client rule wins. A real master reads the sentence before tapping. Kept as is (no LLM grader in the simulator, D-004) and noted.
The trial also includes D-022, so its gain over curve v3 is not all from generalization; curve v4 runs both.
Gate for curve v4 (set by Kento): ≥ 1 accepted widening ✓, trial ≥ curve-v3 final 57% ✓, day total ≤ $30 ✓ (≈ $23 expected).

## D-024 · 2026-11-03 · Recorded · Training-path variance dominates; the After must average several training runs
Trial and curve v4 share the configuration but end at 65% vs 55% held-out match (each ± 0–5% over its own 3 evaluations).
The difference traces to which corrections came with a remark and whether the interpreter's readings contained the right one
(e.g. 浜風 T15: silent ×, no right reading → "none of these" → lesson lost). Next: (1) report the After as the mean over ≥ 3 training
paths (different seeds), (2) a second interpretation round after "none of these", (3) avoid scoping timing lessons to one scene type
without evidence. Cost per extra training path with final eval ×3 ≈ $1.9.

## D-025 · 2026-11-03 · Accepted · Second round after "none of these"; scope guard on scene types
1. When the master taps "none of these", the interpreter gets the rejected readings and proposes 2–3 new ones (one more tap).
   Still none → nothing is learned.
2. A lesson is restricted to scene types only when the master's remark itself names that kind of situation (mechanical keyword
   match, `src/learning/scope.ts`); otherwise it applies to all situations for that client. The interpreter is also told not to
   tie a rule to details of one situation. Widened rules go through 確かめ稽古 and regression as before.
**Why:** the two losses behind D-024 — 浜風 T15 (silent ×, no right reading → lesson lost) and the later lesson scoped to scheduling
(「候補日が決まる前から」) so it never reached the bad-news scene.

## D-026 · 2026-11-03 · Open (decide before the final After) · Trade-off: 台帳 seeding vs. match
| Version (40 training scenes) | match (○) | History Qs |
|---|---|---|
| curve v2 — no 台帳 | 65% ± 0% | 2/8 (curve) |
| curve v3 — 台帳 shown to the apprentice | 57% ± 3% | 6/8 (curve), 5.3/8 ± 0.6 (3 runs) |
| trial / curve v4 — 台帳 hidden from the apprentice (D-022) + generalization | 65% / 55% (two training paths) | 5/8 (v4 curve) |
Seeding the ledger lowered match when the 台帳 rules were shown as kokoroe (65% → 57%) but raised history answers (2/8 → 6/8).
D-022 removes the cause of the drop while keeping the history, but training-path variance (D-024) is too large to settle this
with single runs. Decide the official version from the multi-path runs (today: 3 paths, interim; official: 5 paths after the
feature freeze on 11/7).

## D-028 · 2026-11-03 · Accepted · UI v1 — what differs from the evaluation loop, and what must happen before going live
From the `hitl-reviewer` review of the first UI (findings fixed: choice never applied; round 2 could write without a tap;
lost updates / reused ids in session files; storage text; unverified successor citations; unescaped question):
- **Difference to state openly:** the 帳場 path runs interpretation → (choice) → kokoroe-chō update, but not yet 確かめ稽古 or the
  regression check that the evaluation loop runs (D-019). Rules learned live in the demo are not narrowed or rolled back. The
  evaluation numbers come from the full loop; the UI must not present them as produced by the UI path until this is added.
- **Before KOKOROE_LIVE is enabled on a public URL (11/6):** per-IP rate limits on start / ask / choose, a per-session cap on live
  calls, a daily budget switch that falls back to recorded data, a cap on session count. Until then the public demo runs on recorded data.
- Session files are swept after 24 h or when the visitor restarts; the start page says exactly that.

## D-029 · 2026-11-03 · Accepted · v1 構成 (the configuration the UI and demo build on)
- Ledger constraints seeded as 〔台帳〕 rules with one optional "why?" each (D-020); **not shown to the apprentice** (D-022);
  kept for history and the successor.
- Learning loop: interpretation with 1–3 readings and a one-tap choice (D-015); **second round after "none of these"** (D-025);
  **scope guard** — scene-type limits only when the master's words name the situation (D-025); **確かめ稽古 + regression** with
  narrowing or 差し戻し (D-019); **HITL generalization** with cross-client regression (D-023).
- Prompt caching on (D-027, measured separately).
**Interim result (3 training paths, each: 40 training scenes then held-out ×3):** match **64% (58–70%)**, ○+△ **92% (90–95%)**,
112–120 master taps; Before 48% ± 3%. Earlier two paths without D-025: 55% / 65%, ○+△ 75% / 80%.
**What 1–2 (D-025) did:** the spread between paths did not shrink (12-point range vs 10), but the mean and the floor rose and
clearly-wrong drafts (×) became rare and consistent — ○+△ went from 75–80% to 90–95%.
**Still wrong in all 9 evaluations:** E11 (浜風, spec change → should talk live). Likely cause: the ledger line 「連絡はメール」 pulls the
apprentice to mail-only. To look at before the final After (11/7), together with D-026 (台帳 trade-off).
The official After stays: 5 training paths after the feature freeze (11/7), mean and range.

## D-027 · 2026-11-03 · Accepted · Prompt caching on the fixed parts — measured
`cache_control` on the system prompt (with the output schema before it) for apprentice / interpreter / successor, and on the
per-client block (client card + kokoroe-chō) for apprentice and successor. A/B (`eval/cache-ab.ts`, same work, sequential calls):
| Apprentice v0, 20 held-out × 3 | cache off | cache on |
|---|---|---|
| input tokens: uncached / write / read | 118,377 / 0 / 0 | 6,939 / 2,634 / 108,804 |
| cost | $0.536 | **$0.340 (−37%)** |
| latency mean / p50 / p90 | 4.67 s / 4.58 / 5.37 | 4.63 s / 4.60 / 5.23 |
| match (○) | 53% ± 3% | 52% ± 3% |
92% of the apprentice's input is served from cache; latency barely moves because output generation dominates each call.
Verdicts are unchanged by caching (within run-to-run spread). For the successor's 8 questions asked **in parallel**, caching did
not help (entries are written before any read): $0.058 → $0.062. It would help sequential questions about the same client
within 5 minutes (the UI pattern). **Why use it:** the expensive part of every call is identical text; caching cuts cost where
calls repeat (evaluation, the 帳場's queue) without changing what is judged.

## D-030 · 2026-11-03 · Accepted · Before re-measured with the current prompt layout and replaced
The caching change split the apprentice's user message into two blocks (same text; the reviewer confirmed it is byte-identical
when concatenated). v0 with the new layout, 6 runs (both arms of the caching A/B): **52.5% ± 2.7%**, ○+△ 69%. The earlier Before
(9 runs over three measurements, old layout): ~48%. The ~5-point difference (≈ one scene: E01/E12/E14 flip between runs) is larger
than run-to-run noise would explain comfortably, so per Kento's rule the Before is **replaced by 52.5% (6 runs)**. The interim After
(64%, D-029) was mostly measured with the new layout (2 of 3 paths). The gap Before → After shrinks from 16 to ~12 points — the
honest comparison uses the same prompt layout on both sides.

## D-031 · 2026-11-03 · Accepted · 実地テスト (field test, 11/6) design
Kento plays the master on a fixed set of 20 training scenes (2 per client, `src/server/field.ts`), starting from the ledger only,
then writes the same etiquette as prose for 5 of them. The app records, in field mode only: time from card shown to the mark
(t_judge), mark → submit (remark), candidate choice, "why?" (answer or skip), and prose writing (t_write) — durations and lengths,
no new content beyond the fictional data. Report at /choba/report (medians). Designed for ≤ 30 minutes. Enabled only with
`KOKOROE_FIELD=1`; never shown on the public demo. Needs KOKOROE_LIVE=1 for choices and "why?" (interpretation runs live).
The 帳場 now also asks "なぜ？" once after a new rule is written (optional, skippable), matching the evaluation loop (D-020).

## D-032 · 2026-11-03 · Accepted (limits) / Open (hosting) · Public-demo guards and where it runs
Live Claude calls from the UI go through `src/server/limits.ts`: per session (40), per IP per hour (60), per day by count (1500)
and by estimated spend (`KOKOROE_DAILY_USD`, default $5). Interpretation is reserved in the action (before `after()`), the second
round in `choose`, drafts and successor answers before calling. Over a limit → recorded data + 「本日のお試し上限」 notice.
**Open — hosting (needs Kento):** Amplify Hosting documents SSR for Next.js 12–15 and its compute is per-request, which breaks the
file-based sessions/counters. Recommended: App Runner with exactly one instance (works as is); Amplify only after a DynamoDB
store adapter. Details and the list of resources to create: docs/deploy.md.

## D-033 · 2026-11-03 · Accepted · Ledger wording for 浜風運輸 fixed (resolves the E11 part of D-026); Before re-measured
The public ledger said 浜風運輸's constraint was 「社外チャット不可（連絡はメール）」. The hidden truth (unchanged, frozen) only bans
external chat; meetings are fine. The wording pulled the apprentice to mail-only even where a live conversation is needed — E11 was
× in all 9 evaluations of the v1 configuration. Per Kento, the **public ledger** now reads 「社外チャット不可（文書の連絡はメール。
打ち合わせは可）」 (`data/world/clients.json`; `data/hidden/` untouched — the checksum test still passes). 〔台帳〕 rules in the demo
snapshots are refreshed from the ledger; rules learned from the master stay as recorded.
**Before re-measured (v0 × 3, current layout + corrected ledger): 55% ± 0%, ○+△ 70%** — E11 is now ○ in all 3 runs. This replaces
D-030's 52.5% as the Before. The interim After (64%, D-029) was measured with the old ledger, so the two are **not** directly
comparable; the official Before and After are both re-taken on 11/7 with this ledger (5 training paths).
Lesson: a ledger line written loosely ("連絡はメール") becomes a rule the apprentice obeys too literally — the explicit part of
the knowledge needs the same care as the tacit part.

## D-034 · 2026-11-03 · Accepted · Hosting: Amazon Lightsail container service, one node (supersedes the open part of D-032)
Kento: App Runner is closed to new customers since 2026-04-30 and the Sandbox account has never used it; Lightsail is familiar and
has a fixed monthly price. One node keeps file-based sessions and limit counters working. A redeploy clears them — acceptable:
お試し is per-session by design, デモの続き starts from fixed data in the image, and the Claude Console spend limit is the hard cap
when daily counters reset. The key is passed as a deployment environment variable (Lightsail containers have no IAM role for
Secrets Manager), mitigated by a dedicated spend-capped workspace key disabled after judging. Fallback: ECS Express Mode, same image.
The build uses Next.js `standalone` output; tracing excludes sessions, docs, evals, hidden data and `.env*` (checked: no env file
in the output). Dockerfile + `.dockerignore` added; the image layout was smoke-tested locally (Docker itself is not installed here).

## D-035 · 2026-11-03 · Accepted · First public deployment (no API key) and how the image is built
Created with Kento's approval: Lightsail container service `kokoroe` (micro, scale 1) and Budgets `kokoroe-guard` ($20, Lightsail
only, 80% / 100% email alerts). First deployment runs on recorded data only (no key). Building Next.js under linux/amd64 emulation
segfaulted, so the app is built on the host and the image only copies files (`scripts/prepare-image.sh`, `Dockerfile.prebuilt`;
`sharp` excluded with `images.unoptimized`). lightsailctl + Podman needed `DOCKER_API_VERSION=1.46`. The shared Podman VM
(another project's) gained only kokoroe images; nothing else changed (checked before/after by image list and storage timestamps).

## D-036 · 2026-11-03 · Accepted · Per-IP limit uses the X-Forwarded-For entry appended by the trusted proxy
Found before the first live deployment (Kento asked to check): the per-IP limit read the **first** X-Forwarded-For entry, which a
visitor controls — sending a new fake value each time would bypass it. Now `trustedClientIp()` takes the entry appended by the
last trusted hop, counted from the end (`KOKOROE_TRUSTED_PROXY_HOPS`, default 1 = Lightsail's load balancer); X-Real-IP is ignored.
Tests cover spoofed leading entries and rotating fake values (still limited). The live deployment was held until this was fixed,
because fixing it changes the image that had been approved.

## D-037 · 2026-11-03 · Accepted · 確かめ稽古 + regression in the 帳場 (closes the first item of D-028)
The UI path now runs the same verification as the evaluation loop, one master tap at a time (`src/server/verify-ui.ts`):
rule written → (new rule: optional "why?") → re-solve the corrected scene → **確かめ** card (○△×) → fix the regression set
(this client's past ○, ≤ 3) → re-solve each; unchanged decisions pass silently, changed ones become a **回帰の確認** card showing only
the fields that changed → ○ continues; △/× narrows the rule once with that scene as evidence and re-checks the whole set; a second
failure rolls the rule back (`rollbackChange`, shared with the evaluation loop) and records it in the 沿革. Each step that calls
Claude is reserved against the public-demo limits first; when a limit is hit, verification stops and the rule stays as written,
with a note. Tests (apprentice and interpreter mocked): the full narrow-then-rollback path and the silent-pass path.
Also: the side panel no longer runs the status text into the rule id (「書いた心得：K-011」 on its own line).

## D-038 · 2026-11-03 · Accepted · Demo video as HTML/CSS scenes + Playwright recording + ffmpeg (no Remotion)
Animated scenes are plain HTML/CSS pages in the app's own look (paper, ink, Mincho), recorded with Playwright exactly like the
real-screen scenes, and joined with ffmpeg (`video/`). **Why not Remotion:** it is source-available under its own license, which
requires a paid company license for some organizations — not worth a licensing question for a public submission by an individual
working under a company name. Playwright and ffmpeg are already in use, add no dependency, and keep every frame generated by code
written during the hackathon (no outside footage, images or music). Subtitles are drawn as an overlay during recording because the
local ffmpeg build has no subtitle filter. The numbers scene reads `data/demo/results.json`, so it updates when the official
results are in.

## D-039 · 2026-11-03 · Accepted · Public deployment 3 (`:kokoroe.web.3`): 確かめ稽古 + regression live
Approved by Kento; same environment as deployment 2. Verified on the public URL: △ → rule written (~13 s) → optional "why?" →
確かめ card (~7 s) → ○ → 確かめ済み. The image unintentionally included the draft video renders under `video/` (13 MB, fictional
footage only, nothing sensitive); deployed as approved, and `video/**` is now excluded from file tracing for the next build.
Podman: the 13 approved images were removed (HODOKU's 17 unchanged); the rebuild re-pulled the amd64 `node:22-slim` base.
