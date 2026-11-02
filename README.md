# Kokoroe (心得) — an AI apprentice that inherits the unwritten etiquette of business

[日本語版 README](README.ja.md)

> Work in progress for **Built with Claude: Japan 2026** (2026-11-02 → 11-08).

A veteran salesperson can't write down *how* they deal with each client — but shown a draft, they instantly say "no, not like that".
Kokoroe uses exactly that. An AI apprentice drafts first; the master only marks **○ / △ / ×** with an optional one-liner.
Corrections become scoped rules **with their history** (why it changed), kept in a readable, deletable *kokoroe-chō* and handed
to the successor as Agent Skills.

## Data

- All companies, people and situations are **fictional** (株式会社だいだい工房 and its 10 clients).
  **Fictional sample data prepared in advance as a design was written as data files during the hackathon period.**
  No real company names, personal information, or real conversation logs are included.
- `data/hidden/rules.json` is the **hidden ground truth used only by the master simulator** for evaluation.
  It is committed so results are reproducible. **The apprentice's code never reads it — a test enforces this boundary.**

## Quickstart

_Coming soon._ Requires Node 22+, an Anthropic API key in `.env.local` (see `.env.example`).

```
npm install
cp .env.example .env.local   # set ANTHROPIC_API_KEY
git config core.hooksPath .githooks   # optional: pre-commit secret scan
```

## How we built it with Claude Code

See [docs/how-we-built.md](docs/how-we-built.md) (updated as we go), plus [decisions](docs/decisions.md) and [evolution](docs/evolution.md).

## License

Code: MIT (TBD). The fictional world data (Daidai Kobo, its clients and kokoroe) is not licensed for reuse (TBD).
