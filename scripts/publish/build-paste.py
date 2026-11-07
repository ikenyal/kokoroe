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
judge = re.search(r"<!-- judge:start -->\n(.*?)\n<!-- judge:end -->", s, re.S).group(1).strip()
assert "\n" not in judge and U in judge
# 9: the title line without the internal note, then ①〜⑤ (labels are in the sentences)
item9 = re.sub(r"（Kento [^）]*）", "", strip_md(item9)).strip()
# 10 and 12 are one-line fields (10: 150 characters at most, Kento 11/7)
item10 = item10.replace("\n", "")
assert len(item10) <= 150, f"10 is {len(item10)} characters (150 at most)"
# 11: one field, each part starting with its number
item11 = "\n\n".join(f"{k}{i11[k]}" for k in ("①", "②", "③"))
# 8: in the form's order
FORM8 = ["Claude Code CLI", "Claude Code IDE 拡張", "Claude Code Desktop", "Cowork", "Claude.ai", "Claude API", "Managed Agents", "Agent SDK", "その他"]
item8 = [x for x in FORM8 if x in item8] + [x for x in item8 if x not in FORM8]
n = lambda t: len(t.replace("\n", ""))
out = [
    "\n## 貼る用（11/7。フォームの実物の1〜12の順。```text``` の中をそのまま貼る）\n",
    "数字は11/7の正式な計測（架空の取引先10社・評価用20場面）。審査用のコードは、このファイルにもどこにも書かない（12にKentoが手で入れる）。字数は改行を数えない。\n",
    "### 1. チーム名", block("ikenyal"),
    "### 2. チームメンバー（入力済み: Kento Ikeda / ikenyal。そのままでよい）",
    "### 3. プロジェクト名", block("ココロエ（Kokoroe）— 商いの心得を継ぐ、AIの弟子"),
    "### 4. 選択したテーマ（選ぶ）", block("あなたにしかない深さを"),
    f"### 5. プロジェクト概要（{ov_count}字。500字以内）", block(overview),
    "### 6. 公開GitHubリポジトリ", block("https://github.com/ikenyal/kokoroe"),
    "### 7. デモ動画", block(video_url or "【アップロード後に Kento が URL を入れる】"),
    "### 8. 使用したClaudeの製品・機能（チェックを入れる）", block("\n".join(item8)),
    f"### 9. 開発中に一番詰まった場面（{n(item9)}字）", block(item9),
    f"### 10. 開発に必要な公式の情報が十分見つけられましたか（1行・150字以内・{n(item10)}字）", block(item10),
    f"### 11. Claudeを使った感想と改善してほしい点（①②③を1つの欄に・{n(item11)}字）", block(item11),
    "### 12. 審査員用リンク（任意）（1行。【Kentoが手で入れる】をコードに置き換える）", block(judge),
]
open(p, "w", encoding="utf-8").write(s + "\n".join(out) + "\n")
print("overview chars", ov_count, "| item8", item8)
