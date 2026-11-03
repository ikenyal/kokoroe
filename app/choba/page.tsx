import { LimitNote } from "../limit-note";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CHANNEL_JA, FORMAT_JA, MEETING_JA, POSTURE_JA, TIMING_JA, who } from "@/src/core/labels";
import { SCENE_TYPE_LABELS, type Client, type Proposal } from "@/src/core/types";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import type { KokoroeRule } from "@/src/learning/types";
import demo from "@/data/demo/demo-snapshot.json";
import { lastUndoable } from "@/src/server/undo";
import { ScrollToAction } from "./scroll-to-action";
import { draftLive } from "@/src/server/background";
import { getSession, liveEnabled, type Pending } from "@/src/server/session";
import { answerWhy, choose, pause, undo, verifyCheck } from "../actions";
import { TimedFields } from "./timed";
import { Mark, VERDICT_WORD } from "../marks";
import { enforceHitl } from "@/src/disciple/hitl";
import { AutoRefresh } from "./auto-refresh";
import { JudgeForm } from "./judge-form";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.6em_1fr] gap-3 sm:grid-cols-[7em_1fr] border-t border-keisen py-3 first:border-t-0">
      <dt className="text-[13px] text-nibi">{label}</dt>
      <dd className="yomi text-[16px]">{children}</dd>
    </div>
  );
}

function ProposalView({ p, client, ruleText }: { p: Proposal; client: Client; ruleText: (id: string) => string }) {
  const front = `${who(client, p.formalTo)}へ ${CHANNEL_JA[p.channel]}${p.meeting !== "none" ? `、${MEETING_JA[p.meeting]}` : ""}`;
  return (
    <>
      {/* 表と裏 — the two lines that carry the etiquette. */}
      {p.escalateToMaster && (
        <p className="mt-6 border-l-4 border-shu bg-shu-soft px-4 py-2 text-[15px] text-sumi">
          金額・条件が絡むため、橙丸は決めていません。先方に出す前に師匠の判断が要ります。
          {p.escalatedByCode && <span className="block text-[13px] text-nibi">（値引き・契約・金額に触れる場面のため、仕組みとして自動で師匠に回しています）</span>}
        </p>
      )}
      <dl className="mt-6 border-y-2 border-sumi/80">
        <Row label="表の連絡">{p.channel === "none" ? "連絡しない" : front}</Row>
        <Row label="裏の一言">{p.backchannelTo ? `${who(client, p.backchannelTo)}にも、そっと一言` : <span className="text-nibi">なし</span>}</Row>
      </dl>
      <dl className="mt-1">
        <Row label="時期">{TIMING_JA[p.timing]}</Row>
        <Row label="後日のあいさつ">{p.followUp ? "入れる" : <span className="text-nibi">入れない</span>}</Row>
        {FORMAT_JA[p.format] && <Row label="書式">{FORMAT_JA[p.format]}</Row>}
        {p.posture.length > 0 && <Row label="伝え方">{p.posture.map((t) => POSTURE_JA[t]).join("、")}</Row>}
        {p.basedOnRules.length > 0 && (
          <Row label="根拠の心得">
            {p.basedOnRules.map((id) => (
              <Link key={id} href={`/kokoroe#${id}`} className="block text-ai underline-offset-4 hover:underline">
                {ruleText(id)}
              </Link>
            ))}
          </Row>
        )}
      </dl>
      <details className="mt-3">
        <summary className="cursor-pointer text-[14px] text-ai select-none">文面の下書きを見る</summary>
        <p className="yomi mt-3 border-l-2 border-keisen pl-4 text-[15px] whitespace-pre-line">{p.message}</p>
      </details>
    </>
  );
}

const STATUS: Record<Pending["status"], string> = {
  queued: "解釈の順番待ち",
  interpreting: "どこが違ったか読み取っています",
  "needs-choice": "どの意味でしたか",
  choosing: "選んだ読み方を心得帳に書いています",
  verifying: "新しい心得で解き直して、確かめています",
  "needs-confirm": "確かめ：直した場面を、新しい心得で解き直しました",
  "needs-regression": "回帰の確認：以前は ○ だった場面の案が変わりました",
  "rolled-back": "差し戻しました",
  withdrawn: "確かめで外れたため取り下げました",
  "needs-why": "心得帳に書きました。よければ、わけを一言",
  applied: "心得帳に書きました",
  "nothing-learned": "今回は何も覚えていません",
  offline: "記録済みの案で動いています（読み取りはライブ版で動きます）",
  error: "解釈できませんでした",
};

const DECISION_ROWS: [keyof Proposal, string, (p: Proposal, c: Client) => string][] = [
  ["channel", "表の連絡", (p, c) => (p.channel === "none" ? "連絡しない" : `${who(c, p.formalTo)}へ ${CHANNEL_JA[p.channel]}${p.meeting !== "none" ? `、${MEETING_JA[p.meeting]}` : ""}`)],
  ["backchannelTo", "裏の一言", (p, c) => (p.backchannelTo ? `${who(c, p.backchannelTo)}にも一言` : "なし")],
  ["timing", "時期", (p) => TIMING_JA[p.timing]],
  ["followUp", "後日のあいさつ", (p) => (p.followUp ? "入れる" : "入れない")],
  ["format", "書式", (p) => FORMAT_JA[p.format] || "—"],
  ["escalateToMaster", "師匠の確認", (p) => (p.escalateToMaster ? (p.escalatedByCode ? "要る（自動）" : "要る") : "—")],
];

/** One-tap check of a re-solved scene. For regression, only the decision fields that changed are shown. */
function CheckCard({ p, step, sceneId, proposal, before }: { p: Pending; step: "confirm" | "regression"; sceneId: string; proposal: Proposal; before?: Proposal }) {
  const scene = TRAIN_SCENES.find((t) => t.id === sceneId);
  const client = getClient(scene?.clientId ?? "C01");
  const rows = DECISION_ROWS.filter(([k, , f]) => !before || f(before, client) !== f(proposal, client) || k === "channel");
  return (
    <form action={verifyCheck} className="mt-2 rounded-[3px] border border-keisen p-3">
      <input type="hidden" name="judgmentId" value={p.judgmentId} />
      <input type="hidden" name="step" value={step} />
      <TimedFields />
      <p className="text-[13px]">
        {client.name}　{scene ? `${SCENE_TYPE_LABELS[scene.type]}・${scene.month}月` : sceneId}
      </p>
      <dl className="mt-1 text-[14px]">
        {rows.map(([k, label, f]) => (
          <div key={k} className="grid grid-cols-[7.5em_1fr] gap-2">
            <dt className="text-nibi">{label}</dt>
            <dd className="yomi">
              {before && f(before, client) !== f(proposal, client) && <del className="mr-1 text-nibi">{f(before, client)}</del>}
              {f(proposal, client)}
            </dd>
          </div>
        ))}
      </dl>
      <input name="remark" maxLength={120} autoComplete="off" aria-label="一言（任意）" placeholder="一言（任意）" className="mt-2 block h-9 w-full rounded-[3px] border border-waku bg-kami px-2 font-mincho text-[14px]" />
      <div className="mt-2 flex gap-2">
        {(["○", "△", "×"] as const).map((v) => (
          <button key={v} name="verdict" value={v} aria-label={`${v} ${VERDICT_WORD[v]}`} className="flex h-10 w-12 items-center justify-center rounded-[3px] border border-keisen text-shu hover:border-shu hover:bg-shu-soft">
            <Mark v={v} size={24} />
          </button>
        ))}
      </div>
    </form>
  );
}

/** Words for a scene of the queue (no internal ids on screen). */
function sceneWords(sceneId: string) {
  const t = TRAIN_SCENES.find((x) => x.id === sceneId);
  return t ? `${getClient(t.clientId).name}・${SCENE_TYPE_LABELS[t.type]}` : "";
}

/**
 * Without a key nothing is interpreted. Show instead what the live version writes, from the recorded demo kokoroe-chō: the rule
 * learned from this same scene if there is one, otherwise the 丸新酒造 example (a quiet word to the 蔵元).
 */
function OfflineExample({ sceneId }: { sceneId: string }) {
  const rules = demo.store.rules as KokoroeRule[];
  const learned = (r: KokoroeRule) => r.sources.some((x) => x.kind !== "ledger");
  const r = rules.find((x) => learned(x) && x.sources.some((y) => y.sceneId === sceneId)) ?? rules.find((x) => learned(x) && x.text.includes("蔵元"));
  if (!r) return null;
  const from = r.sources.find((x) => x.kind !== "ledger");
  return (
    <div className="mt-2 rounded-[3px] border border-keisen bg-kami-2/50 px-3 py-2 text-[13.5px]">
      <p className="text-nibi">ライブ版なら、ここで弟子が {from?.verdict ?? "△"} の意味を読み取り、心得帳にこう書きます（記録済みの例{from && from.sceneId !== sceneId ? `：${sceneWords(from.sceneId)}の場面から` : ""}）。</p>
      <p className="yomi mt-1 text-[15px]">「{r.text}」</p>
      {r.when && <p className="yomi text-nibi">条件：{r.when}</p>}
    </div>
  );
}

function PendingItem({ p, beforeOf, ruleText }: { p: Pending; beforeOf: (judgmentId: string) => Proposal | undefined; ruleText: (id: string) => string }) {
  return (
    <li className="border-t border-keisen py-3 first:border-t-0">
      <p className="text-[13px] text-nibi">
        {sceneWords(p.sceneId)}　{STATUS[p.status]}
        {p.round === 2 && p.status === "needs-choice" ? "（別の読み方）" : ""}
      </p>
      {p.status === "offline" && <OfflineExample sceneId={p.sceneId} />}
      {p.ruleId && (
        <p className="text-[13px] text-nibi">
          書いた心得：
          <Link className="yomi text-ai underline-offset-4 hover:underline" href={`/kokoroe#${p.ruleId}`}>
            {ruleText(p.ruleId)}
          </Link>
        </p>
      )}
      {p.status === "needs-choice" && p.candidates && (
        <form action={choose} className="mt-2 space-y-2">
          <input type="hidden" name="judgmentId" value={p.judgmentId} />
          <TimedFields />
          {p.candidates.map((c, i) => (
            <button key={i} name="pick" value={String(i)} className="yomi block w-full rounded-[3px] border border-keisen px-3 py-2 text-left text-[15px] hover:border-ai hover:bg-ai-soft">
              {c.text}
              {c.when && <span className="text-nibi">（{c.when}）</span>}
            </button>
          ))}
          <button name="pick" value="none" className="text-[14px] text-nibi underline-offset-4 hover:underline">
            どれでもない
          </button>
        </form>
      )}
      {p.status === "needs-confirm" && p.verify?.retried && p.note && <p className="text-[13px] text-nibi">{p.note}</p>}
      {p.status === "needs-confirm" && p.verify?.confirm && <CheckCard p={p} step="confirm" sceneId={p.sceneId} proposal={p.verify.confirm.proposal} />}
      {p.status === "needs-regression" && p.verify?.current && (
        <CheckCard p={p} step="regression" sceneId={p.verify.current.sceneId} proposal={p.verify.current.proposal} before={beforeOf(p.verify.current.pastJudgmentId)} />
      )}
      {(p.status === "applied" || p.status === "rolled-back") && p.note?.startsWith("確かめ済み") && <p className="text-[13px] text-nibi">{p.note}</p>}
      {(p.status === "rolled-back" || p.status === "withdrawn") && p.note && <p className="text-[13px] text-shu">{p.note}</p>}
      {p.status === "needs-why" && (
        <form action={answerWhy} className="mt-2 space-y-2">
          <input type="hidden" name="judgmentId" value={p.judgmentId} />
          <TimedFields />
          <label className="block">
            <span className="text-[13px] text-nibi">なぜそうなったか（答えなくても大丈夫です）</span>
            <input
              name="why"
              maxLength={120}
              autoComplete="off"
              placeholder="例：以前、先方とこういうことがあった"
              className="mt-1 block h-11 w-full rounded-[3px] border border-waku bg-kami px-3 font-mincho text-[15px] placeholder:text-nibi"
            />
          </label>
          <div className="flex gap-3">
            <button className="rounded-[3px] bg-sumi px-4 py-2 text-[14px] text-kami">わけを残す</button>
            <button name="skip" value="1" className="text-[14px] text-nibi underline-offset-4 hover:underline">
              今は答えない
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

export default async function ChobaPage() {
  const s = await getSession();
  if (!s) redirect("/");
  const live = liveEnabled();
  if (live && !s.meta.paused && s.meta.queue[s.meta.pos] && !s.meta.queue[s.meta.pos].live) await draftLive(s, s.meta.pos);
  const meta = (await getSession())!.meta;
  const item = meta.paused ? undefined : meta.queue[meta.pos];
  const busy = meta.pending.some((p) => ["queued", "interpreting", "choosing", "verifying"].includes(p.status));
  const recent = meta.pending.slice(0, 6);
  const judgments = await s.store.listJudgments();
  const rules = await s.store.listRules();
  const ruleText = (id: string) => rules.find((r) => r.id === id)?.text ?? "（心得帳を見る）";
  const undoable = await lastUndoable(s);
  // Something the master is asked to answer in the side panel (a reading, a "why?", a check): on a phone, show it first.
  const asking = recent.filter((p) => ["needs-choice", "needs-why", "needs-confirm", "needs-regression"].includes(p.status));
  const signature = asking.map((p) => `${p.judgmentId}:${p.status}`).join(",");
  const done = Math.min(meta.pos, meta.queue.length);
  const label = s.mode === "demo" ? "デモの続き" : s.mode === "field" ? "師匠役テスト" : "お試し";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_19rem]">
      <AutoRefresh active={busy} />
      <ScrollToAction signature={signature} />
      <div className="lg:col-span-2 -mb-6 empty:hidden"><LimitNote reason={meta.limit} /></div>
      <section aria-labelledby="card-h">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-[13px] text-nibi">
            {label}　<span className="tabular-nums">{done} / {meta.queue.length}</span> 件 済み
            {!live && "　記録済みの案を表示しています"}
          </p>
          <div aria-hidden className="h-1.5 min-w-24 flex-1 rounded-full bg-keisen/60">
            <div className="h-full rounded-full bg-ai" style={{ width: `${(100 * done) / Math.max(1, meta.queue.length)}%` }} />
          </div>
          {item && (
            <form action={pause}>
              <button className="text-[13px] text-ai underline-offset-4 hover:underline">ここで区切る</button>
            </form>
          )}
        </div>
        {undoable && (
          <form action={undo} className="mt-2 text-[13px] text-nibi">
            <input type="hidden" name="judgmentId" value={undoable.judgment.id} />
            直前の判定：{sceneWords(undoable.judgment.sceneId)}に <span className="font-mincho text-shu">{undoable.judgment.verdict}</span>
            {undoable.block === "busy" ? (
              <span>（弟子が読み取り中です。終わると取り消せます）</span>
            ) : undoable.block === "changed-since" ? (
              <span>（この心得は、そのあと別の直しでも変わったため、ここからは取り消せません。心得帳で消せます）</span>
            ) : undoable.block === "follow-up" ? (
              <span>（確かめから別の直しが続いているため、ここからは取り消せません）</span>
            ) : (
              <button className="ml-2 text-ai underline-offset-4 hover:underline">
                取り消す{undoable.writes ? "（心得帳に書いた分も戻し、沿革に残します）" : ""}
              </button>
            )}
          </form>
        )}
        {item ? (
          <article className="mt-4">
            <header>
              <h1 id="card-h" className="font-mincho text-[25px] tracking-[0.04em]">
                {getClient(item.scene.clientId).name}
                <span className="mt-1 block text-[15px] text-nibi sm:mt-0 sm:ml-3 sm:inline">{SCENE_TYPE_LABELS[item.scene.type]}・{item.scene.month}月</span>
              </h1>
              <blockquote className="yomi mt-3 border-l-2 border-ai pl-4 text-[16px]">{item.scene.situation}</blockquote>
              <p className="mt-6 text-[13px] text-nibi">弟子（橙丸）の案</p>
            </header>
            <ProposalView p={enforceHitl(item.scene, item.draft)} client={getClient(item.scene.clientId)} ruleText={ruleText} />
            <JudgeForm key={item.scene.id} sceneId={item.scene.id} />
          </article>
        ) : meta.paused ? (
          <div className="mt-6">
            <h1 className="font-mincho text-[22px]">ここで区切りました</h1>
            <p className="yomi mt-2">
              {done} 件まで見ました。それまでに育った心得帳は、<Link className="text-ai underline" href="/kokoroe">心得帳</Link>と<Link className="text-ai underline" href="/noren">暖簾を継ぐ</Link>でそのまま使えます。
            </p>
            <form action={pause} className="mt-4">
              <input type="hidden" name="resume" value="1" />
              <button className="rounded-[3px] bg-sumi px-5 py-2.5 text-[15px] text-kami">続きから</button>
            </form>
          </div>
        ) : (
          <div className="mt-6">
            <h1 className="font-mincho text-[22px]">今日の稽古はここまでです</h1>
            {s.mode === "field" && (
              <p className="yomi mt-2">
                続けて<Link className="text-ai underline" href="/choba/write">同じ作法を文章で書く</Link>へ。最後に<Link className="text-ai underline" href="/choba/report">所要時間のまとめ</Link>を見られます。
              </p>
            )}
            <p className="yomi mt-2">
              育った心得帳は<Link className="text-ai underline" href="/kokoroe">心得帳</Link>で読めます。後任の相談は<Link className="text-ai underline" href="/noren">暖簾を継ぐ</Link>へ。
            </p>
          </div>
        )}
      </section>

      <aside aria-labelledby="bg-h" className={`scroll-mt-4 lg:order-none lg:border-l-2 lg:border-keisen lg:pl-6 ${asking.length ? "order-first" : ""}`}>
        <h2 id="bg-h" className="text-[15px] font-bold">弟子の読み取り</h2>
        <p className="mt-1 text-[13px] text-nibi">△・× の意味を弟子が読み取り、心得帳に書きます。待たずに次の案へ進めます。</p>
        {recent.length ? (
          <ul className="mt-3">{recent.map((p) => <PendingItem key={p.judgmentId} p={p} ruleText={ruleText} beforeOf={(id) => judgments.find((j) => j.id === id)?.proposal} />)}</ul>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-[14px] text-nibi">
            <Mark v="○" size={20} className="text-shu" />
            まだ直しはありません。
          </p>
        )}
      </aside>
    </div>
  );
}
