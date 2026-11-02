"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** While background work is running, re-read the server state every few seconds (no websockets needed for a demo). */
export function AutoRefresh({ active, ms = 3000 }: { active: boolean; ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), ms);
    return () => clearInterval(t);
  }, [active, ms, router]);
  return null;
}
