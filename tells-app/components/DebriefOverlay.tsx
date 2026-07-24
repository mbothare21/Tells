"use client";

import Link from "next/link";
import { Icon } from "./Icon";

export interface DebriefStat {
  v: string;
  l: string;
  color?: string;
}

export interface DebriefRow {
  ok: boolean;
  title: string;
  detail: string;
  note?: string; // small monospace suffix, e.g. flags
}

export interface Consequence {
  mistake: string; // what the player actually got wrong
  impact: string; // what that would mean in a real, live system
}

export function DebriefOverlay({
  roundNum,
  headline,
  intro,
  stats,
  rows,
  learning,
  consequences,
  extra,
  onReplay,
}: {
  roundNum: number;
  headline: string;
  intro: string;
  stats: DebriefStat[];
  rows: DebriefRow[];
  learning?: React.ReactNode; // the purpose / core lesson of the round
  consequences?: Consequence[]; // shown only when the player made mistakes
  extra?: React.ReactNode; // optional round-specific learning content (e.g. a full reference)
  onReplay: () => void;
}) {
  const hasConsequences = consequences && consequences.length > 0;
  return (
    <div className="fixed inset-0 z-[100] bg-[#05070b]/70 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-panel border border-line2 rounded-[18px] max-w-[600px] w-full px-8 py-7 max-h-[90vh] overflow-y-auto my-auto">
        <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-acc">
          Debrief · Round {roundNum}
        </span>
        <h2 className="text-[22px] font-bold mt-1 mb-1.5">{headline}</h2>
        <p className="text-ink2 leading-relaxed mb-3">{intro}</p>

        <div className="flex gap-3.5 my-3.5 flex-wrap">
          {stats.map((s, i) => (
            <div key={i} className="bg-panel2 border border-line rounded-[11px] px-4 py-3.5 flex-1 min-w-[100px] text-center">
              <div className={`font-mono text-2xl font-bold ${s.color ?? ""}`}>{s.v}</div>
              <div className="text-[11px] text-ink2 uppercase tracking-wide mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-3 py-2.5 border-b border-line items-start last:border-0">
              <div className={`w-[26px] h-[26px] rounded-[7px] shrink-0 flex items-center justify-center text-[13px] ${r.ok ? "bg-ok/15 text-ok" : "bg-crit/15 text-crit"}`}>
                <Icon name={r.ok ? "check" : "x"} />
              </div>
              <div className="flex-1 text-[13px]">
                <div className="font-semibold">
                  {r.title}
                  {r.note && <span className="text-warn font-mono"> {r.note}</span>}
                </div>
                <div className="text-ink2 text-xs mt-0.5 leading-relaxed">{r.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* what your mistakes would mean in a real system */}
        {hasConsequences && (
          <div className="mt-4 rounded-xl border border-crit/40 bg-crit/5 px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-crit font-mono uppercase tracking-wide text-[10px] font-semibold mb-2">
              <Icon name="alert" /> If this were a live system
            </div>
            <div className="flex flex-col gap-2.5">
              {consequences!.map((c, i) => (
                <div key={i} className="text-[12.5px] leading-relaxed">
                  <div className="text-ink font-medium">{c.mistake}</div>
                  <div className="text-ink2">{c.impact}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* the purpose / core lesson of the round */}
        {learning && (
          <div className="mt-4 rounded-xl border border-acc/40 bg-acc/10 px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-acc font-mono uppercase tracking-wide text-[10px] font-semibold mb-1.5">
              <Icon name="bulb" /> What this round was really about
            </div>
            <p className="text-[13px] text-ink leading-relaxed">{learning}</p>
          </div>
        )}

        {extra && <div className="mt-4">{extra}</div>}

        <div className="text-center mt-5 flex gap-2.5 justify-center flex-wrap pt-4 border-t border-line">
          <button onClick={onReplay} className="text-sm px-5 py-2.5 rounded-[10px] border border-line2 text-ink hover:border-acc2">
            Run it again
          </button>
          <Link href="/" className="text-sm px-5 py-2.5 rounded-[10px] border border-line2 text-ink2 hover:border-acc2">
            All rounds
          </Link>
          <Link href="/debrief" className="text-sm px-5 py-2.5 rounded-[10px] bg-gradient-to-b from-acc to-acc2 text-[#04221d] font-semibold hover:brightness-110">
            Your results
          </Link>
        </div>
      </div>
    </div>
  );
}
