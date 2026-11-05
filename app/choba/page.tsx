import { LimitNote } from "../limit-note";
import { DemoGuide } from "./demo-guide";
import { heldForProse } from "@/src/server/own-result";
import { DIFF_AREAS } from "@/src/learning/area";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FORMAT_JA, POSTURE_JA, TIMING_JA } from "@/src/core/labels";
import { DANDORI_ROWS, recordedRun, ruleEffect, type RuleEffect, AREA_ON_SCREEN, means, noIds, quietWord, toWhom, VISIT_ROWS } from "../dandori";
import { SCENE_TYPE_LABELS, type Client, type Proposal, type Scene } from "@/src/core/types";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import type { JudgmentRecord, KokoroeRule } from "@/src/learning/types";
import demo from "@/data/demo/demo-snapshot.json";
import { lastUndoable } from "@/src/server/undo";
import { ScrollToAction } from "./scroll-to-action";
import { standing } from "@/src/core/rank";
import { draftLive, startPrefetch } from "@/src/server/background";
import { after } from "next/server";
import { getSession, liveEnabled, type Pending } from "@/src/server/session";
import { answerWhy, choose, ownAddScene, pause, undo, verifyCheck } from "../actions";
import { CLIENTS } from "@/src/core/world";
import { TimedFields } from "./timed";
import { Mark, VERDICT_WORD } from "../marks";
import { enforceHitl } from "@/src/disciple/hitl";
import { AutoRefresh } from "./auto-refresh";
import { JudgeForm } from "./judge-form";

function Row({ label, gloss, children, main = false }: { label: string; gloss?: string; children: React.ReactNode; main?: boolean }) {
  return (
    <div className={`grid grid-cols-[6.6em_1fr] gap-3 border-t border-keisen first:border-t-0 sm:grid-cols-[7em_1fr] ${main ? "py-2.5" : "py-1.5"}`}>
      <dt className={main ? "pt-0.5 text-[14px] leading-snug text-sumi" : "text-[13px] text-nibi"}>
        {label}
        {gloss && <span className="block text-[12px] text-nibi">{gloss}</span>}
      </dt>
      <dd className={`yomi ${main ? "text-[18px]" : "text-[15px] text-sumi/90"}`}>{children}</dd>
    </div>
  );
}

/**
 * One part of the card, like a section of a ledger page: a short label in the left margin (vertical on wide screens),
 * the content on the right, divided by ruled lines. The parts are read in order: 場面 → 段取り → そのほか → 判定.
 */
export function Ledger({ label, note, children, quiet = false }: { label: string; note?: string; children: React.ReactNode; quiet?: boolean }) {
  return (
    <section aria-label={label} className="grid gap-x-5 border-t border-keisen pt-4 pb-5 sm:grid-cols-[2.2rem_1fr]">
      <h2 className={`font-mincho sm:tate ${quiet ? "text-[13px] text-nibi" : "text-[15px] text-sumi"} tracking-[0.2em]`}>{label}</h2>
      <div className="mt-1 sm:mt-0">
        {note && <p className="mb-1 text-[13px] text-nibi">{note}</p>}
        {children}
      </div>
    </section>
  );
}

function ProposalView({ p, client, ruleText }: { p: Proposal; client: Client; ruleText: (id: string) => string }) {
  const quiet = quietWord(p, client);
  return (
    <>
      {/* 段取り — to whom, by what, when, and the quiet word on the side: the part the master judges. The draft text is secondary. */}
      <Ledger label="段取り" note="弟子（橙丸）の段取りの案。判定は、ここを見て。">
        <dl>
          <Row main label="誰に" gloss="表の連絡、正式に">{toWhom(p, client)}</Row>
          <Row main label="何で">{means(p)}</Row>
          <Row main label="いつ">{TIMING_JA[p.timing]}</Row>
          <Row main label="裏で誰に" gloss="決裁者へ根回し">{quiet ?? <span className="text-nibi">なし</span>}</Row>
          <Row main label="後日">{p.followUp ? "あらためて、あいさつを入れる" : <span className="text-nibi">なし</span>}</Row>
        </dl>
        {p.escalateToMaster && (
          <p className="mt-3 border-y border-sumi/40 py-2 text-[15px] text-sumi">
            金額・条件が絡む場面です。金額や条件は橙丸が決めず、先方に出す前に師匠が判断します。
            {p.escalatedByCode && <span className="block text-[13px] text-nibi">（値引き・契約・金額に触れる場面のため、仕組みとして自動で師匠に回しています）</span>}
          </p>
        )}
      </Ledger>
      {p.visit && <VisitView v={p.visit} />}
      <Ledger label="補足" quiet>
        <dl>
          {FORMAT_JA[p.format] && <Row label="書式">{FORMAT_JA[p.format]}</Row>}
          {p.posture.length > 0 && <Row label="伝え方">{p.posture.map((t) => POSTURE_JA[t]).join("、")}</Row>}
          {p.basedOnRules.length > 0 && (
            <Row label="弟子が挙げた心得">
              {p.basedOnRules.map((id) => (
                <Link key={id} href={`/kokoroe#${id}`} className="block text-ai underline-offset-4 hover:underline">
                  {ruleText(id)}
                </Link>
              ))}
            </Row>
          )}
        </dl>
        {p.channel !== "none" && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[14px] text-ai select-none">{p.channel === "phone" ? "電話で話すことの下書き（参考）" : "文面の下書き（参考）"}</summary>
            <p className="yomi mt-3 border-l-2 border-keisen pl-4 text-[15px] whitespace-pre-line">{p.message}</p>
          </details>
        )}
      </Ledger>
    </>
  );
}

/**
 * 「直したら、次が変わる」: shown on the first draft where a learned 心得 takes effect — the corrected draft beside this one,
 * the changed rows marked. `recorded`: the correction is from the recorded training run, not from this visitor (said so).
 */
function EffectView({ effect, client, draft, words, ruleHref, recorded }: { effect: RuleEffect; client: Client; draft: Proposal; words: Words; ruleHref: string | null; recorded: boolean }) {
  const { rule, before } = effect;
  const was = getClient(before.clientId);
  return (
    <Ledger
      label="変化"
      note={recorded ? "記録した稽古で、師匠が直したあと、この心得が初めて効いた案です。" : "あなたの直しから書いた心得が、初めて効いた案です。"}
    >
      <p className="yomi text-[15.5px]">
        心得「{ruleHref ? <Link href={ruleHref} className="text-ai underline-offset-4 hover:underline">{rule.text}</Link> : rule.text}」
      </p>
      {(() => {
        const rows = DANDORI_ROWS.map(([label, show, fields]) => ({
          label,
          was: show(before.proposal, was),
          now: show(draft, client),
          point: fields.includes(rule.fix!.field as keyof Proposal),
        }));
        const point = rows.find((r) => r.point);
        const others = rows.filter((r) => !r.point && r.was !== r.now).map((r) => r.label);
        return (
          <>
            {point && (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-y border-keisen py-3">
                <dt className="whitespace-nowrap text-[13px] text-sumi">{({ 何で: "何で（手段）", いつ: "いつ（時期）" } as Record<string, string>)[point.label] ?? point.label}</dt>
                <dd className="grid gap-1">
                  <span className="text-[12.5px] text-sumi/75">
                    {/* Always another scene (ruleEffect skips the corrected one): say so, so it does not read as the wrong scene (ui-critic 11/5). */}
                    直したのは、別の場面（{words(before.sceneId)}）の案<span className="whitespace-nowrap">（師匠 <span className="font-mincho text-shu">{before.verdict}</span>
                    {before.remark ? `「${before.remark}」` : "、一言なし"}）</span>
                  </span>
                  {/* No strikethrough: a line through 「なし」 reads as 「な七」 (ui-critic 11/5). The two labels say which is which. */}
                  <span className="text-[14.5px] text-sumi/75">その案：{point.was}</span>
                  <span className="self-start bg-ai-soft px-1.5 font-mincho text-[17px] text-sumi">この案：{point.now}</span>
                </dd>
              </dl>
            )}
            {others.length > 0 && <p className="mt-1.5 text-[13px] text-sumi/75">ほかに変わった行：{others.join("・")}（心得とは別の違い）</p>}
          </>
        );
      })()}
    </Ledger>
  );
}

/** 訪問の段取り (D-061): only when the 段取り visits the client. Corrected by the same ○△× and one line as the rest. */
function VisitView({ v }: { v: NonNullable<Proposal["visit"]> }) {
  return (
    <Ledger label="訪問" note="訪問するときの段取り。違えば、判定の一言で直してください。">
      <dl>
        {VISIT_ROWS.map(([k, label]) => (
          <Row key={k} label={label}>{noIds(v[k]) || <span className="text-nibi">—</span>}</Row>
        ))}
      </dl>
    </Ledger>
  );
}

/** The status words for one pending item. After 「どれでもない」 the pick is null and nothing is written yet: the apprentice is
 *  making other readings (体験の目 8, 11/6: it said 「選んだ読み方を心得帳に書いています」 for ~3 s). Display only. */
const statusOf = (p: Pending) => (p.status === "choosing" && p.pick === null ? "ほかの読み方を考えています" : STATUS[p.status]);

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
  offline: "次の案は下です",
  error: "解釈できませんでした",
};

const DECISION_ROWS: [keyof Proposal, string, (p: Proposal, c: Client) => string][] = [
  ["formalTo", "誰に", (p, c) => toWhom(p, c)],
  ["channel", "何で", (p) => means(p)],
  ["timing", "いつ", (p) => TIMING_JA[p.timing]],
  ["backchannelTo", "裏で誰に", (p, c) => quietWord(p, c) ?? "なし"],
  ["followUp", "後日", (p) => (p.followUp ? "あいさつを入れる" : "なし")],
  ["format", "書式", (p) => FORMAT_JA[p.format] || "—"],
  ["escalateToMaster", "師匠の確認", (p) => (p.escalateToMaster ? (p.escalatedByCode ? "要る（自動）" : "要る") : "—")],
];

/** One-tap check of a re-solved scene. For regression, only the decision fields that changed are shown. */
function CheckCard({ p, step, sceneId, proposal, before, sceneOf }: { p: Pending; step: "confirm" | "regression"; sceneId: string; proposal: Proposal; before?: Proposal; sceneOf: SceneOf }) {
  // Own mode: the scene lives in the session's queue, not in the fictional training scenes (it used to fall back to C01 and crash).
  const scene = sceneOf(sceneId);
  const client = getClient(scene?.clientId ?? CLIENTS[0].id);
  const rows = DECISION_ROWS.filter(([k, , f]) => !before || f(before, client) !== f(proposal, client) || k === "channel" || k === "formalTo");
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
        {proposal.visit &&
          VISIT_ROWS.map(([k, label]) => (
            <div key={k} className="grid grid-cols-[7.5em_1fr] gap-2">
              <dt className="text-nibi">{label}</dt>
              <dd className="yomi">{noIds(proposal.visit![k]) || "—"}</dd>
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

type Words = (sceneId: string) => string;

/**
 * Words for a scene (no internal ids on screen). Scenes the master wrote in own mode live only in the session's queue, so the
 * page builds this per request from the queue, falling back to the fictional training scenes.
 */
function sceneWordsFrom(queue: { scene: { id: string; clientId: string; type: keyof typeof SCENE_TYPE_LABELS } }[]): Words {
  return (sceneId) => {
    const t = queue.find((q) => q.scene.id === sceneId)?.scene ?? TRAIN_SCENES.find((x) => x.id === sceneId);
    return t ? `${getClient(t.clientId).name}・${SCENE_TYPE_LABELS[t.type]}` : "";
  };
}
const sceneWords = sceneWordsFrom([]); // fictional scenes only (the recorded example)

/**
 * Without a key nothing is interpreted. Show instead what the live version writes, from the recorded demo kokoroe-chō: the rule
 * learned from this same scene if there is one, otherwise the 丸新酒造 example (a quiet word to the 蔵元).
 */
function OfflineExample({ sceneId, verdict }: { sceneId: string; verdict?: string }) {
  const rules = demo.store.rules as KokoroeRule[];
  const learned = (r: KokoroeRule) => r.sources.some((x) => x.kind !== "ledger");
  const r = rules.find((x) => learned(x) && x.sources.some((y) => y.sceneId === sceneId)) ?? rules.find((x) => learned(x) && x.text.includes("蔵元"));
  if (!r) return null;
  const from = r.sources.find((x) => x.kind !== "ledger");
  return (
    <div className="mt-2 border-t border-keisen pt-2 text-[13.5px]">
      {/* The mark is the one just recorded (ui-critic 11/5: after × it said △); an example from another scene says so first. */}
      <p className="text-nibi">
        公開版のライブでは、ここで弟子がこの {verdict ?? from?.verdict ?? "△"} の意味を読み取り、心得帳に書きます。
        {from && from.sceneId !== sceneId ? (
          <>たとえば記録した稽古では、別の場面（{sceneWords(from.sceneId)}）の {from.verdict} から、<span className="whitespace-nowrap">こう書きました。</span></>
        ) : (
          <>記録した稽古では、この場面から<span className="whitespace-nowrap">こう書きました。</span></>
        )}
      </p>
      {/* Ruled off under its own label: it is a recorded example, not what this mark produced (ui-critic 11/6). */}
      <div className="mt-2 border-l-2 border-keisen pl-3">
        <p className="text-[12px] text-nibi">記録した稽古の例{from && from.sceneId !== sceneId ? "（別の場面）" : ""}</p>
        <p className="yomi text-[15px]">「{r.text}」</p>
        {r.when && <p className="yomi text-nibi">条件：{r.when}</p>}
      </div>
    </div>
  );
}

type SceneOf = (sceneId: string) => Scene | undefined;

function PendingItem({ p, verdict, beforeOf, ruleText, words, sceneOf }: { p: Pending; verdict?: string; beforeOf: (judgmentId: string) => Proposal | undefined; ruleText: (id: string) => string; words: Words; sceneOf: SceneOf }) {
  return (
    <li className="border-t border-keisen py-3 first:border-t-0">
      <p className="text-[13px] text-nibi">
        {words(p.sceneId)}{/* offline: the status line above already says it; the example below says what the live version does */}{p.status === "offline" ? "" : `　${statusOf(p)}`}
        {p.round === 2 && p.status === "needs-choice" ? `（別の読み方${p.area ? `：「${AREA_ON_SCREEN[p.area]}」を手がかりに` : ""}）` : ""}
      </p>
      {p.status === "offline" && <OfflineExample sceneId={p.sceneId} verdict={verdict} />}
      {p.ruleId && (
        <p className="text-[13px] text-nibi">
          書いた心得：
          <Link className="yomi text-ai underline-offset-4 hover:underline" href={`/kokoroe#${p.ruleId}`}>
            {ruleText(p.ruleId)}
          </Link>
        </p>
      )}
      {p.status === "needs-choice" && p.candidates && (
        <form action={choose} className="mt-2">
          <input type="hidden" name="judgmentId" value={p.judgmentId} />
          <TimedFields />
          {p.candidates.map((c, i) => (
            <button key={i} name="pick" value={String(i)} className="yomi block w-full border-t border-keisen px-1 py-2.5 text-left text-[15px] last-of-type:border-b hover:bg-ai-soft">
              {c.text}
              {c.when && <span className="text-nibi">（{c.when}）</span>}
            </button>
          ))}
          {(p.round ?? 1) === 1 && p.noRemark ? (
            // 「どこが違う？」 (D-057): only when there was no remark; in the same tap as 「どれでもない」, optional. A hint for the next readings.
            <fieldset className="border-t border-keisen pt-2">
              <legend className="text-[13px] text-nibi">どれでもないとき、どこが違いますか（押さなくても進めます）</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {DIFF_AREAS.map((a) => (
                  <button key={a} name="pick" value={`none:${a}`} className="h-11 min-w-14 rounded-[3px] border border-keisen px-3 text-[15px] hover:border-ai hover:bg-ai-soft">
                    {AREA_ON_SCREEN[a]}
                  </button>
                ))}
                <button name="pick" value="none" className="h-11 px-2 text-[14px] text-nibi underline-offset-4 hover:underline">
                  どれでもない（場所は選ばない）
                </button>
              </div>
            </fieldset>
          ) : (
            <button name="pick" value="none" className="block min-h-11 w-full border-t border-keisen px-1 text-left text-[14px] text-nibi underline-offset-4 hover:underline">
              どれでもない
            </button>
          )}
        </form>
      )}
      {p.status === "needs-confirm" && p.verify?.retried && p.note && <p className="text-[13px] text-nibi">{p.note}</p>}
      {p.status === "needs-confirm" && p.verify?.confirm && <CheckCard p={p} step="confirm" sceneId={p.sceneId} proposal={p.verify.confirm.proposal} sceneOf={sceneOf} />}
      {p.status === "needs-regression" && p.verify?.current && (
        <CheckCard p={p} step="regression" sceneId={p.verify.current.sceneId} proposal={p.verify.current.proposal} before={beforeOf(p.verify.current.pastJudgmentId)} sceneOf={sceneOf} />
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

/** Own mode: the master writes the next situation; the apprentice drafts for it (live). */
function NewScene() {
  const field = "mt-1 block h-11 w-full rounded-[3px] border border-waku bg-kami px-2 text-[15px]";
  return (
    <form action={ownAddScene} className="mt-6 space-y-4">
      <TimedFields />
      <h1 className="font-mincho text-[22px]">次の場面を書く</h1>
      <p className="text-[13.5px] text-nibi">取引先に何かを伝える・相談する場面を、ありのままに書いてください。弟子が案を作ります。送るのはあなたです（弟子は何も送りません）。</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem]">
        <label className="text-[13px] text-nibi">取引先
          <select name="clientId" required className={field}>{CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label className="text-[13px] text-nibi">場面の種類
          <select name="type" required className={field}>{Object.entries(SCENE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <label className="text-[13px] text-nibi">月
          <input name="month" type="number" min={1} max={12} placeholder="例：4" required className={field} />
        </label>
      </div>
      <label className="block text-[13px] text-nibi">場面
        <textarea name="situation" required maxLength={600} rows={4} placeholder="例：来月の納品が1週間遅れそう。まだ確定ではない。" className="mt-1 block w-full rounded-[3px] border border-waku bg-kami p-3 font-mincho text-[16px]" />
      </label>
      <button className="h-12 rounded-[3px] bg-sumi px-6 text-[15px] text-kami">弟子に案を作らせる</button>
      <p className="text-[13px] text-nibi">
        文章で書く時間と判定の時間を比べるときは、<Link className="text-ai underline" href="/choba/write">比較テスト</Link>（先に文章、そのあと判定）を使います。まとめは
        <Link className="text-ai underline" href="/choba/report">こちら</Link>。
      </p>
    </form>
  );
}

/**
 * The 帳場 blocks by design: with live Claude it drafts the card before the page is sent (the wait line says so). Next 16's
 * instant-navigation check flagged that in dev (11/6, the limit-state review); opt this segment out of the check, as documented
 * (\`instant = false\`: navigation blocks on the server, which is what it already does).
 */
export const instant = false;

export default async function ChobaPage() {
  const s = await getSession();
  if (!s) redirect("/");
  const live = liveEnabled();
  // Own-mode comparison test (D-060): a card whose situation has no prose yet is held back and NOT drafted, so the master writes
  // before seeing anything from the AI.
  const heldBack = heldForProse;
  if (live && !s.meta.paused && s.meta.queue[s.meta.pos] && !s.meta.queue[s.meta.pos].live && !heldBack(s.meta, s.meta.pos)) await draftLive(s, s.meta.pos);
  const meta = (await getSession())!.meta;
  // 先読み of the next card while this one is read (live only; used after ○ with the same 心得帳: src/server/prefetch.ts).
  if (live && !meta.paused && meta.queue[meta.pos]?.live && meta.queue[meta.pos + 1] && !meta.queue[meta.pos + 1].live && !heldBack(meta, meta.pos + 1)) {
    const run = await startPrefetch(s, meta.pos + 1);
    if (run) after(run);
  }
  const words = sceneWordsFrom(meta.queue);
  const item = meta.paused ? undefined : meta.queue[meta.pos];
  const busy = meta.pending.some((p) => ["queued", "interpreting", "choosing", "verifying"].includes(p.status));
  const recent = meta.pending.slice(0, 6);
  const judgments = await s.store.listJudgments();
  const rules = await s.store.listRules();
  // Recorded drafts cite the recorded run's 心得帳; without live learning, show that 心得's words rather than a bare link.
  const runRules = recordedRun(demo).rules;
  const ruleText = (id: string) => rules.find((r) => r.id === id)?.text ?? (!live && s.mode !== "own" ? runRules.find((r) => r.id === id)?.text : undefined) ?? "（心得帳を見る）";
  const undoable = await lastUndoable(s);
  // Something the master is asked to answer in the side panel (a reading, a "why?", a check): on a phone, show it first.
  const asking = recent.filter((p) => ["needs-choice", "needs-why", "needs-confirm", "needs-regression"].includes(p.status));
  const signature = asking.map((p) => `${p.judgmentId}:${p.status}`).join(",");
  const done = Math.min(meta.pos, meta.queue.length);
  // The track record with this client, as information only (D-055: no rank names, no lighter review).
  const record = item
    ? standing(judgments.filter((j) => j.clientId === item.scene.clientId).map((j) => ({ clientId: j.clientId, sceneType: j.sceneType, verdict: j.verdict, kind: j.kind, undone: j.undone, at: j.at })))
    : null;
  const label = s.mode === "demo" ? "デモの続き" : s.mode === "field" ? "師匠役テスト" : s.mode === "own" ? "自分の会社" : "お試し";
  // 「直したら、次が変わる」: from this session's 心得帳 first; without live learning (recorded data), from the recorded training run.
  const shown = item ? enforceHitl(item.scene, item.draft) : null;
  const run = recordedRun(demo);
  const isRecorded = (j: JudgmentRecord) => run.judgments.some((r) => r.id === j.id && r.at === j.at && r.sceneId === j.sceneId);
  const mine = item && shown ? ruleEffect(rules, judgments, item.scene, shown) : null;
  const fromRun = !mine && item && shown && !live && s.mode !== "own" ? ruleEffect(run.rules, run.judgments, item.scene, shown) : null;
  const effect = mine ?? fromRun;
  const effectRecorded = !!fromRun || (!!mine && isRecorded(mine.before));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_19rem]">
      <AutoRefresh active={busy} />
      <ScrollToAction signature={signature} />
      <div className="lg:col-span-2 -mb-6 empty:hidden"><LimitNote reason={meta.limit} /></div>
      <section aria-labelledby="card-h">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* phones: the status on its own row, the bar and 「ここで区切る」 together below it (ui-critic 11/5) */}
          <p className="basis-full text-[13px] text-nibi sm:basis-auto">
            {label}　<span className="tabular-nums">{done} / {meta.queue.length}</span> 件 済み
            {(!live || (item && !item.live)) && <span className="block sm:inline"><span className="hidden sm:inline">　</span>記録済みの案を表示しています</span>}
          </p>
          <div aria-hidden className="h-1.5 min-w-24 flex-1 rounded-full bg-keisen">
            <div className="h-full rounded-full bg-ai-fill" style={{ width: `${(100 * done) / Math.max(1, meta.queue.length)}%` }} />
          </div>
          {item && done > 0 && (
            <form action={pause}>
              <button className="inline-flex min-h-11 items-center px-1 text-[13.5px] text-ai underline-offset-4 hover:underline">ここで区切る</button>
            </form>
          )}
        </div>
        {s.mode === "demo" && !meta.paused && <DemoGuide live={live} />}
        {meta.undone && item?.scene.id === meta.undone.sceneId && (
          <p role="status" aria-live="polite" className="mt-3 border-l-2 border-ai pl-3 text-[13.5px] text-sumi">
            {words(meta.undone.sceneId)}の <span className="font-mincho text-[18px] font-bold text-shu">{meta.undone.verdict}</span> を取り消しました。この案を、もう一度判定できます。
          </p>
        )}
        {undoable && !meta.paused && !(meta.undone && item?.scene.id === meta.undone.sceneId) && (
          <form action={undo} role="status" aria-live="polite" className="mt-3 border-l-2 border-ai pl-3 text-[13.5px] text-nibi">
            <input type="hidden" name="judgmentId" value={undoable.judgment.id} />
            <span className="text-sumi">{words(undoable.judgment.sceneId)}に</span> <span className="font-mincho text-[18px] font-bold text-shu">{undoable.judgment.verdict}</span>
            {(() => {
              // What happened to it, without looking at the side panel.
              const p = meta.pending.find((x) => x.judgmentId === undoable.judgment.id);
              const said = !p ? "を記録しました。○ は心得帳を変えません" : `を記録しました。${statusOf(p)}`;
              return (
                <>
                  <span className="text-sumi">{said}</span>
                  {p?.status === "offline" && <span className="block text-[12.5px]">このデモでは弟子の読み取りは行いません（公開版のライブでは行います）。</span>}
                </>
              );
            })()}
            {undoable.block === "busy" ? (
              <span>（弟子が読み取り中です。終わると取り消せます）</span>
            ) : undoable.block === "changed-since" ? (
              <span>（この判定の後に別の直しが入ったため、取り消せません。心得帳から消すことはできます）</span>
            ) : undoable.block === "follow-up" ? (
              <span>（この判定の後に別の直しが入ったため、取り消せません）</span>
            ) : (
              <button className="ml-2 inline-flex min-h-11 items-center px-1 text-ai underline-offset-4 hover:underline">
                取り消す{undoable.writes ? "（心得帳に書いた分も戻し、沿革に残します）" : ""}
              </button>
            )}
          </form>
        )}
        {s.mode === "own" && !live ? (
          <p role="alert" className="mt-6 border-l-4 border-shu bg-shu-soft px-4 py-2 text-[14px]">
            案を作るには Claude API のキーが要ります。.env.local に ANTHROPIC_API_KEY を置き、KOKOROE_LIVE=1 をつけて起動してください。
          </p>
        ) : item && heldBack(meta, meta.pos) ? (
          <>
            <p role="status" className="mt-6 border-l-4 border-ai bg-ai-soft px-4 py-2 text-[14.5px]">
              比較テスト中です。次の場面（{words(item.scene.id)}）は、先に
              <Link className="text-ai underline" href="/choba/write">文章で書いて</Link>
              から判定します。弟子の案は、書き終わるまで作りません。
            </p>
            <NewScene />
          </>
        ) : item && s.mode === "own" && !item.live ? (
          <p role="alert" className="mt-6 border-l-4 border-shu bg-shu-soft px-4 py-2 text-[14px]">
            この場面の案を作れませんでした（その日の上限か、通信の失敗）。しばらくしてから、このページを開き直してください。
          </p>
        ) : item ? (
          <article className="mt-4">
            <header>
              <h1 id="card-h" className="font-mincho text-[25px] tracking-[0.04em]">
                {getClient(item.scene.clientId).name}
                <span className="mt-1 block text-[15px] text-nibi sm:mt-0 sm:ml-3 sm:inline">{SCENE_TYPE_LABELS[item.scene.type]}・{item.scene.month}月</span>
              </h1>
              {record && (
                <p className="mt-1 text-[13px] text-nibi">
                  {record.last === null ? "この取引先の判定は、まだありません。" : record.streak > 0 ? `この取引先では ○ が${record.streak}回続いています。` : "前回、この取引先の案は師匠が直しています。"}
                </p>
              )}
            </header>
            <div className="mt-4">
              <Ledger label="場面">
                <p className="yomi text-[16.5px]">{item.scene.situation}</p>
              </Ledger>
              {effect && shown && (
                <EffectView
                  effect={effect}
                  client={getClient(item.scene.clientId)}
                  draft={shown}
                  words={words}
                  recorded={effectRecorded}
                  ruleHref={rules.some((r) => r.id === effect.rule.id && r.text === effect.rule.text) ? `/kokoroe#${effect.rule.id}` : null}
                />
              )}
              <ProposalView p={shown!} client={getClient(item.scene.clientId)} ruleText={ruleText} />
              <Ledger label="判定">
                <JudgeForm key={item.scene.id} sceneId={item.scene.id} live={live} />
              </Ledger>
            </div>
          </article>
        ) : meta.paused ? (
          <div className="mt-6">
            <h1 className="font-mincho text-[22px]">ここで区切りました</h1>
            <p className="yomi mt-2">
              {done} 件まで見ました。
              {meta.pending.length ? "それまでに育った心得帳は、" : "この回の印は ○ だけなので、心得帳は変わっていません。いまの心得帳は、"}
              <Link className="text-ai underline" href="/kokoroe">心得帳</Link>と<Link className="text-ai underline" href="/noren">暖簾を継ぐ</Link>でそのまま使えます。稽古の数字は<Link className="text-ai underline" href="/keiko">稽古の記録</Link>に。
            </p>
            <form action={pause} className="mt-4">
              <input type="hidden" name="resume" value="1" />
              <button className="rounded-[3px] bg-sumi px-5 py-2.5 text-[15px] text-kami">{done + 1} 件目から続ける</button>
            </form>
          </div>
        ) : s.mode === "own" ? (
          <NewScene />
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
        <h2 id="bg-h" className="font-mincho text-[18px] tracking-[0.04em]">弟子の読み取り</h2>
        <p className="mt-1 text-[13px] text-nibi">△・× の意味を弟子が読み取り、心得帳に書きます{live ? "" : "（公開版のライブで）"}。待たずに次の案へ進めます。</p>
        {recent.length ? (
          <ul className="mt-3">{recent.map((p) => <PendingItem key={p.judgmentId} p={p} verdict={judgments.find((j) => j.id === p.judgmentId)?.verdict} ruleText={ruleText} words={words} sceneOf={(id) => meta.queue.find((q) => q.scene.id === id)?.scene ?? TRAIN_SCENES.find((t) => t.id === id)} beforeOf={(id) => judgments.find((j) => j.id === id)?.proposal} />)}</ul>
        ) : (
          <p className="mt-4 text-[14px] text-nibi">このセッションで付けた △・× は、まだありません。付けると、ここに弟子の読み取りが出ます。{effect && effectRecorded && "案の「変化」は、記録した稽古での直しから出たものです。"}</p>
        )}
      </aside>
    </div>
  );
}
