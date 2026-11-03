# Spike: Managed Agents memory store as the kokoroe-chō (2026-11-03)

Scripts: `spikes/managed-agents/memory-store.ts`, `spikes/managed-agents/export-skill.ts` · SDK `@anthropic-ai/sdk` 1.4.0 ·
run from a laptop in Japan. Sessions and agents were not tried in this spike.
Only fictional data was written. The spike store was kept (not deleted) for later experiments.

## Results

| Call | Time |
|---|---|
| `memoryStores.create` | 601 ms |
| `memories.create` (`/clients/hamakaze-unyu.md`) | 284 ms |
| `memories.retrieve` | 222 ms |
| `memories.update` with `content_sha256` precondition | 289 ms |
| `memoryVersions.list` (one memory) | 217 ms |
| `memories.list` (`path_prefix: /clients/`) | 399 ms |
| export store → `SKILL.md` + `clients/*.md` | 427 ms |

- **Read/write works**; content round-trips byte-for-byte.
- **Optimistic concurrency works**: an update carrying a stale `content_sha256` is rejected with **409**. Two writers
  (compiler and regression test, or compiler and the master deleting a rule) can't silently overwrite each other.
- **Versions**: newest first; each has `operation` (`created` → `modified`), `created_at`, `path`, `content_sha256`, size, and
  `created_by` (`{type: "api_actor", api_key_id: …}` for host-side writes; `session_actor` expected for agent writes).
  Content is not included by default (`view: "full"` needed).
- **Export**: listing with `view: "full"` and writing files gives a valid Agent Skill folder in < 0.5 s. Skill name
  `kokoroe-daidai-kobo` passes the naming rules (lowercase/digits/hyphens, no reserved words).
- **Cost**: no model tokens are used by memory-store calls. (Storage pricing for memory stores not checked yet.)

## What this means for the design

- The memory store can be the **canonical kokoroe-chō**: per-client files, an audit trail per change, safe concurrent edits.
- Versions record *what* changed and *who* (API vs. session), not *why*. The **history (沿革) — old → new, trigger,
  master's words, date — stays in the file body**, as planned, and is exported to Git.
- The planning note said version history "may disappear after 30 days"; the current docs say versions accumulate for the
  life of the memory. Either way the design does not depend on it (history in the body + Git export).
- Host-side calls are fast enough (~0.2–0.4 s) to read the relevant client file **into a Messages API prompt** for the
  fast apprentice, without starting a session.

## Not done today

- Agent + environment + session with the store attached (`read_only`) and its round-trip latency → not measured (D-002 keeps the
  memory store as an opt-in store only).
- Outcomes (rubric self-check) → later, with the compiler.
