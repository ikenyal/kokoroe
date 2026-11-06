import { LimitNote } from "../limit-note";
import { AskButton } from "./ask-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CLIENTS, COMPANY, getClient, HISTORY_QUESTIONS } from "@/src/core/world";
import { getSession, liveEnabled, type SuccessorTurn } from "@/src/server/session";
import { ask } from "../actions";
import { citationParts, plainText } from "@/src/lib/plain";
import { isEitherOr } from "@/src/lib/question";
import { ownEnabled } from "@/src/core/own-world";
import general from "@/data/demo/recorded-answers-general.json";
import recorded from "@/data/demo/recorded-answers.json";

/**
 * The rule as it is now, with only the words added since 前は marked (character LCS against 前は; one-character gaps inside a
 * changed run are marked too, so incidental matches do not split it; ui-critic 11/6).
 */
function Changed({ before, after }: { before: string; after: string }) {
  const b = [...before], a = [...after];
  const L = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const added = new Array<boolean>(a.length).fill(true);
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) { added[i] = false; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  for (let i = 1; i < a.length - 1; i++) if (!added[i] && added[i - 1] && added[i + 1]) added[i] = true;
  const marked = added.filter(Boolean).length;
  if (!marked || marked > a.length * 0.6) return <>{after}</>; // nothing, or nearly everything, changed: no marking
  const parts: { text: string; on: boolean }[] = [];
  a.forEach((ch, i) => (parts.at(-1)?.on === added[i] ? (parts.at(-1)!.text += ch) : parts.push({ text: ch, on: added[i] })));
  return <>{parts.map((x, k) => (x.on ? <mark key={k} className="bg-transparent font-bold text-ai underline decoration-ai/50 underline-offset-4">{x.text}</mark> : <span key={k}>{x.text}</span>))}</>;
}

const ANSWER: Record<SuccessorTurn["answer"], { word: string; tone: string }> = {
  yes: { word: "はい", tone: "text-ai" },
  no: { word: "いいえ", tone: "text-sumi" }, // vermilion is only for the master's marks
  unknown: { word: "心得帳に記録がありません", tone: "text-nibi" },
};

/**
 * 心得帳がある・ない: for one of the example questions, the answer the same evaluation recorded WITHOUT a kokoroe-chō (general
 * knowledge only), beside this one. Recorded data, no API call (data/demo/recorded-answers-general.json).
 */
function withoutBook(t: SuccessorTurn) {
  if (ownEnabled()) return null;
  const q = HISTORY_QUESTIONS.find((x) => x.question === t.question && x.clientId === t.clientId);
  return q ? (general.answers as Record<string, { answer: SuccessorTurn["answer"]; explanation: string }>)[q.id] ?? null : null;
}

/**
 * Display order only (the questions themselves are the evaluation's): first those where the recorded answers differ most —
 * no answer without the 心得帳, an answer with its reasons with it — starting with the 浜風運輸 delay; then the rest.
 */
function examplesInOrder() {
  if (ownEnabled()) return HISTORY_QUESTIONS;
  const g = general.answers as Record<string, { answer: string }>;
  const telling = (id: string) => g[id]?.answer === "unknown" && (recorded.answers as Record<string, { answer: string }>)[id]?.answer !== "unknown";
  const first = HISTORY_QUESTIONS.filter((q) => telling(q.id));
  const lead = first.findIndex((q) => q.clientId === "C01");
  if (lead > 0) first.unshift(...first.splice(lead, 1));
  return [...first, ...HISTORY_QUESTIONS.filter((q) => !telling(q.id))];
}

function Turn({ t, ruleText }: { t: SuccessorTurn; ruleText: (id: string) => string | undefined }) {
  const a = ANSWER[t.answer];
  const eitherOr = isEitherOr(t.question); // no はい・いいえ heading above an either/or answer (decision 19 (b))
  const g = withoutBook(t);
  const mine = (
    <>
      {!(eitherOr && t.answer !== "unknown") && <p className={`font-mincho text-[22px] ${a.tone}`}>{a.word}</p>}
      <p className="yomi mt-1 text-[16px]">{plainText(t.explanation)}</p>
    </>
  );
  return (
    <article className="border-t-2 border-rule pt-4">
      <p className="text-[13px] text-nibi">
        {COMPANY.successor.name}の質問　{getClient(t.clientId).name}
      </p>
      <p className="yomi mt-1 text-[17px]">{t.question}</p>
      {g ? (
        <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <section aria-label="心得帳なしの答え" className="order-2 border-t border-keisen pt-2 sm:order-none">
            <h3 className="text-[13px] text-nibi">心得帳なし（取引先台帳だけ）</h3>
            {!(eitherOr && g.answer !== "unknown") && <p className="mt-1 font-mincho text-[19px] text-sumi/80">{g.answer === "unknown" ? "判断できない" : ANSWER[g.answer].word}</p>}
            <p className="yomi mt-1 text-[15px] text-sumi/80">{plainText(g.explanation)}</p>
            <p className="mt-3 border-t border-keisen pt-2 text-[13.5px] text-sumi/80">根拠・経緯：なし（心得帳を渡していない）</p>
          </section>
          <section aria-label="心得帳ありの答え" className="order-1 border-t-2 border-ai pt-2 sm:order-none">
            <h3 className="text-[13px] text-ai">心得帳あり（理由と経緯つき）</h3>
            <div className="mt-1">{mine}</div>
            <p className="mt-3 border-t border-keisen pt-2 text-[13.5px] text-sumi">
              根拠・経緯：
              {(() => {
                const fact = t.citations.filter((c) => /出典[:：]\s*(取引先)?台帳/.test(c.history)).length;
                const rule = t.citations.length - fact;
                if (!t.citations.length) return "なし（心得帳に記録がないので、師匠に確認を勧める）";
                return [rule && `心得${rule}つ`, fact && `取引先台帳の決まりごと${fact}つ`].filter(Boolean).join("・") + "（わ⁠け⁠は⁠下⁠に⁠）";
              })()}
            </p>
          </section>
        </div>
      ) : (
        <div className="mt-4">{mine}</div>
      )}
      {t.answer === "unknown" && t.source === "live" && <p className="mt-2 text-[14px]">師匠（{COMPANY.master.name}）に確認してください。</p>}
      {t.citations.length > 0 && (
        <div className="mt-5 grid gap-x-5 border-t border-keisen pt-3 sm:grid-cols-[2.2rem_1fr]">
          <h3 className="font-mincho text-[14px] tracking-[0.2em] sm:tate">根拠の心得</h3>
          <ul className="mt-1 space-y-3 sm:mt-0">
            {t.source === "recorded" && <li className="text-[13px] text-nibi">記録したときの心得帳の言い回しです。いまの心得帳とは、言い回しが違うことがあります。</li>}
            {t.citations.map((c, i) => {
              const h = citationParts(c.history);
              const live = t.source === "live" && ruleText(c.ruleId);
              return (
                <li key={i} className="text-[14.5px]">
                  {live ? (
                    <Link className="yomi text-[16.5px] text-ai underline-offset-4 hover:underline" href={`/kokoroe#${c.ruleId}`}>{h.rule}</Link>
                  ) : (
                    <p className="yomi text-[16.5px]">{h.before ? <Changed before={h.before} after={h.rule} /> : h.rule}</p>
                  )}
                  {h.before && <p className="yomi text-[14px]"><span className="text-nibi">前は：</span>{h.before}</p>}
                  {h.why && <p className="yomi text-[14px]"><span className="text-nibi">わけ：</span>{h.why}</p>}
                  <p className="text-[13px] text-nibi">
                    {/* Both kinds say where they came from (ui-critic 11/6 evening). A fact copied from the client ledger is shown
                        without its copy date (Kento 11/6 item 25: it is not when it began); the master's correction keeps its date. */}
                    {/^(取引先)?台帳/.test(h.source ?? "") ? (
                      <span className="inline-block whitespace-nowrap">出どころ：取引先台帳</span>
                    ) : (
                      <span className="inline-block whitespace-nowrap">出どころ：師匠の直し{h.written && `（${h.written}）`}</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {t.source === "recorded" ? (
        <p className="mt-3 text-[13px] text-nibi">記録済みの答え（記録したときの心得帳で答えたもの）を表示しています。{g && "心得帳なしの答えも、同じときに、心得帳を渡さずに記録したものです。"}</p>
      ) : (
        g && <p className="mt-3 text-[12.5px] text-nibi">心得帳なしの答えは、評価で記録したものです（同じ質問、心得帳を渡さずに答えたもの）。</p>
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
        {/* The question just answered is not offered again (ui-critic 11/5: tapping it looks like nothing happened). */}
        {examplesInOrder().filter((q) => !(answers[0] && q.clientId === answers[0].clientId && q.question === answers[0].question)).map((q) => (
          <button
            key={q.id}
            name="preset"
            value={q.id}
            className="group grid min-h-11 w-full cursor-pointer grid-cols-1 gap-x-4 border-t border-keisen px-1 py-2.5 text-left first:border-t-0 hover:bg-ai-soft sm:grid-cols-[9rem_1fr_auto]"
          >
            <span className="text-[13px] text-nibi sm:pt-0.5">{getClient(q.clientId).name}</span>
            <span className="yomi text-[15.5px]">{q.question}</span>
            <span aria-hidden className="text-[13px] text-ai underline-offset-4 group-hover:underline max-sm:justify-self-end sm:pt-0.5">尋ねる</span>
          </button>
        ))}
      </form>
    </section>
  );
  return (
    <div className="max-w-4xl">
      <div className="empty:hidden"><LimitNote reason={s.meta.limit} /></div>
      <section aria-labelledby="noren-h">
        <h1 id="noren-h" className="font-mincho text-[24px] tracking-[0.06em]">暖簾を継ぐ</h1>
        <p className="yomi mt-2 max-w-[36em] text-[15.5px]">
          後任の{COMPANY.successor.name}が取引先のことを尋ねると、橙丸が心得帳だけを根拠に答⁠え⁠ま⁠す。答えには、根拠の心得と、なぜそうなったか（沿革）を必ず添⁠え⁠ま⁠す。心⁠得⁠帳にないことには答えず、師匠への確認を勧めます。
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
          <AskButton live={live} />
        </form>
        {!live && <p className="mt-2 text-[13px] text-nibi">このデモでは、下の質問に記録済みの答えで返します。自由な質問には、公開版のライブで答えます。</p>}
        {live && s.meta.limit && <p className="mt-2 text-[13px] text-nibi">上限のあいだは、下の質問に記録済みの答えで返します。</p>}
        {answers.length > 0 && <div className="mt-10 space-y-10">{answers.map((t, i) => <Turn key={i} t={t} ruleText={ruleText} />)}</div>}
        {examples}
        {ownEnabled() && !answers.length && <p className="mt-8 text-[14px] text-nibi">取引先を選んで、質問を入れてください。</p>}
      </section>
    </div>
  );
}
