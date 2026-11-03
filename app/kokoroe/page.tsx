import { redirect } from "next/navigation";
import { CLIENTS } from "@/src/core/world";
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

function SourceLine({ s }: { s: RuleSource }) {
  if (s.kind === "ledger") return <li>{s.date}　取引先台帳の明示的な制約</li>;
  return (
    <li>
      {s.date}　師匠の判定 <span className="font-mincho text-shu">{s.verdict && VERDICT_LABEL[s.verdict]}</span>
      {s.remark ? <span className="yomi">「{s.remark}」</span> : <span className="text-nibi">（一言なし）</span>}
      <span className="text-nibi">　{s.sceneId}・{s.judgmentId}</span>
    </li>
  );
}

function Rule({ r }: { r: KokoroeRule }) {
  const trigger = r.history.map((h) => h.trigger).filter(Boolean).at(-1);
  return (
    <li className="border-t border-keisen py-5 first:border-t-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[12px] tabular-nums text-nibi">{r.id}</span>
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

export default async function KokoroePage() {
  const s = await getSession();
  if (!s) redirect("/");
  const rules = await s.store.listRules();
  const active = rules.filter((r) => r.status === "active");
  const groups = [
    { key: "all", title: "全社の心得", note: "どの取引先にも通じる作法", rules: active.filter((r) => r.scope.clientId === null) },
    ...CLIENTS.map((c) => ({
      key: c.id,
      title: c.name,
      note: `${c.industry}　窓口 ${c.contact}・決裁 ${c.decider}`,
      rules: active.filter((r) => r.scope.clientId === c.id),
    })),
  ].filter((g) => g.rules.length);
  const inactive = rules.filter((r) => r.status !== "active");

  return (
    <div className="grid gap-10 md:grid-cols-[13rem_1fr]">
      <nav aria-label="取引先" className="md:sticky md:top-6 md:self-start">
        <h1 className="font-mincho text-[24px] tracking-[0.06em]">心得帳</h1>
        <p className="mt-1 text-[13px] text-nibi">
          {active.length} 項目。師匠の判定から覚えたものと、台帳から写したものがあります。
        </p>
        <a
          href="/kokoroe/export"
          download
          className="mt-4 block rounded-[3px] bg-ai px-3 py-2.5 text-center text-[14px] text-kami hover:opacity-95"
        >
          心得帳を後任に渡す
        </a>
        <p className="mt-1.5 text-[12px] text-nibi">Agent Skills の形（SKILL.md と取引先ごとのファイル）で書き出します。後任の Claude Code の .claude/skills/ に置くと使えます。</p>
        <ol className="mt-5 space-y-1 text-[14px]">
          {groups.map((g) => (
            <li key={g.key}>
              <a href={`#${g.key}`} className="flex justify-between gap-2 hover:text-ai">
                <span>{g.title}</span>
                <span className="tabular-nums text-nibi">{g.rules.length}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.key} id={g.key} aria-labelledby={`${g.key}-h`} className="scroll-mt-6">
            <header className="border-b-2 border-sumi/80 pb-1.5">
              <h2 id={`${g.key}-h`} className="font-mincho text-[21px] tracking-[0.04em]">{g.title}</h2>
              <p className="text-[12.5px] text-nibi">{g.note}</p>
            </header>
            <ul>{g.rules.map((r) => <Rule key={r.id} r={r} />)}</ul>
          </section>
        ))}
        {inactive.length > 0 && (
          <details className="text-[14px]">
            <summary className="cursor-pointer text-nibi">消した・まとめた心得（{inactive.length}）</summary>
            <ul className="mt-2">{inactive.map((r) => <Rule key={r.id} r={r} />)}</ul>
          </details>
        )}
      </div>
    </div>
  );
}
