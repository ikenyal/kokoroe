/**
 * Shoot the whole demo video in one command (11/7 with --live; today with fixed data for a rough cut).
 *   npm run video:shoot                         # fixed data: recorded drafts, no API calls
 *   npm run video:shoot -- --live --voice Kazuha --mcp
 * Steps:
 *   1. (--mcp) refresh demo/successor-mcp/answers.json by running demo/successor-mcp/run.sh in empty directories outside the repo
 *   2. build the production bundle exactly like the container image (scripts/prepare-image.sh → .image/)
 *   3. start it on 127.0.0.1 only (never the LAN), with a throwaway data dir and KOKOROE_VIDEO_QUEUE=T05,T13 for お試し
 *      (--live passes the dev key from .env.local to the server process only; it is never printed)
 *   4. record every scene (video/record.ts), 5. stop the server (always), 6. copy narration of --voice, 7. assemble (ffmpeg)
 * A production build shows no Next.js dev indicator.
 */
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const ROOT = path.resolve(__dirname, "..");
const PORT = 3123;
const BASE = `http://127.0.0.1:${PORT}`;
const { values } = parseArgs({
  options: {
    live: { type: "boolean", default: false },
    voice: { type: "string" },
    mcp: { type: "boolean", default: false },
    "skip-build": { type: "boolean", default: false },
    only: { type: "string" },
  },
});
const run = (cmd: string, args: string[], cwd = ROOT) => execFileSync(cmd, args, { cwd, stdio: "inherit" });

function keyFromEnvLocal(): string {
  const line = readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n").find((l) => l.startsWith("ANTHROPIC_API_KEY="));
  const key = line?.slice("ANTHROPIC_API_KEY=".length).trim();
  if (!key) throw new Error("--live needs ANTHROPIC_API_KEY in .env.local");
  return key;
}

async function waitUp(ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      if ((await fetch(BASE + "/")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not come up");
}

async function main() {
  if (values.mcp) {
    // Same procedure as the demo: empty directories outside the repo, only the exported Skill (+ the kokoroe server).
    run(path.join(ROOT, "demo/successor-mcp/record-answers.sh"), []);
  }
  if (!values["skip-build"]) run(path.join(ROOT, "scripts/prepare-image.sh"), []);
  const dataDir = mkdtempSync(path.join(tmpdir(), "kokoroe-shoot-"));
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: String(PORT),
    KOKOROE_DATA_DIR: dataDir,
    // Live: one card (T02, another client) between T05 and T13, so T13 is drafted after the reading is written (11/7: the next
    // card is drafted at once after △, before the reading; s05 cuts the middle card out and says so on screen).
    KOKOROE_VIDEO_QUEUE: values.live ? "T05,T02,T13" : "T05,T13",
    ...(values.live ? { KOKOROE_LIVE: "1", ANTHROPIC_API_KEY: keyFromEnvLocal() } : {}),
  };
  const server = spawn("node", ["server.js"], { cwd: path.join(ROOT, ".image"), env, stdio: ["ignore", "ignore", "inherit"] });
  try {
    await waitUp();
    console.log(`server on ${BASE} (${values.live ? "live" : "fixed data"})`);
    run("npx", ["tsx", "video/record.ts", "--base", BASE, ...(values.live ? ["--live"] : []), ...(values.only ? ["--only", values.only] : [])]);
  } finally {
    server.kill("SIGTERM");
    rmSync(dataDir, { recursive: true, force: true });
    console.log("server stopped");
  }
  if (values.voice) {
    const from = path.join(ROOT, "video/out/audio", values.voice);
    if (!existsSync(from)) throw new Error(`no narration for ${values.voice} — run video/narration.ts --yes --voices ${values.voice}`);
    mkdirSync(path.join(ROOT, "video/out/audio"), { recursive: true });
    for (const f of readdirSync(from)) copyFileSync(path.join(from, f), path.join(ROOT, "video/out/audio", f));
    console.log(`narration: ${values.voice} (${readdirSync(from).filter((f) => f.endsWith(".mp3")).length} scenes; others silent)`);
  }
  if (!values.only) run(path.join(ROOT, "video/assemble.sh"), []);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
