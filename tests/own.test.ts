import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { isLocalHost, isLocalRequest } from "@/src/server/own";

/** 自分の会社で始める (KOKOROE_OWN): local only, data outside the repo, absent from the public version. */
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("own mode does not exist in the public version", () => {
  it("is off without KOKOROE_OWN, and the world is the fictional one, unchanged", async () => {
    vi.resetModules();
    const { ownEnabled } = await import("@/src/core/own-world");
    const { COMPANY, CLIENTS } = await import("@/src/core/world");
    expect(ownEnabled()).toBe(false);
    expect(COMPANY.name).toBe("株式会社だいだい工房");
    expect(CLIENTS).toHaveLength(10);
  });
  it("no deploy or image file sets KOKOROE_OWN, and the deploy doc says unset", () => {
    for (const f of ["scripts/prepare-image.sh", ".env.example", ...readdirSync(".").filter((x) => x.startsWith("Dockerfile"))]) expect(readFileSync(f, "utf8")).not.toMatch(/^\s*(export\s+)?KOKOROE_OWN\s*=\s*1/m); // only commented mentions
    expect(readFileSync("docs/deploy.md", "utf8")).toMatch(/`KOKOROE_OWN` \| \*\(unset\)\*/);
  });
  it("answers only local, unproxied requests (even if it were switched on by mistake)", () => {
    const h = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });
    expect(isLocalHost("127.0.0.1:3000")).toBe(true);
    expect(isLocalHost("localhost")).toBe(true);
    expect(isLocalHost("kokoroe.example.com")).toBe(false);
    expect(isLocalHost("127.0.0.1.evil.com")).toBe(false);
    expect(isLocalRequest(h({ host: "127.0.0.1:3000" }))).toBe(true);
    expect(isLocalRequest(h({ host: "127.0.0.1:3000", "x-forwarded-for": "127.0.0.1" }))).toBe(true); // Next adds the socket address
    expect(isLocalRequest(h({ host: "127.0.0.1:3000", "x-forwarded-for": "::ffff:127.0.0.1" }))).toBe(true);
    expect(isLocalRequest(h({ host: "127.0.0.1", "x-forwarded-for": "203.0.113.5, 127.0.0.1" }))).toBe(false);
    expect(isLocalRequest(h({ host: "127.0.0.1", "x-forwarded-for": "203.0.113.5" }))).toBe(false); // spoofed Host via the proxy
    expect(isLocalRequest(h({ host: "192.168.1.20:3000" }))).toBe(false);
  });
});

describe("own data lives outside the repo, and 全部消す only removes its own folder", () => {
  it("refuses a folder inside the repository or the home folder itself", async () => {
    const { ownDir } = await import("@/src/core/own-world");
    vi.stubEnv("KOKOROE_OWN_DIR", path.join(process.cwd(), "own-data"));
    expect(() => ownDir()).toThrow(/outside the repository/);
    vi.stubEnv("KOKOROE_OWN_DIR", homedir());
    expect(() => ownDir()).toThrow(/folder of its own/);
  });
  it("loads your ledger with KOKOROE_OWN=1, and deletes only a folder it marked", async () => {
    const dir = path.join(mkdtempSync(path.join(tmpdir(), "kokoroe-own-")), "own");
    vi.stubEnv("KOKOROE_OWN", "1");
    vi.stubEnv("KOKOROE_OWN_DIR", dir);
    vi.resetModules();
    const own = await import("@/src/core/own-world");
    own.saveOwnCompany({ name: "テスト商会", masterName: "山田", successorName: "佐藤" });
    own.saveOwnClients(own.toClients(own.parseClientsCsv('取引先名,窓口,決裁者,繁忙月\n"A社, 本店",課長,社長,"3,12"\nB社,部長,,')).clients);
    const { COMPANY, CLIENTS } = await import("@/src/core/world");
    expect(COMPANY.name).toBe("テスト商会");
    expect(CLIENTS.map((c) => c.name)).toEqual(["A社, 本店", "B社"]);
    expect(CLIENTS[0].busyMonths).toEqual([3, 12]);
    expect(CLIENTS[1].contactIsDecider).toBe(true);

    const other = mkdtempSync(path.join(tmpdir(), "kokoroe-notown-"));
    writeFileSync(path.join(other, "keep.txt"), "x");
    vi.stubEnv("KOKOROE_OWN_DIR", other);
    expect(own.deleteOwnData()).toBe("refused");
    expect(() => own.ensureOwnDir()).toThrow(/already holds other files/); // never marks a folder that has other things in it
    expect(existsSync(path.join(other, "keep.txt"))).toBe(true);
    vi.stubEnv("KOKOROE_OWN_DIR", dir);
    writeFileSync(path.join(dir, "notes-of-mine.txt"), "x"); // something the mode did not write
    expect(own.deleteOwnData()).toBe("deleted");
    expect(existsSync(path.join(dir, "clients.json"))).toBe(false);
    expect(existsSync(path.join(dir, "notes-of-mine.txt"))).toBe(true); // only its own files are removed
  });

  it("refuses a parent of the repository, and a symlink pointing into it", async () => {
    const { ownDir } = await import("@/src/core/own-world");
    vi.stubEnv("KOKOROE_OWN_DIR", path.dirname(process.cwd()));
    expect(() => ownDir()).toThrow(/folder of its own/);
    const base = mkdtempSync(path.join(tmpdir(), "kokoroe-link-"));
    symlinkSync(process.cwd(), path.join(base, "repo-link"));
    vi.stubEnv("KOKOROE_OWN_DIR", path.join(base, "repo-link", "own"));
    expect(() => ownDir()).toThrow(/outside the repository/);
  });

  it("keeps client ids stable across saves; a referenced client is never dropped; duplicates are refused", async () => {
    const { toClients } = await import("@/src/core/own-world");
    const row = (name: string, id?: string) => ({ id, name, industry: "", contact: "", decider: "", constraints: "", busyMonths: "", years: "" });
    const first = toClients([row("A社"), row("B社"), row("C社")]).clients;
    expect(first.map((c) => c.id)).toEqual(["O01", "O02", "O03"]);
    // B cleared from the form, rows reordered: A and C keep their ids; B has rules, so it stays
    const second = toClients([row("C社", "O03"), row("", "O02"), row("A社", "O01"), row("D社")], first, new Set(["O02"]));
    expect(second.clients.map((c) => `${c.id}:${c.name}`).sort()).toEqual(["O01:A社", "O02:B社", "O03:C社", "O04:D社"]);
    expect(second.kept).toEqual(["B社"]);
    // a CSV (no ids) is matched by name
    expect(toClients([row("C社"), row("E社")], second.clients).clients.map((c) => c.id)).toEqual(["O03", "O05"]);
    expect(() => toClients([row("A社"), row("A社")])).toThrow(/重複/);
  });

  it("the evaluation refuses to run in own mode", async () => {
    vi.stubEnv("KOKOROE_OWN", "1");
    vi.stubEnv("KOKOROE_OWN_DIR", path.join(mkdtempSync(path.join(tmpdir(), "kokoroe-ev-")), "own"));
    vi.resetModules();
    await expect(import("@/eval/simulator/hidden")).rejects.toThrow(/fictional company only/);
  });
});
