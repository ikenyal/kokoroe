# Demo video — built as code

Max 3:00, Japanese. Plan: [scenes.json](scenes.json) — **structure v5** (11/4):
- **v2** (after Kento's first review): the problem, why it never gets written down, and the solution are said in the first minute;
  the Edo story closes the video.
- **v3** (second review): adds why it matters now (three forces) and two questions between parts that give the viewer a reason to
  keep watching.
- **v4** (third review):
  - The cold open is now a difference you can *see* (two messages, one extra line circled in 朱) and a reason you can't (only
    the retiring director knows why).
  - The three forces move.
  - A noren wipe marks the three chapter breaks.
- **v5** (fourth review):
  - A breath between scenes: 0.5 s of silence on the held last frame. Chapter breaks add 0.5 s more on the closed noren.
  - The words are used one way throughout (D-052): ココロエ (Kokoroe) is the product; a 心得 is one piece of the master's
    practice; the 心得帳 is those, written down with why each came to be. s04b says so in the narration and on screen.
  - The total is kept near 2:55, leaving room under 3:00.

16 scenes, **2:54.8**. Everything is generated here during the hackathon — no outside footage, images or music:
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

| Starts at | Scene | Kind | Seconds | Narration |
|---|---|---|---|---|
| 0:00.0 | `s00-open` — two messages, one line circled, drawn into the director's head, 「来春 退職」 | anim | 12.7 | 12.4 s |
| 0:13.2 | `s01-why` — 51.2% counts up, tags on half the companies / people walk out through a noren / the AI lights only written lines | anim | 17.0 | 16.7 s |
| 0:30.7 | `s02-problem` | anim | 16.6 | 16.3 s |
| 0:47.8 | `s03-head` | anim | 3.9 | 3.5 s |
| 0:52.2 | `s04-title` (chapter: noren) — the title is now ココロエ / Kokoroe | anim | 0.5 + 10.2 | 9.9 s |
| 1:03.4 | `s04b-flow` — 心得 and 心得帳 defined (narration and screen) | anim | 9.7 | 9.4 s |
| 1:13.6 | `s05-choba` (chapter: noren; answers the cold open) | screen | 0.5 + 22.0 | 20.9 s |
| 1:36.6 | `s06-kokoroe` | screen | 8.0 | 7.7 s |
| 1:45.1 | `s06b-ask` | anim | 4.9 | 4.5 s |
| 1:50.5 | `s07-noren` | screen | 10.5 | 5.7 s |
| 2:01.5 | `s07b-mcp` | anim | 10.5 | 7.6 s |
| 2:12.5 | `s07c-ask` | anim | 3.6 | 3.2 s |
| 2:16.6 | `s08-pile` | anim | 10.9 | 10.6 s |
| 2:28.0 | `s08b-keiko` | screen | 9.0 | 8.7 s |
| 2:37.5 | `s09-edo` (chapter: noren) | anim | 0.5 + 6.3 | 6.0 s |
| 2:44.8 | `s09b-end` — ココロエ / Kokoroe | anim | 10.0 | 8.9 s |

Each scene but the last is followed by a 0.5 s breath (silence, its last frame held). "0.5 +" is the closed noren held before a
chapter scene. The narration starts 0.15 s into each scene (`lead`).

Sources on screen (s01-why):
- 51.2%: 帝国データバンク「全国『後継者不在率』動向調査（2025年）」, of the small and medium firms surveyed.
- 330万人: 総務省統計局「労働力調査（詳細集計）2025年（令和7年）平均結果」, 転職者数 (checked in the bureau's summary PDF on 11/4).
- Job transfers within a company have no clear public figure, so they get words only.

## Narration and subtitles
- Voice (Kento, 11/4, after [the voice trial](../docs/voice-trial-2026-11-04.md)): Amazon Polly **Takumi**, neural, rate 105%,
  accents fixed with `x-amazon-pron-kana` (`ACCENTS` in [narration.ts](narration.ts)), 0.5 s between sentences. In v3 most
  multi-sentence scenes use 0.3 s (`pauseMs`), to stay under 3:00. Readings that
  must not change on screen use `<sub alias>` (`READINGS`). Add a word to `ACCENTS` when it still sounds wrong.
- Scene seconds come from the narration's real length: each scene = 0.15 s lead + narration + room for the picture.
- Subtitles switch on Polly's sentence speech marks (`<id>.marks.json`), so they follow the voice.
- Numbers in the narration (`{before}` etc. in scenes.json) are filled from `data/demo/results.json`; while it is not official
  the line starts with 「途中経過では、」 and s08b shows a banner saying the numbers are interim. Re-run the narration for s08b
  after the official measurement.
- Animations are timed to the sentence starts (written in each scene's header comment).
- Screen scenes start their session off camera, so each clip opens on its own page.
- Not in the video: `s01-hook` (the glimpse) and `s07-how` (how it works; its points are in s04b-flow and s07b). Also cut, for
  v3's time: s03's interview-memo and 「違う」 beats. `scenes/s07-how.html` and `scenes/s09-numbers.html` are kept but unused.
- Text-led cards (`ask.html#…`, `"subtitle": false`) have no subtitle: the question is the picture.
- Chapter breaks (`"wipe": "noren"` on s04-title, s05-choba, s09-edo only):
  - The scene opens behind a 藍 noren with a 心 crest (a mark, not the product name), held closed for 0.5 s (`wipeHold`), which
    then parts left and right.
  - It is drawn by the recorder over the page, so it works the same on anim and screen scenes.
  - Stills: `docs/screens/video-wipe-noren-*.png` (frames from the video).
- Smoothness (11/4):
  - Playwright records at 25 fps. In continuous motion nearly every frame is new (cards sliding in: 22/22; people walking:
    75/75; the AI's scan: 40/40).
  - The remaining repeats are at the slow ends of eased motions.
  - HyperFrames (deterministic rendering) was not tried, since nothing stuttered; it remains the option if a higher frame rate
    is wanted.

## Before the final render (11/7–8)
- [x] Real screens from the production bundle (`.image/`, same as the container) on 127.0.0.1, stopped after shooting — no dev indicator.
- [x] Structure v3 rough cut with fixed data and the Takumi narration (11/4): 2:59 (v2 was 2:50). In fixed mode T13's draft is a recorded one;
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

## Idea for 11/7, not built: the second 帳場 (Kento's request on the night of 11/4)

The video's job is still the product. The development story could take one short beat near the end, without new claims:
- **Where:** after the hand-off scene and before the end card, about 8–10 s. Or as one line in the end card if time is short.
- **What is shown:** the same three-part shape, with real artefacts from this repo, not mock-ups:
  1. Claude Code's draft (a line of a plan or a diff);
  2. Kento's one-line judgment, e.g. 「127.0.0.1 だけで」;
  3. where it was kept: the `CLAUDE.md` line or the hook file name.
- **Narration (draft, one sentence):** 「この開発も、同じ形で進めました。Claude Code の案に一言で判断し、その違いを作法として残す。」
- **Not claimed:** that the pattern was measured on development work, or that a general-purpose 帳場 exists. The README's table
  (「二つ目の帳場」) is the source; the video only points to it.
- **Cost:** it has to fit the 3-minute limit, so it replaces seconds elsewhere. Kento decides on 11/7 whether it goes in.

## Idea for 11/7, not built: a visit corrected in own mode (Kento's decision on 11/5)

The demo snapshot now opens with a draft that carries a 訪問の段取り (D-061). But a correction to the visit plan cannot come from
the recorded demo: the simulated master judges only the contact 段取り, and there is no hidden answer for dress or gifts. So the
visit correction is shot separately, as its own short beat:
- **Where it is shot:** 自分の会社で始める (own mode) on 127.0.0.1, with a throwaway folder and one fictional stand-in company and
  client (as in `scripts/check-own-visit.ts`: 「試しの製作所（架空）」 and 「取引先A（架空）」). Delete the folder afterwards. Live
  calls, a few cents.
- **What is shown:**
  1. the 訪問 section of a draft (服装・手土産・先に確かめる話題・同席者・呼び方);
  2. the master's △ and 「この先方はスーツを嫌う。作業着で行け」;
  3. the 心得 in the 心得帳, with its why;
  4. the next visit draft already saying 「作業着で伺う」.
- **Where in the video:** inside or right after s05 (帳場), about 6–8 s, if the 3-minute limit allows. Otherwise one still in s06.
- **Not claimed:** that visit plans are evaluated. The evaluation covers the contact 段取り only; a visit plan has no right
  answer, so it is out of scope (README).
- Kento decides on 11/7 whether it goes in, and which scene gives up the seconds.
