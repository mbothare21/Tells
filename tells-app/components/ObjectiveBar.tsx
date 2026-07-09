"use client";

import { Icon } from "./Icon";

/**
 * A clear, detailed statement of what the player is trying to do this round.
 * `goal` = what to do; `scoring` = how it's judged / what to watch for.
 * `right` = optional slot (e.g. a step tracker). `maxW` matches the round's content width.
 */
export function ObjectiveBar({
  goal,
  scoring,
  right,
  maxW = "max-w-[860px]",
}: {
  goal: React.ReactNode;
  scoring?: React.ReactNode;
  right?: React.ReactNode;
  maxW?: string;
}) {
  return (
    <div className="border-b border-line bg-panel2/50 px-4 py-2.5">
      <div className={`${maxW} mx-auto`}>
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
          <div className="flex items-start gap-2 flex-1 min-w-[280px]">
            <span className="shrink-0 mt-px inline-flex items-center gap-1 text-acc font-mono uppercase tracking-wide text-[10px] font-semibold border border-acc/40 rounded px-1.5 py-0.5">
              <Icon name="shield" /> Objective
            </span>
            <span className="text-[12.5px] leading-snug text-ink2">{goal}</span>
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
        {scoring && <div className="text-[11.5px] text-ink3 leading-snug mt-1.5">{scoring}</div>}
      </div>
    </div>
  );
}
