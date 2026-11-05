# UI polish log (branch `ui-polish`, from 11/4 until the feature freeze on 11/6)

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

## 池田さんに判断してほしいこと

（まだありません）
