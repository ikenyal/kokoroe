#!/usr/bin/env bash
# PreToolUse hook (Bash): every `aws` CLI call must name the BrightFlow sandbox profile explicitly.
# This machine has many AWS profiles (other employers / clients); the default profile and AWS_PROFILE are never relied on.
# Blocks (exit 2) when a command runs `aws` without `--profile brightflow-sandbox-ikeda`, uses any other --profile,
# or sets AWS_PROFILE / AWS_DEFAULT_PROFILE / AWS_ACCESS_KEY_ID inline. Read-only calls are checked the same way.
input="$(cat)"
if command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
else
  cmd="$input"
fi
[ -z "$cmd" ] && exit 0

ALLOWED="brightflow-sandbox-ikeda"
# Count `aws` invocations (as a command word: start, or after ; & | ( ` $( or a newline/space-separated pipeline).
calls="$(printf '%s\n' "$cmd" | grep -Eo '(^|[;&|(`[:space:]])aws[[:space:]]+[a-z]' | wc -l | tr -d ' ')"
[ "$calls" = "0" ] && exit 0

msg() { echo "Blocked by guard-aws: $1. Every aws command must include --profile $ALLOWED (no default profile, no AWS_PROFILE)." >&2; exit 2; }

if printf '%s' "$cmd" | grep -Eq '(AWS_PROFILE|AWS_DEFAULT_PROFILE|AWS_ACCESS_KEY_ID|AWS_SESSION_TOKEN)='; then
  msg "AWS credentials/profile set via environment"
fi
others="$(printf '%s' "$cmd" | grep -Eo -- '--profile[= ]+[^[:space:]]+' | grep -v -- "$ALLOWED\$" || true)"
[ -n "$others" ] && msg "another profile is used ($others)"
ok="$(printf '%s' "$cmd" | grep -Eo -- "--profile[= ]+$ALLOWED([[:space:]]|\$)" | wc -l | tr -d ' ')"
[ "$ok" -lt "$calls" ] && msg "$calls aws call(s) but only $ok carry the profile"
exit 0
