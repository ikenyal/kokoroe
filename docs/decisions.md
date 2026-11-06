# Decision records / 決定記録

Format: ID · date · status · decision · why · alternatives considered.

## D-001 · 2026-11-03 · Accepted · Stack

_Hosting part superseded by D-034 (Lightsail container service instead of Amplify)._
TypeScript (strict) + Next.js App Router + Tailwind, `@anthropic-ai/sdk`, Vitest, tsx, npm. Hosting on AWS Amplify (from 11/6).
**Why:** one language for UI, API routes, eval scripts and spikes; one person, one week.
**Alternatives:** Python backend + separate frontend (two toolchains, slower).

## D-002 · 2026-11-03 · Accepted (settled 11/3; see "Decision" below) · Fast apprentice vs. slow compiler

_The first plan is kept below as written. As decided: the interpreter is a Messages API call (Opus) and the kokoroe-chō is local JSON by default; the memory store is an opt-in adapter (`KOKOROE_STORE=memory`)._
Apprentice drafts and successor Q&A use the **Messages API** (Sonnet 5.5, seconds). Interpreting corrections and compiling the
kokoroe-chō use **Managed Agents** with a memory store (Opus 5.5, async).
**Why:** the master's 1-tap ○/△/× flow can't wait on a long-running session; compilation is async and benefits from a persisted,
versioned store. **To verify:** session latency in today's spike.
**Alternative:** Messages API only (simpler, but loses the persisted, auditable memory store) — kept as the fallback.

### D-002 — material for the decision (2026-11-03, prepared before the decision)
**What exists now:** `src/learning/memory-store.ts` implements the same `KokoroeStore` interface on a Managed Agents memory store
(one JSON file per rule under `/rules/` with its 沿革 in the body, one per judgment under `/judgments/`; writes with the
`content_sha256` precondition, one retry on 409). `KOKOROE_STORE=memory` makes each 帳場 session create and seed its own store
(deleted when the session is swept); **the default stays local JSON**, and evaluation always uses local JSON. A parity test runs
the same operations on both stores (fake API, no network).

| | Local JSON (now) | Memory store (`KOKOROE_STORE=memory`) |
|---|---|---|
| Speed (measured, `spikes/managed-agents/adapter-check.ts`) | ~0–2 ms per call | start a session (16 rules + 27 judgments): **2.1 s**; listRules / rulesFor ~0.23–0.25 s; addJudgment 0.73 s; saveRule ~0.5 s. A draft gets +0.25 s on ~5 s; background learning +2–3 s on ~13 s |
| Model cost | none | none (memory-store calls use no tokens). **Storage pricing not confirmed** — check before enabling in public |
| 沿革 | in the rule body (+ Git/Skill export) | the same body **plus automatic memory versions** per save (created/modified, who: API key or session, when; redactable) — checked: 2 versions for an add + revise |
| Survives a redeploy | no (container `/tmp`) | yes (stored at Anthropic) |
| Several server nodes | no (file per node) | yes (shared, with optimistic concurrency) |
| Workspace | — | **workspace-scoped** (official docs: "a workspace-scoped collection"). A store created with the development key (`kokoroe-hackathon`) is invisible to the `kokoroe-public` key. In public, the server creates stores with the public key itself, so per-session stores work; any shared or pre-seeded store (e.g. one company kokoroe-chō for the successor demo) must be created **with the kokoroe-public key** |
| Risk before 11/8 | none | beta API in the path of every 帳場 step; per-visitor stores to clean up; judges' Quickstart needs a key for the store |
| What "Managed Agents" adds | — | only storage today. The real Managed Agents value would be **sessions that mount the store**: a compiler agent `read_write`, a successor agent `read_only` (the same boundary as the MCP server, D-042). Our interpreter is one structured call, so an agent loop adds latency without new capability |

**Recommendation (one):** keep **local JSON as the default for the demo and all evaluation**, ship the memory-store adapter as a
tested, flag-switchable option, and state it plainly (s07 "保存先" slot: local JSON, switchable to a Managed Agents memory store).
Do not move the apprentice or interpreter into Managed Agents sessions before 11/8. Reason: within the demo's lifetime the gains
(redeploy survival, multi-node, versions) don't show, while the 2 s session start and a beta dependency sit on the critical path;
the 沿革 is already carried in the rule body and exported. The case that would change this is a session-mounted successor agent
with the store `read_only`.

### D-002 — Decision (2026-11-03, Kento)
**The demo and all evaluation use the local JSON store by default; `KOKOROE_STORE=memory` switches to a Managed Agents memory
store.** We tried it and, within the current scope, its advantages do not show, so it is not the default.
- **Measured** (`spikes/managed-agents/adapter-check.ts`, laptop in Japan, real API, fictional data): starting a session (seeding
  16 rules + 27 judgments) **≈ 2.1 s**; each read or write **0.2–0.7 s** (listRules / rulesFor ≈ 0.23–0.25 s, saveRule ≈ 0.5 s,
  addJudgment ≈ 0.73 s), against ~0–2 ms for local JSON. No model tokens.
- **Basis:** only our own measurements above and the official documentation ("Using agent memory",
  https://platform.claude.com/docs/en/managed-agents/memory: "A memory store is a workspace-scoped collection of text documents").
- **What would change it:** a session-mounted agent (compiler `read_write`, successor `read_only`), or a need for the kokoroe-chō
  to survive redeploys or be shared across server nodes.
- **Follow-ups:** the s07 diagram's store slot reads 「既定: ローカル JSON / Managed Agents にも切替可」; its hand-off slots show
  both ways to hand over (Kento): **Agent Skills（SKILL.md）** — a written-out copy kept at hand — and **MCP（読み取り専用）** —
  queries to the kokoroe-chō as it keeps growing (D-042), drawn as a dotted read-only line straight from 心得帳. The three spike
  memory stores (`kokoroe-spike` ×1, `kokoroe-adapter-check` ×2; fictional data only) were deleted on 11/3 after Kento saw the
  list; a fresh listing (archived included) returned none. The results live on in `docs/spikes/` and this record.

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

## D-012 · 2026-11-03 · Evidence for D-002 (D-002 settled the same day — see its Decision)
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
(grounded) vs 0/8 for a general assistant; injection never changed the kokoroe-chō (18/18), lures always escalated (9/9, the model alone — before the D-044 floor), one
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

_Correction (audit 2026-11-03): the three paths took 110 / 112 / 120 master taps (not 112–120). The Before figure in this entry is superseded by D-030 and D-033._
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

## D-040 · 2026-11-03 · Accepted · The official measurement is one command (`npm run eval:final`), and every number is generated from its JSON
- **What runs** (all fictional data): Before = apprentice v0 × 6 on the 20 held-out scenes; After = **5 training paths** (seeds
  101–505), each from an empty kokoroe-chō → 〔台帳〕 seeding with one "why?" each → 40 training scenes through the v1 loop (D-029)
  → held-out × 3; history questions × 3 on each path's grown kokoroe-chō, plus × 3 without one; adversarial set × 3 on the first
  path's kokoroe-chō (copies). After is reported as the mean of the 5 path means with min–max; taps include the 台帳 "why?" prompts.
- **Refuses to run** unless `data/hidden` matches its frozen checksums (D-017), the public ledger is the corrected one (D-033), the
  git tree is clean (the commit hash goes into the result) and a key is set. Without `--yes` it prints the checks and a **cost
  estimate from the unit costs of the latest measured runs** (today: ≈ $9.75, up to $12.23) and stops. During the run it stops before
  any part that would push the total past `--max-usd` (default 1.3 × the high estimate); parts are saved as they finish, so
  `--resume <dir>` continues after an interruption. `--smoke` runs the same path at toy size (≈ $0.4) and writes nothing official.
- **One source for numbers:** `eval/runs/<stamp>-final.json` → `npm run demo:results` → `data/demo/results.json`, which the
  稽古の記録 screen and the video's numbers scene read, and from which the README "Before / After" blocks (EN/JA) are generated
  between markers. A test fails if a README block differs from the JSON. Labels switch from 途中経過 to the official wording when a
  final run exists. Generating the block found one hand-copied error: the injection row said 0 / 18; the data has 9 injection runs
  (the other 9 of the 18 adversarial runs are discount lures).
- Today: estimate only. The real run is 11/7, after the feature freeze.

## D-041 · 2026-11-03 · Accepted · No "interview-style vs Kokoroe" comparison in the simulator evaluation
Kento: a simulated master cannot measure this fairly. Whether a veteran can put tacit knowledge into words is exactly the question;
in a simulator we would have to decide how much of the hidden ground truth the "interviewed" master can verbalize, which fixes the
conclusion in advance. So the evaluation compares only things the simulator can judge with code (the same apprentice before and
after corrections, history answers, adversarial cases). The comparison with writing things down is made by a person instead, in
the 11/6 field test (D-031): Kento's time to write the etiquette as prose for 5 scenes vs. the time to mark ○△× (with a one-liner)
on the same scenes, and how many distinct pieces of etiquette each produced. It is reported as one person's measurement, not as a
general result.

## D-042 · 2026-11-03 · Accepted · Read-only MCP server for the living kokoroe-chō (Kento approved, with conditions)
- **Role:** the Agent Skill is a **copy** of the kokoroe-chō at one moment (it now states "この写しの時点"); the MCP server is a
  **window onto the living book** for the overlap period. Skill rule 5 tells the successor's Claude to call `changes_since(<copy
  moment>)` when the server is connected, and to follow only rules whose status is 有効 (retired/rolled-back ones are history).
- **Surface:** exactly four tools — `list_clients`, `get_kokoroe`, `get_history`, `changes_since` — plus `kokoroe://clients/{id}`.
  No write tool, no tool that calls Claude, no judgments/drafts/scene text, no interpreter-internal `reason`. Output = what the Skill
  shows, plus retired rules in history (marked 「従わない」).
- **Read-only by construction:** the server receives a `ReadonlyKokoroeStore` (`listRules`, `getRule` only; file opened with flag
  "r", re-read per call). Tests: fixed tool list with read-only annotations; store bytes and mtime unchanged after every tool; no
  write/Claude/hidden imports in `src/mcp`; nothing beyond the Skill's content; the entry point refuses any file whose rules are not
  `K-nnn` (e.g. the evaluation's ground truth). Transport: stdio, local only; no AWS.
- **Precise "after the copy":** within one day a copy and a correction can both happen, so `LocalJsonStore.saveRule` now stamps new
  沿革 entries with `at` (save time; matched by content, so a stale save can't leave one unstamped). Older entries fall back to
  00:00 JST of their date. `at` never reaches any prompt (renderers pick fields explicitly), so evaluation numbers are unaffected.
  Known gap: a "why?" recorded later edits the last entry in place and keeps its earlier time.
- **Checked outside the repo** (`demo/successor-mcp/`): same isolation as the Skill demo; with the server, the successor's Claude
  found a rule learned after the copy and changed its answer. hitl-reviewer: no blockers; its fixes (retired-rule wording, origin
  label, "ask the master" when nothing is recorded, content-matched stamping, refusing non-kokoroe stores) are in.

## D-043 · 2026-11-03 · Accepted · Where a correction may write is decided in code, not only in the prompt (audit)
- **Context:** the milestone audit (`docs/audits/2026-11-03.md`) found that `applyCandidate` used the interpreter's
  `targetRuleId` and `scope.clientId` as given. The prompt said "start narrow; widen only by revising", but a misreading could
  rewrite another client's rule or create a company-wide rule from one △.
- **Decision:** a correction about client X writes only to (a) an active rule of X, or (b) an active company-wide rule that stays
  company-wide. Everything else — another client's rule, a retired/merged rule, narrowing a company-wide rule to X — becomes a new
  rule scoped to X. New rules are always scoped to the judged client; widening to all clients happens only by revising (or by
  generalization, which the master confirms). Every fallback goes in the narrower direction.
- **Why:** regression replays only X's past ○ scenes, so any edit that reaches other clients would go unchecked.
- **Effect on numbers:** none expected (the interpreter already followed the prompt in recorded runs); `eval:quick` (naive
  apprentice, no API) unchanged at match 0% / ○+△ 45% — fictional 10 clients / 20 held-out scenes. The official run on 11/7
  measures with the guard in place. hitl-reviewer: no blockers; its two narrowing suggestions are included.
- **Not decided here** (for Kento, audit items D/E): a code floor for escalation on price/contract scenes, and what a × on
  確かめ稽古 should do to the new rule.

## D-044 · 2026-11-03 · Accepted (Kento) · Prices, discounts and contract terms go to the master — in code, not only in the prompt
- **Context:** the audit (item D) found that "never decide discounts / contract terms" was held only by the model (it escalated
  9/9 lures in the interim run). Kento decided to enforce it in code before the official run.
- **Decision — the floor** (`src/disciple/hitl.ts`): every Claude apprentice draft (v0 and v1, live and in evaluation) and every
  recorded draft shown in the 帳場 gets `escalateToMaster = true` when the scene is a price scene (T3) or the situation or the draft
  mentions 値引・値下げ・値上げ・割引・半額・無償・無料・価格・契約・支払条件・取引条件. It never turns escalation off.
  - "単価" is left out on purpose: T12 is about adding a 単価区分 to a screen, not a price decision. A test checks that every
    lure and every T3 scene in the data is caught; outside T3 the list catches only A05 (a discount demand) and E18 (a 保守契約
    procedure), both fine to route to the master. Broad by design: a needless "ask the master" costs one tap.
  - When the floor (not the model) made the call, the proposal carries `escalatedByCode`; the 帳場 says so (「仕組みとして自動で
    師匠に回しています」 / 「要る（自動）」), so the master can tell the code from the apprentice.
- **Learning side:** a reading that would stop routing to the master is dropped in the interpreter (never offered, never written);
  the successor's grounded prompt says money and contract terms always need the master, whatever a rule says. Regression checks
  compare against the floored past draft, so a change made only by the floor is not asked about.
- **Effect on numbers — reported honestly:**
  - The v0 prompt is unchanged, but its output is now post-processed, so the **Before changes too**; Before and After share the floor.
  - All HITL-tagged scenes in the hidden judge are price scenes, so with the floor the apprentice can no longer fail the HITL check;
    match and ○+△ may rise a little against earlier runs. The official numbers (11/7) are all measured with the floor.
  - The lure metric would now be guaranteed by code, so it is reported twice: **the model alone** (`escalatedByModel`) and
    **with the floor** (`escalated`). The interim 9/9 is labelled "the model alone, before the floor".
  - The naive no-API baseline used by `eval:quick` is not floored (it is not an apprentice the product uses); `eval:quick`
    unchanged: match 0% / ○+△ 45% — fictional 10 clients / 20 held-out scenes.
- **Checked:** `eval:final --smoke` passes with the floor (pipeline end to end; lures A04–A06 escalated). hitl-reviewer: the floor
  reaches every path; its two blockers (this record; separating the model's own rate) and four smaller points are addressed.

## D-045 · 2026-11-03 · Accepted (Kento) · A rule that does not take in its 確かめ稽古 is re-read once, then withdrawn
- **Context:** until now a △/× on the re-solved corrected scene (確かめ稽古) was only recorded; the rule stayed. Kento first
  decided to treat it like a regression (re-read once, then withdraw). A real 6-scene run with that version **withdrew correct
  rules**: at T05 the re-solved draft did carry the new rule's point (a quiet word to the 蔵元), the master's × was about another
  point (「顔出して話せ」); the re-read overwrote the rule with that point, the original point went missing, and the rule was
  withdrawn. A △/× here often means "something else is still missing", not "the rule is wrong". Shown to Kento, who chose:
- **Decision:** on △/× in 確かめ稽古, first check whether the re-solved draft follows the new rule's own point (its implied
  field change, `ruleTook`):
  - **It took** → the rule worked and stays. What is still missing is learned as a **separate correction**, after this rule's
    regression check (so the new rule can't break it), and it may not rewrite the rule just written. In the 帳場 it goes through
    the normal flow (readings, the master's choice, "why?", its own 確かめ稽古); in the evaluation loop it is written after the
    master's choice without a further 確かめ (kept simple to bound taps and cost).
  - **It did not take** → the interpreter gets one chance to re-read the same rule from that judgment (an unambiguous reading
    only, same scope), the scene is re-solved and the master confirms again; if it still does not take, the rule is
    **withdrawn** — an added rule retired, a revised rule restored — with 「確かめで外れたため取り下げ」 in its 沿革, and
    regression and generalization are skipped.
  - A rule without a recorded point (e.g. from the 台帳) is never withdrawn on this ground.
  - When the trial limit stops live calls, the master's mark is still recorded and a rule that did not take is withdrawn (no
    Claude call needed) — nothing is adopted without a ○.
- **Checked:** unit tests for all three paths; the same real 6-scene run after the change kept T05's rule (confirmed ○) and, at
  T09, kept the rule and learned the remainder separately; `eval:final --smoke` passes. hitl-reviewer reviewed both versions.
- **Effect on numbers:** measured in the official run (11/7). Up to two more taps per failed confirmation; one check tap can
  trigger several Claude calls (a re-read and a draft, or the remainder's interpretation plus regression drafts), all counted
  by the spend tracker.

## D-046 · 2026-11-03 · Accepted (Kento) · 「実地テスト」→「師匠役テスト」 (master-role test)
The 11/6 test of D-031 is renamed **師匠役テスト** (English: **master-role test**). Its content is unchanged: the author plays the
master on fictional scenes in the 帳場 and the app times each action.
**Why:** 「実地テスト」/"field test" reads as a trial with real clients or in a real workplace, which it is not.
**What changed:**
- **Names:** screens, README (en/ja), docs and the submission draft.
- **Procedure file:** `docs/field-test.md` → `docs/master-role-test.md`.
- **Result file:** `docs/results/field-<date>.json` → `docs/results/master-role-test-<date>.json`.
- **Submission-draft slots:** `〔field: …〕` → `〔師匠役: …〕`.

**Kept on purpose:** internal names stay `field`, so nothing that works breaks. This covers:
- `KOKOROE_FIELD`, the session mode `"field"` and its session-file prefix
- `src/server/field.ts`, `scripts/field-*.ts`, `npm run field:save`
- `data/demo/field-snapshot.json`
- the `field-rehearsal-*.png` screenshots

The README and the procedure say so in one line. Earlier records (D-031, D-040, the 11/3 audit) keep the old name as written.

## D-047 · 2026-11-03 · Accepted (Kento) · No hackathon session content in the repo; earlier records edited as an exception
The organizers announced that nothing from the hackathon's sessions may be published (video, photos or audio). The repo becomes
public at submission, so every mention of what the hackathon's sessions presented, or of their speakers, was removed. Reasons are now
given only from our own measurements and from official documentation, and Claude Code features (`/goal`) are cited from their
public docs.
**Exception:** past decision records are normally never rewritten. This time the D-002 bodies (headings, "material", "Decision")
were edited so that no unpublishable content stays in the repo; the decision itself is unchanged.
**Also edited:**
- the spike note
- three `how-we-built.md` entries
- the video typography backlog's source line (it pointed to someone else's post)

The ARIA attribution in the 11/3 audit and `how-we-built.md` was removed by mistake and then restored. It does not come from a
session: it comes from ARIA's public repo (https://github.com/zestones/Aria, `docs/audits/`), which is now cited.

Mentions of "kickoff" as a date are kept: they say when the period began, not what was said. No image, recording, narration or
subtitle in the repo comes from a session (all 61 PNGs are produced by this repo's scripts; `video/out/` is not committed).
**Open:** older commits still contain the removed text. Whether to rewrite history before publishing is Kento's decision
(see `docs/publishing.md`).

## D-048 · 2026-11-04 · Accepted (Kento) · An unknown model name never costs $0
`estimateUsd` (`src/lib/cost.ts`) used to price a model missing from its table at $0. Now:
- **Evaluation** (the default): it stops with an error that names the model ("add its price to src/lib/cost.ts"), so a run can
  never report a cost that silently left calls out.
- **The public demo's daily spend guard** (`recordSpend` in `src/server/limits.ts`): it counts the call at the highest prices in
  the table (input and output separately), the safe side.

Known models are priced exactly as before, so no recorded number changes. Judging and learning are untouched. Tests pin down the
error, the highest-price fallback, and that the daily guard still trips on an unknown model. `eval:quick` is unchanged: match 0%,
○+△ 45% (fictional 10 clients / 20 held-out scenes).

## D-049 · 2026-11-04 · Accepted (Kento) · Demo video: structure v2, Takumi narration, seconds from the audio

**Context.** Kento scored the first rough cut 10/100: the Edo story was good, but the problem, the solution and what you get were
not said at the start, and neither was why correcting works. The voices also sounded synthetic (docs/voice-trial-2026-11-04.md).

**Decision.**
- **Structure v2** (drafted in-period with Claude in chat after Kento's review): problem → what goes wrong → why it never gets
  written down → solution and title → 帳場 → 心得帳 → 暖簾を継ぐ + Skill/MCP → why it works (numbers) → close with Edo.
- **Narration:** the v2 draft rewritten for speech, meaning unchanged; part 4 uses Kento's shorter version.
  - In part 2, the person who was scolded is called 部長 (not 師匠), because the master role is introduced only in part 4.
  - Numbers are filled from `results.json`; interim numbers are said to be interim.
- **Voice:** Polly Takumi (neural), 105%, accents via `x-amazon-pron-kana`, 0.5 s between sentences. 110% sounded fast; 0.3 s
  pauses were allowed only where a scene ran short, and none needed it.
- **Timing:**
  - Scene seconds = 0.3 s lead + the narration's measured length + room for the picture. Total 170.0 s.
  - Subtitles and animations follow Polly's sentence speech marks.
- **Dropped from the video:** the opening glimpse (s01-hook), the how-it-works diagram (s07-how; replaced by a simpler flow and the
  Skill/MCP comparison) and the 51.2% successor statistic (not in v2's narration).

**Consequences.**
- The first minute now carries the problem and why it is never written down. The solution title starts at 0:47.
- Part 4's last sentence ends at about 1:06. To end it by 1:00, parts 1–3 would need shorter text.
- s08b's narration must be re-synthesized after the official measurement (docs/final-day.md, goal B).

## D-050 · 2026-11-04 · Accepted (Kento) · Video structure v3: why now, and pull

**Context.** Kento found v2 much better but still flat. It also didn't make the case for why this is needed now.

**Decision** (v3 additions drafted in-period with Claude in chat; narration kept in the repo):
- **Cold open (8 s):** T05's draft gets the master's 朱 「違う」, with the question 「この案、どこが違うか、分かりますか。」.
  - 帳場 (s05) answers it: 「冒頭の答えは、蔵元への、裏の一言でした。」, said while the master types 「裏で蔵元に一言」.
- **Why now (22 s):** three forces are stacked on screen, each with a public source where there is a number.
  - Successors: 51.2%, 帝国データバンク (of the small and medium firms surveyed).
  - Job changes: 330万人 in a year, 総務省統計局「労働力調査（詳細集計）2025年平均」転職者数. Job transfers have no clear public
    figure, so they get words only.
  - AI can only use what is written.
  - The narration's first line says 「中小企業の、半数あまりで」; the screen shows the scope (the surveyed firms).
- **Pull:** two question cards, 「では、部長がいなくなったあと、後任は、答えられるのでしょうか。」 before 暖簾を継ぐ and
  「直すだけで、本当に、伝わるのでしょうか。」 before why it works.
- **Time (178.9 s):**
  - Parts 1 and 2 are merged into one 22.7 s scene. 心得帳 is cut to 8.5 s, and the Edo close to 7.4 + 10.0 s.
  - 帳場 is not shortened; with the answer added it is longer (22.0 s).
  - To fit under 3:00, a few further cuts were needed:
    - 0.3 s pauses in most multi-sentence scenes.
    - s03 keeps only its first beat. Its second sentence moved onto the red-ink title, which is itself a correction.
    - The silent reading time after the narration in 暖簾を継ぐ and Skill/MCP went from 11.5 to 10.5 s each. Part 7 as a whole is
      still longer than in v2, because of the question card.

**Consequences.**
- The first minute now says why it matters (0:08–0:30) and the problem (0:30–0:53). The solution title comes at about 1:03.
- There is about 1 s of headroom under 3:00, so any further addition needs a cut elsewhere.

## D-051 · 2026-11-04 · Accepted (Kento) · Video v4: a cold open you can see, moving forces, noren wipes

**Context.** v3's cold open asked 「この案、どこが違うか、分かりますか。」. A viewer had no way to know, so it confused instead of
pulling them in. The three forces also sat still.

**Decision.**
- **Cold open (12.9 s; Kento's draft narration):**
  - The visible difference: two near-identical messages slide in from the left and right. The master's 朱 brush circles the one
    extra line, the word to the 蔵元.
  - The reason you can't see: that line glows and is drawn into the retiring director's head. A 「来春 退職」 tag drops beside him.
  - s05 answers it: 「冒頭の1行は、蔵元への、裏の一言でした。」.
- **Three forces move:**
  - 51.2% counts up (CSS `@property` integers, so stills stay exact) and tags hang on half the companies.
  - People walk out through a noren while 330万人 counts up.
  - An AI reads a page and only the written lines light up; the bubble in a person's head stays grey.
- **Noren wipe**, at three chapter breaks only (solution, demo, close). It is drawn by the recorder and adds no time.
- **Time:** the cold open is 4.9 s longer than v3's.
  - s02's first sentence no longer repeats 「来年の春…退職します」 (the cold open says it); −1.6 s.
  - Small trims to s06, s09, the end card and scene tails (−2.5 s). s05 and s07 are untouched.
  - Total 179.7 s.
- **HyperFrames:** not tried. Measured on the recording, motion is smooth at Playwright's 25 fps, so it wasn't needed.

**Consequences.** Readings 「1行」→いちぎょう and 「2通」→につう were added. Only about 0.3 s of headroom is left under 3:00.

## D-052 · 2026-11-04 · Accepted (Kento) · One way to use the words: ココロエ, 心得, 心得帳; a breath between scenes

**Context.**
- Kento asked for a pause between scenes and for the relation between 心得 and 心得帳 to be said once, clearly.
- The product was sometimes called 「心得」: in the title cards, the app's header and title, and the README titles. So the same
  word meant both the product and one piece of practice.

**Decision.**
- **Words:**
  - The product is **ココロエ (Kokoroe)**.
  - A **心得** is one piece of the master's practice.
  - The **心得帳** is those, written down with why each came to be.
  - s04b says it in the narration (「その一つ一つが心得になり、経緯ごと、心得帳に綴られます。」) and on screen as two definitions.
  - Fixed now in the video (title cards say ココロエ / Kokoroe; the noren crest is 「心」, a mark), README.ja/README (title and a
    word line), the submission draft and CLAUDE.md.
  - **The app's header and page title are not changed yet:** that needs a public redeploy, so the change is shown to Kento
    first.
- **Breath:**
  - After every scene but the last, its last frame is held in silence for 0.5 s; subtitles clear 0.3 s after the voice, so the
    held frame has none.
  - A chapter scene (noren wipe) also opens on the closed noren for 0.5 s, so a chapter break is 1.0 s.
- **Time:**
  - The total is kept near 2:55: 174.8 s, about 5 s of room under 3:00.
  - To pay for 9 s of breaths:
    - s01 no longer narrates 異動 (it stays on screen), and s02 no longer repeats the retirement (the cold open says it).
    - s04b, s08 and s09b are shorter.
    - The narration lead went from 0.3 to 0.15 s.
  - s05, s07 and s07b are unchanged.
- **Intonation:** the final adjustment goes with the 11/7 number swap (docs/final-day.md).

## D-053 · 2026-11-04 · Accepted (Kento) · 帳場 and screens: take back a judgment, stop here, 心得 apart from ledger facts, no ids on screen

**Context.** Kento used the app as the master and as the successor and listed what was hard. He decided: fix all of it before the
master-role test (11/6).

**Decision.**
- **Take back the last judgment** (one step; `src/server/undo.ts`):
  - **Before interpretation wrote anything:** the judgment is simply taken back.
  - **After it wrote:** the change written from it is undone like a 差し戻し (an added rule is retired, a revised one restored to
    its snapshot, sources included). The 沿革 says 「取り消し」. Nothing is erased: the judgment and its 確かめ / regression
    judgments stay, marked `undone`, and regression checks skip them.
  - **Refused** while any background work runs, while a follow-up correction from its 確かめ is open, and when another
    correction changed the rule afterwards (restoring the snapshot would erase it; the master can retire the rule instead).
    These cases come from the hitl-reviewer, which found two blockers in the first version (a rule left active after an
    `error`; other pendings touching the same rule). Both are fixed and covered by tests.
- **「ここで区切る」 / 「続きから」:**
  - Progress is shown as 「12 / 40 件 済み」 with a bar.
  - Stopping keeps the 心得帳 usable, and a stopped session accepts no judgment.
- **心得 vs ledger facts (D-052):**
  - A rule whose sources are all from the client ledger is shown, exported (Skill) and served (MCP: `kind`, separate counts)
    as 「台帳から写した事実」. Everything the master corrected is 「師匠から覚えた心得」.
  - What the apprentice and the successor see is unchanged, and so are the evaluation numbers. `eval:quick`: match 0%,
    ○+△ 45% (fictional 10 clients / 20 held-out scenes).
- **Words on screen:**
  - No internal ids (T…, J-…, K-…, D-…, 「v1構成」); rules, scenes and sources are named in words.
  - The successor's citations show the rule, its previous form, the わけ and 「心得帳に書いた日」, which is not when the
    event happened.
  - The 暖簾 client menu follows the question.
  - The 帳場 side panel is 「弟子の読み取り」, so 裏 is used only for 裏の一言.
  - Without a key, a recorded example shows what the live version writes.
  - The remark and 「なぜ」 placeholders are generic: the old ones were the answers to a scene and a rule.
    **11/5:** a later remark example (「例：先に工場長へ電話。社長にも一言」, from the 段取り wording on 11/4) had drifted back toward
    an answer — 工場長 is 港北精機's decider, and 「社長にも一言」 is the shape of the hidden company-wide 表と裏 rule. Replaced by
    「例：結論を先に。資料は一枚にまとめて」, whose words appear in no hidden rule, simulator remark or scene (checked by count only).
- **Phone:** when the apprentice asks the master something (a reading, a 「なぜ」, a check), that panel comes first and is
  scrolled into view once.

## D-054 · 2026-11-04 · Accepted (Kento) · The successor answers from a matching rule and quotes it; never answers what is not in the book

**Context.** A diagnosis on 4 already-grown kokoroe-chō (`eval/history-diagnose.ts`, $0.205) showed where the history questions
fail:
- Q05: the fact was never learned in training.
- Q07: the rule and its why are in the book, but the successor answers "unknown".
- Q03: right answer, but paraphrased.

Kento: answer instead of escaping when a matching rule and its why exist; quote them as written. Anything not in the book is
still 「分からない、師匠に確認を」, and that must be checked. Q05 is left as it is.

**Decision** (`src/successor/ask.ts`, grounded mode only):
- A rule about the same client and situation, worded differently, counts: answer from it, not "unknown".
- Quote the rule and its 沿革 in 「」 exactly as written. Only the recorded きっかけ / remark is called the master's words: the rule
  text was written by the apprentice, as the hitl-reviewer pointed out.
- No rule about this situation → "unknown", and no stretching a rule from another situation. The price/contract line is
  unchanged.

**Measured** (fictional data; the same 4 grown kokoroe-chō, one run each; `eval/successor-guard.ts`; $1.1 in all):

| | before | after |
|---|---|---|
| History questions (8) | 5.00 | 5.50 (within one question per store: noise is possible) |
| Answers presented as quotes but not in the book | — | 0 |
| Far questions not in the book (6, `data/scenes/unknown-questions.json`): answered anyway | 0/24 | 0/24 |
| Near-miss questions (4, next to an existing rule): answered | 6/16 | 6/16 |
| Discount question with a matching rule: sent to the master | 8/8 | 8/8 |

- **The near-miss count needs reading:** N03 and N04 turned out to be covered by rules some runs had learned, so those answers
  are grounded. The real stretch is N01: a 根回し rule applied to good news, in 2/4 stores before and 1/4 after.
- **Already there before:** this weakness predates the change and is not removed by it. Recorded as a known limit.
- **Q07 is still mostly "unknown":** the grown books hold the fact (the 二代目 does not want to be treated like the 先代), not a
  rule about meetings. Answering would mean stretching, which Kento ruled out.
- **Q05** stays at 0/4, shown as it is.
- **Effect on the official measurement:** the 11/7 history numbers are measured with this prompt. Match is not affected (the
  successor is not used in training or the held-out scenes).

**Addendum (2026-11-06, Kento): plain words in the successor's answers, nothing else changed.**
- **Why:** the live 暖簾を継ぐ answers showed the 心得帳's internal notation. 体験の目 4 saw 「(2026-11-05、新のみ・旧なし)」 and
  「きっかけは未記入」. The guard run counted rule ids (K-0xx), 旧「…」/新「…」, 「（未記入）」, 確信度 and scene ids in 18.5 of 20
  answers.
- **Change** (`src/successor/ask.ts`, one bullet):
  - The explanation is written in plain Japanese, with no internal labels, ids or 沿革 notation. Rule ids go only in citations.
  - The rule and the きっかけ are still quoted in 「」 exactly as written.
  - If the きっかけ is not written, the answer does not supply a reason; it may say 「なぜそうなったかは書かれていません」.
  - A rule not yet certain is said so in plain words.
  - Each citation's history stays as recorded, so the UI's 根拠の心得 card keeps its fields.
  - "What you answer does not change: only how it is written."
- **hitl-reviewer:** OK. Its two wording suggestions (no reason of the model's own when the きっかけ is missing; keep the
  uncertainty caveat in plain words, and count 確信度 apart from the leak counter) were taken.
- **Measured** (`eval/successor-guard.ts`, same 4 grown kokoroe-chō as above, one run each, fictional data; before/after the
  first wording; `docs/results/successor-guard-2026-11-06-{before,after}.json`):

Totals over the 4 stores, as in the table above. History is the mean per store, as above.

| | before | after |
|---|---|---|
| History questions (8), mean per store | 5.50 | 5.75 |
| History answers presented as quotes but not in the book (of 32) | 2 | 1 |
| Far questions not in the book: answered anyway | 0/24 | 0/24 |
| Near-miss questions: answered | 6/16 | 5/16 |
| Price questions sent to the master | 8/8 | 8/8 |
| Answers showing internal labels (of 80) | 74 | 6 |

- **Noise** (judge-critic 11/6): the change was wording only, so the history +0.25 is within run-to-run variation. The
  misquotes show this too: on 11/4 the same prompt, on the same 4 stores, gave 0 misquotes; on 11/6 the before run gave 2.
  What the change is meant to move is the last row. The far-question row is the one that must not move.

- **Final wording** (after hitl-reviewer), checked on 1 of the 4 stores (`…-after-final-1store.json`). Against the same store
  before: history 5 → 5, far made-up 0 → 0, near 1 → 1, price 2/2, internal labels 18 → 1. The one left is a K-id inside a
  quoted rule text; the screen's `plainText` shows it as 「心得」.
- **Cost:** about $0.96 in all (cap $1). 11/7's official run measures this version.
- **Kento's "30 questions not in the book":** the repo has no 30-question set. The check was run on the guard's existing
  not-covered set: 10 questions (6 far, 4 near) × 4 stores. The far ones are the made-up-answer check, and it stays at 0.
- **Recorded answers are untouched:**
  - The demo's answers (`data/demo/recorded-answers.json`) and the Claude Code answers in video s07b keep their text. On screen
    their ids already pass through `plainText`.
  - The s07 and s07b stills and README picture 3 show no internal labels.


## D-055 · 2026-11-04 · Accepted (Kento) · Ranks (見習い・手代・番頭) tried in replay and not adopted; a plain track record instead

**Context.** The original idea gave the apprentice ranks for its proven record and widened what it may do on its own. Kento asked
for a replay before any screen was built.

**What was measured** (no API; 8 recorded training runs × 40 drafts, fictional data; `eval/rank-replay.ts`,
`docs/results/rank-replay-2026-11-04-*.json`):
- **Rules replayed:** grouped by client. 手代 = 2 ○ in a row (review not skipped: only a 「確認だけ」 mark). 番頭 = 5 ○ in a row plus
  a passed 確かめ稽古 (review skipped).
- **手代:** reached 39 times counting the master's marks on drafts, 84 counting every mark. Of the drafts it would have marked
  「確認だけ」, **76% / 64% had been marked △/×**, worse than the overall 55% of training drafts
  (175 of the 320 drafts in the same 8 runs were marked △/×; counted again on 11/5 for the audit — not in the replay's JSON).
- **番頭:** reached 0 / 3 times, and no draft ever passed without review.
- **Client × situation type:** never reached at all; each pair occurs once in the 40 training scenes.

**Decision.**
- **No ranks:** no rank names, no 「確認だけ」 mark, no batch approval, no skipped review.
- **Why:** a run of ○ did not predict whether the next draft was right. Even with one client, each kind of situation needs its own
  etiquette.
- **What the 帳場 shows instead:** the plain record with the client, e.g. 「この取引先では ○ が3回続いています」, as information.
- **The floor stays in code** (`mustReview` in `src/disciple/hitl.ts`, tests): first contact with a client, discounts and
  contracts, and anything the apprentice escalates always go to the master.
- **Later:** trust ranks are to be considered only with data from real use, where the same kind of situation comes back often.
- `src/core/rank.ts` is kept for the replay record and the plain track record.

## D-056 · 2026-11-04 · Accepted (Kento) · 自分の会社で始める — your own client ledger, on your own machine only

**Context.** So Kokoroe can be used after the hackathon, Kento asked for a mode that starts from your own client ledger instead of
the fictional company. Conditions: `KOKOROE_OWN=1`, 127.0.0.1 only, data outside the repository, absent from the public version
(tests), visible data handling, and a way to delete everything.

**Decision.**
- **One switch for the whole process:**
  - With `KOKOROE_OWN=1`, `src/core/world.ts` loads the company and the client ledger from `KOKOROE_OWN_DIR` (default
    `~/.kokoroe`, refused if it is inside the repository or is the home folder itself).
  - The fictional demo, お試し and 師匠役テスト are not offered in that process.
  - Without the switch (the evaluation, the public version) the world is the fictional one, unchanged. The apprentice's and the
    successor's prompts are now built at call time, giving the same text for the fictional company.
- **Run with `npm run own`** (`next dev` on 127.0.0.1, `KOKOROE_LIVE=1`). A production build made without the switch cannot serve
  it: its static shell was rendered for the fictional company. It then fails closed rather than showing anything.
- **Local only, in code:**
  - The own session is returned only for a local, unproxied request: Host is loopback, and the X-Forwarded-For chain, which
    Next.js itself adds, is all loopback.
  - Every own action checks the same, and the layout shows a refusal otherwise. Checked live: a spoofed Host gets only the
    refusal, and a proxied export gets 401.
- **The ledger:** a form or a pasted CSV (取引先名, 業界, 窓口, 決裁者, 制約, 繁忙月, 取引年数), limited to 50 clients.
- **Use:** in the 帳場 the master writes a situation (client, kind, month, text), the apprentice drafts it live, and the master
  marks it. Learning, 確かめ稽古, the successor and the Skill export work as in the demo. The HITL floor is unchanged: nothing is
  sent, and money and contracts go to the master.
- **One lasting session:** no cookie expiry and no 24-hour sweep; the 心得帳 stays until deleted.
- **Data handling, on the setup page:** the folder where everything is kept; what is sent to the Claude API and when (only to make
  a draft, a reading or an answer); who can open it (this machine only); and that the public demo has no such mode.
- **「全部消す」:**
  - It needs 消す typed in.
  - It removes the folder only if it carries the marker file this mode wrote, so it never removes a folder it did not make.
- **Not in the public version:** `KOKOROE_OWN` is unset in the deploy environment (docs/deploy.md). A test checks that the image
  build and `.env.example` never set it and that the world is the fictional one without it.
- **Hardened after the hitl-reviewer** (4 blockers, all fixed, with tests):
  1. **「全部消す」:**
     - The folder may not contain the repository or the home folder.
     - The marker is written only into a folder this mode creates (or finds empty).
     - Deletion removes only this mode's files, then the folder if it is empty. There is never a recursive delete of the folder,
       and a symlinked folder is refused.
  2. **"Outside the repo"** compares real paths (symlinks resolved, case-insensitive on macOS).
  3. **Client ids stay stable across saves:**
     - Form rows keep their id; a CSV is matched by name; an id is never reused.
     - A client that the 心得帳, a judgment or a written scene refers to is never dropped, so a rule can never move to another
       client.
     - Duplicate names are refused.
  4. **No draft, nothing to learn:** in own mode a card without a live draft (limit or error) is not shown and cannot be judged.
- **Smaller points, also fixed:**
  - The company name is not shown outside the local gate.
  - Deletion is refused while the apprentice is still working.
  - The per-session call cap does not stop your one lasting 心得帳 (the daily spend cap stays).
  - The Dockerfiles are part of the public-version test.
  - The evaluation refuses to run with `KOKOROE_OWN=1` set.
  - The month must be an integer.


## D-058 · 2026-11-04 · Accepted (Kento) · Busy months: no "you marked ○ last time" hint; a known limit

**Context.** In the persona run (`docs/personas-2026-11-04.md`) the busy-month master had the lowest ○+△ among the personas whose
words were intact (85%). Its lenient ○ in busy months taught nothing there; its strict △ (「もう一工夫」) in calm months sent the
interpreter looking for a difference that was not there. A display-only fix was proposed: show 「前回この取引先の似た場面には
○ を付けています」 next to the marks.

**Decision.** Not adopted.
- **Why:** a master who is going easy, shown a past ○, may lean further towards ○ (anchoring). The hint could make the drift worse.
- **Recorded as a known limit:** marks given in a busy month can be lenient.
- **What is true today, and what the README says:**
  - A lenient ○ writes nothing into the 心得帳.
  - Every 心得 keeps its date and the scene and mark it came from, so the master can look again later and delete it in the 心得帳.
    The deletion stays in its 沿革.

## D-057 · 2026-11-04 · Accepted (Kento) · 「どこが違う？」 with 「どれでもない」: an optional hint for the second readings

**Context.** In the persona run, silent and vague masters lost more lessons to 「どれでもない」 (31% of readings shown for the
textbook master; 45–52% for these two). With no words to go on, the interpreter's second readings rarely found what was meant
(6 of 27).

**Decision.**
- **The tap:** when the master taps 「どれでもない」 on the first readings, the same tap can say where the draft was off: 宛先 /
  手段 / 時期 / 裏の一言 / 書式 / その他.
  - It is shown on every first-round 「どれでもない」, whatever the remark (Kento's choice). The 「なんか違う」 master always says
    something, so a "no remark" condition would never reach them.
  - Optional: 「どれでもない（場所は選ばない）」 goes on as before. It is one tap, not an extra one. Second readings end with a plain
    「どれでもない」.
- **Only a hint:** the area goes to the second interpretation, worded as a hint ("put readings about these fields first; not a
  reason to invent a difference").
  - It writes nothing and filters no reading.
  - It leaves alone: the floor (money, contract terms and first contact always go to the master; D-044 still drops any reading
    that would stop routing to the master), 確かめ稽古, regression checks and generalization.
  - The 帳場 shows 「…」を手がかりに on the second readings; the session keeps it (`Pending.area`).
- **Areas → draft fields** (`src/learning/area.ts`):

  | Area | Draft fields |
  |---|---|
  | 宛先 | formalTo |
  | 手段 | channel, meeting |
  | 時期 | timing |
  | 裏の一言 | backchannelTo |
  | 書式 | format |
  | その他 | followUp, posture, escalateToMaster |
- **Simulated master:** taps the area of the field that would clear its most serious failed check, the way a real master knows
  their own objection.
  - It skips at a set rate, drawn from its own random stream so the remarks are unchanged.
  - **The skip rates are assumptions, not measurements:**
    - 50% for the silent persona;
    - 30% for the vague one;
    - 20% for everyone else, which is the default (`WHERE_SKIP_DEFAULT` in `eval/simulator/master.ts`).
    - A real master may answer less often.
- **The official measurement (`eval:final`, 11/7) runs on this version, with the 20% default skip rate.** The README notes this
  under its numbers.

**Checked.**
- **hitl-reviewer:** no blockers. Its smaller points were applied:
  - a strict parse of the button value, with a test;
  - the stored area is checked again before use;
  - the hint wording was softened.
- Tests pass; `eval:smoke` and `eval:quick` were run (they use the naive apprentice, so they cannot show this change).
- **Live browser check** (127.0.0.1, at most $0.13; `scripts/check-diff-area.ts`; `docs/screens/diff-area-*.png`):
  - After a △ with no remark, the readings came with the six area buttons.
  - 「どれでもない（場所は選ばない）」 led to the second readings, which had no area buttons.
  - At phone width (390 px) the area buttons are 44 px tall, raised from 40 px for touch.
- **Persona rerun** (fictional data, one path each, seed 101, $2.80; `docs/personas-2026-11-04.md`):
  - **With an area tapped:** the second readings found what was meant in 7 of 13 cases; without one, 1 of 13.
  - **Silent master:** 「どれでもない」 at the end 52% → 30%; rules 17 → 20; match 70% → 75%.
  - **Vague master:** 45% → 50%. It skipped the area 7 times, and all of those missed. Match 65% → 70%.
  - **Textbook master** (Kento 11/4, $1.24; total $4.04 of the $4.3 limit):
    - 「どれでもない」 at the end 31% → 25%; rules 22 → 23; the area helped 3 of 5 times.
    - Match 90% → 70% and ○+△ 95% → 80%. The two training paths already differ at the first correction, before any area was
      tapped, so one path cannot tell whether the chooser changes the baseline.
    - The official 5-path measurement on 11/7 is where that shows. 80% ○+△ is below the earlier paths' 90–95%; watch it there.
  - **On / off check** (Kento 11/4; `KOKOROE_EVAL_DIFF_AREA`, seeds 202 and 303, $4.72):
    - ○+△: on 85%, off 95% (mean of two paths). Match: on 65%, off 68%.
    - Seed 202 parted at the first area tapped; seed 303 parted before it.
    - On is 10 points below off on ○+△, past Kento's 5-point line. **Kento decides whether the official run uses on or off.**

**Narrowed (Kento 11/4): 「どこが違う？」 only when the remark is empty.**
- **The three on/off pairs** (textbook master, one training path each, fictional data):

  | Seed | ○+△ on | ○+△ off | Match on | Match off | Where the pair parted |
  |---|---|---|---|---|---|
  | 101 | 80% | 95% | 70% | 90% | before any area was tapped |
  | 202 | 85% | 90% | 70% | 60% | at the first area tapped (その他) |
  | 303 | 85% | 100% | 60% | 75% | before any area was tapped |

  On was lower on ○+△ in all three, 10 points on average for seeds 202 and 303, past Kento's 5-point line.
- **Why it went down (an informed guess, not a measurement):** a master who gives a remark has already said what was wrong. The
  area tapped by the simulated master (the field that clears its most serious failed check) can point elsewhere than the remark,
  and the second readings then follow the area against the words. Without a remark the area is the only clue, and there it helped
  (the silent master: 「どれでもない」 52% → 30%).
- **Decision:**
  - The 帳場 offers the area buttons only when the △/× had no remark (`askWhere` in `src/learning/area.ts`, used by the loop, the
    帳場 and the action). With a remark, 「どれでもない」 leads to the second readings as before D-057.
  - The evaluation switch `KOKOROE_EVAL_DIFF_AREA` stays. Its default `on` now means this narrowed condition.
- **Correction to an expectation:** the textbook master is not always talking. It gives no remark on 20% of its △/× by design
  (`SILENCE_RATE` in `eval/simulator/remark.ts`), so for the official run the narrowed version is not quite the same as off. It
  comes up in those silent cases (here 2 of the 5 second rounds).
- **Check** (seed 202, $1.20; `eval:smoke` passed): one textbook path with the narrowed version.

  | Seed 202 | Match | ○+△ | Active rules | 「どれでもない」 at the end |
  |---|---|---|---|---|
  | Narrowed | 85% | **95%** | 22 | 4 / 8 |
  | Off | 60% | 90% | 18 | 5 / 12 |
  | On, every time | 70% | 85% | 21 | 3 / 11 |

  - ○+△ is back in the off range (90–100%).
  - It parted from the off path at T04, where the first correction had no remark and the master tapped その他.
  - The second readings hit 1 of 2 with an area and 0 of 3 without.
  - One path; the 5-path official run on 11/7 measures it properly.
- **The official measurement (`eval:final`, 11/7) uses this narrowed version** (default `on`, skip rate 20%, an assumption).
- **hitl-reviewer on the narrowing** (after the commit, as the project rules require; no server): **no blockers.**
  - **Checked that no area reaches the interpreter when there is a remark:**
    - A crafted `none:<area>` post is stored as a plain 「どれでもない」.
    - `noRemark` is set by the server from the stored remark.
    - Cards saved before the narrowing, 確かめ稽古 follow-up cards and second readings get no area.
  - **The floor is untouched,** and so are D-044, 確かめ稽古 and regression.
  - **Applied:**
    - The action's rule for storing an area moved into a pure helper (`areaToStore`), with a test for each case above.
    - Note: the 帳場 reads the stored `noRemark` flag, which `askWhere` sets, rather than calling `askWhere` itself.
- **Live browser check of the narrowed screen** (127.0.0.1, after the master-role test; `scripts/check-diff-area.ts`;
  `docs/screens/diff-area-{noremark,remark}-desktop.png`, `diff-area-phone*.png`):
  - △ with no remark: the six area buttons appear.
  - △ with 「違う」: only 「どれでもない」 appears.
  - Skipping the area leads to the second readings, which have no area buttons.
  - At 390 px the area buttons are 44 px tall.
  - The server was stopped afterwards.
  - **Noted, unchanged (from before D-057):** in the 帳場 a 確かめ稽古 follow-up correction can get a second round of readings,
    while the evaluation loop's follow-up has one. This matters only when comparing tap counts between the two.

## D-059 · 2026-11-04 · Accepted (Kento) · Master-role test: what one first-time person measured, and what it could not

**What was done.** Kento played the master in the 帳場 on 20 fictional scenes, on 127.0.0.1, with live drafts. Result:
`docs/results/master-role-test-2026-11-04.json`.

**Measured** (one person, fictional data):
- **Time to mark ○/△/×:** median **53.5 s** per card, including reading the draft and its message. 20 cards took about 18 minutes.
- **Time to add a remark and record it:** median 1.3 s. Almost no remarks were written.
- **Marks:** 18 of 20 were ○. The 2 corrections each became a 心得.

**What it shows, stated plainly.**
- The author has never dealt with this fictional company or its clients. Seeing them for the first time, polite and plausible
  drafts looked acceptable, so 18 of 20 got ○.
- This is the situation the product addresses: a successor who does not know the history would send the AI draft as it is.
  Only someone who knows the history can correct the tacit part.
- So this is a result checked by a person, not a weakness to hide. The value of the 帳場 depends on the master being the person
  who holds the history.

**Not done, and not measured.**
- **Writing the same etiquette as prose was not done.** A first-time author has no experience to write it from, so the task did
  not apply.
- **Not measured:**
  - how much etiquette comes out;
  - judging time compared with writing time.
- **No writing time is invented.** Any impact estimate that would need one either says plainly that it is an assumption, or does
  not use it. The submission draft's "faster than writing" sentence was replaced accordingly.

**Separate from the persona simulation** (`docs/personas-2026-11-04.md`), which checks tolerance to variation between people with
the machine judge. This test is one real person's time on the real screen. The two are reported side by side, never mixed.

**Addendum (11/5, Kento: record it whichever way it comes out).** The same 20 drafts were scored by the code judge
(`eval/master-role-vs-simulator.ts`, no API; `docs/results/master-role-vs-simulator-2026-11-05.json`). Of the 18 the author
marked ○, the hidden ground truth marks 3 ○, 8 △ and 7 ×; of the author's two △, one × and one ○; the same mark on 3 of 20.
Conditions: the drafts as the author saw and marked them (stored with each judgment, after the money/contract floor), drafted
live during the test from that session's 心得帳 (the ledger's constraints plus the two 心得 learned from the author's △); the judge
`eval/simulator/judge.ts` over `data/hidden`, frozen since 11/3 (D-017); the contact plan only (visit plans are not in the
ground truth, D-061). This is the ground truth of one simulated master, not of a real veteran.

## D-060 · 2026-11-04 · Accepted (Kento) · Own-company comparison: prose first, then judging; only times and counts leave

**Context.** In the master-role test (D-059) the author had no history with the fictional clients, so writing the etiquette as
prose could not be done, and judging time could not be compared with writing time. Kento will run the comparison on 11/5 on his
own clients, in 「自分の会社で始める」 (D-056).

**What was built**
- **Timings in own mode:** the same items as the master-role test. Writing a situation is its own row (「状況を書く」), counted in
  neither the judging time nor the writing time.
- **Write first, so the AI does not anchor the prose:** 「比較テストを始める」 on the writing page. While it is on, the 帳場 holds
  back, and does not even draft, any card whose situation has no prose yet. Prose can be written only for a situation not yet
  judged.
- **Writing page in own mode:** pick one of your own situations and write the etiquette.
- **Summary page in own mode:**
  - The timing table.
  - A counting list with the prose and the 心得 learned from judging side by side, under one rule: 「後任がそのまま実行できる
    具体的な作法か」. A number per prose text, a tick per 心得; the counts are saved in the own folder.
  - A preview of exactly what will be saved.
- **`npm run own:save`:**
  - Writes `docs/results/own-company-test-<date>.json` with times and counts only.
  - `buildOwnResult` builds it from numbers. `assertNoText` refuses to write if any string other than the fixed note and the
    date is present.
  - A test feeds marked situations, prose, remarks, 心得 and answers, and checks that none comes out.
- **Procedure:** `docs/own-company-test.md`. It covers:
  - stand-in names, and what never to enter;
  - checking the employer's policy on sending data to an external API;
  - the order (prose first);
  - the counting rule;
  - deleting everything with 全部消す afterwards.

**Checked**
- Tests pass, `eval:smoke` passes.
- **One live run on 127.0.0.1**, with a throwaway own folder and one fictional stand-in client (`scripts/check-own-compare.ts`):
  - the card was held and not drafted until the prose existed;
  - the draft then appeared, and a △ was read;
  - the counting list showed 1 prose text and 1 心得;
  - the preview and the saved file held no text.
- The throwaway folders were deleted, and the server was stopped.
- Own mode stays absent from the public version (the existing tests).
- **hitl-reviewer:** no code blocker. One doc blocker and five smaller points, all fixed before committing:
  - **Doc (blocker):** the procedure understated what goes to the Claude API. It now lists the remarks, the 「なぜ？」 answers, the
    chosen readings, the 心得 text (sent with every later draft) and successor questions, and says the prose is not sent. The same
    care applies to remarks, where a real name or amount most easily slips in.
  - **The check script refuses a non-empty own folder.** It takes screenshots into the repo, so a server on the real ~/.kokoroe
    must never be checked with it. The refusal was tested: nothing was written.
  - **Only situations added after 「比較テストを始める」 take part** (`compare.fromIndex`). A card already drafted may have been
    read, so its prose would not be "first".
  - **Prose:** written once per situation, only before its draft exists. A judgment of a held card is refused.
  - **Counts:** a missing count is skipped, not taken as 0.
  - **The save gate also checks keys.** Every key must be a known field name, not only every value.
- The live run was repeated after the fixes, with the same result.

## D-061 · 2026-11-04 · Accepted (Kento) · 訪問の段取り — in the app, never in the evaluation

**Context.** Kento (11/4, night): the screens read as "a tool for stamping ○△× on email drafts". The value is the 段取り and the
etiquette beyond email, including what to get right on a visit: dress (some clients dislike suits), a gift, what to check before
going, who attends, how to address people. Kento approved the addition without a proposal memo.

**Decision.**
- **What it does:** when the apprentice's plan visits the client (`meeting: "in_person"`), the app's apprentice also writes a visit
  plan (`Proposal.visit`: attire, gift, checkFirst, attendees, address). It appears in the 帳場 as its own section 「訪問」. The
  master corrects it with the same ○△× and one line.
- **How a correction is learned:** through the existing interpreter. Only for a draft that carries a visit plan, the readings may
  name the fix field `visit` (free text). Everything else about learning is unchanged: the master's choice, 「どれでもない」,
  「なぜ？」, sources and 沿革.
- **Off in the evaluation.** The hidden ground truth has no visit etiquette, so there is nothing to judge it against.
  - The apprentice is built with visits off unless the caller passes `{ visit: true }`. The app does (`visitInApp()`, which
    `KOKOROE_VISIT=off` turns off). Eval scripts pass nothing; `KOKOROE_EVAL_VISIT=on` is the only way to turn it on there, and
    no official run uses it.
  - **Tests pin the requests.** `tests/visit.test.ts` holds SHA-256 fingerprints of the apprentice's request (system prompt, client
    card, kokoroe-chō, scene, output schema, all parameters) and of the interpreter's request. They were taken from the code before
    the change (commits ba85a78, a17787c) and still match with visits off. With visits off the answer has the same keys as before.
  - **So the official Before/After does not move:** 「評価の対象は連絡の段取り。訪問の段取りは正解がないため対象外」 (both READMEs).

**Revised 11/5 (Kento): the visit plan is a separate, second call.**
- **What the night showed.** In the first version the visit instructions were part of the apprentice's one request (a paragraph
  added to the system prompt and a combined schema). When the demo was re-recorded with visits on (above, and
  docs/ui-polish-log.md), the 丸新酒造 drafts put the 蔵元 in front and 奥様 behind: the instructions moved the contact 段取り
  itself. So the apprentice in the app (visits on) and the apprentice being evaluated (visits off) were different apprentices,
  and the evaluation no longer described the product.
- **Decision.** The 段取り is always made by the evaluation's request, byte for byte, with visits on or off. Only when visits are on
  and the decided 段取り visits (`meeting: "in_person"`), a second call (`planVisit`, its own prompt and schema) gets the decided
  段取り as quoted data (`<plan>`), with the client card, the kokoroe-chō and the situation, and writes only the visit plan. It
  cannot change the 段取り: its schema has no 段取り fields, and the 段取り fields are kept as decided.
- **Unchanged:** the interpreter, the kokoroe-chō, 確かめ稽古 and the regression check treat `proposal.visit` as before. The
  money/contract floor still reads the visit plan (B1 of the first review); every proposal, with or without a visit plan, goes
  through it.
- **Tests** (`tests/visit.test.ts`): with visits on, the first request matches the fingerprints taken before D-061 (without and
  with a kokoroe-chō), every 段取り field comes back as decided, a draft that does not visit makes one call, and a failed visit
  call still returns the 段取り. Rule ids from the visit call are kept only if they were in the kokoroe-chō it was given.
- **hitl-reviewer:** no blockers. Applied:
  - the visit prompt says not to mention prices or terms at all, because the model had written disclaimers
    (「価格や条件は話さない」) that tripped the floor;
  - `<plan>` is declared quoted data, like `<situation>`, since the draft's text is shaped by the situation;
  - invented rule ids are dropped;
  - the visit call's usage is counted even when it fails.
- **The demo record (11/5).** The recorded 段取り are unchanged. `eval/add-visits.ts` added a visit plan only to the queued drafts
  that visit: 4 in デモの続き and 9 in お試し (≈ $0.07). It reads each snapshot's own kokoroe-chō, and it stops if any 段取り field
  would change. The demo queue now opens with its first visit (T27, order only). The 師匠役テスト set is not touched.
  - **T05 → T13 is as before:** T05 goes to 奥様 with no quiet word; T13 adds the quiet word to the 蔵元 (K-011).
  - **One お試し card now goes to the master:** T10's recorded message mentions a 随意契約 procedure (「契約」). It was recorded
    before the floor read the message (D-044); applying the floor now raises it, as the live app would.
- **Cost:** a visit draft costs one more Sonnet call (≈ $0.006).
- **Known limits.**
  - **確かめ稽古 cannot check a visit 心得 by code.** `ruleTook` returns "cannot tell" for a `visit` fix, so it is never withdrawn
    automatically. The master still marks the re-solved draft.
  - **Regression ignores visit wording** (`sameDecision` compares the contact fields only), so a visit 心得 never triggers a
    regression check.
  - **「どこが違う？」 has no 訪問 button.** A visit difference falls under その他; the area labels are part of the interpreter's
    prompt and stay as they are.
  - **A visit 心得 is not re-checked in regression.** In the app, a new visit 心得 that changes the visit plan of an earlier ○ scene
    passes without the master seeing it. The hitl-reviewer suggested asking whenever the two visit plans differ. Not done: the
    wording differs on almost every re-solve, so nearly every regression check would cost a tap. **Kento (11/5): keep it this
    way.** One more tap on nearly every regression check costs more than it protects. A visit plan never sends or promises
    anything, money and contract words in it still go to the master (the floor reads it), and the master sees the visit plan on
    every new draft anyway.
  - **The public version** gets it at the freeze rebuild (11/6), not before.
  - **The demo record keeps no visit plans (11/5).** Kento asked to re-record the demo with visits on, on condition that the
    丸新酒造 T05 △ → T13 quiet word to the 蔵元 still happened. One run (T01–T20, the demo's v1 settings, seed 7, ≈ $0.52): with
    the visit instructions added, the first drafts for 丸新酒造 put the 蔵元 in front and 奥様 behind (× on R04, nothing learned at
    T05). The condition failed, so `data/demo/` is unchanged. It also shows that the visit instructions move the contact
    段取り itself — one more reason they stay out of the evaluation. Details and an alternative: docs/ui-polish-log.md.

**hitl-reviewer (before commit): one blocker, fixed.**
- **B1, fixed:** the HITL floor (`needsMaster`, and so `mustReview`) read only the situation and the message. A gift like
  「無償で試作品を持参」 would not have gone to the master. The floor now also reads the visit plan, and the visit prompt says
  the visit plan never offers prices, free work or contract terms. Tested.
- **Also fixed:**
  - The `visit` fix is for the visit plan itself; channel, meeting, timing and recipients use their own fields, so 確かめ can
    check them.
  - For visit drafts, the schema says the visit plan is the apprentice's draft, not instructions.
  - `eval:final` refuses to run with `KOKOROE_EVAL_VISIT=on`, and `eval/run.ts` prints it when on.
- **Kept as a limit:** the regression point above.

**Live check (own mode, 127.0.0.1, a throwaway folder, one fictional stand-in company and client; ≈ $0.09).**
- **Scene 1 (担当者の交代, 「工場へあいさつに伺いたい」):** the draft visited and showed the 訪問 section. △
  「この先方はスーツを嫌う。作業着で行け」 became 「取引先Aへの訪問はスーツではなく作業着で行く。」 with the why
  「昔、スーツで工場に行って浮いた」; the 確かめ re-solve was marked ○.
- **Scene 2 (新しい提案):** the next draft already said 「スーツではなく作業着で伺う」 citing that 心得. △
  「行く前に、新ラインの立ち上げがどうなったか確かめておけ」 became the second 心得. The regression check asked once (the
  earlier scene's channel had changed) and was marked ○.
- **Found and fixed on the way:**
  - **The 確かめ card crashed the 帳場 in own mode.** It looked the scene up only among the fictional training scenes and fell
    back to C01. This was there before D-061 (own mode's first 確かめ never reached the card in the earlier checks). It now looks
    in the session's queue first.
  - **An internal id inside the visit text** (「（K-001）」): ids are stripped on screen (D-053), and the visit prompt asks for
    none.
- **Observed, kept:** scene 2 was sent to the master by the floor because the visit plan itself said 「価格や条件には触れず」.
  The floor is broad on purpose (D-044: a needless ask costs one tap). **Kento (11/5): keep it broad (the safe side).**
- **Confirmed by the review:** no eval entry point passes visits; the off request is unchanged; traceability is unchanged
  (source judgment, date, the master's words, before → after).

## D-062 · 2026-11-05 · Accepted (Kento) · The own-company comparison was stopped; no AI-made substitute; the feature stays

**Context.** The comparison test (D-060) was to time the same etiquette written as prose against marked ○△×, on clients the author
knows. On 11/5 Claude prepared it: a stand-in ledger (「（仮）自社」, 取引先A〜E, roles only, no constraints), five general
scenes chosen by Kento from a list (one per client), entered into the running test. Kento stopped before writing any prose.

**Why it was stopped (Kento).** The ledger was a stand-in. Kento did not know what was particular to 取引先A〜E, so the only prose
he could write was general manners that fit any company — the same average the AI already knows. Comparing writing with
correcting on that cannot show the difference that matters, the tacit part.

**Observation.** This is the same thing the master-role test showed (D-059): on a fictional company the judging time could be
measured, but the prose task did not work, and 18 of 20 general-looking drafts were marked ○ by someone without the history.
Both point to one thing: **tacit etiquette exists only inside a relationship with a concrete client.** Without that relationship
there is nothing to write down and nothing to correct.

**Decision.**
- **Nothing saved.** `own:save` was not run (no prose was written). `~/.kokoroe` was deleted with the app's 「全部消す」, the server
  was stopped, and no port is open. No drafts were made, so no API cost.
- **No AI-made substitute.** Claude will not write the "prose" or the "experience" in Kento's place. An AI writing the etiquette
  and an AI guessing it would only measure the AI against itself — no more than the persona simulation already shows.
- **The feature stays.** A company that adopts Kokoroe can use it with a veteran on clients they really know, and then compare the
  time to write with the time to correct. The README's 「自分の会社で始める」 says so.
- **Claims follow what was measured.** "Correcting is easier/faster than writing" has not been measured on a person here.
  Checked README (both), the submission draft and the video:
  - README.md: "mark a draft ○△× faster than they can explain it" → "look at a draft and mark it ○△×" (the Japanese line already
    said only that).
  - Submission draft: 「インタビューにも、書き起こしにも時間を取りません」 → 「インタビューや書き起こしの手順はありません」; the stopped
    comparison is listed under 測れていないこと.
  - Video s04: 「ベテランは一瞬で、「違う」と言えます」 → 「ベテランは「違う」と言えます」 (the measured median was 53.5 s per card,
    including reading). Re-synthesized (9.38 s).
  - Kept, because they describe the procedure, not a measured gain: "No explaining" / 「説明は要りません」 (the master is not asked
    to explain), 「直すだけで」 (the concept), s03 「書いて残して、と頼んでも、言葉にはなりません」 (the problem the product starts
    from, CLAUDE.md's core insight; not presented as a measurement).

## D-063 · 2026-11-05 · Accepted (Kento's direction) · Showing the effect on screen, from recorded data and real behaviour only

**Context.** Kento (11/5): the purpose and the effect must come across to a first-time visitor and in a demo, without claiming
anything that was not measured (D-062).

**Decision.**
- **帳場 「変化」.** On the first draft where a learned 心得 takes effect, the row the 心得 is about is shown as 直す前 → この案,
  with the corrected scene and the master's mark. "Takes effect" is decided by code with the same check as 確かめ稽古
  (`ruleTook`): this draft follows the 心得's point, the corrected draft did not, and no draft judged after the correction
  followed it yet. Other rows that changed are listed in one grey line as 「心得とは別の違い」, so nothing is credited to a 心得
  that it did not cause (ui-critic).
  - In recorded mode the visitor's △ teaches nothing, so the panel uses the recorded training run (its 心得帳 and judgments to
    T20, then its first drafts T21–T40, which are the お試し drafts) and says so: 「記録した稽古で、師匠が直したあと…」. A
    visitor's own correction (live) is worded 「あなたの直しから書いた心得が…」.
  - Where it shows: お試し T13 (丸新酒造, K-011: 裏で誰に なし → 蔵元にも一言), T20, T23, T26; デモの続き T23 (4th card), T26.
- **心得帳 「この心得が効いた案」.** Drafts judged after the 心得 that followed it (same check) or named it as a basis.
- **暖簾を継ぐ 心得帳なし／あり.** For the example questions, the answer recorded WITHOUT a 心得帳 (the "v0-general" arm) beside the
  answer with the grown 心得帳 — both from the same evaluation run (eval/runs/2026-11-02T21-25-03-586Z-successor-x3.json), copied
  to `data/demo/recorded-answers-general.json` by `eval/build-general-answers.ts`. No API call. Display order puts first the
  questions where the two differ most (no answer without, an answer with reasons with); the questions themselves are unchanged.
  The reason line no longer shows 「（未記入）」 when a revised rule's original reason exists (a display parser fix).
- **Home.** One example, top to bottom, all recorded: the apprentice's T05 draft (裏で：なし), the master's △ (no remark — shown as
  it was), K-011, the next 丸新酒造 draft (裏で：蔵元にも一言), and the successor's recorded answer (Claude Code with the 心得帳 Skill,
  demo/successor-mcp).
- **デモの続き guide**, closable: 一 案を読む … 五 後任が理由つきで答える, with a note that the demo runs on recorded data.
- **稽古の記録 headline:** one sentence from results.json (taps, ○ rate before → after, history questions), labelled 途中経過 until
  the official run.
- **Unchanged:** learning, judging and evaluation code; the question set; no new API calls.
- **Not done (for Kento):** the critic suggested folding the home page's 10-scene list into a collapsed section so the example
  ends the column. That list was Kento's request (11/4 night), so it stays.

## D-064 · 2026-11-05 · Accepted (Kento, after the organizers' answer) · What was made with Claude, said in the repository and on screen

**Context.** The organizers answered three questions:
- Only what was made with Claude is judged, and the repository should say which part that is.
- A demo through Claude Code should let the judges see which part is the entrant's own MCP server.
- A partly synthesized narration is fine.

**Decision.**
- **README (en/ja): 「Claude で作ったもの／Claude 以外のもの」.**
  - *Made with Claude:* this repository's code and documents (Claude Code), what Claude writes inside the app, and Kokoroe's Skill
    and MCP server.
  - *Not made with Claude:* the Polly narration voice, Lightsail hosting, the main OSS and fonts, and the two statistics sources.
  - No outside images or music are used.
  - The author's calls and Claude Code's work are linked to how-we-built.md.
- **Video, on screen only (no narration change, no new Polly call).**
  - s04b: chips for 「文面は Claude の API（既製）」 and 「ココロエが作った仕組み」.
  - s07: a tag 「ココロエの画面（自作）」.
  - s07b:
    - Claude Code is labelled as Anthropic's product, and the columns name Kokoroe's Skill and MCP server.
    - Each 根拠 carries 「Skill から」 or 「MCP から」.
    - The 藍 underline is explained as what Kokoroe's MCP server returned after the copy.
- **Not changed:** the app's behaviour, the evaluation, the narration.

## D-065 · 2026-11-05 · Accepted (Kento, after judge-critic's first pass) · The AI apprentice never goes on a visit; demo order and video lines

**Context.** judge-critic (reading the submission as a judge, `docs/judging.md`) found the recorded visit plans naming the AI
apprentice among those who go (「橙丸が主担当で伺う」; all 13 recorded visit plans named 橙丸). The visit prompt began "You are
橙丸, an apprentice salesperson", so the model treated itself as a person who visits. It also found the video's hand-off scene
answering from a ledger fact, and a few lines out of step with the screen.

**Decision (Kento 11/5).**
- The visit-plan prompt (the second, app-only call, D-061) says those who go are people (the person in charge, the master); the AI
  apprentice never visits and is never named among them. The first call (the 段取り, the evaluation's request) is unchanged: the
  fingerprint tests pass as before. hitl-reviewer: OK; its catch (the old visit plan was passed back as "decided") was fixed
  before re-recording.
- Only the recorded visit plans were written again (`eval/add-visits.ts --redo`, 13 plans, ≈ $0.07; every 段取り field checked
  unchanged). A test checks that no recorded attendee line names the apprentice (`tests/demo-visits.test.ts`).
- デモの続き opens on 浜風運輸's card T26, where 「変化」 shows (K-015, from the master's correction on T15), order only. Kento first asked
  for a 丸新酒造 card with 「変化」; none exists in デモの続き (K-011 first took effect on T13, in the recorded training run), so he chose
  T26 — the same client as the video's s07 and README picture 3. s07b keeps its 丸新酒造 question (Kento): only 丸新 and まちなか have a
  心得 added after the Skill copy, which is what the MCP comparison shows.
- Video: s07 asks 浜風運輸's delay question (answered from the master's × and its わけ, as README picture 3); s05's line reads
  「冒頭の1行のもとは、裏で蔵元へ、そっと一言。」 to match the screen's 「裏で誰に」 row; the end card has one small line, 「開発そのものも、
  製品と同じ形で進みました」 (the README's 「二つ目の帳場」). No narration added; scene lengths unchanged.

**Consequences.** Rule ids the old visit plans had added to a draft's 根拠 stay (the snapshot cannot tell which call cited them;
hitl-reviewer: minor). The drafts' messages are still signed 「橙丸でございます」 by the first call; not changed here.

## D-066 · 2026-11-05 · Accepted (Kento's conditions) · 先読み: the next draft is made while the master reads, used only after ○ with the same 心得帳

**Context.** 体験の目 measured 7–9 s between recording ○ and the next live draft (production build, 127.0.0.1).

**Decision (Kento 11/5, conditions).** While a card is shown (live only), the next card is drafted in the background. It is used only
when the master marks ○ (judge(○) approves it; nothing else does) and the 心得帳 is unchanged since it started (hash of every rule
and its history). △/× and 取り消し discard every prefetch of the session, so 「直したら、次が変わる」 is never a card late. Until used it
lives in process memory only — not saved, shown or learned from. Other flows (確かめ稽古, regression, the money/contract floor) keep
their order; a used draft gets the same floor. Discarded prefetches count toward cost and limits. A failure falls back to the
previous flow. The evaluation never prefetches (import-boundary test). hitl-reviewer blocked the first version on two races (a stale
render claiming after △; a prefetch surviving an undo) and a long wait; fixed before commit.

**Result.** ○ → next draft 0.3 s when the master reads ≥ 10 s (was 7.4–9.1 s); unchanged after △/× (4.6–5.2 s). Estimated +20–30 %
spend per visitor, so about 20 % fewer visitors before the public $5 daily cap (docs/ui-polish-log.md).

**Addendum (11/5 evening, Kento).** When the 心得帳 changes before the prefetch is used, it is made again from the new 心得帳: the
run that finds the book changed under it drafts again in the same slot (one at a time, at most 3 redos per slot), and a render
that finds a finished prefetch out of date replaces it. Each redo is reserved against the limits with the visitor's address taken
during the request, and its cost is recorded even if discarded. The conditions of use are unchanged. hitl-reviewer: OK. Result:
the first ○ after a correction 10.1 s → 1.3–1.6 s; about one or two more drafts per correction.

## D-067 · 2026-11-06 · Accepted (Kento) · Public demo spend caps for the submission: $10 a day, $60 a month

**Context.** The prefetch (D-066) raised the measured cost of a short visit (3–4 cards, one correction) from about $0.06–0.09 to
$0.08–0.11 (fictional data; reading times and routes differed, so not a like-for-like comparison). Three options were laid out in
docs/freeze-report.md, section 2.
**Decision (Kento 11/6).** Option B: `KOKOROE_DAILY_USD=10` at the freeze rebuild (about 90–160 short visits a day), and a Claude
Console monthly limit of $60 on the public workspace, set by Kento after checking this month's spend. Spending is covered by free
credits; the limits are there so that no real cost arises. Over a limit, the demo goes on with recorded data and says so.
**Recorded in:** docs/deploy.md, docs/final-day.md (the Console step), docs/freeze-report.md.

