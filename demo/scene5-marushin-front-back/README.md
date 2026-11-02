# Demo material — scene 5 candidate: 表と裏 at 丸新酒造 (T05 → T13)

Recorded 2026-11-03 from the first learning-loop run (`eval/runs/2026-11-02T20-10-43-844Z-train-16.json`). Fictional data; the master is the simulator.
Logged as produced — nothing edited. Full data: [log.json](log.json).

## 1. The apprentice drafts (T05, 5月, 新しい提案)
> 丸新酒造に、酒税の申告に使う数字を自動で集計する仕組みを提案したい。今は奥様が毎月、帳簿から手作業で数字を拾っている。

Formal route: 窓口（蔵元の奥様）· quiet word: **none** · visit in person · follow-up yes.

## 2. The master marks it **△** — and says nothing (一言なし)
(Simulator log: the hidden rule that failed was "formal message via the contact, a quiet word to the decider" — not shown to the apprentice.)

## 3. The interpreter (Opus) reads the △
> 一言がないため推測になる。窓口の奥様に電話で連絡し、訪問して現状を伺う方向性、5月という時期、負担軽減と丁寧な姿勢は概ね合っていたと思われる（△）。欠けていた条件として最も考えられるのは、決裁者である蔵元への配慮である。新しい仕組みの提案は費用や導入判断を伴うのに、宛先が奥様だけで裏の一言も「なし」だった。蔵元を通さずに話を進める形になった点が不足と推測する。

## 4. The kokoroe-chō gets **K-001** (scope: 丸新酒造 only, confidence low)
> 丸新酒造に新しい提案（費用や導入判断を伴うもの）をする場合は、正式な窓口は蔵元の奥様でよい。ただし、決裁者である蔵元にも必ず一言入れる。たとえば訪問時に蔵元へご挨拶し、提案の趣旨を簡単にお伝えする。蔵元を飛ばして奥様だけで話が進む形にはしない。

Source: J-0005 (T05, △).

## 5. Next 丸新酒造 scene (T13, 9月, 根回しが要る件)
> 丸新酒造の販売管理システムを、再来年の春に入れ替える話を進めたい。費用はこれまでで一番大きく、蔵の中でもじっくり話し合ってもらう必要がある。

The apprentice is shown K-001 and cites it. Master: **○**.

| Field | T05 (before) | T13 (after) |
|---|---|---|
| 裏の一言 | null | "decider" |
| 姿勢 | ["offer_explanation","modest","reduce_burden","explain_carefully","ask_process"] | ["modest","offer_explanation","explain_carefully","reduce_burden","prior_summary","ask_process"] |
| 師匠の確認 | false | true |
| 根拠にした心得 | [] | ["K-001"] |

Draft text (T13) now includes: 「その際、蔵元様にもご挨拶をし、趣旨を簡単にお伝えできればと考えております。」

## Notes for the video
- The △ came **without a remark**; the change was inferred from the proposal and the △ alone. If the video should show a one-liner,
  re-record with the candidate-choice flow (the master taps the right reading) rather than editing this log.
- K-001 is long; the short-rule format (D-014) will shorten how it reads on screen.
- In the T13 draft the signature says 篠原 (the master) — drafts are for the master to send. Decide how to present this on screen.
