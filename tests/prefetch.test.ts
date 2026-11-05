/**
 * 先読み (Kento 11/5): the next card's draft made while the master reads the current one is used only after ○ and only with the
 * same 心得帳; after △/× it is discarded; a failure falls back to drafting as before; the evaluation never reaches it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Client, Proposal, Scene } from "@/src/core/types";
import { _entries, approvePrefetch, claimPrefetch, discardAllPrefetch, dropIfStale, MAX_REDOS, runPrefetch, takePrefetch } from "@/src/server/prefetch";

const scene = { id: "T02", clientId: "C07", type: "T1" } as unknown as Scene;
const client = { id: "C07" } as unknown as Client;
const draft = { channel: "mail", message: "先読みの案" } as unknown as Proposal;

/** A 心得帳 whose rules can change between start and use. */
function ctx() {
  const rules: { id: string; text: string }[] = [{ id: "K-001", text: "まず電話" }];
  return { mode: "trial", sid: "s1", store: { listRules: async () => rules.map((r) => ({ ...r })) as never }, rules };
}

/** What the page and the record action do, in order: show card n (prefetch n+1), the master marks it, the page takes n+1. */
async function markThenTake(verdict: "○" | "△" | "×", opts: { changeBook?: boolean; fail?: boolean } = {}) {
  const c = ctx();
  expect(claimPrefetch(c, 1, scene.id)).toBe(true);
  await runPrefetch(c, 1, scene, client, async () => {
    if (opts.fail) throw new Error("API down");
    return draft;
  });
  if (opts.changeBook) c.rules.push({ id: "K-002", text: "直前の △ から学んだ心得" }); // a reading finished meanwhile
  if (verdict === "○") approvePrefetch(c, 1, scene.id); // app/actions.ts judge()
  else discardAllPrefetch(c);
  return takePrefetch(c, 1, scene.id); // src/server/background.ts draftLive()
}

describe("先読み", () => {
  beforeEach(() => _entries.clear());

  it("after ○ with the same 心得帳, the prefetched draft is used", async () => {
    expect(await markThenTake("○")).toEqual(draft);
  });

  it("after △ or ×, it is not used (the next draft is made as before)", async () => {
    expect(await markThenTake("△")).toBeNull();
    expect(await markThenTake("×")).toBeNull();
  });

  it("after ○, it is not used if the 心得帳 changed since it started", async () => {
    expect(await markThenTake("○", { changeBook: true })).toBeNull();
  });

  it("a failed prefetch leaves nothing: the page drafts as before", async () => {
    expect(await markThenTake("○", { fail: true })).toBeNull();
    expect(_entries.size).toBe(0);
  });

  it("a different scene at that place is never given the prefetched draft", async () => {
    const c = ctx();
    claimPrefetch(c, 1, scene.id);
    await runPrefetch(c, 1, scene, client, async () => draft);
    approvePrefetch(c, 1, scene.id);
    expect(await takePrefetch(c, 1, "T03")).toBeNull();
  });

  it("one slot per card: a second render does not start another prefetch", () => {
    const c = ctx();
    expect(claimPrefetch(c, 1, scene.id)).toBe(true);
    expect(claimPrefetch(c, 1, scene.id)).toBe(false);
  });

  it("a prefetch still running is waited for, not duplicated", async () => {
    const c = ctx();
    claimPrefetch(c, 1, scene.id);
    let release!: () => void;
    const running = runPrefetch(c, 1, scene, client, () => new Promise<Proposal>((r) => (release = () => r(draft))));
    approvePrefetch(c, 1, scene.id);
    const taken = takePrefetch(c, 1, scene.id);
    await new Promise((r) => setTimeout(r, 0)); // the drafting has started (after reading the book's version)
    release();
    await running;
    expect(await taken).toEqual(draft);
  });
});

describe("先読み: races (hitl-reviewer 11/5)", () => {
  beforeEach(() => _entries.clear());

  it("without a ○ approving it, a finished prefetch is never used", async () => {
    const c = ctx();
    claimPrefetch(c, 1, scene.id);
    await runPrefetch(c, 1, scene, client, async () => draft);
    expect(await takePrefetch(c, 1, scene.id)).toBeNull();
  });

  it("a stale render that claims the next card after the master's △ cannot get it used", async () => {
    const c = ctx();
    discardAllPrefetch(c); // judge(△) — nothing to drop yet
    claimPrefetch(c, 1, scene.id); // a render that read the old position claims afterwards
    await runPrefetch(c, 1, scene, client, async () => draft);
    expect(await takePrefetch(c, 1, scene.id)).toBeNull(); // never approved
  });

  it("取り消し, then △ on the earlier card, then ○: no prefetch made before the undo is used", async () => {
    const c = ctx();
    claimPrefetch(c, 2, "T04"); // card 1 shown, card 2 prefetched
    await runPrefetch(c, 2, { ...scene, id: "T04" } as Scene, client, async () => draft);
    discardAllPrefetch(c); // undo (back to card 0)
    discardAllPrefetch(c); // △ on card 0
    approvePrefetch(c, 2, "T04"); // a later ○ — the old entry is gone
    expect(await takePrefetch(c, 2, "T04")).toBeNull();
  });

  it("a prefetch that never ran is not waited for beyond its budget", async () => {
    const c = ctx();
    claimPrefetch(c, 1, scene.id);
    approvePrefetch(c, 1, scene.id);
    const t0 = Date.now();
    expect(await takePrefetch(c, 1, scene.id, 50)).toBeNull();
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});

describe("先読み: made again when the 心得帳 changes (Kento 11/5)", () => {
  beforeEach(() => _entries.clear());
  const second = { ...draft, message: "新しい心得帳での案" } as unknown as Proposal;

  it("a change while drafting: drafted again from the new book, and that draft is used after ○", async () => {
    const c = ctx();
    claimPrefetch(c, 1, scene.id);
    let calls = 0;
    await runPrefetch(c, 1, scene, client, async () => {
      calls++;
      if (calls === 1) c.rules.push({ id: "K-002", text: "読み取りが書いた心得" }); // written while the first draft was made
      return calls === 1 ? draft : second;
    }, undefined, () => true);
    expect(calls).toBe(2);
    approvePrefetch(c, 1, scene.id);
    expect(await takePrefetch(c, 1, scene.id)).toEqual(second);
  });

  it("no redo when the limits refuse another call: the old draft is kept but never used", async () => {
    const c = ctx();
    claimPrefetch(c, 1, scene.id);
    let calls = 0;
    await runPrefetch(c, 1, scene, client, async () => {
      calls++;
      c.rules.push({ id: `K-1${calls}`, text: "変わる" });
      return draft;
    }, undefined, () => false);
    expect(calls).toBe(1);
    approvePrefetch(c, 1, scene.id);
    expect(await takePrefetch(c, 1, scene.id)).toBeNull();
  });

  it("at most MAX_REDOS redos, one at a time", async () => {
    const c = ctx();
    claimPrefetch(c, 1, scene.id);
    let calls = 0, inFlight = 0, most = 0;
    const propose = async () => {
      calls++; inFlight++; most = Math.max(most, inFlight);
      c.rules.push({ id: `K-2${calls}`, text: "毎回変わる" });
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      return draft;
    };
    const a = runPrefetch(c, 1, scene, client, propose, undefined, () => true);
    const b = runPrefetch(c, 1, scene, client, propose, undefined, () => true); // a second render: nothing new starts
    await Promise.all([a, b]);
    expect(calls).toBe(1 + MAX_REDOS);
    expect(most).toBe(1);
  });

  it("a render drops a finished prefetch made from an older book, but not one still drafting or already approved", async () => {
    const c = ctx();
    claimPrefetch(c, 1, scene.id);
    await runPrefetch(c, 1, scene, client, async () => draft);
    expect(await dropIfStale(c, 1)).toBe(false); // same book
    c.rules.push({ id: "K-003", text: "あとで書かれた心得" });
    expect(await dropIfStale(c, 1)).toBe(true);
    expect(claimPrefetch(c, 1, scene.id)).toBe(true); // made again from the new book

    let release!: () => void;
    const running = runPrefetch(c, 1, scene, client, () => new Promise<Proposal>((r) => (release = () => r(draft))));
    await new Promise((r) => setTimeout(r, 0));
    c.rules.push({ id: "K-004", text: "さらに" });
    expect(await dropIfStale(c, 1)).toBe(false); // still drafting: it checks the book itself when it finishes
    release();
    await running;

    const c2 = ctx();
    claimPrefetch(c2, 1, scene.id);
    await runPrefetch(c2, 1, scene, client, async () => draft);
    approvePrefetch(c2, 1, scene.id);
    c2.rules.push({ id: "K-005", text: "○ のあとに" });
    expect(await dropIfStale(c2, 1)).toBe(false); // approved: the take compares the book and drafts fresh
  });
});

describe("the evaluation never prefetches", () => {
  it("nothing under eval/, src/disciple/ or src/learning/ imports the prefetch or the app's background work", () => {
    const root = path.join(__dirname, "..");
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = path.join(dir, f);
        return statSync(p).isDirectory() ? (f === "runs" ? [] : files(p)) : /\.tsx?$/.test(f) ? [p] : [];
      });
    for (const f of ["eval", "src/disciple", "src/learning"].flatMap((d) => files(path.join(root, d)))) {
      expect(readFileSync(f, "utf8"), path.relative(root, f)).not.toMatch(/server\/(prefetch|background)/);
    }
  });
});
