"use client";

import { useState } from "react";

export interface CurvePoint {
  scenes: number;
  taps: number;
  match: number;
  sd: number;
  okp: number;
  history: number;
}
export interface Curve {
  key: string;
  label: string;
  note: string;
  points: CurvePoint[];
}

const W = 720;
const H = 360;
const M = { top: 20, right: 92, bottom: 44, left: 48 };
const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * Learning curve: x = the master's taps (how much work it took), y = held-out match (○ rate), honest 0–100% axis.
 * One emphasized series (the current setup, indigo); earlier setups thin and grey, labelled at their ends.
 * The Before (v0) is a band (mean ± sd). Hover shows every series at the nearest checkpoint.
 */
export interface PathsResult {
  mean: number;
  min: number;
  max: number;
  n: number;
  taps: number; // mean master taps of the paths
}

export function CurveChart({
  curves,
  emphasis,
  before,
  paths,
}: {
  curves: Curve[];
  emphasis: string | null; // null = all curves are context (grey)
  before: { match: number; sd: number };
  paths?: PathsResult | null; // current setup, end points of several training paths (mean + range)
}) {
  const [hover, setHover] = useState<number | null>(null); // checkpoint index
  const maxTaps = Math.max(...curves.flatMap((c) => c.points.map((p) => p.taps)), paths?.taps ?? 0);
  const xMax = Math.ceil(maxTaps / 20) * 20;
  const x = (t: number) => M.left + (t / xMax) * (W - M.left - M.right);
  const y = (v: number) => M.top + (1 - v) * (H - M.top - M.bottom);
  const ordered = [...curves.filter((c) => c.key !== emphasis), ...curves.filter((c) => c.key === emphasis)];
  const nCheckpoints = curves[0].points.length;

  return (
    // On a phone the 720-wide chart would shrink its labels to ~6px: keep a readable minimum width and let it scroll sideways.
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="学習曲線（横にスクロールできます）">
    <figure className="relative min-w-[560px]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="学習曲線：師匠のタップ数に対する、評価用20場面の一致率"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const tx = ((e.clientX - r.left) / r.width) * W;
          const em = curves.find((c) => c.key === emphasis) ?? curves.at(-1)!;
          let best = 0;
          em.points.forEach((p, i) => {
            if (Math.abs(x(p.taps) - tx) < Math.abs(x(em.points[best].taps) - tx)) best = i;
          });
          setHover(best);
        }}
      >
        {/* grid & axes — recessive */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className="stroke-keisen" strokeWidth={1} />
            <text x={M.left - 8} y={y(v) + 4} textAnchor="end" className="fill-nibi text-[11px]">{pct(v)}</text>
          </g>
        ))}
        {Array.from({ length: xMax / 20 + 1 }, (_, i) => i * 20).map((t) => (
          <text key={t} x={x(t)} y={H - M.bottom + 18} textAnchor="middle" className="fill-nibi text-[11px]">{t}</text>
        ))}
        <text x={(M.left + W - M.right) / 2} y={H - 6} textAnchor="middle" className="fill-nibi text-[12px]">師匠のタップ数（判定・候補の選択・「なぜ？」・確認の合計）</text>

        {/* Before band */}
        <rect x={M.left} width={W - M.left - M.right} y={y(before.match + before.sd)} height={y(before.match - before.sd) - y(before.match + before.sd)} className="fill-kami-2" />
        <line x1={M.left} x2={W - M.right} y1={y(before.match)} y2={y(before.match)} className="stroke-nibi" strokeDasharray="4 4" strokeWidth={1} />
        <text x={W - M.right + 6} y={y(before.match) + 4} className="fill-nibi text-[11px]">Before {pct(before.match)}</text>

        {ordered.map((c) => {
          const em = c.key === emphasis;
          const d = c.points.map((p, i) => `${i ? "L" : "M"}${x(p.taps)},${y(p.match)}`).join("");
          const last = c.points.at(-1)!;
          return (
            <g key={c.key}>
              <path d={d} fill="none" strokeWidth={em ? 2.5 : 1.5} strokeLinejoin="round" strokeLinecap="round" className={em ? "stroke-ai" : "stroke-nibi/55"} />
              {c.points.map((p, i) => (
                <circle key={i} cx={x(p.taps)} cy={y(p.match)} r={em ? 4.5 : 3} strokeWidth={2} className={em ? "fill-ai stroke-kami" : "fill-nibi/60 stroke-kami"} />
              ))}
              {/* End labels only when there is no multi-path result to show: otherwise they pile up at the right end
                  (the table below names every curve). */}
              {!paths && (
                <text x={x(last.taps) + 8} y={y(last.match) + 4} className={`text-[11.5px] ${em ? "fill-sumi font-bold" : "fill-nibi"}`}>
                  {c.label} {pct(last.match)}
                </text>
              )}
            </g>
          );
        })}

        {paths && (
          <g>
            {/* current setup: several training paths — mean dot and min–max bar */}
            <line x1={x(paths.taps)} x2={x(paths.taps)} y1={y(paths.max)} y2={y(paths.min)} className="stroke-ai" strokeWidth={3} strokeLinecap="round" />
            <circle cx={x(paths.taps)} cy={y(paths.mean)} r={6} strokeWidth={2} className="fill-ai stroke-kami" />
            <text x={x(paths.taps) - 12} y={y(paths.max) - 10} textAnchor="end" className="fill-sumi text-[11.5px] font-bold">
              今の構成 {pct(paths.mean)}
            </text>
            <text x={x(paths.taps) - 12} y={y(paths.max) + 5} textAnchor="end" className="fill-nibi text-[10.5px]">
              学習{paths.n}本 {pct(paths.min)}〜{pct(paths.max)}
            </text>
          </g>
        )}

        {hover !== null && (
          <line
            x1={x((curves.find((c) => c.key === emphasis) ?? curves.at(-1)!).points[hover].taps)}
            x2={x((curves.find((c) => c.key === emphasis) ?? curves.at(-1)!).points[hover].taps)}
            y1={M.top}
            y2={H - M.bottom}
            className="stroke-sumi/40"
            strokeWidth={1}
          />
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-2 left-14 rounded-[3px] border border-keisen bg-kami px-3 py-2 text-[12.5px] shadow-sm">
          <p className="text-nibi">学習 {curves[0].points[hover]?.scenes ?? 0} 場面の時点</p>
          {ordered
            .slice()
            .reverse()
            .map((c) => {
              const p = c.points[hover];
              if (!p) return null;
              return (
                <p key={c.key} className={c.key === emphasis ? "font-bold" : ""}>
                  {c.label}　{pct(p.match)} ±{Math.round(p.sd * 100)}　タップ {p.taps}
                </p>
              );
            })}
        </div>
      )}
      <figcaption className="sr-only">{nCheckpoints} つの時点で、評価用20場面を3回ずつ測った平均。</figcaption>
    </figure>
    </div>
  );
}
