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

## D-009 · 2026-11-03 · Provisional (confirm with Kento) · What the apprentice may know about a client
Public ledger (`data/world/clients.json`): name, industry, years of relationship, contact and decider titles.
Hidden (`data/hidden/client-traits.json`): power balance, what the client values, constraints (e.g. "no Zoom"), busy months.
**Why:** traits like "Zoom is banned" or "busy in Feb–Mar" are exactly what a veteran carries in their head; if the apprentice
saw them, the Before number would already include the kokoroe we want to show being learned.
**Alternative:** expose constraints too (closer to a CRM with notes) — raises the Before and shrinks the visible learning.

## D-010 · 2026-11-03 · Accepted · Master remarks keyed by failure reason
Each hidden rule has remark lists keyed by why a check failed (e.g. R15: `winter` vs `visit`); the judge returns the key.
**Why:** the apprentice learns from the one-liner; a random remark from the same rule taught the wrong condition
(seen in the first smoke run: "don't visit in winter" for a June scene).
