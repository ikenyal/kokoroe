#!/usr/bin/env bash
# PostToolUse (Edit|Write): when core/prompt code changes, run the fast free tests now and mark the API eval as stale.
# The stale mark blocks `git commit` (guard-commit.sh) until `npm run eval:smoke` (5 scenes, ≈ $0.05) has been run.
input="$(cat)"
path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
case "$path" in
  */src/core/*|*/src/disciple/*|*/src/learning/*|*/src/successor/*|*/eval/simulator/*) ;;
  *) exit 0 ;;
esac
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
cd "$root" || exit 0
if ! out="$(npx vitest run tests/judge.test.ts tests/learning.test.ts tests/hidden-boundary.test.ts 2>&1)"; then
  printf 'Fast tests failed after editing %s:\n%s\n' "$path" "$(printf '%s' "$out" | grep -E 'FAIL|✗|×|Error|expected' | head -20)" >&2
  exit 2
fi
touch "$root/.claude/.eval-stale"
jq -n --arg f "$path" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:("Core/prompt code changed (" + $f + "). Fast tests passed. Before committing, run `npm run eval:smoke` (5 held-out scenes, ≈ $0.05); commits are blocked until then.")}}'
exit 0
