/**
 * 審査用のコード (Kento 11/6): a judge's session draws on its own daily budget; visitors using up theirs does not stop judges, and
 * the other way round. The code is compared in constant time, tries are limited, and a cookie cannot be forged without the code.
 * Only where the spend is counted changes.
 */
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const CODE = "test-judge-code-123";

async function fresh(env: Record<string, string>) {
  vi.resetModules();
  const dir = mkdtempSync(path.join(tmpdir(), "kokoroe-judge-"));
  Object.assign(process.env, { KOKOROE_DATA_DIR: dir, KOKOROE_DAILY_USD: "1", KOKOROE_JUDGE_DAILY_USD: "1", KOKOROE_JUDGE_TRIES_PER_HOUR: "3", ...env });
  const limits = await import("@/src/server/limits");
  const judge = await import("@/src/server/judge");
  return { limits, judge, file: path.join(dir, "limits.json") };
}

// One call priced well over $1 (sonnet-sized tokens): enough to use up a $1 budget.
const big = [{ model: "claude-sonnet-5-5", input_tokens: 2_000_000, output_tokens: 200_000 }] as never;

afterEach(() => {
  for (const k of ["KOKOROE_DATA_DIR", "KOKOROE_DAILY_USD", "KOKOROE_JUDGE_DAILY_USD", "KOKOROE_JUDGE_TRIES_PER_HOUR", "KOKOROE_JUDGE_CODE"]) delete process.env[k];
});

describe("審査用のコード: checking the code and the cookie", () => {
  it("matches only the configured code, and nothing when no code (or a short one) is set", async () => {
    const { judge } = await fresh({ KOKOROE_JUDGE_CODE: CODE });
    expect(judge.codeMatches(CODE)).toBe(true);
    expect(judge.codeMatches(` ${CODE} `)).toBe(true); // a pasted code with spaces
    expect(judge.codeMatches("test-judge-code-124")).toBe(false);
    expect(judge.codeMatches("")).toBe(false);
    expect(judge.codeMatches(CODE, "")).toBe(false);
    expect(judge.codeMatches("short", "short")).toBe(false);
  });

  it("a cookie is valid only for the current code", async () => {
    const { judge } = await fresh({ KOKOROE_JUDGE_CODE: CODE });
    const t = judge.judgeToken();
    expect(judge.tokenValid(t)).toBe(true);
    expect(judge.tokenValid(t.slice(0, -1) + (t.endsWith("0") ? "1" : "0"))).toBe(false);
    expect(judge.tokenValid(judge.judgeToken("another-code-456"))).toBe(false);
    expect(judge.tokenValid(undefined)).toBe(false);
    expect(judge.tokenValid(t, "")).toBe(false);
  });

  it("tries are limited per address per hour", async () => {
    const { limits } = await fresh({ KOKOROE_JUDGE_CODE: CODE });
    expect([1, 2, 3, 4].map(() => limits.reserveJudgeTry("1.2.3.4"))).toEqual([true, true, true, false]);
    expect(limits.reserveJudgeTry("5.6.7.8")).toBe(true); // another address
  });
});

describe("審査用のコード: a separate daily budget", () => {
  it("visitors using up their day does not stop a judge's session", async () => {
    const { limits } = await fresh({ KOKOROE_JUDGE_CODE: CODE });
    expect(limits.reserve("visitor", "1.1.1.1")).toBeNull();
    limits.recordSpend(big, "visitor");
    expect(limits.reserve("visitor", "1.1.1.1")).toBe("daily");
    expect(limits.reserve("judge", "2.2.2.2", { judge: true })).toBeNull();
    // Later calls of the judge's session (e.g. background work) are recognised by its id alone.
    expect(limits.reserve("judge", "2.2.2.2")).toBeNull();
  });

  it("a judge's spend is counted to the judges' budget, not the visitors'", async () => {
    const { limits, file } = await fresh({ KOKOROE_JUDGE_CODE: CODE });
    expect(limits.reserve("judge", "2.2.2.2", { judge: true })).toBeNull();
    limits.recordSpend(big, "judge");
    const c = JSON.parse(readFileSync(file, "utf8"));
    expect(c.usd).toBe(0);
    expect(c.judgeUsd).toBeGreaterThan(1);
    expect(limits.reserve("judge", "2.2.2.2")).toBe("daily"); // the judges' own budget runs out
    expect(limits.reserve("visitor", "1.1.1.1")).toBeNull(); // visitors are not affected
  });

  it("a judge's session has no per-session cap; the per-IP cap stays", async () => {
    const { limits } = await fresh({ KOKOROE_JUDGE_CODE: CODE, KOKOROE_SESSION_CALLS: "2", KOKOROE_IP_CALLS_PER_HOUR: "3" });
    expect([1, 2, 3].map(() => limits.reserve("judge", "9.9.9.9", { judge: true }))).toEqual([null, null, null]);
    expect(limits.reserve("judge", "9.9.9.9", { judge: true })).toBe("ip");
    delete process.env.KOKOROE_SESSION_CALLS;
    delete process.env.KOKOROE_IP_CALLS_PER_HOUR;
  });
});

describe("審査用のコード: nothing else depends on it", () => {
  it("drafting, learning, the successor, the safety floor and the evaluation never import the judge module", () => {
    const root = path.join(__dirname, "..");
    const files = ["src/disciple", "src/learning", "src/successor", "eval"].flatMap((d) => {
      const walk = (p: string): string[] =>
        statSync(p).isDirectory() ? readdirSync(p).filter((f) => f !== "runs").flatMap((f) => walk(path.join(p, f))) : /\.tsx?$/.test(p) ? [p] : [];
      return walk(path.join(root, d));
    });
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toMatch(/server\/judge|KOKOROE_JUDGE/);
  });
});

describe("limits from the environment", () => {
  it("a value that is not a number falls back to the default instead of turning a cap off", async () => {
    const { limits } = await fresh({ KOKOROE_JUDGE_CODE: CODE, KOKOROE_JUDGE_DAILY_USD: "ten" });
    expect(limits.LIMITS.judgeDailyUsd).toBe(10);
  });
});
