import { redirect } from "next/navigation";
import { CLIENTS, TRAIN_SCENES } from "@/src/core/world";
import { isLedgerFact } from "@/src/learning/export";
import { SCENE_TYPE_LABELS } from "@/src/core/types";
import type { KokoroeRule, RuleSource } from "@/src/learning/types";
import { getSession } from "@/src/server/session";
import { retireRule } from "../actions";

const VERDICT_LABEL = { "○": "○", "△": "△", "×": "×" } as const;

function Origin({ r }: { r: KokoroeRule }) {
  const ledger = r.sources.some((s) => s.kind === "ledger");
  const master = r.sources.some((s) => s.kind !== "ledger");
  const label = ledger && master ? "台帳＋師匠" : ledger ? "台帳" : r.scope.clientId === null ? "全社・師匠" : "師匠";
  return (
    <span className={`rounded-[2px] px-1.5 py-px text-[12px] ${ledger && !master ? "border border-keisen text-nibi" : "bg-ai-soft text-ai"}`}>
      {label}
    </span>
  );
}

/** Which situation a judgment was about, in words (no internal ids on screen). */
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

function Rule({ r }: { r: KokoroeRule }) {
  const trigger = r.history.map((h) => h.trigger).filter(Boolean).at(-1);
  return (
    <li id={r.id} className="scroll-mt-6 border-t border-keisen py-5 first:border-t-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Origin r={r} />
        {r.scope.sceneTypes && (
          <span className="text-[12px] text-nibi">{r.scope.sceneTypes.map((t) => SCENE_TYPE_LABELS[t]).join("・")}のとき</span>
        )}
      </div>
      <p className="yomi mt-1.5 text-[17px]">{r.text}</p>
      {r.when && <p className="yomi text-[15px] text-nibi">条件：{r.when}</p>}
      {trigger && (
        <p className="yomi mt-1 text-[15px]">
          <span className="text-nibi">わけ：</span>
          {trigger}
        </p>
      )}
      <details className="group mt-2 text-[13.5px]">
        <summary className="cursor-pointer text-ai select-none">出典と沿革（{r.history.length}）</summary>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="text-[12px] text-nibi">出典</h4>
            <ul className="mt-1 space-y-1">{r.sources.map((s, i) => <SourceLine key={i} s={s} />)}</ul>
          </div>
          <div>
            <h4 className="text-[12px] text-nibi">沿革</h4>
            <ol className="mt-1 border-l border-keisen">
              {r.history.map((h, i) => (
                <li key={i} className="relative pb-3 pl-4">
                  <span aria-hidden className="absolute top-[0.55em] -left-[4px] h-[7px] w-[7px] rounded-full bg-ai" />
                  <span className="tabular-nums text-nibi">{h.date}</span>
                  <p className="yomi">
                    {h.before ? (
                      <>
                        <del className="text-nibi decoration-shu/70">{h.before}</del>
                        <br />→ {h.after}
                      </>
                    ) : (
                      h.after
                    )}
                  </p>
                  {h.trigger && <p className="yomi text-nibi">きっかけ：{h.trigger}</p>}
                  {h.masterWords && <p className="yomi text-nibi">師匠：「{h.masterWords}」</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
        {r.status === "active" && (
          <details className="mt-3">
            <summary className="cursor-pointer text-nibi select-none">この心得を消す</summary>
            <form action={retireRule} className="mt-2 flex items-center gap-3">
              <input type="hidden" name="ruleId" value={r.id} />
              <span className="text-nibi">消した記録は沿革に残ります。</span>
              <button className="rounded-[3px] border border-shu px-3 py-1 text-shu hover:bg-shu-soft">消す</button>
            </form>
          </details>
        )}
      </details>
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

function Groups({ groups }: { groups: Group[] }) {
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.key} id={g.key} aria-labelledby={`${g.key}-h`} className="scroll-mt-6">
          <header className="border-b-2 border-sumi/80 pb-1.5">
            <h3 id={`${g.key}-h`} className="font-mincho text-[21px] tracking-[0.04em]">{g.title}</h3>
            <p className="text-[12.5px] text-nibi">{g.note}</p>
          </header>
          <ul>{g.rules.map((r) => <Rule key={r.id} r={r} />)}</ul>
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
          </p>
        )}
      </nav>
      <div className="space-y-14">
        <section aria-labelledby="k-h">
          <h2 id="k-h" className="font-mincho text-[22px] tracking-[0.06em]">師匠から覚えた心得</h2>
          <p className="mt-1 mb-6 text-[13px] text-nibi">心得は、師匠の作法の一つ一つ。それを、なぜそうなったか（沿革）と一緒に綴ったものが心得帳です。</p>
          {kokoroe.length ? <Groups groups={kokoroe} /> : <p className="yomi text-nibi">まだありません。帳場で ○・△・× を付けると、直したところがここに残ります。</p>}
        </section>
        {facts.length > 0 && (
          <section id="facts" aria-labelledby="f-h" className="scroll-mt-6">
            <h2 id="f-h" className="font-mincho text-[22px] tracking-[0.06em]">台帳から写した事実</h2>
            <p className="mt-1 mb-6 text-[13px] text-nibi">取引先台帳に書かれていたこと。師匠の作法ではなく、作法の前提になる事実です。師匠が直すと、心得に移ります。</p>
            <Groups groups={facts} />
          </section>
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
