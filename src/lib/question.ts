/**
 * An either/or question (「メールとチャットのどちらで？」「AかBか」): a 「はい・いいえ」 heading reads wrong above its answer, so the
 * 暖簾を継ぐ screen starts with the explanation instead (Kento 11/6, decision 19 (b)). Display only: the successor's prompt and
 * answer schema (yes / no / unknown) are unchanged.
 */
export function isEitherOr(question: string): boolean {
  const q = question.replace(/\s+/g, "");
  if (/どちら|どっち|それとも/.test(q)) return true;
  // 「AかBか」: two 「か」 choices before the end (not the sentence-final question 「…ですか？」 alone).
  return /[^、。？?]+か[、]?[^、。？?]+か[？?。]?$/.test(q) && !/(です|ます|でしょう)か[？?。]?$/.test(q);
}
