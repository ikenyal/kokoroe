"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/choba", label: "帳場", hint: "師匠の判定" },
  { href: "/kokoroe", label: "心得帳", hint: "覚えた作法と沿革" },
  { href: "/noren", label: "暖簾を継ぐ", hint: "後任の相談" },
  { href: "/keiko", label: "稽古の記録", hint: "評価の数字" },
];

export function Nav({ own = false }: { own?: boolean }) {
  const path = usePathname();
  // Own mode: the evaluation numbers are about the fictional company, so that tab is not shown; the setup page is.
  const items = own ? [{ href: "/own", label: "台帳", hint: "自分の会社の台帳とデータの扱い" }, ...ITEMS.filter((x) => x.href !== "/keiko")] : ITEMS;
  return (
    <nav aria-label="画面" className="-mx-1 flex max-w-full gap-0.5 overflow-x-auto">
      {items.map((it) => {
        const active = path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            title={it.hint}
            aria-current={active ? "page" : undefined}
            // A noren hangs from the top: the active tab is a cloth of indigo, the others are just text.
            className={`shrink-0 rounded-b-[3px] px-3 pt-2 pb-2.5 text-[15px] tracking-[0.04em] whitespace-nowrap transition-colors sm:px-3.5 ${
              active ? "bg-ai text-kami" : "text-sumi hover:bg-kami-2"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
