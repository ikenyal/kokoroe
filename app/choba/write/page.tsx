import Link from "next/link";
import { redirect } from "next/navigation";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import { FIELD_WRITES } from "@/src/server/field";
import { getSession } from "@/src/server/session";
import { submitWrite } from "../../actions";
import { TimedFields } from "../timed";

/** 実地テスト, part 2: write the same etiquette as prose — timed, to compare with judging (t_write vs t_judge). */
export default async function WritePage() {
  const s = await getSession();
  if (!s || s.mode !== "field") redirect("/");
  const done = new Map((s.meta.writes ?? []).map((w) => [w.sceneId, w]));
  const next = FIELD_WRITES.find((w) => !done.has(w.sceneId));
  return (
    <div className="max-w-3xl">
      <h1 className="font-mincho text-[24px] tracking-[0.06em]">同じ作法を文章で書く</h1>
      <p className="yomi mt-2 text-[15.5px]">
        さきほど判定した場面のうち5つについて、後任に引き継ぐつもりで作法を文章にしてください。書き始めてから「記録する」までの時間を測ります（{done.size} / {FIELD_WRITES.length}）。
      </p>
      {next ? (
        <form key={next.sceneId} action={submitWrite} className="mt-8">
          <input type="hidden" name="sceneId" value={next.sceneId} />
          <TimedFields />
          <p className="text-[13px] text-nibi">{getClient(TRAIN_SCENES.find((t) => t.id === next.sceneId)!.clientId).name}</p>
          <h2 className="yomi mt-1 text-[19px]">{next.prompt}</h2>
          <textarea
            name="text"
            required
            rows={8}
            maxLength={2000}
            className="yomi mt-4 block w-full rounded-[3px] border border-keisen bg-kami p-3 text-[16px]"
            placeholder="誰に・何で・いつ・どう伝えるか。なぜそうするのかも。"
          />
          <button className="mt-3 h-12 rounded-[3px] bg-sumi px-6 text-[15px] text-kami">記録する</button>
        </form>
      ) : (
        <p className="yomi mt-8">
          5つすべて記録しました。<Link className="text-ai underline" href="/choba/report">所要時間のまとめ</Link>へ。
        </p>
      )}
    </div>
  );
}
