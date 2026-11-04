import { redirect } from "next/navigation";
import { getClient } from "@/src/core/world";
import { buildOwnResult } from "@/src/server/own-result";
import { getSession, type Timing } from "@/src/server/session";
import { ownSaveCounts } from "../../actions";

const LABEL: Record<Timing["kind"], string> = {
  scene: "状況を書く（場面の入力。判定とは別）",
  write: "同じ作法を文章で書く",
  judge: "○△× を付ける（案を読んでから印まで）",
  remark: "一言を添えて記録する（印から記録まで）",
  choose: "読み方の候補を選ぶ",
  why: "「なぜ？」に答える／飛ばす",
  check: "確かめ・回帰の確認（解き直した案に印）",
};

const sec = (ms: number) => `${(ms / 1000).toFixed(1)} 秒`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
};

const CRITERION = "後任がそのまま実行できる具体的な作法か";

/** 師匠役テスト / own-mode comparison: medians per action (t_judge vs t_write). Own mode adds the counting list (D-060). */
export default async function ReportPage() {
  const s = await getSession();
  if (!s || (s.mode !== "field" && s.mode !== "own")) redirect("/");
  const t = s.meta.timings ?? [];
  const kinds = (Object.keys(LABEL) as Timing["kind"][]).filter((k) => t.some((x) => x.kind === k));
  const judgeMed = median(t.filter((x) => x.kind === "judge").map((x) => x.ms));
  const remarkMed = median(t.filter((x) => x.kind === "remark").map((x) => x.ms));
  const writeMed = median(t.filter((x) => x.kind === "write").map((x) => x.ms));
  const own = s.mode === "own";
  const rules = own ? (await s.store.listRules()).filter((r) => r.status === "active" && r.sources.some((x) => x.kind !== "ledger")) : [];
  const counts = s.meta.counts;
  const sceneOf = (id: string) => s.meta.queue.find((q) => q.scene.id === id)?.scene;
  return (
    <div className="max-w-4xl">
      <h1 className="font-mincho text-[24px] tracking-[0.06em]">{own ? "比較テストのまとめ" : "師匠役テストのまとめ"}</h1>
      <p className="mt-2 text-[13px] text-nibi">
        {own ? "自分の取引先（仮名）で測った実測です。この画面の文章はこのPCの外に出ません。" : "作者が師匠役を務めた範囲の実測です（架空データ）。"}中央値で示します。
      </p>
      <table className="mt-6 w-full border-collapse text-[15px] tabular-nums">
        <thead>
          <tr className="border-b-2 border-sumi/80 text-left text-[13px] text-nibi">
            <th className="py-2 font-normal">操作</th>
            <th className="font-normal">回数</th>
            <th className="font-normal">中央値</th>
            <th className="font-normal">合計</th>
          </tr>
        </thead>
        <tbody>
          {kinds.map((k) => {
            const xs = t.filter((x) => x.kind === k).map((x) => x.ms);
            return (
              <tr key={k} className="border-b border-keisen">
                <td className="py-2">{LABEL[k]}</td>
                <td>{xs.length}</td>
                <td>{sec(median(xs))}</td>
                <td>{sec(xs.reduce((a, b) => a + b, 0))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {writeMed > 0 && judgeMed > 0 && (
        <p className="yomi mt-6 text-[16px]">
          1件あたり、判定は {sec(judgeMed + remarkMed)}（印 {sec(judgeMed)} ＋ 一言 {sec(remarkMed)}）、文章で書くと {sec(writeMed)}。
          {own && "状況を書く時間は、どちらにも含めていません。"}
        </p>
      )}

      {own && (
        <form action={ownSaveCounts} className="mt-10">
          <h2 className="font-mincho text-[20px]">作法を数える</h2>
          <p className="yomi mt-1 text-[15px]">
            基準はひとつ：「{CRITERION}」。文章には、その基準に当たる作法がいくつ入っているかを数字で。判定から覚えた心得は、当たるものに印を。
          </p>
          <h3 className="mt-6 text-[15px] font-bold">文章で書いたもの</h3>
          <ul className="mt-2 space-y-3">
            {(s.meta.writes ?? []).map((w) => {
              const sc = sceneOf(w.sceneId);
              return (
                <li key={w.sceneId} className="rounded-[3px] border border-keisen p-3">
                  <p className="text-[13px] text-nibi">{sc ? `${getClient(sc.clientId).name}・${sc.situation.slice(0, 40)}` : w.sceneId}</p>
                  <p className="yomi mt-1 whitespace-pre-line text-[15.5px]">{w.text}</p>
                  <label className="mt-2 flex items-center gap-2 text-[14px]">
                    当たる作法の数
                    <input name={`prose:${w.sceneId}`} type="number" min={0} max={50} required defaultValue={counts?.prose[w.sceneId]} className="h-11 w-20 rounded-[3px] border border-waku bg-kami px-2" />
                  </label>
                </li>
              );
            })}
          </ul>
          <h3 className="mt-6 text-[15px] font-bold">判定から覚えた心得</h3>
          <ul className="mt-2 space-y-2">
            {rules.map((r) => (
              <li key={r.id}>
                <label className="flex gap-3 rounded-[3px] border border-keisen p-3 has-[:checked]:border-ai">
                  <input type="checkbox" name={`rule:${r.id}`} value="1" defaultChecked={counts?.rules[r.id] === true} className="mt-1.5 size-5" />
                  <span className="yomi text-[15.5px]">
                    {r.text}
                    {r.when && <span className="text-nibi">（{r.when}）</span>}
                  </span>
                </label>
              </li>
            ))}
            {!rules.length && <li className="text-[14px] text-nibi">まだ心得はありません。</li>}
          </ul>
          <button className="mt-4 h-12 rounded-[3px] bg-sumi px-6 text-[15px] text-kami">数えた結果を残す</button>
        </form>
      )}

      {own ? (
        <details className="mt-8 text-[13px]" open>
          <summary className="cursor-pointer text-ai">repo に保存されるもの（時間と件数だけ。npm run own:save で保存）</summary>
          <pre className="mt-2 overflow-x-auto rounded-[3px] bg-kami-2 p-3">{JSON.stringify(buildOwnResult(s.meta, await s.store.listRules()), null, 2)}</pre>
        </details>
      ) : (
        <details className="mt-6 text-[13px]">
          <summary className="cursor-pointer text-ai">記録の生データ（JSON）</summary>
          <pre className="mt-2 overflow-x-auto rounded-[3px] bg-kami-2 p-3">{JSON.stringify({ timings: t, writes: (s.meta.writes ?? []).map((w) => ({ sceneId: w.sceneId, ms: w.ms, chars: w.text.length })) }, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
