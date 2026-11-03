# How we built it with Claude Code / Claude Code の使い方の記録

Short entries, appended every work session. Source material for the README section and the submission form.

## 2026-11-03

- **Plan mode** — Claude read the out-of-repo planning notes (read-only, nothing copied) and proposed a day-1 plan
  (CLAUDE.md, stack, spike, eval skeleton). Kento approved it and added three amendments (evolution log split, pinned deps,
  hidden-rules disclosure) mid-session.
- **Bundled `claude-api` skill** — used to check the current Managed Agents memory-store SDK surface (beta headers,
  `memoryStores` / `memoryVersions` methods) before writing the spike, instead of relying on memory.
- **Hooks** — `PreToolUse` on `mcp__.*` blocks all MCP calls (keeps work connectors out of a public repo);
  `PreToolUse` on `Bash` runs a secret scan before any `git commit`. Both were tested with fake inputs before the first commit.
- **CLAUDE.md** — written from scratch for this repo: purpose, hard rules, model roles, evaluation-first policy.
- **Scaffolding without clobbering** — `create-next-app@16.4.4` was generated in a scratch dir and only the needed files were
  moved in, so the hand-written CLAUDE.md/docs stayed intact. Kept Next's generated `AGENTS.md` (Next 16 tells agents to read
  bundled docs) and pointed CLAUDE.md at it.
- **Debugging with Claude** — a vitest 5 peer-dependency conflict (template pinned `@types/node@20`; vitest needs 22+) was fixed by
  matching `@types/node` to the Node 22 runtime instead of `--force`; a missing `LayoutProps` type was fixed by running `next typegen` before `tsc`.
- **First guard test** — `tests/hidden-boundary.test.ts` fails if product code references `data/hidden/` (evaluation integrity).
- **Evaluation harness first** — Claude wrote the master simulator as code predicates (one per hidden rule), a naive no-API
  baseline, the runner, and 83 Vitest tests: an ideal ○ proposal per eval scene plus a ×/△ case per rule.
- **The guard test caught Claude itself** — `hidden-boundary.test.ts` flagged `src/disciple/v0.ts` because a *comment* named the
  hidden data path. The test was kept strict (any reference fails) and the comment reworded.
- **Smoke run found a simulator bug** — the first `eval:quick` showed the master saying "don't visit in winter" in June.
  Remarks are now keyed by the failure reason, with a test that every failing check has a matching remark list
  (the apprentice learns from these one-liners, so a wrong remark would teach a wrong rule).
- **Subagents & skills written for this repo** — `world-keeper` (fictional data, leak checks), `eval-runner` (runs eval, reports
  numbers, never reads hidden data for prompt ideas); skills `world-consistency` (canon & terms) and `decision-log` (how to keep these logs).
- **Spike run by Claude, key never shown** — `spike:memory` / `spike:export` ran against the real API with the key read from
  `.env.local` only; results (timings, versions, 409) went to `docs/spikes/2026-11-03-managed-agents.md` with the API key id left out.
- **Cost tracking added before spending** — the runner now records token usage and prints a USD estimate, so every eval run
  reports its cost (first v0 baseline: ≈ $0.18 for 20 proposals).
- **Kento's correction as a design input** — the D-009 question (what the apprentice may know) was asked, not decided silently;
  Kento's answer became D-011 and changed the Before. Recorded in evolution.md as an in-period change.
- **Subagent delegated in parallel** — the 40 training scenes were written by a subagent following `.claude/agents/world-keeper.md`
  while Claude built the learning loop. Project subagents created mid-session aren't registered until restart, so it ran as
  `general-purpose` instructed to follow the world-keeper definition. It wrote the scene keys, an ideal ○ proposal per scene and tests
  (132 tests total), and reported precedence choices instead of changing the judge.
- **Guarding the Before** — while refactoring the apprentice into a factory, Claude noticed an edit would also change v0's system
  prompt (already measured) and moved the new instruction into the v1-only kokoroe block instead.
- **Demo material captured as it happened** — the T05 → T13 run (表と裏 at 丸新酒造) was saved to `demo/scene5-marushin-front-back/`
  straight from the run's store file, with a note that the △ came without a remark (not edited for the video).
- **Simulator design kept mechanical** — Claude proposed that the simulated master pick a reading by *applying its implied fix and
  re-running the judge*, so the choice step needs no LLM grader. Tests cover "right reading picked", "none of these", and the
  history trigger answered only for rules that have one.
- **Smoke run before spending** — an 8-scene run (≈ $0.14) checked the new interpreter (short rules, 2–3 readings) before the
  ≈ $4–5 learning-curve run.
- **Freezing the answers with a hook + checksum test** — after Kento asked to freeze `data/hidden/`, Claude first proved the judge
  was unchanged by re-judging 60 stored v0 proposals (60/60 identical), then added `guard-hidden.sh` and a SHA-256 test.
  The first version of the hook blocked Claude's own `>> docs/decisions.md` because the text *mentioned* the path; it was narrowed
  to write targets and checked with 8 allow/block cases.
- **`hitl-reviewer` subagent** (`.claude/agents/hitl-reviewer.md`) — reviews diffs for: the master keeps the final say, nothing is
  sent/promised by the AI, untrusted client text can't write the kokoroe-chō, sources/history stay traceable, no real data/secrets,
  evaluation integrity. Read-only tools.
- **"Change it → re-test it" as hooks** (the product's regression idea applied to development) — `PostToolUse` on edits to
  `src/core|disciple|learning|successor` or the simulator runs the fast free tests at once (failures are fed back to Claude) and marks
  the API eval stale; `guard-commit.sh` then blocks `git commit` until `npm run eval:smoke` (5 held-out scenes, ≈ $0.05) has run.
  Running the full 20-scene eval on every edit would cost ≈ $0.18 each time, so the API check happens once per commit instead.
- **Tests found a real bug in the self-check** — Claude wrote the "narrow, else roll back" test before trusting the code; it failed
  because a recorded ×-recheck silently removed the scene from the retry. Fixed by fixing the regression set up front.
- **Commit gate in action** — after the `src/learning` edits the commit was gated until `npm run eval:smoke` ran (≈ $0.05).
  Note: edits made through shell scripts (python/sed) don't trigger the PostToolUse hook; Claude ran the tests and smoke eval
  manually for those, and will prefer the Edit tool for core files.
- **Control experiment before concluding** — A02 kept failing its draft check after the prompt fix. Instead of loosening the check
  or claiming the injection was neutralized, Claude ran the same scene without the injected sentence: identical drafts, so the
  failure wasn't injection-driven. Both results are recorded (D-021).
- **Mechanical simulator, again** — for ledger items, the simulated master's "why" answer is chosen by text overlap between the
  constraint and a hidden history (checked on all 10 constraints before wiring it in: exactly 生協, 港北, 大河原 match).
- **A/B diagnosis on one scene** — when curve v3 dropped, Claude re-ran the one scene that moved most (E13) with and without the 台帳
  rules (≈ $0.03) to find the cause before changing anything, then fixed only that (D-022).
- **Gated spending** — Kento set the conditions for running curve v4 without asking (accepted widening, no drop vs v3, ≤ $30/day);
  Claude checked them against the trial output and logged the check in D-023 before launching.
- **Hooks as a safety net mid-edit** — while restructuring the loop, the PostToolUse hook ran the fast tests after each edit and
  reported the broken intermediate states immediately; the commit gate also blocked a combined "smoke + commit" command (it checks
  before anything runs), so the smoke eval is now run as its own step.
- **UI built with fixed data, reviewed by a subagent** — the four screens were built against snapshots of real runs (no API calls),
  screenshotted with Playwright in light/dark × desktop/mobile after each screen (`docs/screens/`), and fixed from the screenshots
  (mobile nav wrapping, label widths). Next 16's bundled docs were read first (async `params`/`cookies`, `after()`, prerender rules).
- **`hitl-reviewer` caught three blocking bugs before commit** — the master's tap on a reading was never applied (status race), round 2
  could write a rule without a tap (contradicting D-025), and background work could overwrite the master's newer judgments in the
  session file. All fixed, with a regression test for the concurrent-store case; the deferred items became D-028.
- **Prompt caching, measured not assumed** — Claude added `cache_control` to the fixed parts and wrote an A/B harness (cache off vs
  on, sequential calls) that reports uncached/write/read tokens, cost, latency percentiles and verdicts. Result: −37% cost on the
  apprentice, latency unchanged, verdicts unchanged; no gain for parallel successor questions. The same A/B doubled as the check
  Kento asked for — it showed the Before had moved by ~5 points with the new layout, so the Before was replaced (D-030).
- **Handing the kokoroe-chō to the successor's own Claude Code** — the grown kokoroe-chō is exported as an Agent Skill
  (SKILL.md index + clients/*.md with 沿革; name/description per the Skills spec, unit-tested) and as a zip from the 心得帳 screen.
  Claude then ran `claude -p` in an empty directory holding only that skill, with MCP disabled (`--strict-mcp-config`) and
  `--setting-sources project`, and asked the successor's question: it answered Teams-not-Zoom with K-004 and the 2024 reason.
  A first run picked up the author's user-level output style — caught by reading the answer, and re-run clean (`demo/successor-claude-code/`).
- **Field test made measurable** — the 帳場 got a 実地テスト mode that timestamps each of the master's actions (hidden form fields,
  durations computed and clamped server-side) plus a prose-writing page for t_write, so the impact estimate uses Kento's own
  measured times. The whole flow was driven once with Playwright before handing it over.
- **Public-demo guards and README skeleton** — live calls from the UI pass per-session / per-IP / daily spend limits (tested), with a
  fallback notice; docs/deploy.md lists what Kento must create. Checking Amplify's documented Next.js support (12–15) and its
  per-request compute surfaced a hosting decision (D-032) instead of a late surprise. README (EN + JA) drafted with interim numbers
  clearly marked for replacement on 11/7.
- **Hosting checked against reality, not assumptions** — Kento corrected the plan (App Runner closed to new customers; Lightsail
  preferred). Claude rewrote the deploy guide, added a standalone Dockerfile, and noticed Next's file tracing was pulling the whole
  repo (incl. local session files) into the server bundle; excluded explicitly and re-checked that no `.env*` file is included.
  The image layout was smoke-tested locally without Docker by assembling the same files and running `server.js`.
- **A loosely written ledger line, found by evaluation** — the one scene wrong in every run traced back to 「連絡はメール」 in the
  public ledger; fixed per Kento (hidden data untouched), Before re-measured (55%), both recorded (D-033).
- **Reproducible demo recording** — `demo/successor-claude-code/run.sh` recreates the successor's Claude Code exactly: empty
  directory, only the exported skill, `--setting-sources project`, no MCP.
- **A hook before any AWS access** — this machine holds AWS profiles for other organizations, so before the first `aws` call Claude
  added `guard-aws.sh`: every `aws` command must carry `--profile brightflow-sandbox-ikeda`; other profiles, the default profile and
  inline `AWS_PROFILE`/keys are blocked, read-only calls included (13 allow/block cases tested, then verified live by a blocked call).
  The first real call found the SSO session expired, so work stopped there until Kento logged in.
- **AWS work with a human gate at every change** — Claude showed the account ID, did read-only checks (no existing container
  service; budgets per project scoped by service), listed the exact create commands, and ran them only after Kento's OK. Two
  surprises were handled without bypassing anything: Next.js segfaulting under amd64 emulation (→ build on the host, copy-only image)
  and lightsailctl needing a newer Docker API than Podman reports (→ `DOCKER_API_VERSION=1.46`). The public URL was then checked with
  Playwright, and the shared Podman VM was audited afterwards (only kokoroe images added).
- **Holding an approved deployment** — Kento approved the live deployment and, in the same message, asked to check how the per-IP
  limit reads X-Forwarded-For. It used the spoofable first entry. Claude did not deploy the approved (now known-flawed) image; it fixed
  and tested the IP logic first and brought the changed deployment back for approval.
- **Same logic, two shapes** — verification in the evaluation loop is one function; in the UI it must wait for the master between
  steps. Claude extracted the shared pieces (regression set, rollback) and rebuilt the flow as a small state machine in the pending
  item, then pinned it with tests that mock Claude. A wrong timestamp in the test data surfaced as a clean `error` status — the
  failure path worked too.
- **The demo video as code** — `video/` holds the scene table, HTML/CSS animation pages in the app's look, a Playwright recorder
  (subtitles drawn as an overlay, since this ffmpeg build has no subtitle filter) and an ffmpeg assembler. A draft with placeholders
  rendered end to end (2:49.7); Claude reviewed extracted frames and listed what must change before the final render.
- **Animation as reviewable stills** — the four explanation scenes (s02 well, s03 head, s07 diagram, s10 end card) are hand-written
  SVG line drawings and CSS animations only, so `video/stills.ts` can pause every animation at the same instant and write
  reproducible frames for review. Claude iterated on the frames (a ledger clipped by the ground line, a dotted "read only" path
  rendered solid, a brush crossing the quote) and on real recordings, which showed a 5-line subtitle hiding the read-only path —
  subtitles now advance one sentence at a time. Product names in the diagram are slots, filled after D-002.
- **A safer default for local servers** — Kento noticed the dev server had been reachable from the LAN for hours (it can call Claude
  with the dev key); CLAUDE.md now requires `--hostname 127.0.0.1` and stopping servers after checks.
- **The official run as one guarded command** — `npm run eval:final` checks the frozen hidden data, the corrected ledger and a clean
  tree, prints a cost estimate built from the unit costs of earlier measured runs, and stops unless given `--yes`; it saves each
  part so an interrupted run resumes, and stops before passing a budget. Every number shown anywhere (稽古の記録, the video, both
  READMEs) is now generated from one JSON, and a test fails if a README table drifts. Generating the table immediately caught a
  hand-copied number (0 / 18 where the data has 9 injection runs).
