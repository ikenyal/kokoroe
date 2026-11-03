# Demo video — built as code

Target 2:45 (max 3:00), Japanese. Plan: [scenes.json](scenes.json) (10 scenes, 2:50). Everything is generated here during the
hackathon — no outside footage, images or music:
- **screen** scenes are recordings of the real app (the features shown were built during the hackathon),
- **anim** scenes are HTML/CSS pages in [scenes/](scenes/) recorded the same way (explanations only).
Remotion was not used (separate license terms for company use); Playwright + ffmpeg only.

```bash
npx tsx video/record.ts --base http://localhost:3000     # → video/out/<id>.webm (subtitles drawn as an overlay)
video/assemble.sh                                       # → video/out/kokoroe-demo.mp4 (1280×720, 30 fps, H.264/AAC)
```
Narration: Amazon Polly (ja-JP neural) per scene → `video/out/audio/<id>.mp3`; `assemble.sh` uses it when present, silence otherwise.

## Status (11/3)
Pipeline works end to end: a draft with placeholders renders to 2:49.7. `s04-title` and `s09-numbers` (reads
`data/demo/results.json`) are real; `s02`, `s03`, `s07`, `s10` are placeholders.

## Before the final render (11/7–8)
- [ ] Record real screens from a production build (`next start`) or the public URL — the dev server shows Next.js's dev badge.
- [ ] Split each narration into subtitle lines timed to the audio (some drafts wrap to 4 lines).
- [ ] No subtitle on text-led anim scenes (s04 repeats its own text) — add `"subtitle": false`.
- [ ] s09: replace the interim numbers with the official Before/After (same ledger, 5 training paths); the interim Before and
      After were measured with different ledger wording (D-033).
- [ ] Animations s02 (帳面を井戸へ), s03 (頭の中へ・後継ぎ未定 51.2% with source), s07 (仕組み), s10 (end card with repo URL).
- [ ] Real-screen steps for s05 (△ → interpretation → the next similar scene changes; live mode) and s08 (successor + Skill in
      the successor's Claude Code, `demo/successor-claude-code/run.sh`).
- [ ] Polly narration per scene (read-only API call with `--profile brightflow-sandbox-ikeda`).
