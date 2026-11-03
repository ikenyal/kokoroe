/**
 * Words on screen, not internal ids (Kento 11/4): rule ids (K-…), judgment/scene ids and decision-record ids (D-…) belong to
 * the repository. These helpers clean text that comes from the model or from recorded data before it is shown.
 */

/** 「K-004 の沿革は…（台帳に記録、日付 2026-11-03）」 → 「沿革は…」. */
export function plainText(t: string) {
  return t
    .replace(/[（(][^（）()]*日付[^（）()]*[）)]/g, "")
    .replace(/K-\d{3,}\s*の\s*/g, "")
    .replace(/[（(]\s*K-\d{3,}(\s*[、,・]\s*K-\d{3,})*\s*[）)]/g, "")
    .replace(/K-\d{3,}/g, "心得");
}

/** 「…台帳（D-033）、…」 → 「…台帳、…」. */
export const noDecisionIds = (t: string) => t.replace(/[（(〈]\s*D-\d{3}\s*[）)〉]/g, "").replace(/D-\d{3}/g, "");

/**
 * A citation's 沿革 line 「新「…」・きっかけ: …・日付: …・出典: …」 in parts. The date is when it was written into the 心得帳, not
 * when it happened (that is in the きっかけ), so the page labels it so.
 */
export function citationParts(h: string) {
  const seg = (k: string) => h.match(new RegExp(`${k}[:：]\\s*([^・]+)`))?.[1]?.trim() ?? null;
  return { rule: h.match(/新「([^」]+)」/)?.[1] ?? plainText(h), before: h.match(/旧「([^」]+)」/)?.[1] ?? null, why: seg("きっかけ"), written: seg("日付"), source: seg("出典") };
}
