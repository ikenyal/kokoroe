/**
 * Public-demo guards (D-028, D-032). Every live Claude call from the UI goes through `allowLive()` first.
 *   - per session : at most SESSION_CALLS live calls (drafts, interpretations, successor answers)
 *   - per IP      : at most IP_CALLS_PER_HOUR live calls per hour
 *   - global/day  : estimated spend ≤ KOKOROE_DAILY_USD (default $5) per JST day, and ≤ GLOBAL_CALLS_PER_DAY calls
 * When a limit is hit, the UI falls back to recorded data and says 「本日のお試し上限に達しました」.
 * Counters live in a small JSON file under KOKOROE_DATA_DIR — fine for one instance; for several instances swap the storage
 * (docs/deploy.md). Only counts and amounts are stored, never content.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { headers } from "next/headers";
import type { Usage } from "@/src/lib/claude";
import { estimateUsd } from "@/src/lib/cost";

const DATA_DIR = process.env.KOKOROE_DATA_DIR ?? path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "limits.json");

export const LIMITS = {
  sessionCalls: Number(process.env.KOKOROE_SESSION_CALLS ?? 40),
  ipCallsPerHour: Number(process.env.KOKOROE_IP_CALLS_PER_HOUR ?? 60),
  globalCallsPerDay: Number(process.env.KOKOROE_GLOBAL_CALLS_PER_DAY ?? 1500),
  dailyUsd: Number(process.env.KOKOROE_DAILY_USD ?? 5),
};

interface Counters {
  day: string; // JST date
  usd: number;
  calls: number;
  sessions: Record<string, number>;
  ips: Record<string, { hour: string; calls: number }>;
}

const jstDay = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const hour = () => new Date().toISOString().slice(0, 13);

function load(): Counters {
  const fresh: Counters = { day: jstDay(), usd: 0, calls: 0, sessions: {}, ips: {} };
  if (!existsSync(FILE)) return fresh;
  const c = JSON.parse(readFileSync(FILE, "utf8")) as Counters;
  return c.day === jstDay() ? c : fresh;
}

function save(c: Counters) {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(c));
  renameSync(tmp, FILE);
}

/**
 * The visitor's IP as seen by our own load balancer. X-Forwarded-For is "client-supplied, …, proxy-appended": a visitor can put
 * anything at the front, and each trusted proxy appends the address it saw. So the trustworthy entry is the one appended by
 * the last trusted hop — counted from the END, never the first. With Lightsail there is one trusted hop (its load balancer).
 * X-Real-IP is ignored (a client can send it). No header (local dev) → "direct".
 */
export function trustedClientIp(xff: string | null, trustedHops = Number(process.env.KOKOROE_TRUSTED_PROXY_HOPS ?? 1)): string {
  const parts = (xff ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!parts.length || trustedHops < 1) return "direct";
  const ip = parts[Math.max(0, parts.length - trustedHops)];
  return ip.slice(0, 64);
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return trustedClientIp(h.get("x-forwarded-for"));
}

export type LimitReason = "session" | "ip" | "daily";

/** Reserve one live call. Returns null if allowed, or the reason it isn't. */
export async function allowLive(sid: string): Promise<LimitReason | null> {
  return reserve(sid, await clientIp());
}

/** The counting logic, separated from the request so it can be tested. */
export function reserve(sid: string, ip: string): LimitReason | null {
  const c = load();
  if (c.usd >= LIMITS.dailyUsd || c.calls >= LIMITS.globalCallsPerDay) return "daily";
  if ((c.sessions[sid] ?? 0) >= LIMITS.sessionCalls) return "session";
  const ipc = c.ips[ip]?.hour === hour() ? c.ips[ip] : { hour: hour(), calls: 0 };
  if (ipc.calls >= LIMITS.ipCallsPerHour) return "ip";
  c.calls += 1;
  c.sessions[sid] = (c.sessions[sid] ?? 0) + 1;
  c.ips[ip] = { hour: ipc.hour, calls: ipc.calls + 1 };
  save(c);
  return null;
}

/** Add the actual cost of finished calls to today's total. */
export function recordSpend(usage: Usage[]) {
  if (!usage.length) return;
  const c = load();
  c.usd += estimateUsd(usage);
  save(c);
}

export function dailyExhausted(): boolean {
  const c = load();
  return c.usd >= LIMITS.dailyUsd || c.calls >= LIMITS.globalCallsPerDay;
}

export const LIMIT_MESSAGE: Record<LimitReason, string> = {
  session: "このセッションのお試し上限に達しました。ここからは記録済みのデータで動きます。",
  ip: "短い時間に多くの操作がありました。しばらくしてから試すか、記録済みのデータでご覧ください。",
  daily: "本日のお試し上限に達しました。ここからは記録済みのデータで動きます（明日また試せます）。",
};
