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
