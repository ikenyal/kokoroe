---
name: world-consistency
description: Canon and rules for Kokoroe's fictional world (株式会社だいだい工房 and its 10 clients). Use before writing or reviewing any data file, demo copy, README text or video script that mentions the company, its people, clients, or kokoroe.
---

# Kokoroe world canon

Source of truth is the data, not this file:
- Company & people: `data/world/company.json` (master 篠原 清, successor 三上 遥, apprentice 橙丸)
- Public client ledger: `data/world/clients.json` (C01–C10)
- Hidden (simulator only): `data/hidden/` — client traits, rules R01–R19 + HITL, scene keys, history answers

## Terms (use consistently)
| Japanese | English in code/docs |
|---|---|
| 心得帳 | kokoroe-chō |
| 師匠 / 弟子（橙丸） | master / apprentice (Daidaimaru) |
| 後任 | successor |
| 沿革 | history (old → new, trigger, master's words, date) |
| 見習い → 手代 → 番頭 | rank: minarai → tedai → bantō |
| 暖簾を継ぐ | handing over (successor Q&A) |
| ○ / △ / × | ok / ok-with-condition / wrong |

## Never
- Real company/person names, or names that echo "Claude" / "Clawd".
- Showing hidden rules to the apprentice or putting them in public scene text.
- Claiming results beyond "fictional 10 clients / 20 held-out scenes".
