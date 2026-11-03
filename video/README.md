# Demo video — built as code

Max 3:00 (aim 2:50–2:55), Japanese. Plan: [scenes.json](scenes.json) — **structure v2** (11/4, after Kento's review of the first
rough cut: the problem, why it never gets written down, and the solution are all said in the first minute; the Edo story moved to
the close). 13 scenes, 2:50. Everything is generated here during the hackathon — no outside footage, images or music:
- **screen** scenes are recordings of the real app (the features shown were built during the hackathon),
- **anim** scenes are HTML/CSS pages in [scenes/](scenes/) recorded the same way (explanations only).
Remotion was not used (separate license terms for company use); Playwright + ffmpeg only.

```bash
npx tsx video/narration.ts --yes                         # Polly (Takumi) → video/out/audio/Takumi/<id>.mp3 + .marks.json
npm run video:shoot -- --live --voice Takumi --mcp       # 11/7: everything in one command (see video/shoot.ts)
npm run video:shoot -- --voice Takumi                    # rough cut with fixed data (no Claude API calls)
npx tsx video/stills.ts                                  # → docs/screens/video-<id>-<n>.png (anim scenes paused at fixed times)
video/assemble.sh                                        # → video/out/kokoroe-demo.mp4 (1280×720, 30 fps, H.264/AAC)
```

| v2 part | Scene | Kind | Seconds | Narration (spoken) |
|---|---|---|---|---|
| 1 problem | `s01-problem` | anim (new) | 16.8 | 16.0 s |
| 2 what goes wrong | `s02-failure` | anim (new) | 15.5 | 14.6 s |
| 3 why it isn't written down | `s03-head` | anim (reworked) | 15.2 | 13.8 s |
| 4 solution + title | `s04-title`, `s04b-flow` | anim (s04 retimed; flow new) | 7.2 + 11.5 | 4.6 + 10.5 s |
| 5 帳場 | `s05-choba` | screen | 19.2 | 17.4 s |
| 6 心得帳 | `s06-kokoroe` | screen | 11.8 | 10.1 s |
| 7 暖簾を継ぐ | `s07-noren`, `s07b-mcp` | screen + anim | 11.5 + 11.5 | 8.7 + 7.6 s |
| 8 why it works | `s08-pile`, `s08b-keiko` | anim + screen | 15.8 + 11.5 | 14.9 + 8.9 s |
| 9 close | `s09-edo`, `s09b-end` | anim | 10.5 + 12 | 7.1 + 9.4 s |

## Narration and subtitles
- Voice (Kento, 11/4, after [the voice trial](../docs/voice-trial-2026-11-04.md)): Amazon Polly **Takumi**, neural, rate 105%,
  accents fixed with `x-amazon-pron-kana` (`ACCENTS` in [narration.ts](narration.ts)), 0.5 s between sentences. Readings that
  must not change on screen use `<sub alias>` (`READINGS`). Add a word to `ACCENTS` when it still sounds wrong.
- Scene seconds come from the narration's real length: each scene = 0.3 s lead + narration + room for the picture.
- Subtitles switch on Polly's sentence speech marks (`<id>.marks.json`), so they follow the voice.
- Numbers in the narration (`{before}` etc. in scenes.json) are filled from `data/demo/results.json`; while it is not official
  the line starts with 「途中経過では、」 and s08b shows a banner saying the numbers are interim. Re-run the narration for s08b
  after the official measurement.
- Animations are timed to the sentence starts (written in each scene's header comment).
- Screen scenes start their session off camera, so each clip opens on its own page.
- Not in v2: `s01-hook` (the glimpse), `s07-how` (how it works; its points are in s04b-flow and s07b), the 51.2% statistic of the
  first s03. `scenes/s07-how.html` and `scenes/s09-numbers.html` are kept but unused.

## Before the final render (11/7–8)
- [x] Real screens from the production bundle (`.image/`, same as the container) on 127.0.0.1, stopped after shooting — no dev indicator.
- [x] Structure v2 rough cut with fixed data and the Takumi narration (11/4): 2:50. In fixed mode T13's draft is a recorded one;
      the causal change (△ on T05 → the quiet word on T13) is shot live on 11/7 (`--live`).
- [ ] 11/7: re-record the demo snapshot so 心得帳 shows a rule with a multi-entry 沿革 (today every rule in it has one entry).
- [ ] s08b: the official Before/After (same ledger, 5 training paths) → re-run `narration.ts --yes --only s08b-keiko`; the
      interim Before and After were measured with different ledger wording (D-033).
- [x] Subtitles timed to the audio (speech marks).
- [x] Polly narration for every scene (read-only API call with `--profile brightflow-sandbox-ikeda`).

## Letters with a job (Kento's request on 11/3; built on the night of 11/3 → see docs/night-2026-11-03.md)
**Since structure v2 (11/4 afternoon):** s04 (the red-ink title), s03 (letters coming undone) and s09a (now `s08-pile`, with
narration) are reused in v2; the paragraph below is the state before v2.

**Status (11/4, Kento):** s04 and s03 done (same lengths). s09a is in the video at 7 s, text only (no narration or subtitle), with
three entries. To keep under 3:00, s02 13→11 s and s06 20→18 s; s08 (the demo's peak) is not shortened. Rough cut: 173.0 s.

The idea: kinetic typography made entirely in code, with no assets. Showiness is not the point. Three ideas are taken, kept inside Kokoroe's world (帳面, 明朝, 墨/藍/朱):
1. **Give each piece of text a job.** Specify what the letters *do* (get corrected, come undone, pile up as a ledger), not that
   they look good.
2. **Decide what changes line by line, within tight limits.**
   - Colors: only 墨 (`--sumi`), 藍 (`--ai`) and 朱 (`--shu`). 朱 stays the master's mark.
   - Typefaces: only 明朝 and a brush face.
3. **Check key moments as stills** (`video/stills.ts`) for overlap, overflow and readability, then show the stills to Kento.

**Candidates** (pick 1–2; at most 10–15 s in total out of 3:00):
- **s04 title 「教えなくていい。直すだけで。」** The master's 朱 brush marks a △ and a one-line correction over 「教えなくていい」, and it
  becomes 「直すだけで。」. The letters play the part of *being corrected*, which is the core idea of the work.
  This is the first choice.
- **s03 「書いて残して」** The letters someone tries to write come undone on the paper without taking shape (tacit knowledge that
  won't go into words).
- **Just before the numbers in s09** The master's one-line corrections settle one line at a time onto the ledger's ruled lines
  and become the 心得帳 (the letters turn into the ledger itself).
- Use **vertical writing** wherever a scene allows it (it reads at once as a Japanese merchant's ledger).

**Rules that stay:**
- Real screens remain the main content.
- Reading speed comes first: no flashy 3D, no shaders, no strong color changes.
- CSS animation only (reproducible stills).
- The whole video stays within 3:00.
  - It was 170 s; with s09a and the cuts above it is 173 s.
  - s01 and s07 narration already run long.
  - Any added seconds come from shortening other scenes; s02 and s03 are the first places to look.
