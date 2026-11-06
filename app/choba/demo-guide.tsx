"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const KEY = "kokoroe-demo-guide-closed";
const CHANGED = "kokoroe-demo-guide";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGED, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGED, cb);
  };
};

/**
 * デモの続き: a quiet signpost for a first-time visitor — the five steps in which the value shows, in order. Closable; it stays
 * closed on this browser (localStorage). The server renders it open; the browser then reads localStorage.
 */
export function DemoGuide({ live }: { live: boolean }) {
  const closed = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY) === "1", () => false);
  if (closed) return null;
  const steps: React.ReactNode[] = [
    "案を読む",
    "違えば △・× で直す（一言は任意）",
    "次の案に「変化」が出る",
    <>
      <Link href="/kokoroe" className="text-ai underline-offset-4 hover:underline">心得帳</Link>に経緯ごと残る
    </>,
    <>
      <Link href="/noren" className="text-ai underline-offset-4 hover:underline">暖簾を継ぐ</Link>で後任が理由つきで答える
    </>,
  ];
  return (
    <nav aria-label="デモの見方" className="mt-3 border-y border-keisen py-2.5">
      <div className="flex items-start justify-between gap-4">
        <ol className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-[14.5px] text-sumi">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-1.5 whitespace-nowrap">
              <span className="font-mincho text-ai">{"一二三四五"[i]}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            window.dispatchEvent(new Event(CHANGED));
          }}
          className="-mt-1 inline-flex min-h-11 shrink-0 items-center px-1 text-[13px] text-nibi underline-offset-4 hover:underline"
        >
          案内を閉じる
        </button>
      </div>
      {!live && <p className="mt-1 text-[12.5px] text-nibi">このデモは記録済みのデータで動きます。「変化」は、記録した稽古で師匠が直したあとの案です。</p>}
    </nav>
  );
}
