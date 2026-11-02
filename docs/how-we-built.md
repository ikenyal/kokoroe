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
