import { describe, expect, it } from "vitest";
import { citationParts } from "@/src/lib/plain";

/** 体験の目 17 (11/6): live citations say 「出典: 取引先台帳」, recorded ones 「出典: 台帳（…）」; both are ledger facts on 暖簾を継ぐ. */
const isLedger = (h: string) => /^(取引先)?台帳/.test(citationParts(h).source ?? "");

describe("暖簾を継ぐ: ledger citations, live and recorded", () => {
  it("recognises both spellings of the ledger source", () => {
    expect(isLedger("新「Zoom 不可」・日付: 2026-11-03・出典: 取引先台帳")).toBe(true);
    expect(isLedger("新「Zoom 不可」・日付: 2026-11-03・出典: 台帳（取引先台帳の明示的な制約）")).toBe(true);
  });
  it("treats the master's judgment as not a ledger fact", () => {
    expect(isLedger("新「…」・きっかけ: …・日付: 2026-11-03・出典: 師匠の判定")).toBe(false);
  });
});
