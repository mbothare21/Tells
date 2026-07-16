"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

export interface SessionUser {
  username: string;
  name: string;
  initials: string;
}

// Temporary demo credentials. Swap for a real auth backend before any live event.
const CREDENTIALS: Record<string, { password: string; name: string }> = {
  alex: { password: "tells2026", name: "Alex Rivera" },
  sam: { password: "tells2026", name: "Sam Chen" },
  jordan: { password: "tells2026", name: "Jordan Lee" },
  priya: { password: "tells2026", name: "Priya Nair" },
  admin: { password: "tells2026", name: "Admin" },
};

export const TAB_PENALTY = 150; // points lost per tab switch during a round
export const DQ_LIMIT = 3; // tab switches before disqualification

interface AuthState {
  ready: boolean;
  user: SessionUser | null;
  login: (username: string, password: string) => string | null; // returns error, or null on success
  logout: () => void;
  tabSwitches: number;
  penalty: number;
  disqualified: boolean;
  registerTabSwitch: () => void;
  resetAntiCheat: () => void;
  justLoggedIn: boolean; // true only right after an actual login (not a restore) — used to auto-show the rules
  ackLogin: () => void;
}

const Ctx = createContext<AuthState | null>(null);
const UKEY = "tells_user_v1";
const AKEY = "tells_anticheat_v1";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [disqualified, setDisqualified] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const anti = useRef({ tabSwitches: 0, penalty: 0, disqualified: false });

  useEffect(() => {
    try {
      const u = localStorage.getItem(UKEY);
      if (u) setUser(JSON.parse(u));
      const a = localStorage.getItem(AKEY);
      if (a) {
        const p = JSON.parse(a);
        anti.current = {
          tabSwitches: p.tabSwitches || 0,
          penalty: p.penalty || 0,
          disqualified: !!p.disqualified,
        };
        setTabSwitches(anti.current.tabSwitches);
        setPenalty(anti.current.penalty);
        setDisqualified(anti.current.disqualified);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function persistAnti() {
    try {
      localStorage.setItem(AKEY, JSON.stringify(anti.current));
    } catch {
      /* ignore */
    }
  }

  function login(username: string, password: string): string | null {
    const key = username.trim().toLowerCase();
    const rec = CREDENTIALS[key];
    if (!rec || rec.password !== password) return "Incorrect username or password.";
    const su: SessionUser = { username: key, name: rec.name, initials: initialsOf(rec.name) };
    setUser(su);
    setJustLoggedIn(true);
    try {
      localStorage.setItem(UKEY, JSON.stringify(su));
    } catch {
      /* ignore */
    }
    return null;
  }

  function logout() {
    setUser(null);
    try {
      localStorage.removeItem(UKEY);
    } catch {
      /* ignore */
    }
  }

  function resetAntiCheat() {
    anti.current = { tabSwitches: 0, penalty: 0, disqualified: false };
    setTabSwitches(0);
    setPenalty(0);
    setDisqualified(false);
    persistAnti();
  }

  function registerTabSwitch() {
    if (anti.current.disqualified) return;
    anti.current.tabSwitches += 1;
    anti.current.penalty += TAB_PENALTY;
    if (anti.current.tabSwitches >= DQ_LIMIT) anti.current.disqualified = true;
    setTabSwitches(anti.current.tabSwitches);
    setPenalty(anti.current.penalty);
    setDisqualified(anti.current.disqualified);
    persistAnti();
  }

  return (
    <Ctx.Provider
      value={{
        ready,
        user,
        login,
        logout,
        tabSwitches,
        penalty,
        disqualified,
        registerTabSwitch,
        resetAntiCheat,
        justLoggedIn,
        ackLogin: () => setJustLoggedIn(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
