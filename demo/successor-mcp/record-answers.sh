#!/usr/bin/env bash
# Re-record answers.json: the same question to the successor's Claude Code, Skill only vs Skill + read-only MCP server.
# Each run uses run.sh (a fresh empty directory outside the repo, project settings only, strict MCP config).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
Q="${1:-丸新酒造さんへの出荷が1週間遅れそうです。奥様に電話で伝えておけば大丈夫ですよね？}"
TMP="$(mktemp -d -t kokoroe-answers-XXXX)"
"$HERE/run.sh" skill-only "$Q" | tail -1 > "$TMP/skill-only.json"
"$HERE/run.sh" with-mcp "$Q" | tail -1 > "$TMP/with-mcp.json"
node -e '
const fs = require("fs"); const [dir, q, out] = process.argv.slice(1);
const pick = (m) => { const j = JSON.parse(fs.readFileSync(`${dir}/${m}.json`, "utf8")); return { result: j.result, num_turns: j.num_turns, permission_denials: j.permission_denials }; };
const data = { recorded: new Date().toISOString().slice(0, 10), question: q,
  note: "fictional data; claude -p in an empty directory outside the repo, --setting-sources project, --strict-mcp-config (none / kokoroe only)",
  answers: { "skill-only": pick("skill-only"), "with-mcp": pick("with-mcp") } };
fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
' "$TMP" "$Q" "$HERE/answers.json"
rm -rf "$TMP"
echo "wrote $HERE/answers.json"
