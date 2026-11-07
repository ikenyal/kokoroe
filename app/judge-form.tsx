"use client";

import { useActionState, useState } from "react";
import { enterJudgeCode } from "./actions";

const SAID: Record<string, string> = {
  ng: "コードが違います。提出フォームの、審査員だけが見る欄にあります。",
  limit: "試せる回数を超えました。しばらくしてから試してください。",
};

/**
 * 審査用のコード (Kento 11/6): a closed disclosure at the bottom of the home page, styled like 「データの扱い」 so ordinary visitors
 * are not drawn to an empty box (ui-critic 11/6). What the code does is said before the input; once accepted, one line.
 */
export function JudgeCodeForm({ already }: { already: boolean }) {
  const [state, action, pending] = useActionState(enterJudgeCode, already ? "ok" : "");
  const [code, setCode] = useState(""); // kept after a wrong try, so the judge can check what was typed
  return (
    <details className="mt-6 text-[14px]" open={already || undefined}>
      <summary className="cursor-pointer text-ai select-none">審査用のコード</summary>
      {state === "ok" ? (
        <p role="status" className="yomi mt-3">確認しました。このブラウザでは、審査員用の上限で AI が案を作ります。画面と動きは同じです。上の「師匠になって試す」から始めてください。</p>
      ) : (
        <div className="mt-3">
          <p className="yomi text-nibi">審査員の方へ。提出フォームに記したコードを入れると、このブラウザでは、AI がその場で案を作るときの1日の上限が審査員用になり、来場者が多い日でも続けて試せます。画面と動きとデータは変わらず、別の環境に切り替わるのでもありません。付けた印や育った心得帳はブラウザごとに分かれ、ほかの人と混ざりません。コードがなくても、記録済みのデータですべての画面を見られます。</p>
          <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
            <input name="code" type="password" autoComplete="off" maxLength={200} aria-label="審査用のコード" value={code} onChange={(e) => setCode(e.target.value)} className="h-11 w-56 rounded-[3px] border border-waku bg-kami px-2 text-[14px] text-sumi" />
            <button disabled={pending} className="h-11 rounded-[3px] border border-ai px-4 text-ai disabled:opacity-60">確かめる</button>
          </form>
          {state && SAID[state] && <p role="alert" className="mt-2 font-medium text-sumi">{SAID[state]}</p>}
        </div>
      )}
    </details>
  );
}
