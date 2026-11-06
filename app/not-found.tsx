import Link from "next/link";

/** Unknown address (and notFound()): in the app's own words and look, not the framework's English default. */
export default function NotFound() {
  return (
    <section className="max-w-[34em]">
      <h1 className="font-mincho text-[24px] tracking-[0.06em]"><span className="inline-block">その頁は、</span><span className="inline-block">この帳面にありません</span></h1>
      <p className="yomi mt-4 text-[15px]">
        アドレスが違うか、なくなった頁です。上の見出しから選んでください。
      </p>
      <p className="mt-5">
        <Link className="inline-flex min-h-11 items-center text-[15px] text-ai underline underline-offset-4" href="/">最初の画面に戻る</Link>
      </p>
    </section>
  );
}
