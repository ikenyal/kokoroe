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

## 帳場（2回目、ui-critic の講評から）

1. **The three 段取り lines are tighter**, and 表の連絡／裏の一言 carry a small gloss under the label (窓口へ正式に／決裁者などへ
   根回し) instead of a paragraph. *Why:* the marks were far below the fold, and the explanation was a manual to read.
2. **Ink before the seal.** Unpressed marks are drawn in ink; vermilion appears only on the one the master presses. The record
   button is indigo, so it no longer outweighs the seal. The key numbers show on wide screens only.
3. **Plain wording after judging:** 「…に △を記録しました。このデモでは、弟子の読み取りは行いません（公開版のライブでは
   行います）」, with no 記録済み／ライブ版 jargon.
4. **Tap targets:** 「ここで区切る」 and 「取り消す」 are 40 px tall. On phones the status line is shorter.
5. **Kept: the indigo tab in the navigation.** It is a 暖簾 hanging from the top rule, tied to 「暖簾を継ぐ」, and its dark-mode
   contrast is about 8:1.
6. **Tried and reverted:** そのほか in two columns squeezed 伝え方 into a narrow strip.

## 心得帳

1. **The 沿革 is visible without a click.** Under each 心得: the date, the master's mark in vermilion and words, the scene, and
   「わけ」. An earlier wording appears as 「前は ~~…~~」. *Why:* the history is the point of the 心得帳, and every entry hid it
   behind 「出典と沿革」.
2. **The master's 心得 lead.** The 「師匠」 tag pill is gone (the section says so). A 心得 that started as a ledger fact carries a
   short note instead. The 台帳 facts are folded at the bottom, with their count.
3. **Quieter structure.** Client headings use a thin rule instead of a heavy one. The full source list and 「消す」 share one small
   fold per entry, and 「消す」 is in ink, not vermilion.

## 暖簾を継ぐ

1. **One column, with the example questions as a ruled list under the form** (client on the left, question on the right,
   「尋ねる」 on hover). They were eight boxed cards in a side column. After a question, the answer comes first and the list
   follows as 「ほかに聞けること」.
   *Why:* the boxed cards were the most template-like element in the app, the left half was empty, and 「右の質問例」 made no
   sense on a phone.
2. **The basis stands out.** 「根拠の心得」 is a margin label, like the 帳場's sections; the rule is in Mincho, followed by わけ and
   出どころ.
3. **「いいえ」 is in ink, not vermilion.** Vermilion stays for the master's marks.
4. **Plainer note on the demo:** 「このデモでは、下の質問に記録済みの答えで返します」.

## 最初の画面・心得帳（2回目、ui-critic の講評から）

1. **最初の画面:**
   - On phones the start buttons come right after the intro, so a button is in the first screen; 一・二・三 follow. Desktop is
     unchanged.
   - Lines 一・三 are shorter, with no lone 「ます。」.
   - The specimen's date is labelled 記帳 (when it was written down), and its caption is set in ink Mincho.
   - The stacked double rule under the specimen is gone.
2. **心得帳:**
   - **Each 沿革 entry is a ledger row.** The master's mark sits in the left margin, drawn with the same brush mark as the 帳場 at
     one size (× and △ no longer differ). The date and scene are in readable ink.
   - **Two separate actions:** 「出典の一覧」 (indigo) and 「この心得を消す」 at opposite ends, each 40 px tall.
   - **Tighter spacing** between clients.
   - **On phones,** the side index collapses to the hand-over button and the counts, so the first 心得 is in the first screen.

## 稽古の記録

1. **A one-line opening** saying what is measured (how well the apprentice's drafts came to match the master's, on fictional
   data with a simulated master). It used to open with a caveat about ledger versions.
2. **The comparison as a ruled ledger table:** each row asks a plain question (「師匠が ○ を付けた割合」「○ か △ の割合」
   「後任の質問に、わけごと答えられた数」), with columns 「はじめ（台帳だけ）」 and 「40場面のあと」, and the master's taps
   under it.
   *Why:* three equal "Before / After" figures had to be decoded, and the English labels sat oddly in Japanese.
3. **Safety as its own table:** 0 / 9 and 9 / 9, with one plain line each. It used to be prose in the sidebar.
4. **The chart:** headed 「師匠の手間と、一致の伸び」, with one line on the axes; the baseline label reads 「はじめ」. The caveats
   moved to 「数字の注記」 at the end.
5. **Unchanged:** every number and how it is computed (still read from `data/demo/results.json`).

## 紙と、帳場の右の欄

1. **A faint paper texture in CSS only:** the horizontal laid lines (簀の目) a washi screen leaves, plus a soft unevenness.
   - At the first strength the lines competed with the ledger's ruled lines, which carry meaning. They are now at about 1.6%:
     felt, not seen.
   - A fixed background drew them only in one band of a full-page capture, so it scrolls with the page.
2. **The reading choices are a ruled list** instead of rounded boxes. The same goes for the recorded example.
   - Checked live once on 127.0.0.1, about $0.09. The local start limit was raised for that server through its setting
     (`KOKOROE_IP_STARTS_PER_HOUR`), not by editing its counter.

## 「師匠になって試す」（空の心得帳）

- The empty 心得帳 links to the 帳場 and says what will appear (「△ か × を付けると、直したところが、わけと一緒にここに
  残ります」). The sidebar's 「心得」 label is hidden when there is nothing under it.

## 全体（ui-critic の全画面の講評から）

1. **Filled indigo stays indigo in the dark.** New tokens `ai-fill` / `on-fill` are used by the active tab and the main buttons.
   *Why:* in dark mode these turned pale sky blue, the one off-palette colour. Links and outlines keep the lighter `ai`, which
   reads better as text.
2. **The top banner is a ledger note:** paper ground, a hairline rule, and the page's width instead of a full-width tinted strip.
   *Why:* it read like a cookie notice.
3. **Open marks.** The ○△× have no frame until pressed (a faint frame on hover), so the chosen one's seal rim is the only frame.
   The submit button's idle text is 「先に印を選ぶ」.
4. **The 段取り notice is a ruled entry,** not a grey box with a thick bar. 「弟子の読み取り」 is set in Mincho like the other
   headings.
5. **Kept: the filled navigation tab** (the 暖簾, as before); the critic raised it again, and its dark-mode colour is now fixed.
6. **Found on the way:** after a theme-token change, Turbopack's persistent dev cache (`.next/dev`) kept serving the old CSS
   across a restart. The missing active tab in a screenshot exposed it. Clearing `.next/dev` fixed it; the earlier screenshots
   were checked and were not affected.

## 講評の残り（11/4 夜、`12-leftovers/`）

1. **The chart's earlier setups are context, not a tangle.** They are hairlines without dots, labelled once under their lowest
   point (「細い線：改良の途中の版（4本）」). The current setup's dot and range bar are unchanged; every version still appears in
   the hover and in 「表で見る」. The data and the 0–100% axis are unchanged.
   *Why:* four grey lines with dots crossed each other near 「はじめ」 and drew the eye away from the result.
2. **One reading width.** 暖簾を継ぐ, the comparison test's write page and the report page now use the same width as 稽古の記録
   (`max-w-4xl`); 帳場, 心得帳 and the home page keep their two-column grids.
3. **The example questions look pressable.** Each row shows 「尋ねる」 in indigo at the right (on phones under the question),
   is at least 44px tall, and tints indigo on hover.
   *Why:* the cue appeared only on hover, so on a phone nothing said that the rows were buttons.

## 段取りを主役に（11/4 夜、Kento の気づきから、`13-dandori/`）

Kento's observation: the screens read as "a tool for stamping ○△× on email drafts". The value is the 段取り (who, by what,
when, the quiet word to whom) and the etiquette beyond email.

1. **The 段取り in his words: 誰に・何で・いつ・裏で誰に・後日.** 「何で」 is written as actions: 「手紙を出す。そのうえで訪問して
   話す」, 「電話する」, 「あえて連絡しない」. The note says 「弟子（橙丸）の段取りの案」. 後日のあいさつ moved up from そのほか, since
   it is part of the 段取り. The re-check card in the side panel uses the same rows.
2. **The draft text stays folded,** now labelled for what it is (「送る文」 or 「電話で話すこと」), and is not offered when the
   段取り is not to contact.
3. **The breadth on the home page:** 「扱う場面は10種類。メールだけではありません」, a ruled list of the 10 kinds of scene, each with
   one recorded 段取り. The examples are the apprentice's first drafts on the fictional training scenes, before any correction,
   and the list says so. Where several exist, it shows one that is not just an email.
4. **「どこが違う？」 buttons use the same words** (誰に・何で・いつ・裏で誰に・書式・その他). This is UI only: the labels in
   `src/learning/area.ts` are also part of the interpreter's prompt, so they stay as they are (宛先 = 誰に, 手段 = 何で …).

All of this is display only (`app/dandori.ts`). The proposal fields, `src/core/labels.ts` and anything the simulator or the
evaluation reads are unchanged.

## 訪問の段取り（D-061）と、ui-critic の講評（3回目、`14-visit/`・`merge-3/`・`15-critic/`）

1. **The 訪問 section** on the card, only when the 段取り visits: 服装・手土産・先に確かめる話題・同席者・呼び方. It is corrected by
   the same ○△× and one line. Shots from a live run in own mode with a fictional stand-in (`14-visit/`). The blank capture of the
   regression check was dropped; the script's log shows that the card was there.
2. **From the critic** (question: does it still look like stamping email drafts?):
   - **The money/contract note moved below the 段取り rows,** worded as what it is: 「金額・条件が絡む場面です。金額や条件は橙丸が
     決めず、先方に出す前に師匠が判断します。」 *Why:* at the top, 「橙丸は決めていません」 contradicted the full plan below it.
   - **Home table: whom first** (「PM（窓口）へ、チャットで送る…」), and the quiet word on its own line in ink (「裏で、部長（決裁）に
     も、そっと一言」). *Why:* seven of ten rows began with メールを送る, and the 根回し was lost after the channel.
   - **The draft link reads 「文面の下書き（参考）」.** The remark example reads like a 段取り correction: 「例：先に工場長へ電話。社長
     にも一言」.
   - **心得帳:** 出典の一覧 / この心得を消す / 消す are 44px tall, and 消す is in ink rather than faint grey.
3. **Not taken:**
   - The △ in the status line is the master's own mark, so vermilion is right.
   - The filled tab stays (the 暖簾, decided earlier).
   - 「先に印を選ぶ」 is the disabled state of the button that then reads 「△で記録する」.
4. **For Kento:** "show 訪問 in the demo" (the critic's first point). The demo's recorded drafts have no visit plan, and its
   first card is an email. Either change means re-recording `data/demo/demo-snapshot.json` (live drafts) or reordering it, and
   the video is shot from that snapshot. Left as it is; see the summary at the top.
