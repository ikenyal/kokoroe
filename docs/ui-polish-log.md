# UI polish log (branch `ui-polish`, from 11/4 until the feature freeze on 11/6)

Two aims (Kento): a first-time visitor knows what to read and what to press, and the screens stop looking like a generic
AI-made page. The direction is a merchant's ledger:
- sections divided by ruled lines and space;
- Mincho headings with readable body text;
- vermilion only for the master's marks;
- ink, indigo, vermilion and paper colours.

Screenshots before and after each change are in `docs/screens/ui-polish/` (`before/` is the starting point). A screen-only
critic (`.claude/agents/ui-critic.md`) reviews them after each change.

## 帳場

1. **Ledger sections.** The card is read in order, so each part became a section with a margin label: 場面 → 段取り → そのほか
   → 判定 (vertical on wide screens, horizontal on phones). 表の連絡・裏の一言・時期 are larger under 段取り, with one line
   saying the judgment is made here and what 表／裏 mean. The rest is quieter under そのほか.
   *Why:* every row looked equally important, and newcomers did not know where to look.
2. **The marks are a seal.**
   - Before choosing, they are faint. The chosen one gets a double vermilion frame like a seal's rim, full ink, and a slight
     tilt with a short press.
   - Keys 1・2・3 press ○・△・× (not while typing; the hint shows on wide screens only).
   *Why:* the three tiles looked like ordinary buttons, already stamped before anything was chosen.
3. **"What just happened" without the side panel.** The previous-judgment line now also says what the apprentice is doing with
   it (reading it, written to the 心得帳, nothing changed for a ○) and is announced politely to screen readers.
4. **Vermilion only for the master.** The "needs the master" notice moved to ink, and the empty-state ○ in the side panel became
   a plain sentence.
5. **Small:**
   - The disabled submit button now has a border and readable text (it was about 2:1).
   - The Next.js dev badge is off in development.

## 最初の画面

1. **What it is, in three ruled lines** (一・二・三, a real sequence): the apprentice drafts, the master only stamps, and the
   corrections stay with their why and pass to the successor. The paragraph above them is shorter.
   *Why:* the old paragraph had to be read to the end to learn what happens.
2. **Two ways to start, as a ruled list.** Each button gets one line on who it is for: 「まず全体を見るなら」 against
   「心得帳は空から、あなたの印だけで」.
   *Why:* the two side-by-side boxes were a stock landing-page pattern, and the difference between them was unclear.
3. **One real 心得 as a specimen.** It comes from the demo's 心得帳: 浜風運輸, the master's × and words, the why from 2019, the
   date. *Why:* the product's output was invisible until after a click.
4. **Data handling folded below** (content unchanged). The fictional-data line at the bottom was dropped, since the banner
   already says it. On phones the headline is a little smaller, so 「作法を、」 stays on one line.
