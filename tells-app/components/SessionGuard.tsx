"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useGame } from "@/lib/gameState";
import { ROUNDS, SEQUENTIAL_LOCK } from "@/lib/rounds";

/** Monitors tab switches during a round and blocks access to locked / post-DQ rounds. */
export function SessionGuard() {
  const { user, registerTabSwitch, disqualified } = useAuth();
  const game = useGame();
  const pathname = usePathname() || "";
  const router = useRouter();
  const onRound = /^\/round-\d+/.test(pathname);

  // tab-switch monitoring — only while a round is open
  useEffect(() => {
    if (!user || !onRound) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") registerTabSwitch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user, onRound, registerTabSwitch]);

  // route guard: can't reach a locked round (previous not finished) or any round once disqualified
  useEffect(() => {
    if (!user) return;
    const m = pathname.match(/^\/round-(\d+)/);
    if (!m) return;
    if (disqualified) {
      router.replace("/");
      return;
    }
    if (!SEQUENTIAL_LOCK) return;
    const idx = parseInt(m[1], 10) - 1;
    if (idx > 0) {
      const prev = ROUNDS[idx - 1];
      if (prev && !game.isComplete(prev.slug)) router.replace("/");
    }
  }, [pathname, user, disqualified, game, router]);

  return null;
}
