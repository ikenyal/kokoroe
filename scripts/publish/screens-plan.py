"""Which screenshots stay in the public repository, and which leave the whole history (Kento 11/7; docs/publishing.md §7).
Keep = scripts/publish/keep-screens.txt (decided 11/7: linked by name from the README and the records, the video's final stills,
the judge-code screens, the README head, the public demo v5) plus anything under docs/screens linked by name from a tracked file
other than docs/ui-polish-log.md at the time of running (so screenshots added later are not lost). Remove = every path under
docs/screens that ever existed on main and is not kept.
  python3 scripts/publish/screens-plan.py > /tmp/remove-screens.txt     (run from the repo root; prints counts to stderr)
"""
import os, re, subprocess, sys

def git(*a): return subprocess.run(["git", *a], capture_output=True, text=True, check=True).stdout
tracked = [f for f in git("ls-files").split("\n") if f]
shots = [f for f in tracked if f.startswith("docs/screens/")]
keep = {l.strip() for l in open("scripts/publish/keep-screens.txt", encoding="utf-8") if l.strip()}
pat = re.compile(r"(?:\.\./|\./)?(?:docs/)?screens/[^\s)\]\"'`<>|,;]+")
broad = {"docs/screens", "docs/screens/ui-polish"}
for f in tracked:
    if f.startswith("docs/screens/") or f == "docs/ui-polish-log.md" or not re.search(r"\.(md|ts|tsx|mjs|json|html|sh|txt|py)$", f):
        continue
    text = open(f, encoding="utf-8", errors="ignore").read()
    for m in pat.findall(text):
        m = m.rstrip(".:）。、")
        cand = os.path.normpath(m) if m.startswith("docs/") else os.path.normpath(os.path.join(os.path.dirname(f), m))
        if not cand.startswith("docs/screens"):
            cand = os.path.normpath("docs/screens/" + m.split("screens/", 1)[1])
        cand = cand.rstrip("/")
        pre = re.split(r"[*{<]", cand)[0].rstrip("/")
        if pre in broad:
            continue
        keep.update(s for s in shots if s == cand or s.startswith(pre + ("/" if pre == cand else "")))
history = {p for p in git("log", "main", "--format=", "--name-only", "--", "docs/screens").split("\n") if p}
remove = sorted(history - keep)
missing = sorted(k for k in keep if k not in shots)
print("\n".join(remove))
size = sum(os.path.getsize(s) for s in shots if s in keep)
print(f"keep {len(keep & set(shots))} files ({size / 1e6:.1f} MB at HEAD); remove {len(remove)} paths from history; kept but not at HEAD: {len(missing)}", file=sys.stderr)
