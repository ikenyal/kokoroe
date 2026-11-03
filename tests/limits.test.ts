import { describe, expect, it, vi } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

describe("public-demo limits (D-032)", () => {
  it("caps live calls per session, per IP per hour, and per day by spend", async () => {
    vi.stubEnv("KOKOROE_DATA_DIR", mkdtempSync(path.join(tmpdir(), "kokoroe-lim-")));
    vi.stubEnv("KOKOROE_SESSION_CALLS", "2");
    vi.stubEnv("KOKOROE_IP_CALLS_PER_HOUR", "3");
    vi.stubEnv("KOKOROE_DAILY_USD", "0.01");
    vi.resetModules();
    const { reserve, recordSpend, dailyExhausted } = await import("@/src/server/limits");
    expect(reserve("s1", "1.1.1.1")).toBeNull();
    expect(reserve("s1", "1.1.1.1")).toBeNull();
    expect(reserve("s1", "1.1.1.1")).toBe("session"); // 3rd call in the same session
    expect(reserve("s2", "1.1.1.1")).toBeNull(); // 3rd call from this IP
    expect(reserve("s3", "1.1.1.1")).toBe("ip");
    expect(reserve("s4", "2.2.2.2")).toBeNull();
    recordSpend([{ model: "claude-sonnet-5-5", input_tokens: 0, output_tokens: 2000 }]); // $0.02
    expect(dailyExhausted()).toBe(true);
    expect(reserve("s5", "3.3.3.3")).toBe("daily");
    vi.unstubAllEnvs();
  });
});

describe("client IP behind the load balancer (spoof-resistant)", () => {
  it("uses the entry appended by the trusted proxy (from the end), not what the client put first", async () => {
    const { trustedClientIp } = await import("@/src/server/limits");
    // Lightsail LB appends the real client IP; a visitor may prepend anything.
    expect(trustedClientIp("203.0.113.7")).toBe("203.0.113.7");
    expect(trustedClientIp("1.2.3.4, 203.0.113.7")).toBe("203.0.113.7"); // spoofed first entry is ignored
    expect(trustedClientIp("9.9.9.9, 8.8.8.8, 203.0.113.7")).toBe("203.0.113.7");
    expect(trustedClientIp(" 1.2.3.4 ,203.0.113.7 ")).toBe("203.0.113.7");
    expect(trustedClientIp(null)).toBe("direct");
    expect(trustedClientIp("")).toBe("direct");
    // Two trusted hops (e.g. a CDN in front of the LB): take the second from the end.
    expect(trustedClientIp("1.2.3.4, 203.0.113.7, 198.51.100.9", 2)).toBe("203.0.113.7");
  });
  it("rotating a spoofed first entry does not get around the per-IP limit", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const path = (await import("node:path")).default;
    vi.stubEnv("KOKOROE_DATA_DIR", mkdtempSync(path.join(tmpdir(), "kokoroe-ip-")));
    vi.stubEnv("KOKOROE_IP_CALLS_PER_HOUR", "2");
    vi.stubEnv("KOKOROE_SESSION_CALLS", "100");
    vi.resetModules();
    const { reserve, trustedClientIp } = await import("@/src/server/limits");
    const results = ["10.0.0.1", "10.0.0.2", "10.0.0.3"].map((fake, i) => reserve(`s${i}`, trustedClientIp(`${fake}, 203.0.113.7`)));
    expect(results).toEqual([null, null, "ip"]);
    vi.unstubAllEnvs();
  });
});

describe("session starts per IP (audit 2026-11-03)", () => {
  it("caps how many sessions one address can start in an hour; other addresses are unaffected", async () => {
    vi.stubEnv("KOKOROE_DATA_DIR", mkdtempSync(path.join(tmpdir(), "kokoroe-lim-")));
    vi.stubEnv("KOKOROE_IP_STARTS_PER_HOUR", "2");
    vi.resetModules();
    const { reserveStart } = await import("@/src/server/limits");
    expect(reserveStart("9.9.9.9")).toBe(true);
    expect(reserveStart("9.9.9.9")).toBe(true);
    expect(reserveStart("9.9.9.9")).toBe(false);
    expect(reserveStart("8.8.8.8")).toBe(true);
  });
});
