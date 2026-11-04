"use client"; // error boundaries must be Client Components (Next.js 16: props are `error` and `retry`)

import Link from "next/link";

/**
 * Something failed while showing a page or running an action. In production the server's message is hidden (only a digest is
 * sent), so this says what the visitor can do, not what broke. Nothing is lost: the session's kokoroe-chō stays on the server.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";
  return (
    <section role="alert" className="max-w-[34em]">
      <h1 className="font-mincho text-[24px] tracking-[0.06em]">うまく処理できませんでした</h1>
      <p className="yomi mt-4 text-[15px]">
        {"いまの操作は記録されていない可能性があります。それまでの判定と心得帳はそのまま残っています。"}
        {"もう一度試すか、うまくいかなければ帳場に戻ってください。"}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button onClick={() => retry()} className="rounded-[3px] bg-ai-fill px-5 py-2.5 text-[15px] text-on-fill hover:opacity-95">
          もう一度試す
        </button>
        <Link className="text-[15px] text-ai underline underline-offset-4" href="/choba">帳場に戻る</Link>
        <Link className="text-[15px] text-ai underline underline-offset-4" href="/">はじめから</Link>
      </div>
      {digest && <p className="mt-6 text-[12.5px] text-nibi">問い合わせ用の番号: {digest}</p>}
    </section>
  );
}
