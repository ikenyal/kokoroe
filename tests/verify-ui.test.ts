import { beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Proposal } from "@/src/core/types";

/** The 帳場's step-by-step 確かめ稽古 + regression (D-037), with the apprentice and interpreter mocked (no API). */
const base: Proposal = {
  channel: "phone", meeting: "in_person", formalTo: "contact", backchannelTo: "decider", timing: "now", followUp: true,
  format: "not_applicable", posture: [], escalateToMaster: false, message: "", basedOnRules: [],
};
let draftFor: (sceneId: string) => Proposal = () => base;

vi.mock("@/src/disciple/v1", () => ({
  makeDiscipleV1: () => ({ name: "mock", usage: [], propose: async (scene: { id: string }) => draftFor(scene.id) }),
}));
vi.mock("@/src/learning/interpret", () => ({
  interpret: async () => ({
    diagnosis: "狭める", ambiguous: false, confidence: "medium",
    candidates: [{ action: "revise", targetRuleId: "K-001", scope: { clientId: "C06", sceneTypes: ["T4"] }, text: "新しい提案は蔵元にも一言（狭めた）", when: null, fix: { field: "backchannelTo", value: "decider" } }],
  }),
}));

async function setup() {
  const dir = mkdtempSync(path.join(tmpdir(), "kokoroe-vui-"));
  vi.stubEnv("KOKOROE_DATA_DIR", dir);
  vi.resetModules();
  const { TRAIN_SCENES } = await import("@/src/core/world");
  const sid = "00000000-0000-4000-8000-000000000001";
  const scene = (id: string) => TRAIN_SCENES.find((s) => s.id === id)!;
  const sessions = path.join(dir, "sessions");
  mkdirSync(sessions, { recursive: true });
  const rule = {
    id: "K-001", scope: { clientId: "C06", sceneTypes: null }, text: "蔵元にも一言", when: null, status: "active", confidence: "medium",
    sources: [{ kind: "judgment", judgmentId: "J-0002", date: "2026-11-03", sceneId: "T05", verdict: "△", remark: "" }],
    history: [{ date: "2026-11-03", before: null, after: "蔵元にも一言", trigger: null, judgmentId: "J-0002", masterWords: "", reason: "" }],
  };
  const store = {
    rules: [rule],
    judgments: [
      { id: "J-0001", at: "2026-11-03T01:00:00Z", sceneId: "T13", clientId: "C06", sceneType: "T9", proposal: base, verdict: "○", remark: "" },
      { id: "J-0002", at: "2026-11-03T01:05:00Z", sceneId: "T05", clientId: "C06", sceneType: "T4", proposal: { ...base, backchannelTo: null }, verdict: "△", remark: "" },
    ],
  };
  writeFileSync(path.join(sessions, `trial-${sid}.store.json`), JSON.stringify(store));
  const { newVerification } = await import("@/src/server/verify-ui");
  const meta = {
    mode: "trial", createdAt: "x", pos: 2,
    queue: [{ scene: scene("T05"), draft: base }, { scene: scene("T13"), draft: base }],
    pending: [{ judgmentId: "J-0002", sceneId: "T05", status: "verifying", ruleId: "K-001", verify: newVerification({ ruleId: "K-001", action: "add" }, undefined) }],
  };
  writeFileSync(path.join(sessions, `trial-${sid}.meta.json`), JSON.stringify(meta));
  const ui = await import("@/src/server/verify-ui");
  const { openSession, readMeta } = await import("@/src/server/session");
  return { ui, sid, pending: () => readMeta("trial", sid).pending[0], store: () => openSession("trial", sid)!.store };
}

describe("帳場: 確かめ稽古 + regression, one tap at a time", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("confirm → changed past ○ asked → × → narrowed once → still changed → × → 差し戻し (rule retired, 沿革 recorded)", async () => {
    draftFor = (id) => (id === "T13" ? { ...base, backchannelTo: null } : base); // the new rule breaks T13's quiet word
    const { ui, sid, pending, store } = await setup();
    await ui.startVerification("trial", sid, "J-0002");
    expect(pending().status).toBe("needs-confirm");
    await ui.afterConfirm("trial", sid, "J-0002", "○", "");
    expect(pending().status).toBe("needs-regression");
    expect(pending().verify?.current?.sceneId).toBe("T13");
    await ui.afterRegression("trial", sid, "J-0002", "×", "裏の一言が消えた");
    expect(pending().verify?.narrowed).toBe(true);
    expect(pending().status).toBe("needs-regression"); // re-checked after narrowing, still changed
    expect((await store().getRule("K-001"))!.text).toContain("狭めた");
    await ui.afterRegression("trial", sid, "J-0002", "×", "");
    expect(pending().status).toBe("rolled-back");
    const k = (await store().getRule("K-001"))!;
    expect(k.status).toBe("retired");
    expect(k.history.at(-1)!.reason).toContain("T13");
    const kinds = (await store().listJudgments()).map((j) => j.kind ?? "draft");
    expect(kinds).toEqual(["draft", "draft", "confirm", "regression", "regression"]);
  });

  it("past ○ with the same decision passes without asking; ends verified", async () => {
    draftFor = () => base;
    const { ui, sid, pending, store } = await setup();
    await ui.startVerification("trial", sid, "J-0002");
    await ui.afterConfirm("trial", sid, "J-0002", "○", "");
    expect(pending().status).toBe("applied");
    expect(pending().note).toContain("確かめ済み（回帰 1 件、師匠に確認 0 件");
    expect((await store().getRule("K-001"))!.status).toBe("active");
  });
});
