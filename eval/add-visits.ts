/**
 * 訪問の段取り onto the recorded demo drafts (D-061, Kento 11/5). The recorded 段取り stay exactly as they are: for each queued
 * draft that visits (meeting "in_person") and has no visit plan yet, the second call (planVisit) writes only the visit plan,
 * reading the snapshot's own kokoroe-chō as the app would. Any change to a 段取り field stops the script without writing.
 *   npx tsx --env-file-if-exists=.env.local eval/add-visits.ts --yes [--front demo]
 * --redo: write the visit plan again where one exists (11/5: the prompt now says the AI apprentice never goes; 段取り unchanged).
 * --front demo: the demo queue opens with its first visit (order only). field-snapshot.json (師匠役テスト) is not touched.
 * Fictional data only. Live API (a few cents per draft).
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { COMPANY, getClient } from "@/src/core/world";
import type { Proposal } from "@/src/core/types";
import { planVisit } from "@/src/disciple/v0";
import { isPureLedger } from "@/src/disciple/v1";
import { enforceHitl } from "@/src/disciple/hitl";
import { describeRules } from "@/src/learning/describe";
import { LocalJsonStore } from "@/src/learning/store";
import { estimateUsd } from "@/src/lib/cost";
import type { Usage } from "@/src/lib/claude";
import type { Snapshot } from "@/src/server/session";

const { values } = parseArgs({ options: { yes: { type: "boolean", default: false }, front: { type: "string", multiple: true, default: [] }, redo: { type: "boolean", default: false } } });
if (!values.yes) throw new Error("live API calls: pass --yes");

const DANDORI = ["channel", "meeting", "formalTo", "backchannelTo", "timing", "followUp", "format", "posture", "message"] as const;
async function main() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "kokoroe-visits-"));
  const usage: Usage[] = [];

  for (const mode of ["demo", "trial"] as const) {
    const file = path.join(__dirname, "..", "data", "demo", `${mode}-snapshot.json`);
    const snap = JSON.parse(readFileSync(file, "utf8")) as Snapshot;
    const storeFile = path.join(tmp, `${mode}.json`);
    writeFileSync(storeFile, JSON.stringify(snap.store));
    const store = new LocalJsonStore(storeFile);
    for (const q of snap.queue) {
      const d = q.draft as Proposal;
      if (d.meeting !== "in_person" || (d.visit && !values.redo)) continue;
      const client = getClient(q.scene.clientId);
      const kokoroe = describeRules((await store.rulesFor(client.id, q.scene.type)).filter((r) => !isPureLedger(r)));
      // The old visit plan is not shown as "decided" (hitl-reviewer 11/5: it would pull the answer back to the old attendees).
      const v = await planVisit(q.scene, client, { ...d, visit: undefined }, kokoroe);
      // The AI apprentice never goes (Kento 11/5): stop without writing if it is still named among those who go.
      if (v.visit.attendees.includes(COMPANY.apprentice.name.replace(/（.*$/, ""))) throw new Error(`${mode} ${q.scene.id}: the apprentice is still an attendee — stopped: ${v.visit.attendees}`);
      usage.push(v.usage);
      const next = enforceHitl(q.scene, { ...d, basedOnRules: [...new Set([...d.basedOnRules, ...v.basedOnRules])], visit: v.visit });
      for (const k of DANDORI) if (JSON.stringify(next[k]) !== JSON.stringify(d[k])) throw new Error(`${mode} ${q.scene.id}: ${k} changed — stopped`);
      const flipped = next.escalateToMaster !== d.escalateToMaster ? " | 師匠に回す: raised by the money/contract floor (message or visit plan)" : "";
      console.log(`${mode} ${q.scene.id} ${client.name}: ${v.visit.attire.slice(0, 30)} / ${v.visit.gift.slice(0, 20)}${flipped}`);
      q.draft = next;
    }
    if ((values.front as string[]).includes(mode)) {
      const i = snap.queue.findIndex((q) => (q.draft as Proposal).visit);
      if (i > 0) {
        snap.queue = [snap.queue[i], ...snap.queue.filter((_, k) => k !== i)];
        snap.note += `。訪問の段取りがある ${snap.queue[0].scene.id} を先頭に（並びだけ。D-061）`;
      }
    }
    writeFileSync(file, JSON.stringify(snap, null, 2) + "\n");
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`visit plans: ${usage.length} | cost ≈ $${estimateUsd(usage).toFixed(3)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
