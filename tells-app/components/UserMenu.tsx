"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGame } from "@/lib/gameState";
import { upsertScore } from "@/lib/leaderboard";
import { RulesModal } from "./RulesModal";
import { Icon } from "./Icon";

export function UserMenu() {
  const { user, logout, penalty, disqualified, resetAntiCheat, justLoggedIn, ackLogin } = useAuth();
  const game = useGame();
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState(false);

  // show the rules automatically right after logging in
  useEffect(() => {
    if (justLoggedIn) {
      setRules(true);
      ackLogin();
    }
  }, [justLoggedIn, ackLogin]);

  if (!user) return null;

  const effective = Math.max(0, game.totalScore - penalty);

  function doLogout() {
    if (!confirm("Log out? This ends your run and clears its progress on this device.")) return;
    upsertScore(user!.username, user!.name, effective, disqualified);
    game.reset();
    resetAntiCheat();
    logout();
    setOpen(false);
  }

  return (
    <>
      {open && <button className="fixed inset-0 z-[89] cursor-default" aria-hidden onClick={() => setOpen(false)} />}

      <div className="no-print fixed top-2.5 right-3 z-[90]">
        <button
          onClick={() => setOpen((o) => !o)}
          title={user.name}
          className="w-9 h-9 rounded-full bg-gradient-to-b from-acc to-acc2 text-[#04221d] font-bold text-[13px] flex items-center justify-center border border-acc/40 hover:brightness-110"
        >
          {user.initials}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-[210px] bg-panel border border-line2 rounded-xl overflow-hidden shadow-xl">
            <div className="px-3.5 py-3 border-b border-line">
              <div className="text-[13px] font-semibold leading-tight">{user.name}</div>
              <div className="text-[11px] text-ink3 mt-0.5">
                {effective.toLocaleString()} pts
                {disqualified && <span className="text-danger"> · disqualified</span>}
              </div>
            </div>
            <button
              onClick={() => {
                setRules(true);
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 text-[13px] text-ink2 hover:bg-panel2 hover:text-ink flex items-center gap-2"
            >
              <Icon name="bulb" /> View rules
            </button>
            <button
              onClick={doLogout}
              className="w-full text-left px-3.5 py-2.5 text-[13px] text-ink2 hover:bg-panel2 hover:text-danger flex items-center gap-2 border-t border-line"
            >
              <Icon name="arrow" /> Log out
            </button>
          </div>
        )}
      </div>

      {rules && <RulesModal onClose={() => setRules(false)} />}
    </>
  );
}
