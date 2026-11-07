"""Put the demo video's YouTube URL into every place that waits for it (Kento uploads it as unlisted, 11/7).
    python3 scripts/publish/set-youtube-url.py https://youtu.be/XXXXXXXXXXX      (run from the repo root)
Places: README.md and README.ja.md (thumbnail link and text link, `YOUTUBE_URL` twice each), docs/release-v1.0.0.md
(`YOUTUBE_URL` once), docs/submission-draft.md section 7's 「URL:」 line, then its 「貼る用」 section is rebuilt.
Prints what it changed and fails if a place is missing, so nothing is left half-done.
"""
import re, subprocess, sys

url = sys.argv[1] if len(sys.argv) > 1 else ""
if not re.fullmatch(r"https://(youtu\.be/[\w-]{11}|www\.youtube\.com/watch\?v=[\w-]{11})", url):
    sys.exit("give the video's URL, e.g. https://youtu.be/XXXXXXXXXXX")
plan = {"README.md": 2, "README.ja.md": 2, "docs/release-v1.0.0.md": 1}
for path, n in plan.items():
    s = open(path, encoding="utf-8").read()
    body = s.replace("Replace YOUTUBE_URL before use.", "") if path.endswith("release-v1.0.0.md") else s
    found = body.count("YOUTUBE_URL")
    if found != n:
        sys.exit(f"{path}: expected {n} × YOUTUBE_URL, found {found}")
    s = body.replace("YOUTUBE_URL", url)
    open(path, "w", encoding="utf-8").write(s)
    print(f"{path}: {n} replaced")
p = "docs/submission-draft.md"
s = open(p, encoding="utf-8").read()
s2, k = re.subn(r"^URL: 〔[^〕]*〕$", f"URL: {url}", s, flags=re.M)
if k != 1:
    sys.exit(f"{p}: section 7's URL line not found (already set?)")
open(p, "w", encoding="utf-8").write(s2)
print(f"{p}: section 7 URL set")
subprocess.run([sys.executable, "scripts/publish/build-paste.py"], check=True)
print("then: grep -n YOUTUBE_URL README*.md docs/release-v1.0.0.md  (nothing), npm test, commit")
