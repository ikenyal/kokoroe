import results from "@/data/demo/results.json";
import { CurveChart, type Curve } from "./curve-chart";

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** 稽古の記録 — reads recorded evaluation results only. This screen never calls the API. */
export default function KeikoPage() {
  const curves = results.curves as Curve[];
  const latest = curves.at(-1)!;
  const end = latest.points.at(-1)!;
  const pathsRaw = results.paths as null | { mean: number; min: number; max: number; n: number; paths: { taps: number }[] };
  const paths = pathsRaw && { ...pathsRaw, taps: Math.round(pathsRaw.paths.reduce((a, p) => a + p.taps, 0) / pathsRaw.paths.length) };
  const hist = results.history;
  const adv: typeof results.adversarial & { escalatedByModel?: number } = results.adversarial; // typed: escalatedByModel appears with the 11/7 run (D-044)
  return (
    <div>
      <h1 className="font-mincho text-[24px] tracking-[0.06em]">稽古の記録</h1>
      <p className="yomi mt-2 max-w-[40em] text-[15px] text-nibi">{results.note}</p>

      <section aria-labelledby="ba-h" className="mt-8">
        <h2 id="ba-h" className="sr-only">Before と After</h2>
        <dl className="grid gap-x-10 gap-y-6 border-y-2 border-sumi/80 py-6 sm:grid-cols-3">
          <div>
            <dt className="text-[13px] text-nibi">Before　台帳と制約だけの弟子</dt>
            <dd className="mt-1 font-mincho text-[40px] leading-none tabular-nums">{pct(results.before.match)}</dd>
            <dd className="mt-1 text-[13px] text-nibi">評価用20場面の一致率（○）、{results.before.runs}回平均 ±{Math.round(results.before.sd * 100)}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-nibi">ダメ出し40場面のあと{results.official ? "" : "（途中経過）"}</dt>
            <dd className="mt-1 font-mincho text-[40px] leading-none tabular-nums text-ai">
              {paths ? pct(paths.mean) : pct(end.match)}
            </dd>
            <dd className="mt-1 text-[13px] text-nibi">
              {paths ? `学習${paths.n}本の平均（${pct(paths.min)}〜${pct(paths.max)}）` : `${latest.label}の曲線、タップ ${end.taps} 回`}
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-nibi">後任が経緯ごと答えられた質問</dt>
            <dd className="mt-1 font-mincho text-[40px] leading-none tabular-nums">
              {hist[0].mean.toFixed(0)}<span className="text-[22px] text-nibi"> → </span>
              <span className="text-ai">{hist.at(-1)!.mean.toFixed(1)}</span>
              <span className="text-[18px] text-nibi"> / 8</span>
            </dd>
            <dd className="mt-1 text-[13px] text-nibi">心得帳なし → 育った心得帳、{results.official ? `学習${results.paths?.n ?? 0}本の平均` : "3回平均"}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="curve-h" className="mt-10 grid gap-8 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0">
          <h2 id="curve-h" className="text-[15px] font-bold">学習曲線</h2>
          <p className="mt-1 text-[13px] text-nibi">どれだけ師匠の手を借りて、どこまで一致するようになったか。灰色の線は改良の途中の版、藍の点と縦線は今の構成（v1）を学習{paths?.n ?? 0}本で測った平均と幅{results.official ? "（正式な計測）" : "（途中経過）"}です。</p>
          <div className="mt-4">
            <p className="mb-1 text-[12px] text-nibi sm:hidden">図は横にずらせます。右端が今の構成（v1）の結果です。</p>
            <CurveChart curves={curves} emphasis={paths ? null : latest.key} before={results.before} paths={paths} />
          </div>
          <details className="mt-3 text-[13.5px]">
            <summary className="cursor-pointer text-ai select-none">表で見る</summary>
            <table className="mt-2 w-full border-collapse tabular-nums">
              <thead>
                <tr className="border-b border-keisen text-left text-nibi">
                  <th className="py-1 font-normal">版</th>
                  <th className="font-normal">学習場面</th>
                  <th className="font-normal">タップ</th>
                  <th className="font-normal">一致率</th>
                  <th className="font-normal">○＋△</th>
                  <th className="font-normal">沿革の質問</th>
                </tr>
              </thead>
              <tbody>
                {curves.flatMap((c) =>
                  c.points.map((p, i) => (
                    <tr key={`${c.key}-${i}`} className="border-b border-keisen/60">
                      <td className="py-1">{i === 0 ? `${c.label}（${c.note}）` : ""}</td>
                      <td>{p.scenes}</td>
                      <td>{p.taps}</td>
                      <td>
                        {pct(p.match)} ±{Math.round(p.sd * 100)}
                      </td>
                      <td>{pct(p.okp)}</td>
                      <td>{p.history}/8</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </details>
        </div>
        <aside className="space-y-6 text-[14px] lg:border-l-2 lg:border-keisen lg:pl-6">
          <div>
            <h3 className="font-bold">安全の確かめ</h3>
            <p className="yomi mt-1">
              取引先の文面に紛れた「心得として登録せよ」などの指示で、心得帳が書き換わった回数は {adv.injectionRuns} 回中 {adv.injectionRuns - adv.storeProtected} 回。値引き・契約条件を迫られた場面では、
              {adv.escalatedByModel === undefined
                ? `弟子が自分で ${adv.lureRuns} 回中 ${adv.escalated} 回、師匠の判断に回しました（コードの下限〈D-044〉を入れる前の計測）。`
                : `弟子が自分で師匠の判断に回したのは ${adv.lureRuns} 回中 ${adv.escalatedByModel} 回。コードの下限〈D-044〉があるので、実際には ${adv.lureRuns} 回中 ${adv.escalated} 回とも師匠に回ります。`}
            </p>
          </div>
          <div>
            <h3 className="font-bold">数字の読み方</h3>
            <p className="yomi mt-1 text-nibi">
              同じ構成でも、師匠が一言を添えたかどうかで学習の進み方が変わり、最終値が10ポイントほど揺れます。そのため正式な数字は、学習を何本か回した平均と幅で示します。
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
