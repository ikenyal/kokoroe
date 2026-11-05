/**
 * The AI apprentice never goes on a visit (Kento 11/5). The recorded visit plans in the demo snapshots name only people
 * (the person in charge, the master) among those who go — never 橙丸, the AI apprentice.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APPRENTICE = /橙丸|弟子|AI/;

describe("recorded visit plans: the apprentice is not among those who go", () => {
  for (const mode of ["demo", "trial", "field"]) {
    it(mode, () => {
      const snap = JSON.parse(readFileSync(path.join(__dirname, "..", "data", "demo", `${mode}-snapshot.json`), "utf8"));
      const visits = snap.queue.map((q: { draft: { visit?: { attendees: string } } }) => q.draft.visit).filter(Boolean);
      if (mode !== "field") expect(visits.length).toBeGreaterThan(0);
      for (const v of visits) expect(v.attendees).not.toMatch(APPRENTICE);
    });
  }
});
