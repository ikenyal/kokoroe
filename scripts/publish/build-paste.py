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
item11 = section(r"## 11\. [^\n]*\n")
i12 = {k: section(rf"### {k} [^\n]*\n", r"\n### |\n## ") for k in ("①", "②", "③")}
env = re.search(r"<!-- env:start -->\n(.*?)\n<!-- env:end -->", s, re.S).group(1).strip()
sec10 = section(r"## 10\. [^\n]*\n")
pick = lambda key: re.search(rf"^- {key} [^:]*: (.+)$", sec10, re.M).group(1)
video = section(r"## 7\. [^\n]*\n")
m_url = re.search(r"^URL: (https://\S+)", video, re.M)
video_url = m_url.group(1) if m_url else None

U = "https://kokoroe.xzan0gz3dgpb8.ap-northeast-1.cs.amazonlightsail.com/"
judge = re.search(r"<!-- judge:start -->\n(.*?)\n<!-- judge:end -->", s, re.S).group(1).strip()
assert "\n" not in judge and U in judge
assert "\n" not in env
item9 = re.sub(r"（Kento [^）]*）", "", strip_md(item9)).strip()
# 11 is a one-line field (150 characters at most, Kento 11/7)
item11 = item11.replace("\n", "")
assert len(item11) <= 150, f"11 is {len(item11)} characters (150 at most)"
# 12: one field, each part starting with its number
item12 = "\n\n".join(f"{k}{i12[k]}" for k in ("①", "②", "③"))
FORM8 = ["Claude Code CLI", "Claude Code IDE 拡張", "Claude Code Desktop", "Cowork", "Claude.ai", "Claude API", "Managed Agents", "Agent SDK", "その他"]
item8 = [x for x in FORM8 if x in item8] + [x for x in item8 if x not in FORM8]
n = lambda t: len(t.replace("\n", ""))
for name, t in (("9", item9), ("12", item12)):
    assert n(t) <= 3000, f"{name} is {n(t)} characters (3,000 at most)"
assert ov_count <= 500, f"5 is {ov_count} characters (500 at most)"

def item(no, title, note, text=None):
    out = [f"### 【{no}】{title}", f"※ {note}", ""]
    if text is not None: out += ["```text", text.strip(), "```", ""]
    return out

out = ["", "## 貼る用（フォームの実物の上から順・13欄。```text``` の中をそのまま貼る）", "",
    "数字は11/7の正式な計測（架空のデータ）。字数は改行を数えない。審査用のコードは、このファイルにもどこにも書かない（13にKentoが手で入れる）。", ""]
out += item(1, "チーム名", "1行", "ikenyal")
out += item(2, "チームメンバー", "入力済み（Kento Ikeda / ikenyal）。そのままでよい")
out += item(3, "プロジェクト名", "1行", "ココロエ（Kokoroe）— 商いの心得を継ぐ、AIの弟子")
out += item(4, "選択したテーマ", "選ぶ", "あなたにしかない深さを")
out += item(5, "プロジェクト概要：解決する課題と、誰のためのものか", f"500字以内（運営に確認済み。3,000字は入力欄の上限）／いまの字数: {ov_count}字", overview)
out += item(6, "プロジェクトの公開GitHubリポジトリ", "1行。リポジトリを公開してから入れる", "https://github.com/ikenyal/kokoroe")
out += item(7, "デモ動画（3分以内・アクセス可）", "1行", video_url or "【アップロード後に Kento が URL を入れる】")
out += item(8, "使用したClaudeの製品・機能", f"この{len(item8)}つにチェックを入れる", "\n".join(item8))
out += item(9, "開発中に一番詰まった場面", f"上限3,000字（長い版）／いまの字数: {n(item9)}字", item9)
out += item(10, "その問題が起きた製品・環境・原因（9に文字を入れると開く4つの欄）", "10-1と10-3と10-4は選ぶ。10-2だけ1行で書く")
out += ["10-1 その問題が起きた製品（すべて選択）", f"→ {pick('10-1')}", "",
        "10-2 どのモデル・バージョン・OSか（1行）", "```text", env, "```", "",
        "10-3 その問題が起きた頻度", f"→ {pick('10-3')}", "",
        "10-4 その問題の主な原因", f"→ {pick('10-4')}", ""]
out += item(11, "開発に必要な公式の情報が十分見つけられましたか？", f"1行・上限150字／いまの字数: {n(item11)}字", item11)
out += item(12, "Claudeを使った感想と改善してほしい点", f"上限3,000字（長い版）。①②③を1つの欄に／いまの字数: {n(item12)}字", item12)
out += item(13, "審査員用リンク（任意）：アクセス用ログイン情報など", "1行。【Kentoが手で入れる】を審査用のコードに置き換える", judge)
open(p, "w", encoding="utf-8").write(s + "\n".join(out).rstrip() + "\n")
print("chars: 5", ov_count, "| 9", n(item9), "| 11", n(item11), "| 12", n(item12), "| item8", item8)
