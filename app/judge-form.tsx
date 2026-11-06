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
        <p role="status" className="yomi mt-3">確認しました。このブラウザでは、ライブ（Claude が案を作り、直しを読み取り、後任に答える）を審査用の枠で動かせます。上の「師匠になって試す」から始めてください。</p>
      ) : (
        <div className="mt-3">
          <p className="yomi text-nibi">審査員の方へ: 提出フォームでお渡ししたコードを入れると、ライブ（Claude が案を作り、直しを読み取り、後任に答える）を、ほかの来場者とは別の枠で動かせます。コードがなくても、記録済みのデータですべての画面を見られます。</p>
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
