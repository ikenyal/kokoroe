import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Evaluation integrity (docs/decisions.md D-005):
 * the apprentice / product code must never read the simulator's hidden ground truth.
 * Only eval/simulator/ may touch data/hidden/.
 */
const ROOT = path.resolve(__dirname, "..");
const PRODUCT_DIRS = ["src", "app"];
const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json)$/;
const FORBIDDEN = /data[\\/]+hidden|hidden[\\/]+rules/;

function listFiles(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(listFiles(p));
    else if (CODE_EXT.test(name)) out.push(p);
  }
  return out;
}

describe("hidden ground-truth boundary", () => {
  it("product code (src/, app/) never references data/hidden", () => {
    const offenders = PRODUCT_DIRS.flatMap((d) => listFiles(path.join(ROOT, d))).filter((f) =>
      FORBIDDEN.test(readFileSync(f, "utf8")),
    );
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });
});
