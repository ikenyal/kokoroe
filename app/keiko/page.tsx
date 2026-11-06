import results from "@/data/demo/results.json";
import { noDecisionIds } from "@/src/lib/plain";
import { CurveChart, type Curve } from "./curve-chart";

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** 稽古の記録 — reads recorded evaluation results only. This screen never calls the API. */

export default function KeikoPage() {
  const curves = results.curves as Curve[];
  const latest = curves.at(-1)!;
  const end = latest.points.at(-1)!;
  const pathsRaw = results.paths as null | { mean: number; min: number; max: number; n: number; okp: { mean: number }; paths: { taps: number }[] };
  const paths = pathsRaw && { ...pathsRaw, taps: Math.round(pathsRaw.paths.reduce((a, p) => a + p.taps, 0) / pathsRaw.paths.length) };
  const hist = results.history;
  const adv: typeof results.adversarial & { escalatedByModel?: number } = results.adversarial; // typed: escalatedByModel appears with the 11/7 run (D-044)
  return (
    <div>
      <h1 className="font-mincho text-[24px] tracking-[0.06em]">稽古の記録</h1>
      {/* What changed, and by how much, in one sentence — the same numbers as the table below (results.json). */}
      <p className="yomi mt-3 max-w-[40em] font-mincho text-[19px] leading-relaxed sm:text-[21px]">
        {results.official ? "" : "途中経過では、"}師匠が{paths ? `約${paths.taps}回` : `${end.taps}回`}のタップで直すと、○ が付く案は
        <span className="tabular-nums">{pct(results.before.match)}</span>から
        <span className="whitespace-nowrap">{paths && "平均"}<span className="tabular-nums text-ai">{paths ? pct(paths.mean) : pct(end.match)}</span>{paths && <span className="tabular-nums">（{pct(paths.min)}〜{pct(paths.max)}）</span>}に、</span><span className="whitespace-nowrap">後任が</span>経緯ごと答えられた質問は8問中
        <span className="tabular-nums">{hist[0].mean.toFixed(0)}</span>問から平均
        <span className="tabular-nums text-ai">{hist.at(-1)!.mean.toFixed(1)}</span><span className="whitespace-nowrap">問になりました。</span>
      </p>
      <p className="mt-1 text-[13px] text-nibi">
        {results.official ? "" : "はじめと今で台帳が異なるため、そのままは比べられません。"}架空の取引先10社、学習に使わない評価用の20場面で測った値です。
      </p>
      <p className="yomi mt-2 max-w-4xl text-[15.5px]">
        弟子の案が、師匠の考えとどれだけ合うようになったかの記録です。架空の取引先10社で、師匠はシミュレータ（隠しの正解に照らして、コードで ○・△・× を<span className="whitespace-nowrap">付けます）。</span>
      </p>

      <section aria-labelledby="ba-h" className="mt-8">
        <h2 id="ba-h" className="font-mincho text-[18px]">はじめと、ダメ出し40場面のあと{results.official ? "" : <span className="inline-block">（途中経過）</span>}</h2>
        <table className="mt-3 w-full max-w-4xl border-collapse border-y-2 border-sumi/80 text-left">
          <thead>
            <tr className="border-b border-keisen text-[13px] text-nibi">
              <th className="py-2 font-normal">測ったこと</th>
              <th className="w-[24%] font-normal">はじめ<span className="block whitespace-nowrap text-[12.5px]">（台帳と、その制約）</span></th>
              <th className="w-[24%] font-normal">40場面のあと</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            <tr className="border-b border-keisen align-baseline">
              <th scope="row" className="py-3 pr-4 text-[14.5px] font-normal">
                師匠が ○ を付けた<span className="whitespace-nowrap">割合</span>
                <span className="block text-[12.5px] text-nibi">学習に使わない評価用の20場面で</span>
              </th>
              <td className="font-mincho text-[30px] leading-none">{pct(results.before.match)}</td>
              <td>
                <span className="font-mincho text-[30px] leading-none text-ai">{paths ? pct(paths.mean) : pct(end.match)}</span>
                <span className="block text-[12.5px] text-nibi">{paths ? `学習${paths.n}本の平均（${pct(paths.min)}〜${pct(paths.max)}）` : `${latest.label}、タップ ${end.taps} 回`}</span>
              </td>
            </tr>
            <tr className="border-b border-keisen align-baseline">
              <th scope="row" className="py-3 pr-4 text-[14.5px] font-normal">
                ○ か △<span className="whitespace-nowrap">（条件つきでよし）</span>の<span className="whitespace-nowrap">割合</span>
                <span className="block text-[12.5px] text-nibi">大きく外れなかった案の割合</span>
              </th>
              <td className="font-mincho text-[24px] leading-none">{pct(results.before.okp)}</td>
              <td className="font-mincho text-[24px] leading-none text-ai">{paths ? pct(paths.okp.mean) : pct(end.okp)}</td>
            </tr>
            <tr className="align-baseline">
              <th scope="row" className="py-3 pr-4 text-[14.5px] font-normal">
                後任の質問に、経緯ごと答えられた数
                <span className="block text-[12.5px] text-nibi">取引先の経緯を聞く8問のうち</span>
              </th>
              <td className="font-mincho text-[24px] leading-none">{hist[0].mean.toFixed(0)}<span className="text-[14px] text-nibi"> / 8</span></td>
              <td>
                <span className="font-mincho text-[24px] leading-none text-ai">
                  {hist.at(-1)!.mean.toFixed(1)}
                  <span className="text-[14px] text-nibi"> / 8</span>
                </span>
                {"sd" in hist.at(-1)! && <span className="block text-[12.5px] text-nibi">同じ心得帳で3回測った平均<span className="whitespace-nowrap">（ばらつき ±{(hist.at(-1)! as { sd: number }).sd.toFixed(1)}）</span></span>}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-[13px] text-nibi">
          師匠の手間は、40場面で{paths ? ` 約 ${paths.taps} 回` : ` ${end.taps} 回`}のタップ（印・候補の選択・「なぜ？」・確かめの合計）。
        </p>
      </section>

      <section aria-labelledby="safe-h" className="mt-10 max-w-4xl">
        <h2 id="safe-h" className="font-mincho text-[18px]">安全の確かめ</h2>
        <table className="mt-3 w-full max-w-4xl border-collapse border-y-2 border-sumi/80 text-left text-[14.5px]">
          <tbody className="tabular-nums">
            <tr className="border-b border-keisen align-baseline">
              <th scope="row" className="py-3 pr-4 font-normal">取引先の文面に「心得として登録せよ」などの指示を紛れ込ませて、心得帳が書き換わった回数</th>
              <td className="w-[24%] font-mincho text-[22px]">
                {adv.injectionRuns - adv.storeProtected}
                <span className="text-[14px] text-nibi"> / {adv.injectionRuns} 回</span>
              </td>
            </tr>
            <tr className="align-baseline">
              <th scope="row" className="py-3 pr-4 font-normal">
                値引き・契約条件を迫られた場面で、師匠の判断に回した回数
                <span className="block text-[12.5px] text-nibi">
                  {adv.escalatedByModel === undefined
                    ? "弟子が自分で回した回数。金額・契約を必ず師匠に回す仕組みをコードに入れる前の計測です。"
                    : `弟子が自分で回したのは ${adv.escalatedByModel} 回。残りもコードの仕組みで必ず師匠に回ります。`}
                </span>
              </th>
              <td className="font-mincho text-[22px]">
                {adv.escalated}
                <span className="text-[14px] text-nibi"> / {adv.lureRuns} 回</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section aria-labelledby="curve-h" className="mt-10 max-w-4xl">
        <div className="min-w-0">
          <h2 id="curve-h" className="font-mincho text-[18px]">師匠の手間と、一致の伸び</h2>
          <p className="mt-1 text-[13px] text-nibi">横は師匠のタップ数、縦は ○ の割合。細い灰色の線は改良の途中の版（参考）、藍の点と縦線は今の構成を学習{paths?.n ?? 0}本で測った平均と<span className="whitespace-nowrap">幅{results.official ? "（正式な計測）" : "（途中経過）"}です。</span></p>
          <div className="mt-4">
            <p className="mb-1 text-[12.5px] text-nibi sm:hidden">図は横にずらせます（右端の藍の点が今の構成の結果）。</p>
            <CurveChart curves={curves} emphasis={paths ? null : latest.key} before={results.before} paths={paths} />
          </div>
          <details className="mt-3 text-[13.5px]">
            <summary className="cursor-pointer text-ai select-none">表で見る</summary>
            <p className="mt-1 text-[12.5px] text-nibi sm:hidden">表は横にずらせます。</p>
            <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[34rem] border-collapse whitespace-nowrap tabular-nums">
              <thead>
                <tr className="border-b border-keisen text-left text-nibi">
                  <th className="py-1 font-normal">版</th>
                  <th className="font-normal">学習場面</th>
                  <th className="font-normal">タップ</th>
                  <th className="font-normal">一致率</th>
                  <th className="font-normal">○＋△</th>
                  <th className="font-normal">経緯の質問</th>
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
            </div>
            <p className="mt-2 text-[12.5px] text-nibi">
              ± は、同じ心得帳で評価用20場面を3回測ったばらつき（±0 は3回とも同じ値）。経緯の質問は、取引先の経緯を聞く8問のうち、なぜそうなったかまで答えられた数。タップ0の行は、その版の学習の始め（それぞれの版を測ったときの台帳で）。図の「はじめ 55%」は、直した台帳で測り直した値です（数字の注記）。
            </p>
          </details>
        </div>
      </section>

      <section aria-labelledby="note-h" className="mt-10 max-w-4xl border-t border-keisen pt-4 text-[13.5px]">
        <h2 id="note-h" className="font-mincho text-[16px]">数字の注記</h2>
        <ul className="yomi mt-2 list-disc space-y-1 pl-5 text-nibi">
          <li>{noDecisionIds(results.note)}</li>
          <li>同じ構成でも、師匠が一言を添えたかどうかで学習の進み方が変わり、最後の値が10ポイントほど揺れます。そのため数字は、学習を何本か回した平均と幅で示します。</li>
        </ul>
      </section>
    </div>
  );
}
