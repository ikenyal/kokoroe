# Deploying the public demo — Amazon Lightsail container service (target: 2026-11-06)

The public demo runs two modes only: **デモの続き** (a recorded mid-training state, shipped in the image) and **お試し**
(the visitor is the master; a fresh session each time). The field-test mode is never enabled in public (`KOKOROE_FIELD` unset).
All data is fictional. The Anthropic API key exists only on the server.

**Hosting decision (D-034):** one Lightsail container service node. App Runner is closed to new customers since 2026-04-30;
Amplify Hosting documents SSR for Next.js 12–15 and runs per-request compute, which doesn't fit file-based sessions.
Fallback if Lightsail causes trouble: **Amazon ECS Express Mode** (AWS's recommended successor path) with the same image.

## What is lost on a redeploy — and why that's fine

The container keeps visitor sessions and the public-demo limit counters under `KOKOROE_DATA_DIR` (`/tmp/kokoroe`), so a redeploy
or node restart clears them:

| Lost | Effect | OK because |
|---|---|---|
| お試し sessions | a visitor mid-trial starts over | お試し is initialized per session by design |
| デモの続き sessions | same | the starting state is fixed data in the image (`data/demo/`) |
| Daily limit counters (calls, estimated spend) | the day's cap restarts from 0 | **the Claude Console spend limit is the hard backstop** — set it; avoid many redeploys in one day |
| Field-test timings | — | the field test runs locally, never on the public server |

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
| `KOKOROE_DAILY_USD` | `5` | estimated daily spend cap → falls back to recorded data with a notice |
| `KOKOROE_SESSION_CALLS` | `40` | live calls per session |
| `KOKOROE_IP_CALLS_PER_HOUR` | `60` | live calls per IP per hour (uses `X-Forwarded-For` from the Lightsail endpoint) |
| `KOKOROE_GLOBAL_CALLS_PER_DAY` | `1500` | live calls per day, all visitors |
| `KOKOROE_DATA_DIR` | `/tmp/kokoroe` | set in the Dockerfile |
| `KOKOROE_FIELD` | *(unset)* | never enable in public |

## Build and deploy

```bash
# 1. Build for Lightsail (x86_64) — on Apple Silicon use --platform
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
      "KOKOROE_DAILY_USD": "5",
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
- [ ] D-028: the live 帳場 path does not yet run 確かめ稽古 / regression — stated in the README, or added before 11/6.
- [ ] Keep the URL up until the final judging ends (11/10), then disable the key and delete the service.

Fallback: ECS Express Mode can run the same image (`docker buildx … --platform linux/amd64`) with one task; keep the task count at 1
for the same reason (file-based sessions).
