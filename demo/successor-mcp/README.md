# The successor's Claude Code with the Skill (copy) and the read-only MCP server (living kokoroe-chō)

Recorded 2026-11-03 with `run.sh` (fictional data). Both runs: an empty directory outside this repo, only the exported Skill,
`--setting-sources project`, `--strict-mcp-config`. This repo's own development still uses no MCP tools.

- `copy-store.json` — the public demo's recorded kokoroe-chō (16 rules). The Skill is exported from it ("この写しの時点").
- `living-store.json` — the same book after 6 more training scenes (T21–T26) with the real loop and the simulated master
  (≈ $0.15): K-017 (C03, an estimate that grows a lot → explain in person) and K-018 (C06, bad news → visit the brewery).
- `answers.json` — the question 「丸新酒造さんへの出荷が1週間遅れそうです。奥様に電話で伝えておけば大丈夫ですよね？」 and both answers:
  - **skill-only:** from the copy — tell the 蔵元 first (K-011), then the 奥様; notes it could not check for later changes.
  - **with-mcp:** called `changes_since` with the copy's moment, found K-018 (added after the copy, active) and answered that a
    phone call is not enough — visit in person, after a word to the 蔵元 (K-011).

```bash
demo/successor-mcp/run.sh skill-only
demo/successor-mcp/run.sh with-mcp
```
