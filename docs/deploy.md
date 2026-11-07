# Deploying the public demo — Amazon Lightsail container service (target: 2026-11-06)

> 本文のコミット番号は、公開の前の書き換え（11/7）より前のもの。`docs/commit-map-2026-11-07.txt` で今の番号に引ける。 / Commit numbers below are from before the 11/7 rewrite; `docs/commit-map-2026-11-07.txt` maps them to the current ones.

The public demo runs two modes only: **デモの続き** (a recorded mid-training state, shipped in the image) and **お試し**
(the visitor is the master; a fresh session each time). The master-role test (師匠役テスト; internally `field`) is never enabled in public (`KOKOROE_FIELD` unset).
All data is fictional. The Anthropic API key exists only on the server.

**Hosting decision (D-034):** one Lightsail container service node. App Runner is closed to new customers since 2026-04-30;
Amplify Hosting documents SSR for Next.js 12–15 and runs per-request compute, which doesn't fit file-based sessions.
Fallback if Lightsail causes trouble: **Amazon ECS Express Mode** (AWS's recommended successor path) with the same image.

## Resources created (2026-11-03, by Claude Code with Kento's approval)

Account: BrightFlow Sandbox (ID not recorded here). Profile `brightflow-sandbox-ikeda`, region ap-northeast-1.

| Resource | Name | ARN (account masked) | Monthly estimate |
|---|---|---|---|
| Lightsail container service | `kokoroe` — power **micro** (0.25 vCPU, 1 GB), scale 1, tag `project=kokoroe` | `arn:aws:lightsail:ap-northeast-1:<account>:ContainerService/…` | **$10** (Lightsail price list, from `get-container-service-powers`) |
| Container image | `:kokoroe.web.1` (linux/amd64, ~267 MB) | — | included |
| AWS Budgets | `kokoroe-guard` — $20/month, cost filter Service = Amazon Lightsail (no other Lightsail use in the account), email alerts at actual > 80% and > 100% to the owner's address | `arn:aws:budgets::<account>:budget/kokoroe-guard` | ~$0.6 (the account already has more than two budgets; each additional budget is billed per day — check the Budgets pricing page) |

Public URL: `https://kokoroe.xzan0gz3dgpb8.ap-northeast-1.cs.amazonlightsail.com/` — first deployment **without an API key**
(recorded data only; `KOKOROE_LIVE` unset). Verified 11/3 with Playwright: AI banner on every page, data-handling text,
デモの続き (16 rules, card 1/20), お試し (judging records; the side panel says interpretation does not run on recorded data).
Screenshots: `docs/screens/public-*.png`.

**Live since 2026-11-03 (deployment 2, image `:kokoroe.web.2`, approved by Kento):** `kokoroe-public` key (workspace monthly cap
$30), `KOKOROE_LIVE=1`, `KOKOROE_DAILY_USD=5`, session 40 / IP 60 per hour / 1500 per day, `KOKOROE_TRUSTED_PROXY_HOPS=1`.
The key went in through a 600-permission file outside the repo, read with `file://` and deleted right after; status checks use
`--query` so the environment is never printed. Verified with Playwright: the start page says data goes to the Claude API; お試し's
first card drafted live in ~5.8 s; a △ was interpreted and written as a rule in ~12 s while the next card was already shown, followed
by the optional "why?"; 暖簾を継ぐ answered Q01 (Zoom → Teams) citing K-004. Screenshots: `docs/screens/public-live-*.png`.
**Deployment 3 (2026-11-03, `:kokoroe.web.3`, approved):** same environment; adds 確かめ稽古 + regression in the 帳場 (D-037).
Verified on the public URL (`docs/screens/public-live-confirm.png`, `public-live-verified.png`).
**Deployment 4 (2026-11-04, `:kokoroe.web.4`, approved by Kento):**
- **Environment:** the same; the settings were read into a 600-permission temp file outside the repo, only the image was
  swapped, and the file was deleted right after (never printed). `KOKOROE_OWN` is not set.
- **Adds:**
  - the audit fixes, D-044, D-045, D-048;
  - the Japanese error and not-found screens;
  - ココロエ（Kokoroe） as the product name;
  - D-053 (undo, stop here, 心得 / 台帳 facts, no ids on screen, phone layout), D-054 (successor instructions), D-055 (the plain
    track record).
- **Verified on the public URL with Playwright:**
  - the title and header say ココロエ;
  - お試し: a △ was read live into three readings, with undo offered;
  - 心得帳 shows 「師匠から覚えた心得 0・台帳から写した事実 10」;
  - 暖簾を継ぐ answers with no rule ids on screen;
  - `/own` and unknown pages give the Japanese not-found screen.
  - Screenshots: `docs/screens/public-v4-*.png`.
- **Built with Podman on the only machine here** (`hodoku-build-rosetta-v2`), as a separate tag (`localhost/kokoroe`); nothing of
  HODOKU's images, settings or cache was changed.

**Deployment 5 (2026-11-07 05:16, `:kokoroe.web.5`, approved by Kento after the interim freeze report):**
- **From `main` at `733dfbf`.** Settings read into a 600-permission temp file outside the repo and deleted right after; nothing printed.
- **Environment changes:** `KOKOROE_DAILY_USD=10`, `KOKOROE_JUDGE_DAILY_USD=10`, `KOKOROE_JUDGE_CODE` made with `openssl rand -hex 12`
  (24 characters, 0-9a-f, so judges can type it without mixing up `O`/`0` or `+ / =`; Kento's choice), shown to Kento once and
  written nowhere. Everything else unchanged (`KOKOROE_LIVE=1`, the call caps, `KOKOROE_TRUSTED_PROXY_HOPS`; `KOKOROE_FIELD` and
  `KOKOROE_OWN` unset).
- **Image:** built on the host, then `podman build` with the separate tag `localhost/kokoroe` (nothing of HODOKU's changed). The
  push needs the socket path of the running machine (`podman machine inspect <name>`); without the name the template came back empty.
- **At the second rebuild (after 11/7's final version):** keep `KOKOROE_JUDGE_CODE` exactly as it is (carry the deployed
  environment over as in step 4); a new code would stop the one Kento put in the submission form. Change it only if Kento asks.
- **Verified on the public URL with Playwright:** `/`, `/keiko`, `/kokoroe`, `/noren` 200, an unknown page 404; the AI banner;
  the 「審査用のコード」 field shows; the code is accepted; お試し's first card drafted live in 6.7 s on the judges' budget (one card
  only). Screenshots: `docs/screens/public-v5-*.png`.

**Deployment 6 (2026-11-07 18:50, `:kokoroe.web.6`, Kento's word for step 5 after the final video):**
- **From `main` at `83d0db5`.** Same environment carried over exactly as in deployment 5 (read into a 600-permission temp file
  outside the repo, only the image swapped, the file deleted right after; nothing printed). `KOKOROE_JUDGE_CODE` unchanged
  (24 characters, the value in the submission form).
- **Verified on the public URL with Playwright:**
  - `/`, `/choba`, `/kokoroe`, `/noren` and `/keiko` give 200, and an unknown page gives 404;
  - the AI banner is on every page;
  - `/keiko` shows the official numbers (54% → 71%, 平均119回) with no 「途中経過」;
  - the favicon, icon and OGP images are byte-identical to the repository, and `og:image` points to the public URL;
  - the 「審査用のコード」 explanation shows, and the code is accepted;
  - お試し's first card drafted live in 4.1 s on the judges' budget, with no limit notice (one card only).
  - Screenshots: `docs/screens/public-v6-*.png`.

**Decided (Kento 11/6): option B.** At the freeze rebuild (11/6), set `KOKOROE_DAILY_USD` to 10. Kento sets the Claude Console
monthly limit on the public workspace to $100 himself (raised from $60 when the judges' budget was added, D-067), after checking
this month's spend so far. At the rebuild also set `KOKOROE_JUDGE_DAILY_USD=10` and `KOKOROE_JUDGE_CODE` (made then with `openssl rand`, 16+ characters, shown to Kento once and written nowhere else;
never written into the repository). The code must be random, 16 characters or more (tries are limited per address, and a leaked
cookie would let a weak code be guessed offline). Changing the code stops new entries at once; sessions that already entered it keep
the judges' budget until JST midnight. Spending is covered by free credits;
the limits are there so that no real cost arises (docs/freeze-report.md, section 2).

## How the image was actually built and pushed (Podman, Apple Silicon)

Building Next.js inside an emulated linux/amd64 container **segfaulted** (Turbopack's native binary under qemu). So the app is
built on the host and the image only copies files (no `RUN` → no emulation):
```bash
scripts/prepare-image.sh                                   # host build → .image/ (sharp removed; checks: no *.node, no .env*)
podman build --platform linux/amd64 -t localhost/kokoroe:latest .image   # uses Dockerfile.prebuilt
# lightsailctl talks to the Docker API; point it at Podman's socket and pin the API version (Podman reports 1.44,
# lightsailctl needs 1.46 for `platform`):
DOCKER_API_VERSION=1.46 DOCKER_HOST=unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}') \
  aws lightsail push-container-image --profile brightflow-sandbox-ikeda --region ap-northeast-1 \
  --service-name kokoroe --label web --image localhost/kokoroe:latest
```
The multi-stage `Dockerfile` remains for machines that build natively on x86_64 (or Docker with working emulation).

## What is lost on a redeploy — and why that's fine

The container keeps visitor sessions and the public-demo limit counters under `KOKOROE_DATA_DIR` (`/tmp/kokoroe`), so a redeploy
or node restart clears them:

| Lost | Effect | OK because |
|---|---|---|
| お試し sessions | a visitor mid-trial starts over | お試し is initialized per session by design |
| デモの続き sessions | same | the starting state is fixed data in the image (`data/demo/`) |
| Daily limit counters (calls, estimated spend) | the day's cap restarts from 0 | **the Claude Console spend limit is the hard backstop** — set it; avoid many redeploys in one day |
| Master-role test timings | — | the master-role test runs locally, never on the public server |

Nothing permanent lives in the container. Evaluation results, decision records and the recorded demo are in the repository.

## What Kento creates

1. **Claude Console** (BrightFlow LLC organization)
   - A workspace for the public demo, e.g. `kokoroe-public`, with a **monthly spend limit** (suggested: $30).
   - An API key in that workspace — separate from the development key (`kokoroe-hackathon`). Disable it after the final judging (11/10).
2. **AWS (BrightFlow Sandbox account), region ap-northeast-1**
   - **Lightsail container service** `kokoroe`: power **micro or larger** (≥ 1 GB memory; check current pricing in the Lightsail
     console), **scale = 1** (one node — sessions are in that node's memory/disk).
   - **AWS Budgets** alert for the account (to the BrightFlow address used for the AWS hackathon), e.g. $20/month.
   - Locally: AWS CLI v2 + the `lightsailctl` plugin (needed by `push-container-image`), and Docker with `buildx`.
3. **How the API key reaches the container:** as an environment variable in the Lightsail deployment (Lightsail containers have
   no IAM role to read Secrets Manager at runtime). Mitigations: a dedicated, spend-capped workspace key; only people with access
   to the Sandbox account can see deployment settings; the key is disabled after judging. Never put it in the image or the repo
   (`.dockerignore` excludes `.env*`; the standalone build excludes `.env*` too — checked 11/3).

## Environment variables (deployment)

| Name | Value | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | the `kokoroe-public` key | server-side only |
| `KOKOROE_LIVE` | `1` | Claude for drafts / interpretation / successor; unset = recorded data only |
| `KOKOROE_DAILY_USD` | `10` (from the 11/6 rebuild; was `5`) | visitors' estimated daily spend cap → falls back to recorded data with a notice |
| `KOKOROE_JUDGE_DAILY_USD` | `10` | judges' own daily cap (sessions that entered the 審査用のコード; D-067) |
| `KOKOROE_JUDGE_CODE` | made at the rebuild (`openssl rand`, 16+ characters) and shown to Kento once; he copies it into the submission form | the 審査用のコード: random, 16+ characters; never in the repository; unset = no field |
| `KOKOROE_SESSION_CALLS` | `40` | live calls per session |
| `KOKOROE_IP_CALLS_PER_HOUR` | `60` | live calls per IP per hour (uses `X-Forwarded-For` from the Lightsail endpoint) |
| `KOKOROE_GLOBAL_CALLS_PER_DAY` | `1500` | live calls per day, all visitors |
| `KOKOROE_DATA_DIR` | `/tmp/kokoroe` | set in the Dockerfile |
| `KOKOROE_FIELD` | *(unset)* | never enable in public |
| `KOKOROE_OWN` | *(unset)* | 自分の会社で始める — local only, never in public (`tests/own.test.ts`; even if set, a proxied or non-local request gets nothing) |

## Build and deploy

```bash
# 1. Build for Lightsail (x86_64). On Apple Silicon see "How the image was actually built" above (host build + Podman).
docker buildx build --platform linux/amd64 -t kokoroe:latest .

# 2. Push the image to the container service
aws lightsail push-container-image --region ap-northeast-1 --service-name kokoroe --label web --image kokoroe:latest
#    → prints an image reference like ":kokoroe.web.1"

# 3. Deploy (containers.json / endpoint.json below)
aws lightsail create-container-service-deployment --region ap-northeast-1 --service-name kokoroe \
  --containers file://containers.json --public-endpoint file://endpoint.json
```

`containers.json` (fill the key at deploy time; do not commit this file with a key in it):
```json
{
  "web": {
    "image": ":kokoroe.web.1",
    "ports": { "3000": "HTTP" },
    "environment": {
      "ANTHROPIC_API_KEY": "<kokoroe-public key>",
      "KOKOROE_LIVE": "1",
      "KOKOROE_DAILY_USD": "10",
      "KOKOROE_JUDGE_DAILY_USD": "10",
      "KOKOROE_JUDGE_CODE": "<made at deploy time, never committed>",
      "KOKOROE_SESSION_CALLS": "40",
      "KOKOROE_IP_CALLS_PER_HOUR": "60",
      "KOKOROE_GLOBAL_CALLS_PER_DAY": "1500"
    }
  }
}
```
`endpoint.json`:
```json
{ "containerName": "web", "containerPort": 3000, "healthCheck": { "path": "/", "successCodes": "200-399" } }
```

The image: `Dockerfile` builds Next.js in `standalone` mode and copies `data/demo/` (the recorded snapshots read at runtime).
Locally verified 11/3 with the same file layout: home 200, a デモの続き session with 16 rules, 心得帳 export as a zip.

## After deploy — smoke test
1. Open the Lightsail public URL (HTTPS). The banner 「案は AI の弟子（橙丸）が作り、判断は師匠が行います」 is on every page.
2. Start お試し, judge one card with △ and a remark → the right panel shows interpretation, then a rule.
3. 暖簾を継ぐ: ask one preset question → answer with rule id and 沿革.
4. 心得帳 → 「心得帳を後任に渡す」 downloads a zip.
5. In the Claude Console, the workspace's usage moved by cents, not dollars.

## Before going public (checklist)
- [ ] `KOKOROE_FIELD` unset; `KOKOROE_LIVE=1`; limits as above.
- [ ] Console spend limit on `kokoroe-public` + AWS Budgets alert in place.
- [ ] Scale = 1 node.
- [x] D-028: the live 帳場 path runs 確かめ稽古 / regression (D-037) — needs a redeploy to reach the public URL.
- [ ] Keep the URL up until the final judging ends (11/10), then disable the key and delete the service.

Fallback: ECS Express Mode can run the same image (`docker buildx … --platform linux/amd64`) with one task; keep the task count at 1
for the same reason (file-based sessions).
