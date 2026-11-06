/**
 * 審査用のコード (Kento 11/6, after the organizers' answer: judges get a link that is set up, and the form has a field for their
 * access details). A judge who enters the code gets live calls from a separate daily budget, so visitors using up the public
 * budget do not stop the judges. Only where the spend is counted changes: drafting, interpreting, judging, evaluation and the
 * safety floor (money, contracts, first contact with key clients → the master) are the same for everyone.
 *   - The code is never in the repository: KOKOROE_JUDGE_CODE is set only on the public deployment. Without it, there is no
 *     field and no judge budget.
 *   - Comparison is constant-time (hashes compared with timingSafeEqual), and tries are limited per address per hour.
 *   - On success the browser gets an httpOnly cookie holding an HMAC of a fixed label keyed by the code: it cannot be forged
 *     without the code, and it stops working when the code changes.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const JUDGE_COOKIE = "kokoroe_judge";
const LABEL = "kokoroe-judge-v1";

const secret = () => process.env.KOKOROE_JUDGE_CODE ?? "";
/** The code is set (at least 8 characters, so a short or empty value never opens anything). */
export const judgeEnabled = () => secret().length >= 8;

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

/** Constant-time check of a typed code against the configured one. */
export function codeMatches(input: string, code = secret()): boolean {
  if (code.length < 8) return false;
  return timingSafeEqual(digest(input.trim()), digest(code));
}

/** The cookie value for a valid code. */
export const judgeToken = (code = secret()) => createHmac("sha256", code).update(LABEL).digest("hex");

/** Constant-time check of a cookie value. */
export function tokenValid(token: string | undefined, code = secret()): boolean {
  if (!token || code.length < 8) return false;
  const want = Buffer.from(judgeToken(code), "utf8");
  const got = Buffer.from(token, "utf8");
  return got.length === want.length && timingSafeEqual(got, want);
}

/** This request comes from a browser that entered the code (read during a request only). */
export async function isJudgeRequest(): Promise<boolean> {
  if (!judgeEnabled()) return false;
  return tokenValid((await cookies()).get(JUDGE_COOKIE)?.value);
}
