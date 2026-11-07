#!/usr/bin/env bash
# Kept for the old command; the assembly lives in video/assemble.ts (11/7: holds, extra breaths, fade-out, overlaid subtitles).
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx tsx video/assemble.ts
