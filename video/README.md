# Demo video — built as code

Target 2:45 (max 3:00), Japanese. Plan: [scenes.json](scenes.json) (10 scenes, 2:50). Everything is generated here during the
hackathon — no outside footage, images or music:
- **screen** scenes are recordings of the real app (the features shown were built during the hackathon),
- **anim** scenes are HTML/CSS pages in [scenes/](scenes/) recorded the same way (explanations only).
Remotion was not used (separate license terms for company use); Playwright + ffmpeg only.

```bash
npx tsx video/record.ts --base http://127.0.0.1:3000     # → video/out/<id>.webm (subtitles drawn as an overlay, one sentence at a time)
npx tsx video/stills.ts                                 # → docs/screens/video-<id>-<n>.png (anim scenes paused at fixed times)
video/assemble.sh                                       # → video/out/kokoroe-demo.mp4 (1280×720, 30 fps, H.264/AAC)
```
Narration: Amazon Polly (ja-JP neural) per scene → `video/out/audio/<id>.mp3`; `assemble.sh` uses it when present, silence otherwise.

## Status (11/3)
Pipeline works end to end (2:50). All anim scenes are real: `s02` (Edo town, sparks, the ledger sunk into a well — told as a
tradition), `s03` (the ledger's words move into a veteran's head and fade when the person leaves; 51.2% with source; the brush
stops over a blank sheet), `s04` (title), `s07` (how it works, with the read-only boundary), `s09` (numbers), `s10` (end card).
All motion is CSS animation (no timers/randomness), so stills are reproducible. Line drawings are hand-written SVG paths.

## Before the final render (11/7–8)
- [ ] Record real screens from a production build (`next start`) or the public URL — the dev server shows Next.js's dev badge.
- [x] Subtitles one sentence at a time (timed by length for now) — re-time to the audio once Polly narration exists.
- [x] No subtitle on text-led cards (`"subtitle": false` on s04, s10).
- [ ] s09: replace the interim numbers with the official Before/After (same ledger, 5 training paths); the interim Before and
      After were measured with different ledger wording (D-033).
- [x] Animations s02, s03, s07, s10.
- [ ] s07: fill the product names in `NAMES` (s07-how.html) after D-002 (slots for the store and the hand-off form).
- [ ] Real-screen steps for s05 (△ → interpretation → the next similar scene changes; live mode) and s08 (successor + Skill in
      the successor's Claude Code, `demo/successor-claude-code/run.sh`).
- [ ] Polly narration per scene (read-only API call with `--profile brightflow-sandbox-ikeda`).
