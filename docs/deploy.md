# Deploying the public demo (target: 2026-11-06)

The public demo runs two modes only: **デモの続き** (a recorded mid-training state) and **お試し** (the visitor is the master;
reset per session). The field-test mode is never enabled in public (`KOKOROE_FIELD` unset).
All data is fictional. The Anthropic API key exists only on the server.

## Decision needed: where it runs

The app keeps each visitor's session (kokoroe-chō, judgments) and the public-demo limit counters in small JSON files
(`KOKOROE_DATA_DIR`). That needs **one long-lived instance** (or shared storage).

| | A. AWS App Runner, 1 instance (recommended) | B. AWS Amplify Hosting (SSR) |
|---|---|---|
| Next.js 16 | runs `next start` from a container — any version | documented SSR support is Next.js 12–15; 16 needs checking at setup (see sources) |
| Session files / limits | work as is (min = max = 1 instance; files live while the instance lives) | SSR compute is per-request/ephemeral → sessions and counters would be lost between requests; needs a DynamoDB adapter first |
| `after()` background interpretation | runs in the server process | may be cut when the request's compute ends |
| Work left | Dockerfile (below), service setup | storage adapter (≈ half a day), version check |
| Cost | ~ $5–10 / month at 1 small instance + data | pay per request |

Recommendation: **A (App Runner, 1 instance)** for the hackathon demo; keep Amplify as an option once the store has a
DynamoDB adapter (the `KokoroeStore` interface is already swappable). Sources:
[Amplify support for Next.js](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html),
[amplify-js #14600 (Next.js 16)](https://github.com/aws-amplify/amplify-js/issues/14600).

## What Kento needs to create (either option)

1. **Anthropic (Claude Console)**
   - A dedicated workspace for the public demo, e.g. `kokoroe-public`, with a **monthly spend limit** (suggested: $30).
   - An API key in that workspace (separate from the development key `kokoroe-hackathon`).
2. **AWS (BrightFlow Sandbox account), region ap-northeast-1**
   - A secret for the key: AWS Secrets Manager (or SSM Parameter Store SecureString) `kokoroe/anthropic-api-key`.
   - **AWS Budgets** alert on the account (to the BrightFlow address used for the AWS hackathon), e.g. $20/month.
   - Option A: an ECR repository `kokoroe` and an App Runner service (1 vCPU / 2 GB, **min = max = 1 instance**), with an
     instance role allowed to read the secret. Or point App Runner at the GitHub repo with the Dockerfile.
   - Option B: an Amplify app connected to `ikenyal/kokoroe` (branch `main`), plus a DynamoDB table (pk `id`, on-demand) for
     sessions — only after the adapter exists.
3. **GitHub**: the repository can stay private until submission; App Runner/Amplify need read access (GitHub connection).

## Environment variables

| Name | Public value | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | from the secret | server-side only |
| `KOKOROE_LIVE` | `1` | use Claude for drafts / interpretation / successor; unset = recorded data only |
| `KOKOROE_DAILY_USD` | `5` | estimated daily spend cap; above it the app falls back to recorded data and says so |
| `KOKOROE_SESSION_CALLS` | `40` | live calls per session |
| `KOKOROE_IP_CALLS_PER_HOUR` | `60` | live calls per IP per hour |
| `KOKOROE_GLOBAL_CALLS_PER_DAY` | `1500` | live calls per day, all visitors |
| `KOKOROE_DATA_DIR` | `/tmp/kokoroe` (A) | sessions + counters |
| `NODE_ENV` | `production` | also turns on the `secure` cookie flag |
| `KOKOROE_FIELD` | *(unset)* | never enable in public |

## Option A — build & run

```Dockerfile
# Dockerfile (to be added with the deployment)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
```
Health check: `GET /` (200). After deploy: open the URL, start お試し, judge one card, ask one 暖簾 question, and check the
spend counter stays under the cap.

## Before going public (checklist)
- [ ] `KOKOROE_FIELD` unset; `KOKOROE_LIVE=1`; limits set as above.
- [ ] The UI shows 「案は AI の弟子（橙丸）が作り、判断は師匠が行います」 on every page; the start page explains data handling.
- [ ] Console spend limit + AWS Budgets alert both in place.
- [ ] Keep the URL up until the final judging ends (11/10), then disable the key.
- [ ] D-028: live 帳場 path does not yet run 確かめ稽古 / regression — say so in the README, or add it before 11/6.
