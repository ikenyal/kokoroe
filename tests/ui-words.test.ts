import { describe, expect, it } from "vitest";
import { CLIENTS, COMPANY } from "@/src/core/world";
import { exportSkill, isLedgerFact, rulesMarkdown } from "@/src/learning/export";
import { LocalJsonStore } from "@/src/learning/store";
import { rollbackChange } from "@/src/learning/verify";
import type { KokoroeRule } from "@/src/learning/types";
import { citationParts, noDecisionIds, plainText } from "@/src/lib/plain";
import recorded from "@/data/demo/recorded-answers.json";

const rule = (o: Partial<KokoroeRule>): KokoroeRule => ({
  id: "K-001", scope: { clientId: "C04", sceneTypes: null }, text: "打ち合わせは Teams", when: null, status: "active", confidence: "high",
  sources: [{ kind: "ledger", judgmentId: "LEDGER-C04", date: "2026-11-03", sceneId: "", verdict: null, remark: "" }],
  history: [{ date: "2026-11-03", before: null, after: "打ち合わせは Teams", trigger: null, judgmentId: "LEDGER-C04", masterWords: "", reason: "" }],
  ...o,
});
const fromMaster = { kind: "judgment" as const, judgmentId: "J-0005", date: "2026-11-03", sceneId: "T05", verdict: "△" as const, remark: "" };

describe("心得 and ledger facts are told apart (D-052)", () => {
  it("a rule only from the ledger is a fact; once the master corrected it, it is a 心得", () => {
    expect(isLedgerFact(rule({}))).toBe(true);
    expect(isLedgerFact(rule({ sources: [...rule({}).sources, fromMaster] }))).toBe(false);
    expect(isLedgerFact(rule({ sources: [fromMaster] }))).toBe(false);
  });
  it("the Skill lists the master's 心得 first and the ledger facts under their own heading", () => {
    const s = exportSkill([rule({}), rule({ id: "K-002", text: "奥様に送る前に蔵元へ一言", sources: [fromMaster] })], CLIENTS, COMPANY);
    const f = s.files["clients/kohoku-seiki.md"];
    expect(f.indexOf("## 師匠から覚えた心得")).toBeLessThan(f.indexOf("蔵元へ一言"));
    expect(f.indexOf("## 台帳から写した事実")).toBeLessThan(f.indexOf("### K-001 打ち合わせは Teams"));
    expect(f.indexOf("蔵元へ一言")).toBeLessThan(f.indexOf("## 台帳から写した事実"));
    expect(rulesMarkdown([rule({ sources: [fromMaster] })])).not.toContain("台帳から写した事実");
  });
});

describe("no internal ids on screen", () => {
  it("cleans a recorded answer and splits its citation into words", () => {
    const a = (recorded.answers as Record<string, { explanation: string; citations: { history: string }[] }>).Q01;
    const t = plainText(a.explanation);
    expect(t).not.toMatch(/K-\d{3}/);
    expect(t).not.toContain("日付");
    const c = citationParts(a.citations[0].history);
    expect(c.rule).toContain("Teams");
    expect(c.why).toContain("2024年");
    expect(c.written).toBe("2026-11-03");
    expect(noDecisionIds("Before は修正後の台帳（D-033）、After は")).toBe("Before は修正後の台帳、After は");
    // A revised rule: the revision's きっかけ is blank, the original reason follows — show that, never 「（未記入）」.
    const r = citationParts("旧「A」→ 新「B」・きっかけ: （未記入）・日付: 2026-11-03（J-0035）。当初の規則のきっかけ: 2019年、叱られた・日付: 2026-11-03（J-0020）");
    expect(r.why).toBe("2019年、叱られた");
    expect(r.written).toBe("2026-11-03");
    expect(citationParts("新「C」・きっかけ: （未記入）・日付: 2026-11-03・出典: 台帳").why).toBeNull();
  });
});

describe("taking back a judgment (帳場)", () => {
  it("the store marks it undone once and keeps the record", async () => {
    const st = new LocalJsonStore(null);
    const j = await st.addJudgment({ at: "2026-11-04T00:00:00Z", sceneId: "T05", clientId: "C06", sceneType: "T4", proposal: {} as never, verdict: "△", remark: "" });
    await st.markUndone(j.id, "2026-11-04T01:00:00Z");
    await st.markUndone(j.id, "2026-11-04T02:00:00Z");
    expect((await st.listJudgments())[0].undone).toBe("2026-11-04T01:00:00Z");
  });
  it("an added rule is retired and a revised rule restored, and the 沿革 says it was taken back", async () => {
    const st = new LocalJsonStore(null);
    await st.saveRule(rule({ id: "K-002", text: "新しい心得", sources: [fromMaster] }));
    await rollbackChange({ store: st, change: { ruleId: "K-002", action: "add" }, snapshot: undefined, judgmentId: "J-0005", brokenSceneId: "T05", verdict: "△", remark: "", at: "2026-11-04T01:00:00Z", kind: "undo" });
    const added = (await st.getRule("K-002"))!;
    expect(added.status).toBe("retired");
    expect(added.history.at(-1)!.after).toBe("（取り消し: 廃止）");
    expect(added.history.at(-1)!.reason).toContain("取り消した");

    const before = rule({ id: "K-003", text: "前の心得", sources: [fromMaster] });
    await st.saveRule({ ...before, text: "直した心得" });
    await rollbackChange({ store: st, change: { ruleId: "K-003", action: "revise" }, snapshot: before, judgmentId: "J-0006", brokenSceneId: "T05", verdict: "×", remark: "", at: "2026-11-04T01:00:00Z", kind: "undo" });
    const revised = (await st.getRule("K-003"))!;
    expect(revised.text).toBe("前の心得");
    expect(revised.status).toBe("active");
    expect(revised.history.at(-1)!.after).toBe("（取り消し）前の心得");
  });
});

describe("example texts on screen never point at a fictional client (D-053)", () => {
  it("the 帳場's remark and 「なぜ」 examples name no client, contact or decider", async () => {
    const { readFileSync } = await import("node:fs");
    const clients = JSON.parse(readFileSync(new URL("../data/world/clients.json", import.meta.url), "utf8")) as { name: string; contact: string; decider: string }[];
    const words = clients.flatMap((c) => [c.name, c.contact, c.decider]).filter((w) => w.length >= 2);
    const files = ["../app/choba/judge-form.tsx", "../app/choba/page.tsx"];
    const examples = files.flatMap((f) => [...readFileSync(new URL(f, import.meta.url), "utf8").matchAll(/placeholder="(例：[^"]*)"/g)].map((m) => m[1]));
    expect(examples.length).toBeGreaterThan(0);
    for (const e of examples) for (const w of words) expect(e, `${e} mentions ${w}`).not.toContain(w);
  });
});
