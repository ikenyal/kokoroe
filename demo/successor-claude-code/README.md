# Demo material — 暖簾を継ぐ: the kokoroe-chō in the successor's own Claude Code

Recorded 2026-11-03. Fictional data only (株式会社だいだい工房). No MCP servers were used.

## What it shows
The kokoroe-chō grown by Kokoroe (v1 configuration, training path seed 303, 40 scenes) is exported as an Agent Skill and dropped
into an **empty directory** — standing in for the successor's PC. A plain `claude -p` there picks up the skill on its own and answers
the successor's question with the rule, its reason (沿革) and its source.

## Steps
```bash
# 1. Export the kokoroe-chō as a Skill (also available in the app: 心得帳 → 「心得帳を後任に渡す」, a zip)
npm run export:skill -- --store <store.json> --out <empty-dir>/.claude/skills
# 2. Ask in that directory — no MCP, no user-level settings, only skill/read tools
cd <empty-dir>
claude -p "港北精機さんとの打ち合わせ、Zoom で送っていいですよね？" \
  --setting-sources project --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --allowedTools "Skill,Read,Glob"
```

## Answer (verbatim, [answer.json](answer.json))
> いいえ、Zoom は使えません。港北精機さんとの打ち合わせは **Teams** で招待を送ってください。
>
> **根拠：K-004「情報セキュリティ規程で Zoom 不可、Teams のみ」**（出典：取引先台帳）
> - 理由：2024年に港北精機さんのセキュリティ規程が変わり、Zoom が禁止になりました。
>
> Zoom の招待を送ってしまうと、先方は規程上参加できません。窓口の生産技術主任の方に、規程違反のツールを使わせるか断らせるかの、どちらかを迫ることになります。Teams で設定し直して送るのが確実です。

4 turns, 10.9 s. The exported skill is in [kokoroe-daidai-kobo/](kokoroe-daidai-kobo/).

## Notes
- The first attempt ran with the author's user-level Claude Code settings and its answer ended with the author's output-style
  block. The recorded run uses `--setting-sources project` so only what the successor would have is in play.
- This rule's reason came from the master's one-time "why?" on a ledger constraint (D-020) — exactly the history that was
  missing before.
