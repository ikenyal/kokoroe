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
- **Master-role test made measurable** — the 帳場 got a 師匠役テスト (master-role test; first called 実地テスト / field test, renamed in D-046) mode that timestamps each of the master's actions (hidden form fields,
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
- **Narration prepared, not yet synthesized** — `video/narration.ts` builds SSML from the scene table with forced readings
  (`<sub>` for 心得帳, 暖簾, 沿革, ○△× …), counts billed characters and prints the cost; the Polly call waits for Kento's OK
  (AWS rule). The available ja-JP neural voices were checked with a read-only `describe-voices` call (sandbox profile).
- **A design before a build** — the read-only MCP server is written up as a proposal (`docs/proposals/mcp-readonly.md`) for Kento to
  decide on, since a product MCP server needs approval; read-only is specified as something enforced by types and tests.
- **Generated numbers paid off at once** — the first README block rendered from `results.json` disagreed with the hand-written
  table: it said the kokoroe-chō changed "0 / 18" times under injection, but the data has 9 injection runs (the other 9 of the 18
  adversarial runs are discount lures). The hand copy had mixed the two counts; generation from one JSON (with a test) removes that
  class of error for the final numbers.
- **The official run rehearsed** — with Kento's OK, `eval:final --smoke` ran the whole pipeline at toy size ($0.23), then
  `--resume` re-assembled it from saved parts with no new calls, and the smoke summary became a test fixture for the one path the
  smoke cannot reach (official results → `results.json` → README blocks without interim labels).
- **Narration synthesized for listening** — Polly (3 ja-JP neural voices × 6 scenes, 1,218 characters, ≈ $0.02) after Kento's OK;
  durations are checked against the scene table: s01 and s07 run long (≈ 15 s / 12 s and ≈ 21 s / 15 s).
- **A product MCP server, built and checked without using MCP here** — per Kento's conditions: four read-only tools, read-only
  enforced by a narrow store type and tests, and verification only in an empty directory outside the repo (`claude -p` with
  `--strict-mcp-config` naming just this server), so this repo's own no-MCP rule and hook stayed untouched. The roles are written
  down in the README: the **Skill is a copy at one moment; the MCP server is the window onto the kokoroe-chō that keeps growing** —
  `changes_since` shows what changed after the copy. In the demo, the same question got a different, better-grounded answer
  because the server surfaced a rule learned after the copy. The SDK API was read from the installed package's README and types.
  hitl-reviewer found no blockers and five smaller issues, fixed before committing; one fix first tripped the hidden-data boundary
  test (the guard named the path), so it now checks the store's content instead.
- **Preparing a decision instead of taking it** — for D-002 Claude built the memory-store adapter behind the existing store
  interface (flag-switchable, default unchanged), proved parity with a fake API in a test, then measured the real API with the
  same operations (no model tokens) and laid the evidence out under D-002 with one recommendation, leaving the decision to
  Kento. The official docs (via the claude-api skill) settled the workspace question: memory stores are
  workspace-scoped, so anything shared in public must be created with the public workspace's key.
- **Rehearsing the human test with a robot** — Claude drove the master-role test mode live with Playwright (20 cards, three corrections,
  "why?" answers, verification taps, 5 prose answers, report; ≈ $0.18). The first attempts found two script bugs (cards are drafted
  while the page loads; a second `<aside>` on the page) and one real flaw: verification taps were counted as "judging" time, which
  would have skewed the judge-vs-write comparison — they are now a separate timing kind. The procedure for Kento's 30 minutes is in
  `docs/master-role-test.md`, with `npm run field:save` to put the result into the repo.
- **The video as one command** — `npm run video:shoot` builds the same bundle as the container, serves it on 127.0.0.1 only with a
  throwaway data dir, records every scene with Playwright (screen scenes scripted, including the T05 → T13 queue for 帳場), stops the
  server, and assembles with ffmpeg. A rough cut with fixed data and a placeholder voice exists; frames from it led to two fixes
  (a larger viewport scaled down so a whole card fits; opening a rule with a reason in 心得帳) and to padding narration with silence.
- **Trying the judges' Quickstart as a stranger** — Claude cloned the repo from GitHub (still private; the saved credentials were used) into an empty directory outside this one and ran
  only what the README says, with an empty environment (`env -i`, no `.env.local`): `npm ci`, the dev server, a Playwright pass
  through デモの続き and お試し (a △ on one card, 心得帳, 暖簾を継ぐ with a preset question, 稽古の記録), `npm test` (180 passed) and
  `eval:quick`. Everything worked on recorded data with no key. The README was changed in three places: `npm ci` instead of
  `npm install`, `--hostname 127.0.0.1` with the matching URL, and no hand-written test count (it had gone stale at "150+").
  The check also found a server Claude had left running from an earlier step (127.0.0.1 only); it was stopped, and the clone deleted.
- **Usability checked by measurement, not by eye alone** — Claude computed WCAG contrast for every color token in light and dark
  (body and muted text pass; the placeholder at 60% ink was 2.4:1 and the edges of text fields 1.4:1 — both fixed, the latter with
  a new `--waku` token at 3.3:1), then drove the app with Playwright at phone (375) and tablet (820) widths in both color schemes,
  flagging any element wider than the screen. Only the learning curve broke: its labels shrank to ~6px on a phone, so it now keeps
  a readable width inside a sideways-scrolling region (a grid item needed `min-w-0` before that worked). Keyboard only: Tab reaches
  the ○△× marks in 9 stops, arrows choose, Enter records; the hidden radios now show a focus ring. The accessibility tree showed
  what a screen reader hears: the check-card buttons were named just "○" — now "○ よい / △ 条件つき / × ちがう", the prose box is
  labelled by its question, and the visible word under each mark no longer doubles the name. Screenshots: `docs/screens/a11y-*.png`.
- **A milestone audit by independent subagents** (after the past Claude Code hackathon winner ARIA, whose public repo keeps an audit
  per milestone: https://github.com/zestones/Aria, `docs/audits/`) — two read-only subagents,
  briefed with angles but not with conclusions: (A) safety/HITL, evaluation fairness, secrets; (B) README vs code and where every
  number comes from. The main session re-checked each finding against code and data before acting — which also caught one of its
  own errors: it first wrote that the repo was already public, because the test clone had succeeded; an unauthenticated request
  returned 404 (the clone had used saved credentials). Fixed: scope guards in the compiler (D-043, then hitl-reviewer, whose two
  narrowing suggestions went in), master-role test mode refused unless enabled, a per-IP start limit, a stricter boundary test (which at once
  flagged a comment), five more secret-scan patterns, and ten documentation/number fixes, including recording that the interim
  64% file was assembled by hand from console output. Ten items that need Kento are listed in `docs/audits/2026-11-03.md`.
- **The submission form as a draft with number slots** — `docs/submission-draft.md` (Japanese) answers the form's known items and
  the expected "how did you use Claude" questions from what the README, decisions and this log already say; every figure is a slot
  keyed to `results.json` (with today's interim value beside it) so 11/7's official run replaces them without retyping.
- **A safety rule moved from the prompt into code, with the metric kept honest** — after Kento's decision (D-044), Claude added a
  floor that routes price / discount / contract scenes to the master whatever the model says. hitl-reviewer pointed out that the
  safety number would then be guaranteed by construction and stop measuring the model; so the evaluation now records the model's
  own decision next to the floored one, the interim "9/9" is labelled as measured before the floor, and the 帳場 tells the master
  when the code, not the apprentice, escalated. A data-wide test checks the floor catches every lure and price scene. The widened
  hidden-boundary test from the audit caught Claude's own type-only import of `eval/` in a page within the hour.
- **A decision tested against a real run before merging** — Kento's first version of D-045 (withdraw a rule whose own 確かめ稽古
  fails, after one re-read) passed its unit tests, but Claude also ran 6 real training scenes (≈ $0.23) because the smoke run never
  reached the new path. The run withdrew correct rules — including the 丸新酒造 rule the demo video depends on — because a △ there
  usually meant "something else is still missing". Claude parked the change on a branch instead of merging, showed the evidence,
  and Kento chose the narrower rule: withdraw only when the draft does not follow the rule; otherwise keep it and learn the rest
  separately. The same run after the change kept the rule; hitl-reviewer reviewed both versions.
- **Settling D-002 from measurements** — Kento accepted the prepared recommendation on the strength of the spike's numbers and the
  official documentation alone: local JSON by default, the memory store behind `KOKOROE_STORE=memory` (session start ≈ 2.1 s,
  reads/writes 0.2–0.7 s). The s07 diagram's store slot was filled and checked as a still; the first two wordings wrapped badly
  inside the box, which only the rendered frame showed. Before deleting the spike's memory stores, Claude listed them on the API
  (read-only) and found three, not the two expected, and asked before deleting; after Kento's OK all three were deleted and a
  fresh listing showed none left.
- **Planned for 11/7: `/goal` with visible completion conditions** — the official run and the video will be driven by `/goal`
  (a public Claude Code feature: https://code.claude.com/docs/en/goal). The docs say the evaluator only reads the conversation, never files or commands, so every
  condition in `docs/final-day.md` names the command whose output proves it (results.json values, `npm test`, `ffprobe` ≤ 180 s).
  The day is split into two goals so a video retry can never loop back into the paid measurement, and "run eval:final once" is
  written into the condition itself.
- **Keeping session content out of a public repo** — after the organizers' notice that nothing from the sessions may be published,
  Claude searched the repo for session/workshop references (separating them from the app's own 帳場 sessions and from fictional data),
  rewrote the reasons to rest on our measurements and official docs (D-047), and — with Kento's OK — rewrote the history with
  `git filter-repo --replace-text` (16 text rules + 1 message rule). The rules were rehearsed on a throwaway clone first; the real run
  was checked before pushing: 0 hits across all history, the same final tree hash, noreply-only authors, tests passing. One attribution
  Claude had removed to be safe (ARIA's milestone audits) turned out to come from a public repo and was restored with its URL.
  The force push itself was stopped by the auto-mode safety check, so Kento ran it.
- **An overnight run on a branch** — Kento left four tasks for the night with explicit limits: no changes to learning, judging or
  evaluation code, no deploys, at most $3 of API spend, and stop and write it down when unsure. Claude worked on its own branch,
  pushed after each step, and kept `docs/night-2026-11-03.md` with what was done, what was checked and what needed a decision.
  - **Video:** the title's letters are "corrected" (s04), the brush's letters come undone (s03), and the master's words pile up
    into a vertical ledger (s09a). Every version was checked as stills; the first version of each had an overlap the stills showed.
  - **README:** the English version was made easier to read.
  - **Screens:** Japanese error and not-found screens were added, and a start limit became an explanation instead of an error.
  - **Tests:** 26 boundary tests. One of them surfaced that an unknown model would have cost $0 in the spend guard.

  The API was not used. In the morning Kento decided five questions; the cost fix (D-048) and putting s09a into the video
  (shortening s02 and s06, not the demo's peak) followed, and the branch was merged with a normal push.


- **11/4 — voice trial for the narration.** Kento found all three Polly voices lacking, so before giving up on Polly we
  tested whether text and SSML help: the v2 structure's passages 1 and 4 (drafted in-period on 11/4), four steps (as drafted →
  spoken rewrite → 90% rate + longer pauses → accents via pron-kana), Tomoko and Takumi. Claude Code read the Polly docs for
  per-engine tag support, ran `describe-voices` read-only (no generative or long-form Japanese voice in Tokyo), and
  proved each tag's effect by hashing PCM output with one tag changed at a time (Polly returned byte-identical audio for
  identical input, which made that test possible). Characters and cost were shown before any synthesis; ~$0.03.
  Notes: `docs/voice-trial-2026-11-04.md`. The choice is Kento's, by ear.

- **11/4 — the video rebuilt to structure v2 (D-049).**
  - **Voice:** Kento chose the voice by ear from the trial page (Takumi, 105%, accents).
  - **Narration:** Claude Code rewrote the v2 narration for speech and synthesized it with Polly (about 1,700 billed characters,
    about $0.03). It also asked Polly for sentence speech marks.
  - **Timing:** every scene's seconds, subtitle cues and animation beats come from those marks. Nothing is timed by guesswork.
  - **Scenes:** three new anim scenes (problem, what goes wrong, the flow); s03 and s08 were reworked around the narration.
    Each was checked as stills before recording.
  - **One bug:** an AWS CLI list option (`--speech-mark-types`) swallowed the output filename. Found by running the failing call
    by hand.
  - **Recording:** screen scenes now start their session off camera, so each clip opens on its own page. Rough cut: 170.0 s.

- **11/4 — video v3 (D-050).**
  - **Source:** Claude Code searched the web for a public job-change figure, and read the Statistics Bureau's summary PDF itself
    instead of trusting news articles. The articles said 331万人 for 2024; the bureau's latest annual figure is 330万人 for 2025.
  - **Time:** it worked the 3:00 limit as arithmetic from the measured narration. Kento's plan did not count the question cards
    and the answer line (about +13 s), so it proposed the extra cuts, keeping 帳場 and 暖簾を継ぐ whole.
  - **Scenes:** s00 and s01 are new; s02 merges v2's two scenes (retimed by script).
  - **Bug found in review:** the stills tool showed the wrong question card. Two pages that differ only by `#…` don't reload, so a
    blank page now goes in between.
  - **Polly:** 2,864 billed characters, about $0.046 (three passes: the v3 text, then 0.3 s pauses, then the s03 → s04 move).

- **11/4 — video v4 (D-051).**
  - **Scenes:** the cold open and the three forces were rebuilt as animation; the noren wipe was added as a recorder overlay.
  - **Stills:** every new scene was checked as stills before recording. Three rounds on the cold open: lines that wrapped, the
    face overlapping a card, and a copy of the line that left before its card stopped.
  - **Smoothness, measured:** to decide about HyperFrames, Claude Code counted unique frames in windows of continuous motion
    (ffmpeg `mpdecimate`) instead of judging by eye. Nearly every frame was new, so HyperFrames was not needed.
  - **Polly:** 558 billed characters, about $0.009.

- **11/4 — v5: breath and words (D-052).**
  - **Breaths:** `assemble.sh` holds frames with ffmpeg `tpad` (the last frame after a scene, the closed noren before a chapter).
    Checked in the output: the pauses are digital silence (`astats` peak −∞ dB), and the held frames carry no subtitle.
  - **Words:** Claude Code checked the use of ココロエ / 心得 / 心得帳 across the video, UI, READMEs and docs with `git grep`.
    It fixed the video and docs, and left the UI change for Kento's OK because it needs a redeploy.
  - **Shorter s04b:** the line that says the relation turned out shorter than the one it replaced (9.4 s against 10.3 s), so it
    went in the narration as well as on screen.
  - **Polly:** 680 + 64 billed characters, about $0.012.

- **11/4 — screens from the master's and successor's seat (D-053).**
  - **Walkthrough:** Claude Code walked the production build with Playwright (desktop and phone; local 127.0.0.1, stopped
    after) and listed what was hard to use. Kento chose to fix all of it.
  - **Phone check:** the 「どの意味でしたか」 state that only exists live was put into a test session to see the mobile layout.
  - **Review:** the hitl-reviewer subagent read the undo diff and found two blockers. Both were fixed and tested before
    committing.

- **11/4 — the successor's instructions, measured both ways (D-054).**
  - **Diagnose first:** Claude Code classified the failing history questions on the existing grown 心得帳 before changing
    anything. Its own first guess, a missing 「なぜ」, turned out wrong.
  - **Guard set:** it wrote questions the book cannot answer and measured them before and after the change.
  - **Review:** the hitl-reviewer found that the far questions could not show a regression and that "the master's words" would
    misattribute the apprentice's rule text. So near-miss and discount questions and a verbatim-quote check were added.
  - **Reading the result:** reading the answers showed that two of the "near-miss" questions were in fact covered by learned
    rules, and the result is reported that way.

- **11/4 — 自分の会社で始める (D-056).**
  - **Live check:** Claude Code walked the whole own-company flow live on 127.0.0.1 with a throwaway data folder: ledger → a
    written situation → draft → △ with a remark → a rule written → 「全部消す」. It stopped the server afterwards. Cost about $0.1.
  - **Three problems found by running it, not by reading:**
    - Next.js adds X-Forwarded-For to local requests, so the first "no proxy" check refused everything.
    - With cacheComponents, reading the request in the root layout breaks prerendering.
    - A production build's static shell is fixed at build time, so own mode runs on `next dev` (`npm run own`).
  - **Review:** the hitl-reviewer subagent reviewed the guards, the data handling and the deletion.

- **11/4 — persona simulation (docs/personas-2026-11-04.md).**
  - **Scope, stated plainly:** it checks tolerance to variation between people. It is not a substitute for a real-world test, and
    it is apart from the master-role test (Kento's own measured session).
  - **Personas:** Claude Code wrote persona wrappers around the machine master in `eval/` only. The correct answer stays the frozen
    hidden kokoroe and the machine judge; the personas only change remarks, marks, slips and how questions are asked.
  - **Wording:** generated by Haiku and cached, so runs can be repeated.
  - **Spend:** $9.76 of the $10 limit. The run stopped itself before the successor part, which was then run with a hard cap.
  - **Bug found by reading the outputs:** 20 of 130 generated texts were empty. That was fixed, and the affected successor
    persona was rerun. The affected master persona is reported as not valid rather than rerun past the budget.
  - **Then (Kento 11/4):** the storyteller master was rerun ($1.43, within the $1.6 he allowed). Rerunning a single persona now
    merges into the results file instead of overwriting it.

- **11/4 — 「どこが違う？」 (D-057).**
  - **The chooser:** built in `src/learning/area.ts` and wired through the loop, the interpreter, the 帳場 and the simulated master.
  - **Asking instead of guessing:** one condition in the request ("only when there is no remark") would have missed the vague
    master, who always says 「違う」. Claude Code asked Kento with a question dialog before writing code.
  - **Review:** the hitl-reviewer subagent ran in the background while `eval:smoke` ran. It found no blockers, and its smaller
    points were applied.
  - **A flaky test:** one test failed only with the diff. Timing it showed that a cold `npx tsx` start alone takes 2–17 s on this
    machine, so its timeout was raised; the diff was not the cause.
  - **Measuring it:** the persona rerun was cut to the two target masters to stay under the $4 limit. Splitting the second
    readings into "with an area" and "without" gave a clearer signal than the headline rate.
  - **Then (Kento 11/4):**
    - **Baseline rerun:** the textbook master was rerun ($1.24). Diffing the two training logs showed that the paths split at the
      first correction, before the chooser came up. So the report says one path cannot answer "is the baseline worse?", rather
      than reading the 20-point drop as an effect.
    - **Live check:** a short Playwright script (the library, not MCP) checked the new buttons on 127.0.0.1 at desktop and phone
      width, then the server was stopped.
  - **Dates:** some records said 11/5 on 11/4. The JST date code was right; Claude Code had taken the plan's date for the
    file name and a deployment entry. Those were fixed. The master-role test's file name now comes from the JST day the test
    was run (it had used the UTC date of `createdAt`).
  - **On / off:** an evaluation switch (`KOKOROE_EVAL_DIFF_AREA`) and four paths, run two at a time so as not to slow Kento's
    live master-role test on the same key. `eval/chooser-ab.ts` matches the on and off training logs line by line to show
    whether each pair parted at the chooser or before it.
  - **Narrowed to empty remarks (Kento's call):**
    - **The rule in one place:** `askWhere` is shared by the loop, the 帳場 and the action, so the screen, the stored tap and the
      evaluation can't disagree.
    - **An assumption checked:** Kento expected the textbook master to always speak. Before running, Claude Code read the
      simulator and found it is silent on 20% of its △/× by design, so the chooser still comes up there. That is recorded with
      the check.
    - **Review after the commit:** Claude Code reported, unprompted, that it had not yet run the hitl-reviewer on the narrowing
      before pushing it. Kento then asked for it to be run: no blockers. Its smaller point (test the action's store rule) was applied, and the result is in D-057.

- **11/4 — master-role test (D-059).**
  - **The test:** Kento played the master on 20 fictional scenes, timed by the app, and saved the result with `npm run field:save`.
  - **Records:** Claude Code wrote the result into the result file's notes, the READMEs, D-059 and the submission draft.
  - **Kept as it happened:** 18 of 20 were ○ because the author had no history with these clients, and the prose task was not
    done. The submission draft's "faster than writing" sentence was replaced, not filled in, since no writing time exists.
  - **Kept apart:** this test is reported apart from the persona simulation.

- **11/4 — own-company comparison test (D-060).**
  - **Reuse:** built from the master-role test's parts (timings, writing page, summary) rather than copies.
  - **The data guarantee:** what may leave the own folder is fixed in code. A pure function builds the result from numbers, a last
    check refuses any other string, and a test feeds marked text through it.
  - **Run once in a browser:** a throwaway folder and a fictional stand-in client, before Kento's real run. The first attempt
    "failed" only because the script didn't wait for a same-URL redirect; the screenshot showed it, and the script was fixed.

- **11/4 — UI polish, first pass (branch `ui-polish`; `docs/ui-polish-log.md`).**
  - **Brief:** Kento's two aims, a newcomer knows what to read and what to press, and the screens should not look generic or
    AI-made.
  - **Before starting:** Claude Code read the frontend-design skill. The skill names "cream paper, serif display and a clay
    accent" as a generic AI look, which is close to where this brief points. So the distinctiveness was put into the ledger's
    structure instead: ruled sections, margin labels (vertical on wide screens), and the master's marks as a pressed seal.
  - **A screen-only critic:** `.claude/agents/ui-critic.md` sees only screenshots and answers as a first-time judge would (the
    30-second test, generic tells, fit with the ledger direction, accessibility). It ran on the "before" screens and again
    after each screen.
  - **What the critic caught that Claude Code had missed:**
    - the blank mobile home (a capture taken too early);
    - the dev badge in every shot;
    - a disabled button at about 2:1 contrast;
    - vermilion spent on system messages;
    - the 沿革 hidden behind a click on every entry;
    - the marks below the fold.
  - **Where Claude Code disagreed with the critic, and why:**
    - It kept the indigo navigation tab: it is the 暖簾 motif, and its contrast is fine.
    - It did not touch the chart's scale, because that is the measured data's presentation.
  - **A change tried and reverted:** a two-column 「そのほか」 squeezed one row into a strip.
  - **Screenshots:** a small extension of `scripts/screens.ts` (`--out`, `--judge`, `--ask`, wait for load) took before/after
    shots with recorded data only, with no API calls.

- **11/4, night — an unattended run on `ui-polish` (Kento asleep; `docs/ui-polish-log.md` starts with the summary).**
  - **Brief:** Kento left five tasks in order, with the earlier limits still in force, and one rule for doubt: write down the
    question, stop that piece on the safe side, and move on. The task that went furthest beyond UI, the 訪問の段取り, was
    approved in advance, with its condition: off in the evaluation, proven by a test.
  - **"Unchanged" measured, not argued.** Before touching the apprentice or the interpreter, Claude Code committed a test that
    fingerprints both requests (SHA-256 of prompt, schema and parameters) as they were. The addition was then built so that the
    same test still passes with visits off. That made "the official Before/After cannot move" something a test checks.
  - **The hitl-reviewer found the blocker that mattered.** The money/contract floor read the situation and the message but not
    the new visit plan, so 「無償で試作品を持参」 would not have reached the master. It was fixed and tested before the commit.
    One suggestion was not taken and was left for Kento: asking the master whenever visit wording differs in a regression check.
  - **The live run found an older bug.** The visit scenario was the first to reach own mode's 確かめ card, and the card crashed:
    it looked the scene up only among the fictional ones. Fixed in the same night, with screenshots of the whole flow.
  - **The second 帳場.** At Kento's request, the READMEs now show this repository's own development in the product's shape:
    Claude Code's draft, Kento's one-line judgment, and where the difference was kept (`CLAUDE.md`, a hook, a decision record).
    Five examples were taken from the git history and the records. The first was a rule given before any code, not a
    correction, and the table says so.

### 2026-11-05 (morning): a re-record that did not hold, and the second audit
- **A condition set before spending.** Kento allowed the demo to be re-recorded with visits on only if the 丸新酒造 T05 △ → T13
  quiet word still happened. Claude ran the first 20 training scenes once (≈ $0.52), saw T05 and T13 come out with 表 and 裏
  reversed, and kept the old record without a second try. Re-running until the story appeared would have been picking the run.
  The finding went into D-061: the visit instructions move the contact 段取り itself.
- **Audit with a read-only subagent, then checked by hand.** A general-purpose subagent (no edits, no server, no API) listed
  mismatches between the READMEs, screens, decisions, submission draft and video plan, and traced every number. Claude checked
  each item before fixing. One item turned out stale (a comment that already said its times were old). One number had no
  recorded source (55% in the rank replay) and was recounted from the same 8 runs: 175 of 320. Record: docs/audits/2026-11-05.md.
- **A fresh clone without a key** (install, tests, `eval:quick`, build) replaced the 11/3 "checked from a fresh clone". No
  server was started, because Kento was testing on 127.0.0.1:3100.
- **A finding turned into a design change (11/5, later).** Kento read the failed re-record as a deeper problem: the app's
  apprentice and the evaluated one had become different. Claude split the visit plan into a second call that takes the decided
  段取り as input, and proved the split with the fingerprint test taken before the visit feature existed — now with visits *on*.
  The hitl-reviewer subagent (no blockers) pointed out that the new prompt made the model write 「価格は話さない」, which the
  money floor then caught; the prompt was changed and the 13 recorded visit plans were made again (≈ $0.07).
- **A hook caught a sentence, not a command.** The AWS guard hook blocked a shell edit because the text being written contained
  the profile name in backticks; the same edit went through the Edit tool instead. Polly's SSO token had expired, so the s08b
  audio is left for Kento.
- **Preparing a human test, and stopping it (11/5, D-062).** For the comparison test Claude did everything except the human parts:
  checked `~/.kokoroe` was empty without listing it, loaded a stand-in ledger with Playwright, proposed ten general scenes, entered
  the five Kento chose into his running test after checking in the code that own mode has one fixed session (so the scenes joined
  his test, not a new one), and found one submit had not reached the server. Kento then stopped the test (the stand-in clients had
  nothing tacit to write). Claude cleaned up through the app's own 「全部消す」, confirmed the folder and ports were gone, and
  checked README, submission draft and video for any claim that correcting is easier than writing; three were reworded to what was
  measured, and the s04 narration was re-synthesized.
- **Showing the effect without inventing it (11/5, D-063).** Claude reused the learning loop's own check (`ruleTook`, the one
  確かめ稽古 uses) to decide on screen where a 心得 "took effect", instead of writing a new heuristic, and built the 心得帳なし／あり
  comparison from an arm already recorded in the same evaluation run. A first version credited the 心得 with every row that
  changed; ui-critic caught it, and the panel now shows only the 心得's row. A check script found the panel would have shown a
  心得 learned at T15 on T01 (an earlier scene) in the recorded run; that ordering bug was fixed with a test before any screenshot.
- **Publishing prepared, not executed.** docs/publishing.md now follows Kento's plan (rename the current repo to an archive, keep
  it private, create `kokoroe` anew, push the rewritten history). Claude ran the checks read-only over the whole history and
  wrote the employer domain into no file: the procedure takes it from an environment variable.
- **A wording change pinned by a test (11/5).** Kento asked to fix the 稽古の記録 note in the generator, not by hand, and to prove the
  numbers did not move. Claude split computing from writing (`computeResults`) and added a test that recomputing from the recorded
  runs reproduces `data/demo/results.json` exactly; the regenerated file differed only in the note line. The official run on 11/7
  goes through the same function, so the new wording appears there too.
