"use client";

import { useRef, useState } from "react";
import { useGame } from "@/lib/gameState";
import { useCountdown } from "@/lib/useCountdown";
import { HudBar } from "@/components/HudBar";
import { IntroOverlay } from "@/components/IntroOverlay";
import { DebriefOverlay } from "@/components/DebriefOverlay";
import { ObjectiveBar } from "@/components/ObjectiveBar";
import { Hints } from "@/components/Hints";
import { timeBonus } from "@/lib/config";

const ROUND_SECONDS = 150;

const HINTS = [
  "This round is about how automated decisions fail: unfair bias, no explanation a person can contest, or using data without consent.",
  "Bias often hides in a proxy like postal code. “No explanation” means even staff can't say why. “Privacy” means data used for a purpose it wasn't consented for.",
];
type Phase = "intro" | "play" | "debrief";

interface Case { id: string; area: string; text: string; answer: string; why: string; }

const OPTIONS: [string, string][] = [
  ["bias", "Unfair bias"],
  ["explain", "No explanation given"],
  ["privacy", "Privacy violation"],
];

const CASES: Case[] = [
  { id: "k1", area: "Hiring", answer: "bias",
    text: "The hiring tool rejected applicants from one postal code five times more often than others. It was trained mostly on past hires, who came from wealthier areas. No protected detail was used directly.",
    why: "Postal code stood in for income and background — the tool discriminated indirectly, even without using a protected attribute." },
  { id: "k2", area: "Lending", answer: "explain",
    text: 'A loan was declined. When the customer asked why, the only answer the system could give was "score below threshold (0.41)". Neither the staff member nor the customer could find out what drove the decision.',
    why: "A decision that affects someone's life with no reasons they can see or challenge — it can't be explained or contested." },
  { id: "k3", area: "Healthcare", answer: "privacy",
    text: "To decide who to prioritise for care, the system pulled in patients' shopping and browsing history bought from a data broker — information they never agreed to share for medical use.",
    why: "Personal data was reused for a purpose the person never consented to, with no lawful basis." },
];

export default function Round4() {
  const game = useGame();
  const [phase, setPhase] = useState<Phase>("intro");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [bonus, setBonus] = useState(0);
  // refs mirror state so finish() never records a stale score/picks after the last answer
  const scoreRef = useRef(0);
  const picksRef = useRef<Record<string, string>>({});
  const recorded = useRef(false);
  const { timeLeft, timeLeftRef, reset } = useCountdown(ROUND_SECONDS, phase === "play", () => finish());

  function start() {
    setPhase("play");
    setPicks({});
    setScore(0);
    setBonus(0);
    scoreRef.current = 0;
    picksRef.current = {};
    recorded.current = false;
    reset(ROUND_SECONDS);
  }

  function spendHint(cost: number) {
    scoreRef.current = Math.max(0, scoreRef.current - cost);
    setScore(scoreRef.current);
  }

  function pick(cid: string, v: string) {
    if (picksRef.current[cid]) return; // lock first answer for fair scoring
    const c = CASES.find((x) => x.id === cid)!;
    const correct = v === c.answer;
    picksRef.current = { ...picksRef.current, [cid]: v };
    setPicks(picksRef.current);
    if (correct) {
      scoreRef.current += 250;
      setScore(scoreRef.current);
    }
    if (Object.keys(picksRef.current).length === CASES.length) setTimeout(() => finish(), 600);
  }

  function finish() {
    if (recorded.current) return;
    recorded.current = true;
    const answered = Object.keys(picksRef.current).length;
    const correct = CASES.filter((c) => picksRef.current[c.id] === c.answer).length;
    const tb = timeBonus(timeLeftRef.current);
    scoreRef.current += tb;
    setScore(scoreRef.current);
    setBonus(tb);
    game.recordResult("round-4", {
      score: scoreRef.current,
      correct,
      total: CASES.length,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
      breaches: 0,
      flagsCaptured: correct,
      flagsTotal: CASES.length,
    });
    setPhase("debrief");
  }

  if (phase === "intro")
    return (
      <IntroOverlay roundNum={4} title="The review board"
        lines={[
          "Three automated decisions got flagged for a human to review. Each one was made by a system, and each one has a problem.",
          "Read each case and say what went wrong.",
        ]}
        objective="You're the human check. For each decision, pick the one governance failure that explains it — unfair bias, no explanation, or a privacy violation."
        instructions={[
          "Read the case — what the system decided, and how it got there.",
          "Pick the one failure that fits best: unfair bias, no explanation, or a privacy violation.",
          "Your first answer locks in — read the whole case before you choose.",
        ]}
        compete="+250 for each correct diagnosis, plus bonus points for the time left when you finish — fastest correct players top the leaderboard."
        onStart={start} startLabel="Start" />
    );

  if (phase === "debrief") {
    const correct = CASES.filter((c) => picks[c.id] === c.answer).length;
    const wrong = CASES.length - correct;
    const consequences: { mistake: string; impact: string }[] = [];
    if (wrong > 0)
      consequences.push({
        mistake: `You mis-identified what went wrong in ${wrong} case${wrong > 1 ? "s" : ""}.`,
        impact:
          "Misdiagnosing an automated decision means the real failure — biased hiring, a loan denial nobody can explain, or medical data used without consent — goes unaddressed and keeps harming the people subject to it.",
      });
    return (
      <DebriefOverlay roundNum={4}
        headline={correct === CASES.length ? "All correct" : `${correct} of ${CASES.length} correct`}
        intro="Knowing why an automated decision is unfair, unexplained, or invasive is the first step to fixing it."
        stats={[
          { v: String(score), l: "score", color: "text-acc" },
          { v: `+${bonus}`, l: "time bonus", color: "text-ok" },
          { v: `${correct}/${CASES.length}`, l: "correct", color: correct === CASES.length ? "text-ok" : "text-warn" },
        ]}
        rows={CASES.map((c) => ({
          ok: picks[c.id] === c.answer,
          title: `${c.area} — ${OPTIONS.find((o) => o[0] === c.answer)![1]}`,
          detail: c.why,
        }))}
        learning="Automated decisions fail in specific, recognisable ways: they can be unfair (bias), unaccountable (no explanation a person can contest), or invasive (data used without consent). Naming the failure correctly is what turns “the computer said no” into something a human can challenge and fix."
        consequences={consequences}
        onReplay={start} />
    );
  }

  return (
    <div className="game-surface flex flex-col h-screen max-w-[1180px] mx-auto">
      <HudBar roundName="The review board" timeLeft={timeLeft} totalSeconds={ROUND_SECONDS} score={score} hint={<Hints hints={HINTS} onSpend={spendHint} />} />
      <ObjectiveBar
        maxW="max-w-[760px]"
        goal={
          <>
            Three automated decisions were flagged for human review. Read each case and tag it with the single
            governance failure that best explains what went wrong — <b className="text-ink">unfair bias</b>,{" "}
            <b className="text-ink">no explanation</b>, or a <b className="text-ink">privacy violation</b>.
          </>
        }
        scoring={
          <>
            <b className="text-ok">+250</b> per correct call. Your first answer locks in — read the whole case before you
            choose.
          </>
        }
      />
      <div className="flex-1 overflow-y-auto px-5 py-5 max-w-[760px] mx-auto w-full">
        {CASES.map((c, i) => {
          const picked = picks[c.id];
          return (
            <div key={c.id} className="bg-panel2 border border-line rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <b className="text-sm">Case {i + 1}</b>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-line2 text-info">{c.area}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-ink mb-3">{c.text}</p>
              <div className="flex gap-2 flex-wrap">
                {OPTIONS.map(([v, l]) => {
                  const chosen = picked === v;
                  const right = picked && v === c.answer;
                  const wrong = chosen && v !== c.answer;
                  return (
                    <button key={v} onClick={() => pick(c.id, v)} disabled={!!picked}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition disabled:cursor-default
                        ${right ? "border-ok bg-ok/15 text-ok" : wrong ? "border-danger bg-danger/15 text-danger" : chosen ? "border-acc" : "border-line2 hover:border-acc2 text-ink2"}`}>{l}</button>
                  );
                })}
              </div>
              {picked && <div className="text-xs text-ink2 mt-2.5 border-l-2 border-info/50 pl-2.5">{c.why}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
