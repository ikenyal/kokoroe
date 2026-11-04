import { LimitNote } from "../limit-note";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CLIENTS, COMPANY, getClient, HISTORY_QUESTIONS } from "@/src/core/world";
import { getSession, liveEnabled, type SuccessorTurn } from "@/src/server/session";
import { ask } from "../actions";
import { citationParts, plainText } from "@/src/lib/plain";
import { ownEnabled } from "@/src/core/own-world";

const ANSWER: Record<SuccessorTurn["answer"], { word: string; tone: string }> = {
  yes: { word: "はい", tone: "text-ai" },
  no: { word: "いいえ", tone: "text-sumi" }, // vermilion is only for the master's marks
  unknown: { word: "心得帳に記録がありません", tone: "text-nibi" },
};

function Turn({ t, ruleText }: { t: SuccessorTurn; ruleText: (id: string) => string | undefined }) {
  const a = ANSWER[t.answer];
  return (
    <article className="border-t-2 border-sumi/80 pt-4">
      <p className="text-[13px] text-nibi">
        {COMPANY.successor.name}の質問　{getClient(t.clientId).name}
      </p>
      <p className="yomi mt-1 text-[17px]">{t.question}</p>
      <p className={`mt-4 font-mincho text-[22px] ${a.tone}`}>{a.word}</p>
      <p className="yomi mt-1 text-[16px]">{plainText(t.explanation)}</p>
      {t.answer === "unknown" && t.source === "live" && <p className="mt-2 text-[14px]">師匠（{COMPANY.master.name}）に確認してください。</p>}
      {t.citations.length > 0 && (
        <div className="mt-5 grid gap-x-5 border-t border-keisen pt-3 sm:grid-cols-[2.2rem_1fr]">
          <h3 className="font-mincho text-[14px] tracking-[0.2em] sm:tate">根拠の心得</h3>
          <ul className="mt-1 space-y-3 sm:mt-0">
            {t.citations.map((c, i) => {
              const h = citationParts(c.history);
              const live = t.source === "live" && ruleText(c.ruleId);
              return (
                <li key={i} className="text-[14.5px]">
                  {live ? (
                    <Link className="yomi text-[16.5px] text-ai underline-offset-4 hover:underline" href={`/kokoroe#${c.ruleId}`}>{h.rule}</Link>
                  ) : (
                    <p className="yomi text-[16.5px]">{h.rule}</p>
                  )}
                  {h.before && <p className="yomi text-[14px] text-nibi">前は <del className="decoration-sumi/40">{h.before}</del></p>}
                  {h.why && <p className="yomi text-[14px]"><span className="text-nibi">わけ：</span>{h.why}</p>}
                  <p className="text-[12.5px] text-nibi">
                    {h.source && <>出どころ：{h.source}　</>}
                    {h.written && <>心得帳に書いた日：{h.written}</>}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {t.source === "recorded" && (
        <p className="mt-3 text-[12.5px] text-nibi">記録済みの回答（評価のときの心得帳で答えたもの）を表示しています。</p>
      )}
    </article>
  );
}

export default async function NorenPage() {
  const s = await getSession();
  if (!s) redirect("/");
  const live = liveEnabled();
  const answers = s.meta.answers ?? [];
  const rules = await s.store.listRules();
  const ruleText = (id: string) => rules.find((r) => r.id === id)?.text;
  const examples = !ownEnabled() && (
    <section aria-labelledby="ex-h" className="mt-10">
      <h2 id="ex-h" className="font-mincho text-[18px]">{answers.length ? "ほかに聞けること" : "たとえば、後任がよく迷うこと"}</h2>
      <form action={ask} className="mt-3 border-y border-sumi/50">
        {HISTORY_QUESTIONS.map((q) => (
          <button
            key={q.id}
            name="preset"
            value={q.id}
            className="group grid w-full grid-cols-1 gap-x-4 border-t border-keisen px-1 py-2.5 text-left first:border-t-0 hover:bg-kami-2 sm:grid-cols-[9rem_1fr_auto]"
          >
            <span className="text-[13px] text-nibi sm:pt-0.5">{getClient(q.clientId).name}</span>
            <span className="yomi text-[15.5px]">{q.question}</span>
            <span aria-hidden className="hidden text-[13px] text-ai group-hover:inline sm:pt-0.5">尋ねる</span>
          </button>
        ))}
      </form>
    </section>
  );
  return (
    <div className="max-w-3xl">
      <div className="-mb-6 empty:hidden"><LimitNote reason={s.meta.limit} /></div>
      <section aria-labelledby="noren-h">
        <h1 id="noren-h" className="font-mincho text-[24px] tracking-[0.06em]">暖簾を継ぐ</h1>
        <p className="yomi mt-2 max-w-[36em] text-[15.5px]">
          後任の{COMPANY.successor.name}が取引先のことを尋ねると、橙丸が心得帳だけを根拠に答えます。答えには、根拠の心得と、なぜそうなったか（沿革）を必ず添えます。心得帳にないことには答えず、師匠への確認を勧めます。
        </p>
        <form action={ask} className="mt-6 grid gap-3 sm:grid-cols-[11rem_1fr_auto] sm:items-end">
          <label>
            <span className="text-[13px] text-nibi">取引先</span>
            <select name="clientId" key={answers[0]?.clientId ?? "none"} defaultValue={answers[0]?.clientId} className="mt-1 block h-12 w-full rounded-[3px] border border-waku bg-kami px-2 text-[15px]">
              {CLIENTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-[13px] text-nibi">質問</span>
            <input
              name="question"
              maxLength={200}
              required
              autoComplete="off"
              placeholder="例：この手順、省いてもいいですか？"
              className="mt-1 block h-12 w-full rounded-[3px] border border-waku bg-kami px-3 font-mincho text-[16px] placeholder:text-nibi"
            />
          </label>
          <button className="h-12 rounded-[3px] bg-ai px-5 text-[15px] text-kami">尋ねる</button>
        </form>
        {!live && <p className="mt-2 text-[13px] text-nibi">このデモでは、下の質問に記録済みの答えで返します。自由な質問には、公開版のライブで答えます。</p>}
        {answers.length > 0 && <div className="mt-10 space-y-10">{answers.map((t, i) => <Turn key={i} t={t} ruleText={ruleText} />)}</div>}
        {examples}
        {ownEnabled() && !answers.length && <p className="mt-8 text-[14px] text-nibi">取引先を選んで、質問を入れてください。</p>}
      </section>
    </div>
  );
}
