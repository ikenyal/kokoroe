#!/usr/bin/env bash
# Reproduce the "暖簾を継ぐ in the successor's own Claude Code" demo under the recorded conditions.
#   demo/successor-claude-code/run.sh <store.json> ["question"]
# Conditions (same as the recording on 2026-11-03):
#   - a fresh, EMPTY directory outside this repo, holding only .claude/skills/kokoroe-daidai-kobo (exported kokoroe-chō)
#   - --setting-sources project  : do NOT load user-level settings (the author's output style, hooks, CLAUDE.md, permissions)
#   - --strict-mcp-config + an empty --mcp-config : no MCP servers at all (user-level connectors stay off)
#   - --allowedTools "Skill,Read,Glob" : the answer can only come from the skill files
set -euo pipefail
STORE="${1:?usage: run.sh <store.json> [question]}"
Q="${2:-港北精機さんとの打ち合わせ、Zoom で送っていいですよね？}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="$(mktemp -d -t kokoroe-successor-XXXX)"
(cd "$REPO" && npm run -s export:skill -- --store "$STORE" --out "$DIR/.claude/skills")
echo "successor dir: $DIR"
cd "$DIR"
claude -p "$Q" \
  --setting-sources project \
  --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --allowedTools "Skill,Read,Glob"
