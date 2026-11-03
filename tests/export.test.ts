import { describe, expect, it } from "vitest";
import { CLIENTS, COMPANY } from "@/src/core/world";
import { assertSkillName, exportSkill, SKILL_NAME, zip } from "@/src/learning/export";
import type { KokoroeRule } from "@/src/learning/types";

const rule = (o: Partial<KokoroeRule>): KokoroeRule => ({
  id: "K-001", scope: { clientId: "C04", sceneTypes: null }, text: "打ち合わせは Teams", when: null, status: "active", confidence: "high",
  sources: [{ kind: "ledger", judgmentId: "LEDGER-C04", date: "2026-11-03", sceneId: "", verdict: null, remark: "" }],
  history: [{ date: "2026-11-03", before: null, after: "打ち合わせは Teams", trigger: "2024年、規程が変わって Zoom が禁止", judgmentId: "LEDGER-C04", masterWords: "", reason: "" }],
  ...o,
});

describe("Agent Skill export", () => {
  it("has a valid name and a what+when description", () => {
    expect(() => assertSkillName(SKILL_NAME)).not.toThrow();
    expect(() => assertSkillName("claude-helper")).toThrow();
    expect(() => assertSkillName("Kokoroe")).toThrow();
    const s = exportSkill([rule({})], CLIENTS, COMPANY);
    const fm = s.files["SKILL.md"].split("---")[1];
    expect(fm).toContain(`name: ${SKILL_NAME}`);
    const desc = fm.match(/description: (.*)/)![1];
    expect(desc.length).toBeLessThanOrEqual(1024);
    expect(desc).toContain("ときに使う");
  });
  it("puts each client's rules with history in clients/<slug>.md and company-wide ones in SKILL.md; skips retired", () => {
    const s = exportSkill(
      [rule({}), rule({ id: "K-002", scope: { clientId: null, sceneTypes: null }, text: "表は窓口、裏で決裁者に一言", sources: [] }), rule({ id: "K-003", status: "retired" })],
      CLIENTS,
      COMPANY,
    );
    expect(Object.keys(s.files).sort()).toEqual(["SKILL.md", "clients/kohoku-seiki.md"]);
    expect(s.files["clients/kohoku-seiki.md"]).toContain("わけ: 2024年、規程が変わって Zoom が禁止");
    expect(s.files["clients/kohoku-seiki.md"]).not.toContain("K-003");
    expect(s.files["SKILL.md"]).toContain("表は窓口、裏で決裁者に一言");
  });
  it("zips with a valid end-of-central-directory record", () => {
    const z = zip({ "SKILL.md": "x", "clients/a.md": "y" }, "k");
    const v = new DataView(z.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint32(z.length - 22, true)).toBe(0x06054b50);
    expect(v.getUint16(z.length - 22 + 10, true)).toBe(2);
  });
});
