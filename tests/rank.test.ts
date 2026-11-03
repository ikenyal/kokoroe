import { describe, expect, it } from "vitest";
import { mustReview } from "@/src/disciple/hitl";
import { standing, type Mark } from "@/src/core/rank";

const m = (verdict: Mark["verdict"], i: number, kind: Mark["kind"] = "draft"): Mark => ({ clientId: "C01", sceneType: "T1", verdict, kind, at: `2026-11-04T00:00:${String(i).padStart(2, "0")}Z` });

describe("段位 (by client; Kento 11/4)", () => {
  it("手代 after 2 ○ in a row on drafts; one △ resets", () => {
    expect(standing([m("○", 1), m("○", 2)]).rank).toBe("手代");
    expect(standing([m("○", 1), m("○", 2), m("△", 3)]).rank).toBe("見習い");
  });
  it("番頭 needs 5 ○ in a row and a passed 確かめ; a ○ on a re-check does not lengthen the streak", () => {
    const five = [1, 2, 3, 4, 5].map((i) => m("○", i));
    expect(standing(five).rank).toBe("手代");
    expect(standing([...five, m("○", 6, "confirm")]).rank).toBe("番頭");
    expect(standing([m("○", 1), m("○", 2, "confirm"), m("○", 3, "regression")]).streak).toBe(1);
  });
  it("undone marks do not count", () => {
    expect(standing([m("○", 1), { ...m("○", 2), undone: "x" }]).rank).toBe("見習い");
  });
});

describe("the review floor holds at any rank (code, like D-044)", () => {
  const scene = { type: "T1" as const, situation: "納期が遅れる", clientId: "C01" };
  const p = { message: "ご連絡です", escalateToMaster: false };
  it("money / contract, escalations and first contacts must be seen by the master", () => {
    expect(mustReview({ ...scene, type: "T3" }, p, new Set(["C01"])).why).toBe("money");
    expect(mustReview(scene, { ...p, message: "値引きします" }, new Set(["C01"])).why).toBe("money");
    expect(mustReview(scene, { ...p, escalateToMaster: true }, new Set(["C01"])).why).toBe("escalated");
    expect(mustReview(scene, p, new Set()).why).toBe("first-contact");
    expect(mustReview(scene, p, new Set(["C01"])).must).toBe(false);
  });
});
