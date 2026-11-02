# Kokoroe — CLAUDE.md

## What this is

**Kokoroe (心得)** — "an AI apprentice that inherits the unwritten etiquette of doing business."

An AI apprentice (**Daidaimaru / 橙丸**) drafts how to handle a client situation (e.g. telling a client about a delivery delay).
The master (a veteran salesperson about to retire) only marks it **○ / △ (OK with a condition) / ×** plus an optional one-liner.
Each correction is turned into a scoped rule with its **history (沿革: old → new, trigger, master's words, date)** in the
**kokoroe-chō (心得帳)**, which is exported as Agent Skills (`SKILL.md`) and handed to the successor.

Core insight: veterans can't explain tacit knowledge, but they instantly see what's *wrong*. Tacit knowledge appears as the
**difference from the average** at the moment of correction. Claude produces the average; the master supplies only the diff.

Hackathon: Built with Claude: Japan 2026. Deadline **2026-11-08 20:00 JST**. The repo will be **public**.

## Hard rules

- **New work only.** Never copy files/text/code from the external planning folder, from other projects, or from past winners' repos.
  Reading for reference is fine; write everything here from scratch.
- **All data is fictional** (株式会社だいだい工房 / Daidai Kobo and its 10 clients). No real company or person names, no PII, no real logs.
- **Never commit secrets.** The API key lives only in `.env.local` (gitignored) and is used server-side only.
  `scripts/check-secrets.sh` runs before commits (git hook + Claude Code hook).
- **Call Claude via the Anthropic API directly** with `@anthropic-ai/sdk`. No Bedrock. AWS is for hosting/storage only.
- **Do not call any MCP tool in this repo.** The user-level config has work MCP servers attached; nothing from them may enter
  this public repo. Enforced by `.claude/hooks/block-mcp.sh`. Building an MCP server *as a product feature* needs Kento's approval first.
- **Evaluation integrity:** product code (`src/`, `app/`) must never read `data/hidden/`. Only `eval/simulator/` may.
  Do not tune prompts by looking at hidden rules. A test enforces the import boundary.
- **HITL:** the apprentice never sends anything and never commits to discounts / contract terms / first contact with key clients;
  those always route to the master.
- If a decision conflicts with the plan or is unclear: **stop and ask Kento**. Don't decide silently.
- Pin dependency versions (exact versions in `package.json`, commit `package-lock.json`).

## Records (update as you work)

- `docs/how-we-built.md` — after each work session, a short entry: which Claude Code feature (plan mode, subagents, skills, hooks, headless…) was used for what.
- `docs/decisions.md` — design decisions (ADR-style, numbered D-xxx).
- `docs/evolution.md` — how the idea changed. **Only in-period (from 2026-11-02 kickoff) entries go under "During the hackathon";**
  pre-kickoff thinking stays in the short "Background" section and must never be presented as in-period work.

## Stack

TypeScript (strict) · Next.js (App Router) + Tailwind · `@anthropic-ai/sdk` · Vitest · tsx · npm. Hosting: AWS Amplify (later).

| Role | Model | Why |
|---|---|---|
| Apprentice drafts, successor Q&A | `claude-sonnet-5-5` | must answer in seconds (1-tap UX) |
| Interpreting corrections, compiling the kokoroe-chō | `claude-opus-5-5` | judgment-heavy, async is fine |
| Master simulator bulk runs | `claude-haiku-5-5` | cheap, many runs |

Managed Agents: memory store = kokoroe-chō. The SDK sets `agent-memory-2026-07-22` on `client.beta.memoryStores.*`;
never send it together with `managed-agents-2026-04-01` (400).

## Layout

```
app/                  Next.js UI (帳場 / 心得帳 / 番付 / 暖簾を継ぐ / 稽古の記録)
src/lib/              Anthropic client, model constants
src/core/             domain types (Client, Scene, Proposal, Judgment, Rule, HistoryEntry)
data/world/           fictional company + 10 clients (what the apprentice may know)
data/hidden/          hidden ground-truth rules — simulator only
data/scenes/          train / eval (held-out) / history questions
eval/simulator/       master simulator: machine-checkable judge + short remarks
eval/                 metrics, runner, run summaries
spikes/               throwaway experiments (Managed Agents etc.)
tests/                Vitest
docs/                 how-we-built, decisions, evolution, spike notes
.claude/              hooks, agents, skills for this repo
```

## Commands

```
npm run dev           # Next.js dev server
npm test              # Vitest
npm run eval:quick    # held-out 20 scenes through the simulator
npm run spike:memory  # Managed Agents memory-store spike
```

## Evaluation first

Any change to prompts, the learning loop, or the kokoroe-chō → run `npm run eval:quick` and report the numbers.
Always label numbers as "fictional 10 clients / 20 held-out scenes". Prefer machine-checkable judgments over LLM grading.
