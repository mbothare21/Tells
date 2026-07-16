"use client";

import { GAME_TITLE } from "@/lib/config";

export function HudBar({
  roundName,
  timeLeft,
  totalSeconds,
  score,
  extra,
}: {
  roundName: string;
  timeLeft: number;
  totalSeconds: number;
  score: number;
  extra?: React.ReactNode;
}) {
  const mm = Math.floor(timeLeft / 60);
  const ss = timeLeft % 60;
  const frac = totalSeconds ? timeLeft / totalSeconds : 0;
  return (
    <div className="flex items-center gap-4 pl-[92px] pr-16 py-3 border-b border-line bg-panel2/70 backdrop-blur">
      <div className="flex items-center gap-2 font-semibold tracking-wide text-[13px]">
        <span className="w-2 h-2 rounded-full bg-acc" style={{ boxShadow: "0 0 10px #37e0c4" }} />
        <span className="font-mono uppercase">{GAME_TITLE}</span>
        <span className="text-ink3 font-normal normal-case">· {roundName}</span>
      </div>
      <div className="flex-1" />
      {extra}
      <div className="min-w-[150px]">
        <div className="flex justify-between text-[10px] tracking-wide uppercase text-ink2 mb-1">
          <span>Time</span>
          <b className="font-mono text-ink">{mm}:{ss < 10 ? "0" : ""}{ss}</b>
        </div>
        <div className="h-[7px] rounded bg-[#10151f] border border-line overflow-hidden w-[150px]">
          <div className="h-full transition-all"
            style={{
              width: `${frac * 100}%`,
              background: frac < 0.25 ? "linear-gradient(90deg,#ff5d57,#f5b84a)" : "linear-gradient(90deg,#5aa2f5,#37e0c4)",
            }} />
        </div>
      </div>
      <div className="flex flex-col items-center min-w-[64px]">
        <span className="font-mono text-xl font-bold text-acc">{score}</span>
        <span className="text-[9px] tracking-wide uppercase text-ink2">score</span>
      </div>
    </div>
  );
}
