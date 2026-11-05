"use client";

import { useFormStatus } from "react-dom";

/**
 * 尋ねる, and what the wait is while the live answer is made (体験の目 4, 11/5: 6.4 s on the production build with nothing on
 * screen changing, so a first-time visitor may press again). Display only: the answer itself is unchanged.
 */
export function AskButton({ live }: { live: boolean }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button disabled={pending} className="h-12 rounded-[3px] bg-ai-fill px-5 text-[15px] text-on-fill disabled:cursor-wait disabled:opacity-70">
        {pending ? "尋ねています" : "尋ねる"}
      </button>
      {pending && live && (
        <p role="status" aria-live="polite" className="border-l-2 border-ai pl-3 text-[14px] text-sumi sm:col-span-3">
          橙丸が心得帳から根拠の心得と沿革を探して、答えを書いています<span className="inline-block">（数秒）</span>。
        </p>
      )}
    </>
  );
}
