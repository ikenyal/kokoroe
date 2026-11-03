/**
 * Own mode (自分の会社で始める) on the server side: it answers only on this machine. Even with KOKOROE_OWN=1, a request whose Host
 * is not 127.0.0.1 / localhost / [::1] gets nothing (the layout shows a refusal, every own action throws). The public version never
 * sets KOKOROE_OWN (tests/own.test.ts checks the deploy files), so there the mode does not exist at all.
 */
import { headers } from "next/headers";
import { ownEnabled } from "@/src/core/own-world";

export const isLocalHost = (host: string | null) => !!host && /^(127\.0\.0\.1|localhost|\[::1\])(:\d{1,5})?$/.test(host);

const LOOPBACK = /^(127\.\d{1,3}\.\d{1,3}\.\d{1,3}|::1|::ffff:127\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

/**
 * A request for own mode: to the local address, and from this machine. Next.js itself adds X-Forwarded-For with the socket address
 * (127.0.0.1 for a local browser), so a forwarded chain is accepted only when every address in it is loopback; a request through a
 * proxy carries the visitor's address there, so it is refused whatever its Host says.
 */
export function isLocalRequest(h: { get(name: string): string | null }) {
  const chain = (h.get("x-forwarded-for") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return isLocalHost(h.get("host")) && chain.every((ip) => LOOPBACK.test(ip)) && !h.get("forwarded");
}

/** Own mode is on and this request comes to the local address. */
export async function ownHere(): Promise<boolean> {
  return ownEnabled() && isLocalRequest(await headers());
}

/** For own-mode server actions: refuse unless own mode is on and the request is local. */
export async function requireOwn(): Promise<void> {
  if (!(await ownHere())) throw new Error("own mode is only available locally");
}
