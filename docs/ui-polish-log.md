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
- **15分ごと（Kento 11/6 朝）:** 予約を :07・:22・:37・:52 に。
  - 前の回が終わっていなければ、その回は何もしない（2つの回を重ねない）。
  - 直近2回続けて「直す価値のある指摘なし」だった目は、次の1巡を飛ばす。飛ばしたことはログに書く。
  - C（ライブ）は1時間に1回まで。
  - Claude Code の利用の上限が近いと分かったら、30分ごとに戻し、11/7 の正式計測と撮影のための余力を残す。その判断はログに書く。
- **次の C で確かめること（Kento 11/6 朝）:** 直したあとの最初の ○ → 次の案が、11/6 04:10 の回では 4.5 秒だった（11/5 の先読みの作り直しのあとは 1.3〜2.1 秒）。理由を確かめる。揺れの範囲か。先読みの作り直しが間に合っていないのか。後任のプロンプトの変更や、本番イメージの作り直しで何か変わったのか。`KOKOROE_PREFETCH_DEBUG=1` のログで、先読みが使われたか・捨てられたか、作り直しが何回走ったかを見る。直すべきものがあれば直す。
- **push（Kento 11/6 朝）:** main にマージするたびに、ui-polish と main を origin へ通常の push で上げる（force はしない）。push できなかったときはこのログに書き、次の回でもう一度試す。
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

## 判断待ち 13〜16 への答え（Kento 11/6 朝）と対応

- **13（動画 s08b）:** ○ の率をそのまま主役にする。それに合わせて、問い（s07c）を「直すだけで、本当に、弟子は育つのでしょうか。」に変えた（台本 `video/scenes.json` と `video/scenes/ask.html`、s08-pile の注記）。s07c だけ撮り直した（静止画 `s07c-ask-1〜3.jpg`、尺 3.6 秒のまま）。音声は 11/7 の録り直しで反映する。後任の沿革の答え（8問中 0 → 5.3問）は、s08b の画面（稽古の記録の見出しと表）にもう映っているので、一行は足していない（`s08b-keiko-5.jpg`）。
- **14（提出の下書きのテーマの引用）:** 引用の形をやめて、言い換えにした。
- **15（README の arXiv 2件）:** arxiv.org で確かめた（11/6）。
  - 2606.04321 は *The Digital Apprentice*（Weber・Taneja）。修正を好みのデータにして、技能ごとに任せる範囲を広げる。README の書き方と合っていた。
  - 2603.24858 は *Seedentia*（Wolter ほか、"Context-Mediated Domain Adaptation in Multi-Agent Sensemaking Systems"）。専門家の編集を知識として取り込む論文で、「段階的に任せる」は書かれていない。「CMDA」という略称も使われていない。
  - 2件とも残し、それぞれの中身を正しく一文で書き、確かめた日を添えた（英・日）。
- **16（後任の答えの内部の言葉）:** 直した。D-054 の追記に書いた。
  - プロンプトに一項を足した。普通の言葉で書き、内部の札・ID・記号は出さない。答えの中身は変えない。
  - hitl-reviewer は OK。勧めの2点（きっかけがなければ理由を作らない。確信度の低さは普通の言葉で言い、漏れの数とは分けて数える）も入れた。
  - 測った結果（育った心得帳4冊、架空のデータ）:
    - 内部の言葉が出た答え: 20件中 18.5 → 1.5。
    - 沿革の質問: 5.50 → 5.75。
    - 心得帳にない遠い質問への作り話: 0/24 → 0/24。
    - 値引きを師匠に回す: 2/2。
    - 最後の言い回しは、1冊で確かめた（作り話 0、内部の言葉 18 → 1）。
  - 費用は約 $0.96（上限 $1）。
  - 動画 s07・s07b と README の3枚目は、記録済みの答えを画面で `plainText` に通しているので、内部の言葉は映っていない。s07b は、昨夜足した出どころの一行を入れて撮り直した（`s07b-mcp-3.jpg`）。

## B. 審査員の目（judge-critic 5回目、11/6 04:00）

- **確かめて合っていたもの:** 前の回からの変更は、すべて記録と合っていた。README の冒頭と1枚目の説明、55% の言い方、関連研究、サブエージェントの表、s02 の注記、s07c の問い、s07b の出どころの行、D-054 の追記の数字。
- **見つけたこと・直したこと（記録で裏付けあり）:**
  1. **動画 s07b で、二つの答えがどちらも「足りない」と読める。** 写し（Skill）だけの答えは、最初の一行しか出していなかった。そのため「写しは知らない → 師匠に確認」という肝心の行が切れていた。記録済みの答え（`demo/successor-mcp/answers.json` の「心得帳に記録がないので、師匠に確認してほしいこと」の1つ目）から、左の欄に「心得帳に記録なし → 師匠に確認: 遅れの連絡を電話だけで済ませてよいか、書面やメールも要るか」を足した。s07b だけ撮り直した（記録済みのデータ、API なし、尺 10.5 秒のまま）。静止画は `s07b-mcp-3.jpg`。正午より前の配置の変更。
  2. **提出の下書きの「いま示せること」が、何で測ったかを取り違えている。** 「一致率・沿革・乱用への強さは評価用20場面で」となっていた。「一致率は評価用20場面、沿革は質問8問、乱用への強さは注入・値引きの場面各9回」に直した。
  3. **提出の下書きのサブエージェントの行が、README の直しに追いついていない。** README と同じく「world-keeper の定義に沿った general-purpose」にした。ui-critic と judge-critic の一行も足した。
  4. **提出の下書きのテーマの段落の「人手不足の中で」に、出どころがない。** 動画 s01 と同じ、出どころのある数字（総務省統計局の労働力調査、転職者数 330万人）に置き換えた。
  5. **D-054 の追記の表が、上の表と単位がちがう。** 4冊の合計にそろえた（作り話 0/24、近い質問 6/16 → 5/16、値引き 8/8、内部の言葉 80件中 74 → 6）。沿革の質問 +0.25 はばらつきの内であること、11/4 の同じプロンプトでは引用の誤りが 0 だったことも書いた。
  - あわせて、README.ja の「ココロエ が」の余分な空白を取った。
- **直さなかったこと:** 下の 17。

### 池田さんに判断してほしいこと（追加）

17. **提出の下書きの「テーマ2」の名前。** テーマ1（「あなたにしかない深さを。」）もテーマ2も、題がリポジトリのどこにも記録されていない。大会のページでテーマ2の題を確かめて書くか、テーマ2の一文を消すか。

## C. 体験の目（5回目、11/6 04:10。後任の答えの言い回しを変えたあと。本番ビルド・127.0.0.1・ライブ。`40-experience-plain/`）

- **測り方:** 本番のイメージを作り直してから、`scripts/experience-run.ts --marks "△,○" --cards 2 --read 5 --choose --ask "浜風運輸さんへの遅延の連絡、確定してからまとめて伝えればいいですよね？"` を回した。結果は `docs/results/experience-2026-11-06T0410.json`。費用は ≈ $0.098。
- **秒数（架空のデータ、PC の幅）:**
  - 最初の案: 4.9 秒。△ → 次の案: 4.4 秒。
  - △ → 読み取りが聞くまで: 9.3 秒。読み方を選ぶ → 書くまで: 3.1 秒。わけ → 確かめ: 6.2 秒。
  - 直しのあとの ○ → 次の案: 4.5 秒。
  - 暖簾を継ぐの自由な質問 → 答え: 4.8 秒（前回は 6.4 秒）。
- **見つけたこと:**
  - ライブの答えが普通の言葉になった。「この心得は2026年11月6日に書かれ、きっかけは『以前、先方と行き違いがあった』です。ただしまだ確かさが中程度の心得です。」前回あった「新のみ・旧なし」「未記入」のような言い回しはない（`noren-live-answer.png`）。
  - hitl-reviewer に頼まれた確認もした。根拠の心得の欄は、これまでどおり「わけ」「出どころ」「心得帳に書いた日」を出している。引用元の沿革は、記録の形のまま。
  - つまずく点は、ほかになかった。
- **直したこと:** なし（前の回の変更を、ライブで確かめた回）。
- **直さなかったこと:** なし。

## 17 への答え（Kento 11/6）

- テーマ2の題名は「本来、誰にでも届くべきものを。」（イベントページとキックオフで示されたもの）。提出の下書きの一文に題名を入れ、「ベテランのそばで何年も見て覚える、という壁を取り払う点では、テーマ2『本来、誰にでも届くべきものを。』にも重なります」の形にした。
- テーマ1の題名「あなたにしかない深さを。」は、下書きの「選んだテーマ」の見出しにあることを確かめた。下書きの冒頭の注に、二つの題名の出どころ（イベントページとキックオフ、Kento 11/6 確認）を一行足した。

## D. 通しの目（3回目、11/6 04:25。提出の下書きを、README と画面に照らして）

- **たどり方:** 提出の下書きの概要・「Kokoroe がすること」・「いま示せること」・Claude の使い方の答えを、README（日英）と画面のコードに照らした。記録済みのデータだけで、サーバーも API も使っていない。
- **見つけたこと:**
  - 数字と名前は合っていた。師匠の手間の中央値 53.5 秒、キャッシュで −37%、メモリストアのセッション開始 約2.1 秒・読み書き 0.2〜0.7 秒、MCP の道具4つ、「どれでもない」のときに選べる6つの場所（帳場の `DIFF_AREAS` と同じ）、後任は記録がなければ「師匠に確認を」。
  - 「20件中18件が ○」の箇条で、二つの文が一つにつながっていた（「…構図そのもので、同じ20件を…採点すると…」）。結論とシミュレータの結果の切れ目が分かりにくい。
- **直したこと:** そこを二つの文に分けた（「…構図そのものです。同じ20件を…」）。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 14回目、11/6 04:40。13回目で変えた状態のダークモード。`41-critic13/` → `42-critic13-fixes/`）

- **見つけたこと:**
  1. △ のあとの右の欄の例（丸新酒造の心得）が、左に出ている次の案の「弟子が挙げた心得」と同じ文。いま押した △ からその心得ができ、もう効いている、と読める。
  2. △ のあとのお知らせが、まわりの注記と同じ灰色。赤い △ も小さい。括弧の但し書きに「次の案は下です」が埋もれている。
  3. 空の心得帳で、ライブでないときの但し書きが、大きな明朝の行の中に入っていて、いちばん目立っている。
  4. 進み具合の棒の溝が、ダークモードでほとんど見えない。印を付ける前の ○ が、△・× より暗く見える。
  5. 暖簾を継ぐの例の質問の「尋ねる」が、小さな押す場所に見える。
- **直したこと:**
  1. 例を、細い線で囲った別のまとまりにした。「記録した稽古の例（別の場面）」という見出しを付けた。
  2. お知らせの一文目（「…に △ を記録しました。次の案は下です」）を本文の色にした。△ は大きく太く。但し書き（「このデモでは弟子の読み取りは行いません（公開版のライブでは行います）」）は、2行目に小さく分けた。
  3. 空の心得帳の大きい行は「まだありません。…ここに残ります。」だけにした。但し書き（「公開版のライブで書かれます。記録済みの案を表示しているあいだは書かれません。」）は、下の小さい行に移した。
  4. 進み具合の棒の溝を濃くした（`bg-keisen/60` → `bg-keisen`）。
- **直さなかったこと:**
  - 4 の ○ の暗さ。○・△・× は同じ色（`currentColor`）で描いていて、違って見えるのは線の形のため。
  - 5。例の質問は、行全体が一つのボタン（高さ 44px 以上、`min-h-11`）。「尋ねる」はその中の文字にすぎない。
  - 動画 s05 に映るお知らせは、△ が大きく太くなっただけ（正午より前）。撮り直していない。11/7 のライブ撮影で反映される。

## B. 審査員の目（judge-critic 6回目、11/6 05:05。提出の下書きの Claude の使い方の答えと、README の「どう作ったか」）

- **確かめて合っていたもの:**
  - テーマ2の一文。
  - hitl-reviewer が止めた件数（3・4・1・2）、キャッシュの −37%、メモリストアの秒数、MCP の道具4つ、決定記録 60件以上（66）、学習の道筋による10ポイントの揺れ（D-023）。
  - 数字の枠の表と `data/demo/results.json`。
- **見つけたこと・直したこと（記録で裏付けあり）:**
  1. **「何が可能になったか」の答えが、抽象的で長く、重なりがある。** 冒頭の一文のあとに、記録にある具体例を一文足した。フックが凍結した正解の編集と評価なしのコミットを止めたこと。hitl-reviewer がバグをコミット前に止めたこと。承認済みの公開を、IP の数え方の穴（偽装できる X-Forwarded-For の先頭）が見つかった時点で止め、直して承認を取り直したこと（how-we-built）。重なっている所は削った。Skills の行の後半（`claude -p` の行と同じ）、world-keeper の括弧（README に残る）、二つ目の帳場（「人が決めることは人に」に入れた）、Q3 の「テストとフックで」（Q2 と同じ）。
  2. **因果が逆だった。** 「書き写しの誤りを見つけたのがきっかけ」ではない。記録（how-we-built、decisions）では、数字を生成する仕組みにした直後に、その仕組みが誤り（注入9回と値引き9回を混ぜた 0/18）を見つけている。そのとおりに直した。
  3. **監査を言い過ぎていた。** 「独立した2つの係」だったのは 11/3 だけで、11/5 は1つ。「節目の監査を読み取り専用のサブエージェントに（11/3 は観点の違う2つ、11/5 は1つ）。指摘は本体がコードとデータで確かめてから直した」にした。
  4. **README のフックの行に、AWS のプロファイルのフックがない**（提出の下書きにはある）。README（英・日）のフックの行に足し、記録の欄に `.claude/hooks/` を入れた。サブエージェントの行には、節目の監査を一言足した。
  5. **hitl-reviewer の仕事を狭く書いていた**（「心得帳に書き込む変更」だけ）。定義（`.claude/agents/hitl-reviewer.md`）どおりにした。弟子・学習・後任のコードとプロンプトの変更を、師匠の最終判断・何も送らない・取引先の文面で心得帳が変わらない、の観点で見る。止めた件のうち2つ（訪問の金額の床、先読みの競合）は、心得帳への書き込みではない。
- **直さなかったこと:** なし。フォームの本当の問いがまだ分からないので、最後の詰めは問いを見てから。

## 提出の下書きを、フォームの実際の項目に合わせて作り直した（Kento 11/6 朝。回転の B の1回として）

- **形:** `docs/submission-draft.md` を、フォームの11項目の順と形式に作り直した。チーム名、メンバー、プロジェクト名、テーマ、概要（500字以内）、リポジトリ、動画、使った製品、一番詰まった場面、公式の情報、感想。末尾に、提出の手順と数字の枠の表を置いた。答えは記録で裏付けられることだけ。作者本人の意見・体験が要るところは【Kento が書く】、記録はあるが本人の確認が要るところは【Kento が確認】、選ぶところは【Kento が選ぶ】の印を付けた。
- **概要（5）:** 「このプロジェクトは、〔誰〕の〔課題〕を〔どう変える〕〔形〕です。」の一文から始めた。続けて、使う場面（引退が決まってから数か月、師匠は毎日印を付けるだけ。後任の質問の例）と数字（枠のまま、「架空のデータ」と添える）。今の値を入れると **481字**。`tests/submission-draft.test.ts` が、枠に今の値を入れて 500字以内であること、枠が残っていないこと、一文目の形、「架空のデータ」の添え書きを確かめる。
- **使った製品（8）:** 記録で裏付けられるのは次の4つ。根拠を一行ずつ添えた。
  - Claude Code CLI。
  - Claude API。
  - Managed Agents。メモリストアの試しで、既定はオフ（D-002）。
  - Claude.ai。動画の構成と台本をチャットで作った記録（D-049・D-050）がある。計画と指示の相談に使ったことは【Kento が確認】。
  - IDE 拡張・Desktop・Cowork・Agent SDK は、使った記録がない（`claude -p` は CLI のヘッドレス実行）。
- **一番詰まった場面（9）:** 候補を3つ。それぞれに ①〜⑤ の下書きを付けた。
  - A: 訪問の指示が段取りを動かした（D-061）。
  - B: 学習の道筋で 10ポイント揺れた（D-023〜D-025）。
  - C: 初見の作者に案が合格に見えた（D-059）。
- **公式の情報（10）:** 記録にある事実だけで下書きした（claude-api の Skill、「Using agent memory」、版の履歴の30日の食い違い、Next.js 16 の同梱ドキュメント、Amplify の対応版 → D-032・D-034）。最後に【Kento が確認】。
- **感想（11）:** ① は記録にある具体例から候補だけ（同席者に AI 自身、指示が宛先の判断を逆にした、全社に広げて条件が落ちた、内部の記号が答えに出た、台帳だけから丁寧な案）。② と ③ は空欄で【Kento が書く】。
- **提出の手順:** 11/7 に動画ができたら早めに一度提出し、11/8 20:00 まで直す。最後の確認は 11/8 の 19:00 まで。手順は、動画のアップロード → URL の確認 → フォームの入力 → 送信前の確認項目 → 送信。運営の回答（11/2）で、提出後も 20:00 までは変更できることを確かめてある。
- **外したもの:** 前の版の「Claude 利用に関する質問（想定した問い）」と「いま示せること」の長い本文は、フォームに対応する項目がないので外した。内容は README（日英）と how-we-built にある。

## C. 体験の目（6回目、11/6 05:10。直したあとの最初の ○ が 4.5 秒だった理由。本番ビルド・127.0.0.1・ライブ・先読みのログつき）

- **測り方:**
  - `src/server/prefetch.ts` に、`KOKOROE_PREFETCH_DEBUG=1` のときだけ出る記録を足した。先読みの確保、案づくりの始まりと終わり（心得帳が途中で変わったか、何ミリ秒か）、作り直し、△・×・取り消しで捨てたこと、描画で古いものを捨てたこと、○ の承認。案や心得帳の中身は出さない。
  - 本番のイメージを作り直してから、04:10 と同じ道筋を回した: `--marks "△,○,○" --cards 3 --read 5 --choose`。結果は `docs/results/experience-2026-11-06T0510.json`。費用は ≈ $0.102。
- **秒数:**
  - 最初の案: 4.6 秒。△ → 次の案: 5.2 秒。
  - △ → 読み取りが聞くまで: 8.9 秒。読み方を選ぶ → 書くまで: 3.1 秒。わけ → 確かめ: 9.2 秒。
  - 直しのあとの最初の ○ → 次の案: 4.7 秒。その次の ○: 4.5 秒。
- **見つけたこと（ログから）:**
  - **4.5 秒は、測り方の違いだった。** 11/5 の速かった回（1.3〜2.1 秒）は、1枚を読む時間が **8 秒**（`readSeconds: 8`）。11/6 04:10 と今回は **5 秒**。先読みの案を作るのに 5〜9 秒かかるので、5 秒で ○ を押すと、先読みはまだ作っている途中。○ の承認の時点で `running: true`、受け取りは始まってから 5.3〜5.9 秒後。ページはその先読みの完了を待ってから、それを使った（`got: true, sameBook: true`、捨てていない）。直しと関係のない次の ○ も 4.5 秒だったことも、これと合う。
  - **後任のプロンプトの変更や、イメージの作り直しのせいではない。** 先読みは毎回使われ、待ったのは、作っている最中の1枚の残り時間だけ。
  - **作り直しは設計どおりに動いている。** わけを足したあとの描画で古い先読みを捨てて作り直した（drop stale → claim）。作っている間に確かめが心得帳を変えると、もう一度作り直した（redo 1）。使われた案は、最新の心得帳と同じ版だった。
  - 実際の師匠は、1枚に中央値 53.5 秒かける（D-059）。その間に先読みは間に合う。
- **直したこと:** 測るための記録だけ（上の debug。環境変数がなければ何もしない）。先読みの動きは変えていない（`tests/prefetch.test.ts` 16件が通る）。
- **直さなかったこと:** なし。待つ間の一行（「…次の場面の案を作ります（10秒ほど）」）は、待ち時間（4.5〜4.7 秒）と食い違っていない。

## D. 通しの目（4回目、11/6 05:25。今朝の変更のあとで、画面・README・台本・提出の下書きを照らす）

- **たどり方:** 今朝の変更（s07c の問い、後任の答えを普通の言葉に、提出の下書きの作り直し）が、ほかと食い違っていないかを見た。記録済みのデータだけで、サーバーも API も使っていない。
- **見つけたこと:**
  - 合っていた:
    - s07c の新しい問い（「弟子は育つのでしょうか」）と、続く s08 と s08b（○ の率）。
    - 提出の概要の後任の質問と、暖簾を継ぐの例の質問。
    - 最初の画面の MCP の答えと、README の MCP の例。
    - README の沿革の説明（旧 → 新・きっかけ・日付）。心得帳に残る記録の形の話なので、答えの言い回しの変更とは食い違わない。
  - 食い違い: 提出の下書きの動画の説明文の案が「画面は実際のアプリの録画です」と言っていた。動画で実際のアプリの録画なのは帳場・心得帳・暖簾を継ぐ・稽古の記録だけで、ほかの場面は HTML のアニメーション（`video/scenes.json` の `kind: anim`）。
- **直したこと:** 説明文の案を「帳場・心得帳・暖簾を継ぐ・稽古の記録の画面は実際のアプリの録画で、ほかの場面は HTML のアニメーションです。」にした。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 15回目、11/6 05:40。一度も見ていない状態: 上限に達したとき・404。`44-critic14/` → `45-critic14-fixes/`）

- **撮り方:** 開発サーバーをライブにして、1日の上限を $0 にした（`KOKOROE_DAILY_USD=0`、使い捨てのデータの置き場）。ライブの呼び出しは、すべて API に届く前に上限で断られる。終わったあとの記録は usd 0・calls 0 で、費用はかかっていない。
- **見つけたこと:**
  1. 帳場のどのスクリーンショットにも、開発サーバーの「1 Issue」の赤い印が出ていた。中身は Next.js 16 の開発時の検査。帳場がライブで案を作るときに、上限の数え方（`allowLive` → `reserve` → 日付）が `Date.now()` を読み、それを「前もって描くときの不安定な値」と見ていた。いままでの開発サーバーのスクリーンショットはライブを切っていたので出ず、本番のビルドには出ない。
  2. 上限のあとの案が「記録済み」だと、カードの近くに書かれていない。スマホでは上のお知らせがすぐ流れる。
  3. お知らせが、いつ戻るか、何はそのまま見られるかを言っていない（「明日また試せます」だけ）。
  4. 暖簾を継ぐで、お知らせが見出しにくっついている。自由な質問の欄が、上限のあいだも使えるように見える。
  5. 404 の戻り道が、文の途中の小さなリンク「はじめから」だけ。スマホでは2行に割れる。
- **直したこと:**
  1. `allowLive` の最初で `await connection()` を呼び、上限の数え方が要求のときだけ動くことを Next に伝えた（同梱ドキュメントの `connection` のとおり）。すると次に「`<Suspense>` の外で待っているので、すぐには移れない」という開発時の検査が出た。帳場は、ライブの案を作ってからページを返す設計（待つ間の一行もそれを言う）なので、同梱ドキュメントの instant-navigation のとおり `export const instant = false` で、この区画の検査だけを外した。動き方は変わらない（もともとサーバーで待っている）。開発サーバーのエラーは 0 になり、本番のビルドも通る。
  2. この案が記録済みのとき（ライブでない、または上限で記録に切り替わったとき）は、状態の行に「記録済みの案を表示しています」を出す。
  3. 上限のお知らせを直した。日次は「…ここからは記録済みのデータで動きます。日本時間の0時にまた試せます。心得帳・稽古の記録は、そのまま見られます。」。セッションの上限にも「心得帳・稽古の記録は、そのまま見られます。」を足した。日次の数は日本時間の日付で切り替わる（`jstDay`）。
  4. 暖簾を継ぐのお知らせの下に、余白を入れた。上限のあいだは、質問の欄の下に「上限のあいだは、下の質問に記録済みの答えで返します。」を出す。
  5. 404 の説明を一文にまとめ、その下に独立したリンク「最初の画面に戻る」（高さ 44px）を置いた。
- **直さなかったこと:** 「お試し 0 / 40 件 済み」は、このセッションの進み具合。上限の数とは別のものなので、そのままにした。動画に映る帳場（s05）は配置が変わっていない。正午より前の変更なので、撮り直していない。

## B. 審査員の目（judge-critic 7回目、11/6 06:05。作り直した提出の下書きを項目ごとに）

- **確かめて合っていたもの:**
  - 概要の一文目の形（誰・課題・変化・形）と、使う場面。
  - 一番詰まった場面 A・B・C の ①②③⑤（D-061・D-023〜D-026・D-059）。
  - 使った製品のほかの行。公式の情報（10）。感想 ① のほかの箇条。
  - 動画の説明文（録画とアニメーションの分け方、約 2:55〜2:56、Polly）。
  - 印の置き場所。
- **見つけたこと・直したこと（記録で裏付けあり）:**
  1. **概要の数字の文が、本物の師匠が評価用20場面に114回タップしたように読めた。** タップは学習用40場面で、師匠はシミュレータ（README.ja の稽古の記録の節）。「架空のデータ（取引先10社）で、シミュレータの師匠が学習用40場面に約〔…〕回タップすると、評価用20場面で ○ が付く案が…」にした。字数を空けるため、課題の例を3つから2つに減らした。今の値で **479字**（テストが通る）。
  2. **Managed Agents の「セッション開始 約2.1秒」が、エージェントのセッションを使ったように読めた。** 2.1秒は、帳場のセッションごとにメモリストアを作って心得16件・判定27件を入れる時間（D-002）。エージェント＋環境＋セッションは測っていない（spike のメモ）。提出の下書きと README（日英）を「メモリストアだけ…エージェントのセッションは使っていない…約2.1秒」にそろえた。
  3. **一番詰まった場面の ④（期待していたこと）が、どれも記録にない作者本人の期待だった。** 3つとも【Kento が確認：当時の期待】の印を付けた。B の ③④ に、⑤ の場面の絞り込みに対応するもう一つの取りこぼしを足した。教訓が日程調整の場面だけに絞られ、悪い知らせの場面に届かなかったこと（D-025）。
  4. **感想 ① の「利点」が、18件中15件は △・× だったことを抜いて、18/20 を長所にしていた。** その後半を括弧で足した。
- **直さなかったこと:** 下の 18。

### 池田さんに判断してほしいこと（追加）

18. **ナレーションの台本は全部 Claude で作ったと書いてよいか。** 提出の下書きの動画の説明文と、README（日英）の「Claude で作ったもの」は「ナレーションの台本は Claude で作成」としている。D-049 には「第4部（s04-title）は Kento の短い版を使う」とある。今の s04 の台詞（「でも、案を見せれば、ベテランは『違う』と言えます。ココロエは、その『違う』を集める、AIの弟子です。」）がまだ池田さんの言葉なら、「台本は Claude と作り、一部は作者が短くした」のように直す。のちに Claude が書き直したのなら、そのまま。

## C は飛ばした（11/6 06:10）

直近2回の C（5回目 04:10、6回目 05:10）は、どちらも直す価値のある指摘がなかった。5回目は後任の答えの変更をライブで確かめた回、6回目は 4.5 秒の理由を明らかにした回。決まりに従い、この1巡は C を飛ばして D に進んだ。

## D. 通しの目（5回目、11/6 06:10。README と提出の下書きの「試すときに使うもの」が実在するか）

- **たどり方:** 初めての人が README のとおりに手を動かしたとき、つまずかないかを確かめた。README（英・日）と提出の下書きにあるものを、リポジトリと照らした。サーバーも API も使っていない。
  - `npm run …` のコマンド（7つ）と `package.json`。
  - リンク先のファイル。
  - コードの書式で書いたファイル・ディレクトリの道筋。
  - `KOKOROE_…` の環境変数（5つ）と、コードの中でそれを読む場所。
- **見つけたこと:** 食い違いなし。コマンド・リンク・道筋・環境変数は、すべて実在する。`SKILL.md` だけはリポジトリにないが、書き出しで作られるファイルの名前として書かれているので、正しい。
- **直したこと:** なし。
- **直さなかったこと:** なし。D の「直す価値のある指摘なし」は、これで1回目。

## 18 への答え（Kento 11/6）

- D-049 の記録（「第4部は Kento の短い版を使う」）どおり、「台本は Claude と作り、一部は作者が短くした」に直した。その後に言い回しが直ったかどうかに関係なく、作者の手が入った部分があることは変わらないため。
- 直した場所:
  - README.ja: 「Claude で作ったもの」の動画の台本の行と、Polly の行。
  - README.md: 同じ2か所。
  - 提出の下書き: 動画の説明文の案と、使った製品の Claude.ai の行。

## 凍結と 11/7 の準備（Kento 11/6 朝の依頼。API は使っていない）

- **提出の下書き:** 使った製品の Claude.ai の【Kento が確認】を外した（確認済み、11/6）。
- **凍結の報告の下書き:** `docs/freeze-report.md`。中身は次の3つ。
  - 公開版（Deployment 4、`ab21898`、11/4 08:57）からの差分。D-057〜D-066 と、画面の改良。
  - 公開版の作り直しで入るもの。
  - 残った課題。
- **公開版の費用の上限の案:** 同じファイルの 2。1日の上限と Console の月の上限の組み合わせを3案（A そのまま $5/$30、B $10/$60、C 審査の期間だけ $15）。体験の目で観測した、短い訪問1回の費用（$0.06〜0.11、先読みのあとで約2〜3割増え）から目安を出した。来場者の数は記録がないので、見込み（仮定）として書いた。決めるのは Kento。
- **`docs/final-day.md` の見直し:** この2日の変更に合わせた。
  - 「11/5〜6 の変更で 11/7 に確かめること」の節を足した。訪問の段取りは評価に入らない（`eval:final` が自分で止まる）、「どこが違う？」の設定、先読みは評価を通らない、後任の新しいプロンプトで測る、s07 の質問、s07c の新しい問い、s02 と s07b の注記、終わりの画面の URL。
  - ゴール B の 1 で、s07c の音声も作り直すようにした。5 に、ライブの s05 の3つの確かめ（「変化」が一言を引く、右の欄の読み取り、同席者）を足した。3分までの余裕を、今の 2:56.2 で書き直した。
- **`eval:final` を API を使わずに試した:** `--yes` なしで実行すると、凍結した正解・直した台帳・コミットを確かめ、見積り $9.75（多めに見て $12.23）を出して「Not run」で止まった。訪問の段取りを評価に入れようとすると止まることも、コードで確かめた（`KOKOROE_EVAL_VISIT=on` で throw）。
- **YouTube に限定公開で上げる手順:** `docs/final-day.md` に足した（上げるのは Kento）。
- **README の「作者の現場」の一文:** 触っていない（#9、Kento が書く）。

## A. 画面の目（ui-critic 16回目、11/6 06:25。暖簾を継ぐの答えを原寸で。`46-critic15/` → `47-critic15-fixes/`）

- **見つけたこと:**
  1. 根拠の心得で、前と今の言い回しがほとんど同じで、何が変わったのか（「確定前」→「日程や対応が決まる前」）が見つからない。答えの本文が引く「前の言い回し」と、「前は」の行が少し違う。
  2. スマホでは、弱い方（心得帳なし、約10行）が先に来て、「いいえ」はずっと下。
  3. 審査員には分からない内部の言葉。「評価のときの心得帳」「台帳の事実」「取引先台帳の明示的な制約」、本文の「この規則は」。
  4. 小さい灰色の行（前は・出どころ・書いた日・注記）が小さく薄い。とくにスマホとダークモード。「前は」が「わけ」より薄く、使えない文字に見える。「心得帳に書い／た日」が途中で割れる。
  5. 「心得帳なし（一般論だけ）」なのに、答えは取引先台帳の事実を使っている。
- **直したこと（表示と文言だけ）:**
  1. 根拠の心得の今の言い回しで、前から**足された語だけ**を藍の太字と下線で示す。前の文と1字ずつ比べ（最長共通部分列）、増えた部分だけを印にする。浜風運輸では「日程や対応が決まる」だけが印になる。
  2. スマホでは、心得帳ありの答えを先に出す（PC は左右に並べたまま）。
  3. 言葉を直した。
     - 「記録したときの心得帳の言い回しです。いまの心得帳とは、言い回しが違うことがあります。」
     - 「記録済みの答え（記録したときの心得帳で答えたもの）…心得帳なしの答えも、同じときに、心得帳を渡さずに記録したものです。」
     - 「心得1つ・取引先台帳の決まりごと1つ」
     - 出どころ「取引先台帳」（画面での言い換えだけ。モデルが読む心得帳の書き方 `src/learning/compile.ts` は変えていない）。
  4. 小さい行を 13px にした。「前は」の本文は「わけ」と同じ濃さにした。「出どころ：…」「心得帳に書いた日：…」は途中で割れない。
  5. 「心得帳なし（取引先台帳だけ）」にした。
- **撮り直し:**
  - 動画 s07（暖簾を継ぐ）だけを、記録済みのデータで撮り直した（静止画 `s07-noren-1〜3.jpg`、尺 10.5 秒のまま、正午より前）。
  - README の画像も、同じ手順で作り直した（`docs/readme/*.webp`。3枚目に新しい見出し）。
- **直さなかったこと:** 答えの本文が「この規則は当初『悪い知らせは確定前に…』」と、前の言い回しを少し違えて引いている点。これは記録済みのモデルの答え（評価で記録したもの）なので、書き換えない。今朝からのライブの答えは、普通の言葉で引用する（D-054 の追記）。

## B. 審査員の目（judge-critic 8回目、11/6 06:45。round 7 のあとに変わった所だけ）

- **確かめて合っていたもの:**
  - 3枚目の画像と s07 の静止画の新しい見出し。
  - Managed Agents の言い方、台本を作った人の書き方（D-049）。この2つは、README（日英）と提出の下書きでそろっている。
  - フック・サブエージェントの行。
  - 一番詰まった場面 B の2つ目の取りこぼし。感想 ① の 15件。
  - 凍結の報告の費用の幅と目安の数、$5・$30・40回、`KOKOROE_VISIT` の既定。
- **見つけたこと・直したこと（記録で裏付けあり）:**
  1. **凍結の報告の上限の注記が、取り違えを招く。** 「1日の上限（`KOKOROE_DAILY_USD`）が 0 に戻る」と読めた。0 に戻るのは、その日に使った額の数え（`KOKOROE_DATA_DIR` の中、deploy.md）。上限の値はそのまま。そのとおりに直し、作り直した日はその日の上限をもう一度使えることも書いた。
  2. **○ のあとの待ち時間の書き方。** 二つの測定を一つの条件にまとめていた。読む時間で分けた（10秒以上なら 0.3 秒〔D-066〕、8 秒なら 1.3〜2.1 秒、5 秒なら 4.5 秒ほど）。
  3. **案 B が「deploy.md の予定どおり」と言っていた。** 予定にあるのは1日 $10 だけ。月 $60 はこの報告で足したもの、と分けて書いた。月が $30 のままなら3日で尽きることも書いた。案 A の「6日」は今月まだ使っていない前提なので、その旨と「今月すでに使った額を Console で確かめる」を足した（その額はリポジトリに記録がない）。
  4. **README の3枚目の説明と alt が、作り直した画像の見出しに追いついていない。** 「心得帳なし（取引先台帳だけ）」を英・日の説明と alt に入れた。
  5. **「D-066 の見込みと合う」は、条件の違う比べを確かめのように書いていた。** 「矛盾しないが、読む時間と道筋が違うので同じ条件の比べではない」にした。
  - あわせて、差分の量を `git diff --stat` で数え直した（40 ファイル・約 1,950 行）。
- **直さなかったこと:** なし。今月すでに使った額は、Kento が Console で確かめる。

## C. 体験の目（7回目、11/6 06:55。スマホの幅で、直してから暖簾を継ぐまで。本番ビルド・127.0.0.1・ライブ。`48-experience-mobile-noren/`）

- **測り方:**
  - `--mobile --marks "△,○,○" --cards 3 --read 8 --choose --ask "浜風運輸さんに、トラブルの第一報はメールとチャットのどちらで送ればいいですか？"`（先読みのログつき）。
  - 暖簾を継ぐの答えを待つ判定を直してから、もう一度だけ尋ねた（`--cards 0`）。
  - 結果は `docs/results/experience-2026-11-06T0657.json`・`T0658.json`。費用は ≈ $0.123 ＋ $0.008。
- **秒数（架空のデータ、スマホの幅、読む時間 8 秒）:**
  - 最初の案: 4.1 秒。△ → 次の案: 5.4 秒。
  - △ → 読み取りが聞くまで: 8.9 秒。選ぶ → 書くまで: 3.3 秒。わけ → 確かめ: 6.1 秒。
  - **直しのあとの最初の ○ → 次の案: 0.5 秒。その次の ○: 1.7 秒。** 読む時間を 8 秒にすると速くなる。C 6 回目の見立て（4.5 秒は、読む時間 5 秒のせい）と合う。ログでも、先読みは毎回使われた（`got: true, sameBook: true`）。
  - 暖簾を継ぐの自由な質問 → 答え: 3.1 秒（心得帳が空のとき）。
- **見つけたこと:**
  1. 測る台本の誤り。ライブの自由な質問には「心得帳なし」の列がないので、「根拠・経緯」の行が出ない。台本はそれを待ち続け、時間切れになっていた。「根拠の心得」も完了の合図に足した。答えそのものは出ていた（`noren-live-answer.png`）。
  2. ライブの答えは普通の言葉だった。台帳の決まりには「なぜそうなったかは書かれていません」と、正直に言っている。スマホでも、根拠の心得の小さい行は読める。
  3. 「メールとチャットのどちらで」という、どちらかを選ぶ質問に、答えの見出しが大きく「いいえ」と出る。後任の答えの形が「はい・いいえ・分からない」の3つだけのため。下の 19。
- **直したこと:** 測る台本だけ（`scripts/experience-run.ts` の完了の合図）。
- **直さなかったこと:** 19（後任の答えの形とプロンプトに触れるため）。

### 池田さんに判断してほしいこと（追加）

19. **どちらかを選ぶ質問への「はい・いいえ」。** 後任の答えの形は yes / no / unknown の3つだけ（`src/successor/ask.ts` の `AnswerSchema`）。「メールとチャットのどちらで？」にも「いいえ」と大きく出る（本文は「どちらでもなく、まず電話で」と正しい）。直し方の案:
    - (a) 答えの形に「どちらでもない／選ぶ」を足す。後任のプロンプトと形が変わるので、hitl-reviewer と沿革の質問の評価が要る。
    - (b) 画面だけで、質問が「どちら」を含むときは見出しの語を出さず、本文から始める。
    - (c) そのまま。暖簾を継ぐの例の質問は、どれも「はい・いいえ」で答えられる形。

## D. 通しの目（6回目、11/6 07:10。11/7 の手順の3つの文書を突き合わせた）

- **たどり方:** 11/7 にすることを書いた3つの文書をそろえた。`docs/freeze-report.md` の残った課題、`docs/final-day.md`、`video/README.md` の未済のチェック項目。11/7 の朝にどれを見ても抜けがないかを見た。サーバーも API も使っていない。
- **見つけたこと:**
  1. video/README に、s07c の新しい問いの音声を作り直す項がない（final-day にはある）。
  2. final-day に、s04 の題の出る時刻を確かめる項がない（video/README にはある）。
  3. デモを録り直して、沿革が2つ以上ある心得を出すと、README の2枚目（心得帳）と s06 の静止画も変わる。どの文書にも、作り直す手順がない。
- **直したこと:**
  - video/README に、s07c の項（音声の作り直し、3.6 秒を超えたら秒数を直す）と、デモを録り直したあとの README の画像と s06 の確かめを足した。
  - final-day に、s04 の題の時刻、デモを録り直したあとの画像、撮る前に video/README の未済の項をすべて見るための一行（`grep`）を足した。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 17回目、11/6 07:25。取り消した直後と「ここで区切る」のあと。`49-critic16/` → `50-critic16-fixes/`）

- **見つけたこと:**
  1. 取り消したあと、何も「取り消した」と言わない。同じカードが出るだけで、取り消しが効いたのか、読み込み直しただけなのか分からない。
  2. 区切ったあとも、前の ○ のお知らせ（「○ を記録しました … 取り消す」）が残る。そのうえ、○ だけなのに「それまでに育った心得帳は」と言う。
  3. 次にすることが分かりにくい。「続きから」はどこからか言わず、稽古の記録への道がない。
  4. スマホでは、区切ったあとも5行の案内が上に残り、「ここで区切りました」が画面の下のほうになる。
  5. まだ1件も見ていない（0 / 20）のに、「ここで区切る」が出る。ほかに、文字のリンクの押す場所の小ささと、細い ○ の字の形。
- **直したこと（表示だけ）:**
  1. 取り消したカードに「浜風運輸・打ち合わせの日程調整の △ を取り消しました。この案を、もう一度判定できます。」を出す。取り消しが通ったときだけ、セッションの表示用の記録（`meta.undone`）に残す（`app/actions.ts` の取り消しの動作。学習と取り消しの中身 `src/server/undo.ts` は変えていない）。
  2. 区切ったあとは、前の印のお知らせを出さない。この回の △・× がなければ「この回の印は ○ だけなので、心得帳は変わっていません。いまの心得帳は、…」と言う。
  3. ボタンを「3 件目から続ける」（見た件数＋1）にし、「稽古の数字は稽古の記録に」のリンクを足した。
  4. 区切ったあとは、デモの案内を隠す。
  5. 「ここで区切る」は、1件以上見てから出す。
- **直さなかったこと:**
  - 文字のリンクの押す場所。「取り消す」と「ここで区切る」は、もう高さ 44px のボタン（`min-h-11`）。
  - ○ の字の形（明朝の ○ を太字にしてある）。
  - 「前回、この取引先の案は師匠が直しています」。デモのカードでは、記録した稽古のことで正しい。
  - 動画には、取り消しも区切りも映らない。

## B. 審査員の目（9回目、11/6 07:40。judge-critic は呼ばずに、変わった画面と文書の突き合わせだけ）

- **やり方:** round 8 のあと、README（日英）と提出の下書きは変わっていない。変わったのは、取り消しの確認、区切ったあとの画面、暖簾を継ぐの見出しだけ。同じ文書を judge-critic にもう一度読ませても実りが少ないので、変わった画面を README と提出の下書きがどう書いているかだけを見た（`grep`）。
- **見つけたこと:** 食い違いなし。
  - README と提出の下書きは、取り消しや区切りの画面を説明していない。
  - 後任の比べの基準は、稽古の記録の表で「はじめ（台帳だけ）」と書いてあり、暖簾を継ぐの新しい見出し「心得帳なし（取引先台帳だけ）」と合う。
  - 上限のお知らせの引用（「本日のお試し上限に達しました…」）も、新しい文言の書き出しと合う。
- **直したこと:** なし。
- **直さなかったこと:** なし。B の「直す価値のある指摘なし」は、これで1回目。

## C は飛ばした（11/6 07:54。前の C 06:55 から1時間たっていない）

## D. 通しの目（7回目、11/6 07:55。最初の画面の「データの扱い」が、コードと合っているか）

- **たどり方:** 初めての人が最初に読む約束（入れるもの・送る先・保存するもの）を、コードと照らした。サーバーも API も使っていない。
- **見つけたこと:** 食い違いなし。
  - 「最初からやり直すと前のセッションは消え、24時間たったものも新しいセッションを始めるときに消します」は、`src/server/session.ts` の `sweep()` と同じ。新しいセッションを始めるとき、前のセッションと 24 時間より古いものを消す。
  - 「会話の本文をログには残しません」も合っていた。サーバーの記録（`console.error`）が出すのは、場面の番号・エラーの文・先読みの記録（環境変数のときだけ、中身なし）だけ。案・質問・答えの文は出さない。
  - 送る先の文は、ライブかどうかで正しく切り替わる。
- **直したこと:** なし。
- **直さなかったこと:** なし。D の「直す価値のある指摘なし」は、5回目に続いて2回目だが、間の6回目は直したので、続けて2回ではない。

## A. 画面の目（ui-critic 18回目、11/6 08:10。出典の一覧・心得を消す・稽古の記録の表。`51-critic17/` → `52-critic17-fixes/`）

- **見つけたこと:**
  1. 「消す」を押しても、何も言わない。心得が消えるだけで、何を消したか、どこに残ったか、戻せるかが分からない。確かめの文は「沿革に残ります」だが、ページに「沿革」という見出しはない。
  2. 出典の一覧を開いても、すぐ上の印の行と同じことが出るだけで、それが何なのか書いていない。
  3. スマホで、稽古の記録の表が単語の途中で割れる（「タッ／プ」「48%／±3」）。
  4. 図の「はじめ 55%」と、表のタップ0の行（48%）が食い違って見える。
  5. 表の ±（±0 も）と「沿革の質問」の意味が書かれていない。
- **直したこと（表示と文言だけ）:**
  1. 消したあとは、心得帳の上に「『…』を消しました。記録は、いちばん下の『消した・まとめた・取り消した項目』に、沿革と一緒に残っています。」を出す。リンクで下に飛ぶと、その項目は開いている。確かめの文も同じ名前で言う。
     - 仕組み: 消す動作のあとで `?gone=<心得の番号>` のページに移る。心得帳への書き込み（`retireRule` が書く内容）は変えていない。
     - このページも、帳場と同じく同梱ドキュメントのとおり `instant = false` にした。URL を読むことへの開発時の検査で、ページは訪問者ごとに作るので、動き方は変わらない。開発サーバーのエラーは 0。
  2. 出典の一覧の頭に「この心得のもとになった、師匠の印と一言（どの場面の、いつのものか）。」を足した。
  3. 表を一行のまま横にずらせるようにした（`whitespace-nowrap`、`overflow-x-auto`）。
  4・5. 表の下に一行の説明を足した。± は同じ心得帳で3回測ったばらつき（±0 は3回とも同じ）。沿革の質問は8問のうち、なぜまで答えられた数。タップ0の行は、その版の学習の始め。図の「はじめ 55%」は、直した台帳で測り直した値。
- **撮り直し:** 動画の s06 は、出典の一覧を開いて映すので、本番イメージを作り直して s06 だけを撮り直した（記録済みのデータ、尺 8 秒のまま、正午より前）。静止画は `s06-kokoroe-1〜5.jpg`。
- **直さなかったこと:**
  - 消すのをやめるボタン。もう一度「この心得を消す」を押せば閉じる。
  - スマホでの「この心得を消す」の位置（右寄せの細部）。

## B. 審査員の目（judge-critic 10回目、11/6 08:45。動画だけ）

- **確かめて合っていたもの:** 動画だけを見た人にも、6つの流れが伝わる。誰の何の課題か（s00・s02）、1タップの直し（s05）、見える変化（s05 の T13）、理由つきの受け渡し（s07）、裏付け（s08b）。名前・役・架空の表示・s02 の数字・s07b の出どころ・終わりの画面も、静止画のあいだでそろっていた。
- **見つけたこと・直したこと（記録済みのデータで撮り直し、正午より前）:**
  1. **s06 の最後のコマが、直前の s05 と食い違う。** s06 は最後に下へずらして、丸新酒造の心得（「（一言なし）」、わけなし）で終わっていた。視聴者は数秒前に、師匠が「裏で蔵元に一言」と打つのを見ている。撮影の場面は毎回新しいデモのセッションなので、11/7 のライブでも直らない。最後のずらしをやめ、わけのある心得（浜風運輸、「2019年、直前に伝えたら…」）のまま止めるようにした（`video/record.ts`）。このわけは、続く s07 が引くものと同じ。
  2. **s06 と s07 で、浜風運輸の心得の言い回しが違う（約15秒の間に）。** s07 の画面の注記は 13px で、動画では読めない。s07 の隅の札（自作の画面であることを言う札）に「記録した答えなので、心得の言い回しは前の画面と違います」を足した。11/7 にデモを録り直すときの確かめも、video/README に足した。
  3. **正式の版では、114回のタップが本物の人のように聞こえる。** シミュレータだと大きく書いてあるのは「途中経過」の帯だけで、正式の版ではそれが消える。s08b の上の帯を、正式の版でも出すようにした（「架空の取引先10社・評価用20場面。師匠はシミュレータ（隠しの正解に照らして、コードで判定）。」）。途中経過の帯にも「師匠はシミュレータ（コードで判定）」を入れた。final-day のゴール B の確かめも、この文に合わせた。
  4. **s01 で「異動も、当たり前に」が「330万人」のすぐ上にあり、異動も数に入っているように読めた。** 出典は転職者数だけ。その行を出典の下に離して、「（このほか、異動も当たり前に）」にした（`video/scenes/s01-why.html`）。
- **撮り直した場面:** s01・s06・s07・s08b（尺は 17・8・10.5・10.4 秒のまま）。静止画は `s01-why-2・3`、`s06-kokoroe-3・5`、`s07-noren-2・3`、`s08b-keiko-3・5`。
- **直さなかったこと:** なし（池田さんの判断が要るものはなかった）。

## C. 体験の目（8回目、11/6 08:40。「どれでもない」と「どこが違う？」の道を、初めてライブで。本番ビルド・127.0.0.1。`53-experience-none/`）

- **測り方:**
  - 台本に `--no-remark`（一言なしで △・× を付ける）と `--none-area <場所>`（1巡目の読み方で「どれでもない」と「どこが違う？」を1タップ）を足した。
  - 「どこが違う？」は一言がないときだけ出る（D-057）。1回目は一言を入れていたので、この道に入らなかった。2回目で測れた。
  - `--marks "×,○" --cards 2 --read 6 --choose --no-remark --none-area timing`。結果は `docs/results/experience-2026-11-06T0840.json`（入らなかった回）と `T0842.json`。費用は ≈ $0.089 ＋ $0.088。
- **秒数（架空のデータ、PC の幅）:**
  - 最初の案: 4.9 秒。× → 次の案: 4.6 秒。
  - × → 1巡目の読み方: 8.9 秒。
  - **「どれでもない」＋「いつ」→ 2巡目の読み方: 9.1 秒。**
  - 選ぶ → 書くまで: 3.3 秒。わけ → 確かめ: 6.1 秒。○ → 次の案: 3.2 秒。
- **見つけたこと:** 「どれでもない」を押した直後の約3秒、状態の行が「選んだ読み方を心得帳に書いています」と言っていた。師匠はどれも選んでいないし、何も書いていない。そのあとは「どこが違ったか読み取っています」に変わる（これは正しい）。中の状態は、読み方を選んだときと同じ "choosing" で、選んだ番号が空（`pick: null`）なのが違い。
- **直したこと（表示だけ）:** 「どれでもない」のあと（`choosing` で `pick === null`）は「ほかの読み方を考えています」と出す（`app/choba/page.tsx` の `statusOf`）。中の状態と処理は変えていない。
- **直さなかったこと:** なし。直した文言をライブでもう一度測ることはしていない（費用を抑えるため。表示の条件は、`choose` の動作が「どれでもない」のとき `index` を `null` にすることを、コードで確かめた）。

## D. 通しの目（8回目、11/6 08:55。凍結の報告の差分の一覧が、今朝の変更に追いついているか）

- **たどり方:** `docs/freeze-report.md` の「11/3〜4 の公開版からの差分」を、報告を書いたあと（06:40 以降）の `app/`・`src/` のコミットと照らした。サーバーも API も使っていない。
- **見つけたこと:** 一覧から次の変更が抜けていた。
  - 取り消しの確認（A 17）。
  - 「ここで区切る」のあとの画面（A 17）。
  - 「どれでもない」の直後の文言（C 8）。
  - 心得を消したあとの知らせと、出典の一覧の一行（A 18）。
  - 稽古の記録の表（A 18）。
  - 暖簾を継ぐの答えの見せ方（A 16）。
  - 帳場と心得帳の `instant = false`。
  - 差分の量（40 ファイル・約 1,950 行）も古かった。
- **直したこと:** 抜けていたものを一覧に足し、量を数え直した（40 ファイル・約 2,000 行の追加、08:55）。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 19回目、11/6 09:10。ライブでしか出ない、読み取り・「どこが違う？」・確かめ。C 8 のスクリーンショット `53-experience-none/` を使った）

- **見つけたこと:**
  1. 右の欄が「浜風運輸・トラブルの初動 どの意味でしたか」と聞くとき、左はもう次の案（ネクストリンク）なので、どの案のことか見えない。
  2. 「どこが違う？」の説明が小さな灰色で、ボタンが答えの候補の続きに見える。「どれでもない（場所は選ばない）」が分かりにくい。ボタン（書式・その他）と案の行（後日）が一致しない。
  3. 確かめのカードの ○△× に、問いも名前もない。「師匠の確認 —」が入力欄に見える。一言の欄の文言が、主の判定の欄と違う。
  4. 2巡目の読み方に、選んだ場所（いつ）と違うもの（何で）が混じる。淡い藍の行が「選んだ」なのか分からない。
  5. 状態の行の「確かめ：…解き直しました」、取り消すの「沿革に残します」が内部の言葉。
- **直したこと（表示と文言だけ。読み取り・学習の中身は変えていない）:**
  1. 読み方の上に「印を付けた案：誰に…・何で…・いつ…」の一行（`beforeOf` の案から）。
  2. 「どこが違う？」に、見える問いを付けた: 「どれも違うとき、どこが違いますか（押すと、そこを手がかりに読み直します。押さなくても進めます）」。「どれでもない（場所は言わない）」に。
  3. 確かめのカードの頭に「新しい心得で解き直した案です。これでよいですか（押さなくても次の案へ進めます）」。○△× の下に「よい・条件つき・ちがう」。空で変わっていない行（「—」）は出さない。一言の欄は主の判定と同じ「一言（なくても送れます）」。
  5. 状態の行を「新しい心得で、直した場面を解き直しました（右の欄）」に。取り消すを「（心得帳に書いた分も戻し、記録は残します）」に。
- **直さなかったこと:**
  - 2 のボタンの名前（書式・その他）。学習の「違う場所」の分類（`src/learning/area.ts`）と対になっていて、変えると学習に触れる。
  - 4 の2巡目の読み方の中身。学習（読み取り）の出力なので触らない。淡い藍は、撮ったときのマウスの位置（hover）の見た目の可能性が高い。
  - 動画の s05 は、11/7 にライブで撮るときに、この表示で映る（正午より前の、小さな変更）。
- **ライブでの見た目の確かめ:** この状態はライブでしか出ない。次の C（09:40 以降）で見る。

## B. 審査員の目（11回目、11/6 09:25。judge-critic は呼ばずに、今朝変えた画面の文言が文書に残っていないか）

- **やり方:** 今朝変えた画面の言い回し（「確かめ：」「沿革に残します」「場所は選ばない」「選んだ読み方を心得帳に」「一般論だけ」「台帳の事実」「評価のときの心得帳」「続きから」「明日また試せます」）を、README（日英）・提出の下書き・how-we-built・動画の台本と README で探した。
- **見つけたこと:** 食い違いなし。README.ja の3枚目の説明「この答えは評価のときの心得帳で記録したもので…」は、画面の新しい言い回し（「記録したときの心得帳」）と違う。ただ README は評価そのものを説明している文書なので、正確で通じる。
- **直したこと:** なし。
- **直さなかったこと:** 上の README の言い回し（そのままで正確なため）。B の「直す価値のある指摘なし」は1回目（前の B 10 は直した）。

## C. 体験の目（9回目、11/6 09:40。A 19 で変えた読み取り・確かめの見た目をライブで。本番ビルド・127.0.0.1。`54-experience-readings/`）

- **始めた時刻について:** 本番イメージの作り直しが 09:39:32 に終わり、すぐに走らせた。前の C（08:40）から1時間に1分ほど足りなかった。決まり（1時間に1回まで）を、ほんの少し破っている。次の C は 10:40 以降にする。
- **測り方:** C 8 と同じ道。`--marks "×,○" --cards 2 --read 6 --choose --no-remark --none-area timing`。結果は `docs/results/experience-2026-11-06T0942.json`。費用は ≈ $0.103。
- **秒数:**
  - 最初の案: 4.7 秒。× → 次の案: 5.5 秒。× → 1巡目の読み方: 9.0 秒。
  - 「どれでもない」＋「いつ」→ 2巡目: 6.2 秒。選ぶ → 書くまで: 3.1 秒。
  - 直しのあとの ○ → 次の案: 0.3 秒。
  - わけ → 確かめは、台本が時間切れ（下の 3）。
- **見つけたこと:**
  1. A 19 の変更は、ライブでも出ていた。読み方の上の「印を付けた案：誰に 配車課長（窓口）・何で 電話する・いつ すぐ」、「どこが違う？」の見える問い、確かめのカードの問い・よい／条件つき／ちがう・一言の欄の文言。
  2. 確かめのカードに、前の案との違いが出ていない。何で が「電話する」→「メールを送る」に変わったのに、取り消し線の前の値がない。確かめの段では、カードに前の案を渡していなかった（回帰の確認の段だけ渡していた）。
  3. 右の欄の中で、状態の行が「…解き直しました（右の欄）」と言う。左のお知らせと同じ文を使っていたため。
  - 測る台本の誤り。確かめを待つ合図が古い文言「確かめ：」だったので、時間切れになった。
- **直したこと（表示だけ）:**
  - 確かめのカードに、印を付けた案を前の案として渡した（`before={beforeOf(p.judgmentId)}`）。変わった行だけが取り消し線つきで出る（誰に・何では常に出る）。
  - 右の欄の中では「（右の欄）」を外した。
  - 台本の合図に「解き直しました」を足した。
- **直さなかったこと:** なし。

## D. 通しの目（9回目、11/6 09:55。凍結の報告を、09時台の変更に追いつかせる）

- **たどり方:** D 8 のあと（08:55 以降）の `app/` の変更（C 8・A 19・C 9）を、`docs/freeze-report.md` の差分の一覧と照らした。サーバーも API も使っていない。
- **見つけたこと:** 一覧に次の3つがなかった。
  - 弟子の読み取りの「印を付けた案」と、「どこが違う？」の問い。
  - 確かめのカードの問い・印の名前・変わった行の取り消し線。
  - 状態の言い回し。
- **直したこと:** 一覧に足し、差分の量を数え直した。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 20回目、11/6 10:10。A 18 で変えた所のダークモード。`55-critic18/` → `56-critic18-fixes/`）

- **見つけたこと:** 新しい知らせ・出典の一行・表の説明は、ダークモードでも読める。問題は、リンクの行き先と、スマホの表だった。
  1. 消した心得が、生きている心得と同じ見た目（白い明朝の見出し、朱の ×）で、消したものだと分からない。
  2. 消した記録の行が「2026-11-06 師匠が心得帳で直接」で途切れている。続く「前は：」が、見出しと同じ文の繰り返し。
  3. リンクの行き先「消した・まとめた・取り消した項目」が、ページでいちばん弱い見出し（小さな灰色）。
  4. スマホの表が、切れて見えるだけで、横にずらせると分からない。
  5. スマホのグラフの横軸の題が、左で切れる。
- **直したこと（表示だけ）:**
  1. 外した項目は、頭に「消した／まとめた／取り消した」の札。見出しは灰色の取り消し線、印は朱でなく灰色。
  2. 心得帳で消した記録は「師匠が心得帳で消した」と言う。「前は」が見出しと同じなら出さない。
  3. その節を「台帳から写した事実」と同じ見出し（太い線・明朝）にし、「心得帳から外したものも、沿革と一緒にここに残ります。」を添えた。
  4. スマホでは、表の上に「表は横にずらせます。」。
- **直さなかったこと:** 5（グラフは、今の構成の結果を見せるために右端から開く。題を外に出すのはグラフの組み立ての変更になる）。版の名前をスマホで別の行にする案も、表の組み立ての変更なのでしていない。動画には、消したあとの画面も表も映らない。

## B. 審査員の目（12回目、11/6 10:25。judge-critic は呼ばずに、消すことと沿革の書き方）

- **やり方:** A 18・A 20 で変えた、心得を消したあとの見せ方と、README（日英）・提出の下書きの「消せる」「消した記録も沿革に残る」を照らした。
- **見つけたこと:** 食い違いなし。README.ja の「消した記録も沿革に残ります」と、画面の「心得帳から外したものも、沿革と一緒にここに残ります」は合う。英語版の "The master can read and delete every entry." も合う。
- **直したこと:** なし。
- **直さなかったこと:** なし。**B の「直す価値のある指摘なし」が2回続いた（11回目・12回目）ので、次の1巡は B を飛ばす。**

## C は飛ばした（11/6 10:39。前の C は 09:39:32 に始めたので、まだ1時間たっていない）

## D. 通しの目（10回目、11/6 10:40。how-we-built が今日の作業に追いついているか）

- **見つけたこと:** `docs/how-we-built.md` に 11/6 の節がなかった。CLAUDE.md は、作業のたびに短く記録すると決めている。今日の作業は ui-polish-log にはあるが、how-we-built には後任のプロンプトの一項しかなかった。
- **直したこと:** 「2026-11-06」の節を足した（記録の要点だけ）。
  - 15分ごとの4つの目と、空回りを止める決まり。
  - 4.5 秒の疑問を、ログで確かめたこと。
  - 提出の下書きを本物のフォームに合わせたこと（字数のテスト、arXiv の確かめ）。
  - 見ていなかった状態の講評で見つかった、開発時のエラーと、その直し方。
  - 動画を一つの作品として読ませて、食い違いを直したこと。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 21回目、11/6 10:55。タブレットの幅 820×1180。これまでは 390 か 1280 だけ。`57-critic19-tablet/` → `58-critic19-tablet-fixes/`）

- **見つけたこと:**
  1. 帳場はこの幅で1列になり、○△× が画面の下の端より下にある。弟子の読み取りは、印のさらに下になる。開発サーバーの「1 Issue」の印も写っていた。
  2. 最初の画面の見出しが「…作法／を、／ダメ出しで…」と、「を、」だけで1行になる。
  3. 最初の画面の2列が、この幅では狭すぎる。右の例が7〜10字ずつで折れる。
  4. 稽古の記録で、安全の確かめの数が、上の表の列とそろっていない。見出しの文が「64%／に、」で割れる。
  5. 心得帳の見出しが、少し残して早めに折れる。
- **直したこと（表示だけ）:**
  2. 見出しを語のまとまりごとに折る（「聞いても出てこない」「作法を、」）。
  3. 最初の画面の2列は、1024px（lg）からにした。タブレットでは、例が説明の下に全幅で来る。
  4. 安全の確かめの表を上の表と同じ幅（`max-w-4xl`）にし、数の列を同じ 24% にした。数は「40場面のあと」の列にそろう。「64%に、」は割れない。
  5. 心得帳の見出しに `text-wrap: pretty`。
  - 動画の s08b は稽古の記録を映すので、本番イメージを作り直して s08b だけを撮り直した（正午より前。安全の確かめの数の位置が少し動いた）。静止画は `s08b-keiko-3・5.jpg`。
- **直さなかったこと:**
  - 1 の帳場の1列。タブレットで2列にするのは、帳場の組み立ての大きな変更になる。帳場は動画に映る画面でもある。印を付ける場所は、スマホと同じで、下へ進めば届く。
  - 「1 Issue」の印。もう一度開発サーバーで帳場を開き、ブラウザのエラーと警告を集めたが、何も出なかった（サーバーの記録にもエラーなし）。本番のビルドには、この印は出ない。

## B は飛ばした（11/6 11:07。直近2回の B〔11回目・12回目〕が、どちらも直す価値のある指摘なし）

## C. 体験の目（10回目、11/6 11:10。C 9 で直した確かめのカードを、ライブで見る。`59-experience-check-card/`）

- **測り方:** C 9 と同じ道（`--marks "×,○" --cards 2 --read 6 --choose --no-remark --none-area timing`）。本番イメージは 10:57 のもの。結果は `docs/results/experience-2026-11-06T1110.json`。費用は ≈ $0.108。
- **秒数:**
  - 最初の案: 4.5 秒。× → 次の案: 4.7 秒。× → 1巡目の読み方: 9.2 秒。
  - 「どれでもない」＋「いつ」→ 2巡目: 9.3 秒。選ぶ → 書くまで: 3.1 秒。
  - わけ → 確かめ: 6.2 秒（台本の合図を直したので測れた）。
  - ○ → 次の案: 4.5 秒（読む時間 6 秒）。
- **見つけたこと:**
  - 確かめのカードに、印を付けた案からの違いが出るようになった。何で「~~電話する~~ メールを送る」、いつ「~~すぐ~~ 頭出しだけ先に、本題は後で」。
  - 右の欄の中の「（右の欄）」も消えていた。
  - カードの名前の列（7.5em）が細い欄には広すぎ、値が2〜3行に折れていた。
- **直したこと:** 確かめのカードの名前の列を 5.5em にした。「師匠の確認」までは1行、「先に確かめる話題」だけ2行になる。
- **直さなかったこと:** なし。この幅の変更は、ライブでまだ見ていない（次の C で見る）。

## D. 通しの目（11回目、11/6 11:25。待ち時間の言い方と、今朝の実測）

- **たどり方:** 画面と文書が言う待ち時間を、今朝の体験の目の実測と照らした。README（日英）・提出の下書き・D-066・帳場の待つ間の一行を見た。
- **見つけたこと:** 食い違いなし。
  - README と提出の下書きは、待ち時間の秒数を言っていない。
  - D-066 の「読む時間10秒以上なら 0.3 秒」と、今朝の実測は矛盾しない。読む時間 6〜8 秒で 0.3〜1.7 秒、5〜6 秒で 4.5 秒ほど。
  - 帳場の「（10秒ほど）」は、先読みが間に合わないときの待ち（案づくり 5〜9 秒）の上限として外れていない。
- **直したこと:** なし。
- **直さなかったこと:** なし（D の「直す価値のある指摘なし」は1回目。前の D 10 は直した）。

## 9 への答え（Kento 11/6）: 作者が日々身を置いている現場の一文

- Kento 本人の言葉を、README.ja の「課題」の節の最初の段落として、言い回しを変えずに置いた。リンクの印を外すと、渡された文と1字も違わないことを確かめた。
- 「後継者の不在」の語に、README が使っている帝国データバンクの調査へのリンクを付けた（語は変えていない）。段落の下に一行、数字の出どころを添えた。年330万人は、動画 s01 と同じ書き方（総務省統計局「労働力調査（詳細集計）2025年平均結果」の転職者数）にした。この調査の URL はリポジトリに記録がないので、リンクは付けていない。
- 前の仮の一文（「この現場は、作者が日々身を置いているもの…（docs/evolution.md の背景）」）は、この段落と重なるので消した。英語版の同じ一文も消した。
- 英語版 README には、意味を変えずに訳を置いた。「ひいては…起こりうる」は "it could happen" と、断定しない言い方のまま。
- 提出の下書きの概要は変えていない（481字のまま）。

## A. 画面の目（ui-critic 22回目、11/6 11:40。小さなノート PC の幅 1024×768。2列に切り替わるいちばん狭い幅。`60-critic20-1024/` → `61-critic20-1024-fixes/`）

- **見つけたこと:** 1280 と比べて壊れている所はない。2列も、帳場の右の欄（約280px）も読める。問題は改行の位置と、折り目の下の一つ。
  1. 最初の画面の文で「ココ／ロエ」、一の行で「段／取り」と、語の途中で折れる。
  2. 帳場の最初の画面で、○△× が折り目の下にある（1280×800 でもほぼ同じ）。
  3. 稽古の記録の見出しが「…64%に、後任／が経緯…」と、名詞と助詞のあいだで折れる。
  4. 心得帳の左の欄で「台帳から写／した事実」「書き出しま／す。」と、かなが一つ残る。
  5. 最初の画面の右の例の文で、語の途中の折れが残る。
- **直したこと（改行だけ）:**
  1. 「ココロエ」「段取り」を、文字のあいだに語結合子（U+2060）を入れて折れないようにした。最初の画面全体に `word-break: auto-phrase` も付けた。ただし Playwright のヘッドレス Chromium では効いておらず、効くかどうかはブラウザによる。そのため、肝心の語は語結合子で守った。
  3. 「後任が」を一続きにした。見出しは「…64%に、／後任が経緯ごと…」で折れる。動画の s08b に映るので、本番イメージを作り直して s08b だけを撮り直した（11:43、正午より前）。
  4. 「台帳から写した事実」を一続きにし、「書き出します」に語結合子を入れた。心得帳の左の欄にも `auto-phrase` を付けた。
- **直さなかったこと:**
  - 2 の帳場の詰め直し。動画に映る画面の配置の変更で、正午の直前だった。
  - 5 は `auto-phrase` に任せた（効くブラウザでは直る）。
  - 「師匠になって試す」の説明が折り目で切れる点と、「ここで区切る」が出たときに進み具合の棒が縮む点（小さな見た目）。

## B. 審査員の目（judge-critic 13回目、11/6 12:00。池田さんの段落が入った「課題」の節だけ）

- **確かめて合っていたもの:**
  - 二つの数の出どころが、README・動画・決定記録でそろっている。
  - 英訳は意味を保っている（「ひいては…起こりうる」は "could happen" のまま）。
  - 続く段落は、池田さんの段落と食い違わない。「人が替わるたびに失われていきます」の次に「その人が引退すると、作法も『なぜそうなったか』も一緒に消えます」と言い直しているが、沿革の考えを足し、帝国データバンクの数へつないでいるので、残す意味がある。
- **見つけたこと・直したこと:** 数字の出どころの一行が、改行一つだけで段落に続いていたので、GitHub では池田さんの段落の中に出ていた（段落の終わりが池田さんの言葉でなくなる）。日英とも空行を入れて、別の小さな段落にした（文言は変えていない）。
- **直さなかったこと:** 下の 20・21（範囲の言い方と、出典の URL）。

### 池田さんに判断してほしいこと（追加）

20. **「330万人の転職者」と「誰のためのものか」のつながり。** 池田さんの段落は、後継者の不在と転職の多さの二つを挙げている（動画 s01 も「異動も当たり前に」）。一方、「誰のためのものか」と「使い続ける場面」は、引退だけを言っている。審査員には、大きく言った課題が、すぐ引退だけに狭まって見える。直すなら、池田さんの段落ではなく「誰のためのものか」の側で、次のどちらかにする。
    - (a) 「担当が替わる（転職・異動）ときも、渡し方は同じです」のような一言を足す。
    - (b) 「いまの版は、引退の引き継ぎから始めています」とはっきり書く。
    - 転職・異動での使い方は、記録で裏付けた使い方としては書かれていない（範囲の言い方なので、池田さんが決める）。
21. **総務省統計局の出典の URL。** 「労働力調査（詳細集計）2025年平均結果」の URL は、リポジトリに記録がないので、リンクを付けていない。分かれば付ける。あわせて、帝国データバンクの 51.2% が「調査対象の中小企業」に限った数かどうかも、一度だけ調査の文言で確かめてもらえると確か（README・動画・決定記録はそう書いていて、食い違いはない）。

## C は飛ばした（11/6 12:09。前の C は 11:09:19 に始めたので、まだ1時間たっていない）

## D. 通しの目（12回目、11/6 12:10。凍結の報告を、10〜11時台の変更に追いつかせる）

- **見つけたこと:** 凍結の報告の差分の一覧に、09:55 以降の変更が入っていなかった。
  - 確かめのカードの名前の列（C 10）。
  - 消した項目の見せ方（A 20）。
  - タブレットの幅での最初の画面と稽古の記録（A 21）。
  - 1024 の幅での折り返し（A 22）。
- **直したこと:** 一覧に足し、差分の量を数え直した（12:10）。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 23回目、11/6 12:25。凍結の確かめ。本番ビルドのスクリーンショット 24 枚。`62-freeze-check/`）

- **判定: 凍結してよい（OK to freeze）。** どの画面も「何か、何を押すか」が30秒で分かる。ダークモードも一貫していて、朱は印だけ。
- **見つけたこと（どれも改行だけ）:**
  1. 暖簾を継ぐの説明で、「心／得帳」「答えま／す」が折れる。
  2. 暖簾を継ぐの答えの「…わけと沿／革）」が折れる。
  3. 稽古の記録の図の説明で、「で／す。」が残る。
  4. スマホの帳場の「後日」で、「あいさつを入／れる」が折れる。
- **直したこと:** 4つとも語結合子（U+2060）で、語の途中で折れないようにした。文言と配置は変えていない（正午以降に許される、文言の小さな直し）。動画に映る s07・s08b・s05 の画面の改行がわずかに変わるだけなので、撮り直していない。11/7 の撮影で反映される。
- **撮り方の失敗（記録）:** 本番のサーバーを `pkill -f "node server.js"` で止めたつもりが、Next.js は処理の名前を「next-server」に変えるので、止まっていなかった。作業フォルダが `.image` であることを確かめてから、番号を指定して止め、127.0.0.1:3125 で何も待ち受けていないことを確かめた。これからは、起動した処理の番号で止める。
- **直さなかったこと:** 青葉ドラッグの2つ目の心得に取引先の見出しがない点（左の欄の数「2」で分かる。直すと配置の変更になる）。そのほか、これまで意図して残したもの。

## B. 審査員の目（14回目、11/6 12:40。judge-critic は呼ばない）

- **やり方:** 前の B（13回目、12:00）のあと、審査員が読むもの（README 日英・提出の下書き・動画の台本）に変更があったかを `git log` で見た。12:00 以降の変更はない。
- **見つけたこと:** 読む中身が変わっていないので、もう一度読ませても実りがない。
- **直したこと:** なし。
- **直さなかったこと:** なし（B の「直す価値のある指摘なし」は1回目。前の B 13 は直した）。
- **進め方についての気づき（池田さんへ）:** 画面の目は「凍結してよい」と言い、審査員の目も、読む中身が変わらない回が出てきた。残りの回は、見つかるものが少なくなっている。15分ごとの回転を、凍結（18:00）まで今のまま続けるか、30分ごとに戻して 11/7 のための余力を残すかは、池田さんが決めてください（利用の上限に近いという知らせは、まだ受けていない）。

## C. 体験の目（11回目、11/6 12:55。スマホの幅で、読み取り・どこが違う・確かめ。本番ビルド。`63-experience-mobile-check/`）

- **測り方:** 本番イメージを作り直してから（12:2x の改行の直しを含む）、`--mobile --marks "×,○" --cards 2 --read 6 --choose --no-remark --none-area timing` を走らせた。結果は `docs/results/experience-2026-11-06T1255.json`。費用は ≈ $0.101。サーバーは台本の中で止まった（3124 で何も待ち受けていないことを確かめた）。
- **秒数（スマホの幅）:**
  - 最初の案: 4.5 秒。× → 次の案: 4.5 秒。× → 1巡目の読み方: 6.0 秒。
  - 「どれでもない」＋「いつ」→ 2巡目: 9.1 秒。選ぶ → 書くまで: 3.1 秒。わけ → 確かめ: 6.3 秒。
  - ○ → 次の案: 3.1 秒。
- **見つけたこと:** スマホのお知らせが「…解き直しました（右の欄）」と言う。スマホでは、弟子の読み取りの欄はカードの上にあり、右ではない。
- **直したこと:** 幅に関係なく正しい言い方「（弟子の読み取りの欄）」にした（その欄の中では今までどおり外す）。正午以降に許される、文言の小さな直し。
- **直さなかったこと:** 取り消すの説明の折り返し（「…残しま／す）」）。文言の長さのためで、配置の変更になる直しはしない。

## D. 通しの目（13回目、11/6 13:10。凍結の報告を、12時台の変更に追いつかせる）

- **見つけたこと:** 凍結の報告に、12時台の変更（A 23 の改行の直し、C 11 のお知らせの言い方）が入っていなかった。
- **直したこと:** 一覧に足し、差分の量を数え直した（13:10）。
- **直さなかったこと:** なし。

## A. 画面の目（24回目、11/6 13:25。ui-critic は呼ばずに、A 23 の改行の直しを自分の目で）

- **やり方:** A 23（凍結の確かめ）のあと、記録済みのデータで見える画面は、A 23 自身の改行の直しのほかは変わっていない（C 11 の文言はライブでしか出ない）。そこで ui-critic は呼ばず、その4か所が効いたかだけを撮って見た（`64-wrap-check/`）。サーバーは番号で止め、3101 で何も待ち受けていないことを確かめた。
- **見つけたこと:** 2か所は、折れる場所が隣に移っただけだった。
  - 暖簾を継ぐの説明は「…添えま／す。」に。
  - 稽古の記録の図の説明は「（途中経／過）です。」に。
  - 帳場の後日は「あいさつ／を入れる」で、句の切れ目なので問題ない。答えの「わけと沿革」も直っていた。
- **直したこと:** 「添えます」に語結合子を入れた。図の説明は「幅（途中経過）です。」を一続きにした。今は「…必ず／添えます。」「…平均と／幅（途中経過）です。」と、句の切れ目で折れる。
- **直さなかったこと:** なし。1字ずつ継ぎ足すと、折れる場所が隣へ移るだけだと分かったので、終わりの句をまとめて守る形にした。

## B. 審査員の目（15回目、11/6 13:40。judge-critic は呼ばない）

- **やり方:** 前の B（14回目、12:40）のあと、審査員が読むもの（README 日英・提出の下書き・動画の台本と場面・静止画）に変更があったかを `git log` で見た。変更はない。
- **見つけたこと:** 読む中身が変わっていない。
- **直したこと:** なし。
- **直さなかったこと:** なし。**B の「直す価値のある指摘なし」が2回続いた（14回目・15回目）ので、次の1巡は B を飛ばす。**

## C は飛ばした（11/6 13:54:09。前の C は 12:54:21 に始めたので、まだ1時間たっていない）

## D. 通しの目（14回目、11/6 13:55。11/7 の手順と台本が、今日変えた画面の言葉を使っていないか）

- **たどり方:** 11/7 の手順（`docs/final-day.md`・`video/README.md`）・凍結の報告・測る台本（`scripts/*.ts`・`video/*.ts`）で、今日変えた画面の言葉の古い形を探した。「確かめ：」「（右の欄）」「一般論だけ」「沿革に残します」「選んだ読み方を心得帳に書いています」「場所は選ばない」「続きから」「明日また試せます」「評価のときの心得帳」など。11/7 に、画面にもう無い文言を探して止まらないかを確かめるため。
- **見つけたこと:**
  - 手順と凍結の報告には、古い文言を探す箇所はない（凍結の報告の一つは、「前はこう出ていた」と書いた説明）。
  - `scripts/check-diff-area.ts` のコメントだけが、古い「どれでもない（場所は選ばない）」を書いていた。セレクタは文言に頼っていないので、動きには影響しない。
  - `experience-run.ts` の確かめを待つ合図は、新旧どちらの文言でも通るようにしてある。
- **直したこと:** そのコメントを「場所は言わない」に直した。
- **直さなかったこと:** なし。

## 判断待ちへの答え（Kento 11/6 昼）と対応

1. **チーム名:** ikenyal。提出の下書きの 1 に入れた。
2. **一番詰まった場面:** 候補 A（訪問の指示が連絡の段取りを動かした、D-061）。
   - ④ は「訪問の指示は、訪問の欄だけに効くと考えて設計していた」の趣旨にし、【Kento が確認】の印を外した。
   - B・C は消さず、「採らなかった候補」として下書きの末尾に残した。
3. **費用の上限:** 案 B（1日 $10、Console の月 $60）。
   - 凍結の報告に決定と「無料クレジットで賄い、実費が出ないように上限を置く」を書いた。
   - deploy.md と final-day.md に手順を足した。凍結の作り直しで `KOKOROE_DAILY_USD=10` にする。Kento が今月の使用額を確かめてから Console で月 $60 にする。
   - 決定記録 D-067 にした。
4. **判断待ち 19:** (b) 画面だけ直す。
   - `src/lib/question.ts` の `isEitherOr` で、「どちら」「どっち」「それとも」「AかBか」型の質問を見分ける。暖簾を継ぐでは、そのとき、はい／いいえの見出しを出さず本文から始める（「分からない」系の見出しは残す）。後任のプロンプトと答えの形は変えていない。
   - テスト（`tests/question.test.ts`）では、どちらか型の例と、画面の例の質問（沿革の質問8件すべて）が「どちらか型ではない」ことを確かめる。
   - 動画 s07 と README の3枚目は、はい・いいえで答えられる質問なので、変わらない（テストで確かめた）。
5. **判断待ち 20:** (a)。README（日英）の「誰のためのものか」に、「担当が替わる（転職・異動）ときも、渡し方は同じです（心得帳を Agent Skill として渡すだけで、引き継ぎの理由によらない）」の趣旨を足した。効果を測ったとは書いていない。池田さんの段落は変えていない。
6. **判断待ち 21:**
   - 総務省統計局の URL（労働力調査（詳細集計）年平均結果、2025年を含むことを開いて確かめた）を、README（日英）の出どころの注に付けた。動画の出典の記録（`video/scenes.json` の source、`video/README.md`）にも付けた。画面の出典の行は短いまま。
   - 帝国データバンクは、README のリンクがすでに公式のページ（tdb.co.jp、2025年11月21日公表）だと開いて確かめた。注に公表日と約27万社を足した。51.2% が中小企業の数であることも、ページで確かめた。

## A. 画面の目（25回目、11/6 14:10。ui-critic は呼ばない）

- **やり方:** A 24 のあとの画面の変更は、判断待ち 19 の (b)（どちらか型の質問で見出しを出さない）だけ。これはライブの自由な質問でしか出ない（記録済みの例の質問は、どれも「はい・いいえ」で答えられる形で、テストで確かめてある）。記録済みのデータの画面は変わっていないので、撮っても実りがない。
- **見つけたこと:** なし。
- **直したこと:** なし。
- **直さなかったこと:** なし（A の「直す価値のある指摘なし」は1回目）。どちらか型の見出しは、ライブで見られる次の C で確かめる（B は今回の巡で飛ばす番）。

## 運営の回答（11/6 昼）への対応: 審査用のコード・2つのリンク・ブランドの確かめ（Kento 11/6）

- **審査用のコード（D-067 の追記）:**
  - 最初の画面のいちばん下に「審査用のコード」の欄を置いた（`app/judge-form.tsx`）。ライブで、かつ公開版に `KOKOROE_JUDGE_CODE`（8字以上）を設定したときだけ出る。
  - 照合は、時間差の出ない比較（sha256 と `timingSafeEqual`）。試せるのは、1つのアドレスにつき1時間に5回まで。
  - 正しいと、コードを鍵にした HMAC を httpOnly の cookie に入れる（本番では secure）。そのセッションのライブは、参加者とは別の1日の上限（`KOKOROE_JUDGE_DAILY_USD=10`）で数える。セッションごとの上限はなく、アドレスごとの上限は残す。
  - 裏の作業（先読みの作り直し、読み取り、確かめ）の費用も、セッションの番号で審査員の枠に数える（`recordSpend(usage, sid)`）。
  - 学習・判定・評価・安全の床は変えていない。弟子・学習・後任・評価のコードが、審査員の印を読まないことをテストで確かめる。
  - コードの値はリポジトリに書かない。
- **hitl-reviewer:** OK。勧めの2つを入れた。
  - 環境変数が数でないとき、上限が外れず既定値に戻る（`num()`）。
  - deploy.md に「コードは16字以上のでたらめな文字列」「変えると新しい入力はすぐ止まり、入力済みのセッションは日本時間の0時まで審査員の枠」と書いた。
- **テスト:** `tests/judge-code.test.ts`（8件）。照合、cookie、試行の上限、別の枠、審査員の費用が審査員の枠に入ること、セッションの上限がないこと、ほかのコードが依存しないこと、数でない環境変数。
- **画面の確かめ:** 仮のコードと、参加者の上限 $0 で開発サーバーを動かした（API なし、費用 0）。欄が出ること、違うコードで「コードが違います」、正しいコードで「確認しました」、cookie が httpOnly、読み込み直しても確認済みのままであることを見た（`65-judge-code/`）。サーバーは番号で止めた。
- **上限:** 参加者 1日 $10、審査員 1日 $10、Console の月 **$100**（Kento が設定）。D-067・凍結の報告・final-day・deploy をそろえた。
- **README（日英）:** 「審査員の方へ」を足した。
- **提出の下書き:** 「参加者向け」「審査員向け」の2つのリンクの書き方と、「審査員のログイン情報」の欄の下書きを足した（コードはプレースホルダ）。参加者向けは、キーがサーバーの中だけにあり、上限のあとは記録済みのデータで続く。運営の言う「API を紐づけない形」に近い。送る前の確かめに「コードは審査員のログイン情報の欄にだけ書く（ほかの提出内容は全員に公開）」を足した。
- **Anthropic のブランド要素の確かめ:**
  - 動画の場面の HTML、README の画像、アプリの画面に、Anthropic・Claude のロゴやキャラクター（Clawd など）はない。「clawd」の語もリポジトリにない。
  - 場面の SVG は、自分で描いた絵（人・暖簾・帳面・家・刷毛など）。
  - 「Claude」「Claude Code」「Anthropic」は文字で言っているだけ（s07 の隅の札、s07b の見出し、終わりの画面）。
  - アプリのタブのアイコン（`app/favicon.ico`）は、Next.js の雛形のままの「N」のロゴ。Anthropic のものではないが、他社のロゴなので、下の 22 に。
- **失敗（記録）:** 新しいテストを `tests/judge.test.ts` という名前で書き、シミュレータの判定のテスト（76件）を上書きしてしまった。テストの件数が 308 → 239 に減ったことで気づいた。git から元に戻し、新しいテストは `tests/judge-code.test.ts` にした（今は 316件すべて通る）。

### 池田さんに判断してほしいこと（追加）

22. **アプリのタブのアイコン。** いまは Next.js の雛形の「N」のロゴ（`app/favicon.ico`）。Anthropic のものではないので、運営の言うブランドの件には当たらない。ただ、他社のロゴがタブに出る。差し替えるなら、ココロエの文字の小さなアイコン（藍の地に白で「心」など）を作る。画面の配置は変わらない。

## B は飛ばした（11/6 14:37。直近2回の B〔14回目・15回目〕が、どちらも直す価値のある指摘なし）

## C. 体験の目（12回目、11/6 14:43。審査用のコードの枠と、どちらか型の質問を、ライブで。本番ビルド・127.0.0.1。`66-experience-judge/`）

- **測り方:**
  - 台本に `--judge-code`（サーバーにその審査用のコードを渡し、最初の画面で入れてから始める）と `--visitor-cap`（参加者の1日の上限を別にする）を足した。終わりに、審査員の枠の費用も出すようにした。
  - 審査用のコードを入れた本番イメージを作り直してから、`--judge-code <仮のコード> --visitor-cap 0 --marks "○,○" --cards 2 --read 4 --ask "浜風運輸さんに、トラブルの第一報はメールとチャットのどちらで送ればいいですか？"` を走らせた。参加者の上限が $0（もう使い切った状態）でも、審査員はライブを使えるかを見る。
  - 結果は `docs/results/experience-2026-11-06T1443.json`。費用は、参加者 $0.000、審査員 ≈ $0.035。
  - 途中、台本の書き換えとビルドを一つのコマンドにまとめたら、削除の安全確認に止められた（何も消していない）。書き換えを Edit ツールで分けてやり直した。
- **秒数:**
  - コードを入れたあと、師匠になって試す → 最初の案: 5.2 秒（ライブ）。
  - ○ → 次の案: 0.3 秒と 3.3 秒。
  - 暖簾を継ぐの自由な質問 → 答え: 3.5 秒。
- **見つけたこと:**
  1. **審査員の枠は効いている。** 参加者の上限が $0 なのに、案はライブで作られた（上限のお知らせなし）。費用はすべて審査員の枠に数えられ、参加者の費用は 0 のまま。
  2. **どちらか型の質問では、はい・いいえの見出しが出ない。** 答えは「メールで送ってください。…」から始まる（`noren-live-answer.png`）。台帳の決まりには「なぜそうなったかは書かれていません」と正直に言っている。
- **直したこと:** 測る台本だけ。
- **直さなかったこと:** なし。

## D. 通しの目（15回目、11/6 14:55。作り直しの手順に、審査用のコードの設定がそろっているか）

- **たどり方:** 公開版の作り直しで写す `docs/deploy.md` の環境変数の表と、`containers.json` の例を、今日の決定（D-067 と追記）と照らした。
- **見つけたこと:**
  - 表と例が、まだ `KOKOROE_DAILY_USD` を `5` のままにしていた。
  - 審査用のコードの2つ（`KOKOROE_JUDGE_CODE`、`KOKOROE_JUDGE_DAILY_USD`）が入っていなかった（本文の段落には書いてあった）。
  - 作り直しのときに表を写すと、審査員の欄が出ない公開版になる。
- **直したこと:** 表を `10` にし、2行を足した（コードは16字以上のでたらめな文字列、リポジトリに書かない、設定しなければ欄は出ない）。`containers.json` の例にも、`"10"`・`"10"`・`"<given by Kento at deploy time>"` を入れた。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 26回目、11/6 14:50。審査用のコードの欄。`67-judge-code-fixes/`）

- **見つかったこと:** 欄が開いたままで、来場者にも空の入力欄が目に入る。コードを入れると何が変わるかが入力の後ろにある。違うコードを入れると、入力欄が空に戻り、何を打ったか確かめられない。確認後の文が長い。
- **直したこと（`app/judge-form.tsx`）:** 「データの扱い」と同じ見た目の、閉じた欄にした（コードを入れたブラウザでは開いたまま）。入力の前に「審査員の方へ: …ほかの来場者とは別の枠で動かせます。コードがなくても、記録済みのデータですべての画面を見られます。」を置く。違うときも入力が残る。間違いの文は「コードが違います。提出フォームの、審査員だけが見る欄にあります。」。確認後は一行。閉じた・違う・確認後の3つを撮って確かめた。
- **直さなかったこと:** なし。

## 22 を閉じる: タブのアイコン（Kento 11/6 の答え (1)）

- Next.js の雛形の「N」を、藍（`#2b4a6f`）の地に白の「心」に差し替えた。元は `scripts/icon/kokoroe-icon.svg`。`npx tsx scripts/make-icons.ts` が Playwright で描き、`app/favicon.ico`（32・48）、`app/icon.png`（64）、`app/apple-icon.png`（180）を書く。外部の画像やウェブフォントは使わない（文字はこの Mac の明朝で描いて、PNG に焼き込む）。
- iOS のホーム画面のアイコンは、OS が角を丸め、透明な角を黒で埋める。そのため 180 のものだけ角を丸めず、地を端まで敷いた。
- 画面の配置は変わらない。撮った場面にタブは映らないので、撮り直しはなし。
- 答え (2)〜(4) は `docs/final-day.md` と `docs/deploy.md` に書いた。作り直しは凍結の報告のあと、Kento の OK で、その時点の main から。コードは作り直しのときに `openssl rand` で作り、Kento に一度だけ見せる。Console の上限は Kento が設定する。

## B. 審査員の目（judge-critic 16回目、11/6 15:24。前の巡で飛ばしたので、今回は回した）

- **見つけたこと（記録で裏付けられ、文言だけで直せるもの）:**
  - 審査用のコードを確認したあとの文が「その場で弟子が案を作る」だけだった。実際には、暖簾を継ぐの自由な質問も審査用の枠で動く（C 12 のライブで確かめた）。
  - 欄は閉じているのに、README は「入れる」としか書いていない。
  - README.ja と提出の下書きは「参加者」、画面は「来場者」。応募フォームの中で「参加者」と書くと、ほかの応募者と読まれやすい。
  - 提出の下書き 8 が、README にない節の名前「モデルの分担」を挙げていた。
- **直したこと:**
  - 確認後の文を「ライブ（その場で弟子が案を作る・暖簾を継ぐで自由に質問する）」にした。
  - README（日英）に「開いて」を足した。
  - 「参加者」は、来場者の意味のところをすべて「来場者」にした（README.ja と提出の下書き）。
  - 8 の節の名前を「役割でモデルを分ける」にした。
  - テスト 316 件、tsc と lint が通った。
- **直さなかったこと（理由）:**
  - 本番の数字が途中経過で、はじめと今を「そのままは比べられない」こと。11/7 の eval:final で入れ替える予定で、文言では直せない。
  - 公開版の URL がまだないこと。作り直しのあとに入れる。
  - 提出の 10・11 の Kento の欄。Kento が書く。
  - タップ数の書き方が「110〜120」と「約114」の2通りあること。どちらも results.json から出ていて、11/7 の正式な数字で書き直すときにそろえる。
  - 最初の画面の Skill だけの答えの抜粋に、「師匠に確認」の部分がないこと。撮影に映る画面なので、11/7 に回す。
  - 動画の変更（s04b の Claude の札、s05 の右の列、s01・s02 の短縮、終わりの画面）。正午以降は撮る画面を大きく変えない。下の 23・24 に。
  - 後任の答えに「明示的な制約」と開発の日付が出ること。プロンプトに触れるので、下の 25 に。
  - README の冒頭に Kento の段落を上げる件。Kento が置き場所を決めた段落なので、下の 26 に。

### 池田さんに判断してほしいこと（B 16 から）

23. **動画 s04b の Claude の札。** いまは「文面は Claude の API（既製）」だけで、一言の読み取りや心得の文も Claude が書くことが映らない。札を「案・一言の読み取り・心得の文は Claude の API（既製）」にするか。11/7 の撮り直しで s04b を録り直す（`--only s04b-flow`）。
24. **動画の尺の配分。** 実際の画面が出るのは 1:13 から。s01 の「そしてAIは、書かれたものしか使えません。」を削り、s02 の最初の2文をまとめて、その秒数を s05（ライブで右の列の読み取りを止めて見せる）に回すか。ナレーションの作り直しが要る。
25. **後任の答えの言葉。** ライブの答えに「取引先台帳の明示的な制約として書かれた」と、開発の日付（2026年11月3日）が出た（`66-experience-judge/noren-live-answer.png`）。後任のプロンプトの平易な言葉の一覧（D-054 追記）に「台帳の制約」「明示的な制約」と「台帳から書いた心得には日付を言わない」を足すか。プロンプトの変更なので、hitl-reviewer と eval:quick（約 $0.3）をセットで行う。
26. **README の冒頭。** Kento の段落の最初の2文を、題の下（README.md・README.ja.md の5行目）にも置くか。いまは3枚の画像のあとの4つ目の段にある。

## C は飛ばした（11/6 15:39。前の C〔14:43〕から1時間たっていない）

## D. 通しの目（16回目、11/6 15:40。来場者の枠を使い切ったあとに来た審査員として）

- **たどり方:** 最初の画面 →「師匠になって試す」→ 1枚目に × をつけ、ライブを断られたところまで。開発サーバーは 127.0.0.1 で、来場者の上限を $0 にし、使い捨てのテスト用コードを入れた（API は呼ばれず $0）。使い終わってサーバーは止めた。
- **見つけたこと:** 来場者の枠が尽きると、帳場の上には「本日のお試し上限に達しました…日本時間の0時にまた試せます」だけが出る。コードをまだ入れていない審査員には、別の枠があることが分からない。運営の答えどおりに枠を分けても、夕方に来た審査員はここで止まる。
- **直したこと（`app/limit-note.tsx`）:** 来場者の枠が尽きた（日・セッション）とき、その公開版でコードが設定されていて、まだコードを入れていないブラウザにだけ、1文を足した。「審査員の方は、最初の画面のいちばん下の「審査用のコード」に提出フォームのコードを入れると、別の枠でライブを試せます。」画面の配置は変わらない（帳場と暖簾を継ぐの、上限のお知らせの中だけ）。帳場で文が出ることを、画面の文字で確かめた。テスト 316 件、tsc と lint が通った。
- **直さなかったこと:**
  - 帳場の「このデモでは弟子の読み取りは行いません（公開版のライブでは行います）」は、上限のあとの公開版にも出る。上のお知らせが理由を言っているので、そのままにした。
  - 審査員がセッションの途中でコードを入れたとき、次の案からライブに戻るかは確かめていない。そのため文は「続けられます」でなく「試せます」にした。

## A. 画面の目（ui-critic 27回目、11/6 15:55。上限のお知らせと審査員への一文、スマホの審査用のコードの欄。`68-limit-hint-judge-mobile/` → `69-limit-hint-fixes/`）

- **撮り方:** 開発サーバー（127.0.0.1）で、来場者の上限を $0 にし、使い捨てのテスト用コードを入れて撮った（API は呼ばれず $0）。撮り終えてサーバーは止めた。
- **見つけたこと:**
  1. 「最初の画面」がどこか分からない。ナビの1つ目は帳場なので、今いる画面のことだと読まれる。
  2. 審査員への一文が、お知らせの5行の終わりに埋もれる（スマホ）。前に余計な空白がある。「提出フォームのコード」と、欄の「提出フォームでお渡ししたコード」で言い方が違う。
  3. 開いた欄の入力と押すところが写っていなかった。高さは 40px。
  4. 「上限に達しました」のすぐ下に「お試し 1 / 40 件 済み」が出て、自分の分を使い切ったように読める。
  5. 公開版で上限に達したあとにも、「このデモでは…（公開版のライブでは行います）」と出る。
- **直したこと:**
  1. 「審査員の方へ: 左上の「ココロエ」から最初の画面に戻り、いちばん下の「審査用のコード」に、提出フォームでお渡ししたコードを入れると、別の枠でライブを試せます。」にした。お知らせの中で別の行に置いた（`app/limit-note.tsx`）。
  2. 日の上限の文を「本日のお試し上限に達しました（来場者全体で共通の上限です）。…」にした。README が引く書き出しはそのまま（`src/server/limits.ts`）。
  3. 上限で読み取りを止めた案の下の文を、「上限に達したため、いまは弟子の読み取りを行いません（ライブ中は行います）。」にした。記録済みのデモで出る文は変えていない（`app/choba/page.tsx`）。
  4. 審査用のコードの入力と「確かめる」を、高さ 44px にした。
  - 撮り直して確かめた。テスト 316 件、tsc と lint が通った。
- **直さなかったこと:**
  - 「▶ データの扱い」「▶ 審査用のコード」の見出しの押しやすさ。撮影に映る最初の画面の余白が変わるので、見送った。
  - 最初の画面の注記にある Skill・MCP の言葉。11/7 以降に回す。
  - どれも、記録済みのデモ（動画に映る形）の見た目は変えていない。

## B. 審査員の目（judge-critic 17回目、11/6 16:09。前回〔15:24〕からの差分だけ）

- **見つけたこと:**
  1. 日の上限の文が、いつも「来場者全体で共通の上限です」と言う。審査員の枠（$10）を使い切った審査員にもこの文が出て、README の「別の1日の上限」と食い違う。
  2. 「ライブ」の説明が3通りある。コードを入れる前は「その場で弟子が案を作る」、入れたあとは「…暖簾を継ぐで自由に質問する」、提出の下書きは「Claude が案を作り、直しを読み取り、後任に答える」。
  3. お試しは「ライブ中」なのに、上限のあとの文の「（ライブ中は行います）」と食い違う。
  4. README.md の「where the spend is counted」が、コードで変わること（セッションの上限がない）を言い切れていない。README.ja の「上限の数え方だけ」は合っている。
- **直したこと:**
  1. 審査員のセッションが日の上限に当たったときは、「本日の審査用の上限に達しました。…」を出す（`app/limit-note.tsx`）。
  2. 欄の前とあとの「ライブ」を、提出の下書きと同じ「ライブ（Claude が案を作り、直しを読み取り、後任に答える）」にそろえた（`app/judge-form.tsx`）。
  3. 「（上限が戻れば行います）」にした（`app/choba/page.tsx`）。
  4. README.md を「how the limits are counted (its own daily budget, no per-session cap)」にした。
  - tsc と lint が通った。テストは、1回目に3件、2回目に4件が時間切れで落ちた（limits・undo・verify-ui。どれも今回触っていない）。そのときの負荷の平均は 61。落ち着いてから回すと 316 件すべて通った。
- **直さなかったこと:** なし（差分の範囲では）。

## C. 体験の目（13回目、11/6 16:24。来場者の上限のあとに、途中でコードを入れた審査員。本番ビルド・127.0.0.1。`70-experience-judge-late/`）

- **測り方:**
  - 台本に `--judge-late` を足した。コードを入れずに始め、1枚目の × で来場者の上限（$0）に当たったあと、最初の画面に戻ってコードを入れ、帳場に戻って続ける。
  - あわせて、コードの確認を待つ文言を A 26 の新しい文（「確認しました。このブラウザでは…」）に合わせた。1回目は古い文を待って止まった（$0）。
  - `--judge-code <使い捨て> --judge-late --visitor-cap 0 --cap 0.5 --marks "×,×,○" --cards 3 --read 4`
  - 結果は `docs/results/experience-2026-11-06T1630.json`（直す前）と `…T1635.json`（直したあと）。
  - 費用は、来場者 $0.000、審査員 $0.081＋$0.054。
- **見つけたこと:**
  1. **途中でコードを入れても、ライブに戻る。** 2枚目の × から、案も読み取りもライブで動いた（× → 次の案 8.8 秒、読み取りまで 6.0 秒、○ → 次の案 6.6 秒）。D 16 で確かめていなかった点。
  2. **ただ、古い上限のお知らせが残っていた。** セッションに残った上限の印を、審査員の枠で読み直すので、「本日の審査用の上限に達しました」と、使ってもいない審査員の上限の話になっていた（B 17 の直しの副作用）。
- **直したこと（`app/actions.ts`）:** コードが通ったとき、このブラウザのセッションに残った上限のお知らせだけを消す。次のライブの呼び出しは、いつもどおり審査員の枠で確かめる。直したあと、帳場の上にお知らせは出ず、2枚目からライブで動いた（× → 次の案 8.6 秒、読み取りが出るまで 5.9 秒、○ → 次の案 4.4 秒）。テスト 316 件、tsc と lint が通った。
- **直さなかったこと:** 上限のときに付けた1枚目の × の下の文は、お知らせが消えると、記録済みのデモと同じ「このデモでは…（公開版のライブでは行います）」に戻る。その1枚だけの話で、次の案からはライブで読み取るので、そのままにした。

## D. 通しの目（17回目、11/6 16:40。記録が今日の午後に追いついているか）

- **たどり方:** `docs/how-we-built.md` の 11/6 の節を、今日の ui-polish-log と照らした（CLAUDE.md は、作業のたびに短く記録すると決めている）。
- **見つけたこと:** 11/6 の節は正午の撮り直しで終わっていた。午後の作業が載っていない。
  - 運営の答えから作った審査用のコードと、それをそれぞれの目が直していった流れ。
  - SVG から作ったタブのアイコン。
  - 負荷の高いときにテストが時間切れで落ちたこと。
- **直したこと:** 上の3つを、how-we-built の 11/6 の節に足した。コードの値はどこにも書いていない。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 28回目、11/6 16:55。凍結の確かめの2回目。本番ビルド・記録済みデータの 24 枚。`71-freeze-check-2/` を `62-freeze-check/` と比べた）

- **判定: 凍結してよい（still OK to freeze）。** 崩れ・ずれ・はみ出し・新しい悪い折り返しは、24 枚のどれにもない。ページの高さ、配置、色、ナビ、○△× は 12:25 と同じ。
- **見つけたこと:** 違いは改行の位置だけで、どれも A 23 の語結合子の直しによるもの（語の途中で折れなくなった）。
  - 帳場（スマホ）の後日: 「あいさつ／を入れる」。
  - 暖簾を継ぐの説明: 「答えま／す」「心／得帳」がなくなった。スマホでは「師匠へ／の確認」で折れる。これだけはやや不自然だが、前の「確／認」よりよい。
  - 暖簾を継ぐの答えの注記: 「わけと沿革）」がまとまった。
  - 稽古の記録の図の説明: 「幅（途中経過）です。」がまとまった。
  - 審査用のコードの欄と、上限のお知らせの文言は、記録済みデータの画面には出ない。そのため動画には映らない。
- **直したこと:** なし（記録だけ）。撮影は 127.0.0.1 の本番サーバーで行い、撮り終えて止めた。API の呼び出しはなし。
- **直さなかったこと:** 「師匠へ／の確認」の折り返し。撮影の前に触る価値はない、という講評のとおり。

## B. 審査員の目（judge-critic 18回目、11/6 17:09。16:09 からの差分。凍結前の最後の回）

- **見つけたこと:**
  1. how-we-built の「the two live runs ($0.135 in all)」は C 13 の2回分だけ。C 12 の $0.035 と合わせると、ライブは3回で計 $0.170。
  2. 「timed out once」は誤り。ログでは2回（3件、そのあと4件）。
  3. README のサブエージェントの行に、11/6 の4つの目を15分ごとに回したやり方が書かれていない（how-we-built にしかない）。
  - 公開してはいけないものは見つからなかった（コードの値、勤め先の名前、アカウントの番号はない）。
- **直したこと:**
  1. 「C's live runs ($0.035 and $0.135, $0.170 in all)」にした。
  2. 「Three, then four, … in two runs … (limits, undo, verify-ui; none touched by the change)」にした。
  3. README（日英）のサブエージェントの行に、やり方だけを1文足した。何が良くなったかは書いていない（D-062）。
  - テスト 316 件が通った。
- **直さなかったこと:** なし。
- **次:** 17:30 を過ぎたら新しい改良は始めない。凍結の声かけを待つ。

## 17:24 の回は始めなかった（凍結の直前）

- 順番では C（前の C〔16:24〕からちょうど1時間）。ただ、本番ビルドとライブの操作、直しまでで 15〜20 分かかり、17:30 の凍結の線を越える。
- 越えて改良することになるので、始めなかった。ここから先は新しい改良を始めず、凍結の声かけを待つ。

## Kento の答え（11/6 18:00）と対応: 凍結を 11/7 07:00 へ、判断待ち 23〜26 はすべて「はい」

- **予約:** 15分ごとの予約を作り直した（止める時刻 11/7 07:00、弟子・学習・評価・後任のプロンプトは 05:00 まで、回ごとに `docs/HANDOFF.md` を更新）。
- **23:** s04b の札を「案・一言の読み取り・心得の文は<br>Claude の API（既製）」にした。長くなり、隣のココロエの札に重なったので2行にした。静止画で確かめた（`docs/screens/video-dryrun/s04b-flow-item24-*.png`）。
- **24:** s01 から「そしてAIは、書かれたものしか使えません。」とその絵（3つ目の枠）を削り、2つの枠を中央に置いた（17.0 → 13.0 秒）。s02 の最初の2文を「取引先ごとの伝え方、三十年分の作法は、部長の頭の中にしかありません。」にまとめ、後ろの動きを 2.7 秒前へずらした（16.6 → 13.9 秒、見込み）。浮いた 6.7 秒を s05 に（22.0 → 28.7 秒、右の欄の読み取りで止める）。実際の画面は約 1:07 から。全体の長さは変わらない。秒数は 11/7 にナレーションの実際の長さで決め直す。`video/README.md` の表と `scenes.json` を直した。静止画: `s01-why-item24-*`、`s02-problem-item24-*`。
- **25:** 後任のプロンプト（`src/successor/ask.ts`）。最初の書き方を hitl-reviewer が止めた（「〔台帳〕の心得」で決めると、台帳＋師匠の心得で、師匠の直しの日付まで落ちるおそれ）。沿革の行の出典で決める書き方に直した。後任の確かめ（1冊、≈ $0.13 × 2）で: 遠い質問の作り話 0、値引きは師匠へ 2/2、「明示的な制約」2 → 0、内部の言葉 1（K- の番号。画面では「心得」）、沿革 5 → 6/8、近い質問 1 → 2（4問中。これまでの揺れの範囲）。`eval:quick` は既定で固定の教科書の基準を回すので、後任には触れない（0% / 45%、11/4 と同じ）。D-054 に2つ目の追記。
- **26:** Kento の段落の最初の2文を、README（日英）の題のすぐ下に引用で置いた（「続きは課題」へのリンクつき）。
- **アカウントの切り替えへの備え:** `docs/HANDOFF.md` を作った（いまの状態、回し方、予約の作り方と指示文、止める時刻、判断待ち、次にやること）。コミットの作者は、リポジトリの設定（ikenyal、noreply のアドレス）であることを確かめた。
- **凍結の報告の中間版:** `docs/freeze-report.md` の頭に「0. この中間版で作り直すもの」、1 に「11/6 午後〜夜」を足した。Kento の OK を待つ。
- テスト 316 件、tsc と lint が通った。

## C. 体験の目（14回目、11/6 18:09。判断待ち 25 をライブで。本番ビルド・127.0.0.1。`72-experience-ledger-words/`）

- **測り方:** 本番イメージを作り直し、`--marks "○,○" --cards 2 --read 4 --ask "浜風運輸さんに、トラブルの第一報はメールとチャットのどちらで送ればいいですか？"`（C 12 で「明示的な制約」と開発の日付が出た質問と同じ）。費用 $0.032。結果は `docs/results/experience-2026-11-06T1809.json`。
- **秒数:** 師匠になって試す → 最初の案 4.1 秒。○ → 次の案 0.4 秒と 4.8 秒。暖簾を継ぐの答え 3.4 秒。
- **見つけたこと:**
  1. 答えの文から「明示的な制約」と日付が消えた。「取引先台帳に「社外チャット不可…」と書かれており…台帳の記載を写したもので、いつからの決まりかは分かりません。」
  2. ただし、その下の根拠の心得のカードは、まだ「心得帳に書いた日：2026-11-03」を出していた（hitl-reviewer も指摘していた）。
- **直したこと（`app/noren/page.tsx`）:** 根拠の心得の出どころが取引先台帳のときは、書いた日を出さない。師匠の直しから来た心得の日付はそのまま。記録済みの答え Q03（動画 s07）にも台帳の根拠が1つあり、その1行が短くなるので、`video/shoot.ts --only s07-noren` で録り直した。静止画 `docs/screens/video-dryrun/s07-noren-item25-{3,6.5,10}.jpg`。台帳の根拠から日付だけが消え、師匠の心得の「心得帳に書いた日：2026-11-03」は残る。「わけと沿革）」も一続きになった。配置は同じ。テスト 316 件、tsc と lint が通った。
- **直さなかったこと:** 心得帳の画面の沿革は、記録そのものなので、台帳の行の日付もそのまま出す。

## D. 通しの目（18回目、11/6 18:23。判断待ち 23・24 のあと、台本と 11/7 の手順が食い違っていないか）

- **たどり方:** `video/README.md`、`video/scenes.json` の注記、`docs/final-day.md` の撮影の手順を、今夜の 23・24 の変更と照らした。
- **見つけたこと:**
  1. `video/README.md` の場面の説明が、s04b の札をまだ「文面は Claude の API（既製）」と書いていた。
  2. `scenes.json` の構成の注記が「why now (three forces)」のまま。
  3. 11/7 の撮影の手順（`final-day.md` の 1、/goal の文も同じ行）が、作り直すナレーションに s01・s02 を入れておらず、秒数を決め直す手順もなかった。このままだと、削った文のない新しい台本に、古い音声と秒数で撮ることになる。
- **直したこと:**
  1. 札の文を新しいものにした（11/6 の 23 で変えたことも書いた）。
  2. 注記を「three forces; two since 11/6, item 24」にした。
  3. ナレーションの作り直しに `s01-why,s02-problem` を足した。新しい音声の長さから `scenes.json` の秒数を入れ直し、浮いた分を s05 に足す（全体 180 秒以下）一文も足した。
  - テスト 316 件が通った。
- **直さなかったこと:** `video/README.md` の v3 の履歴にある「three forces」。当時の記録なので、そのままにした。

## A. 画面の目（ui-critic 29回目、11/6 18:38。今夜変えた画面: 動画 s01・s02・s04b と暖簾を継ぐ。`73-evening-check/`）

- **判定:** 今夜の変更で壊れたものはない。s01 は2つの枠でも欠けて見えない。s02 の3つの時点は筋が通る。s04b の札は読める。
- **見つけたこと:**
  1. 暖簾を継ぐの根拠の心得で、台帳のものは「出どころ：取引先台帳」、師匠のものは「心得帳に書いた日」だけで、行の種類が違い比べられない。
  2. s04b の Claude の札が、下の罫線に触れ、弟子の箱より左にはみ出す。
  3. s02 の「どう」が、動く途中で本の右端に重なる。
  4. s02 の注記の終わりに「（D-059）」（審査員には意味がない）。△ 8・× 7 が数に読めない。
  5. 暖簾を継ぐの「根拠・経緯：…（下に、／わけと沿革）」が折れ、下に「沿革」という見出しはない。
- **直したこと:**
  1. 師匠の心得も「出どころ：師匠の直し（心得帳に書いた日 2026-11-03）」にした。台帳のものは「出どころ：取引先台帳」のまま（`app/noren/page.tsx`）。
  2. 札を「案・一言の読み取り・／心得の文は Claude の API（既製）」の2行・15px にし、下の定義の罫線を 22px 下げた。
  3. 誰に・何を・どうを 20px 右へ（どうは 20px 余分に。終わりの位置は同じ）。
  4. 「△ 8件・× 7件」にし、「（D-059）」を外した。
  5. 「（わけは下に）」にした。
  - 動画 s07 の画面が変わるので、`video/shoot.ts --only s07-noren` で録り直した。静止画 `s07-noren-item25-10.jpg` で、2つの出どころがそろい、要約の行が1行に収まった。s01・s02・s04b の静止画も撮り直した（`*-item24-*`）。テスト 316 件、tsc と lint が通った。
- **直さなかったこと:** s07 の右上の藍の札が枠の右端に近い件。動画の札の位置は撮影の仕組みの側にあり、11/7 の撮影で一緒に見る。

## B. 審査員の目（judge-critic 19回目、11/6 18:53。今夜の変更の差分）

- **公開してはいけないもの:** なし。HANDOFF と凍結の報告に、コードの値・秘密・アカウントの番号はない。AWS のプロファイル名は、すでに公開している CLAUDE.md にあるもの。
- **食い違いがなかったもの:** 秒数（s05 は 1:06.9 から、全体 2:56.2）、札の文言、後任の数字、s01・s02・s07 のナレーションと画面。
- **見つけたこと・直したこと:**
  1. s05 に 6.7 秒を足したのに言葉がなく、右の欄を約 7.6 秒黙って映すことになる。→ s05 のナレーションに「弟子はその一言を読み取り、心得帳に書きました。」を足した（`scenes.json`）。11/7 に作り直すナレーションに `s05-choba` を加えた（`video/README.md`、`final-day.md`。HANDOFF と凍結の報告はもともと s05 を含めていた）。
  2. 心得帳の出典の一覧に、まだ「取引先台帳の明示的な制約」と出ていた。→「取引先台帳から写したもの」にした（日付は書き写した日として残す）。動画 s06 を録り直したが、その場面に台帳の出典の行は映っていない（`s06-kokoroe-b19-7.5.jpg`）。
  3. 凍結の報告が、1冊での確かめのうち、悪い向きに動いた数を書いていなかった。→「近い質問 1 → 2（4件中、ばらつきの内）」と「沿革 5 → 6/8（ばらつきの内）」を足した。
  4. README のサブエージェントの行が、4つの目が何を見つけたかを1つも書いていない。→ 記録にある例を1つ足した（C 13: 途中でコードを入れた審査員に古いお知らせが残る→消すようにした）。
  5. `video/README.md` の s02 の注記が「11.6 s から」のまま。→「約 8.9 s（11/7 に新しい音声で決める）」にした。
  6. `73-evening-check/` の写真が、直す前の画面だった。→ 撮り直した。
  - テスト 316 件、tsc と lint が通った。
- **直さなかったこと:**
  - README の題の下の引用に、Kento の段落の3文目（「けれど、その多くは本人の頭の中にしかなく…」）まで入れる件。26 で Kento が2文と決めたので、下の 27 に。
  - 稽古の記録の「台帳と明示的な制約だけ」は、評価の版の名前（`eval/readme-results.ts` が作る）。11/7 の正式な数字で表を作り直すときに一緒に見る。

### 池田さんに判断してほしいこと（B 19 から）

27. **README の題の下の引用を3文にするか。** いまは「…その人ならではの仕事の勘どころがあります。」まで。3文目「けれど、その多くは本人の頭の中にしかなく、書き残されないまま、人が替わるたびに失われていきます。」まで入れると、最初の画面で何が足りないかまで言える。Kento の文のまま、言葉は足さない。

## C. 体験の目（15回目、11/6 19:08。△ の直しから確かめまで、読む時間 8 秒で。本番ビルド・127.0.0.1。`74-experience-choose-evening/`）

- **測り方:** `--marks "△,○,○" --cards 3 --read 8 --choose`（今夜の変更のあとのイメージ）。費用 $0.099。結果は `docs/results/experience-2026-11-06T1909.json`。
- **秒数:**
  - 師匠になって試す → 最初の案: 4.9 秒。
  - △ → 次の案: 4.9 秒。その間、状態の行は「解釈の順番待ち」から「どこが違ったか読み取っています」へ。
  - △ → 右の欄に「心得帳に書きました」: 9.0 秒。今回は読み方の候補を出さず、一つに決めて書いた。
  - わけを残す → 確かめ（解き直し）: 6.1 秒。
  - ○ → 次の案: 0.3 秒と 0.3 秒（先読みが効いた）。
- **見つけたこと:** つまずく点はなかった。待つ間には、いつも何をしているかの一行が出ている。書いた心得（「トラブル時は、まず電話で一言伝えてから、メールで詳細を送る。」）と「なぜそうなったか」の欄が、右の欄に一画面で見える。
- **直したこと:** なし。
- **直さなかったこと:** 状態の行と右の欄の両方に「心得帳に書きました。よければ、わけを一言」が出る。スマホでは右の欄が上に来て、デスクトップでは状態の行が左にあるので、どちらからでも分かるように両方に置いている（11/5 の判断のまま）。

## D. 通しの目（19回目、11/6 19:23。今夜の台本の変更の出どころが記録と合っているか）

- **たどり方:** 提出の下書き 7（動画の説明文）、README（日英）の「ナレーションの台本は Claude と作り」、`video/scenes.json` の注記、`docs/how-we-built.md` を、今夜の 24 と B 19 の変更と照らした。
- **見つけたこと:**
  - 説明文と README の言い方（「Claude と作り、一部は作者が短くした」）は、今夜の分にも当てはまる。
  - ただ、どの文を今夜だれが書いたかの記録がなかった。s02 のまとめた文と s05 の足した文は Claude Code が書いた。s01 の削除は Kento の判断。
  - `docs/how-we-built.md` に今夜の作業がなかった（CLAUDE.md は作業のたびに記録すると決めている）。
- **直したこと:**
  - `scenes.json` の注記に、11/6 夜の3つの変更と、だれの判断・だれが書いたかを足した。
  - how-we-built に「2026-11-06 (evening)」の節を足した。凍結の移動、hitl-reviewer が止めたプロンプトの最初の書き方、台本の変更、HANDOFF の4つ。
- **直さなかったこと:** 提出の下書きと README の言い方。今夜の分も含めて正しいので、変えていない。

## A. 画面の目（ui-critic 30回目、11/6 19:38。心得帳の出どころ。`75-kokoroe-sources/`）

- **撮り方の注意:** `screens.ts --open "details summary"` は、ページのすべての折りたたみを開いて撮る。16 の心得・事実の「出典」と「消す」が全部開いた、来場者が見ない状態の写真になった。講評の「消すの文が16回並ぶ」「スマホで長すぎる」はこのせいなので、直していない。
- **見つけたこと（本物）:**
  1. 台帳から写した事実の出典を開くと、頭の一行が「この心得のもとになった、師匠の印と一言…」で、台帳の事実を師匠のものと言っていた。
  2. 「出典の一覧」は、暖簾を継ぐの「出どころ」と言葉が違い、記号めいている。
- **直したこと（`app/kokoroe/page.tsx`）:**
  1. 頭の一行を出どころによって分けた。事実は「この事実を写した、取引先台帳（いつ写したか）。」。台帳と師匠の両方からの心得は「…取引先台帳と、師匠の印と一言…」。師匠だけのものはこれまでどおり。
  2. 折りたたみの名を「出どころ」にした。
  - 動画 s06 に「出どころ」が映るので、`--only s06-kokoroe` で録り直した（`s06-kokoroe-b19-7.5.jpg`、配置は同じ）。開いた状態を、心得と事実の1つずつ撮り直した（`rule-source-open.png`、`fact-source-open.png`）。テスト 316 件、tsc と lint が通った。
- **直さなかったこと:**
  - 「消す」の文と押すところの大きさ。押すところはもともと高さ 44px で、文は開いたときだけ出る。
  - 心得帳の事実の「写した日」。記録そのものなので出す（暖簾を継ぐの答えでは出さない）。

## B. 審査員の目（judge-critic 20回目、11/6 19:53。提出の下書きだけを、項目ごとに）

- **公開してはいけないもの:** なし（審査用のコードは置き場所の文だけ、秘密・勤め先の名前なし）。
- **見つけたこと・直したこと（`docs/submission-draft.md`）:**
  1. 概要が「○・△・× と一言で直す」「△・× の一言は Claude が読み取り」で、一言が必須に読める。最初の画面と README は「あれば一言」で、一言なしの △ からも心得ができる例を出している。→「○・△・× と、あれば一言で直す」「△・× とその一言は Claude が読み取り」にした。
  2. 概要で「沿革」だけが説明のない言葉。→「経緯つきの心得」にした（同じ長さ）。
  3. 「約114回タップ」が何か分からず、「印を付けるだけ」と食い違って読める。→「タップ（印・読み方の選択・確認）」にした。概要は 500 字以内のまま（テストで確かめた）。
  4. 9（一番詰まった場面）の見出しに「（D-061）」があり、丸新酒造の奥様・蔵元がだれか書いていない。→ 番号を外し、「架空の取引先・丸新酒造（窓口は奥様、決裁は蔵元）」にした。
  5. 8 と 11① に D-番号やファイル名、「コードの判定」が残っていた。→ 外したり言い換えたりした（「隠した正解とコードで照合するシミュレータの師匠では」、「AI の弟子（橙丸）自身を」、Managed Agents は「既定はオフ。」で終わり）。
  - テスト 316 件が通った。
- **直さなかったこと:** 概要の「案を見れば「違う」とすぐ言えます」の「すぐ」。D-062 で動画の「一瞬で」は外したが、「すぐ」は README・最初の画面・CLAUDE.md の考え方（見ればすぐ分かる）と同じ言葉。下の 28 に。

### 池田さんに判断してほしいこと（B 20 から）

28. **「違う」と「すぐ」言えます、の「すぐ」。** 師匠役テストで、1枚あたりの中央値は 53.5 秒（読む時間を含む、D-059）。D-062 では、動画 s04 の「一瞬で」を外した。「すぐ」は、提出の概要・README.ja・最初の画面にあり、ココロエの考え方（説明はできないが、見れば違うと分かる）を言っている。残すか、「案を見れば「違う」と言えます」に3か所そろえて変えるか。

## C. 体験の目（16回目、11/6 20:08。スマホで、一言なしの × →「どれでもない」＋どこが違う？。本番ビルド・127.0.0.1。`76-experience-mobile-none/`）

- **測り方:** 今夜の変更のあとのイメージを作り直し、`--mobile --marks "×,○" --cards 2 --read 8 --choose --no-remark --none-area timing`。費用 $0.109。結果は `docs/results/experience-2026-11-06T2010.json`。
- **秒数:**
  - 最初の案: 4.9 秒。
  - × → 次の案: 4.4 秒。
  - × → 読み方の候補（3つ）: 9.2 秒。
  - 「どれでもない」＋「いつ」→ 2巡目の候補: 9.2 秒。その間、状態の行は「ほかの読み方を考えています」から「どこが違ったか読み取っています」へ。
  - 読み方を選ぶ → 心得帳に書く: 3.1 秒。
  - わけ → 確かめ: 6.1 秒。
  - ○ → 次の案: 1.7 秒。
- **見つけたこと:** つまずく点はなかった。スマホでは、読み取りの欄の見出しが画面の上端に来る（headingTop 0）。候補の上に「印を付けた案」が出て、何を直したかが分かる。
- **直したこと:** なし。
- **直さなかったこと:** なし。

## D. 通しの目（20回目、11/6 20:23。「タップ」が何を数えているか、画面・README・提出でそろっているか）

- **たどり方:** 稽古の記録の画面、README（日英）の数字の表、提出の下書きの概要で、師匠のタップ数の説明を並べた。
- **見つけたこと:** 3通りの言い方があった。
  - 画面: 「印・候補の選択・「なぜ？」・確かめの合計」
  - README.ja: 「判定・候補の選択・「なぜ？」・確認」
  - 提出（B 20 で足した）: 「印・読み方の選択・確認」（「なぜ？」が抜けていた）
- **直したこと:** 画面の言い方にそろえた。
  - README.ja: 「印・候補の選択・「なぜ？」・確かめ」
  - README: 「marks, choosing a reading, "why?", checks」
  - 提出の概要: 「印・候補の選択・なぜ？・確かめ」。500 字を超えたので、「弟子が作る段取りの案」を「弟子の段取りの案」に縮め、「」を外した。テストで 500 字以内を確かめた。
  - テスト 316 件が通った。
- **直さなかったこと:** 画面の文言（基準にした）。
- **手順の失敗（記録）:** README の数字の表は `eval/readme-results.ts` が作る区画で、テストが一致を確かめている。表の文言を直接直したため、テスト2件が落ちた。ところが、コマンドが `npm test | grep` で結果を表示するだけだったので、落ちたままコミット・マージ・push した（`461ae28`）。すぐに作る側（`eval/readme-results.ts` の表の見出しの文言だけ。測り方は変えていない）を直し、316 件が通ることを確かめて直した。これからは、テストが通ったときだけコミットする形（`npm test >/dev/null && git commit …`）で回す。

## A. 画面の目（ui-critic 31回目、11/6 20:38。最初の画面と稽古の記録。`77-home-keiko-evening/`）

- **判定:** 最初の画面は、30秒で何か・だれのためか・最初に押すものが分かる。稽古の記録は、架空のデータと評価用20場面がはっきり書いてある。
- **見つけたこと・直したこと:**
  1. 稽古の記録の見出しが「55%から64%に」と言い、すぐ次の行で「そのままは比べられません」と言う。64% が平均で、低い方は 58% であることも見出しから見えない。→「平均64%（58%〜70%）に」にした（`app/keiko/page.tsx`）。
  2. タップの説明が、図の横軸では「判定・…・確認の合計」、表の下では「印・…・確かめの合計」。図の説明は「押した回数」。→ 横軸を「印・候補の選択・「なぜ？」・確かめの合計」に、説明を「横は師匠のタップ数」にした。
  3. 見出しの「経緯ごと答えられた質問」と、表の「わけごと答えられた数」が別の物差しに読める。→ 表を「経緯ごと」にそろえた（README と提出も「経緯ごと」）。
  4. 最初の画面の説明は「ベテラン」、以降はすべて「師匠」。→「ベテラン（師匠）の頭の中に」にした。
  - 動画 s08b に稽古の記録が映るので、`--only s08b-keiko` で録り直した。見出しは3行のまま（`s08b-keiko-a31-5.jpg`）。s08b は 11/7 に正式な数字で撮り直す予定どおり。テスト 316 件、tsc と lint が通った。
- **直さなかったこと:**
  - 最初の画面の「始め方」の下の太い罫線が2本続く件。最初の画面の余白と罫線の組み方の変更なので、今夜は見送った（11/7 の撮影の後に）。
  - 最初の画面の Skill・MCP の例の言葉が詰まっている件（16:10 の A 27 と同じ。11/7 以降）。
  - スマホの図が左で切れる件。「図は横にずらせます」の注意があり、動画はデスクトップで撮る。

## B. 審査員の目（judge-critic 21回目、11/6 20:53。19:53 からの差分）

- **数字:** 稽古の記録の見出し（55% → 平均64%（58〜70%）、約114回、0 → 5.3/8）は、results.json・README（日英）・提出の下書き・s08b の静止画とすべて合っている。新しい言い過ぎはなし。
- **見つけたこと・直したこと:**
  1. s08b のナレーションが「師匠の114回のタップで、64%に。」と、3本の平均を一つの結果のように言う（画面は「約」「平均」と幅）。→「師匠の約{taps}回のタップで、平均{after}%に。」にした（`scenes.json`）。約 0.6 秒長くなるが、s08b は 11/7 にナレーションを作り直し、秒数を音声から決め直す。
  2. 稽古の記録の数字の注記と「表で見る」の見出しに「沿革の質問」が残っていた（この画面では説明がない）。→「経緯の質問」にした。
  3. README.ja の「出典（どの判定で…）」が、画面の「出どころ」と違う。→「出どころ」にした（英語の sources はそのまま）。
  4. 心得帳の出どころの頭の行と、ページの説明が「師匠の印と一言」で、一言が必ずあるように読める。→「師匠の印（一言があればそれも）」「どの印（と一言）から」にした。s06 に映るので録り直した（`s06-kokoroe-b19-7.5.jpg`、配置は同じ）。
  - テスト 316 件、tsc と lint が通った。
- **直さなかったこと:** なし。

## C は飛ばした（11/6 21:08。直近2回の C〔15・16〕が、どちらも直す価値のある指摘なし）

## D. 通しの目（21回目、11/6 21:08。今夜そろえた言葉が README に残っていないか）

- **たどり方:** 今夜そろえた言葉（経緯の質問、出どころ、タップの中身、ベテラン（師匠））で、README（日英）・提出の下書き・画面・台本を検索した。
- **見つけたこと:** README.ja の2か所が「沿革の質問8件」「沿革の質問は…」のままだった。稽古の記録の画面と表は「経緯の質問」。1か所目は、`eval/readme-results.ts` が作る区画の中にある。
- **直したこと:**
  - 作る側（`eval/readme-results.ts`、文言だけ）と README.ja を「経緯の質問8件」にした。
  - 説明の段落は「経緯の質問（沿革の質問）は…」と、両方の名がつながるようにした。
  - テスト 316 件が通った（README の区画の一致も）。
- **直さなかったこと:** 英語の「history questions」（英語では1つの言い方しかない）。コードの中の「出典」（内部の書き方で、画面には出ない）。

## A. 画面の目（ui-critic 32回目、11/6 21:23。帳場のデモの続き、最初の案・△を選んだ・△を記録した。`78-choba-evening/`）

- **判定:** 帳場の見た目は台帳らしく、朱は印だけ。最初の案は、何を見て何を押すかが手順の一〜五で分かる。
- **見つけたこと・直したこと（`app/choba/page.tsx`・`judge-form.tsx`）:**
  1. △ を記録したあとのお知らせが「このデモでは弟子の読み取りは行いません（公開版のライブでは行います）」で、心得帳がどうなるかを言っていない（スマホでは右の欄の説明がずっと下）。→「このデモでは心得帳は書き足されません（公開版のライブでは、弟子がこの印を読み取り、心得帳に書き足します）。」にした。
  2. 「変化」の欄の「直したのは、別の場面（…）の案」が、心得帳・暖簾を継ぐの「出どころ」と違う言い方。→「出どころ：別の場面（…）の案への直し（師匠 △、…）」にした。
  3. 一言の欄が「なくても送れます」で、ボタンは「△ で記録する」。→「一言（なくても記録できます）」にそろえた。
  - 動画 s05 に映るので、`--only s05-choba` で録り直した（記録済みのデータ）。静止画 `s05-choba-a32-{6,20}.jpg` で、出どころの行が1行に収まり、配置は同じ。テスト 316 件、tsc と lint が通った。
- **直さなかったこと:**
  - 「いつ（時期）」を「変わったところ：いつ」にする件。欄の名前の付け方を変えることになる（ほかの行の名前とそろえる必要がある）ので、11/7 以降に回す。
  - 「取り消す」「案内を閉じる」「ここで区切る」の押しやすさ。帳場の配置の余白が変わり、s05 に映るので見送った。「ここで区切る」の意味は、押したあとの画面が説明している（11/6 昼の直し）。
  - 記録済みの s05 では右の欄が空で、字幕の新しい一文（「弟子はその一言を読み取り…」）と画面が合わない。11/7 のライブ撮影で一言を打ち、右の欄に読み取りが出たところにこの一文を合わせる（`final-day.md` の 5 (b) と同じ確かめ）。

## B. 審査員の目（judge-critic 22回目、11/6 21:38。20:53 からの差分）

- **見つけたこと・直したこと:**
  1. 11/7 の s05 で一言を打てず「一言なし」に戻った場合や、「このデモでは心得帳は書き足されません」が映った場合、新しい一文（「弟子はその一言を読み取り、心得帳に書きました。」）が画面と食い違う。→ `video/README.md` の 11/7 の確かめに1項を足した。その撮り方になったら「弟子はその △ の意味を読み取り、心得帳に書きました。」に替えて、ナレーションを作り直す。
  2. `78-choba-evening/` の写真が、A 32 の直しの前のものだった。→ 撮り直した。
  3. README は「キーなしで記録済みデータで動く」とだけ書いていた。新しい帳場の一文（心得帳は書き足されない）は、キーなしで手元で動かした人だけに出る。→ README（日英）の「手元で動かす」に、キーなしでは印は記録されるが読み取られず、心得帳は増えないことを足した。
  4. 出どころの説明が、帳場・暖簾を継ぐでは「直し」、心得帳では「印」。→ 心得帳を「師匠の直し（印と、一言があればそれも）」にした。s06 に映るので録り直した（`s06-kokoroe-b19-7.5.jpg`）。
  - テスト 316 件、tsc が通った。
- **直さなかったこと:** 記録済みの帳場で「ここでは学ばない」が3か所に出る件。重なっているだけで食い違いではないので、そのままにした。

## C. 体験の目（17回目、11/6 21:53。暖簾を継ぐに、台帳にある事実をライブで聞く。本番ビルド・127.0.0.1。`79-experience-ledger-ask/` → `79-experience-ledger-ask-fixed/`）

- **測り方:** `--marks "○" --cards 1 --read 4 --client 港北精機 --ask "港北精機さんとの打ち合わせ、Zoom でも大丈夫ですか？"`。2回（直す前と後）で $0.023＋$0.012。結果は `docs/results/experience-2026-11-06T2153.json`・`…T2155.json`。
- **秒数:** 最初の案 4.9 秒、○ → 次の案 0.5 秒、暖簾を継ぐの答え 3.4 秒・3.1 秒。
- **見つけたこと（不具合）:** ライブの答えで、台帳から写した事実（「情報セキュリティ規程で Zoom 不可、Teams のみ」）の根拠のカードが「出どころ：師匠の直し（心得帳に書いた日 2026-11-03）」になっていた。ライブの根拠は出典を「取引先台帳」と書き、記録済みの答えは「台帳（…）」と書く。今夜の直し（A 29）は「台帳」で始まるものだけを台帳とみなしていたため、ライブでは見分けられなかった。要約の行の「取引先台帳の決まりごと」の数え方も同じだった。
- **直したこと（`app/noren/page.tsx`）:** 「台帳」「取引先台帳」のどちらで始まっても台帳の事実とみなすようにした（カードと要約の行の両方）。テスト `tests/noren-source.test.ts`（2件: 両方の書き方、師匠の判定は台帳ではない）を足した。作り直したイメージで同じ質問をし、「出どころ：取引先台帳」（日付なし）になったことを確かめた。テスト 318 件、tsc と lint が通った。
- **直さなかったこと:** 1回目の答えに「きっかけは未記入です」という言い方があった（2回目にはない）。後任のプロンプトは「（未記入）」という記号を出さないように言っており、今回のは普通の文の中の言い方。ライブの答えの揺れの範囲として、記録だけにした。

## D. 通しの目（22回目、11/6 22:08。C 17 と同じ食い違いがほかにないか、内部の言葉が見える所に残っていないか）

- **たどり方:** 出どころ（出典）を読み分けるコードを検索した（C 17 の不具合と同じ形がないか）。あわせて「明示的な制約」が、画面・README・記録済みの答えのどこに見えるかを調べた。
- **見つけたこと:**
  - 出典を読み分けるのは暖簾を継ぐの2か所だけで、どちらも C 17 で直してある。
  - 記録済みの答えでは、「明示的な制約」は出典の中だけにある。画面では「取引先台帳」と出るので、見えない。
  - 見える所に残っていたのは、README（日英）の数字の表の見出し「Before（台帳と明示的な制約だけ）」「Before (ledger + explicit constraints)」だけ。稽古の記録の画面では「はじめ（台帳だけ）」。
- **直したこと:** 表を作る側（`eval/readme-results.ts`、見出しの文言だけ）と README を「Before（取引先台帳だけ）」「Before (client ledger only)」にした。テスト 318 件が通った（README の区画の一致も）。
- **直さなかったこと:**
  - 学習の中の出典の書き方（`src/learning/compile.ts` の「台帳（取引先台帳の明示的な制約）」）。弟子と後任のプロンプトに入る文で、変えると評価に触れる。後任には D-054 の2つ目の追記で言わないように言ってあり、画面はどこも言い換えて出している。
  - 記録済みのデータの中の同じ文字列（画面には出ない）。

## A. 画面の目（ui-critic 33回目、11/6 22:23。暖簾を継ぐと 404、ダークのスマホを中心に。`80-noren-404-night/`）

- **判定:** 出どころの2つの行（師匠の直しは日付つき、取引先台帳は日付なし）は自然に対で読める。ダークの読みやすさも問題なし。
- **見つけたこと・直したこと:**
  1. 答えの文は「2026-11-03に…改められました」、出どころは「心得帳に書いた日 2026-11-03」。同じ日付が2つの出来事に見える。→ 出どころを「師匠の直し（2026-11-03）」にした（`app/noren/page.tsx`）。s07 に映るので録り直した（`s07-noren-item25-10.jpg`）。
  2. 404 の本文が、すぐ上のナビの4つの名と「最初の画面に戻る」を繰り返していた。→「アドレスが違うか、なくなった頁です。上の見出しから選んでください。」にした（`app/not-found.tsx`）。
  - テスト 318 件、tsc と lint が通った。
- **直さなかったこと:**
  - 記録済みの答えの本文が、旧い心得を「悪い知らせは確定前に全容を伝えて相談する」と短く引き、根拠のカードの「前は」は全文。記録した答えはそのときのモデルの出力なので、書き換えない（記録の改ざんになる）。カードの上の「記録したときの心得帳の言い回しです」で、カードの側が記録だと分かる。
  - スマホで「心得帳あり」が先に来る並び（11/5 に、よい答えを先に見せると決めたもの）。動画はデスクトップで撮る。
  - 「尋ねる」の押しやすさ。行全体が押せるボタンで、「尋ねる」は飾りの文字（`aria-hidden`）。

## B. 審査員の目（judge-critic 23回目、11/6 22:38。21:38 からの差分）

- **見つけたこと・直したこと:**
  1. D 22 で README の Before を「取引先台帳だけ」「client ledger only」にした。誤りではないが、D-011 の Before は「台帳＋明示的な制約（使える道具・書式の指定・繁忙期・担当の異動・代替わり）」をわざと強めにしたもので、「だけ」はそれを隠す。動画（s08b の字幕）と稽古の記録の画面とも名が違った。→ 一つの名にそろえた。
     - README の表（作る側 `eval/readme-results.ts` も）: 「Before（取引先台帳と、その制約）」「Before (client ledger, with its constraints)」
     - 稽古の記録の表の見出し: 「はじめ（台帳と、その制約）」
     - s08b のナレーション: 「台帳と制約だけの弟子は」（11/7 に作り直す）
     - s08b を録り直した（`s08b-keiko-a31-5.jpg`、配置は同じ）。
  2. README の「キーなしでは」は、コードより狭い（`KOKOROE_LIVE=1` がなければ、キーがあっても同じ動き。`src/server/session.ts`）。→「この2つがなければ」「Without both」にした。
  - テスト 318 件、tsc が通った。
- **直さなかったこと:**
  - 帳場の「公開版のライブでは」。キーを入れた手元でもライブになるが、画面の言い方としては誤りではない。
  - `video/scenes/s09-numbers.html` の「台帳と制約だけの弟子」。今の動画では使っていない場面。

## C. 体験の目（18回目、11/6 22:53。今夜の後任のプロンプトの変更のあと、値引きの質問をライブで。本番ビルド・127.0.0.1。`81-experience-price-ask/`）

- **測り方:** `--marks "○" --cards 1 --read 4 --client 大河原建材 --ask "大河原建材さんの次の見積り、先に5%値引きすると伝えておいていいですか？"`。費用 $0.022。結果は `docs/results/experience-2026-11-06T2253.json`。
- **秒数:** 暖簾を継ぐの答え 3.1 秒。
- **見つけたこと:** 値引きは師匠へ、が保たれている。「いいえ」で始まり、「値引きなどの価格や契約条件は、後任の三上さんだけでは決められず、師匠の判断が必要です。5%値引きを先に伝えるのはやめてください。」。根拠の心得は「出どころ：取引先台帳」で日付なし（C 17 の直しのとおり）。値引きの記録がないことも正直に言っている。
- **直したこと:** なし。
- **直さなかったこと:** 答えの「この心得は全場面に当てはまります」の「全場面」は、心得帳の書き方（適用: 全場面）に近い言葉。普通の文としても読めるので、プロンプトは変えない（05:00 までに直すなら hitl-reviewer と確かめが要る）。

## D. 通しの目（23回目、11/6 23:08。凍結の報告の中間版が、Kento の OK の時点の main と合っているか）

- **たどり方:** `docs/freeze-report.md`（Kento が OK して公開版を作り直すときに読むもの）を、19:00 以降のログと照らした。
- **見つけたこと:** 中間版は 19:00 で止まっていた。そのあとの直し（暖簾を継ぐの出どころの不具合、心得帳・帳場・稽古の記録の文言、README・提出、台本、ライブの確かめ4回）が載っていない。テストの数も 316 のまま（いまは 318）。
- **直したこと:** 「11/6 夜 19:00〜23:10」の節を足した。どれも表示・文言・台本だけで、弟子・学習・評価は変えていないと明記した。確かめの行を 318 件にし、題に「23:10 に追記」と入れた。
- **直さなかったこと:** なし。

## A. 画面の目（ui-critic 34回目、11/6 23:23。凍結の確かめの3回目。本番ビルド・記録済みデータの 24 枚を `71-freeze-check-2/` と比べた。`82-freeze-check-3/`）

- **判定（直す前）:** まだ作り直さない。スマホの稽古の記録だけが崩れた。
- **見つけたこと:** スマホの稽古の記録が横にはみ出していた（写真の幅 794px。ほかは 780px）。B 23 で表の見出しを「（台帳と、その制約）」と長くしたが、一行で折らない指定（`whitespace-nowrap`）のままだった。ほかの画面（帳場・心得帳・暖簾を継ぐ・最初の画面）は、今夜の文言の変更で崩れていない。
- **直したこと（`app/keiko/page.tsx`）:** 見出しを「（台帳と、」「その制約）」の2つの塊にし、その間で折れるようにした。撮り直すと、スマホの写真 12 枚がすべて 780px にそろった。デスクトップ（s08b の静止画）は変わらない。テスト 318 件と tsc が通った。
- **判定（直したあと）:** 作り直してよい。
- **直さなかったこと:** 見出しの「経緯／ごと」がスマホで行の端で分かれる件。読みにくくはない。

## B. 審査員の目（judge-critic 24回目、11/6 23:38。README.ja を頭から通して）

- **数字:** 55→64%、70→92%、0→5.3/8、約114回（110〜120）、18件中15件などは、画面と記録にすべて合っている。
- **見つけたこと・直したこと（README.ja、対応する README.md も）:**
  1. 「いつ、師匠のどの印と一言から」が、一言が必ずあるように読める（同じ README と心得帳の画面には「一言なし」の心得がある）。→「どの印（と、あれば一言）から」。英語も。
  2. Skill と MCP の例に心得の番号（K-011・K-018）が出ていた（D-053 で画面からは外したもの）。Skill だけの答えの言い方も、最初の画面の記録された答え（「電話だけでは足りない可能性が高い…」）と違った。→ 番号を外し、心得の文で書き、答えを記録どおりにした。
  3. 「台帳の心得のトレードオフ」という名は、画面の「台帳から写した事実」と違う。→「台帳の事実のトレードオフ」にし、心得帳の中に分けて置いていることを書いた。
  4. 「アプリの中で Claude が書くもの」に「全社共通の心得の提案」が入っていたが、同じ README が「帳場の画面にはまだありません」と書いている。→ 学習のループ（評価）の側に移した。
  5. 「一週間で作れたのは…任せられたからです」は、測っていない因果（D-062）で、公開・動画もまだ途中。→「Claude Code には作業だけでなく、守る仕組み（フック・テスト・レビューのサブエージェント）も任せました。」英語も同じ。
  6. 「ココロエがすること」に環境変数とテストの話（`KOKOROE_EVAL_VISIT`）があった。説明のない `field` の一行が残っていた。D-番号が何かの説明がなかった。→ 訪問の段落を普通の言葉で短くした。`field` の行を消した（日英）。冒頭に「本文の D-0xx は docs/decisions.md の決定記録の番号」を足した（英語も）。
  - あわせて、帳場のデモの手順の二を「違えば △・× で直す（一言は任意）」にした（デモの続きだけに出る案内で、s05 には映らない）。
  - テスト 318 件、tsc と lint が通った。
- **直さなかったこと:** なし。

## C. 体験の目（19回目、11/6 23:53。作り直しの前に、今夜の変更のあとの審査用の枠を、もう一度ライブで。本番ビルド・127.0.0.1。`83-experience-judge-late-night/`）

- **測り方:** `--judge-code <使い捨て> --judge-late --visitor-cap 0 --cap 0.5 --marks "×,○" --cards 2 --read 4`（C 13 と同じ。来場者の上限 $0 で始め、1枚目のあとにコードを入れる）。2回（直す前と後）で、来場者 $0、審査員 $0.024＋$0.016。結果は `docs/results/experience-2026-11-06T2355.json`・`…T2359.json`。
- **秒数:** コードを入れたあと、○ → 次の案 2.9 秒（ライブ、審査員の枠）。
- **見つけたこと:**
  - 上限のお知らせと審査員への一文（A 27 の文）、コードを入れたあとに古いお知らせが消えること（C 13）は、今夜の変更のあとも保たれている。
  - ただ、上限のあいだに付けた1枚目の下の文が、お知らせが消えると、今夜の A 32 で変えた「このデモでは心得帳は書き足されません（公開版のライブでは…）」になった。公開版のライブにいる審査員には誤り。
- **直したこと（`app/choba/page.tsx`）:** ライブが有効なサーバーで読み取られなかった印は、上限のためだけに起きる。その場合は「上限に達していたため、この印は読み取っていません。次の印からは読み取ります。」と出す。キーなしの手元（ライブが無効）だけ「このデモでは…」。作り直したイメージで同じ手順を回し、新しい文になったことを確かめた。テスト 318 件、tsc と lint が通った。
- **直さなかったこと:** なし。

## D. 通しの目（24回目、11/7 00:08。凍結の報告の中間版を、Kento の OK の時点の main に合わせる）

- **たどり方:** `docs/freeze-report.md` を、23:10 以降のログ（A 34・B 24・C 19）と照らした。
- **見つけたこと:** 中間版の確かめの行と差分が 23:10 で止まっていた。スマホの稽古の記録のはみ出し（作り直す前に直す必要があったもの）、README を通しで直したこと、帳場の文の不具合（C 19）が載っていない。
- **直したこと:** 「11/6 23:10〜11/7 00:10」の節を足し、確かめの行を 00:10 時点（318 件、凍結の確かめ3回目、審査用の枠の再確認）にした。
- **直さなかったこと:** なし。
- **日付が変わった:** API の1日の費用は 11/7 の分として数え直す（11/6 の回転の分は約 $0.61、上限 $5 の内）。11/7 は `eval:final`（見積り $9.75）が別にあるので、回転の C は今日も1回 $0.5・計 $5 の内に抑える。

## A. 画面の目（ui-critic 35回目、11/7 00:23。帳場のデモの続き、手順の案内とあとのお知らせ。`84-choba-guide-night/` → `84-choba-guide-night-fixed/`）

- **判定:** 手順の二（一言は任意）は、下の欄・ボタンと合っている。× のあと何が起きたか、次に何をするかも一目で分かる。崩れなし。
- **見つけたこと:**
  1. 手順の四「心得帳に経緯ごと残る」と、すぐ下のお知らせ「このデモでは心得帳は書き足されません」が逆を言う（キーなしの手元のとき）。
  2. お知らせの括弧（「公開版のライブでは、弟子がこの印を読み取り…」）が、右の欄の例の説明とほぼ同じ文。デスクトップでは「す）。」だけが次の行に残る。
  3. 二が長くなり、案内が3段になって、五が一つだけ残った。
- **直したこと（`app/choba/demo-guide.tsx`・`page.tsx`）:**
  1. ライブが無効のときだけ、四を「心得帳に経緯ごと残る（ライブ版で）」にした（公開版のデモの続きはライブで読み取るので、そのまま）。
  2. お知らせを「このデモでは心得帳は書き足されません（書き足しはライブ版で）。」に縮めた。1行に収まる。
  3. 二を「違えば △・×（一言は任意）」にした。案内は2段（3つと2つ）に戻った。
  - 作り直したイメージで撮り直して確かめた。テスト 318 件、tsc と lint が通った。デモの続きの案内とお知らせは s05（お試し）には映らない。
- **直さなかったこと:** スマホで記録のあとにお知らせまで戻るか（全体の写真では判断できない。11/5 の ScrollToAction で上に戻している）。
