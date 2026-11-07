import Link from "next/link";
import { redirect } from "next/navigation";
import { CLIENTS, TRAIN_SCENES } from "@/src/core/world";
import { isLedgerFact } from "@/src/learning/export";
import { SCENE_TYPE_LABELS } from "@/src/core/types";
import type { JudgmentRecord, KokoroeRule, RuleSource } from "@/src/learning/types";
import { draftsThatUsed } from "../dandori";
import { getSession, liveEnabled } from "@/src/server/session";
import { retireRule } from "../actions";
import { Mark } from "../marks";

const VERDICT_LABEL = { "○": "○", "△": "△", "×": "×" } as const;

function sceneWords(sceneId: string) {
  const t = TRAIN_SCENES.find((x) => x.id === sceneId);
  return t ? `${SCENE_TYPE_LABELS[t.type]}・${t.month}月の場面` : "";
}

function SourceLine({ s }: { s: RuleSource }) {
  if (s.kind === "ledger") return <li>{s.date}　取引先台帳から写したもの</li>; // the date is when it was copied in (D-054 second addendum: no 「明示的な制約」)
  return (
    <li>
      {s.date}　師匠の判定 <span className="font-mincho text-shu">{s.verdict && VERDICT_LABEL[s.verdict]}</span>
      {s.remark ? <span className="yomi">「{s.remark}」</span> : <span className="text-nibi">（一言なし）</span>}
      <span className="text-nibi">　{sceneWords(s.sceneId)}</span>
    </li>
  );
}

/** A rule as a ledger entry: the 心得, then its 沿革 in plain sight (when, the master's mark and words, why, the scene). */
function Rule({ r, fact = false, used = [] }: { r: KokoroeRule; fact?: boolean; used?: ReturnType<typeof draftsThatUsed> }) {
  const fromLedger = r.sources.some((s) => s.kind === "ledger");
  const fromMaster = r.sources.some((s) => s.kind !== "ledger");
  const judgmentOf = (id: string) => r.sources.find((s) => s.kind !== "ledger" && "judgmentId" in s && s.judgmentId === id) as Extract<RuleSource, { verdict?: unknown }> | undefined;
  const trigger = r.history.map((h) => h.trigger).filter(Boolean).at(-1);
  return (
    <li id={r.id} className={`scroll-mt-6 border-t border-keisen py-4 first:border-t-0 ${r.status !== "active" ? "text-sumi/70" : ""}`}>
      {r.status !== "active" && (
        // ui-critic 11/6: a removed item looked like a live 心得 (same heading, vermilion marks).
        <p className="mb-1 inline-block rounded-[3px] border border-keisen px-2 text-[12.5px] text-nibi">
          {r.mergedInto ? `${r.mergedInto} にまとめた` : r.history.at(-1)?.after.startsWith("（取り消し") ? "取り消した" : "消した"}
        </p>
      )}
      {(r.scope.sceneTypes || (fromLedger && fromMaster)) && (
        <p className="text-[12.5px] text-nibi">
          {r.scope.sceneTypes && `${r.scope.sceneTypes.map((t) => SCENE_TYPE_LABELS[t]).join("・")}のとき`}
          {r.scope.sceneTypes && fromLedger && fromMaster && "　"}
          {fromLedger && fromMaster && "台帳の事実を、師匠の判定で直したもの"}
        </p>
      )}
      <p className={`yomi [text-wrap:pretty] ${fact ? "text-[16px]" : "text-[18px]"} ${r.status !== "active" ? "text-nibi line-through decoration-nibi/50" : ""}`}>{r.text}</p>
      {r.when && <p className="yomi text-[15px] text-nibi">条件：{r.when}</p>}
      {fact ? (
        trigger && (
          <p className="yomi mt-1 text-[14.5px]">
            <span className="text-nibi">わけ：</span>
            {trigger}
          </p>
        )
      ) : (
        <ol aria-label="沿革" className="mt-2.5 space-y-2 text-[14px]">
          {r.history.map((h, i) => {
            const j = h.judgmentId ? judgmentOf(h.judgmentId) : undefined;
            const words = h.masterWords || (j && "remark" in j ? j.remark : "");
            return (
              <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
                <span className={`pt-0.5 ${r.status === "active" ? "text-shu" : "text-nibi"}`}>
                  {j && "verdict" in j && j.verdict && (
                    <>
                      <Mark v={j.verdict} size={20} />
                      <span className="sr-only">師匠の判定 {j.verdict}</span>
                    </>
                  )}
                </span>
                <div>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="tabular-nums text-sumi/75">{h.date}</span>
                  {words ? <span className="yomi">「{words}」</span> : j ? <span className="text-sumi/75">（一言なし）</span> : null}
                  {j && "sceneId" in j && <span className="text-sumi/75">{sceneWords(j.sceneId)}</span>}
                  {!j && h.judgmentId === "MASTER" && <span className="text-sumi/75">{h.after.startsWith("（師匠が削除") ? "師匠が心得帳で消した" : "師匠が心得帳で直した"}</span>}
                </p>
                {h.before && h.before !== r.text && h.before !== (r.when ? `${r.text}（${r.when}）` : r.text) && (
                  <p className="yomi text-[14px] text-nibi">
                    前は：{h.before}
                  </p>
                )}
                {h.trigger && (
                  <p className="yomi">
                    <span className="text-nibi">わけ：</span>
                    {h.trigger}
                  </p>
                )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {!fact && used.length > 0 && (
        <div className="mt-2.5 border-l-2 border-ai pl-3 text-[13.5px]">
          <p className="text-nibi">この心得が効いた案</p>
          <ul className="mt-0.5">
            {used.slice(0, 4).map(({ judgment: j, cited }) => (
              <li key={j.id}>
                {sceneWords(j.sceneId) || "場面"}
                <span className="text-nibi">　師匠 </span>
                <span className="font-mincho text-shu">{j.verdict}</span>
                {cited && <span className="text-nibi">　（弟子が根拠に挙げた）</span>}
              </li>
            ))}
            {used.length > 4 && <li className="text-nibi">ほか {used.length - 4} 件</li>}
          </ul>
        </div>
      )}
      {r.status === "active" && (
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-x-6 text-[13px]">
          <details>
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-ai select-none">出どころ</summary>
            {/* ui-critic 11/6 evening: a ledger fact must not be described as the master's marks; same word as 暖簾を継ぐ (出どころ). */}
            <p className="text-[12.5px] text-nibi">
              {fact
                ? "この事実を写した、取引先台帳（いつ写したか）。"
                : r.sources.some((x) => x.kind === "ledger")
                  ? "この心得のもとになった、取引先台帳と、師匠の直し（印と、一言があればそれも）。どの場面の、いつのものか。"
                  : "この心得のもとになった、師匠の直し（印と、一言があればそれも）。どの場面の、いつのものか。"}
            </p>
            <ul className="mb-2 space-y-1">{r.sources.map((s, i) => <SourceLine key={i} s={s} />)}</ul>
          </details>
          <details className="text-right">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sumi/80 select-none">この{fact ? "事実" : "心得"}を消す</summary>
            <form action={retireRule} className="mb-2 flex items-center justify-end gap-3">
              <input type="hidden" name="ruleId" value={r.id} />
              <span className="text-nibi">消した記録は、いちばん下の「消した・まとめた・取り消した項目」に、沿革と一緒に残ります。</span>
              <button className="rounded-[3px] border border-sumi/60 min-h-11 px-4 text-sumi hover:bg-kami-2">消す</button>
            </form>
          </details>
        </div>
      )}
    </li>
  );
}

type Group = { key: string; title: string; note: string; rules: KokoroeRule[] };

function groupsOf(rules: KokoroeRule[], prefix: string): Group[] {
  return [
    { key: `${prefix}-all`, title: "全社", note: "どの取引先にも通じる", rules: rules.filter((r) => r.scope.clientId === null) },
    ...CLIENTS.map((c) => ({ key: `${prefix}-${c.id}`, title: c.name, note: `${c.industry}　窓口 ${c.contact}・決裁 ${c.decider}`, rules: rules.filter((r) => r.scope.clientId === c.id) })),
  ].filter((g) => g.rules.length);
}

function Groups({ groups, fact = false, judgments = [] }: { groups: Group[]; fact?: boolean; judgments?: JudgmentRecord[] }) {
  return (
    <div className="space-y-7">
      {groups.map((g) => (
        <section key={g.key} id={g.key} aria-labelledby={`${g.key}-h`} className="scroll-mt-6">
          <header className="border-b border-sumi/50 pb-1.5">
            <h3 id={`${g.key}-h`} className="font-mincho text-[21px] tracking-[0.04em]">{g.title}</h3>
            <p className="text-[12.5px] text-nibi">{g.note}</p>
          </header>
          <ul>{g.rules.map((r) => <Rule key={r.id} r={r} fact={fact} used={fact ? [] : draftsThatUsed(r, judgments)} />)}</ul>
        </section>
      ))}
    </div>
  );
}

/**
 * Per visitor (it reads the session), so never prerendered; after 「消す」 it reads ?gone= to say what was removed. Next 16's
 * instant-navigation check flags URL data outside <Suspense> in dev; opt this page out of the check, as documented (11/6).
 */
export const instant = false;

export default async function KokoroePage({ searchParams }: { searchParams: Promise<{ gone?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/");
  const rules = await s.store.listRules();
  const goneId = (await searchParams).gone;
  const gone = goneId && /^K-\d{3}$/.test(goneId) ? rules.find((r) => r.id === goneId && r.status !== "active") : undefined;
  const judgments = await s.store.listJudgments();
  const active = rules.filter((r) => r.status === "active");
  // D-052: 心得 = one piece of the master's practice; facts copied from the client ledger are listed apart.
  const kokoroe = groupsOf(active.filter((r) => !isLedgerFact(r)), "k");
  const facts = groupsOf(active.filter(isLedgerFact), "f");
  const nK = active.filter((r) => !isLedgerFact(r)).length;
  const live = liveEnabled();
  const nF = active.length - nK;
  const inactive = rules.filter((r) => r.status !== "active");

  return (
    <div className="grid gap-10 md:grid-cols-[13rem_1fr]">
      <nav aria-label="心得帳の目次" className="[word-break:auto-phrase] md:sticky md:top-6 md:self-start">
        <h1 className="font-mincho text-[24px] tracking-[0.06em]">心得帳</h1>
        <p className="mt-1 text-[13px] text-nibi">
          師匠から覚えた心得 {nK}・台帳から写した事実 {nF}
        </p>
        <a
          href="/kokoroe/export"
          download
          className={`mt-4 block rounded-[3px] px-3 py-2.5 text-center text-[14px] ${nK ? "bg-ai-fill text-on-fill hover:opacity-95" : "border border-ai text-ai hover:bg-ai-soft"}`}
        >
          心得帳を後任に渡す
        </a>
        <p className="mt-1.5 text-[12.5px] text-nibi">後任の Claude Code で使える形（Agent Skills）で書⁠き⁠出⁠し⁠ま⁠す。{nK ? "" : "いまは台帳の事実だけです。心得が付いてから渡すのがおすすめです。"}</p>
        {kokoroe.length > 0 && <p className="mt-5 hidden text-[12.5px] text-nibi md:block">心得</p>}
        <ol className="mt-1 hidden space-y-1 text-[14px] md:block">
          {kokoroe.map((g) => (
            <li key={g.key}>
              <a href={`#${g.key}`} className="flex justify-between gap-2 hover:text-ai">
                <span>{g.title}</span>
                <span className="tabular-nums text-nibi">{g.rules.length}</span>
              </a>
            </li>
          ))}
        </ol>
        {facts.length > 0 && (
          <p className="mt-3 text-[14px]">
            <a href="#facts" className="hover:text-ai"><span className="inline-block">台帳から写した事実</span> <span className="tabular-nums text-nibi">{nF}</span></a>
            <span className="block text-[12.5px] text-nibi">いちばん下に畳んであります</span>
          </p>
        )}
      </nav>
      <div className="space-y-14">
        {gone && (
          <p role="status" className="border-l-4 border-ai bg-ai-soft px-4 py-2 text-[14px]">
            「{gone.text}」を消しました。記録は、<a href="#gone" className="text-ai underline underline-offset-4">いちばん下の「消した・まとめた・取り消した項目」</a>に、沿革と一緒に残っています。
          </p>
        )}
        <section aria-labelledby="k-h">
          <h2 id="k-h" className="font-mincho text-[22px] tracking-[0.06em]">師匠から覚えた心得</h2>
          <p className="mt-1 mb-6 text-[13px] text-nibi">心得は、師匠の作法の一つ一つ。いつ・どの印（と一言）から・なぜ、を添えて綴ったものが心得帳です。</p>
          {kokoroe.length ? <Groups groups={kokoroe} judgments={judgments} /> : <p className="yomi text-nibi">
              まだありません。<Link className="text-ai underline underline-offset-4" href="/choba">帳場</Link>で △ か × を付けると、直したところが、わけと一緒にここに残ります。
              {!live && <span className="mt-1 block font-sans text-[12.5px]">このデモでは心得帳は書き足されません（書き足しはライブ版で）。</span>}
            </p>}
        </section>
        {facts.length > 0 && (
          <details id="facts" className="scroll-mt-6 border-t-2 border-rule pt-4">
            <summary className="cursor-pointer select-none">
              <h2 className="inline font-mincho text-[20px] tracking-[0.06em]">台帳から写した事実（{nF}）</h2>
              <span className="mt-1 block text-[13px] text-nibi">取引先台帳に書かれていたこと。師匠の作法ではなく、作法の前提になる事実です。師匠が直すと、心得に移ります。</span>
            </summary>
            <div className="mt-6">
              <Groups groups={facts} fact />
            </div>
          </details>
        )}
        {inactive.length > 0 && (
          <details id="gone" className="scroll-mt-6" open={!!gone}>
            <summary className="cursor-pointer select-none border-t-2 border-rule pt-4">
              <h2 className="inline font-mincho text-[20px] tracking-[0.06em]">消した・まとめた・取り消した項目（{inactive.length}）</h2>
              <span className="mt-1 block text-[13px] text-nibi">心得帳から外したものも、沿革と一緒にここに残ります。</span>
            </summary>
            <ul className="mt-2">{inactive.map((r) => <Rule key={r.id} r={r} />)}</ul>
          </details>
        )}
      </div>
    </div>
  );
}
