/** 心得帳を後任に渡す: download this session's kokoroe-chō as an Agent Skill (zip). Read-only. */
import { CLIENTS, COMPANY } from "@/src/core/world";
import { exportSkill, zip } from "@/src/learning/export";
import { getSession } from "@/src/server/session";

export async function GET() {
  const s = await getSession();
  if (!s) return new Response("セッションがありません。最初の画面から始めてください。", { status: 401 });
  const skill = exportSkill(await s.store.listRules(), CLIENTS, COMPANY);
  const body = zip(skill.files, skill.name);
  return new Response(body.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${skill.name}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
