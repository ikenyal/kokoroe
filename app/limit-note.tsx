import { LIMIT_MESSAGE, type LimitReason } from "@/src/server/limits";

/** Shown when a live call was refused by the public-demo limits (D-032). */
export function LimitNote({ reason }: { reason?: LimitReason }) {
  if (!reason) return null;
  return (
    <p role="status" className="mb-5 border-l-4 border-ai bg-ai-soft px-4 py-2 text-[14px]">
      {LIMIT_MESSAGE[reason]}
    </p>
  );
}
