"use client";

import { TAB_PENALTY, DQ_LIMIT } from "@/lib/auth";
import { Icon } from "./Icon";

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] bg-[#05070b]/70 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-panel border border-line2 rounded-[18px] max-w-[560px] w-full px-7 py-7 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-acc">The rules</span>
          <button onClick={onClose} className="text-ink3 hover:text-ink" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <h2 className="text-[22px] font-bold mb-4">How the game works</h2>

        <Section icon="shield" title="Getting through the rounds">
          <li>Four rounds, played in order. Finish one to unlock the next — the rest stay locked.</li>
          <li>Each round is timed. When the clock runs out, the round ends and scores what you have so far.</li>
        </Section>

        <Section icon="check" title="Scoring">
          <li><b className="text-ink">Round 1 — Assistant&rsquo;s inbox:</b> +200 for a correct call; −250 for approving an attack (it runs); −100 for blocking a genuine message.</li>
          <li><b className="text-ink">Round 2 — Data gate:</b> +250 per system secured (+150 if you get it first try); −80 each time you open the gate on the wrong controls.</li>
          <li><b className="text-ink">Round 3 — Face value:</b> three tests, later ones worth more. Honest &ldquo;can&rsquo;t tell&rdquo; scores highest where it fits; a right flag with the wrong reason scores half; wrong flags cost points.</li>
          <li><b className="text-ink">Round 4 — Review board:</b> +250 for each correct diagnosis.</li>
          <li>Your total is the sum across all rounds. Being fast <i>and</i> right wins.</li>
        </Section>

        <Section icon="alert" title="Staying in the game" tone="crit">
          <li>Rounds are monitored. Leaving the game tab during a round — switching tabs, minimising, or moving to another window — is recorded.</li>
          <li>Each tab switch costs <b className="text-danger">−{TAB_PENALTY} points</b>.</li>
          <li>After <b className="text-danger">{DQ_LIMIT} tab switches</b> you are <b className="text-danger">disqualified</b> and can&rsquo;t continue.</li>
        </Section>

        <div className="text-center mt-5 pt-4 border-t border-line">
          <button
            onClick={onClose}
            className="text-sm font-semibold px-6 py-2.5 rounded-[10px] bg-gradient-to-b from-acc to-acc2 text-[#04221d] hover:brightness-110"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  tone,
  children,
}: {
  icon: string;
  title: string;
  tone?: "crit";
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 mb-3 ${tone === "crit" ? "border-crit/40 bg-crit/5" : "border-line2 bg-panel2/50"}`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide mb-2 ${tone === "crit" ? "text-crit" : "text-acc"}`}>
        <Icon name={icon} /> {title}
      </div>
      <ul className="flex flex-col gap-1.5 text-[12.5px] text-ink2 leading-relaxed list-disc pl-4 marker:text-ink3">
        {children}
      </ul>
    </div>
  );
}
