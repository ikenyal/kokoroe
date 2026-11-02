"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { Verdict } from "@/src/core/types";
import { judge } from "../actions";
import { Mark, VERDICT_WORD } from "../marks";

function Send({ verdict }: { verdict: Verdict | null }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={!verdict || pending}
      className="h-12 rounded-[3px] bg-sumi px-6 text-[15px] text-kami disabled:cursor-not-allowed disabled:opacity-35"
    >
      {pending ? "記録しています" : verdict ? `${verdict} で記録する` : "印を選んでください"}
    </button>
  );
}

export function JudgeForm({ sceneId }: { sceneId: string }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  return (
    <form action={judge} className="mt-8" onSubmit={() => setTimeout(() => setVerdict(null), 0)}>
      <input type="hidden" name="sceneId" value={sceneId} />
      <fieldset>
        <legend className="text-[13px] text-nibi">師匠の判定</legend>
        <div role="radiogroup" className="mt-2 grid grid-cols-3 gap-3 sm:max-w-md">
          {(["○", "△", "×"] as const).map((v) => {
            const on = verdict === v;
            return (
              <label
                key={v}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-[3px] border py-3 transition-colors ${
                  on ? "border-shu bg-shu-soft text-shu" : "border-keisen text-shu/80 hover:border-shu/60"
                }`}
              >
                <input type="radio" name="verdict" value={v} className="sr-only" checked={on} onChange={() => setVerdict(v)} />
                <Mark v={v} size={46} />
                <span className="text-[13px] text-sumi">{VERDICT_WORD[v]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="text-[13px] text-nibi">一言（なくても送れます）</span>
          <input
            name="remark"
            maxLength={120}
            autoComplete="off"
            placeholder="例：浜風さんは決まる前に"
            className="mt-1 block h-12 w-full rounded-[3px] border border-keisen bg-kami px-3 font-mincho text-[16px] placeholder:text-nibi/60 focus:border-ai"
          />
        </label>
        <Send verdict={verdict} />
      </div>
    </form>
  );
}
