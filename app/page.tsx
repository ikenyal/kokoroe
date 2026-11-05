import Link from "next/link";
import { start } from "./actions";
import { getSession, liveEnabled } from "@/src/server/session";
import { fieldEnabled } from "@/src/server/field";
import { redirect } from "next/navigation";
import { ownEnabled } from "@/src/core/own-world";
import demo from "@/data/demo/demo-snapshot.json";
import { Mark } from "./marks";
import { marushinStory, sceneRangeSplit } from "./dandori";
import mcp from "@/demo/successor-mcp/answers.json";

const STEPS = [
  ["一", "弟子（AI の橙丸）が、誰に・何で・いつ・裏で誰に、という段取りを先に作る。"],
  ["二", "師匠は ○・△・× の印と、あれば一言を付けるだけ。"],
  ["三", "直された分が、わけつきで心得帳に残り、後任に渡る。"],
] as const;

export default async function Home(props: PageProps<"/">) {
  if (ownEnabled()) redirect("/own"); // own mode: the fictional demo is not offered in this process
  const { limit } = await props.searchParams;
  const s = await getSession();
  const live = liveEnabled();
  const ex = marushinStory(demo, mcp);
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
            <button className="h-12 rounded-[3px] bg-ai-fill px-5 text-[16px] text-on-fill hover:opacity-95">デモの続きから見る</button>
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
            。上のどのボタンで始めても、最初からやり直しになります。
          </p>
        )}
        <section aria-labelledby="range-h" className="mt-10 max-w-[32em] border-t-2 border-sumi/80 pt-4">
          <h2 id="range-h" className="font-mincho text-[14px] text-sumi">扱う場面は10種類。メールだけではありません</h2>
          {(() => {
            const { shown, rest } = sceneRangeSplit();
            const row = (r: (typeof shown)[number]) => (
              <li key={r.type} className="grid grid-cols-[10.5em_1fr] gap-x-3 border-t border-keisen py-1.5 text-[14px] first:border-t-0">
                <span className="text-sumi">{r.label}</span>
                <span className="yomi text-sumi/80">
                  {r.example ?? "—"}
                  {r.quiet && <span className="block text-sumi">裏で、{r.quiet}</span>}
                </span>
              </li>
            );
            return (
              <>
                <ul className="mt-2">{shown.map(row)}</ul>
                {rest.length > 0 && (
                  <details className="mt-1 border-t border-keisen">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-[14px] text-ai select-none">残り{rest.length}種類を見る</summary>
                    <ul>{rest.map(row)}</ul>
                  </details>
                )}
              </>
            );
          })()}
          <p className="mt-2 text-[12.5px] text-sumi/75">弟子が直される前に出した段取りの例です（架空の取引先）。</p>
        </section>
      </section>

      <div className="space-y-10">
        {ex && (
          <figure aria-labelledby="ex-h" className="border-t-2 border-sumi/80 pt-4">
            <p id="ex-h" className="font-mincho text-[14px] text-sumi">一つの例：{ex.client}</p>
            <ol className="mt-2 text-[14px]">
              <li className="grid grid-cols-[7.5em_1fr] gap-x-3 border-t border-keisen py-2.5 first:border-t-0">
                <span className="text-nibi">
                  弟子の案
                  <span className="block text-[12.5px]">{ex.first.type}</span>
                </span>
                <span className="yomi">
                  <span className="block text-[13px] text-sumi/75">{ex.first.to}へ、{ex.first.means}</span>
                  裏で：{ex.first.quiet ?? "なし"}
                </span>
              </li>
              <li className="grid grid-cols-[7.5em_1fr] items-center gap-x-3 border-t border-keisen py-2.5">
                <span className="text-nibi">師匠</span>
                <span className="flex items-center gap-2">
                  <Mark v={ex.mark.verdict} size={22} className="text-shu" />
                  <span className="yomi">{ex.mark.remark ? `「${ex.mark.remark}」` : <span className="text-sumi/75">条件つき（一言なし）</span>}</span>
                </span>
              </li>
              <li className="grid grid-cols-[7.5em_1fr] gap-x-3 border-t border-keisen py-2.5">
                <span className="text-nibi">心得帳に</span>
                <blockquote className="yomi font-mincho text-[17px] leading-relaxed">{ex.rule}</blockquote>
              </li>
              <li className="grid grid-cols-[7.5em_1fr] gap-x-3 border-t border-keisen py-2.5">
                <span className="text-nibi">
                  次の案
                  <span className="block text-[12.5px]">{ex.next.type}</span>
                </span>
                <span className="yomi self-start bg-ai-soft px-1.5 text-sumi">裏で：{ex.next.quiet}</span>
              </li>
              <li className="grid grid-cols-[7.5em_1fr] gap-x-3 border-t border-keisen py-2.5">
                <span className="text-nibi">後任が聞くと</span>
                <span className="yomi">
                  <span className="text-nibi">「{ex.question}」</span>
                  <span className="mt-1 block">{ex.answer}</span>
                </span>
              </li>
            </ol>
            <figcaption className="mt-2 text-[12.5px] text-nibi">
              記録した稽古の案と判定、そこから書かれた心得、後任の手元の Claude Code（心得帳を Skill として渡したもの）で記録した答えです。架空の取引先。
            </figcaption>
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
