import { describe, expect, it } from "vitest";
import { billedChars, toSsml } from "@/video/narration";

describe("narration SSML", () => {
  it("forces readings, longest word first, and escapes the rest", () => {
    const s = toSsml("心得帳と心得と暖簾。○△×と一言");
    expect(s).toContain('<sub alias="こころえちょう">心得帳</sub>と<sub alias="こころえ">心得</sub>と<sub alias="のれん">暖簾</sub>');
    expect(s).toContain('<sub alias="まる、さんかく、ばつ">○△×</sub>と<sub alias="ひとこと">一言</sub>');
    expect(s.startsWith("<speak>") && s.endsWith("</speak>")).toBe(true);
  });
  it("counts what Polly reads, not the tags", () => {
    expect(billedChars(toSsml("暖簾。"))).toBe("のれん。".length);
  });
});
