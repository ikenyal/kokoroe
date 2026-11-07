import { isJudgeRequest, judgeEnabled } from "@/src/server/judge";
import { LIMIT_MESSAGE, type LimitReason } from "@/src/server/limits";

/** A judge's session draws on the judges' own daily budget (D-067), so 「来場者全体で共通」 would be wrong for them. */
const JUDGE_DAILY = "本日の審査用の上限に達しました。ここからは記録済みのデータで動きます。日本時間の0時にまた試せます。心得帳・稽古の記録は、そのまま見られます。";

/**
 * Shown when a live call was refused by the public-demo limits (D-032). When the visitors' budget is used up and the judge code
 * is set on this deployment, a judge who has not entered it yet is told where it goes (通しの目 16: a judge arriving after the
 * visitors' budget ran out would otherwise only read 「本日のお試し上限」).
 */
export async function LimitNote({ reason }: { reason?: LimitReason }) {
  if (!reason) return null;
  const judge = judgeEnabled() && (await isJudgeRequest());
  const judgeHint = reason !== "ip" && judgeEnabled() && !judge;
  return (
    <p role="status" className="mb-5 border-l-4 border-ai bg-ai-soft px-4 py-2 text-[14px]">
      {judge && reason === "daily" ? JUDGE_DAILY : LIMIT_MESSAGE[reason]}
      {judgeHint && <span className="mt-1 block">審査員の方へ: 左上の「ココロエ」から最初の画面に戻り、いちばん下の「審査用のコード」に、提出フォームに記したコードを入れると、審査員用の上限で、このまま続けて試せます。</span>}
    </p>
  );
}
