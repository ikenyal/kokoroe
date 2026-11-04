import { redirect } from "next/navigation";
import { CLIENTS, TRAIN_SCENES } from "@/src/core/world";
import { isLedgerFact } from "@/src/learning/export";
import { SCENE_TYPE_LABELS } from "@/src/core/types";
import type { KokoroeRule, RuleSource } from "@/src/learning/types";
import { getSession } from "@/src/server/session";
import { retireRule } from "../actions";

const VERDICT_LABEL = { "○": "○", "△": "△", "×": "×" } as const;

function sceneWords(sceneId: string) {
  const t = TRAIN_SCENES.find((x) => x.id === sceneId);
  return t ? `${SCENE_TYPE_LABELS[t.type]}・${t.month}月の場面` : "";
}

function SourceLine({ s }: { s: RuleSource }) {
  if (s.kind === "ledger") return <li>{s.date}　取引先台帳の明示的な制約</li>;
  return (
    <li>
      {s.date}　師匠の判定 <span className="font-mincho text-shu">{s.verdict && VERDICT_LABEL[s.verdict]}</span>
      {s.remark ? <span className="yomi">「{s.remark}」</span> : <span className="text-nibi">（一言なし）</span>}
      <span className="text-nibi">　{sceneWords(s.sceneId)}</span>
    </li>
  );
}

/** A rule as a ledger entry: the 心得, then its 沿革 in plain sight (when, the master's mark and words, why, the scene). */
function Rule({ r, fact = false }: { r: KokoroeRule; fact?: boolean }) {
  const fromLedger = r.sources.some((s) => s.kind === "ledger");
  const fromMaster = r.sources.some((s) => s.kind !== "ledger");
  const judgmentOf = (id: string) => r.sources.find((s) => s.kind !== "ledger" && "judgmentId" in s && s.judgmentId === id) as Extract<RuleSource, { verdict?: unknown }> | undefined;
  const trigger = r.history.map((h) => h.trigger).filter(Boolean).at(-1);
  return (
    <li id={r.id} className="scroll-mt-6 border-t border-keisen py-5 first:border-t-0">
      {(r.scope.sceneTypes || (fromLedger && fromMaster)) && (
        <p className="text-[12.5px] text-nibi">
          {r.scope.sceneTypes && `${r.scope.sceneTypes.map((t) => SCENE_TYPE_LABELS[t]).join("・")}のとき`}
          {r.scope.sceneTypes && fromLedger && fromMaster && "　"}
          {fromLedger && fromMaster && "台帳の事実を、師匠の判定で直したもの"}
        </p>
      )}
      <p className={`yomi ${fact ? "text-[16px]" : "text-[18px]"}`}>{r.text}</p>
      {r.when && <p className="yomi text-[15px] text-nibi">条件：{r.when}</p>}
      {fact ? (
        trigger && (
          <p className="yomi mt-1 text-[14.5px]">
            <span className="text-nibi">わけ：</span>
            {trigger}
          </p>
        )
      ) : (
        <ol aria-label="沿革" className="mt-3 space-y-2.5 border-l-2 border-keisen pl-4 text-[14px]">
          {r.history.map((h, i) => {
            const j = h.judgmentId ? judgmentOf(h.judgmentId) : undefined;
            const words = h.masterWords || (j && "remark" in j ? j.remark : "");
            return (
              <li key={i}>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="tabular-nums text-nibi">{h.date}</span>
                  {j && "verdict" in j && j.verdict && <span className="font-mincho text-[16px] leading-none text-shu" aria-label={`師匠の判定 ${j.verdict}`}>{j.verdict}</span>}
                  {words ? <span className="yomi">「{words}」</span> : j ? <span className="text-nibi">（一言なし）</span> : null}
                  {j && "sceneId" in j && <span className="text-nibi">{sceneWords(j.sceneId)}</span>}
                  {!j && h.judgmentId === "MASTER" && <span className="text-nibi">師匠が心得帳で直接</span>}
                </p>
                {h.before && (
                  <p className="yomi text-[14px] text-nibi">
                    前は <del className="decoration-sumi/40">{h.before}</del>
                  </p>
                )}
                {h.trigger && (
                  <p className="yomi">
                    <span className="text-nibi">わけ：</span>
                    {h.trigger}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {r.status === "active" && (
        <details className="mt-2 text-[13px]">
          <summary className="inline-flex min-h-9 cursor-pointer items-center text-nibi select-none">出典の一覧・この{fact ? "事実" : "心得"}を消す</summary>
          <ul className="mt-1 space-y-1">{r.sources.map((s, i) => <SourceLine key={i} s={s} />)}</ul>
          <form action={retireRule} className="mt-2 flex items-center gap-3">
            <input type="hidden" name="ruleId" value={r.id} />
            <span className="text-nibi">消した記録は沿革に残ります。</span>
            <button className="rounded-[3px] border border-sumi/60 px-3 py-1 text-sumi hover:bg-kami-2">消す</button>
          </form>
        </details>
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

function Groups({ groups, fact = false }: { groups: Group[]; fact?: boolean }) {
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.key} id={g.key} aria-labelledby={`${g.key}-h`} className="scroll-mt-6">
          <header className="border-b border-sumi/50 pb-1.5">
            <h3 id={`${g.key}-h`} className="font-mincho text-[21px] tracking-[0.04em]">{g.title}</h3>
            <p className="text-[12.5px] text-nibi">{g.note}</p>
          </header>
          <ul>{g.rules.map((r) => <Rule key={r.id} r={r} fact={fact} />)}</ul>
        </section>
      ))}
    </div>
  );
}

export default async function KokoroePage() {
  const s = await getSession();
  if (!s) redirect("/");
  const rules = await s.store.listRules();
  const active = rules.filter((r) => r.status === "active");
  // D-052: 心得 = one piece of the master's practice; facts copied from the client ledger are listed apart.
  const kokoroe = groupsOf(active.filter((r) => !isLedgerFact(r)), "k");
  const facts = groupsOf(active.filter(isLedgerFact), "f");
  const nK = active.filter((r) => !isLedgerFact(r)).length;
  const nF = active.length - nK;
  const inactive = rules.filter((r) => r.status !== "active");

  return (
    <div className="grid gap-10 md:grid-cols-[13rem_1fr]">
      <nav aria-label="心得帳の目次" className="md:sticky md:top-6 md:self-start">
        <h1 className="font-mincho text-[24px] tracking-[0.06em]">心得帳</h1>
        <p className="mt-1 text-[13px] text-nibi">
          師匠から覚えた心得 {nK}・台帳から写した事実 {nF}
        </p>
        <a
          href="/kokoroe/export"
          download
          className="mt-4 block rounded-[3px] bg-ai px-3 py-2.5 text-center text-[14px] text-kami hover:opacity-95"
        >
          心得帳を後任に渡す
        </a>
        <p className="mt-1.5 text-[12px] text-nibi">Agent Skills の形（SKILL.md と取引先ごとのファイル）で書き出します。後任の Claude Code の .claude/skills/ に置くと使えます。</p>
        <p className="mt-5 text-[12px] text-nibi">心得</p>
        <ol className="mt-1 space-y-1 text-[14px]">
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
            <a href="#facts" className="hover:text-ai">台帳から写した事実 <span className="tabular-nums text-nibi">{nF}</span></a>
            <span className="block text-[12px] text-nibi">いちばん下に畳んであります</span>
          </p>
        )}
      </nav>
      <div className="space-y-14">
        <section aria-labelledby="k-h">
          <h2 id="k-h" className="font-mincho text-[22px] tracking-[0.06em]">師匠から覚えた心得</h2>
          <p className="mt-1 mb-6 text-[13px] text-nibi">心得は、師匠の作法の一つ一つ。いつ・どの印と一言から・なぜ、を添えて綴ったものが心得帳です。</p>
          {kokoroe.length ? <Groups groups={kokoroe} /> : <p className="yomi text-nibi">まだありません。帳場で ○・△・× を付けると、直したところがここに残ります。</p>}
        </section>
        {facts.length > 0 && (
          <details id="facts" className="scroll-mt-6 border-t-2 border-sumi/80 pt-4">
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
          <details className="text-[14px]">
            <summary className="cursor-pointer text-nibi">消した・まとめた・取り消した項目（{inactive.length}）</summary>
            <ul className="mt-2">{inactive.map((r) => <Rule key={r.id} r={r} />)}</ul>
          </details>
        )}
      </div>
    </div>
  );
}
