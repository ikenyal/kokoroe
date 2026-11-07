import { describe, expect, it } from "vitest";
import { billedChars, fillNumbers, toSsml } from "@/video/narration";

describe("narration SSML (Takumi, 105%, accents; decided 11/4)", () => {
  it("forces readings, longest word first, and escapes the rest", () => {
    const s = toSsml("心得帳と心得と暖簾。○△×と△");
    expect(s).toContain('<phoneme alphabet="x-amazon-pron-kana" ph="ココロエチョー">心得帳</phoneme>と<sub alias="こころえ">心得</sub>と<sub alias="のれん">暖簾</sub>');
    expect(s).toContain('<sub alias="まる、さんかく、ばつ">○△×</sub>と<sub alias="さんかく">△</sub>');
  });
  it("fixes accents with pron-kana, ahead of the plain readings", () => {
    expect(toSsml("師匠の一言")).toContain(
      `<phoneme alphabet="x-amazon-pron-kana" ph="シ'ショー">師匠</phoneme>の<phoneme alphabet="x-amazon-pron-kana" ph="ヒト'コト">一言</phoneme>`,
    );
  });
  it("uses Kento's 11/7 picks: yomigana where Polly's own accent was chosen, and speaks 弟子は without the pause", () => {
    expect(toSsml("取引先とClaude")).toBe('<speak><prosody rate="105%"><phoneme alphabet="x-amazon-yomigana" ph="とりひきさき">取引先</phoneme>と<phoneme alphabet="x-amazon-yomigana" ph="くろーど">Claude</phoneme></prosody></speak>');
    expect(toSsml("弟子は、窓口へ")).toContain(`ph="デシ'ワ">弟子は</phoneme>窓口へ`);
    expect(toSsml("心得帳に残る")).toContain('ph="ココロエチョーニ">心得帳に</phoneme>');
    expect(toSsml("三十年分の作法")).toContain(`ph="サンジューネンブンノサ'ホー">三十年分の作法</phoneme>`);
  });
  it("wraps whole sentences in one prosody and pauses between sentences only", () => {
    const s = toSsml("一つ目。二つ目。");
    expect(s).toBe('<speak><prosody rate="105%">一つ目。<break time="500ms"/>二つ目。</prosody></speak>');
    expect(toSsml("一つ目。二つ目。", 300)).toContain('<break time="300ms"/>');
  });
  it("counts what Polly reads, not the tags", () => {
    expect(billedChars(toSsml("暖簾。"))).toBe("のれん。".length);
  });
});

describe("numbers in the narration come from results.json", () => {
  const r = { official: false, before: { match: 0.55 }, paths: { mean: 0.6444, taps: { mean: 114 } } };
  const text = "{interim}台帳だけの弟子は、{before}%。師匠の{taps}回のタップで、{after}%に。";
  it("says interim numbers are interim", () => {
    expect(fillNumbers(text, r)).toBe("途中経過では、台帳だけの弟子は、55%。師匠の114回のタップで、64%に。");
  });
  it("drops the interim words once the numbers are official", () => {
    expect(fillNumbers(text, { ...r, official: true })).toBe("台帳だけの弟子は、55%。師匠の114回のタップで、64%に。");
  });
});
