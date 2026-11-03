import { beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Proposal } from "@/src/core/types";

/** 帳場 「取り消す」 on a real session (files in a temp dir; no API). */
const base: Proposal = {
  channel: "mail", meeting: "none", formalTo: "contact", backchannelTo: null, timing: "now", followUp: true,
  format: "not_applicable", posture: [], escalateToMaster: false, message: "", basedOnRules: [],
};

async function setup(status: string, extra: { lastBy?: string; otherPending?: object } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "kokoroe-undo-"));
  vi.stubEnv("KOKOROE_DATA_DIR", dir);
  vi.resetModules();
  const { TRAIN_SCENES } = await import("@/src/core/world");
  const sid = "00000000-0000-4000-8000-000000000002";
  const sessions = path.join(dir, "sessions");
  mkdirSync(sessions, { recursive: true });
  const rule = {
    id: "K-001", scope: { clientId: "C06", sceneTypes: null }, text: "蔵元にも一言", when: null, status: "active", confidence: "medium",
    sources: [{ kind: "judgment", judgmentId: "J-0001", date: "2026-11-04", sceneId: "T05", verdict: "△", remark: "" }],
    history: [
      { date: "2026-11-04", before: null, after: "蔵元にも一言", trigger: null, judgmentId: "J-0001", masterWords: "", reason: "" },
      ...(extra.lastBy ? [{ date: "2026-11-04", before: "蔵元にも一言", after: "蔵元にも先に一言", trigger: null, judgmentId: extra.lastBy, masterWords: "", reason: "" }] : []),
    ],
  };
  const store = { rules: [rule], judgments: [{ id: "J-0001", at: "2026-11-04T01:00:00Z", sceneId: "T05", clientId: "C06", sceneType: "T4", proposal: base, verdict: "△", remark: "" }] };
  writeFileSync(path.join(sessions, `trial-${sid}.store.json`), JSON.stringify(store));
  const T05 = TRAIN_SCENES.find((s) => s.id === "T05")!;
  const T13 = TRAIN_SCENES.find((s) => s.id === "T13")!;
  const meta = {
    mode: "trial", createdAt: "x", pos: 1, queue: [{ scene: T05, draft: base }, { scene: T13, draft: base }],
    pending: [
      { judgmentId: "J-0001", sceneId: "T05", status, ruleId: "K-001", verify: { change: { ruleId: "K-001", action: "add" }, fixedSet: [], remaining: [], narrowed: false, checked: 0, asked: 0 } },
      ...(extra.otherPending ? [extra.otherPending] : []),
    ],
  };
  writeFileSync(path.join(sessions, `trial-${sid}.meta.json`), JSON.stringify(meta));
  const { openSession, readMeta } = await import("@/src/server/session");
  const { undoLast, lastUndoable } = await import("@/src/server/undo");
  return { s: openSession("trial", sid)!, meta: () => readMeta("trial", sid), undoLast, lastUndoable };
}

describe("帳場: take back the last judgment", () => {
  beforeEach(() => vi.unstubAllEnvs());

  it("after the rule was written: the rule is retired with a 沿革 entry, the card comes back, the judgment is kept and marked", async () => {
    const t = await setup("needs-why");
    const u = (await t.lastUndoable(t.s))!;
    expect(u.writes).toBe(true);
    expect(await t.undoLast(t.s, "J-0001")).toBe("done");
    const r = (await t.s.store.getRule("K-001"))!;
    expect(r.status).toBe("retired");
    expect(r.history.at(-1)!.after).toBe("（取り消し: 廃止）");
    expect(t.meta().pos).toBe(0);
    expect(t.meta().pending).toHaveLength(0);
    expect((await t.s.store.listJudgments())[0].undone).toBeTruthy();
    expect(await t.lastUndoable(t.s)).toBeNull(); // only one step back
  });

  it("while the apprentice is still reading it: waits, changes nothing", async () => {
    const t = await setup("interpreting");
    expect(await t.undoLast(t.s, "J-0001")).toBe("busy");
    expect((await t.s.store.getRule("K-001"))!.status).toBe("active");
    expect(t.meta().pos).toBe(1);
  });

  it("nothing was learned: just takes the judgment back; a stale form does nothing", async () => {
    const t = await setup("nothing-learned");
    expect(await t.undoLast(t.s, "J-0009")).toBe("stale");
    expect(await t.undoLast(t.s, "J-0001")).toBe("done");
    expect((await t.s.store.getRule("K-001"))!.status).toBe("active");
    expect(t.meta().pos).toBe(0);
  });

  it("after an error that came once the rule was written: still undoes the rule (it cites the judgment)", async () => {
    const t = await setup("error");
    expect((await t.lastUndoable(t.s))!.writes).toBe(true);
    expect(await t.undoLast(t.s, "J-0001")).toBe("done");
    expect((await t.s.store.getRule("K-001"))!.status).toBe("retired");
  });

  it("waits while any other background work runs", async () => {
    const t = await setup("applied", { otherPending: { judgmentId: "J-0000", sceneId: "T13", status: "verifying" } });
    expect(await t.undoLast(t.s, "J-0001")).toBe("busy");
    expect((await t.s.store.getRule("K-001"))!.status).toBe("active");
  });

  it("refuses when another correction changed the rule afterwards (the snapshot would erase it)", async () => {
    const t = await setup("applied", { lastBy: "J-0007" });
    expect(await t.undoLast(t.s, "J-0001")).toBe("changed-since");
    expect((await t.s.store.getRule("K-001"))!.text).toBe("蔵元にも一言");
    expect(t.meta().pos).toBe(1);
  });

  it("refuses while a follow-up correction from its 確かめ is on the same scene", async () => {
    const t = await setup("applied", { otherPending: { judgmentId: "J-0003", sceneId: "T05", status: "needs-choice", exclude: "K-001" } });
    expect(await t.undoLast(t.s, "J-0001")).toBe("follow-up");
  });
});
