import Link from "next/link";
import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import { Nav } from "./nav";
import "./globals.css";

// Japanese fonts: next/font splits the glyphs by unicode-range; only "latin" is preloadable.
const shippori = Shippori_Mincho({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-shippori", preload: false });
const zenkaku = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-zenkaku", preload: false });

export const metadata: Metadata = {
  title: "ココロエ（Kokoroe）",
  description: "商いの心得を継ぐ、AIの弟子 — 架空の「だいだい工房」のデモ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${shippori.variable} ${zenkaku.variable}`}>
      <body className="min-h-dvh">
        {/* Always visible: who drafts and who decides. */}
        <p role="note" className="border-b border-keisen bg-ai-soft px-4 py-1.5 text-center text-[13px] text-sumi">
          案は AI の弟子（橙丸）が作り、判断は師匠が行います。登場する会社・人物はすべて架空です。
        </p>
        <header className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-x-8 gap-y-3 px-5 pt-6 pb-3">
          <Link href="/" className="group">
            <span className="block font-mincho text-[26px] leading-none tracking-[0.08em]">ココロエ</span>
            <span className="mt-1 block text-[12px] text-nibi">株式会社だいだい工房　橙丸の帳面</span>
          </Link>
          <Nav />
        </header>
        <div className="mx-auto max-w-5xl border-t-2 border-sumi/80 px-5" />
        <main className="mx-auto max-w-5xl px-5 pt-6 pb-20">{children}</main>
      </body>
    </html>
  );
}
