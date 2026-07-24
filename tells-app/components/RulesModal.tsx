"use client";

import { TAB_PENALTY, DQ_LIMIT } from "@/lib/auth";
import { TIME_BONUS_PER_SEC, TIME_BONUS_CAP } from "@/lib/config";
import { Icon } from "./Icon";

const SCORING: { round: string; name: string; plus: string; minus: string }[] = [
  { round: "1", name: "Assistant's inbox", plus: "+200 correct call", minus: "−250 approve an attack · −100 block a genuine message" },
  { round: "2", name: "Data gate", plus: "+250 per system (+150 first try)", minus: "−80 wrong controls" },
  { round: "3", name: "Face value", plus: "honest “can't tell” scores highest · later tests worth more", minus: "right flag / wrong reason = half · wrong flag costs" },
  { round: "4", name: "Review board", plus: "+250 per correct diagnosis", minus: "—" },
];

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] bg-[#05070b]/70 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-panel border border-line2 rounded-[18px] max-w-[620px] w-full px-7 py-7 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-acc">The rules</span>
          <button onClick={onClose} className="text-ink3 hover:text-ink" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <h2 className="text-[22px] font-bold mb-4">How the game works</h2>

        {/* At a glance */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <Stat value="4" label="rounds, in order" />
          <Stat value={<><span className="text-ok">+{TIME_BONUS_PER_SEC}</span>/sec</>} label={`speed bonus (max +${TIME_BONUS_CAP})`} />
          <Stat value={<span className="text-danger">−{TAB_PENALTY}</span>} label="per tab switch" />
        </div>

        {/* Scoring table */}
        <div className="rounded-xl border border-line2 overflow-hidden mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-acc px-4 py-2.5 bg-panel2/50 border-b border-line2">
            <Icon name="check" /> Scoring — how each round pays out
          </div>
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="text-ink3 text-[10px] font-mono uppercase tracking-wide">
                <th className="text-left font-medium px-4 py-1.5 w-[34%]">Round</th>
                <th className="text-left font-medium px-2 py-1.5">
                  <span className="text-ok">Earns points</span>
                </th>
                <th className="text-left font-medium px-2 py-1.5 pr-4">
                  <span className="text-danger">Costs points</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {SCORING.map((r) => (
                <tr key={r.round} className="border-t border-line align-top">
                  <td className="px-4 py-2.5">
                    <span className="text-ink3 font-mono text-[11px]">R{r.round}</span>{" "}
                    <span className="text-ink font-semibold">{r.name}</span>
                  </td>
                  <td className="px-2 py-2.5 text-ink2 leading-snug">{r.plus}</td>
                  <td className="px-2 py-2.5 pr-4 text-ink2 leading-snug">{r.minus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-ink3 text-[12px] leading-relaxed mb-3">
          Each round is <b className="text-ink2">timed</b> — when the clock runs out the round ends and scores what you have.
          Finish faster and the time left becomes points, so being <b className="text-ink2">fast and right</b> wins. Your total is the sum across all four rounds.
        </p>

        {/* Penalties */}
        <div className="rounded-xl border border-crit/40 bg-crit/5 px-4 py-3 mb-1">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-crit mb-2">
            <Icon name="alert" /> Stay in the game
          </div>
          <div className="flex flex-col gap-1.5 text-[12.5px] text-ink2 leading-relaxed">
            <div className="flex gap-2">
              <span className="text-danger font-semibold shrink-0">−{TAB_PENALTY}</span>
              <span>every time you leave the game tab mid-round — switching tabs, minimising, or moving to another window is recorded.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-danger font-semibold shrink-0">{DQ_LIMIT}×</span>
              <span>tab switches and you&rsquo;re <b className="text-danger">disqualified</b> — no more rounds.</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-5 pt-4 border-t border-line">
          <button
            onClick={onClose}
            className="text-sm font-semibold px-6 py-2.5 rounded-[10px] bg-gradient-to-b from-acc to-acc2 text-[#04221d] hover:brightness-110"
          >
            Got it — let&rsquo;s go
          </button>
          <p className="text-ink3 text-[11.5px] mt-3">
            Reopen these rules any time from your initials in the top-right corner.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-line2 bg-panel2/50 px-3 py-2.5 text-center">
      <div className="text-[18px] font-bold leading-none mb-1">{value}</div>
      <div className="text-ink3 text-[10.5px] leading-tight">{label}</div>
    </div>
  );
}
