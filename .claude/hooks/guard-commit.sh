#!/usr/bin/env bash
# PreToolUse hook (Bash): run the secret check before any `git commit` Claude issues.
# Exit code 2 blocks the commit and feeds the reason back to Claude.
input="$(cat)"
if command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
else
  cmd="$input"
fi

case "$cmd" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
if [ -f "$repo_root/.claude/.eval-stale" ]; then
  echo "Commit blocked: core/prompt code changed since the last eval. Run \`npm run eval:smoke\` (≈ \$0.05) first." >&2
  exit 2
fi
if ! "$repo_root/scripts/check-secrets.sh" >&2; then
  echo "Commit blocked by scripts/check-secrets.sh. Unstage the file or remove the secret." >&2
  exit 2
fi
exit 0
