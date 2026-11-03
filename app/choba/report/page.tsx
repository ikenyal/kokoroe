import { redirect } from "next/navigation";
import { getSession, type Timing } from "@/src/server/session";

const LABEL: Record<Timing["kind"], string> = {
  judge: "○△× を付ける（案を読んでから印まで）",
  remark: "一言を添えて記録する（印から記録まで）",
  choose: "読み方の候補を選ぶ",
  why: "「なぜ？」に答える／飛ばす",
  write: "同じ作法を文章で書く",
};

const sec = (ms: number) => `${(ms / 1000).toFixed(1)} 秒`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
};

/** 実地テストのまとめ — medians per action, for the impact estimate (t_judge vs t_write). Timings only; no content. */
export default async function ReportPage() {
  const s = await getSession();
  if (!s || s.mode !== "field") redirect("/");
  const t = s.meta.timings ?? [];
  const kinds = (Object.keys(LABEL) as Timing["kind"][]).filter((k) => t.some((x) => x.kind === k));
  const judgeMed = median(t.filter((x) => x.kind === "judge").map((x) => x.ms));
  const remarkMed = median(t.filter((x) => x.kind === "remark").map((x) => x.ms));
  const writeMed = median(t.filter((x) => x.kind === "write").map((x) => x.ms));
  return (
    <div className="max-w-3xl">
      <h1 className="font-mincho text-[24px] tracking-[0.06em]">実地テストのまとめ</h1>
      <p className="mt-2 text-[13px] text-nibi">作者が師匠役を務めた範囲の実測です（架空データ）。中央値で示します。</p>
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
        </p>
      )}
      <details className="mt-6 text-[13px]">
        <summary className="cursor-pointer text-ai">記録の生データ（JSON）</summary>
        <pre className="mt-2 overflow-x-auto rounded-[3px] bg-kami-2 p-3">{JSON.stringify({ timings: t, writes: (s.meta.writes ?? []).map((w) => ({ sceneId: w.sceneId, ms: w.ms, chars: w.text.length })) }, null, 2)}</pre>
      </details>
    </div>
  );
}
