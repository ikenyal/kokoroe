import { isJudgeRequest, judgeEnabled } from "@/src/server/judge";
import { LIMIT_MESSAGE, type LimitReason } from "@/src/server/limits";

/**
 * Shown when a live call was refused by the public-demo limits (D-032). When the visitors' budget is used up and the judge code
 * is set on this deployment, a judge who has not entered it yet is told where it goes (通しの目 16: a judge arriving after the
 * visitors' budget ran out would otherwise only read 「本日のお試し上限」).
 */
export async function LimitNote({ reason }: { reason?: LimitReason }) {
  if (!reason) return null;
  const judgeHint = reason !== "ip" && judgeEnabled() && !(await isJudgeRequest());
  return (
    <p role="status" className="mb-5 border-l-4 border-ai bg-ai-soft px-4 py-2 text-[14px]">
      {LIMIT_MESSAGE[reason]}
      {judgeHint && <> 審査員の方は、最初の画面のいちばん下の「審査用のコード」に提出フォームのコードを入れると、別の枠でライブを試せます。</>}
    </p>
  );
}
