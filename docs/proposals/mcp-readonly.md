# Proposal: a read-only MCP server for the kokoroe-chō (not built — for Kento's decision)

Status: **proposal only (2026-11-03).** Building an MCP server as a product feature needs Kento's approval (CLAUDE.md). This is
unrelated to the development rule "no MCP tools while working in this repo", which stays as is.

## Why, next to the Agent Skill

| | Agent Skill (built) | MCP server (this proposal) |
|---|---|---|
| What it is | a **copy** of the kokoroe-chō at one moment (`SKILL.md` + `clients/*.md`) | a **window onto the living** kokoroe-chō, asked at the moment of use |
| Freshness | as of the export; a rule the master revises tomorrow is not in it | always the current rules and 沿革 |
| Works offline / without our server | yes — files in the successor's own Claude Code | no — needs the server process and the store |
| Good for | handing over at retirement; the master is gone, the book is final | the **overlap period**, when the master is still correcting and the successor already works |

The two are complementary: the Skill is the inheritance, the MCP server is the open ledger while both people are still in the shop.
The Skill would carry its `exportedAt` and one instruction: *if the kokoroe MCP server is connected, check what changed since then.*

## Scope: read only, by construction

**Tools** (all read-only; each result carries `asOf` = the store's last change):

| Tool | Input | Returns |
|---|---|---|
| `list_clients` | — | id, name, number of active rules, last change per client |
| `get_kokoroe` | `client_id`, optional `scene_type` | active rules in scope (client-specific + company-wide), each with id, text, condition, scene types, origin (台帳 / 師匠), confidence, last change — the same content as `clients/<slug>.md` |
| `get_history` | `rule_id` | the rule's 沿革 (old → new, trigger, master's words, date) and sources (date, ○△×, one-liner, scene id) — including retired / rolled-back rules |
| `changes_since` | `date` | rules added, revised, retired or rolled back since that date — the thing a Skill copy cannot know |

**Resources:** `kokoroe://clients/{id}` as Markdown (same rendering as the Skill's client file), so a client can attach one directly.

**Deliberately not included**
- **No write tools of any kind**, not even "suggest a rule": the kokoroe-chō is written only through the master's ○△× in the 帳場.
- **No `ask` tool that calls Claude on our side.** The successor's own Claude does the reasoning; the server only returns data.
  (Keeps cost and attack surface on our side at zero model calls.)
- **No raw judgments or client text.** Draft proposals and scene situations are not exposed — only what the Skill already shows
  (master-approved rule text, the master's one-liners, scene ids). Client-written text is the main injection vector (D-021); it
  never leaves through this door.

**How "read only" is enforced, not just promised**
1. The server is given a `ReadonlyKokoroeStore` (a new narrow interface: `listRules`, `getRule`, `rulesFor` only). The write
   methods are not reachable from server code — a type error, plus a test that the server module never imports the writable store.
2. The store file is opened read-only (re-read per request, same as the UI's store; no lock, no write path).
3. Tool descriptions say "read only"; a test lists the server's tools and fails if any new tool appears without review.

## Transport and where it runs

- **Hackathon scope: stdio, local.** The successor's Claude Code starts it as a local process:
  `claude mcp add kokoroe -- npx tsx mcp/server.ts --store <store.json>`. No network, no auth needed, no new AWS resources.
- The demo (`demo/successor-claude-code/run.sh`) would get a second variant: the same empty directory and `--setting-sources project`,
  with `--strict-mcp-config` and a config that contains **only** the kokoroe server. Scene: the master revises a rule in the 帳場,
  the successor's Skill copy still has the old one, `changes_since` shows the new one with its 沿革.
- **Not in scope (described only):** a remote (Streamable HTTP) server on the public URL for a real company would need per-company
  authentication and authorization, rate limits, and the store behind it (memory store or database — D-002). That is a product
  decision for after the hackathon.

## Relation to D-002 (store) and the rest

- The server reads through the store interface, so whether the kokoroe-chō ends up in a Managed Agents memory store or local JSON
  (D-002) does not change the tool surface — only the adapter behind `ReadonlyKokoroeStore`.
- Dependency: the official MCP TypeScript SDK (pinned exact version). Its API is checked against the official docs at build time.
- Development rule stays: Claude Code in this repo still never calls MCP tools (block-mcp hook). The server is tested with the
  SDK's client in Vitest (in-process), not through Claude Code.

## Cost and risk

- **Build:** ~half a day — server (~150 lines), the read-only store interface, tests (tool list fixed; no write path; output
  matches the Skill rendering; `changes_since` on a store with a revision and a rollback), demo variant, README section.
- **Running cost:** zero model calls; no AWS changes.
- **Risks:** time before the 11/7 freeze (the field test 11/6 and `eval:final` come first); one more surface to explain in a
  3-minute video (it would appear only as one box in s07, "育ち続ける心得帳に問い合わせる口"); judges may read "MCP" as the core of
  the entry — the README would present it as an add-on for the overlap period.

## Recommendation

Build it **only if** it can be done by 11/6 without displacing the field test — with the four tools above, stdio only, and the
demo variant. Otherwise leave this proposal in the repo as the next step and keep the Skill as the hand-over.
