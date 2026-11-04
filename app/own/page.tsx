import Link from "next/link";
import { notFound } from "next/navigation";
import { ownDir } from "@/src/core/own-world";
import { CLIENTS, COMPANY } from "@/src/core/world";
import { ownHere } from "@/src/server/own";
import { liveEnabled } from "@/src/server/session";
import { ownDeleteAll, ownSaveClients, ownSaveCompany, ownStart } from "../actions";

/**
 * 自分の会社で始める — setup (KOKOROE_OWN=1, this machine only). Your company, your client ledger (form or CSV), what happens to
 * the data, and deleting all of it. In the public version this page does not exist (404).
 */
export default async function OwnPage() {
  if (!(await ownHere())) notFound();
  const live = liveEnabled();
  const rows = [...CLIENTS.map((c) => ({ ...c, busy: c.busyMonths.join(",") })), ...Array.from({ length: 3 }, () => null)];
  const field = "mt-1 block h-10 w-full rounded-[3px] border border-waku bg-kami px-2 text-[14px]";
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
      <section className="space-y-12">
        <header>
          <h1 className="font-mincho text-[28px] tracking-[0.04em]">自分の会社で始める</h1>
          <p className="yomi mt-3 max-w-[38em] text-[15.5px]">
            架空の会社ではなく、あなたの会社の取引先台帳から始めます。帳場で場面を書くと弟子が案を作り、あなたが ○・△・× と一言を付けます。直した分が心得帳に残ります。
          </p>
          {!live && (
            <p role="alert" className="mt-4 border-l-4 border-shu bg-shu-soft px-4 py-2 text-[14px]">
              案を作るには Claude API のキーが要ります。.env.local に ANTHROPIC_API_KEY を置き、KOKOROE_LIVE=1 をつけて起動してください。
            </p>
          )}
        </header>

        <form action={ownSaveCompany} className="space-y-3">
          <h2 className="font-mincho text-[21px]">会社</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-[13px] text-nibi">会社名<input name="company" defaultValue={COMPANY.name} maxLength={40} className={field} /></label>
            <label className="text-[13px] text-nibi">師匠（いまの担当）<input name="master" defaultValue={COMPANY.master.name} maxLength={40} className={field} /></label>
            <label className="text-[13px] text-nibi">後任<input name="successor" defaultValue={COMPANY.successor.name} maxLength={40} className={field} /></label>
          </div>
          <button className="rounded-[3px] bg-sumi px-4 py-2 text-[14px] text-kami">会社を保存</button>
        </form>

        <form action={ownSaveClients} className="space-y-3">
          <h2 className="font-mincho text-[21px]">取引先台帳</h2>
          <p className="text-[13px] text-nibi">台帳に書ける事実だけを入れます（窓口・決裁者・制約・繁忙月など）。心得帳や判定がある取引先は、行を消しても台帳に残ります（心得が別の取引先に移らないように）。</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-[13px]">
              <thead className="text-left text-nibi">
                <tr><th className="font-normal">取引先名</th><th className="font-normal">業界</th><th className="font-normal">窓口</th><th className="font-normal">決裁者</th><th className="font-normal">制約</th><th className="font-normal">繁忙月</th><th className="font-normal">取引年数</th></tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={i}>
                    <td className="pr-1"><input type="hidden" name="id" value={c?.id ?? ""} /><input name="name" defaultValue={c?.name ?? ""} maxLength={40} className={field} /></td>
                    <td className="pr-1"><input name="industry" defaultValue={c?.industry ?? ""} maxLength={40} className={field} /></td>
                    <td className="pr-1"><input name="contact" defaultValue={c?.contact ?? ""} maxLength={40} className={field} /></td>
                    <td className="pr-1"><input name="decider" defaultValue={c?.decider ?? ""} maxLength={40} className={field} /></td>
                    <td className="pr-1"><input name="constraints" defaultValue={c?.constraints ?? ""} maxLength={300} className={field} /></td>
                    <td className="pr-1"><input name="busyMonths" defaultValue={c?.busy ?? ""} placeholder="例：2,3" maxLength={40} className={field} /></td>
                    <td><input name="years" defaultValue={c ? String(c.relationshipYears) : ""} inputMode="numeric" maxLength={3} className={field} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="text-[14px]">
            <summary className="cursor-pointer text-ai">CSV を貼りつける（入れると上の表より優先）</summary>
            <p className="mt-2 text-[13px] text-nibi">1行目に見出し：取引先名,業界,窓口,決裁者,制約,繁忙月,取引年数（順不同、無い列は空のまま）。1件は1行に（項目の中で改行はできません）。同じ名前の取引先は、いまの取引先として更新されます。</p>
            <textarea name="csv" rows={6} className="mt-2 block w-full rounded-[3px] border border-waku bg-kami p-2 font-mono text-[13px]" placeholder={"取引先名,業界,窓口,決裁者,制約,繁忙月,取引年数\n○○運輸,物流,配車課長,常務,社外チャット不可,\"3,12\",20"} />
          </details>
          <button className="rounded-[3px] bg-sumi px-4 py-2 text-[14px] text-kami">台帳を保存</button>
        </form>

        <form action={ownStart}>
          <button disabled={!CLIENTS.length} className="rounded-[3px] bg-ai-fill px-6 py-3 text-[15px] text-on-fill disabled:opacity-40">
            帳場へ（{CLIENTS.length} 社）
          </button>
          {CLIENTS.length > 0 && <Link href="/kokoroe" className="ml-4 text-[14px] text-ai underline-offset-4 hover:underline">心得帳を見る</Link>}
        </form>
      </section>

      <aside className="space-y-6 lg:border-l-2 lg:border-keisen lg:pl-6">
        <section>
          <h2 className="text-[15px] font-bold">データの扱い</h2>
          <dl className="mt-2 space-y-3 text-[13.5px]">
            <div><dt className="font-bold">保存する場所</dt><dd className="yomi">このPCの <code className="break-all text-[12.5px]">{ownDir()}</code> だけ。リポジトリの外です。どこにも送りません（下の一つを除く）。</dd></div>
            <div><dt className="font-bold">送るもの</dt><dd className="yomi">案・読み取り・後任への回答を作るときに、その取引先の台帳の行・書いた場面・心得帳・あなたの一言を Anthropic の Claude API に送ります。</dd></div>
            <div><dt className="font-bold">開ける人</dt><dd className="yomi">このPCからだけ（127.0.0.1）。同じネットワークの他の人からは開けません。</dd></div>
            <div><dt className="font-bold">公開版</dt><dd className="yomi">公開しているデモには、このモードはありません。</dd></div>
          </dl>
        </section>
        <form action={ownDeleteAll} className="space-y-2 border-t border-keisen pt-5">
          <h2 className="text-[15px] font-bold text-shu">全部消す</h2>
          <p className="text-[13px] text-nibi">会社・台帳・心得帳・判定をすべて消します。元に戻せません。消すには「消す」と入れてください。</p>
          <input name="confirm" autoComplete="off" placeholder="消す" className="block h-10 w-40 rounded-[3px] border border-waku bg-kami px-2 text-[14px]" />
          <button className="rounded-[3px] border border-shu px-4 py-2 text-[14px] text-shu hover:bg-shu-soft">全部消す</button>
        </form>
      </aside>
    </div>
  );
}
