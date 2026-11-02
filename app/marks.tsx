/**
 * The master's marks, drawn like a red-pen stroke (朱筆) rather than typed characters.
 * All three share one color — like a teacher's marks on paper, the shape carries the meaning.
 */
import type { Verdict } from "@/src/core/types";

export function Mark({ v, size = 44, className = "" }: { v: Verdict; size?: number; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className}>
      {v === "○" && <path {...common} strokeWidth={4.2} d="M30.5 8.6C20 5.6 8.8 12.5 8.4 24.2c-.3 9.6 7.4 15.8 16.1 15.6 9.4-.2 15.6-7.6 15.1-16.3-.3-5.4-3.4-9.6-7.6-12.4" />}
      {v === "△" && <path {...common} strokeWidth={4} d="M24.4 8.8 8.6 38.6c9.8-.6 20.6-.7 31 .1L25.6 10.4" />}
      {v === "×" && (
        <>
          <path {...common} strokeWidth={4.4} d="M11 10.5c8.6 8.3 17.8 18 26.4 27.6" />
          <path {...common} strokeWidth={4} d="M37.2 11.2C28 18.5 19.4 27.6 11.6 37.4" />
        </>
      )}
    </svg>
  );
}

export const VERDICT_WORD: Record<Verdict, string> = { "○": "よい", "△": "条件つき", "×": "ちがう" };
