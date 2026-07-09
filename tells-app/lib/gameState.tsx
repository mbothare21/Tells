"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { RoundResult } from "./types";

interface GameState {
  totalScore: number;
  results: Record<string, RoundResult>;       // slug -> result
  recordResult: (slug: string, r: RoundResult) => void;
  isComplete: (slug: string) => boolean;
  reset: () => void;
}

const Ctx = createContext<GameState | null>(null);

const KEY = "chimera_game_v1";

export function GameProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<Record<string, RoundResult>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setResults(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function persist(next: Record<string, RoundResult>) {
    setResults(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const value: GameState = {
    totalScore: Object.values(results).reduce((s, r) => s + r.score, 0),
    results,
    recordResult: (slug, r) => persist({ ...results, [slug]: r }),
    isComplete: (slug) => slug in results,
    reset: () => persist({}),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGame must be used within GameProvider");
  return v;
}
