"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Verdict } from "@/src/core/types";
import { judge } from "../actions";
import { Mark, VERDICT_WORD } from "../marks";
import { TimedFields } from "./timed";

function Send({ verdict }: { verdict: Verdict | null }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={!verdict || pending}
      className="h-12 rounded-[3px] border border-ai-fill bg-ai-fill px-6 text-[15px] text-on-fill disabled:cursor-not-allowed disabled:border-waku disabled:bg-transparent disabled:text-nibi"
    >
      {pending ? "記録しています" : verdict ? `${verdict} で記録する` : "先に印を選ぶ"}
    </button>
  );
}

/**
 * While the mark is being recorded with live Claude, the next card is drafted before the page comes back (measured 11/5 on the
 * production build: 5–9 s). Say what the wait is, instead of a button that only says 「記録しています」 (体験の目, display only).
 */
function Waiting({ live, sent }: { live: boolean; sent: Verdict | null }) {
  const { pending } = useFormStatus();
  if (!pending || !live) return null;
  return (
    <p role="status" aria-live="polite" className="mt-3 border-l-2 border-ai pl-3 text-[14px] text-sumi">
      {sent ? `${sent} を記録しています。` : "記録しています。"}続けて弟子が、いまの心得帳で次の場面の案を作ります<span className="inline-block">（10秒ほど）</span>。
    </p>
  );
}

const KEYS: Record<string, Verdict> = { "1": "○", "2": "△", "3": "×" };

export function JudgeForm({ sceneId, live = false }: { sceneId: string; live?: boolean }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [sent, setSent] = useState<Verdict | null>(null); // the mark being recorded: the choice is cleared on send, the wait line names it
  const [markedAt, setMarkedAt] = useState<number | null>(null); // first tap on a mark (師匠役テスト: time to judge)
  const pick = (v: Verdict) => {
    setVerdict(v);
    setMarkedAt((t) => t ?? Date.now());
  };
  // Keys 1・2・3 press ○・△・×, except while typing in a field (a remark must never change the mark).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing || el?.closest("input:not([type=radio]), textarea, select, [contenteditable]")) return;
      const v = KEYS[e.key];
      if (v) pick(v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form action={judge} onSubmit={() => {
        setSent(verdict);
        setTimeout(() => {
          setVerdict(null);
          setMarkedAt(null);
        }, 0);
      }}>
      <input type="hidden" name="sceneId" value={sceneId} />
      <TimedFields />
      <input type="hidden" name="markedAt" value={markedAt ?? ""} />
      <fieldset>
        <legend className="sr-only">師匠の判定</legend>
        <div className="flex gap-3">
          {(["○", "△", "×"] as const).map((v, i) => {
            const on = verdict === v;
            return (
              <label
                key={v}
                className={`relative flex w-24 cursor-pointer flex-col items-center gap-0.5 border py-2.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-3 has-[input:focus-visible]:outline-ai sm:w-28 ${
                  on ? "border-shu text-shu shadow-[inset_0_0_0_3px_var(--kami),inset_0_0_0_4.5px_var(--shu)]" : "border-transparent text-sumi/70 hover:border-keisen hover:text-sumi"
                }`}
              >
                <input type="radio" name="verdict" value={v} aria-label={`${v} ${VERDICT_WORD[v]}`} className="sr-only" checked={on} onChange={() => pick(v)} />
                <span aria-hidden className="absolute top-1 left-1.5 hidden text-[12.5px] tabular-nums text-nibi sm:block">{i + 1}</span>
                <Mark v={v} size={48} className={on ? "inkan" : ""} />
                <span aria-hidden className={`text-[13px] ${on ? "text-shu" : "text-sumi"}`}>{VERDICT_WORD[v]}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 hidden text-[12.5px] text-nibi sm:block">キーボードの 1・2・3 でも押せます。</p>
      </fieldset>
      <Waiting live={live} sent={sent} />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="text-[13px] text-nibi">一言（なくても記録できます）</span>
          <input
            name="remark"
            maxLength={120}
            autoComplete="off"
            placeholder="例：結論を先に。資料は一枚にまとめて"
            className="mt-1 block h-12 w-full rounded-[3px] border border-waku bg-kami px-3 font-mincho text-[16px] placeholder:text-nibi focus:border-ai"
          />
        </label>
        <Send verdict={verdict} />
      </div>
    </form>
  );
}
