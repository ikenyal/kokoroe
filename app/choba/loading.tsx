/** 帳場 while the server prepares the page: on a live server the apprentice may be drafting the card (体験の目 20, 11/7: 「デモの続き」 took
 * 10.7 s to the first card live, お試し about 5 s), so say what is happening and roughly how long, not just 「帳面を開いています」. */
export default function Loading() {
  return (
    <p role="status" className="text-[14px] text-nibi">
      帳場を開いています…<span className="block">弟子が案を作っているときは、10秒ほどかかることがあります。</span>
    </p>
  );
}
