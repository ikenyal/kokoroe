import { describe, expect, it } from "vitest";
import { CLIENTS, EVAL_SCENES, TRAIN_SCENES, getClient } from "@/src/core/world";
import { SCENE_TYPE_LABELS, type SceneType } from "@/src/core/types";
import { judge, PREDICATE_IDS } from "@/eval/simulator/judge";
import { SCENE_KEYS } from "@/eval/simulator/hidden";
import { IDEAL_TRAIN } from "./fixtures/ideal-proposals-train";

describe("train set design", () => {
  it("has 40 scenes T01–T40 in id order, all marked train", () => {
    expect(TRAIN_SCENES).toHaveLength(40);
    expect(TRAIN_SCENES.map((s) => s.id)).toEqual(Array.from({ length: 40 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`));
    for (const s of TRAIN_SCENES) expect(s.set).toBe("train");
  });
  it("has exactly 4 scenes per client", () => {
    for (const c of CLIENTS) expect(TRAIN_SCENES.filter((s) => s.clientId === c.id), c.id).toHaveLength(4);
  });
  it("covers every scene type at least 3 times", () => {
    for (const t of Object.keys(SCENE_TYPE_LABELS) as SceneType[]) {
      expect(TRAIN_SCENES.filter((s) => s.type === t).length, t).toBeGreaterThanOrEqual(3);
    }
  });
  it("every train scene has a scene key that only references known rules", () => {
    for (const s of TRAIN_SCENES) {
      expect(SCENE_KEYS[s.id], s.id).toBeDefined();
      for (const r of SCENE_KEYS[s.id].rules) expect(PREDICATE_IDS).toContain(r);
    }
  });
  it("is disjoint from the eval set", () => {
    const evalIds = new Set(EVAL_SCENES.map((s) => s.id));
    const evalText = new Set(EVAL_SCENES.map((s) => s.situation));
    for (const s of TRAIN_SCENES) {
      expect(evalIds.has(s.id), s.id).toBe(false);
      expect(evalText.has(s.situation), s.id).toBe(false);
    }
  });
  it("covers R08 (seasonal greeting for clients who don't value it)", () => {
    expect(TRAIN_SCENES.filter((s) => SCENE_KEYS[s.id].rules.includes("R08")).length).toBeGreaterThanOrEqual(2);
  });
});

describe("ideal train proposals", () => {
  it.each(TRAIN_SCENES.map((s) => s.id))("%s is judged ○", (id) => {
    const s = TRAIN_SCENES.find((x) => x.id === id)!;
    const r = judge(s, getClient(s.clientId), IDEAL_TRAIN[id]);
    expect(r.checks.filter((c) => c.outcome !== "ok")).toEqual([]);
    expect(r.verdict).toBe("○");
  });
});
