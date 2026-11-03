#!/usr/bin/env bash
# Lightweight staged-changes secret scan (no external deps).
# Used by .githooks/pre-commit and by the Claude Code PreToolUse hook.
# Exit 1 if a staged change looks like a secret or an env file.
set -u
status=0

# 1) env files must never be committed (only .env.example)
while IFS= read -r f; do
  base="$(basename "$f")"
  if [[ "$base" == .env* && "$base" != ".env.example" ]]; then
    echo "check-secrets: refusing to commit env file: $f"
    status=1
  fi
done < <(git diff --cached --name-only --diff-filter=ACMR)

# 2) added lines that look like credentials
patterns=(
  'sk-ant-[A-Za-z0-9_-]{20,}'                 # Anthropic API key
  'AKIA[0-9A-Z]{16}'                          # AWS access key id
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'        # private keys
  '^\+[[:space:]]*(export[[:space:]]+)?ANTHROPIC_API_KEY=[^[:space:]#]+'  # filled-in key in env-style line
  'arn:aws[a-z-]*:[a-z0-9-]*:[a-z0-9-]*:[0-9]{12}'   # ARN with a real account number (write <account>)
  'gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}'  # GitHub tokens
  'xox[abprs]-[A-Za-z0-9-]{10,}'              # Slack tokens
  '/Users/[A-Za-z0-9._-]+/'                   # a local home path (macOS)
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]*[A-Za-z]{2,}'  # an email address (filtered below for safe ones)
)
# Email-like strings that are fine in a public repo: placeholders, npm scopes and noreply addresses.
SAFE_EMAIL='@(example\.(com|org|jp)|users\.noreply\.github\.com|anthropic\.com>)|@(types|anthropic-ai|modelcontextprotocol|tailwindcss|next)/'
added="$(git diff --cached -U0 --diff-filter=ACMR | grep '^+' | grep -v '^+++' || true)"
for p in "${patterns[@]}"; do
  if hits="$(printf '%s\n' "$added" | grep -E -e "$p" | grep -Ev -e "$SAFE_EMAIL")"; then
    echo "check-secrets: possible secret matching /$p/:"
    printf '%s\n' "$hits" | cut -c1-80 | sed 's/^/  /'
    status=1
  fi
done

exit $status
