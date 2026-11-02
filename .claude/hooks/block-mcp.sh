#!/usr/bin/env bash
# PreToolUse hook: refuse every MCP tool call in this repository.
#
# Why: the developer's user-level Claude Code config is connected to work MCP
# servers (company / client tools). This repo will be public and submitted to a
# hackathon whose materials are not treated as confidential, so nothing from
# those tools may leak into it. Exit code 2 blocks the call and shows stderr to Claude.
cat >/dev/null  # drain hook input
echo "Blocked: MCP tools are not used in the Kokoroe repo (see CLAUDE.md > Hard rules). Use local files, the Anthropic SDK, or ask Kento." >&2
exit 2
