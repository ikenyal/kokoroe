import { describe, expect, it } from "vitest";
import { HISTORY_QUESTIONS } from "@/src/core/world";
import { isEitherOr } from "@/src/lib/question";

describe("isEitherOr (暖簾を継ぐ: no はい・いいえ heading above an either/or answer)", () => {
  it("finds either/or questions", () => {
    expect(isEitherOr("浜風運輸さんに、トラブルの第一報はメールとチャットのどちらで送ればいいですか？")).toBe(true);
    expect(isEitherOr("電話とメール、どっちがいい？")).toBe(true);
    expect(isEitherOr("先に蔵元に伝える、それとも奥様に伝える？")).toBe(true);
    expect(isEitherOr("電話か、メールか")).toBe(true);
  });
  it("leaves yes/no questions alone, including every example question on the screen", () => {
    expect(isEitherOr("浜風運輸さんへの遅延の連絡、確定してからまとめて伝えればいいですよね？")).toBe(false);
    expect(isEitherOr("港北精機さんって、昔から Teams しか使えなかったんですか？")).toBe(false);
    expect(isEitherOr("まちなか生協さんの見積り、理事会の前の週に出せば間に合いますか？")).toBe(false);
    expect(isEitherOr("大河原建材の社長、電話の方が早いって言いそうですけど、それでも打ち合わせを入れた方がいいんですか？")).toBe(false);
    expect(isEitherOr("丸新酒造さんへの出荷が1週間遅れそうです。奥様に電話で伝えておけば大丈夫ですよね？")).toBe(false);
  });
  it("none of the history questions offered on the screen counts as either/or", () => {
    for (const q of HISTORY_QUESTIONS) expect(isEitherOr(q.question), q.question).toBe(false);
  });
});
