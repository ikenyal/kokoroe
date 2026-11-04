import Link from "next/link";
import { start } from "./actions";
import { getSession, liveEnabled } from "@/src/server/session";
import { fieldEnabled } from "@/src/server/field";
import { redirect } from "next/navigation";
import { ownEnabled } from "@/src/core/own-world";
import { getClient } from "@/src/core/world";
import type { KokoroeRule } from "@/src/learning/types";
import demo from "@/data/demo/demo-snapshot.json";
import { Mark } from "./marks";

/** One real 心得 from the demo's 心得帳, shown as it would be handed over: the rule, the master's words, why, and when. */
function specimen() {
  const rules = demo.store.rules as unknown as KokoroeRule[];
  const learned = rules.filter((r) => r.status === "active" && r.sources.some((x) => x.kind !== "ledger"));
  const r = learned.find((x) => x.history.some((h) => h.trigger && h.masterWords)) ?? learned[0];
  if (!r) return null;
  const h = [...r.history].reverse().find((x) => x.trigger) ?? r.history.at(-1)!;
  const src = r.sources.find((x) => x.kind !== "ledger");
  return { client: r.scope.clientId ? getClient(r.scope.clientId).name : "全社", text: r.text, words: h.masterWords, why: h.trigger, date: h.date, verdict: src && "verdict" in src ? src.verdict : undefined };
}

const STEPS = [
  ["一", "弟子（AI の橙丸）が、対応の段取りを先に作る。"],
  ["二", "師匠は ○・△・× の印と、あれば一言を付けるだけ。"],
  ["三", "直された分が、わけつきで心得帳に残り、後任に渡る。"],
] as const;

export default async function Home(props: PageProps<"/">) {
  if (ownEnabled()) redirect("/own"); // own mode: the fictional demo is not offered in this process
  const { limit } = await props.searchParams;
  const s = await getSession();
  const live = liveEnabled();
  const ex = specimen();
  return (
    <div className="grid gap-x-14 gap-y-12 md:grid-cols-[1.15fr_1fr]">
      <section className="flex flex-col">
        <h1 className="font-mincho text-[25px] leading-snug tracking-[0.04em] sm:text-[30px]">
          聞いても出てこない作法を、
          <br />
          ダメ出しで受け継ぐ。
        </h1>
        <p className="yomi mt-4 max-w-[32em] text-[16px]">
          取引先ごとの付き合い方は、ベテランの頭の中にしかありません。説明はできなくても、案を見れば「違う」とはすぐ言えます。ココロエは、その「違う」を集めます。
        </p>
        <ol className="mt-6 max-w-[32em] border-t border-keisen max-md:order-last">
          {STEPS.map(([n, t]) => (
            <li key={n} className="grid grid-cols-[2rem_1fr] border-b border-keisen py-2.5">
              <span aria-hidden className="font-mincho text-[17px] text-nibi">{n}</span>
              <span className="yomi text-[15.5px]">{t}</span>
            </li>
          ))}
        </ol>

        {limit === "starts" && (
          <p role="status" className="mt-8 border-l-4 border-ai bg-ai-soft px-4 py-2 text-[14px]">
            短い時間に、この接続から何度も始め直されています。しばらくしてからもう一度お試しください。
            {s && <>続きがあるので、<Link className="underline" href="/choba">帳場に戻る</Link>こともできます。</>}
          </p>
        )}

        <h2 className="mt-10 font-mincho text-[18px]">始め方</h2>
        <div className="mt-3 max-w-[32em] border-y-2 border-sumi/80">
          <form action={start} className="grid items-center gap-x-5 gap-y-2 py-4 sm:grid-cols-[13rem_1fr]">
            <input type="hidden" name="mode" value="demo" />
            <button className="h-12 rounded-[3px] bg-ai px-5 text-[16px] text-kami hover:opacity-95">デモの続きから見る</button>
            <p className="text-[14px] text-sumi">途中まで育った心得帳があります。まず全体を見るならこちら。</p>
          </form>
          <form action={start} className="grid items-center gap-x-5 gap-y-2 border-t border-keisen py-4 sm:grid-cols-[13rem_1fr]">
            <input type="hidden" name="mode" value="trial" />
            <button className="h-12 rounded-[3px] border border-ai px-5 text-[16px] text-ai hover:bg-ai-soft">師匠になって試す</button>
            <p className="text-[14px] text-sumi">心得帳は空から。あなたの印だけで弟子を育てます。</p>
          </form>
        </div>
        {fieldEnabled() && (
          <form action={start} className="mt-4">
            <input type="hidden" name="mode" value="field" />
            <button className="text-[14px] text-ai underline-offset-4 hover:underline">師匠役テストを始める（作者用・所要時間を記録します）</button>
          </form>
        )}
        {s && (
          <p className="mt-4 text-[13px] text-nibi">
            続きがあります（{s.mode === "demo" ? "デモの続き" : s.mode === "field" ? "師匠役テスト" : "お試し"}）。<Link className="underline" href="/choba">帳場に戻る</Link>
            。上のボタンを押すと、最初からやり直します。
          </p>
        )}
      </section>

      <div className="space-y-10">
        {ex && (
          <figure aria-labelledby="ex-h" className="border-t-2 border-sumi/80 pt-4">
            <p id="ex-h" className="font-mincho text-[14px] text-sumi">心得帳の一行（デモから）</p>
            <p className="mt-2 text-[14px] text-nibi">{ex.client}</p>
            <blockquote className="yomi mt-1 font-mincho text-[20px] leading-relaxed">{ex.text}</blockquote>
            <dl className="mt-4 grid grid-cols-[5em_1fr] gap-y-2 border-t border-keisen pt-3 text-[14px]">
              {ex.verdict && (
                <>
                  <dt className="text-nibi">師匠の印</dt>
                  <dd className="flex items-center gap-2">
                    <Mark v={ex.verdict as "○" | "△" | "×"} size={22} className="text-shu" />
                    {ex.words && <span className="yomi">「{ex.words}」</span>}
                  </dd>
                </>
              )}
              {ex.why && (
                <>
                  <dt className="text-nibi">わけ</dt>
                  <dd className="yomi">{ex.why}</dd>
                </>
              )}
              <dt className="text-nibi">記帳</dt>
              <dd className="tabular-nums">{ex.date}</dd>
            </dl>
            <figcaption className="mt-3 text-[13px] text-nibi">師匠の印と一言から弟子が書き、わけは師匠の言葉のまま残します。後任はここから聞けます。</figcaption>
          </figure>
        )}

        <details className="text-[14px]">
          <summary className="cursor-pointer text-ai select-none">データの扱い</summary>
          <dl className="mt-3 space-y-4">
            <div>
              <dt className="font-medium">入れるもの</dt>
              <dd className="yomi mt-1">
                ○・△・× の判定と、任意の短い一言。後任の相談では質問文。このデモで扱うのは架空の会社「だいだい工房」と取引先10社だけです。実在の社名や個人の情報は入れないでください。
              </dd>
            </div>
            <div>
              <dt className="font-medium">送る先</dt>
              <dd className="yomi mt-1">
                {live
                  ? "案の作成・判定の解釈・後任への回答のため、Anthropic の Claude API に送ります。API キーはサーバー側だけにあります。"
                  : "いまは記録済みの案と結果で動いています（外部には送りません）。ライブ版では Anthropic の Claude API に送ります。"}
              </dd>
            </div>
            <div>
              <dt className="font-medium">保存するもの</dt>
              <dd className="yomi mt-1">
                このブラウザのセッションの心得帳・判定・質問だけを、サーバーのファイルに保存します。最初からやり直すと前のセッションは消え、24時間たったものも新しいセッションを始めるときに消します。会話の本文をログには残しません。
              </dd>
            </div>
          </dl>
        </details>
      </div>
    </div>
  );
}
