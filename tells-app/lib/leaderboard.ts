"use client";

export interface LBEntry {
  name: string;
  score: number;
  dq?: boolean;
  you?: boolean;
}

const LKEY = "tells_leaderboard_v1";

// A few seeded competitors so the board looks alive in a demo. Real players (this
// device's logins) are persisted on top and override any seed with the same name.
const SEED: { name: string; score: number }[] = [
  { name: "Priya N.", score: 3120 },
  { name: "Marco V.", score: 2870 },
  { name: "Dana K.", score: 2610 },
  { name: "Lee T.", score: 1990 },
  { name: "Robin A.", score: 1450 },
];

type Store = Record<string, { name: string; score: number; dq?: boolean }>;

function read(): Store {
  try {
    const r = localStorage.getItem(LKEY);
    return r ? JSON.parse(r) : {};
  } catch {
    return {};
  }
}

export function upsertScore(username: string, name: string, score: number, dq: boolean) {
  const s = read();
  s[username] = { name, score, dq };
  try {
    localStorage.setItem(LKEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function getLeaderboard(
  current: { username: string; name: string; score: number; dq: boolean } | null
): LBEntry[] {
  const byName: Record<string, LBEntry> = {};
  for (const s of SEED) byName[s.name] = { name: s.name, score: s.score };
  const stored = read();
  for (const k of Object.keys(stored)) {
    const e = stored[k];
    byName[e.name] = { name: e.name, score: e.score, dq: e.dq };
  }
  if (current) byName[current.name] = { name: current.name, score: current.score, dq: current.dq, you: true };
  return Object.values(byName).sort((a, b) => (b.dq ? -1 : b.score) - (a.dq ? -1 : a.score));
}
