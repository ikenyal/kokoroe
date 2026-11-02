#!/usr/bin/env bash
# PreToolUse hook: data/hidden/ (the simulator's ground truth) is FROZEN as of 2026-11-03 (D-017).
# Changing it mid-experiment would look like moving the answers. Any change needs Kento's explicit OK first;
# then he updates the checksums in tests/fixtures/hidden-freeze.json together with the change.
input="$(cat)"
if command -v jq >/dev/null 2>&1; then
  path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')"
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
else
  path="$input"; cmd="$input"
fi
msg="Blocked: data/hidden/ is frozen (D-017). Ask Kento before changing the hidden ground truth."
case "$path" in
  *data/hidden/*) echo "$msg" >&2; exit 2 ;;
esac
# Block only when data/hidden is the *target* of a write (mentioning it in text, or reading it, is fine).
write_target='(>>?[[:space:]]*[^[:space:]|;&]*data/hidden/)|(\btee\b[^|;&]*data/hidden/)|(sed[[:space:]]+-i[^|;&]*data/hidden/)|(\b(mv|cp|rm|truncate)\b[^|;&]*data/hidden/)|(writeFileSync\([^)]*hidden/)'
if [[ "$cmd" == *data/hidden* ]] && printf '%s' "$cmd" | grep -Eq "$write_target"; then
  echo "$msg" >&2; exit 2
fi
exit 0
