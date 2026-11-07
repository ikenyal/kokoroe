"""Build the 「貼る用」 section of docs/submission-draft.md from its own items (run from the repo root):
    python3 scripts/publish/build-paste.py
The video URL comes from section 7's 「URL:」 line once it is a real address (scripts/publish/set-youtube-url.py)."""
import re, sys
p = "docs/submission-draft.md"
s = open(p, encoding="utf-8").read()
s = s.split("\n## 貼る用")[0].rstrip() + "\n"

def section(head_re, stop_re=r"\n## "):
    m = re.search(head_re, s)
    if not m: raise SystemExit(f"missing {head_re}")
    rest = s[m.end():]
    n = re.search(stop_re, rest)
    return re.sub(r"\n+---\s*$", "", rest[: n.start() if n else len(rest)].strip()).strip()

def strip_md(t):
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    return t

overview = re.search(r"<!-- overview:start -->\n(.*?)\n<!-- overview:end -->", s, re.S).group(1).strip()
ov_count = len(overview.replace("\n", ""))
item8 = [re.sub(r"\*\*", "", r.split("|")[2].strip()) for r in s.splitlines() if r.startswith("| ✓ |")]
item9 = section(r"## 9\. [^\n]*\n")
item10 = section(r"## 10\. [^\n]*\n")
i11 = {k: section(rf"### {k} [^\n]*\n", r"\n### |\n## ") for k in ("①", "②", "③")}
video = section(r"## 7\. [^\n]*\n")
title = re.search(r"\*\*題名（最終）:\*\* (.+)", video).group(1)
m_url = re.search(r"^URL: (https://\S+)", video, re.M)
video_url = m_url.group(1) if m_url else None

def block(t):
    return "```text\n" + t.strip() + "\n```"

U = "https://kokoroe.xzan0gz3dgpb8.ap-northeast-1.cs.amazonlightsail.com/"
out = [
    "\n## 貼る用（11/7。フォームの項目の順。```text``` の中をそのまま貼る）\n",
    "数字は 11/7 の正式な計測（架空の取引先10社・評価用20場面）。審査用のコードは、このファイルにもどこにも書かない。\n",
    "### 1. チーム名", block("ikenyal"),
    "### 2. チームメンバー", block("Kento Ikeda（GitHub: ikenyal）"),
    "### 3. プロジェクト名", block("ココロエ（Kokoroe）— 商いの心得を継ぐ、AIの弟子"),
    "### 4. 選択したテーマ", block("あなたにしかない深さを"),
    f"### 5. プロジェクト概要（{ov_count}字。500字以内。改行は数えない）", block(overview),
    "### 6. 公開 GitHub リポジトリ", block("https://github.com/ikenyal/kokoroe"),
    "### 公開デモのリンク（来場者向け）", block(U),
    "### 公開デモのリンク（審査員向け）", block(U + "\n（最初の画面のいちばん下の「審査用のコード」を開いて、審査員のログイン情報のコードを入れてください。AI がその場で動くときの1日の上限が審査員用になるだけで、画面と動きは同じです）"),
    "### 審査員のログイン情報（この欄だけにコードを書く）",
    block(f"公開デモ: {U}\nログインは要りません。最初の画面のいちばん下の「審査用のコード」を開き、次のコードを入れて「確かめる」を押してください: 【Kento が手で入れる】\nコードを入れると、このブラウザで AI がその場で動く（案を作る・直しを読み取る・後任が答える）ときの1日の上限が審査員用になり、1回のお試しで使える回数の上限もなくなるので、来場者が多くて共通の上限に達しても、そのまま試し続けられます。画面・動き・データは同じで、別の環境に切り替わるのではありません。付けた印や育った心得帳はブラウザごとに分かれ、ほかの人と混ざりません（最初からやり直すか、24時間たつと消えます）。コードがなくても、来場者の上限まではライブで動き、そのあとは記録済みのデータで全ての画面を見られます。データはすべて架空です。"),
    "### 7. デモ動画（YouTube、限定公開）", block(video_url or "【アップロード後に Kento が URL を入れる】") + f"\n\n題名は「{title}」。説明文は上の 7 の「説明文（最終）」をそのまま。",
    "### 8. 使用した Claude の製品・機能（選ぶもの）", block("\n".join(item8)),
    f"### 9. 開発中に一番詰まった場面（{len(strip_md(item9).replace(chr(10), ''))}字）", block(strip_md(item9)),
    f"### 10. 公式の情報（{len(item10.replace(chr(10), ''))}字）", block(item10),
    f"### 11 ① 日本語や日本の業務で使う立場から（{len(i11['①'].replace(chr(10), ''))}字）", block(i11["①"]),
    f"### 11 ② 他の AI ツールと比べて（{len(i11['②'].replace(chr(10), ''))}字）", block(i11["②"]),
    f"### 11 ③ 一つだけ直せるとしたら（{len(i11['③'].replace(chr(10), ''))}字）", block(i11["③"]),
]
open(p, "w", encoding="utf-8").write(s + "\n".join(out) + "\n")
print("overview chars", ov_count, "| item8", item8)
