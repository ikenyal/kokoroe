import Link from "next/link";
import { start } from "./actions";
import { getSession, liveEnabled } from "@/src/server/session";
import { fieldEnabled } from "@/src/server/field";

export default async function Home() {
  const s = await getSession();
  const live = liveEnabled();
  return (
    <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
      <section>
        <h1 className="font-mincho text-[30px] leading-snug tracking-[0.04em]">
          聞いても出てこない作法を、
          <br />
          ダメ出しで受け継ぐ。
        </h1>
        <p className="yomi mt-5 max-w-[34em] text-[16px]">
          取引先ごとの付き合い方は、ベテランの頭の中にしかありません。説明を頼んでも言葉にはなりませんが、案を見せれば「違う」とはすぐ言えます。
          ここでは AI の弟子・橙丸が先に対応案を作り、師匠の篠原が ○・△・× と短い一言を付けます。直された分だけが、出典と沿革つきで心得帳に残り、後任の三上に引き継がれます。
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <form action={start}>
            <input type="hidden" name="mode" value="demo" />
            <button className="w-full rounded-[3px] bg-ai px-5 py-4 text-left text-kami hover:opacity-95">
              <span className="block text-[17px] font-medium">デモの続きから見る</span>
              <span className="mt-1 block text-[13px] opacity-85">学習の途中まで育った心得帳から始めます</span>
            </button>
          </form>
          <form action={start}>
            <input type="hidden" name="mode" value="trial" />
            <button className="w-full rounded-[3px] border border-ai px-5 py-4 text-left text-ai hover:bg-ai-soft">
              <span className="block text-[17px] font-medium">師匠になって試す</span>
              <span className="mt-1 block text-[13px]">台帳だけの状態から、あなたの判定で育てます</span>
            </button>
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

      <aside aria-labelledby="data-h" className="border-l-2 border-keisen pl-6">
        <h2 id="data-h" className="text-[15px] font-bold">データの扱い</h2>
        <dl className="mt-4 space-y-5 text-[14px]">
          <div>
            <dt className="font-medium">入れるもの</dt>
            <dd className="yomi mt-1 text-[14.5px]">
              ○・△・× の判定と、任意の短い一言。後任の相談では質問文。このデモで扱うのは架空の会社「だいだい工房」と取引先10社だけです。実在の社名や個人の情報は入れないでください。
            </dd>
          </div>
          <div>
            <dt className="font-medium">送る先</dt>
            <dd className="yomi mt-1 text-[14.5px]">
              {live
                ? "案の作成・判定の解釈・後任への回答のため、Anthropic の Claude API に送ります。API キーはサーバー側だけにあります。"
                : "いまは記録済みの案と結果で動いています（外部には送りません）。ライブ版では Anthropic の Claude API に送ります。"}
            </dd>
          </div>
          <div>
            <dt className="font-medium">保存するもの</dt>
            <dd className="yomi mt-1 text-[14.5px]">
              このブラウザのセッションの心得帳・判定・質問だけを、サーバーのファイルに保存します。最初からやり直すと前のセッションは消え、24時間たったものも新しいセッションを始めるときに消します。会話の本文をログには残しません。
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
