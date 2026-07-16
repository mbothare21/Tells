"use client";

import { useState } from "react";
import { HINT_COST } from "@/lib/config";
import { Icon } from "./Icon";

/**
 * Hint button for the HUD. The first hint (hints[0]) explains the round's theme and is
 * free; each further hint helps you clear the round and costs points via onSpend().
 */
export function Hints({ hints, onSpend }: { hints: string[]; onSpend: (cost: number) => void }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(0); // number of hints revealed

  function toggle() {
    if (!open) {
      setOpen(true);
      if (level === 0) setLevel(1); // first open reveals the free theme hint
    } else {
      setOpen(false);
    }
  }

  function revealNext() {
    if (level >= hints.length) return;
    onSpend(HINT_COST); // hints beyond the first cost points
    setLevel(level + 1);
  }

  const more = level < hints.length;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        title="Hints"
        className={`inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg border transition ${
          open ? "border-acc2 text-ink" : "border-line2 text-ink2 hover:border-acc2 hover:text-ink"
        }`}
      >
        <Icon name="bulb" /> Hint
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-[94] cursor-default" aria-hidden onClick={() => setOpen(false)} />
          <div className="fixed top-14 right-4 w-[290px] z-[95] bg-panel border border-line2 rounded-xl shadow-xl overflow-hidden">
            <div className="px-3.5 py-2 border-b border-line flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-acc">
              <Icon name="bulb" /> Hints
            </div>
            <div className="px-3.5 py-3 flex flex-col gap-2.5 max-h-[280px] overflow-y-auto">
              {hints.slice(0, level).map((h, i) => (
                <div key={i} className="text-[12.5px] leading-relaxed text-ink2">
                  <span className="text-[9.5px] font-mono uppercase tracking-wide text-ink3 mr-1.5">
                    {i === 0 ? "theme" : `hint ${i}`}
                  </span>
                  {h}
                </div>
              ))}
            </div>
            <div className="px-3.5 py-2.5 border-t border-line">
              {more ? (
                <button
                  onClick={revealNext}
                  className="w-full text-[12px] font-semibold py-2 rounded-lg border border-line2 hover:border-acc2 text-ink2 hover:text-ink inline-flex items-center justify-center gap-1.5"
                >
                  <Icon name="plus" /> Reveal a hint · <span className="text-danger">−{HINT_COST} pts</span>
                </button>
              ) : (
                <div className="text-[11px] text-ink3 text-center">No more hints for this round.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
