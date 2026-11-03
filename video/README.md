# Demo video — built as code

Target 2:45 (max 3:00), Japanese. Plan: [scenes.json](scenes.json) (12 scenes, 2:53). Everything is generated here during the
hackathon — no outside footage, images or music:
- **screen** scenes are recordings of the real app (the features shown were built during the hackathon),
- **anim** scenes are HTML/CSS pages in [scenes/](scenes/) recorded the same way (explanations only).
Remotion was not used (separate license terms for company use); Playwright + ffmpeg only.

```bash
npm run video:shoot -- --live --voice <voice> --mcp     # 11/7: everything in one command (see video/shoot.ts)
npm run video:shoot -- --voice Kazuha                  # rough cut with fixed data (no API calls)
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
- [x] Real screens from the production bundle (`.image/`, same as the container) on 127.0.0.1, stopped after shooting — no dev indicator.
- [x] Rough cut with fixed data (11/3): 2:50, placeholder voice Kazuha on the six number-free scenes. In fixed mode T13's draft is a
      recorded one; the causal change (△ on T05 → the quiet word on T13) is shot live on 11/7 (`--live`).
- [ ] 11/7: re-record the demo snapshot so 心得帳 shows a rule with a multi-entry 沿革 (today every rule in it has one entry).
- [x] Subtitles one sentence at a time (timed by length for now) — re-time to the audio once Polly narration exists.
- [x] No subtitle on text-led cards (`"subtitle": false` on s04, s10).
- [ ] s09: replace the interim numbers with the official Before/After (same ledger, 5 training paths); the interim Before and
      After were measured with different ledger wording (D-033).
- [x] Animations s02, s03, s07, s10.
- [x] s07: store slot filled after D-002 (「既定: ローカル JSON / Managed Agents にも切替可」).
- [x] s07: hand-off slots filled — MCP（読み取り専用, dotted line from 心得帳） and Agent Skills（SKILL.md, from 後任）.
- [x] Real-screen steps for s05 (お試し with `KOKOROE_VIDEO_QUEUE=T05,T13`), s06, s08, s09 (/keiko, reads results.json);
      s08b compares Skill only vs Skill + MCP from `demo/successor-mcp/answers.json` (re-recorded by `--mcp`).
- [ ] Narration lengths: s01 (~15 s / 12 s) and s07 (~21 s / 15 s) run long — rebalance after the voice is chosen.
- [ ] Polly narration per scene (read-only API call with `--profile brightflow-sandbox-ikeda`).

## Letters with a job (Kento's request on 11/3; built on the night of 11/3 → see docs/night-2026-11-03.md)
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
