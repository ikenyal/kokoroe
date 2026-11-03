#!/usr/bin/env bash
# The successor's own Claude Code with the Skill (a copy of the kokoroe-chō) AND the read-only kokoroe MCP server (the living one).
#   demo/successor-mcp/run.sh [skill-only|with-mcp] ["question"]
# Conditions (same isolation as demo/successor-claude-code/run.sh):
#   - a fresh, EMPTY directory outside this repo, holding only .claude/skills/kokoroe-daidai-kobo exported from copy-store.json
#   - --setting-sources project : no user-level settings (output style, hooks, CLAUDE.md, permissions, connectors)
#   - --strict-mcp-config : only the MCP servers given here — none (skill-only) or just kokoroe (with-mcp), reading living-store.json
#   - --allowedTools : the Skill, file reads, and the four read-only kokoroe tools; nothing else
# This repo's own rule (no MCP tools while developing here, block-mcp hook) is untouched: the session runs outside the repo.
# copy-store.json  = the public demo's recorded kokoroe-chō (16 rules) — what the successor received as a Skill.
# living-store.json = the same book after the master (simulator) judged 6 more scenes with the real loop (K-017, K-018 added).
set -euo pipefail
MODE="${1:-with-mcp}"
Q="${2:-丸新酒造さんへの出荷が1週間遅れそうです。奥様に電話で伝えておけば大丈夫ですよね？}"
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
DIR="$(mktemp -d -t kokoroe-successor-mcp-XXXX)"
(cd "$REPO" && npm run -s export:skill -- --store "$HERE/copy-store.json" --out "$DIR/.claude/skills")
echo "successor dir: $DIR  mode: $MODE"
cd "$DIR"
if [ "$MODE" = "with-mcp" ]; then
  CFG=$(printf '{"mcpServers":{"kokoroe":{"command":"npm","args":["--prefix","%s","run","-s","mcp:serve","--","--store","%s"]}}}' "$REPO" "$HERE/living-store.json")
  TOOLS="Skill,Read,Glob,mcp__kokoroe__list_clients,mcp__kokoroe__get_kokoroe,mcp__kokoroe__get_history,mcp__kokoroe__changes_since"
else
  CFG='{"mcpServers":{}}'
  TOOLS="Skill,Read,Glob"
fi
claude -p "$Q" --setting-sources project --strict-mcp-config --mcp-config "$CFG" --allowedTools "$TOOLS" --output-format json
