# UI polish log (branch `ui-polish`, from 11/4 until the feature freeze on 11/6)

## 夜のまとめ（11/5 19:30〜22:54。ここだけ読めば足ります）

**状況:** 23:19 ごろから Wi-Fi が切れていたため、22:54 の回が最後。それ以降の予約の回は、何もできていない。11/6 03:26 に、テスト 302 件・tsc・lint が通ることを確かめた。main は ui-polish をマージ済みで、中身は同じ。そのうえで両方を push し、origin と一致させた（main `ce3ba3f`、ui-polish `72d2433`）。API の費用は、夜の分（体験の目 3・4）で約 $0.27。

### やったこと（時刻はコミット）

| 時刻 | 目 | 見つけたこと → 直したこと |
|---|---|---|
| 19:39 | C 体験の目 3（スマホの幅、× から） | 直しのあとの最初の ○ は 2.1 秒（前は 10.1 秒）。先読みの作り直しが効いている。読み取りの欄が画面外に見えたのは、撮った瞬間がスクロールの途中だっただけ。確かめ直して、直すものはなかった。 |
| 20:03 | 動画 s02（承認済みの指示 1） | 師匠役テストの採点を、画面の注記に入れた。ナレーションは変えていない（尺 3:00 を守るため）。 |
| 20:23 | D 通しの目 1 | 最初の画面の MCP の答え「蔵へ伺って」が、心得帳に見当たらない。写しのあとに加わった心得（K-018）から来ていることを、注記に書いた。 |
| 20:51 | A 講評 12 | その注記が長すぎたので、2段に分け、要点を先にした。「蔵へ伺って」を改行させない。答えの「。」のあとの空白を取った。 |
| 21:24 | B 審査員 4 | サブエージェントの表を、記録どおりにした（world-keeper の定義に沿った general-purpose）。提出の下書きの冒頭に一段落を置き、リンクの欄を足した。s02 の注記の小さい行を正確にした。動画の時刻表を直した。「全体の 55%」を、△・× の割合だと分かるようにした。 |
| 21:53 | C 体験の目 4（直してから暖簾を継ぐまで、ライブ） | 直したばかりの心得を根拠に、後任の自由な質問へ 6.4 秒で答えた。輪がつながった。「尋ねる」を押したあと何も変わらなかったので、待つ間の表示を付けた。 |
| 22:20 | D 通しの目 2（README・台本と画面） | README の1枚目（丸新酒造）と、公開デモの最初のカード（浜風運輸）が違う。その旨を一文で書いた。 |
| 22:54 | A 講評 13（あまり見ていない状態） | × のあとの右の欄が「△」と言い、他社の心得を例に出していた。押した印を言い、「別の場面の例」と分かるようにした。× のあとのお知らせに「次の案は下です」を足した。記録済みの案で動いているとき、「書きます」の約束にライブでの話だと添えた。スマホにも「記録済み」を出した。空の心得帳では「渡す」を二番手のボタンにした。スマホで「ここで区切る」が一人残るのを直した。 |

### 動画の課題の場面（s02）への「18件中15件」の注記

- **済み。** メールが出る 11.6 秒から場面の終わり（16.6 秒）まで、画面の下に出す。
  - 大きい行: 「作者が初見で ○ を付けた18件のうち、15件は、師匠なら直す案でした。」
  - 小さい行: 「架空のデータ・学習用の20場面。経緯を知らない作者が師匠役をし、シミュレータの判定では △ 8・× 7（D-059）」。審査員の目 4 で正確にした。
- ナレーションは変えていない。一文足すと約 3:00 になり、s02 の動きもずれるため。
- s02 だけ通し稽古で撮り直した（記録済みのデータ、API なし、尺 16.6 秒のまま）。静止画は `docs/screens/video-dryrun/s02-problem-1〜3.jpg`。

### 代表的なスクリーンショット

- 動画 s02 の注記: `docs/screens/video-dryrun/s02-problem-3.jpg`
- 直してから後任の答えまで（ライブ）: `docs/screens/ui-polish/37-experience-noren/noren-live-answer.png`
- 暖簾を継ぐの待つ間の表示: `docs/screens/ui-polish/37-experience-noren/noren-waiting.png`
- 最初の画面の例の注記: `docs/screens/ui-polish/36-critic11-fixes/home-light-desktop.png`
- × のあとの帳場: `docs/screens/ui-polish/39-critic12-fixes/demo-judged/choba-judged-light-desktop.png`、スマホは `top-mobile-viewport.png`
- スマホ・× からの体験: `docs/screens/ui-polish/33-experience-mobile/after-correction-viewport.png`

### 池田さんに判断してほしいこと（夜の分）

- **9（前から）:** README の「作者が日々身を置いている現場」の一文。池田さんが書く。触っていない。
- **13:** 動画 s08b は「伝わるのか」の問いに、○ の割合（55%→64%）で答えている。11/7 のナレーションで、後任が経緯ごと答えられた質問の数（8問中 0→5.3問）に置き換えるか。
- **14:** 提出の下書き 22 行目のテーマの例の引用。出どころの記録がリポジトリにない。大会のページで確かめるか、引用の形をやめて言い換えるか。
- **15:** README の arXiv 2件（2606.04321・2603.24858）。番号と題を確かめるか、番号を外すか。
- **16:** 暖簾を継ぐのライブの答えに、「新のみ・旧なし」「きっかけは未記入」のような内部の言い回しが混じる。直すならプロンプトの変更になり、hitl-reviewer と評価が要る。

## 今夜のまとめ（11/4 夜、Kento が寝ている間。ここだけ読めば足ります）

**やったこと**（すべて `ui-polish` に push 済みで、main にもマージ済み。テスト 271 件、型、lint、`eval:smoke` 2回、ライト／ダーク × デスクトップ／スマホの画面を確認）
1. **講評の残り:**
   - グラフの途中の版は、点のない細い線にして、ラベルを一つにまとめました。
   - 読む画面の幅を揃えました（`max-w-4xl`）。
   - 暖簾を継ぐの例の質問に、いつも「尋ねる」を出し、高さを 44px にしました。
2. **段取りを主役に:**
   - 案の行を 誰に・何で・いつ・裏で誰に・後日 にし、「何で」は動作で書きます（「手紙を出す。そのうえで訪問して話す」「あえて連絡しない」）。呼び名は「弟子（橙丸）の段取りの案」です。
   - 文面は「文面の下書き（参考）」として畳んでいます。
   - 最初の画面に「扱う場面は10種類。メールだけではありません」を置き、10種類の場面を、記録済みの段取りの例と並べました（例は誰に宛てるかから始め、裏の一言は別の行です）。
3. **訪問の段取り（D-061）:**
   - 段取りに訪問が入るときだけ、服装・手土産・先に確かめる話題・同席者・呼び方 を弟子が案に含め、同じ ○△× と一言で直せます。直しは心得になります。
   - **評価では切っています。** 弟子と解釈役への依頼の指紋（SHA-256）を、変更の前にテストとして固定してから作りました。切ったときの依頼は1文字も変わりません。`eval:final` は `KOKOROE_EVAL_VISIT=on` だと止まります。README と決定記録に「評価の対象は連絡の段取り。訪問の段取りは正解がないため対象外」と書きました。
   - **hitl-reviewer の指摘（止める1件）を直しました。** 金額・契約の下限が訪問の案を読んでおらず、「無償で試作品を持参」が師匠に回らない状態でした。
   - **自分の会社モードで実際に試しました**（一時フォルダ、架空の会社と取引先を1つ。終わったあと消しました。≈ $0.09）。「この先方はスーツを嫌う。作業着で行け」と「行く前に、新ラインの立ち上げがどうなったか確かめておけ」が心得になり、次の案はもう作業着で来ました（`14-visit/`）。
   - **途中で前からあった不具合を見つけて直しました:** 自分の会社モードで、確かめの欄が帳場ごと落ちていました。
4. **二つ目の帳場:**
   - README（英・日）に、この開発そのものの例を5件、表にしました（MCP の遮断、正解の凍結、127.0.0.1、作者メールの書き換え、段位を見送った判断）。最初の1件はダメ出しではなく最初からの決まりだ、と正直に書いています。
   - 「案を見れば ○△× を付けられる仕事なら同じ仕組みが使える」は一言だけにし、汎用の帳場は今後の展望として書きました。
   - 動画への入れ方の案は `video/README.md` に置きました（作っていません）。
5. **ui-critic の講評（3回目）から:**
   - 金額の注意は段取りの下に移し、意味が通る言い方にしました。
   - 一言の例を段取りの直しの形にしました。
   - 心得帳の小さなリンクを 44px にしました。

**前後の代表的なスクリーンショット**
- 帳場: `before/choba-light-desktop.png` → `15-critic/choba-light-desktop.png`（スマホは `15-critic/choba-light-mobile.png`）
- 最初の画面: `merge-2/home-light-desktop.png` → `15-critic/home-light-desktop.png`
- 訪問の段取り: `14-visit/1-card.png`、`14-visit/2-card.png`（前の直しが効いた案）、`14-visit/3-kokoroe.png`
- 稽古の記録のグラフ: `merge-2/keiko-light-desktop.png` → `12-leftovers/keiko-light-desktop.png`

**費用:** 今夜のライブ ≈ $0.09、`eval:smoke` 2回 ≈ $0.09。合計 ≈ $0.2 です（上限は $5）。サーバーはすべて止めてあり、公開版の作り直し・AWS・force push はしていません。

**判断してほしいこと**
1. **デモに訪問を見せるか**（ui-critic の一番の指摘）。デモの記録済みの案には訪問の段取りがなく、最初のカードはメールです。見せるには `data/demo/demo-snapshot.json` を録り直すか、並べ替える必要があり、動画もこれで撮っています。今夜は触っていません。
2. **回帰の確かめで、訪問の案の違いも師匠に見せるか**（hitl-reviewer の提案）。訪問の言い回しは解き直すたびに変わるため、ほぼ毎回1タップ増えます。今は見せていません（D-061 に記録）。
3. **金額の下限が訪問の文面にも効くため、「価格には触れず」と書いただけの訪問も師匠に回ります**（実際に1回起きました）。わざと広くしている（D-044）ので、そのままにしています。
4. **公開版への反映は、11/6 の凍結時の作り直しで行います**（訪問の段取りも含めて）。

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

## デモに訪問を入れる（11/5、Kento の判断 1）— 再現せず、今の記録のまま

**やったこと:** 訪問の段取りを有効にして（`KOKOROE_EVAL_VISIT=on`）、今のデモと同じ設定（v1、台帳の制約を登録、横展開あり、seed 7）で学習用 T01–T20 を回し直した（≈ $0.52、架空データ）。
条件は、Kento の指示どおり「丸新酒造 T05 の △ → T13 で弟子が自分から蔵元に一言」が再現すること。

**結果: 再現しなかった。** 新しい記録は使わず、`data/demo/` は今のまま（デモの記録・お試しの記録・師匠役テストの記録とも変更なし）。
- **T05:** 弟子の最初の案が、正式な手紙を **蔵元** に宛て、**奥様** へ裏で一言、になった（今の記録は「奥様にだけ送る」）。表と裏が逆で、判定は ×（R04）。2巡の読み取りのどれも当たらず、何も覚えなかった。
- **T13:** 同じく 蔵元が表・奥様が裏で ×。T05 で何も覚えていないので、「自分から蔵元に一言」という場面そのものが起きない。
- 訪問の段取りが付いた案は 20 場面中 5。

**わかったこと:** 訪問を書かせる指示を足すだけで、丸新酒造の連絡の段取り（誰を表にするか）まで動いた。評価から訪問の段取りを外している（D-061）のは正しかった、という裏付けでもある。

**Kento に判断してほしいこと（別案、未実施）:** 表と裏の場面（お試しの記録の T05・T13）は触らずに、デモの続きの 20 場面（T21–T40）の案だけを、今のデモの心得帳（T20 まで）から訪問ありで作り直し、訪問のある場面を先頭に置く。費用 ≈ $0.2。
- 利点: 表と裏はそのまま残る。デモの続きの心得帳は、来場者が見る心得帳と同じものから案を作ることになる（今の記録の T22 以降の案は、シミュレータが T21 以降を直した後の心得帳から作られている）。
- 注意: 同じ理由で、デモの続きの案の段取りが今と変わる場面がある。動画の s06（心得帳）・s07（暖簾を継ぐ）はデモの続きの心得帳を使うが、心得帳そのものは変わらない。

## 訪問の段取りを「別の手順」に（11/5、Kento の判断）と、デモへの訪問（`16-visit-split/`）

- **分けた:** 段取りは評価と1文字も同じ依頼で作り、そのあと、段取りが訪問を含むときだけ、2回目の呼び出しで訪問の段取りを作る（D-061 の改訂）。2回目は段取りを入力として受け取るだけで、段取りの欄を持たない。テストで、訪問ありでも1回目の依頼が D-061 より前の指紋と同じであること、段取りの各欄が決めたとおりに返ることを確かめた。hitl-reviewer は止める指摘なし。小さい指摘4つ（価格の断り書きを書かせない、`<plan>` もデータと明示、作った ID は捨てる、失敗時の費用も数える）を入れた。`eval:smoke` は 5場面で 40%（昨夜と同じ。架空の10社・評価用20場面のうち5場面）。
- **デモの記録:** 記録済みの段取りはそのまま。訪問を含む案にだけ訪問の段取りを足した（デモの続き 4枚、お試し 9枚、≈ $0.07×2回。プロンプトを直したのでやり直した）。デモの続きは、最初のカードを訪問のある T27（大河原建材）にした（並びだけ）。
  - **表と裏は変わらない:** T05 は奥様だけ・裏なし、T13 は裏で蔵元に一言（K-011）。
  - **お試しの T10 が師匠に回るようになった:** 記録済みの文面に「随意契約」の「契約」がある。文面を読む下限（D-044）より前の記録だったため。今の弟子なら同じく回る。
- **画面:** 全画面 × ライト／ダーク × デスクトップ／スマホ（`16-visit-split/`）。デモの帳場の最初のカードに「訪問」の欄が出る。最初の画面の10種類の例は変わらない。
- **動画・提出:** s08b に「架空の10社で、」（Kento の SSO ログインのあと音声を作り直し、10.10 秒。尺 9.0 → 10.4 秒、全体 約2:56.2）。s07b の画面から心得の ID を消し、心得の文だけに（D-053 を動画にも）。提出の下書きに二つ目の帳場を1行。

## 意義と効果が初めての人にも伝わるように（11/5、Kento の指示、`17-change/`・`18-critic4/`、D-063）

- **帳場「変化」:** 心得が初めて効いた案に、その心得の行だけを「直す前 → この案」で（お試し T13 丸新酒造：裏で誰に なし → 蔵元にも一言。デモの続きは4枚目の T23）。ほかに変わった行は「心得とは別の違い」として1行に。記録済みのデータでは「記録した稽古で…」と明記。
- **心得帳:** 各心得に「この心得が効いた案」。
- **暖簾を継ぐ:** 例の質問で「心得帳なし（一般論だけ）」と「心得帳あり（理由と経緯つき）」を並べる（同じ評価で記録した答え。API なし）。違いが大きい質問から並べ、最初は浜風運輸の遅延の連絡。「わけ：（未記入）」が出ていた表示の不具合を直した。
- **最初の画面:** 丸新酒造の一例を、弟子の案 → 師匠の △ → 心得帳 → 次の案 → 後任の答え、と上から一続きで。
- **デモの続きの案内:** 一〜五の道しるべ（閉じられる）。
- **稽古の記録:** 何がどれだけ変わったかを一文で（results.json から、途中経過の表示つき）。
- **ui-critic（4回目）から:** 「変化」を心得の行だけに、暖簾を継ぐの左に「判断できない」と「根拠・経緯：なし」、家の例は同じ「裏で」の行で比べる、帳場の空の欄の言い方、案内の文字を本文の大きさに。**見送り:** 最初の画面の10種類の一覧を畳む案（Kento の 11/4 の指示で置いたもの）。小さい文字の灰色のコントラスト、スマホの「ここで区切る」などの文字リンクの高さは、次の回に。

## Kento の返事（11/5 夕）から（`19-range/`）

- **最初の画面の10種類:** 見出し「扱う場面は10種類。メールだけではありません」はそのまま。すぐ下に3つ（電話・チャットと Zoom・手紙と訪問。どれもメールではなく、取引先も別々）を見せ、残り7つは「残り7種類を見る」で開く。代表の案の選び方を、電話・手紙を少し重く、裏の一言を重くした（表示だけ）。左の列の下が空いていた釣り合いも小さくなった。
  - **「あえて連絡しない」は見せていない:** 記録済みの弟子の最初の案に、連絡しない案が1つもないため（「直される前の段取りの例」と書いている以上、作らない）。
- **帳場の一言の例:** 「例：先に工場長へ電話。社長にも一言」は、工場長が港北精機の決裁者（公開の台帳）で、「社長にも一言」は表と裏の形（隠しの正解の全社の心得 R04 と同じ形）だった。D-053 と同じ理由で、どの場面にも当てはまらない「例：結論を先に。資料は一枚にまとめて」に。隠しの正解・シミュレータ・場面に「結論」「資料」「一枚」は出てこない（数だけ確認し、正解の中身は表示していない）。
- **コントラスト:** ライトの灰色（`--nibi`）を #5f646b → #565b62（紙に対して 5.3:1 → 6.1:1、濃い紙に対して 5.5:1）。ダークは 7.2:1 のまま。
- **押しやすさ:** 「ここで区切る」「取り消す」「案内を閉じる」を 44px に。いちばん小さい文字を 12.5px に（図の目盛りは図と一緒に伸び縮みするので除く）。

## ui-critic（5回目、`20-critic5/`）

- **入れたもの:**
  - 帳場の「根拠の心得」を「弟子が挙げた心得」に（弟子が自分で挙げた根拠で、確かめたものではない。青葉ドラッグの案が「季節のあいさつは送らなくてよい」を挙げつつ後日あいさつを入れる、という記録どおりの食い違いが、そのまま読めるように）。
  - 「変化」の直した場面を独立した1行に（「直したのは、〇〇の案（師匠 ×「…」）」→ 直す前 → この案）。
  - 暖簾を継ぐ: 根拠の数を「心得 1 つ・台帳の事実 1 つ」のように分け、根拠の欄に「評価のときの心得帳の言い回し」と明記。
  - 稽古の記録: 5.3 に「同じ心得帳で3回測った平均（ばらつき ±0.6）」。
  - 「直近の判定は ○ ではありません」→「前回、この取引先の案は師匠が直しています」。「そのほか」→「補足」。
  - 最初の画面: 10種類の一覧を左の列の「始め方」の下へ。丸新酒造の例と「始め方」のボタンが横に並ぶ。
- **入れなかったもの:**
  - 稽古の記録の「数字の注記」の書き換え: `data/demo/results.json` から生成している文で、11/7 の正式計測で置き換わる。手で書き換えない。**Kento に:** 正式値に置き換わった後の注記の言い回し（「Before／After」の英語、「11/7 に取り直す」）を、生成側（eval/build-results.ts）で直すか。
  - 帳場の右の欄を畳む案（説明つきの空の状態で足りる）。暖簾を継ぐの「尋ねる」の押しやすさ（行全体が 44px のボタン）。

## 稽古の記録の注記（Kento の指示）と ui-critic（6回目、`21-critic6/`）

- **注記は生成するコードの側で直した:** `eval/build-results.ts` の `INTERIM_NOTE`（いま）と `officialNote()`（11/7 の正式計測で作り直したとき）。画面の表と同じ「はじめ」「40場面のあと」で書き、英語の Before／After、決定記録の番号、「11/7 に取り直す」という日付の約束は入れない。文言だけで、計測の中身・数字の計算は変えていない。
  - **確かめ方:** 作り直した `data/demo/results.json` は `note` の1行だけが変わり、ほかの値（数字・曲線）と README の生成部分は同じ（差分で確認）。テストを2つ追加: 記録済みの評価から計算し直すと `results.json` と完全に一致する（数字は評価からしか来ない）、注記が画面の言い方になっている（正式計測の側も、フィクスチャで確認）。
- **ui-critic 6回目:** 「凍結してよい」。入れたもの: 「変化」の行の名前を「何で（手段）」「いつ（時期）」に（「なんで」と読まれない）、「直す前：」を「その案：」に（この場面が直されたのではなく、上の行の場面が直された）、最初の画面の例のラベル幅（「根回しが要る案件」の「件」だけが改行していた）。入れなかったもの: 文字リンクの押しやすさ（5回目のあとに 44px にしてある。写真では小さく見える）。
- **デモで聞かれたときのために（講評から）:** 青葉ドラッグの案は「季節のあいさつは送らなくてよい」を挙げつつ後日あいさつを入れる。記録どおりの食い違いで、新しい担当者へのあいさつは季節のあいさつではない、と答えられる。

## 運営の回答への対応・動画の通し稽古・README の画面（11/5、D-064）

- **README（日英）:** 「Claude で作ったもの／Claude 以外のもの」の節。冒頭近くに要の画面3枚（`docs/readme/*.webp`、合計約230KB、`scripts/readme-shots.ts` で記録済みのデータから撮影）:
  - 帳場の「変化」（丸新酒造、お試しの T05 △ → T13）
  - 心得帳の経緯（浜風運輸、×「早めに配車課長へ」とわけ）
  - 暖簾を継ぐの「心得帳なし／あり」（浜風運輸、なし＝判断できない）
- **動画の通し稽古（`npm run video:shoot`、記録済みのデータと今ある Takumi の音声。API・Polly は使っていない）:** 16場面すべて撮れ、尺のはみ出しなし、合計 2:56.2。静止画は `docs/screens/video-dryrun/`（場面ごとに3枚、実画面の場面は5枚）。直した点:
  - **s05（いちばん大事）:** 訪問の段取りが加わって案が長くなり、最後の固定量のスクロールが段取りより下で止まっていた。T13 の「裏で誰に：蔵元（決裁）にも、そっと一言」も「変化」も映っていなかった。いまは「裏で誰に」の行をラベルで探して画面の中央へ動かす（画面には「変化」と段取りが両方映る）。
  - **s04b:** 新しい札「文面は Claude の API（既製）」が2行に折れていた → 1行に。
  - **s07:** 「ココロエの画面（自作）」の札がアプリのロゴに重なっていた → 右の余白へ、4行で。
  - **s07b:** 下の注記が「文／章」で折れていた → 2行に分けた。
  - セレクタの切れはなし（s05 の新しいセレクタは、行のラベルに添え書きがあるため完全一致では見つからず、`dt` で探すよう直した）。
- **11/7 に見ること:** s05 の △ を押すとき、カードが長いので画面が一度大きく動く（自動スクロール）。ライブでも同じ。気になるなら、△ の前に判定欄へゆっくりスクロールする手順を足す。
- **ui-critic（7回目、README の画面と動画の札）を受けて入れたもの:**
  - 帳場「変化」の「その案：」の打ち消し線をやめた（「なし」に線が入ると「な七」と読める）。「その案／この案」の見出しで前後は分かる。
  - s04b: 「ココロエが作った仕組み」を心得帳の下だけでなく、師匠 → 後任にまたがる括弧にし、中身を書いた（帳場・心得帳・後任への受け渡し（Skill／MCP サーバー））。札の文字を大きく。
  - s07b: 「Claude Code（Anthropic の既製品）」を見出しの大きさに。列の見出しを「書き出した時点の写し」「いまの心得帳に」に。藍の下線の文は行の頭から（「蔵」だけが行末に残らない）。下の凡例は1行に。
  - README の3枚目を、質問と二つの答えまでに切った（縦に長すぎた）。
- **入れなかったもの:** 記録済みの答えの「この規則は」（モデルの出力そのもの。記録は書き換えない）。心得帳の画像の「この心得を消す」（「消せます」の説明に要る）。s04b の「裏で蔵元に一言」は、動画の s05 で師匠が打つ一言と同じで、README の1枚目（記録の稽古では一言なし）とは別の場面の話。s05 の画面の右半分の空き（帳場の右の欄。記録データでは読み取りが出ない）。
- **s05 の △ の前の「飛び」（Kento 11/5）:** カードが長く、△ を押すときに Playwright の自動スクロールで画面が一瞬で大きく動いていた。押す直前に判定の欄まで 1.4 秒かけてゆっくり動かす（`glideTo`、ゆっくり始まりゆっくり止まる）。読む間を 8.0 秒から 6.4 秒に縮めて吸収し、△ を押す時刻（約 8 秒、「師匠は、△。」）と場面の尺（22.0 秒）は同じ。動画の合計も 2:56.2 のまま。静止画: `docs/screens/video-dryrun/s05-choba-glide-1〜3.jpg`（動く前・途中・押したところ）。
  - つまずき: ページの中で動かす関数を tsx が `__name()` で包み、ブラウザ側で未定義になった。文字列で渡すようにした。

## ui-critic（8回目、`22-critic7/` → 直したあと `23-critic7-fixes/`）

- 講評は「凍結してよい」。小さい4点を入れた（記録済みのデータ、API なし）:
  - 帳場「変化」の行の名前「何で（手段）」が「手／段」で折れていた → 折らない（列の幅を中身に合わせる）。段取りの「裏で誰に」の添え書きを「決裁者へ根回し」に（スマホで「し」だけが次の行に残っていた）。
  - 右の欄の「左の「変化」は…」→「案の「変化」は…」（スマホでは欄が案の下にあり、左に何もない）。
  - 暖簾を継ぐ・心得帳の沿革の「前は」のあとの打ち消し線をやめ、「前は：」に（7回目の「変化」と同じ理由。小さい灰色の文に線が入ると読みにくい）。
  - 暖簾を継ぐ「ほかに聞けること」から、いま答えた質問を外した（押しても同じ答えが出て、何も起きないように見える）。
  - 「心得 1 つ」の数字のまわりの空きをやめた（明朝で全角に見えていた）。
- README の画像を撮り直した（1枚目は「何で」の行、3枚目は数の書き方が変わったため）。

## ui-critic（9回目、これまで見ていなかった画面。`24-critic8/` → `25-critic8-fixes/`）

- 入れたもの:
  - 帳場で △・× を記録した直後、上の知らせと右（スマホでは下）の「弟子の読み取り」の欄が同じ文（「このデモでは、弟子の読み取りは行いません…」）を二度言っていた → 欄の側は場面の名前だけにし、その下の例を「公開版のライブでは、ここで弟子が…」に（「ライブ版」という言い方もやめた）。
  - 最初の画面の「上のボタンを押すと、最初からやり直します」→「上のどのボタンで始めても、最初からやり直しになります」（どちらのボタンか迷わない）。
  - 最初の画面の10種類の一覧の名前の列を少し広げた（「打ち合わせの日程調／整」）。
  - 404 の見出しを「その頁は、／この帳面にありません」で折る（「ありま／せん」にならない）。
  - 稽古の記録の見出しの「（途中経過）」、表の見出し「はじめ（台帳だけ）」を語の途中で折らない。
- 入れなかったもの:
  - 講評の1番「書き足す・報告・自分の会社で始める の画面が撮れていない」: 書き足す・報告は師匠役テスト／自分の会社のモードだけの頁で、デモでは最初の画面に戻るのが正しい動き。`/own` も自分の会社のモードを入れていないときは 404 が正しい。スマホの写真の「1 Issue」は開発用サーバーだけの表示（この 404 の検証の警告）で、本番のビルドには出ない。
  - 10種類の一覧の例の「電話す／る」（狭い列の中の折り返し。`word-break: auto-phrase` を試したが、撮影のブラウザでは効かなかったので外した）。

## 毎時の改良の回し方（Kento 11/5 昼、11/6 17:30 まで）

毎時（:07 ごろ）に、3つの目を1回に1つずつ順番に回す: **A. 画面の目**（ui-critic、スクリーンショット）→ **B. 審査員の目**
（judge-critic、`docs/judging.md` の基準で README・提出の下書き・動画・画面を読む。事実で裏付けられる改良だけ、D-062）→
**C. 体験の目**（本番ビルドを 127.0.0.1 で動かし、「師匠になって試す」をライブで数件。押してから案が出るまでの秒数と
待つ間の表示を測る。1回 $0.5 まで）→ A …。9回目までは A だけ。次は B から。

- 小・中の改良（画面・文言・README・台本・待ち時間の見せ方）は進めてマージする。大きいもの（新機能、画面の構成を大きく
  変える、学習や評価に触れるもの）は作らず、下の「池田さんに判断してほしいこと」に案だけ書く。
- 毎回の終わりに「今回の目・見つけたこと・直したこと・直さなかった理由」を書く。

**11/5 夜からの変更（Kento）:**
- 30分ごと（:07 と :37）に回す。止める時刻（11/6 17:30 以降は新しい改良を始めない）・費用（1日 $5）・守ることは同じ。
- 4つ目の **D. 通しの目** を足し、A→B→C→D→A…で回す。初めての人として、最初の画面 → デモの続き → 心得帳 → 暖簾を継ぐ → 稽古の記録 → README を、記録済みのデータで続けてたどる。「迷った」「意味が分からなかった」「前の画面と言っていることが違う」箇所を挙げて直す。画面どうし、README、動画の台本の食い違いも見る。
- **夜の間（Kento 11/5 夜、朝まで）:**
  - 迷ったら安全な側で止め、「池田さんに判断してほしいこと」に書いて次へ進む。
  - 公開版の作り直し・AWS・force push・リポジトリの公開はしない。
  - README の「作者が日々身を置いている現場」の一文は Kento が書くので触らない。
  - Claude Code の利用の上限が近づいたら新しい改良は止め、11/7 の正式計測と撮影のために余力を残す。
  - 朝、このログの先頭に「夜のまとめ（やったこと・代表的なスクリーンショット・池田さんに判断してほしいこと）」を書く。
- 11/7 の録り直しを守るため、11/6 の正午以降は、動画に映る画面の配置を大きく変える改良はしない（文言の小さな直しは可）。変えた場合は、その場面だけ通し稽古（`video/shoot.ts --only`）で録り直して静止画を確かめる。

## B. 審査員の目（1回目、11/5 昼。judge-critic の定義をこのセッションでは読み込めず、同じ指示で general-purpose として読み取りのみで実行）

- **見つけたこと（基準ごとの主なもの）:** インパクト — README の課題が統計だけで、作者自身の現場から出発したこと（evolution.md の背景）が書かれていない／師匠役テストの「20件中18件 ○」（経緯を知らない者には案が合格に見える）が「動かし方」に埋もれている／誰がいつ使い続けるかが提出の下書きにしかない。デモ — 暖簾を継ぐの場面（s07）の質問は台帳の事実から答えるもので、師匠の直しの力を見せていない／デモの続きの最初のカードが大河原建材で長い訪問の段取り、その同席者が「橙丸が主担当で伺う」。Claude の活用 — README にプランモード・`claude -p`・講評役・MCP の使い分け・モデルの分担がない。深さ — 稽古の記録の見出しが途中経過の比べられない数字を変化として言っている（注は下のほう）／案の残りの安全が README にない。
- **直したこと（すべて記録で裏付けあり）:**
  - README（日英）の課題に、作者が日々いる現場であること（evolution.md の背景）と、師匠役テストの 18/20（D-059）を1文ずつ。「誰のためのものか／使い続ける場面」を提出の下書きから写した（D-056）。
  - README（日英）の Before/After の下に「残りの案の安全」: 弟子は送らない、師匠はすべての案に印（D-055）、値引き・契約・重要な取引先への最初の連絡はコードでも師匠へ（D-044 `mustReview`）。
  - README（日英）の「Claude Code でどう作ったか」に、プランモード、`claude -p`、ui-critic と judge-critic、MCP の使い分け（D-003 と読み取り専用サーバー）、役割でのモデルの分担（CLAUDE.md の表）。
  - 稽古の記録の見出しのすぐ下の小さい行を「途中経過（はじめと今で台帳が異なるため、そのままは比べられません）」に。
  - 動画 s08b の台本「師匠の{taps}回の確認で」→「回のタップで」（稽古の記録の見出しと同じ言葉。音声は 11/7 の録り直しで反映）。
- **直さなかったこと:** README の表の「110–120」と画面の「約114」の違い（表は results.json から作るもので、11/7 の正式の値で両方そろう）。稽古の記録のグラフの灰色の線の説明を足す案（「多くは Before を測り直す前」かを、まだ確かめていない）。痛みの大きさ（測っていない。D-062）。下の判断待ちのもの。

## 池田さんに判断してほしいこと

1. **デモの続きの最初のカードの「同席者：橙丸が主担当で伺う」（記録済みのモデルの出力、`data/demo/demo-snapshot.json`）。** AI の弟子が自分で訪問する、と読めます。HITL の線（弟子は送らない・約束しない）から見ると審査員に引っかかる恐れ。直し方の案: (a) 記録を録り直す 11/7 に、訪問の段取りのプロンプトに「同席者は人（担当者・師匠）で書く」を足す（プロンプトに触れるので hitl-reviewer と評価が要る）、(b) 最初のカードを訪問のない場面に並べ替える（記録データの順番だけ）、(c) そのまま。
2. **デモの続きの最初のカード（大河原建材・長い訪問の段取り）。** 最初の画面と動画は丸新酒造の話。最初を丸新の根回しのカード（「変化」が出る）にすると、最初の画面からの流れがつながる。記録データの並べ替えなので、動画の s05（お試しの列 T05,T13）には影響しない見込み。
3. **動画 s07（暖簾を継ぐ）の質問。** いまは港北精機の「Zoom で送っていいですか」で、答えは台帳から写した事実（Zoom 不可 → Teams）から来ている。師匠の直しから来た答えを見せるなら、浜風運輸の「遅延の連絡」（師匠の × と 2019年のわけ、README の3枚目と同じ）に替える案。s07b（MCP）の質問と台本も合わせて変わる。
4. **動画 s05 の台本「冒頭の1行は、蔵元への、裏の一言でした」。** 冒頭（s00）で丸を付けるのは手紙の中の一文で、製品では「裏で誰に」の行。「冒頭の1行の正体は…」などで結ぶ案。s05 の尺（22.0 秒、△ を押す時刻）に影響するので、11/7 の録り直しの前に決めたい。
5. **動画の最後に「この開発も同じ形で」の1行を足すか。** README の「二つ目の帳場」（D-003・D-017・D-055）に裏付けはある。終わりの画面の文字が増える。

## 判断待ちの5つへの答え（Kento 11/5 午後、D-065）

1. **訪問の段取りの同席者:** 訪問のプロンプト（2回目の呼び出しだけ）に「行くのは人。AI の弟子は訪問せず、同席者にも書かない」。1回目（段取り）は変えず、指紋のテストはそのまま通る。hitl-reviewer は OK、その指摘（作り直しのときに古い訪問の段取りを「決まったもの」として渡していた）を直してから、記録の訪問の段取り13件だけを作り直した（≈ $0.07、最初に止まった1回を含め ≈ $0.11）。段取りの項目はすべて同じことを確かめた。同席者は「担当営業と篠原部長」など。テスト `tests/demo-visits.test.ts`。
2. **デモの続きの最初のカード:** 丸新酒造の悪い知らせ（T22、裏で蔵元にも一言）を先頭に（並びだけ）。**ただし、このカードには「変化」の欄が出ない。** K-011 が初めて効いたのは学習の記録の T13 で、デモの続きの丸新のカード（T22・T33）はその後なので。デモの続きで「変化」が出るのは T23（青葉ドラッグ）と T26（浜風運輸）だけ。→ 下の「池田さんに判断してほしいこと」6。
3. **動画 s07:** 浜風運輸の「遅延の連絡」（Q03）に替えた。台本「後任が、「遅延の連絡は、確定してからでいいですか」と聞くと、心得帳が、理由ごと答えます。」（いまの音声 5.7 秒に対し、場面は 10.5 秒のまま）。**s07b は替えていない**（下の 7）。
4. **動画 s05:** 「冒頭の1行のもとは、裏で蔵元へ、そっと一言。」（2文字増。△ を押す時刻はこの文より前なので動かない）。音声は 11/7。
5. **終わりの画面:** URL の下に小さな1行「開発そのものも、製品と同じ形で進みました（Claude Code の案を判断し、CLAUDE.md・フックに残す）」。ナレーションと尺はそのまま。
- 静止画: `docs/screens/video-dryrun/s05-choba-4〜5.jpg`、`s07-noren-1〜3.jpg`、`s09b-end-3.jpg`。デモの続きの最初のカード: `docs/screens/ui-polish/26-kento-answers/`。

### 6・7 への答え（Kento 11/5）

- 6 → **T26（浜風運輸）を先頭に**（並びだけ。「変化」が出る。動画 s07・README の3枚目と同じ浜風の話）。
- 7 → **s07b は丸新の質問のまま**（MCP の差が出るのは丸新とまちなかだけ）。

### 池田さんに判断してほしいこと（追加・答え済み）

6. **デモの続きの先頭に、「変化」が出る丸新のカードはない。** いまの T22（丸新・裏で蔵元）のままにするか、「変化」が出る T26（浜風運輸、K-015「悪い知らせは確定を待たず、早めに配車課長へ本題まで」。動画 s07 と README の3枚目と同じ浜風の話）を先頭にするか。
7. **s07b の質問。** s07b の答えは `claude -p` で記録したもの（丸新酒造の出荷の遅れ）で、「写しにはない、あとから増えた心得（K-018）を MCP で見つける」のが要点。写しのあとに増えた心得は丸新（K-018）とまちなか（K-017）だけで、浜風運輸の質問に替えると左右の答えが同じになり、MCP の意味が消える。いまは丸新の質問のまま（これも「遅れの連絡」の質問）。浜風に替えるなら、`claude -p` を2回録り直す（費用は小さい）うえで、MCP の差は出ない。

## C. 体験の目（1回目、11/5 13:35〜。本番ビルドを 127.0.0.1 で、ライブ）

- **測り方:** `scripts/experience-run.ts`（新規）。本番のイメージ（`.image`）を 127.0.0.1 だけで起動し、使い捨てのデータの置き場で、その回の費用の上限をサーバー側で $0.5 に（`KOKOROE_DAILY_USD`）。「師匠になって試す」から、1枚目に △（一言「先に電話で一言」）、2〜4枚目に ○。数字は `docs/results/experience-2026-11-05T13*.json`。4回で ≈ $0.20（サーバーの見積り。1回目は台本の不具合で途中まで）。
- **秒数（架空のデータ、1人・4回の範囲）:**
  - 「師匠になって試す」→ 最初の案が出るまで: 4.1〜4.9 秒（「帳面を開いています…」が出ている）
  - 印を押して記録 → 次の案が出るまで: △ のあと 3.8〜5.1 秒、○ のあと 7.4〜9.1 秒（次の場面の案を、ライブで作ってからページが戻る）
  - △ のあと、右の欄に弟子の読み取り（「どの意味でしたか」）が出るまで: 9.0〜12.0 秒（その間「解釈の順番待ち」→「どこが違ったか読み取っています」と出る）
- **つまずく点:** 記録してから次の案までの 5〜9 秒、画面はボタンが「記録しています」になるだけで、何を待っているかが分からない。押した印も消える（送ったときに選択を外す作り）。
- **直したこと:** ライブのときだけ、待つ間に判定の欄のすぐ下に「記録しています。続けて弟子が、いまの心得帳で次の場面の案を作ります（10秒ほど）。」と出す（表示だけ。学習・判定・評価の動きは変えない）。画面: `docs/screens/ui-polish/27-experience/waiting.png`。最初は入力欄の下に置いたが、画面の外に出たので上へ移した。
- **直さなかったこと:** 押した印が待つ間に消える（送ったあとに選択を外す作りで、取り消しのあとに同じカードへ戻るときの動きにかかわるため、今は触らない）。待ち時間そのものを縮める案は下の 8。

### 池田さんに判断してほしいこと（追加）

8. **次の案の先読み。** いまは、記録 → 次の場面の案をライブで作る → ページが戻る、の順で 5〜9 秒待つ。いまのカードを見せている間に、次のカードの案を裏で作っておけば、待ちはほぼなくなる。ただし、先読みした案は直前の △・× を学ぶ前の心得帳で作られるので、「直したら、次が変わる」が一枚遅れて見える。並びを変える（直しのあとは作り直す）なら、学習の見え方に触れる中くらい〜大きい変更。

## 8 への答え: 次の案の先読み（Kento 11/5 午後、D-066）

- **作ったもの:** ライブのとき、いまのカードを表示したら、裏で次のカードの案を作り始める（`src/server/prefetch.ts`）。使うのは、師匠が **○** を付け（judge(○) がその先読みを「使ってよい」に印す）、しかも先読みを始めたときと心得帳が同じ（全心得の内容と沿革のハッシュで比べる）ときだけ。△・× と取り消しでは、そのセッションの先読みをすべて捨て、今までどおり作る。先読みの案は、使うまでサーバーのメモリにしかなく、記録・表示・学習のどこにも入らない。確かめ稽古・回帰の確認・値引き/契約の床の順番は変えていない（使う案にも同じ床がかかる）。
- **hitl-reviewer:** 1回目は BLOCK（古い描画が △ のあとに次のカードの先読みを始めて、それが使われうる／取り消しのあとに古い先読みが残る／止まった先読みを 60 秒待ちうる）。直し: 位置の確認と確保を await なしで、○ の「使ってよい」の印がないものは使わない、△・×・取り消しで全部捨てる、待つのは先読みを始めてから 20 秒まで。テストを足した（`tests/prefetch.test.ts`、12件。評価・弟子・学習のコードが先読みを読み込まないことも）。2回目: OK（3つとも閉じている）。任意の指摘（捨てて取り直した枠を古い実行が埋めうる → 余分な呼び出し1回）も、実行が自分の確保した枠だけを埋めるようにして直した。
- **前後の秒数（本番ビルド・127.0.0.1・ライブ、架空のデータ、1人で数回。`docs/results/experience-2026-11-05T14*.json`）:**

  | | 先読みなし（13:37〜13:41） | 先読みあり、読む時間 10 秒（14:12） | 先読みあり、読む時間 0 秒（14:11〜14:15） |
  |---|---|---|---|
  | ○ を記録 → 次の案 | 7.4〜9.1 秒 | **0.3 秒**（3回とも） | 0.3〜8.9 秒（先読みが終わっていれば 0.3 秒。終わる前に押すと、走っている先読みを待つので、なしと同じくらい） |
  | △ を記録 → 次の案 | 3.8〜5.1 秒 | 4.8 秒（先読みは捨てて作る） | 4.6〜5.2 秒 |
  | △ のあと右の欄の読み取り | 9.0〜12.0 秒 | 9.1 秒 | 9.2〜12.2 秒 |

  読む時間 0 秒の回で、△ の読み取りを待ったあとの ○ が 8.3〜8.9 秒だったことがある。読み取りがそのまま心得帳に書いた（心得帳が変わった）ため先読みを捨てた、と見るのが自然（その回の内訳は取っていない）。条件どおりの動き。師匠役テストの1枚あたりの中央値は 53.5 秒なので、実際にはたいてい先読みが間に合う。
- **費用の見積り:** 捨てた先読みも1日の上限と1セッションの呼び出し数（40）に数える。増える分は「△・× 1回につき案1枚分」＋「最後のカードのあとに作りかけの1枚」。案1枚は、今日の回の費用から見て $0.01 前後（読み取りの Opus を除く）。お試しの訪問者が半分の場面に △・× を付けるとすると、案を作る費用はおよそ 1.5 倍、全体（読み取りを含む）ではおよそ 2〜3 割増し。公開版の1日の上限（$5）は変えないので、お金が増えるのではなく、上限に届くまでに試せる人数が 2 割ほど減る見込み。1セッション40回の呼び出しも、△・× が多いと少し早く尽きる。
- **待つ間の一行:** 押した印を入れた（「○ を記録しています。続けて弟子が…」）。画面: `docs/screens/ui-polish/27-experience/waiting.png`。
- **ついでに:** 全テストの最初の1回で、取り消し・確かめ稽古のテスト3件が 5 秒のタイムアウトで落ちることがある（変換のキャッシュが冷えているとき）。続けて回すと通る（単独では 1 秒未満）。動きの不具合ではない。
- 今日このセッションの API 費用（概算）: 訪問の段取りの作り直し $0.11、eval:smoke $0.05、体験の目 $0.48。

## A. 画面の目（ui-critic 10回目、11/5 14:35。`28-critic9/` → `29-critic9-fixes/`）

- **見つけたこと:** 「凍結してよい」。(1) 稽古の記録の見出しが、途中経過の数字を変化として言い切っている（下の小さい行で打ち消す形）。(2) スマホの学習曲線が左端で開き、結果（藍の点）が画面の外。(3) デモの続きの最初のカード（浜風運輸・打ち合わせの日程調整）の「変化」が「直したのは、浜風運輸・悪い知らせの案」で、別の場面の直しだと分からず、取り違えに見える。(4) 語の途中や行末1文字の折れ（「ばらつ／き」「師／匠 ×」「ら）。」「ます）。」）。(5) スマホの「ここで区切る」が進み具合の行から離れて1行に。
- **直したこと:** (1) 見出しの頭に「途中経過では、」（正式の値になれば消える）。(2) スマホでは図を右端で開く（図の上の注も「右端の藍の点が今の構成の結果」に）。(3) 「直したのは、別の場面（浜風運輸・悪い知らせ）の案（師匠 ×「…」）」に（「変化」は直した場面そのものには出ないので、いつも別の場面）。README の1枚目も撮り直した。(4) 折れる箇所に改行しない範囲を付けた。
- **直さなかったこと:** (5) 進み具合の行の並びを変える（スマホの頭の配置を変えるので、凍結前は避けた）。

## B. 審査員の目（judge-critic 2回目、11/5 15:0x）

- **見つけたこと（主なもの）:** インパクト — README の「作者の現場」のリンク先（evolution.md の背景）が同じ一文の繰り返しで、何も足さない／△ がある理由（キックオフ前の自己試行で直しはたいてい「いいけど…」）が README にない／自分の会社で始める道が「動かし方」の最後に埋もれている。デモ — 固定データの s05 は、師匠が「裏で蔵元に一言」と打つのに、「変化」は記録の稽古の印（一言なし）を出す／s05 の静止画の1枚が D-065 前の同席者（橙丸）のまま／終わりの画面に公開デモの URL がない／README の2枚目と3枚目で浜風運輸の心得の言い回しが違う理由が書かれていない。Claude の活用 — 「Claude Code で何が可能になったか」の一文が提出の下書きにしかない／D-066 で hitl-reviewer が止めた件、Managed Agents のメモリストアを試した件が README にない。深さ — 20場面では1場面が5ポイントであることが書かれていない／上限に達したときに見学者に何が見えるかが書かれていない。
- **直したこと（記録で裏付けあり）:** README（日英）に: △ がある理由（evolution.md の背景、キックオフ前と明記）、「誰のためのものか」から「自分の会社で始める」への一言、3枚目の言い回しの違いの説明、上限に達したときの動き（`LIMIT_MESSAGE` の文言どおり、記録済みのデータで続く）、「一週間で作れたのは、作業だけでなく守る仕組みも任せられたから」（提出の下書き・how-we-built）、D-066 の hitl-reviewer の件、Managed Agents のメモリストア（D-002 の数字）、「20場面では1場面が5ポイント。55% → 64% は2場面分に満たない」。s05 の静止画を今の録画から取り直した（同席者は「担当営業と…」）。video/README の 11/7 の確認に、s05 の「一言なし」と同席者、終わりの画面の公開デモ URL を足した。
- **直さなかったこと:** 「作者の現場」の中身（作者本人の言葉が要る → 下の 9）。18/20 の裏付け（測っていない → 10）。痛みの大きさ（測っていない、D-062）。README の並べ替え（道具ごとの表、「試したこと」の節）・暖簾の例に MCP の答えを足す・s05 で訪問の段取りを飛ばす／拡大して撮る（中くらいの変更 → 11）。評価用20場面の見すぎ（隠しの正解は凍結、D-017）。

### 池田さんに判断してほしいこと（追加）

9. **README の「作者が日々身を置いている現場」に、池田さん自身の一行を足すか。** いまのリンク先（evolution.md の背景）は同じことしか言っていない。仕事の中身（取引先ごとの対応をどれくらいの頻度で見るか、など）は、池田さんの言葉でないと書けない。
10. **師匠役テストの20枚を、コードの判定（シミュレータ）でも採点するか。** API は使わない。「作者が ○ を付けた18枚のうち、隠しの正解なら何枚が △・× か」が分かり、「経緯を知らない者には合格に見える」の裏付けになる（逆に、ほぼ正しかったと出る可能性もある）。評価のコードを読むスクリプトを1本足す、中くらいの作業。
11. **審査員の目から出た中くらいの案（いずれも事実はそろっている）:** (a) README の「Claude Code でどう作ったか」を、フック・サブエージェント・Skills・MCP の目的の表にまとめ直す。(b) 「動かし方」に埋もれている師匠役テスト・ペルソナ・「どこが違う？」の A/B を、Before/After のあとの「試したこと・試していないこと」の節へ移す（並べ替えだけ）。(c) 最初の画面の例に、MCP から来た答え（K-018「蔵へ顔を出して」）の一行を足す。(d) 動画 s05 で、訪問の段取りを飛ばして判定へ動かす、または画面を拡大して撮る（11/7 の録り直しで）。

## 判断待ち 9〜11 への答え（Kento 11/5 夕方）

- **9（作者の現場の一行）:** 池田さんが書く。それまで今の文のまま（触っていない）。
- **10（師匠役テストの20枚をコードの判定で）:** `eval/master-role-vs-simulator.ts`（API なし）→ `docs/results/master-role-vs-simulator-2026-11-05.json`。作者が ○ を付けた18枚は、隠しの正解では **○ 3・△ 8・× 7**。作者の △ 2枚は × 1・○ 1。一致は20枚中3枚。条件（作者が見た案＝テストの最中に台帳の制約＋途中で覚えた2つの心得からライブで作られたもの、11/3 から凍結した判定、連絡の段取りだけ、シミュレータの一人の師匠の正解であって実在のベテランではない）とともに、README（日英）と D-059 に事実として足した。
- **11(a):** README の「Claude Code でどう作ったか」に、フック・サブエージェント・Skills・MCP・プランモード・`claude -p` の「目的／ここでしたこと／記録」の表。重なっていた箇条書きは表にまとめた（中身は同じ）。
- **11(b):** 師匠役テストとペルソナのシミュレーションを「動かし方」から出して、Before/After のあとの「試したこと・試していないこと」の節へ（並べ替えだけ。課題の節の参照先も直した）。
- **11(c):** 最初の画面の例の「後任が聞くと」に、MCP から来た答え（「いいえ、奥様への電話だけでは足りません。蔵へ伺って、直接お伝えしてください。」、`demo/successor-mcp/answers.json` の記録）を、「写し（Skill）から」「いまの心得帳（MCP）から」の札つきで並べた。画面: `docs/screens/ui-polish/30-kento-answers2/`。
- **11(d):** 動画 s05: 訪問の段取りで一度止まって（約1.2秒）から判定へ動く。△ は字幕「師匠は、△。」が出たときに押す（ページの読み込み時間が回ごとに違い、決まった待ち時間では △ が 0.5〜1 秒ずれたため、字幕そのものを合図にした）。場面の尺は 22.0 秒のまま。固定データで3回撮って確かめた。静止画: `docs/screens/video-dryrun/s05-choba-visit.jpg`、`-glide-3.jpg`。11/7 のライブでも同じ手順。

## C. 体験の目（2回目、11/5 16:35。直しの流れを最後まで。本番ビルド・127.0.0.1・ライブ）

- **測り方:** `scripts/experience-run.ts --cards 3 --read 8 --choose`（読む時間 8 秒。△ のあと、読み取りを選び、わけを残し、確かめが出るまで）。`docs/results/experience-2026-11-05T1637.json`、≈ $0.086。
- **秒数（1回、架空のデータ）:**
  - 「師匠になって試す」→ 最初の案 5.1 秒／△ を記録 → 次の案 5.3 秒
  - △ → 右の欄で読み取りが終わるまで 6.1 秒（この回は読み方を選ぶ必要がなく、そのまま「心得帳に書きました。よければ、わけを一言」）。途中は「解釈の順番待ち」→「どこが違ったか読み取っています」と出る
  - わけを残す → 確かめ（直した場面を新しい心得で解き直した結果）が出るまで 6.4 秒。途中は「新しい心得で解き直して、確かめています」
  - その間に次のカードに ○ → 次の案 **10.1 秒**（心得帳が変わったので先読みを捨てて作り直した。D-066 の条件どおり）。続く ○ は 0.5 秒（先読みが使われた）
- **つまずく点:** 直しのあとの最初の ○ だけ、10 秒待つ。待つ間の一行（「○ を記録しています。続けて弟子が…（10秒ほど）」）は出ていて、時間も合っている。ほかに止まる所はなかった（読み取り・わけ・確かめのそれぞれで、何をしているかが右の欄に出る）。
- **直したこと:** なし（測り方の台本に `--choose` を足しただけ）。
- **直さなかったこと:** 下の 12（先読みの流れに触れるため、作らずに案として）。

### 池田さんに判断してほしいこと（追加）

12. **心得帳が変わったら、先読みをその場で作り直す。** いまは、先読みのあとに心得帳が変わると（直しの読み取りが書いた、わけが足された、など）、○ を押した時点で捨てて作るので 10 秒待つ。心得帳が変わったのを見たら（右の欄の更新で分かる）、新しい心得帳で先読みをやり直せば、直しのあとの最初の ○ も待たずに済む。D-066 の条件（○ のときだけ、心得帳が同じときだけ使う）はそのまま。費用は、心得帳が変わるたびに案1枚分増える。先読みの流れに触れるので、hitl-reviewer を通す中くらいの変更。

## 12 への答え: 心得帳が変わったら先読みを作り直す（Kento 11/5 夕方、D-066 追記）

- **作ったもの:** 先読みの最中に心得帳が変わったら、同じ枠でもう一度作る（最新の1本だけ、同時に1本、1枠で作り直しは3回まで）。先読みが終わったあとに心得帳が変わったら、次の描画でそれを捨てて、今の心得帳で作り直す。使う条件（○ のときだけ、心得帳が同じときだけ）は D-066 のまま。作り直しも1回のライブの呼び出しとして上限に数え（リクエストのときの訪問者のアドレスで予約）、捨てた分の費用も記録する。
- **hitl-reviewer:** OK。任意の指摘2つを入れた（作り直しの直前に枠が捨てられていたら予約しない／「1枠で3回」は、あとの変化で枠が替わると数え直しになる、と説明に書いた）。テスト4件を足した（作り直した案が ○ で使われる／上限で作り直せないときは古い案を使わない／3回まで・同時に1本／描画は走っている先読みや ○ 済みのものを捨てない）。
- **前後の秒数（同じ測り方 `--cards 3 --read 8 --choose`、本番ビルド・127.0.0.1・ライブ、架空のデータ）:**

  | | 前（16:37） | 後（17:06、17:07） |
  |---|---|---|
  | 直したあとの最初の ○ → 次の案 | 10.1 秒 | **1.3 秒・1.6 秒** |
  | 続く ○ | 0.5 秒 | 0.3 秒・0.5 秒 |
  | △ → 次の案 | 5.3 秒 | 4.7 秒・4.6 秒 |

- **費用:** 1回あたり $0.086（前、この回は読み方を選ぶ手順がなかった）→ $0.101・$0.079（後、選ぶ手順あり）。直し1回につき作り直しが1〜2本（1本 $0.01 前後）増える。公開版の1日の上限（$5）は変えないので、試せる人数がその分（先読み全体で D-066 の見積り 2 割ほどに、さらに数パーセント）減る見込み。

## A. 画面の目（ui-critic 11回目、11/5 17:35。`31-critic10/` → `32-critic10-fixes/`）

- **見つけたこと:** 「凍結してよい」。(1) 最初の画面の「後任が聞くと」で、「写し（Skill）から」「いまの心得帳（MCP）から」が答えの頭に小さく入っていて、二つの答えが一続きに読め、MCP の答えだけが「蔵へ伺って」と言っている違いが伝わらない（暗い表示では一番薄い文字）。(2) 稽古の記録の見出しで「ました。」が3行目に1語だけ。(3) その下の説明の段落が狭く、「取引／先10社」で折れる。(4) スマホの表の行の名前が「割／合」「条件つきで／よし」で折れる。(5) 「途中経過」が見出し・灰色の注・表の題で3回続く。
- **直したこと:** (1) 出どころの札を答えの上に1行で、ほかの行の名前と同じ濃さに。二つの答えの間をあけた。(2) 見出しの幅を広げ、「問になりました。」を折らない。(3) 説明の段落を表と同じ幅に。(4) 「割合」「（条件つきでよし）」を折らない。(5) 灰色の注の頭の「途中経過」を外した（見出しと表の題には残る）。
- **直さなかったこと:** なし（スマホの「ここで区切る」は10回目のとおり見送りのまま）。

## B. 審査員の目（judge-critic 3回目、11/5 18:40）

- **見つけたこと:**
  1. インパクト: 問題の節の「20件中18件が ○」は、続きの「その18件のうち15件はコードの判定では △・×」がないと「AI の案はもう良い」と読める。提出の下書きにはその結果がなく、「人の手でも確かめた形です」は言い過ぎ（経緯を知らない1人を試しただけ）。
  2. デモ／Claude の活用: s05 の静止画では右の列（弟子の読み取り）が空のまま。Opus が直しを読む場面が映らない。11/7 の確認にも入っていない。
  3. Claude の活用: s07b は HTML のカードなので、二つの答えが本物の Claude Code の出力だと分からない。video/README は「Claude Code が書いた」と注にあると書くが、画面にない。
  4. デモ: README（英）の冒頭が用語集で、誰の、どんな課題を、どう解くかが46行目まで出ない。
  5. 深さ: 提出の下書きの hitl-reviewer の件数に、先読みの競合2件（D-066）がない（README にはある）。
  - ほか: s08b の字幕が「確認」のまま、稽古の記録の見出しが古い（どちらも 11/7 の撮り直しの項目にある）。README の英と日で、自分の会社モードの箇条の順番が違う（中身は同じ）。
- **直したこと（記録で裏付けあり）:**
  1. README（英・日）の問題の節で「18件」のすぐ後に「そのうち15件をコードの判定は △ か ×（シミュレータの一人の師匠の正解で、実在のベテランではない）」を足した。提出の下書きは「人の手でも確かめた形です」を、○ 3・△ 8・× 7 の結果と条件、D-059、結果のファイルに置き換えた（`docs/results/master-role-vs-simulator-2026-11-05.json`）。
  2. video/README の 11/7 の確認に一行足した: ライブの s05 で、△ のあとに右の列の読み取りと「心得帳に書きました」が映っていること。間に合わなければ訪問の段取りの代わりに右の列で止まる（体験の目 2 で、読み取りは △ から 6.1 秒）。
  3. s07b の注に「答えの文は、後任役の Claude Code（claude -p、空のディレクトリ、11/3）が実際に書いたもの（抜粋）」を足した（`demo/successor-mcp/answers.json` の recorded と note）。1920×1080 で2行に収まることを確かめた。
  4. README の題の直下に一段落を足した。英は「誰のためのものか、師匠は ○・△・× を付けるだけ、直しが心得帳になり Agent Skill で渡る」。日はホームの「聞いても出てこない作法を、ダメ出しで受け継ぐ。」から始める。どちらも既存の文言だけで、新しい主張はない。
  5. 提出の下書きに「次の案の先読みの競合2件（D-066）」を足した。
- **直さなかったこと:** 「作者が日々身を置いている現場」の一文には触れていない（池田さんが自分で書く、9）。s08b の字幕と稽古の記録の見出しは、11/7 の撮り直しで直る。自分の会社モードの箇条の順番は、中身が同じなのでそのままにした。

## C. 体験の目（3回目、11/5 19:37。スマホの幅で、× から。本番ビルド・127.0.0.1・ライブ）

- **測り方:** `scripts/experience-run.ts --mobile --marks "×,○,○" --cards 3 --read 8 --choose --shots 33-experience-mobile`（390×844、タッチ）。それと、× の1枚だけをもう一度（`--cards 1`）。この回に、台本へ `--marks`・`--mobile`・`--shots` と、読み取りの欄の見出しの位置を記録する一行を足した。結果は `docs/results/experience-2026-11-05T1937.json` と `T1938.json`。費用は ≈ $0.104 ＋ $0.043。
- **秒数（架空のデータ、スマホの幅）:**
  - 「師匠になって試す」→ 最初の案: 4.6 秒（もう一度は 4.3 秒）。
  - × を記録 → 次の案: 4.9 秒（4.4 秒）。
  - × → 読み取りが「どの意味でしたか」と聞くまで: 9.2 秒（12.0 秒）。途中は「解釈の順番待ち」から「どこが違ったか読み取っています」に変わる。△ のとき（6.1 秒）より長い。候補を2つ作って聞くため。
  - 読み方を選ぶ → 心得帳に書くまで: 3.1 秒。わけを残す → 確かめが出るまで: 6.1 秒。
  - 直しのあとの最初の ○ → 次の案: 2.1 秒。次の ○: 1.0 秒。先読みの作り直し（D-066 追記）が効いている。体験の目 2 では 10.1 秒だった。
- **見つけたこと:**
  - スマホでは、弟子の読み取りの欄がカードの上にある。1回目のスクリーンショットでは、聞かれている欄が画面の外に見えた。
  - 確かめ直すと、聞いた 1.5 秒後には見出しが画面の一番上にあった（`ScrollToAction`、headingTop 0）。候補の2つと「どれでもない」も画面に収まっている。1回目は、文字が出た瞬間に撮ったため、なめらかなスクロールの途中だった。
  - ほかに止まる所はなかった。待つ間はどこも、何をしているかが一行で出ている。
- **直したこと:** 製品はなし。測る台本だけ変えた。
- **直さなかったこと:** × の読み取りは △ より 3〜6 秒長い。これは読み取り（学習）の中身なので、触っていない。待つ間の表示は合っている。

## 動画 s02 に師匠役テストの採点を（Kento 11/5 夜、承認済み）

- **入れた場面:** s02（課題の場面）。ナレーション「後任が、悪い知らせを、決まってからメールで送る。」でメールが出る 11.6 秒から終わり（16.6 秒）まで、下に注記を出す。「経緯を知らない後任には、直すべき案が正しく見える」を、この行が言っているため。s03 は 3.9 秒しかなく、読む時間が足りない。
- **注記:** 「作者が初見で ○ を付けた18件のうち、15件は、師匠なら直す案でした。」その下に、小さく「架空のデータ・シミュレータの判定（作者が師匠役をしたテスト、20件。D-059）」。数字は `docs/results/master-role-vs-simulator-2026-11-05.json`（○ 3・△ 8・× 7）。
- **ナレーションは変えなかった。** いまの合計は約 2:56。一文（3〜4秒）足すとほぼ 3:00 になる。それに、s02 の動きはナレーションの文に合わせてあるので、一文足すと全部ずれる。画面の注記だけにした。
- **通し稽古:** `video/shoot.ts --skip-build --only s02-problem`（記録済みのデータ、API なし）。1回目は注記の小さい行が字幕の帯に触れていたので、40px 上げて撮り直した。尺は 16.6 秒のまま。静止画は `docs/screens/video-dryrun/s02-problem-1〜3.jpg`（6.6・12.8・15.6 秒）。

## D. 通しの目（1回目、11/5 20:20。`34-walk/`）

- **たどり方:** 記録済みのデータ（開発サーバー、API なし）で、最初の画面 →「デモの続きから見る」→ 心得帳 → 暖簾を継ぐ（浜風運輸の遅延の質問）→ 稽古の記録の順に、初めての人としてたどった。各画面の文字を書き出して突き合わせた。スクリーンショットは `docs/screens/ui-polish/34-walk/1-home〜5-keiko.png`。
- **見つけたこと:**
  1. **前の画面と違う:** 最初の画面の例では、MCP からの答えが「蔵へ伺って、直接お伝えしてください」。ところが心得帳を開くと、丸新酒造の心得は「奥様に正式に送る際は、蔵元にも事前に一言」の1つだけで、訪問の心得がない。調べると、MCP の答えは写しのあとに師匠（シミュレータ）がさらに6場面を直した心得帳（`demo/successor-mcp/living-store.json`、18の心得）に問い合わせたものだった。K-018「悪い知らせは電話で済ませず、蔵へ顔を出して直接話す。」がそこから来ている。デモの心得帳は写しの時点まで（`copy-store.json` と同じ並び）で、K-018 は載っていない。
  2. 確かめて合っていたところ:
     - 帳場の「変化」（浜風運輸・悪い知らせ、師匠 ×「早めに配車課長へ」）と、心得帳の浜風運輸の心得（同じ判定・同じ一言・わけ）。
     - 最初の画面の丸新の例（△ 一言なし → 心得 → 次の案「根回しが要る案件」）と、心得帳の「この心得が効いた案」。
     - 暖簾を継ぐの答えの言い回しが心得帳と違う点。画面に「評価のときの心得帳の言い回しです」と書いてある。
     - 稽古の記録の数字（55%→64%、0→5.3問、約114回）と、README・動画の s08b。
     - 動画 s07 の質問と、暖簾を継ぐの質問。
- **直したこと:** 最初の画面の例の注記に、二文足した。「『蔵へ伺って』は、写しのあとに師匠がさらに直して加わった心得（悪い知らせは電話で済ませず、蔵へ顔を出して直接話す）から来ています。このデモの心得帳は写しの時点までなので、そこには載っていません。」文言だけの変更（`app/page.tsx`）。スクリーンショットは `34-walk/home-note-desktop.png`・`-mobile.png`。
- **直さなかったこと:** 心得帳の沿革が、どれも1つずつしかない点。暖簾を継ぐの答えは「前は…」と改訂を言っているので、少し食い違って見える。これは 11/7 にデモのデータを録り直すときの項目として、もう入っている（video/README）。データの差し替えは夜の間にはしない。

## A. 画面の目（ui-critic 12回目、11/5 20:50。`35-critic11/` → `36-critic11-fixes/`）

- **見つけたこと:** 判定は「凍結してよい」のまま。直す価値があるのは、最初の画面の丸新酒造の例だけ。
  1. 前の回（通しの目）で足した注記が長すぎて読まれない。PC で6行、スマホで約8行あり、括弧の入れ子もある。肝心の「『蔵へ伺って』は写しのあとに加わった心得から来ている」が後半に埋もれている。
  2. その注記の中で、「蔵へ伺って」が行をまたいで割れる。
  3. MCP の答えの「足りません。」のあとに半角の空きがあり、「蔵」が行末に一字だけ残る。
  - ダークモードのコントラスト、スマホの配置に問題はなかった。
- **直したこと:**
  1. 注記を2つの短い段落に分けた。先に「『蔵へ伺って』は…から。このデモの心得帳は写しの時点までなので、載っていません」。次に出どころ（記録した稽古、後任の Claude Code、Skill と MCP）。
  2. 「蔵へ伺って」は改行しないようにした（`whitespace-nowrap`）。
  3. 表示するとき、答えの「。」「、」のあとの空白を取り除くようにした（`app/dandori.ts`）。記録された答えのファイルはそのまま。
- **直さなかったこと:** なし。

## B. 審査員の目（judge-critic 4回目、11/5 21:20）

- **s02 の注記の数字は正しかった:** 作者が ○ を付けた18件のうち、判定は ○ 3・△ 8・× 7（`docs/results/master-role-vs-simulator-2026-11-05.json`）。
- **見つけたことと、直したこと（記録で裏付けあり）:**
  1. **サブエージェントの表の言い過ぎ。** README（英・日）の表は「`world-keeper` が学習用40場面を作った」と書いている。実際は、world-keeper の定義に沿って指示した general-purpose のサブエージェントだった（how-we-built.md:36–38。11/3 の監査 #14 で一度直したものが戻っていた）。記録どおりに直した。
  2. **提出の下書きの冒頭とリンク。** 概要が課題の箇条から始まり、「誰のためか」が後ろにある。リンクも一つもない。README の冒頭の段落と同じ文を概要の最初に置き、リンクの欄（リポジトリ。公開デモと動画は空欄の印）を足した。
  3. **s02 の注記の小さい行が誤読されやすい。** 「20件」が s08b の「評価用20場面」と同じに見える。「作者」が動画の中で紹介されていない。「直す」が △ と × をまとめている。小さい行を「架空のデータ・学習用の20場面。経緯を知らない作者が師匠役をし、シミュレータの判定では △ 8・× 7（D-059）」にした。s02 だけ撮り直した（静止画 `s02-problem-1〜3.jpg`、尺は 16.6 秒のまま）。
  4. **動画の時刻表が古い。** video/README の表は、s08b が 9.0 秒のままだった。10.4 秒（音声 10.1 秒、`s08b-keiko.marks.json`）に直し、そのあとの2つの場面の開始時刻を 2:38.9・2:46.2 にずらした。
  5. **README の「全体の割合（55%）」が曖昧。** はじめの ○ の 55% と取り違えやすい。「学習の案全体で △・× だった割合（320件中175件、55%）」にした（decisions.md の段位の節）。
- **直さなかったこと:** 下の 13〜15（作品の言い分や、確かめられない引用に関わるため）。

### 池田さんに判断してほしいこと（追加）

13. **動画 s08b の答えの数字。** 動画は「直すだけで、本当に、伝わるのでしょうか」と問い、○ の割合（55% → 64%、README でも「2場面分に満たない」と書いている数字）で答えている。「伝わる」にいちばん直接答えるのは、後任が経緯ごと答えられた質問の数（8問中 0 → 5.3問。画面 s08b-keiko-5 には出ているが、ナレーションでは言っていない）。11/7 にナレーションを作り直すとき、タップ数の句をこの数に置き換えるか。置き換えれば尺は変わらない。
14. **提出の下書き 22 行目の、テーマの例の引用**（「ベテランの仕事のやり方を、本人が現場にいるうちに…」）。リポジトリの中に、この文言の出どころの記録がない。大会のページの文言と合っているか確かめるか、引用の形をやめて言い換えるか。
15. **README の参考文献の arXiv 2件**（2606.04321・2603.24858。README.md:300、README.ja.md:196）。番号と題を確かめた記録が、リポジトリにない。確かめるか、番号を外して要点だけ残すか。

## C. 体験の目（4回目、11/5 21:50。直しから暖簾を継ぐまで。本番ビルド・127.0.0.1・ライブ。`37-experience-noren/`）

- **測り方:**
  - `scripts/experience-run.ts --marks "△,○,○" --cards 3 --read 6 --choose --ask "浜風運輸さんへの遅延の連絡、確定してからまとめて伝えればいいですよね？"`。お試しで直したあと、暖簾を継ぐで自由な質問をライブで尋ねる。台本に `--ask` と `--client` を足した。
  - 直したあとに、カードなしで丸新酒造に1問を尋ねて確かめた。
  - 結果は `docs/results/experience-2026-11-05T2151.json`・`T2152.json`。費用は ≈ $0.112 ＋ $0.012。
- **秒数（架空のデータ、PC の幅）:**
  - 最初の案: 4.6 秒。△ → 次の案: 4.9 秒。
  - △ → 読み取りが聞くまで: 8.9 秒。読み方を選ぶ → 書くまで: 3.1 秒。わけ → 確かめ: 6.1 秒。
  - 直しのあとの ○ → 次の案: 3.9 秒。次の ○: 2.3 秒。
  - **暖簾を継ぐの自由な質問 → 答え: 6.4 秒。** 空の心得帳の丸新酒造には 3.7 秒。
- **見つけたこと:**
  1. **輪がつながった。** 直したばかりの心得（わけ「以前、先方と行き違いがあった」、11/5 に書いたもの）を根拠に、後任の質問へ「いいえ」と答えた。△ から後任の答えまで、一回の体験の中で全部見えた（`noren-live-answer.png`）。
  2. **つまずく点:** 暖簾を継ぐで「尋ねる」を押したあと、6.4 秒のあいだ画面が何も変わらない。ボタンも押せるまま。初めての人は、もう一度押しかねない。
  3. 答えの文に「(2026-11-05、新のみ・旧なし)」「きっかけは未記入」のような、内部の言い回しが混じっていた。下の 16。
- **直したこと:** 暖簾を継ぐの「尋ねる」に、待つ間の表示を付けた（`app/noren/ask-button.tsx`）。押すとボタンが「尋ねています」になって押せなくなる。ライブのときは下に「橙丸が心得帳から根拠の心得と沿革を探して、答えを書いています（数秒）。」と出る。表示だけで、答えの作り方は変えていない。本番ビルドで確かめた（`noren-waiting.png`）。動画の s07 は記録済みの答えで、すぐに返るので映らない。
- **直さなかったこと:** 16（後任の答えのプロンプトに触れるため）。

### 池田さんに判断してほしいこと（追加）

16. **後任の答えに、内部の言い回しが混じる。** ライブの答えに「沿革は『以前、先方と行き違いがあった』(2026-11-05、新のみ・旧なし)」「きっかけは未記入」と出た。沿革の記録の形（旧・新・きっかけ）を、そのまま文にしているように見える。直すなら、暖簾を継ぐのプロンプト（src/successor）に「沿革は、旧がなければ『この日に書かれた』と言い、空の項目には触れない」を足す。プロンプトの変更なので、hitl-reviewer と評価（沿革の質問8問）が要る。夜の間はしない。

## D. 通しの目（2回目、11/5 22:20。README と動画の台本を、画面に照らして）

- **たどり方:** README（日英）の「画面で見る」「動かし方」と、動画の台本（s05 から s09b のナレーションと動き）を、前の回の通しで書き出した画面の文字（`34-walk/`）と突き合わせた。記録済みのデータだけで、サーバーも API も使っていない。
- **見つけたこと:**
  1. **README の1枚目と、公開デモの最初のカードが違う。** README の1枚目は、丸新酒造の △ のあとの「変化」（最初の画面の例と、動画の s05 と同じ場面）。ところが README を読んでから公開デモの「デモの続き」を開くと、最初のカードは浜風運輸の「変化」になっている（D-065 で T26 にしたため）。同じ場面を探して迷う。
  2. 合っていたところ:
     - ボタンの名前（「デモの続きから見る」「師匠になって試す」）が、README と最初の画面で同じ。
     - s05 のナレーション「窓口の奥様にだけ送る案」と、最初の画面の例「蔵元の奥様（窓口）へ…裏で：なし」。
     - s06「いつでも読めて、消せます」と、心得帳の「この心得を消す」。
     - s07 の質問と答え（× とわけ「2019年…」）と、暖簾を継ぐの画面、README の3枚目。
     - s08b の数字（55%→64%、約114回）と、稽古の記録。
- **直したこと:** README（日英）の1枚目の説明に、一文を足した。「最初の画面の例と動画の帳場の場面も、この丸新酒造の場面です。公開デモの『デモの続き』では、最初のカードで浜風運輸の同じような『変化』が見られます。」
- **直さなかったこと:** なし（前の回からの 13〜16 は、池田さんの判断待ち）。

## A. 画面の目（ui-critic 13回目、11/5 22:50。あまり見ていない状態を。`38-critic12/` → `39-critic12-fixes/`）

- **撮ったもの:** API なしの「師匠になって試す」（帳場と空の心得帳）、デモの帳場で × を選んだところ、× を記録した直後。
- **見つけたこと:**
  1. × を記録したのに、右の欄は「ここで弟子が △ の意味を読み取り」と言っていた。しかも浜風運輸の見出しの下に、丸新酒造の心得を例として出していた。押した × から他社の心得ができたように読める。
  2. × のあとのお知らせは「読み取りは行いません」だけで、次に何をすればよいかを言っていない。スマホでは、これが唯一の反応になる。
  3. 記録済みの案で動いているとき、スマホには「記録済みの案を表示しています」が出ない。そのうえ右の欄と空の心得帳は「心得帳に書きます」「ここに残ります」と約束している。この状態では書かれない（解釈しないため）。
  4. 心得が0のとき、心得帳の「心得帳を後任に渡す」がいちばん目立つ。スマホでは、その説明も隠れている。
  5. (a) スマホで「ここで区切る」が一行に一人残る。(b) 選んだ印の赤い二重枠の中に、キーの番号が入って見える。
- **直したこと（表示と文言だけ）:**
  1. 例の文を「公開版のライブでは、ここで弟子がこの ×（記録した印）の意味を読み取り、心得帳に書きます。たとえば記録した稽古では、別の場面（丸新酒造・新しい提案）の △ から、こう書きました。」にした。同じ場面の例なら「この場面から」と言う（`OfflineExample` に記録した印を渡す）。
  2. お知らせを「…に × を記録しました。次の案は下です（このデモでは弟子の読み取りは行いません。公開版のライブでは行います）」にした。
  3. 「記録済みの案を表示しています」をスマホにも出す（状態の行を一行使う）。右の欄の説明と空の心得帳には、ライブでないときだけ「（公開版のライブで…）」を添える。
  4. 心得が0のときは「渡す」を二番手のボタンの見た目にした。説明はスマホにも出し、「いまは台帳の事実だけです。心得が付いてから渡すのがおすすめです。」を添える。書き出しの中身は変えていない。
  5. (a) スマホでは状態の文を一行に、その下に進み具合の棒と「ここで区切る」を並べた。PC の配置は変わらない（`top-desktop-viewport.png` で確かめた）。
- **直さなかったこと:** 5(b)。二重枠は判子に見立てた意図的な見た目で、番号は3つとも同じ位置にある（枠が見えるかどうかの違いだけ）。動画には、ライブで撮る帳場（s05、PC の幅）が映る。ライブの表示は変えていないので、撮り直しは要らない。
