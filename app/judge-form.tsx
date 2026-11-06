"use client";

import { useActionState } from "react";
import { enterJudgeCode } from "./actions";

const SAID: Record<string, string> = {
  ok: "審査用のコードを確認しました。ライブは審査用の上限で動きます。",
  ng: "コードが違います。",
  limit: "試せる回数を超えました。しばらくしてから試してください。",
  off: "",
};

/** 審査用のコード (Kento 11/6): a quiet field at the bottom of the home page, for judges only. */
export function JudgeCodeForm({ already }: { already: boolean }) {
  const [state, action, pending] = useActionState(enterJudgeCode, already ? "ok" : "");
  return (
    <details className="mt-3 text-[13px] text-nibi" open={already || undefined}>
      <summary className="inline-flex min-h-11 cursor-pointer items-center select-none">審査用のコード</summary>
      {state === "ok" ? (
        <p role="status" className="mb-2">{SAID.ok}</p>
      ) : (
        <form action={action} className="mb-2 flex flex-wrap items-center gap-2">
          <input name="code" type="password" autoComplete="off" maxLength={200} aria-label="審査用のコード" className="h-10 w-56 rounded-[3px] border border-waku bg-kami px-2 text-[14px] text-sumi" />
          <button disabled={pending} className="h-10 rounded-[3px] border border-ai px-4 text-ai hover:bg-ai-soft disabled:opacity-60">確かめる</button>
          {state && SAID[state] && <span role="status">{SAID[state]}</span>}
        </form>
      )}
      <p className="mb-2">提出フォームで審査員の方にお渡ししたコードです。なくても、記録済みのデータですべての画面を見られます。</p>
    </details>
  );
}
