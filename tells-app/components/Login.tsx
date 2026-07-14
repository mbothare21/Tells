"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { GAME_TITLE, GAME_TAGLINE } from "@/lib/config";
import { Icon } from "./Icon";

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const msg = login(username, password);
    setErr(msg);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-[380px] bg-panel/90 backdrop-blur-sm border border-line2 rounded-2xl px-7 py-8">
        <div className="text-center mb-6">
          <span className="inline-flex w-12 h-12 rounded-xl bg-panel2 border border-line2 items-center justify-center text-acc text-xl">
            <Icon name="flag" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-3">{GAME_TITLE}</h1>
          <p className="text-ink2 text-[13px] mt-1">{GAME_TAGLINE}</p>
        </div>

        <label className="block text-[12px] text-ink2 mb-1.5">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
          className="w-full mb-3.5 px-3 py-2.5 rounded-lg border border-line2 bg-panel2 text-ink text-sm outline-none focus:border-acc2 placeholder:text-ink3"
          placeholder="e.g. alex"
        />

        <label className="block text-[12px] text-ink2 mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full mb-4 px-3 py-2.5 rounded-lg border border-line2 bg-panel2 text-ink text-sm outline-none focus:border-acc2 placeholder:text-ink3"
          placeholder="••••••••"
        />

        {err && <div className="text-danger text-xs mb-3">{err}</div>}

        <button
          type="submit"
          className="w-full text-[15px] font-bold py-3 rounded-xl bg-gradient-to-b from-acc to-acc2 text-[#04221d] hover:brightness-110"
        >
          Log in
        </button>

        <p className="text-ink3 text-[11px] mt-5 text-center leading-relaxed">
          Demo access — username <b className="text-ink2">alex</b> · password <b className="text-ink2">tells2026</b>
        </p>
      </form>
    </main>
  );
}
