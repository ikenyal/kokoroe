/**
 * 心得帳 → Agent Skill (暖簾を継ぐ). Progressive disclosure:
 *   SKILL.md          — name/description (always loaded), the index and the company-wide kokoroe (loaded when triggered)
 *   clients/<slug>.md — one client's kokoroe with sources and 沿革 (loaded only when that client comes up)
 * Skill name rules: lowercase letters, digits, hyphens; ≤ 64 chars; must not contain "anthropic" or "claude".
 */
import type { Client } from "@/src/core/types";
import { SCENE_TYPE_LABELS } from "@/src/core/types";
import type { KokoroeRule, RuleSource } from "./types";

export const SKILL_NAME = "kokoroe-daidai-kobo";

export function assertSkillName(name: string): void {
  if (!/^[a-z0-9-]{1,64}$/.test(name) || /anthropic|claude/.test(name)) throw new Error(`invalid skill name: ${name}`);
}

const src = (s: RuleSource) =>
  s.kind === "ledger" ? `${s.date} 取引先台帳` : `${s.date} 師匠の判定 ${s.verdict}「${s.remark || "一言なし"}」（${s.sceneId}）`;

function ruleBlock(r: KokoroeRule): string {
  const origin = r.sources.some((s) => s.kind === "ledger") ? (r.sources.some((s) => s.kind !== "ledger") ? "台帳＋師匠" : "台帳") : "師匠";
  const lines = [`### ${r.id} ${r.text}`];
  if (r.when) lines.push(`- 条件: ${r.when}`);
  if (r.scope.sceneTypes) lines.push(`- 場面: ${r.scope.sceneTypes.map((t) => SCENE_TYPE_LABELS[t]).join("・")}`);
  lines.push(`- 出どころ: ${origin}`);
  const why = r.history.map((h) => h.trigger).filter(Boolean).at(-1);
  if (why) lines.push(`- わけ: ${why}`);
  lines.push("- 沿革:");
  for (const h of r.history) {
    const change = h.before ? `旧「${h.before}」→ 新「${h.after}」` : `「${h.after}」`;
    lines.push(`  - ${h.date} ${change}${h.trigger ? `（きっかけ: ${h.trigger}）` : ""}`);
  }
  lines.push(`- 出典: ${r.sources.map(src).join(" ／ ")}`);
  return lines.join("\n");
}

export interface SkillFiles {
  name: string;
  files: Record<string, string>; // relative path → content
}

export function exportSkill(rules: KokoroeRule[], clients: Client[], company: { name: string; master: { name: string } }): SkillFiles {
  assertSkillName(SKILL_NAME);
  const active = rules.filter((r) => r.status === "active");
  const common = active.filter((r) => r.scope.clientId === null);
  const files: Record<string, string> = {};
  const index: string[] = [];
  for (const c of clients) {
    const rs = active.filter((r) => r.scope.clientId === c.id);
    if (!rs.length) continue;
    const file = `clients/${c.slug}.md`;
    index.push(`| ${c.name} | ${c.industry} | ${c.contact} → ${c.decider} | [${file}](${file}) |`);
    files[file] = `# ${c.name}の心得\n\n業界: ${c.industry}　窓口: ${c.contact}　決裁: ${c.decider}　取引${c.relationshipYears}年\n\n${rs.map(ruleBlock).join("\n\n")}\n`;
  }
  const description =
    `${company.name}（架空）の取引先ごとの付き合い方の作法と、その沿革（なぜそうなったか）。` +
    `${company.name}の取引先に連絡・相談・見積り・あいさつなどをするとき、またはその取引先について「この手順は省いていいか」「なぜこうするのか」を判断するときに使う。`;
  files["SKILL.md"] = `---
name: ${SKILL_NAME}
description: ${description}
---

# 心得帳 — ${company.name}

師匠（${company.master.name}）のダメ出しから覚えた、取引先ごとの作法です。各項目に沿革（旧 → 新・きっかけ・日付）と出典があります。

## 使い方
1. 相手の取引先のファイル（下の表）だけを読む。全社の作法はこのファイルの下にある。
2. 作法に従って答える。答えには、根拠の項目 ID と、沿革に書かれた「わけ」を添える。
3. 心得帳に書かれていないことは推測しない。「心得帳には記録がない。師匠（または前任者）に確認を」と答える。
4. 値引き・契約条件は自分で決めない。必ず人が判断する。

## 取引先
| 取引先 | 業界 | 窓口 → 決裁 | ファイル |
|---|---|---|---|
${index.join("\n")}

## 全社の作法
${common.length ? common.map(ruleBlock).join("\n\n") : "（まだない）"}
`;
  return { name: SKILL_NAME, files };
}

/** Minimal ZIP (store, no compression) — enough for a handful of text files, no dependency. */
export function zip(files: Record<string, string>, root: string): Uint8Array {
  const enc = new TextEncoder();
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (b: Uint8Array) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [rel, text] of Object.entries(files)) {
    const name = enc.encode(`${root}/${rel}`);
    const data = enc.encode(text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cenSize = central.reduce((a, c) => a + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, cenSize, true);
  end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((a, c) => a + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}
