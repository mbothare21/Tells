"use client";

import { ROUNDS } from "@/lib/rounds";
import { Icon } from "./Icon";

interface IntroProps {
  roundNum: number;
  title: string;
  lines: string[]; // 1-2 short paragraphs of scenario, no spoilers
  objective?: string; // one clear sentence: what you're trying to achieve
  instructions?: string[]; // detailed, numbered "how to play" steps
  howto?: string; // legacy single quiet how-to line (used if instructions absent)
  onStart: () => void;
  startLabel?: string;
}

export function IntroOverlay({
  roundNum,
  title,
  lines,
  objective,
  instructions,
  howto,
  onStart,
  startLabel = "Start",
}: IntroProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#05070b]/90 backdrop-blur flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-panel border border-line2 rounded-[18px] max-w-[560px] w-full px-8 py-8 my-auto max-h-[92vh] overflow-y-auto">
        <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-acc">
          Round {roundNum} of {ROUNDS.length}
        </span>
        <h1 className="text-[28px] font-bold tracking-tight mt-1.5 mb-2">{title}</h1>

        {lines.map((l, i) => (
          <p key={i} className="text-ink2 leading-relaxed mb-3">
            {l}
          </p>
        ))}

        {objective && (
          <div className="rounded-xl border border-acc/40 bg-acc/10 px-4 py-3 my-4">
            <div className="flex items-center gap-1.5 text-acc font-mono uppercase tracking-wide text-[10px] font-semibold mb-1">
              <Icon name="shield" /> Your objective
            </div>
            <p className="text-[13.5px] text-ink leading-relaxed">{objective}</p>
          </div>
        )}

        {instructions && instructions.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] font-mono uppercase tracking-wide text-ink3 mb-2">How to play</div>
            <ol className="flex flex-col gap-2">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-ink2 leading-snug">
                  <span className="shrink-0 w-[18px] h-[18px] rounded-full bg-panel2 border border-line2 text-ink flex items-center justify-center text-[10px] font-bold mt-px">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!instructions && howto && <p className="text-ink3 text-[13px] leading-relaxed mb-5">{howto}</p>}

        <div className="text-center">
          <button
            onClick={onStart}
            className="text-[15px] font-bold px-7 py-3 rounded-xl bg-gradient-to-b from-acc to-acc2 text-[#04221d] hover:brightness-110"
          >
            {startLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
