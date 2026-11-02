import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import freeze from "./fixtures/hidden-freeze.json";

/** data/hidden/ is frozen (D-017): the simulator's ground truth must not move during the experiment. */
describe("hidden ground truth is frozen", () => {
  const dir = path.resolve(__dirname, "..", "data", "hidden");
  it("has exactly the frozen files", () => {
    expect(readdirSync(dir).sort()).toEqual(Object.keys(freeze.files).sort());
  });
  it.each(Object.entries(freeze.files))("%s matches its frozen checksum", (file, sha) => {
    expect(createHash("sha256").update(readFileSync(path.join(dir, file))).digest("hex")).toBe(sha);
  });
});
