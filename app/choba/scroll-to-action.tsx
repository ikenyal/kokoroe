"use client";

import { useEffect } from "react";

/**
 * On a phone the reading choices live below the card. When the apprentice asks the master something new (a reading to pick, a
 * "why?", a check), bring that panel into view once — keyed by what is being asked, so it never fights the master's scrolling.
 */
export function ScrollToAction({ signature }: { signature: string }) {
  useEffect(() => {
    if (!signature || window.matchMedia("(min-width: 1024px)").matches) return;
    const seen = sessionStorage.getItem("kokoroe-asked");
    if (seen === signature) return;
    sessionStorage.setItem("kokoroe-asked", signature);
    document.getElementById("bg-h")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [signature]);
  return null;
}
