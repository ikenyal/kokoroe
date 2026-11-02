import Link from "next/link";
import { redirect } from "next/navigation";
import { CLIENTS, COMPANY, getClient, HISTORY_QUESTIONS } from "@/src/core/world";
import { getSession, liveEnabled, type SuccessorTurn } from "@/src/server/session";
import { ask } from "../actions";

const ANSWER: Record<SuccessorTurn["answer"], { word: string; tone: string }> = {
  yes: { word: "はい", tone: "text-ai" },
  no: { word: "いいえ", tone: "text-shu" },
  unknown: { word: "心得帳に記録がありません", tone: "text-nibi" },
};

function Turn({ t }: { t: SuccessorTurn }) {
  const a = ANSWER[t.answer];
  return (
    <article className="border-t-2 border-sumi/80 pt-4">
      <p className="text-[13px] text-nibi">
        {COMPANY.successor.name}の質問　{getClient(t.clientId).name}
      </p>
      <p className="yomi mt-1 text-[17px]">{t.question}</p>
      <p className={`mt-4 font-mincho text-[22px] ${a.tone}`}>{a.word}</p>
      <p className="yomi mt-1 text-[16px]">{t.explanation}</p>
      {t.answer === "unknown" && t.source === "live" && <p className="mt-2 text-[14px]">師匠（{COMPANY.master.name}）に確認してください。</p>}
      {t.citations.length > 0 && (
        <div className="mt-4 border-l-2 border-ai pl-4">
          <h3 className="text-[12.5px] text-nibi">根拠にした心得と沿革</h3>
          <ul className="mt-1 space-y-2">
            {t.citations.map((c, i) => (
              <li key={i} className="text-[14px]">
                {t.source === "live" ? (
                  <Link className="text-ai underline-offset-4 hover:underline" href={`/kokoroe#${c.ruleId}`}>
                    {c.ruleId}
                  </Link>
                ) : (
                  <span className="text-nibi">{c.ruleId}</span>
                )}
                <p className="yomi text-[14.5px]">{c.history}</p>
              </li>
            ))}
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
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="noren-h">
        <h1 id="noren-h" className="font-mincho text-[24px] tracking-[0.06em]">暖簾を継ぐ</h1>
        <p className="yomi mt-2 max-w-[36em] text-[15.5px]">
          後任の{COMPANY.successor.name}が取引先のことを尋ねると、橙丸が心得帳だけを根拠に答えます。根拠の心得と、なぜそうなったか（沿革）を必ず添えます。心得帳にないことには答えず、師匠への確認を勧めます。
        </p>
        <form action={ask} className="mt-6 grid gap-3 sm:grid-cols-[11rem_1fr_auto] sm:items-end">
          <label>
            <span className="text-[13px] text-nibi">取引先</span>
            <select name="clientId" className="mt-1 block h-12 w-full rounded-[3px] border border-keisen bg-kami px-2 text-[15px]">
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
              className="mt-1 block h-12 w-full rounded-[3px] border border-keisen bg-kami px-3 font-mincho text-[16px] placeholder:text-nibi/60"
            />
          </label>
          <button className="h-12 rounded-[3px] bg-ai px-5 text-[15px] text-kami">尋ねる</button>
        </form>
        {!live && <p className="mt-2 text-[13px] text-nibi">いまは記録済みデータで動いています。自由な質問にはライブ版で答えます。</p>}
        <div className="mt-10 space-y-10">
          {answers.length ? answers.map((t, i) => <Turn key={i} t={t} />) : <p className="text-[14px] text-nibi">右の質問例から選ぶか、質問を入れてください。</p>}
        </div>
      </section>
      <aside aria-labelledby="ex-h" className="lg:border-l-2 lg:border-keisen lg:pl-6">
        <h2 id="ex-h" className="text-[15px] font-bold">後任がよく迷うこと</h2>
        <form action={ask} className="mt-3 space-y-2">
          {HISTORY_QUESTIONS.map((q) => (
            <button key={q.id} name="preset" value={q.id} className="yomi block w-full rounded-[3px] border border-keisen px-3 py-2 text-left text-[14.5px] hover:border-ai hover:bg-ai-soft">
              <span className="block text-[12px] text-nibi">{getClient(q.clientId).name}</span>
              {q.question}
            </button>
          ))}
        </form>
      </aside>
    </div>
  );
}
