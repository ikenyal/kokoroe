import Link from "next/link";
import { redirect } from "next/navigation";
import { getClient, TRAIN_SCENES } from "@/src/core/world";
import { SCENE_TYPE_LABELS } from "@/src/core/types";
import { FIELD_WRITES } from "@/src/server/field";
import { getSession } from "@/src/server/session";
import { ownStartCompare, submitWrite } from "../../actions";
import { TimedFields } from "../timed";

const box = "yomi mt-4 block w-full rounded-[3px] border border-waku bg-kami p-3 text-[16px] placeholder:text-nibi";
const placeholder = "誰に・何で・いつ・どう伝えるか。なぜそうするのかも。";

/**
 * Write the same etiquette as prose — timed, to compare with judging (t_write vs t_judge).
 * 師匠役テスト: 5 fixed fictional scenes. Own mode (D-060): the situations the master wrote, prose BEFORE the AI drafts them.
 */
export default async function WritePage() {
  const s = await getSession();
  if (!s || (s.mode !== "field" && s.mode !== "own")) redirect("/");
  const done = new Map((s.meta.writes ?? []).map((w) => [w.sceneId, w]));

  if (s.mode === "own") {
    // Situations added after the comparison started, not judged, not drafted, not written yet (the same rule as submitWrite).
    const from = Math.max(s.meta.pos, s.meta.compare?.fromIndex ?? Infinity);
    const open = s.meta.queue.filter((q, i) => i >= from && !q.live && !done.has(q.scene.id));
    return (
      <div className="max-w-3xl">
        <h1 className="font-mincho text-[24px] tracking-[0.06em]">作法を文章で書く（比較テスト）</h1>
        <p className="yomi mt-2 text-[15.5px]">
          自分で書いた場面について、後任に引き継ぐつもりで作法を文章にしてください。書き始めてから「記録する」までの時間を測ります。
          弟子の案は、書き終わった場面から作ります（先に案を見ないため）。
        </p>
        {!s.meta.compare ? (
          <form action={ownStartCompare} className="mt-6">
            <p className="text-[14px] text-nibi">始めると、文章を書いていない場面は、帳場で案を作らずに待たせます。手順は docs/own-company-test.md にあります。</p>
            <button className="mt-3 h-12 rounded-[3px] bg-sumi px-6 text-[15px] text-kami">比較テストを始める</button>
          </form>
        ) : open.length ? (
          <form key={done.size} action={submitWrite} className="mt-8">
            <TimedFields />
            <fieldset>
              <legend className="text-[13px] text-nibi">どの場面について書きますか（{done.size} 件 書きました）</legend>
              <div className="mt-2 space-y-2">
                {open.map((q, i) => (
                  <label key={q.scene.id} className="flex gap-3 rounded-[3px] border border-keisen px-3 py-2 has-[:checked]:border-ai has-[:checked]:bg-ai-soft">
                    <input type="radio" name="sceneId" value={q.scene.id} defaultChecked={i === 0} required className="mt-1.5" />
                    <span>
                      <span className="block text-[13px] text-nibi">{getClient(q.scene.clientId).name}・{SCENE_TYPE_LABELS[q.scene.type]}・{q.scene.month}月</span>
                      <span className="yomi block text-[15.5px]">{q.scene.situation}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <textarea name="text" aria-label="作法を文章で" required rows={8} maxLength={2000} className={box} placeholder={placeholder} />
            <button className="mt-3 h-12 rounded-[3px] bg-sumi px-6 text-[15px] text-kami">記録する</button>
          </form>
        ) : (
          <p className="yomi mt-8">
            書いていない場面はありません。{done.size ? <>帳場で<Link className="text-ai underline" href="/choba">判定</Link>し、終わったら<Link className="text-ai underline" href="/choba/report">まとめと数える一覧</Link>へ。</> : <>先に<Link className="text-ai underline" href="/choba">帳場</Link>で場面を書いてください。</>}
          </p>
        )}
      </div>
    );
  }

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
          <h2 id="write-q" className="yomi mt-1 text-[19px]">{next.prompt}</h2>
          <textarea name="text" aria-labelledby="write-q" required rows={8} maxLength={2000} className={box} placeholder={placeholder} />
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
