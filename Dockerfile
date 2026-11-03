# Kokoroe public demo — container for Amazon Lightsail (docs/deploy.md). Build for linux/amd64.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 KOKOROE_DATA_DIR=/tmp/kokoroe
# standalone server + static assets + the recorded demo snapshots read at runtime
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/data/demo ./data/demo
USER node
EXPOSE 3000
CMD ["node", "server.js"]
