"use server";

/**
 * Server Actions. They are reachable by direct POST, so every input is validated here (Next.js Data Security guide).
 * The API key is only used server-side (src/lib/claude.ts). Nothing here logs session content.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getSession, liveEnabled, readMeta, startSession, type Mode } from "@/src/server/session";
import { applyChoice, interpretInBackground } from "@/src/server/background";
import { afterConfirm, afterRegression, startVerification } from "@/src/server/verify-ui";
import { recordTrigger } from "@/src/learning/compile";
import type { SessionMeta, SuccessorTurn, Timing } from "@/src/server/session";
import { askSuccessor } from "@/src/successor/ask";
import type { Usage } from "@/src/lib/claude";
import { allowLive, recordSpend } from "@/src/server/limits";
import { CLIENTS, getClient, HISTORY_QUESTIONS } from "@/src/core/world";
import recorded from "@/data/demo/recorded-answers.json";

export async function start(formData: FormData) {
  const mode = formData.get("mode");
  if (mode !== "demo" && mode !== "trial" && mode !== "field") throw new Error("invalid mode");
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

/** Client-measured durations (ms) from hidden fields; clamped so a bad value can't poison the field-test numbers. */
function ms(formData: FormData, from: string, to: string): number | null {
  const a = Number(formData.get(from));
  const b = Number(formData.get(to));
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.min(b - a, 30 * 60_000);
}

function addTimings(meta: SessionMeta, t: Timing[]) {
  if (meta.mode !== "field") return;
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
  const item = s.meta.queue[s.meta.pos];
  if (!item || item.scene.id !== sceneId) return; // stale form (double submit) — ignore
  const j = await s.store.addJudgment({
    at: new Date().toISOString(),
    sceneId: item.scene.id,
    clientId: item.scene.clientId,
    sceneType: item.scene.type,
    proposal: item.draft,
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
  if (verdict !== "○") meta.pending.unshift({ judgmentId: j.id, sceneId: item.scene.id, status: live ? "queued" : "offline" });
  s.saveMeta(meta);
  if (live) after(() => interpretInBackground(s.mode, s.sid, j.id));
  revalidatePath("/choba");
}

/** 読み方の候補を選ぶ（index）/ どれでもない（none）. */
export async function choose(formData: FormData) {
  const s = await getSession();
  if (!s) redirect("/");
  const judgmentId = String(formData.get("judgmentId") ?? "");
  const pick = String(formData.get("pick") ?? "");
  if (!/^J-\d{4}$/.test(judgmentId) || !/^(none|[0-2])$/.test(pick)) throw new Error("invalid choice");
  if (!liveEnabled()) return;
  const index = pick === "none" ? null : Number(pick);
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
  meta.pending = meta.pending.map((p) => (p.judgmentId === judgmentId && p.status === "needs-choice" ? { ...p, status: "choosing", pick: index } : p));
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
  if (!CLIENTS.some((c) => c.id === clientId) || !question) throw new Error("invalid question");
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
      const citations = a.citations.map((c) => {
        const r = rules.find((x) => x.id === c.ruleId)!;
        const hist = r.history.map((h) => `${h.date} ${h.before ? `「${h.before}」→「${h.after}」` : `「${h.after}」`}${h.trigger ? `（きっかけ：${h.trigger}）` : ""}`).join(" ／ ");
        return { ruleId: c.ruleId, history: `${r.text}${r.when ? `（${r.when}）` : ""}　沿革：${hist}` };
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
    meta.pending = meta.pending.map((x) => (x.judgmentId === judgmentId ? { ...x, status: "applied", note: "お試し上限のため、確かめはここまでにしました" } : x));
    s.saveMeta(meta);
    revalidatePath("/choba");
    return;
  }
  meta.pending = meta.pending.map((x) => (x.judgmentId === judgmentId ? { ...x, status: "verifying" } : x));
  s.saveMeta(meta);
  const v = verdict as "○" | "△" | "×";
  after(() => (step === "confirm" ? afterConfirm(s.mode, s.sid, judgmentId, v, remark) : afterRegression(s.mode, s.sid, judgmentId, v, remark)));
  revalidatePath("/choba");
}

/** 実地テスト: the same etiquette written as prose, timed (for t_write). Field mode only. */
export async function submitWrite(formData: FormData) {
  const s = await getSession();
  if (!s || s.mode !== "field") redirect("/");
  const sceneId = String(formData.get("sceneId") ?? "");
  const text = String(formData.get("text") ?? "").trim().slice(0, 2000);
  if (!/^T\d{2}$/.test(sceneId) || !text) throw new Error("invalid write");
  const t = ms(formData, "shownAt", "submitAt");
  const meta = readMeta(s.mode, s.sid);
  meta.writes = [...(meta.writes ?? []).filter((w) => w.sceneId !== sceneId), { sceneId, text, ms: t ?? 0 }];
  if (t !== null) addTimings(meta, [{ kind: "write", sceneId, ms: t, chars: text.length }]);
  s.saveMeta(meta);
  revalidatePath("/choba/write");
}
