"use server";

/**
 * Server Actions. They are reachable by direct POST, so every input is validated here (Next.js Data Security guide).
 * The API key is only used server-side (src/lib/claude.ts). Nothing here logs session content.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getSession, liveEnabled, readMeta, startSession, type Mode } from "@/src/server/session";
import { areaToStore, askWhere, parsePick } from "@/src/learning/area";
import { applyChoice, interpretInBackground } from "@/src/server/background";
import { approvePrefetch, discardAllPrefetch } from "@/src/server/prefetch";
import { afterConfirm, afterRegression, confirmWithoutLive, startVerification } from "@/src/server/verify-ui";
import { undoLast } from "@/src/server/undo";
import { recordTrigger } from "@/src/learning/compile";
import type { SessionMeta, SuccessorTurn, Timing } from "@/src/server/session";
import { askSuccessor } from "@/src/successor/ask";
import type { Usage } from "@/src/lib/claude";
import { allowLive, allowStart, recordSpend } from "@/src/server/limits";
import { fieldEnabled } from "@/src/server/field";
import { enforceHitl } from "@/src/disciple/hitl";
import { CLIENTS, getClient, HISTORY_QUESTIONS } from "@/src/core/world";
import recorded from "@/data/demo/recorded-answers.json";
import { deleteOwnData, parseClientsCsv, saveOwnClients, saveOwnCompany, toClients, type ClientRow } from "@/src/core/own-world";
import { reloadOwnWorld } from "@/src/core/world";
import { heldForProse } from "@/src/server/own-result";
import { requireOwn } from "@/src/server/own";
import { OWN_SID, openSession, startOwnSession } from "@/src/server/session";
import { SCENE_TYPE_LABELS, type SceneType } from "@/src/core/types";

export async function start(formData: FormData) {
  const mode = formData.get("mode");
  if (mode !== "demo" && mode !== "trial" && mode !== "field") throw new Error("invalid mode");
  if (mode === "field" && !fieldEnabled()) throw new Error("invalid mode"); // the master-role test exists only where KOKOROE_FIELD=1
  if (!(await allowStart())) redirect("/?limit=starts"); // a visitor can hit this: say so on the home page instead of an error screen
  await startSession(mode as Mode);
  redirect("/choba");
}

/** 師匠が心得を消す (retire, with a 沿革 entry — nothing is erased from history). */
export async function retireRule(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const id = String(formData.get("ruleId") ?? "");
  if (!/^K-\d{3}$/.test(id)) throw new Error("invalid rule id");
  const r = await s.store.getRule(id);
  if (!r || r.status !== "active") return;
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  r.status = "retired";
  r.history.push({ date: today, before: r.when ? `${r.text}（${r.when}）` : r.text, after: "（師匠が削除）", trigger: null, judgmentId: "MASTER", masterWords: "", reason: "師匠が心得帳から消した" });
  await s.store.saveRule(r);
  revalidatePath("/kokoroe");
}

const VERDICTS = new Set(["○", "△", "×"]);

/** Client-measured durations (ms) from hidden fields; clamped so a bad value can't poison the master-role test numbers. */
function ms(formData: FormData, from: string, to: string): number | null {
  const a = Number(formData.get(from));
  const b = Number(formData.get(to));
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.min(b - a, 30 * 60_000);
}

function addTimings(meta: SessionMeta, t: Timing[]) {
  if (meta.mode !== "field" && meta.mode !== "own") return; // own mode too (D-060): times only, kept in its own folder
  meta.timings = [...(meta.timings ?? []), ...t];
}

/** 師匠の判定. Records it at once; interpretation runs afterwards so the master never waits. */
export async function judge(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const verdict = String(formData.get("verdict") ?? "");
  const remark = String(formData.get("remark") ?? "").trim().slice(0, 120);
  const sceneId = String(formData.get("sceneId") ?? "");
  if (!VERDICTS.has(verdict)) throw new Error("invalid verdict");
  const item = s.meta.paused ? undefined : s.meta.queue[s.meta.pos]; // 「ここで区切る」: nothing is judged until 「続きから」
  if (!item || item.scene.id !== sceneId) return; // stale form (double submit) — ignore
  if (s.mode === "own" && !item.live) return; // own mode: no draft was made (limit or error) — nothing to judge, nothing to learn
  if (heldForProse(s.meta, s.meta.pos)) return; // own-mode comparison: prose first (D-060)
  const j = await s.store.addJudgment({
    at: new Date().toISOString(),
    sceneId: item.scene.id,
    clientId: item.scene.clientId,
    sceneType: item.scene.type,
    proposal: enforceHitl(item.scene, item.draft), // recorded drafts get the same floor as live ones (D-044)
    verdict: verdict as "○" | "△" | "×",
    remark,
  });
  const meta = readMeta(s.mode, s.sid);
  meta.pos += 1;
  const tJudge = ms(formData, "shownAt", "markedAt");
  const tRemark = ms(formData, "markedAt", "submitAt");
  addTimings(meta, [
    ...(tJudge !== null ? [{ kind: "judge" as const, sceneId: item.scene.id, ms: tJudge, verdict }] : []),
    ...(tRemark !== null ? [{ kind: "remark" as const, sceneId: item.scene.id, ms: tRemark, chars: remark.length, verdict }] : []),
  ]);
  // Reserve the live call here (after() runs without the request, so limits are checked now).
  const refused = verdict !== "○" && liveEnabled() ? await allowLive(s.sid) : null;
  const live = verdict !== "○" && liveEnabled() && !refused;
  if (refused) meta.limit = refused;
  // 先読み: a △/× changes what the next draft should read, so the prefetched next card is never used (src/server/prefetch.ts).
  if (verdict === "○") {
    const next = meta.queue[meta.pos];
    if (next) approvePrefetch(s, meta.pos, next.scene.id);
  } else discardAllPrefetch(s);
  if (verdict !== "○") meta.pending.unshift({ judgmentId: j.id, sceneId: item.scene.id, status: live ? "queued" : "offline", ...(askWhere(remark) ? { noRemark: true } : {}) });
  s.saveMeta(meta);
  if (live) after(() => interpretInBackground(s.mode, s.sid, j.id));
  revalidatePath("/choba");
}

/** 直前の判定を取り消す (one step). Undoes the kokoroe-chō change written from it, if any, with a 沿革 entry. */
export async function undo(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const judgmentId = String(formData.get("judgmentId") ?? "");
  if (!/^J-\d{4}$/.test(judgmentId)) throw new Error("invalid judgment");
  const j = (await s.store.listJudgments()).find((x) => x.id === judgmentId);
  const result = await undoLast(s, judgmentId);
  if (result === "done" && j) {
    // Display only: the card shown again says its mark was taken back (ui-critic 11/6). Nothing learned depends on it.
    const meta = readMeta(s.mode, s.sid);
    meta.undone = { sceneId: j.sceneId, verdict: j.verdict };
    s.saveMeta(meta);
  }
  revalidatePath("/choba");
  revalidatePath("/kokoroe");
}

/** 「ここで区切る」 / 「続きから」: stop the queue here (or resume). The kokoroe-chō so far stays as it is. */
export async function pause(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const meta = readMeta(s.mode, s.sid);
  meta.paused = formData.get("resume") !== "1";
  s.saveMeta(meta);
  revalidatePath("/choba");
}

/** 読み方の候補を選ぶ（index）/ どれでもない（none）, optionally with 「どこが違う？」 (area, first readings only, D-057). */
export async function choose(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const judgmentId = String(formData.get("judgmentId") ?? "");
  // "none:<area>" = 「どれでもない」 with 「どこが違う？」 in one tap (a submit button carries one value).
  const parsed = parsePick(String(formData.get("pick") ?? ""));
  if (!/^J-\d{4}$/.test(judgmentId) || !parsed) throw new Error("invalid choice");
  const { index, area: areaIn } = parsed;
  if (!liveEnabled()) return;
  if (index === null) {
    // "none of these" in round 1 starts a second interpretation — a live call.
    const refused = await allowLive(s.sid);
    if (refused) {
      const m = readMeta(s.mode, s.sid);
      m.limit = refused;
      m.pending = m.pending.map((p) => (p.judgmentId === judgmentId ? { ...p, status: "nothing-learned", note: "お試し上限のため、別の読み方は出していません" } : p));
      s.saveMeta(m);
      revalidatePath("/choba");
      return;
    }
  }
  const meta = readMeta(s.mode, s.sid);
  const sceneId = meta.pending.find((p) => p.judgmentId === judgmentId)?.sceneId ?? "";
  const tChoose = ms(formData, "shownAt", "submitAt");
  if (tChoose !== null) addTimings(meta, [{ kind: "choose", sceneId, ms: tChoose }]);
  // The area counts only on the first readings (the second round is the last one, D-025), and only when there was no remark.
  meta.pending = meta.pending.map((p) => {
    if (p.judgmentId !== judgmentId || p.status !== "needs-choice") return p;
    const area = areaToStore(p, areaIn);
    return { ...p, status: "choosing", pick: index, ...(area ? { area } : {}) };
  });
  s.saveMeta(meta);
  after(() => applyChoice(s.mode, s.sid, judgmentId, index));
  revalidatePath("/choba");
}

/** 暖簾を継ぐ: the successor's question. Live → answered from this session's kokoroe-chō; otherwise a recorded answer (presets only). */
export async function ask(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const preset = String(formData.get("preset") ?? "");
  let clientId = String(formData.get("clientId") ?? "");
  let question = String(formData.get("question") ?? "").trim().slice(0, 200);
  const presetQ = HISTORY_QUESTIONS.find((q) => q.id === preset);
  if (presetQ) {
    clientId = presetQ.clientId;
    question = presetQ.question;
  }
  if (!question) redirect("/noren"); // e.g. only spaces: nothing to ask, back to the form
  if (!CLIENTS.some((c) => c.id === clientId)) throw new Error("invalid question");
  let turn: SuccessorTurn;
  const refused = liveEnabled() ? await allowLive(s.sid) : "daily";
  if (liveEnabled() && refused) {
    const m = readMeta(s.mode, s.sid);
    m.limit = refused;
    s.saveMeta(m);
  }
  if (liveEnabled() && !refused) {
    const rules = (await s.store.listRules()).filter((r) => r.status === "active" && (r.scope.clientId === null || r.scope.clientId === clientId));
    const usage: Usage[] = [];
    const a = await askSuccessor({ client: getClient(clientId), question, rules, usage }).finally(() => recordSpend(usage));
    if (!a.citationsValid) {
      // Grounding check: a yes/no without real kokoroe-chō citations is not shown as an answer.
      turn = { at: new Date().toISOString(), clientId, question, answer: "unknown", explanation: "心得帳には記録がありません。師匠に確認してください。", citations: [], source: "live" };
    } else {
      // Show the 沿革 as stored in the kokoroe-chō, not as paraphrased by the model.
      // Same shape as the recorded answers (新「…」・きっかけ: …・日付: …・出典: …), so the page shows both the same way.
      const citations = a.citations.map((c) => {
        const r = rules.find((x) => x.id === c.ruleId)!;
        const last = r.history.at(-1);
        const why = r.history.map((h) => h.trigger).filter(Boolean).at(-1);
        const from = r.sources.some((x) => x.kind !== "ledger") ? "師匠の判定" : "取引先台帳";
        const prev = [...r.history].reverse().find((h) => h.before)?.before;
        return { ruleId: c.ruleId, history: `${prev ? `旧「${prev}」→ ` : ""}新「${r.text}${r.when ? `（${r.when}）` : ""}」${why ? `・きっかけ: ${why}` : ""}${last ? `・日付: ${last.date}` : ""}・出典: ${from}` };
      });
      turn = { at: new Date().toISOString(), clientId, question, answer: a.answer, explanation: a.explanation, citations, source: "live" };
    }
  } else if (presetQ) {
    const rec = (recorded.answers as Record<string, Omit<SuccessorTurn, "at" | "clientId" | "question" | "source">>)[presetQ.id];
    turn = { at: new Date().toISOString(), clientId, question, ...rec, source: "recorded" };
  } else {
    turn = { at: new Date().toISOString(), clientId, question, answer: "unknown", explanation: "記録済みデータで動いているため、自由な質問にはライブ版で答えます。上の質問例を選ぶと、記録済みの回答を表示します。", citations: [], source: "recorded" };
  }
  const meta = readMeta(s.mode, s.sid);
  meta.answers = [turn, ...(meta.answers ?? [])].slice(0, 6);
  s.saveMeta(meta);
  revalidatePath("/noren");
}

/** 「なぜ？」 — asked once for a newly learned rule. Optional: skipping is fine and recorded as such. */
export async function answerWhy(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const judgmentId = String(formData.get("judgmentId") ?? "");
  if (!/^J-\d{4}$/.test(judgmentId)) throw new Error("invalid judgment");
  const skip = formData.get("skip") === "1";
  const why = skip ? "" : String(formData.get("why") ?? "").trim().slice(0, 120);
  const meta = readMeta(s.mode, s.sid);
  const p = meta.pending.find((x) => x.judgmentId === judgmentId && x.status === "needs-why");
  if (!p?.ruleId) return;
  if (why) await recordTrigger(s.store, p.ruleId, why);
  const t = ms(formData, "shownAt", "submitAt");
  if (t !== null) addTimings(meta, [{ kind: "why", sceneId: p.sceneId, ms: t, chars: why.length }]);
  // Then 確かめ稽古 + regression (live only, within the limits); otherwise the rule stays as written.
  const refused = liveEnabled() && p.verify ? await allowLive(s.sid) : "daily";
  const verifyNow = liveEnabled() && !!p.verify && !refused;
  if (liveEnabled() && refused && p.verify) meta.limit = refused;
  meta.pending = meta.pending.map((x) =>
    x.judgmentId === judgmentId ? { ...x, status: verifyNow ? "verifying" : "applied", note: why ? `わけ：${why}` : x.note } : x,
  );
  s.saveMeta(meta);
  if (verifyNow) after(() => startVerification(s.mode, s.sid, judgmentId));
  revalidatePath("/choba");
}

/** 確かめ稽古 / 回帰の確認 — the master judges a re-solved scene (one tap; remark optional). */
export async function verifyCheck(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const judgmentId = String(formData.get("judgmentId") ?? "");
  const step = String(formData.get("step") ?? "");
  const verdict = String(formData.get("verdict") ?? "");
  const remark = String(formData.get("remark") ?? "").trim().slice(0, 120);
  if (!/^J-\d{4}$/.test(judgmentId) || !VERDICTS.has(verdict) || (step !== "confirm" && step !== "regression")) throw new Error("invalid check");
  if (!liveEnabled()) return;
  const meta = readMeta(s.mode, s.sid);
  const p = meta.pending.find((x) => x.judgmentId === judgmentId);
  if (!p || p.status !== (step === "confirm" ? "needs-confirm" : "needs-regression")) return; // stale or double submit
  const t = ms(formData, "shownAt", "submitAt");
  if (t !== null) addTimings(meta, [{ kind: "check", sceneId: p.sceneId, ms: t, verdict }]);
  const refused = await allowLive(s.sid);
  if (refused) {
    meta.limit = refused;
    if (step === "confirm") {
      // Still record the master's mark; a rule that did not take is withdrawn without a Claude call (D-045).
      meta.pending = meta.pending.map((x) => (x.judgmentId === judgmentId ? { ...x, status: "verifying" } : x));
      s.saveMeta(meta);
      await confirmWithoutLive(s.mode, s.sid, judgmentId, verdict as "○" | "△" | "×", remark);
    } else {
      meta.pending = meta.pending.map((x) => (x.judgmentId === judgmentId ? { ...x, status: "applied", note: "お試し上限のため、確かめはここまでにしました" } : x));
      s.saveMeta(meta);
    }
    revalidatePath("/choba");
    return;
  }
  meta.pending = meta.pending.map((x) => (x.judgmentId === judgmentId ? { ...x, status: "verifying" } : x));
  s.saveMeta(meta);
  const v = verdict as "○" | "△" | "×";
  after(() => (step === "confirm" ? afterConfirm(s.mode, s.sid, judgmentId, v, remark) : afterRegression(s.mode, s.sid, judgmentId, v, remark)));
  revalidatePath("/choba");
}

/** 師匠役テスト / own-mode comparison: the same etiquette written as prose, timed (for t_write). */
export async function submitWrite(formData: FormData) {
  const s = await getSession();
  if (!s || (s.mode !== "field" && s.mode !== "own")) redirect("/");
  const sceneId = String(formData.get("sceneId") ?? "");
  const text = String(formData.get("text") ?? "").trim().slice(0, 2000);
  // Field: the fixed fictional scenes. Own: one of the situations the master wrote (S-nnnn in this session's queue).
  // Own: only a situation not judged yet — prose comes before the judgment (D-060).
  // Own: once per situation, before its draft exists, and only for situations added after the comparison started.
  const i = s.meta.queue.findIndex((q) => q.scene.id === sceneId);
  const known =
    s.mode === "field"
      ? /^T\d{2}$/.test(sceneId)
      : /^S-\d{4}$/.test(sceneId) && !!s.meta.compare && i >= Math.max(s.meta.pos, s.meta.compare.fromIndex) && !s.meta.queue[i].live && !(s.meta.writes ?? []).some((w) => w.sceneId === sceneId);
  if (!known || !text) throw new Error("invalid write");
  const t = ms(formData, "shownAt", "submitAt");
  const meta = readMeta(s.mode, s.sid);
  meta.writes = [...(meta.writes ?? []).filter((w) => w.sceneId !== sceneId), { sceneId, text, ms: t ?? 0 }];
  if (t !== null) addTimings(meta, [{ kind: "write", sceneId, ms: t, chars: text.length }]);
  s.saveMeta(meta);
  revalidatePath("/choba/write");
}

/* ---------- 自分の会社で始める (KOKOROE_OWN=1, local only) ---------- */

/** The company: name, the master, the successor. */
export async function ownSaveCompany(formData: FormData) {
  await requireOwn();
  const t = (k: string, d: string) => String(formData.get(k) ?? "").trim().slice(0, 40) || d;
  saveOwnCompany({ name: t("company", "自分の会社"), masterName: t("master", "師匠"), successorName: t("successor", "後任") });
  reloadOwnWorld();
  revalidatePath("/own");
}

/** The client ledger, from the form rows or a pasted CSV (replaces the whole ledger). */
export async function ownSaveClients(formData: FormData) {
  await requireOwn();
  const csv = String(formData.get("csv") ?? "").trim().slice(0, 50_000);
  let rows: ClientRow[];
  if (csv) rows = parseClientsCsv(csv);
  else {
    const all = (k: string) => formData.getAll(k).map((v) => String(v));
    const names = all("name");
    rows = names.map((name, i) => ({
      id: all("id")[i] || undefined, name, industry: all("industry")[i] ?? "", contact: all("contact")[i] ?? "", decider: all("decider")[i] ?? "",
      constraints: all("constraints")[i] ?? "", busyMonths: all("busyMonths")[i] ?? "", years: all("years")[i] ?? "",
    }));
  }
  // Clients the 心得帳, a judgment or a written scene refers to are never dropped or renumbered (rules must not move clients).
  const s = openSession("own", OWN_SID);
  const referenced = new Set<string>();
  if (s) {
    for (const r of await s.store.listRules()) if (r.scope.clientId) referenced.add(r.scope.clientId);
    for (const j of await s.store.listJudgments()) referenced.add(j.clientId);
    for (const q of s.meta.queue) referenced.add(q.scene.clientId);
  }
  saveOwnClients(toClients(rows, [...CLIENTS], referenced).clients);
  reloadOwnWorld();
  revalidatePath("/own");
}

/** Open (or create, the first time) the lasting own session, then the 帳場. */
export async function ownStart() {
  await requireOwn();
  startOwnSession();
  redirect("/choba");
}

/** The master writes a new situation; the apprentice drafts for it (live) on the 帳場. */
export async function ownAddScene(formData: FormData) {
  await requireOwn();
  const s = openSession("own", OWN_SID);
  if (!s) redirect("/own");
  const clientId = String(formData.get("clientId") ?? "");
  const type = String(formData.get("type") ?? "") as SceneType;
  const month = Number(formData.get("month"));
  if (!Number.isInteger(month)) throw new Error("invalid month");
  const situation = String(formData.get("situation") ?? "").trim().slice(0, 600);
  if (!CLIENTS.some((c) => c.id === clientId) || !(type in SCENE_TYPE_LABELS) || !(month >= 1 && month <= 12) || !situation) throw new Error("invalid scene");
  const meta = readMeta("own", OWN_SID);
  const id = `S-${String(meta.queue.length + 1).padStart(4, "0")}`;
  // Writing the situation is timed on its own row (D-060), apart from judging.
  const tScene = ms(formData, "shownAt", "submitAt");
  if (tScene !== null) addTimings(meta, [{ kind: "scene", sceneId: id, ms: tScene, chars: situation.length }]);
  const draft = { channel: "none", meeting: "none", formalTo: "contact", backchannelTo: null, timing: "now", followUp: false, format: "not_applicable", posture: [], escalateToMaster: false, message: "", basedOnRules: [] } as const;
  meta.queue.push({ scene: { id, set: "train", clientId, type, month, situation }, draft: { ...draft, posture: [] } as never });
  meta.pos = Math.min(meta.pos, meta.queue.length - 1);
  meta.paused = false;
  s.saveMeta(meta);
  redirect("/choba"); // the 帳場 drafts it live (draftLive) before showing the card
}

/** Own mode: start the comparison test — prose first, then judging (D-060). */
export async function ownStartCompare() {
  await requireOwn();
  const s = openSession("own", OWN_SID);
  if (!s) redirect("/own");
  const meta = readMeta("own", OWN_SID);
  // Only situations added from now on take part: a card already drafted may have been read, so its prose would not be "first".
  meta.compare = meta.compare ?? { startedAt: new Date().toISOString(), fromIndex: meta.queue.length };
  s.saveMeta(meta);
  redirect("/choba/write");
}

/** Own mode: the master's counts on the summary page — a number per prose text, yes/no per learned 心得 (D-060). */
export async function ownSaveCounts(formData: FormData) {
  await requireOwn();
  const s = openSession("own", OWN_SID);
  if (!s) redirect("/own");
  const meta = readMeta("own", OWN_SID);
  const prose: Record<string, number> = {};
  for (const w of meta.writes ?? []) {
    const raw = formData.get(`prose:${w.sceneId}`);
    if (raw === null || raw === "") continue; // left out: not counted, rather than counted as 0
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 0 && n <= 50) prose[w.sceneId] = n;
  }
  const rules: Record<string, boolean> = {};
  for (const r of await s.store.listRules()) if (r.status === "active" && r.sources.some((x) => x.kind !== "ledger")) rules[r.id] = formData.get(`rule:${r.id}`) === "1";
  meta.counts = { prose, rules };
  s.saveMeta(meta);
  revalidatePath("/choba/report");
}

/** 全部消す: the own folder (company, ledger, 心得帳, judgments). Needs the word 消す typed. */
export async function ownDeleteAll(formData: FormData) {
  await requireOwn();
  if (String(formData.get("confirm") ?? "").trim() !== "消す") throw new Error("type 消す to confirm");
  // Not while the apprentice is still working: a late write would bring data back after the delete.
  const s = openSession("own", OWN_SID);
  if (s?.meta.pending.some((p) => ["queued", "interpreting", "choosing", "verifying"].includes(p.status))) throw new Error("弟子の読み取りが終わってから消してください");
  if (deleteOwnData() === "refused") throw new Error("このフォルダは自分の会社モードが作ったものではないため、消しませんでした");
  reloadOwnWorld();
  redirect("/own");
}
